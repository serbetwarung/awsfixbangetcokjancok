import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class DiabetesPredictionUAT(unittest.TestCase):
    def setUp(self):
        """Setup untuk setiap test case"""
        self.driver = webdriver.Chrome()
        self.base_url = "https://diabetesprediction.com"  # Ganti dengan URL aplikasi Anda
        self.driver.implicitly_wait(10)

    def test_form_submission_flow(self):
        """Test alur pengisian form dan mendapatkan hasil prediksi"""
        try:
            # Buka halaman utama
            self.driver.get(self.base_url)
            
            # Isi form
            self.driver.find_element(By.ID, "nama").send_keys("Test User")
            self.driver.find_element(By.ID, "umur").send_keys("35")
            self.driver.find_element(By.ID, "beratBadan").send_keys("70")
            self.driver.find_element(By.ID, "tinggiBadan").send_keys("170")
            self.driver.find_element(By.ID, "tekananDarah").send_keys("120/80")
            self.driver.find_element(By.ID, "gulaDarah").send_keys("100")
            self.driver.find_element(By.ID, "kolesterol").send_keys("180")
            
            # Pilih frekuensi olahraga
            self.driver.find_element(By.ID, "olahraga").click()
            self.driver.find_element(By.XPATH, "//option[text()='2 kali']").click()
            
            # Submit form
            self.driver.find_element(By.ID, "submit-btn").click()
            
            # Tunggu hasil prediksi
            result = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "prediction-result"))
            )
            
            # Verifikasi komponen hasil
            self.assertTrue(result.is_displayed())
            self.assertTrue(self.driver.find_element(By.ID, "bmi-value").is_displayed())
            self.assertTrue(self.driver.find_element(By.ID, "risk-level").is_displayed())
            self.assertTrue(self.driver.find_element(By.ID, "recommendations").is_displayed())
            
        except Exception as e:
            self.fail(f"Test gagal: {str(e)}")

    def test_form_validation(self):
        """Test validasi form"""
        self.driver.get(self.base_url)
        
        # Submit form kosong
        self.driver.find_element(By.ID, "submit-btn").click()
        
        # Verifikasi pesan error
        error_messages = self.driver.find_elements(By.CLASS_NAME, "error-message")
        self.assertGreater(len(error_messages), 0)
        
    def test_responsive_design(self):
        """Test responsive design"""
        self.driver.get(self.base_url)
        
        # Test di berbagai ukuran layar
        screen_sizes = [
            (375, 667),  # iPhone SE
            (768, 1024), # iPad
            (1920, 1080) # Desktop
        ]
        
        for width, height in screen_sizes:
            self.driver.set_window_size(width, height)
            time.sleep(1)  # Tunggu transisi
            
            # Verifikasi form tetap dapat diakses
            form = self.driver.find_element(By.ID, "prediction-form")
            self.assertTrue(form.is_displayed())

    def tearDown(self):
        """Cleanup setelah setiap test case"""
        if self.driver:
            self.driver.quit()

if __name__ == "__main__":
    unittest.main()
