import boto3
import json

def get_bedrock_prediction(patient_data):
    """
    Get diabetes prediction using Amazon Bedrock Claude model
    """
    bedrock = boto3.client('bedrock-runtime')
    
    prompt = f"""
    Based on the following patient data, analyze the risk of diabetes:
    - Age: {patient_data['usia']} years
    - Exercise Frequency: {'Regular' if patient_data['olahraga'] else 'Rarely'}
    - Family History: {'Yes' if patient_data['riwayatKeluarga'] else 'No'}
    - BMI: {patient_data['bmi']}
    - Blood Pressure: {patient_data['tekananDarah']}
    - Blood Sugar: {patient_data['gulaDarah']}

    Provide a detailed analysis and risk assessment.
    Format your response as JSON with the following fields:
    - risk_level: (string) "High", "Medium", or "Low"
    - confidence: (float) between 0 and 1
    - explanation: (string) detailed explanation
    """

    response = bedrock.invoke_model(
        modelId='anthropic.claude-v2',
        body=json.dumps({
            "prompt": prompt,
            "max_tokens": 500,
            "temperature": 0.5
        })
    )

    response_body = json.loads(response['body'].read())
    analysis = json.loads(response_body['completion'])
    
    return analysis
