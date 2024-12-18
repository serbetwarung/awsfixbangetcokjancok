from locust import HttpUser, task, between
import json
import random

class DiabetesPredictionUser(HttpUser):
    wait_time = between(1, 3)  # Waktu tunggu antara request (1-3 detik)
    
    def generate_test_data(self):
        """Generate data test yang random tapi valid"""
        return {
            "nama": f"Test User {random.randint(1, 1000)}",
            "umur": random.randint(18, 80),
            "beratBadan": random.randint(45, 120),
            "tinggiBadan": random.randint(150, 190),
            "tekananDarah": f"{random.randint(100, 140)}/{random.randint(60, 90)}",
            "gulaDarah": random.randint(70, 200),
            "kolesterol": random.randint(150, 300),
            "olahraga": random.choice(["Tidak pernah", "1 kali", "2 kali", "Lebih dari 2 kali"])
        }

    @task(1)
    def predict_diabetes(self):
        """Test endpoint prediksi diabetes"""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Generate dan kirim data test
        payload = self.generate_test_data()
        with self.client.post("/predict", 
                            json=payload,
                            headers=headers,
                            catch_response=True) as response:
            if response.status_code == 200:
                try:
                    result = response.json()
                    if "riskLevel" in result and "recommendations" in result:
                        response.success()
                    else:
                        response.failure("Response tidak memiliki format yang benar")
                except json.JSONDecodeError:
                    response.failure("Response bukan JSON yang valid")
            else:
                response.failure(f"Request gagal dengan status code: {response.status_code}")

    @task(2)
    def health_check(self):
        """Test endpoint health check"""
        with self.client.get("/health",
                           catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check gagal dengan status code: {response.status_code}")
