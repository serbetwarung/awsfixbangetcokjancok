const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://ventixcareku.my.id',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Accept',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json'
};

function wrapWithCors(handler) {
    return async (event, context) => {
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Handle preflight requests
        if (event.httpMethod === 'OPTIONS') {
            console.log('Handling OPTIONS request');
            return {
                statusCode: 204,
                headers: corsHeaders,
                body: ''
            };
        }

        try {
            // Call the actual handler
            const response = await handler(event, context);
            console.log('Handler response:', JSON.stringify(response, null, 2));
            
            // Add CORS headers to the response
            const corsResponse = {
                ...response,
                headers: {
                    ...corsHeaders,
                    ...response.headers
                }
            };
            
            console.log('Final response with CORS:', JSON.stringify(corsResponse, null, 2));
            return corsResponse;
        } catch (error) {
            console.error('Error in handler:', error);
            
            // Return error with CORS headers
            return {
                statusCode: error.statusCode || 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    message: error.message || 'Internal server error'
                })
            };
        }
    };
}

// Handler untuk menyimpan prediksi ke DynamoDB
const handler = async (event, context) => {
    console.log('Processing request in handler');
    
    try {
        // Parse the incoming request body
        const requestBody = JSON.parse(event.body);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        // Validate required fields
        const requiredFields = [
            'predictionId', 'timestamp', 'nama', 'jenisKelamin', 'usia',
            'beratBadan', 'tinggiBadan', 'tekananDarah', 'gulaDarah',
            'riwayatKeluarga', 'olahraga'
        ];

        for (const field of requiredFields) {
            if (!requestBody[field]) {
                console.error(`Missing required field: ${field}`);
                return {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        error: `Missing required field: ${field}`
                    })
                };
            }
        }

        // Your existing DynamoDB logic here
        // ...

        // Success response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Prediction saved successfully',
                predictionId: requestBody.predictionId
            })
        };
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};

module.exports = { handler: wrapWithCors(handler) };
