# Konfigurasi
$BUCKET_NAME = "diabetes-prediction-app-2024"
$LAMBDA_FUNCTION = "diabetes-prediction-lambda"
$API_NAME = "diabetes-prediction-api"

Write-Host "Starting deployment process..."

# 1. Deploy Frontend ke S3
Write-Host "Deploying frontend to S3..."
aws s3 sync . "s3://$BUCKET_NAME" `
    --exclude ".git/*" `
    --exclude "*.sh" `
    --exclude "*.ps1" `
    --exclude "README.md" `
    --exclude "server.py" `
    --exclude "tests/*" `
    --exclude "__pycache__/*" `
    --exclude "*.pyc"

# 2. Set bucket policy untuk static website hosting
Write-Host "Configuring S3 bucket for static website hosting..."
$policy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
"@

$policy | aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///dev/stdin

aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document error.html

# 3. Deploy Lambda Function
Write-Host "Deploying Lambda function..."
Compress-Archive -Path lambda_function.py -DestinationPath lambda.zip -Force
aws lambda update-function-code --function-name $LAMBDA_FUNCTION --zip-file fileb://lambda.zip
Remove-Item lambda.zip

# 4. Update API Gateway
Write-Host "Updating API Gateway..."
$API_ID = aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text

if ([string]::IsNullOrEmpty($API_ID)) {
    Write-Host "Creating new API Gateway..."
    $API_ID = aws apigateway create-rest-api --name $API_NAME --query 'id' --output text
}

# 5. Enable CORS
Write-Host "Enabling CORS..."
aws apigateway update-integration-response `
    --rest-api-id $API_ID `
    --resource-id "/*" `
    --http-method POST `
    --status-code 200 `
    --patch-operations `
    op=add,path='/responseParameters/method.response.header.Access-Control-Allow-Origin',value="'*'"

# 6. Deploy API
Write-Host "Deploying API..."
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod

# Get website URL
$REGION = aws configure get region
$WEBSITE_URL = "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
$API_URL = "https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

Write-Host "Deployment complete!"
Write-Host "Website URL: $WEBSITE_URL"
Write-Host "API URL: $API_URL"
