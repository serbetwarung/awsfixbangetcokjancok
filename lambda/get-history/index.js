const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'diabetes-chat-history';

// Helper untuk CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://ventixcareku.my.id',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
    'Content-Type': 'application/json'
};

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        if (event.httpMethod === 'GET') {
            // Get nama from query parameters
            const nama = event.queryStringParameters?.nama;
            
            if (!nama) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Missing nama parameter' })
                };
            }

            // Query DynamoDB
            const params = {
                TableName: TABLE_NAME,
                FilterExpression: '#nama = :nama',
                ExpressionAttributeNames: {
                    '#nama': 'nama'
                },
                ExpressionAttributeValues: {
                    ':nama': nama.toLowerCase()
                }
            };

            const result = await dynamoDB.scan(params).promise();

            // Sort by timestamp in descending order (newest first)
            const sortedItems = result.Items.sort((a, b) => b.timestamp - a.timestamp);

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    message: 'History retrieved successfully',
                    data: sortedItems
                })
            };
        } else if (event.httpMethod === 'POST') {
            if (!event.body) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Missing request body' })
                };
            }

            let data;
            try {
                data = JSON.parse(event.body);
            } catch (error) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Invalid JSON in request body' })
                };
            }
            
            // Validate required fields for POST
            const requiredFields = ['nama', 'message', 'response', 'timestamp'];
            const missingFields = requiredFields.filter(field => !data[field]);
            if (missingFields.length > 0) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ 
                        error: 'Missing required fields',
                        details: missingFields
                    })
                };
            }

            // Validate data types
            if (typeof data.nama !== 'string' || 
                typeof data.message !== 'string' || 
                typeof data.response !== 'string' || 
                typeof data.timestamp !== 'number') {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ 
                        error: 'Invalid data types',
                        details: 'All fields must be strings except timestamp which must be a number'
                    })
                };
            }

            // Format data
            const item = {
                id: `chat_${data.timestamp}`,
                nama: data.nama.toLowerCase(),
                message: data.message,
                response: data.response,
                timestamp: data.timestamp
            };

            // Save to DynamoDB
            const params = {
                TableName: TABLE_NAME,
                Item: item
            };

            try {
                await dynamoDB.put(params).promise();
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        message: 'Chat history saved successfully',
                        data: item
                    })
                };
            } catch (dbError) {
                console.error('DynamoDB Error:', dbError);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        error: 'Failed to save chat history',
                        details: dbError.message
                    })
                };
            }
        }

        // Handle unsupported HTTP methods
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};
