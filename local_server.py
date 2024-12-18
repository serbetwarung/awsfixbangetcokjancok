from flask import Flask, jsonify, request
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Simpan data prediksi sementara dalam memori
predictions = {}

@app.route('/predictions', methods=['POST'])
def save_prediction():
    data = request.json
    prediction_id = str(uuid.uuid4())
    predictions[prediction_id] = {
        'timestamp': datetime.now().isoformat(),
        'data': data
    }
    return jsonify({'success': True, 'id': prediction_id})

@app.route('/predictions/<prediction_id>', methods=['GET'])
def get_prediction(prediction_id):
    if prediction_id in predictions:
        return jsonify(predictions[prediction_id])
    return jsonify({'error': 'Prediction not found'}), 404

if __name__ == '__main__':
    app.run(port=3000)
