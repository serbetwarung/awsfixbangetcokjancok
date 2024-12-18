const AWS = require('aws-sdk');
const { wrapResponse, handleOptions } = require('./cors-handler');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'diabetes_predictions';

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    try {
        if (!event.body) {
            return wrapResponse(400, { error: 'Missing request body' });
        }

        const data = JSON.parse(event.body);
        
        // Validate nama parameter
        if (!data.nama) {
            return wrapResponse(400, { error: 'Missing nama parameter' });
        }

        // Query DynamoDB for user's history
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'nama-index',
            KeyConditionExpression: 'nama = :nama',
            ExpressionAttributeValues: {
                ':nama': data.nama.toLowerCase()
            },
            ScanIndexForward: false, // descending order (newest first)
            Limit: 10 // limit to last 10 predictions
        };

        const result = await dynamoDB.query(params).promise();

        return wrapResponse(200, {
            message: 'History retrieved successfully',
            items: result.Items
        });
    } catch (error) {
        console.error('Error:', error);
        return wrapResponse(500, {
            error: 'Failed to retrieve history',
            details: error.message
        });
    }
};
