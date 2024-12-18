import json
import boto3
from decimal import Decimal
import logging
import os
from datetime import datetime
import traceback
from bedrock_helper import get_bedrock_prediction
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer
import time

# Konfigurasi logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Allowed origins for CORS
ALLOWED_ORIGINS = [
    'https://ventixcareku.my.id',
    'https://dg52nuiagley4.cloudfront.net',
    'http://localhost:5500'
]

# DynamoDB helpers
serializer = TypeSerializer()
deserializer = TypeDeserializer()

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)

def get_cors_headers(event):
    """Get CORS headers based on origin"""
    origin = event.get('headers', {}).get('origin', '')
    if not origin:
        origin = event.get('headers', {}).get('Origin', '')
    
    allowed_origin = origin if origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]
    
    return {
        'Access-Control-Allow-Origin': allowed_origin,
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,Origin',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Credentials': 'true'
    }

def log_request(event, context):
    """Log informasi request"""
    request_id = context.aws_request_id
    logger.info(f"Request ID: {request_id}")
    logger.info(f"Event: {json.dumps(event)}")
    logger.info(f"Context: {vars(context)}")
    return request_id

def validate_input(data):
    """Validasi input data"""
    required_fields = ['nama', 'usia', 'beratBadan', 'tinggiBadan', 'tekananDarah', 
                      'gulaDarah', 'riwayatKeluarga', 'olahraga']
    
    logger.info(f"Validating input data: {json.dumps(data)}")
    
    # Cek field yang required
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field}")
            raise ValueError(f"Field {field} harus diisi")
        if data[field] is None or str(data[field]).strip() == '':
            logger.error(f"Empty value for required field: {field}")
            raise ValueError(f"Field {field} tidak boleh kosong")
        
    # Validasi tipe data dan range
    try:
        validations = {
            'usia': (int, 0, 120),
            'beratBadan': (float, 20, 300),
            'tinggiBadan': (float, 100, 250),
            'gulaDarah': (float, 50, 500)
        }
        
        for field, (type_func, min_val, max_val) in validations.items():
            try:
                value = type_func(data[field])
                if not min_val <= value <= max_val:
                    logger.error(f"Invalid value for {field}: {value} (should be between {min_val} and {max_val})")
                    raise ValueError(f"Nilai {field} harus antara {min_val} dan {max_val}")
                
                data[field] = value
            except (ValueError, TypeError) as e:
                logger.error(f"Invalid type for {field}: {data[field]} (should be {type_func.__name__})")
                raise ValueError(f"Format {field} tidak valid")
                
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise
    
    logger.info("Input validation successful")
    return data

def calculate_bmi(weight, height):
    """Hitung BMI"""
    # Convert height from cm to m
    height_m = height / 100
    bmi = weight / (height_m * height_m)
    return round(bmi, 2)

def parse_blood_pressure(bp_string):
    """Parse tekanan darah string ke systolic dan diastolic"""
    try:
        systolic, diastolic = map(int, bp_string.split('/'))
        return systolic, diastolic
    except:
        logger.error(f"Invalid blood pressure format: {bp_string}")
        raise ValueError("Format tekanan darah tidak valid. Gunakan format 'systolic/diastolic' (contoh: 120/80)")

