const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME;

exports.handler = async (event) => {
    try {
        // Set CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        };

        // Handle OPTIONS request for CORS
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: headers,
                body: ''
            };
        }

        // Get the path
        const path = event.path;

        if (path === '/predict') {
            // Handle prediction logic
            const body = JSON.parse(event.body);
            
            // Your existing prediction logic here
            // ...

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ message: 'Prediction successful' })
            };
        } 
        else if (path === '/history') {
            if (event.httpMethod === 'POST') {
                // Save history
                const body = JSON.parse(event.body);
                
                // Add timestamp if not provided
                if (!body.timestamp) {
                    body.timestamp = new Date().toISOString();
                }

                const params = {
                    TableName: tableName,
                    Item: body
                };

                await dynamodb.put(params).promise();

                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify({ message: 'History saved successfully' })
                };
            }
        }

        // Handle unknown paths
        return {
            statusCode: 404,
            headers: headers,
            body: JSON.stringify({ error: 'Not Found' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
