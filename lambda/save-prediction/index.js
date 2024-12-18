const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'diabetes-predictions';

// Helper untuk generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper untuk CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
};

// Helper untuk validasi numerik dengan range
function validateNumericRange(value, min, max, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        throw new Error(`${fieldName} harus berupa angka`);
    }
    if (num < min || num > max) {
        throw new Error(`${fieldName} harus antara ${min} dan ${max}`);
    }
    return num;
}

exports.handler = async (event) => {
    // Log input untuk debugging
    console.log('Event:', JSON.stringify(event));
    
    // Handle CORS preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        if (!event.body) {
            throw new Error('Missing request body');
        }

        const data = JSON.parse(event.body);
        console.log('Parsed data:', JSON.stringify(data));

        // Validasi data
        if (!data.name || data.name === "unknown") {
            throw new Error('Nama tidak boleh kosong');
        }

        // Validasi data numerik
        const usia = validateNumericRange(data.usia, 1, 120, 'Usia');
        const beratBadan = validateNumericRange(data.beratBadan, 1, 300, 'Berat Badan');
        const tinggiBadan = validateNumericRange(data.tinggiBadan, 1, 300, 'Tinggi Badan');
        const gulaDarah = validateNumericRange(data.gulaDarah, 50, 500, 'Gula Darah');

        // Validasi tekanan darah
        if (!data.tekananDarah.match(/^\d+\/\d+$/)) {
            throw new Error('Format tekanan darah harus "120/80"');
        }

        // Prepare DynamoDB item
        const item = {
            predictionId: generateUUID(),
            timestamp: Date.now(),
            nama: data.name,
            jenisKelamin: data.jenisKelamin,
            usia: usia,
            beratBadan: beratBadan,
            tinggiBadan: tinggiBadan,
            tekananDarah: data.tekananDarah,
            gulaDarah: gulaDarah,
            riwayatKeluarga: data.riwayatKeluarga,
            olahraga: data.olahraga
        };

        const params = {
            TableName: TABLE_NAME,
            Item: item
        };

        console.log('DynamoDB params:', JSON.stringify(params));

        await dynamoDB.put(params).promise();
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Data berhasil disimpan',
                predictionId: item.predictionId
            })
        };
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: error.name === 'SyntaxError' ? 400 : 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