def predict_diabetes_risk(data):
    try:
        # Set timeout for Bedrock calls
        timeout = 10  # seconds
        
        start_time = time.time()
        bedrock_response = get_bedrock_prediction(data)
        
        if time.time() - start_time > timeout:
            logger.error(f"Bedrock prediction timeout after {timeout} seconds")
            raise TimeoutError("Model prediction timeout")
            
        if not bedrock_response or 'predictions' not in bedrock_response:
            logger.error("Invalid response from Bedrock")
            raise ValueError("Invalid model response")
            
        return bedrock_response['predictions']
        
    except TimeoutError as e:
        logger.error(f"Timeout error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error in predict_diabetes_risk: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise

def convert_to_dynamodb_item(data):
    """Convert Python dict to DynamoDB item format"""
    try:
        # Log raw data
        logger.info(f"Raw data received: {json.dumps(data, default=str)}")
        
        # Helper function untuk konversi ke number
        def safe_number(value, default=0):
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default

        # Extract and validate predictionId
        prediction_id = data.get('predictionId')
        if isinstance(prediction_id, dict):
            prediction_id = prediction_id.get('S', '')
        prediction_id = str(prediction_id or '')
        logger.info(f"PredictionId after conversion: {prediction_id}, type: {type(prediction_id)}")

        # Format recommendations
        recommendations = data.get('recommendations', [])
        if isinstance(recommendations, str):
            try:
                recommendations = json.loads(recommendations)
            except json.JSONDecodeError:
                recommendations = [recommendations]
        if not isinstance(recommendations, list):
            recommendations = [str(recommendations)]
        recommendations = [str(r) for r in recommendations]
        logger.info(f"Recommendations after formatting: {recommendations}")

        # Create DynamoDB item with explicit type annotations
        item = {
            'predictionId': {'S': prediction_id},  # Ensure string type
            'timestamp': {'N': str(int(safe_number(data.get('timestamp', time.time() * 1000))))},
            'nama': {'S': str(data.get('nama', ''))},
            'jenisKelamin': {'S': str(data.get('jenisKelamin', ''))},
            'usia': {'N': str(int(safe_number(data.get('usia', 0))))},
            'beratBadan': {'N': str(safe_number(data.get('beratBadan', 0)))},
            'tinggiBadan': {'N': str(safe_number(data.get('tinggiBadan', 0)))},
            'tekananDarah': {'N': str(safe_number(data.get('tekananDarah', 0)))},
            'gulaDarah': {'N': str(safe_number(data.get('gulaDarah', 0)))},
            'kolesterol': {'N': str(safe_number(data.get('kolesterol', 0)))},
            'riwayatKeluarga': {'S': str(data.get('riwayatKeluarga', 'tidak'))},
            'aktivitasFisik': {'S': str(data.get('aktivitasFisik', 'rendah'))},
            'pola_makan': {'S': str(data.get('pola_makan', 'tidak_sehat'))},
            'stres': {'S': str(data.get('stres', 'rendah'))},
            'merokok': {'S': str(data.get('merokok', 'tidak'))},
            'alkohol': {'S': str(data.get('alkohol', 'tidak'))},
            'bmi': {'N': str(safe_number(data.get('bmi', 0)))},
            'riskLevel': {'S': str(data.get('riskLevel', 'rendah'))},
            'recommendations': {'S': json.dumps(recommendations)}
        }

        # Log the final item for debugging
        logger.info(f"Final DynamoDB item: {json.dumps(item, default=str)}")
        
        return item
        
    except Exception as e:
        logger.error(f"Error converting data to DynamoDB format: {str(e)}")
        logger.error(f"Data: {json.dumps(data, default=str)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def lambda_handler(event, context):
    try:
        # Enhanced logging
        request_id = context.aws_request_id
        logger.info(f"Processing request {request_id}")
        logger.info(f"Event: {json.dumps(event)}")
        
        # Get path and method
        path = event.get('path', '')
        method = event.get('httpMethod', '')
        logger.info(f"Path: {path}, Method: {method}")
        
        # Handle /history endpoint
        if path == '/history':
            if method == 'POST':
                return handle_save_history(event, context)
            elif method == 'GET':
                return handle_get_history(event, context)
                
        # Handle /predict endpoint (default)
        return handle_prediction(event, context)
        
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error - {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(event),
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_save_history(event, context):
    try:
        if not event.get('body'):
            return {
                'statusCode': 400,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': 'Missing request body'})
            }
            
        data = json.loads(event['body'])
        
        # Validate required fields
        required_fields = ['predictionId', 'timestamp', 'userData', 'riskLevel', 'recommendations']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': f'Missing required fields: {", ".join(missing_fields)}'})
            }
            
        # Store in DynamoDB
        try:
            item = convert_to_dynamodb_item(data)
            dynamodb = boto3.client('dynamodb')
            table_name = os.environ['TABLE_NAME']
            dynamodb.put_item(
                TableName=table_name,
                Item=item
            )
            
            return {
                'statusCode': 200,
                'headers': get_cors_headers(event),
                'body': json.dumps({'message': 'History saved successfully'})
            }
            
        except Exception as e:
            logger.error(f"DynamoDB error: {str(e)}")
            return {
                'statusCode': 500,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': 'Failed to save history'})
            }
            
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(event),
            'body': json.dumps({'error': 'Invalid JSON format'})
        }
    except Exception as e:
        logger.error(f"Error saving history: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(event),
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_get_history(event, context):
    try:
        dynamodb = boto3.client('dynamodb')
        table_name = os.environ['TABLE_NAME']
        
        # Get all items from table
        response = dynamodb.scan(TableName=table_name)
        items = response.get('Items', [])
        
        # Convert DynamoDB items to regular JSON
        history = []
        for item in items:
            history_item = {k: deserializer.deserialize(v) for k, v in item.items()}
            history.append(history_item)
            
        return {
            'statusCode': 200,
            'headers': get_cors_headers(event),
            'body': json.dumps({'history': history}, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(event),
            'body': json.dumps({'error': 'Failed to get history'})
        }

def handle_prediction(event, context):
    try:
        # Enhanced logging
        request_id = context.aws_request_id
        logger.info(f"Processing request {request_id}")
        logger.info(f"Event: {json.dumps(event)}")
        
        # Validate request
        if not event.get('body'):
            logger.error(f"Request {request_id}: Missing request body")
            return {
                'statusCode': 400,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': 'Missing request body'})
            }
            
        # Parse and validate input
        try:
            data = json.loads(event['body'])
        except json.JSONDecodeError as e:
            logger.error(f"Request {request_id}: Invalid JSON - {str(e)}")
            return {
                'statusCode': 400,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': 'Invalid JSON format'})
            }
            
        # Validate input data
        try:
            validate_input(data)
        except ValueError as e:
            logger.error(f"Request {request_id}: Validation error - {str(e)}")
            return {
                'statusCode': 400,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': str(e)})
            }
            
        # Calculate BMI
        weight = float(data['beratBadan'])
        height = float(data['tinggiBadan'])
        bmi = calculate_bmi(weight, height)
        
        # Get prediction
        try:
            prediction = predict_diabetes_risk(data)
        except TimeoutError:
            logger.error(f"Request {request_id}: Model prediction timeout")
            return {
                'statusCode': 504,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': 'Model prediction timeout'})
            }
        except Exception as e:
            logger.error(f"Request {request_id}: Prediction error - {str(e)}")
            return {
                'statusCode': 500,
                'headers': get_cors_headers(event),
                'body': json.dumps({'error': 'Internal server error'})
            }
            
        # Store result in DynamoDB
        try:
            item = convert_to_dynamodb_item(data)
            item['prediction'] = prediction
            item['bmi'] = Decimal(str(bmi))
            item['timestamp'] = Decimal(str(time.time()))
            
            dynamodb = boto3.client('dynamodb')
            table_name = os.environ['TABLE_NAME']
            dynamodb.put_item(
                TableName=table_name,
                Item=item
            )
            
        except Exception as e:
            logger.error(f"Request {request_id}: DynamoDB error - {str(e)}")
            # Continue despite DynamoDB error
            pass
            
        # Return success response
        response = {
            'prediction': prediction,
            'bmi': bmi,
            'timestamp': time.time()
        }
        
        logger.info(f"Request {request_id}: Successfully processed")
        return {
            'statusCode': 200,
            'headers': get_cors_headers(event),
            'body': json.dumps(response, cls=DecimalEncoder)
        }
        
    except Exception as e:
        logger.error(f"Request {request_id}: Unexpected error - {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(event),
            'body': json.dumps({'error': 'Internal server error'})
        }
