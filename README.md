# Diabetes Risk Prediction Chatbot

Aplikasi chatbot berbasis web untuk memprediksi risiko diabetes dan memberikan rekomendasi kesehatan yang dipersonalisasi berdasarkan data pengguna.

## Fitur Utama

- Antarmuka chatbot yang interaktif dan ramah pengguna
- Kalkulasi BMI (Body Mass Index) otomatis
- Prediksi risiko diabetes berdasarkan input pengguna
- Halaman hasil yang informatif dengan:
  - Visualisasi BMI dengan indikator dinamis
  - Level risiko diabetes dengan penjelasan
  - Metrik kesehatan personal
  - Rekomendasi kesehatan berbasis penelitian
- Riwayat prediksi tersimpan secara lokal

## Teknologi yang Digunakan

- **Frontend**:
  - HTML5
  - CSS3 dengan Bootstrap 5
  - JavaScript (Vanilla)
  - Font Awesome untuk ikon
  
- **Backend**:
  - AWS Lambda
  - Amazon DynamoDB
  - API Gateway

## Struktur File

- `index.html` - Halaman utama dengan antarmuka chatbot
- `script.js` - Logika chatbot dan interaksi pengguna
- `result.html` - Halaman tampilan hasil prediksi
- `result.js` - Logika untuk menampilkan hasil dan rekomendasi
- `result-styles.css` - Styling khusus untuk halaman hasil
- `styles.css` - Styling umum aplikasi

## Fitur Halaman Hasil

### Visualisasi BMI
- Indikator visual untuk rentang BMI (18.5-30)
- Kategori BMI (Kurus, Normal, Gemuk, Obesitas)
- Penanda skala dinamis

### Level Risiko Diabetes
- Empat tingkat risiko: Rendah, Sedang, Tinggi, Sangat Tinggi
- Deskripsi dan rekomendasi untuk setiap level
- Indikator visual dengan kode warna

### Metrik Kesehatan
- Tinggi badan
- Berat badan
- Level aktivitas fisik (Tidak Aktif, Cukup Aktif, Aktif, Sangat Aktif)

### Rekomendasi Kesehatan
- Rekomendasi personal berdasarkan profil pengguna
- Sumber referensi dari penelitian ilmiah
- Ikon intuitif untuk setiap rekomendasi

## Penggunaan Local Storage

Aplikasi menggunakan localStorage untuk:
- Menyimpan hasil prediksi terbaru
- Menyimpan riwayat prediksi
- Mempertahankan data pengguna antar halaman

## Pengembangan Selanjutnya

- [ ] Implementasi autentikasi pengguna
- [ ] Integrasi dengan layanan kesehatan eksternal
- [ ] Fitur ekspor data hasil prediksi
- [ ] Notifikasi follow-up kesehatan
- [ ] Dukungan multi-bahasa

## Panduan Kontribusi

1. Fork repositori
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## Kontak

Your Name - [@youremail](mailto:youremail@example.com)

Project Link: [https://github.com/yourusername/diabetes-prediction-chatbot](https://github.com/yourusername/diabetes-prediction-chatbot)
