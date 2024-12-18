import unittest
import json
from decimal import Decimal
import sys
import os

# Tambahkan path ke root project
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lambda_function import (
    validate_input,
    calculate_bmi,
    parse_blood_pressure,
    predict_diabetes_risk,
    DecimalEncoder
)

class TestDiabetesPrediction(unittest.TestCase):
    def setUp(self):
        """Set up test data"""
        self.valid_data = {
            'nama': 'Test User',
            'umur': 30,
            'beratBadan': 70,
            'tinggiBadan': 170,
            'tekananDarah': '120/80',
            'gulaDarah': 100,
            'kolesterol': 180,
            'olahraga': '2 kali'
        }

    def test_validate_input_valid(self):
        """Test validasi input dengan data valid"""
        try:
            validate_input(self.valid_data)
        except ValueError:
            self.fail("validate_input() raised ValueError unexpectedly!")

    def test_validate_input_missing_field(self):
        """Test validasi input dengan field yang hilang"""
        invalid_data = self.valid_data.copy()
        del invalid_data['nama']
        with self.assertRaises(ValueError):
            validate_input(invalid_data)

    def test_validate_input_invalid_range(self):
        """Test validasi input dengan nilai di luar range"""
        test_cases = [
            ('umur', 150),
            ('beratBadan', 250),
            ('tinggiBadan', 250),
            ('gulaDarah', 600),
            ('kolesterol', 600)
        ]
        
        for field, value in test_cases:
            invalid_data = self.valid_data.copy()
            invalid_data[field] = value
            with self.assertRaises(ValueError):
                validate_input(invalid_data)

    def test_calculate_bmi(self):
        """Test perhitungan BMI"""
        test_cases = [
            # (berat, tinggi, expected_bmi)
            (70, 170, Decimal('24.22')),  # Normal
            (50, 160, Decimal('19.53')),  # Underweight
            (90, 180, Decimal('27.78')),  # Overweight
            (100, 170, Decimal('34.60'))  # Obese
        ]
        
        for weight, height, expected in test_cases:
            bmi = calculate_bmi(weight, height)
            self.assertEqual(bmi, expected)

    def test_parse_blood_pressure(self):
        """Test parsing tekanan darah"""
        test_cases = [
            ('120/80', (120, 80)),    # Normal
            ('130/85', (130, 85)),    # Pre-hypertension
            ('140/90', (140, 90))     # Hypertension
        ]
        
        for bp_string, expected in test_cases:
            systolic, diastolic = parse_blood_pressure(bp_string)
            self.assertEqual((systolic, diastolic), expected)

    def test_parse_blood_pressure_invalid(self):
        """Test parsing tekanan darah dengan format tidak valid"""
        invalid_cases = [
            '12080',     # Format salah
            '120-80',    # Separator salah
            '80/120',    # Nilai terbalik
            '300/200'    # Nilai terlalu tinggi
        ]
        
        for bp_string in invalid_cases:
            with self.assertRaises(ValueError):
                parse_blood_pressure(bp_string)

    def test_predict_diabetes_risk(self):
        """Test prediksi risiko diabetes"""
        test_cases = [
            # Low risk
            {
                'bmi': Decimal('22.0'),
                'systolic': Decimal('120'),
                'diastolic': Decimal('80'),
                'gulaDarah': Decimal('90'),
                'kolesterol': Decimal('180')
            },
            # Medium risk
            {
                'bmi': Decimal('27.0'),
                'systolic': Decimal('135'),
                'diastolic': Decimal('85'),
                'gulaDarah': Decimal('150'),
                'kolesterol': Decimal('220')
            },
            # High risk
            {
                'bmi': Decimal('32.0'),
                'systolic': Decimal('145'),
                'diastolic': Decimal('95'),
                'gulaDarah': Decimal('200'),
                'kolesterol': Decimal('260')
            }
        ]
        
        expected_results = ['Rendah', 'Sedang', 'Tinggi']
        
        for data, expected in zip(test_cases, expected_results):
            risk_level = predict_diabetes_risk(data)
            self.assertEqual(risk_level, expected)

    def test_decimal_encoder(self):
        """Test JSON encoder untuk tipe Decimal"""
        encoder = DecimalEncoder()
        test_cases = [
            (Decimal('10.5'), '10.5'),
            (Decimal('0'), '0'),
            (Decimal('100.00'), '100.00')
        ]
        
        for decimal_value, expected in test_cases:
            encoded = encoder.default(decimal_value)
            self.assertEqual(encoded, expected)

if __name__ == '__main__':
    unittest.main()
