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
        
        // Validate required fields
        const requiredFields = [
            'predictionId', 'timestamp', 'nama', 'jenisKelamin', 'usia',
            'beratBadan', 'tinggiBadan', 'tekananDarah', 'gulaDarah'
        ];

        for (const field of requiredFields) {
            if (!data[field] && data[field] !== 0) {
                return wrapResponse(400, { error: `Missing required field: ${field}` });
            }
        }

        // Save to DynamoDB
        const params = {
            TableName: TABLE_NAME,
            Item: {
                ...data,
                createdAt: new Date().toISOString()
            }
        };

        await dynamoDB.put(params).promise();

        return wrapResponse(200, {
            message: 'Prediction saved successfully',
            predictionId: data.predictionId
        });
    } catch (error) {
        console.error('Error:', error);
        return wrapResponse(500, {
            error: 'Failed to save prediction',
            details: error.message
        });
    }
};
