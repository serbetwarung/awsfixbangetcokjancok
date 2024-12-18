import json
import boto3
import os
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['HISTORY_TABLE_NAME'])

def lambda_handler(event, context):
    try:
        http_method = event['httpMethod']
        
        if http_method == 'GET':
            # Get history for a user
            user_id = event['queryStringParameters']['userId']
            response = table.query(
                KeyConditionExpression=Key('userId').eq(user_id),
                ScanIndexForward=False  # Sort by timestamp descending
            )
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE'
                },
                'body': json.dumps(response['Items'])
            }
            
        elif http_method == 'POST':
            # Add new prediction result
            body = json.loads(event['body'])
            item = {
                'userId': body['userId'],
                'timestamp': int(datetime.now().timestamp() * 1000),
                'nama': body['nama'],
                'bmi': body['bmi'],
                'tinggiBadan': body['tinggiBadan'],
                'beratBadan': body['beratBadan'],
                'aktivitasFisik': body['aktivitasFisik'],
                'riskLevel': body['riskLevel'],
                'gulaDarah': body.get('gulaDarah'),
                'tekananDarah': body.get('tekananDarah')
            }
            table.put_item(Item=item)
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE'
                },
                'body': json.dumps({'message': 'Data saved successfully'})
            }
            
        elif http_method == 'DELETE':
            # Delete history entry or all entries for a user
            user_id = event['queryStringParameters']['userId']
            timestamp = event['queryStringParameters'].get('timestamp')
            
            if timestamp:
                # Delete specific entry
                table.delete_item(
                    Key={
                        'userId': user_id,
                        'timestamp': int(timestamp)
                    }
                )
            else:
                # Delete all entries for user
                response = table.query(
                    KeyConditionExpression=Key('userId').eq(user_id)
                )
                with table.batch_writer() as batch:
                    for item in response['Items']:
                        batch.delete_item(
                            Key={
                                'userId': item['userId'],
                                'timestamp': item['timestamp']
                            }
                        )
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE'
                },
                'body': json.dumps({'message': 'Data deleted successfully'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE'
            },
            'body': json.dumps({'error': str(e)})
        }
