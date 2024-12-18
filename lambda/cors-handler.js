// CORS headers yang akan digunakan di semua response
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://ventixcareku.my.id',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Credentials': 'false'
};

// Wrapper untuk menambahkan CORS headers ke semua response
function wrapResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
}

// Handler untuk OPTIONS request (CORS preflight)
function handleOptions() {
    return {
        statusCode: 204,
        headers: corsHeaders,
        body: ''
    };
}

module.exports = {
    corsHeaders,
    wrapResponse,
    handleOptions
};
