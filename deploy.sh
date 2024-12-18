#!/bin/bash

# Konfigurasi
BUCKET_NAME="diabetes-prediction-app-2024"
LAMBDA_FUNCTION="diabetes-prediction-lambda"
API_NAME="diabetes-prediction-api"

echo "Starting deployment process..."

# 1. Deploy Frontend ke S3
echo "Deploying frontend to S3..."
aws s3 sync . s3://$BUCKET_NAME \
    --exclude ".git/*" \
    --exclude "*.sh" \
    --exclude "README.md" \
    --exclude "server.py" \
    --exclude "tests/*" \
    --exclude "__pycache__/*" \
    --exclude "*.pyc"

# 2. Set bucket policy untuk static website hosting
echo "Configuring S3 bucket for static website hosting..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*"
        }
    ]
}'

aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document error.html

# 3. Deploy Lambda Function
echo "Deploying Lambda function..."
zip -r lambda.zip lambda_function.py
aws lambda update-function-code --function-name $LAMBDA_FUNCTION --zip-file fileb://lambda.zip
rm lambda.zip

# 4. Update API Gateway
echo "Updating API Gateway..."
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text)

if [ -z "$API_ID" ]; then
    echo "Creating new API Gateway..."
    API_ID=$(aws apigateway create-rest-api --name $API_NAME --query 'id' --output text)
fi

# 5. Enable CORS
echo "Enabling CORS..."
aws apigateway update-integration-response \
    --rest-api-id $API_ID \
    --resource-id "/*" \
    --http-method POST \
    --status-code 200 \
    --patch-operations \
    op=add,path='/responseParameters/method.response.header.Access-Control-Allow-Origin',value="'*'"

# 6. Deploy API
echo "Deploying API..."
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$(aws configure get region).amazonaws.com"
API_URL="https://$API_ID.execute-api.$(aws configure get region).amazonaws.com/prod"

echo "Deployment complete!"
echo "Website URL: $WEBSITE_URL"
echo "API URL: $API_URL"
