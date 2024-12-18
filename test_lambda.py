import unittest
import json
from lambda_chat import lambda_handler, generate_chat_response, save_chat_history

class TestLambdaFunction(unittest.TestCase):
    def test_missing_body(self):
        event = {}
        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Missing request body', json.loads(response['body'])['error'])

    def test_invalid_json_body(self):
        event = {'body': 'invalid json'}
        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Invalid JSON', json.loads(response['body'])['error'])

    def test_missing_required_fields(self):
        event = {'body': json.dumps({})}
        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Missing required fields', json.loads(response['body'])['error'])

    def test_invalid_message_type(self):
        event = {
            'body': json.dumps({
                'user_id': 'test_user',
                'message': 123  # Should be string
            })
        }
        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Message must be a non-empty string', json.loads(response['body'])['error'])

    def test_empty_message(self):
        event = {
            'body': json.dumps({
                'user_id': 'test_user',
                'message': ''
            })
        }
        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 400)
        self.assertIn('Message must be a non-empty string', json.loads(response['body'])['error'])

    def test_invalid_user_id(self):
        event = {
            'body': json.dumps({
                'user_id': '',
                'message': 'test message'
            })
        }
        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 400)
        self.assertIn('User ID must be a non-empty string', json.loads(response['body'])['error'])

    def test_successful_request(self):
        event = {
            'body': json.dumps({
                'user_id': 'test_user',
                'message': 'test message'
            })
        }
        response = lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)
        response_body = json.loads(response['body'])
        self.assertIn('message', response_body)
        self.assertIn('chat_id', response_body)
        self.assertIn('timestamp', response_body)

    def test_generate_chat_response(self):
        response = generate_chat_response('test message')
        self.assertIsInstance(response, str)
        self.assertTrue(len(response) > 0)

    def test_save_chat_history(self):
        try:
            save_chat_history(
                'test_user',
                'test_chat_id',
                'test_message',
                'test_response',
                '1234567890'
            )
            success = True
        except Exception as e:
            success = False
            print(f"Error saving chat history: {str(e)}")
        self.assertTrue(success)

if __name__ == '__main__':
    unittest.main()
