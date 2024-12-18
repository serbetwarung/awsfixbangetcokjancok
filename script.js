// Konfigurasi endpoint API
const API_CONFIG = {
    PREDICTIONS: 'https://z7w5z5wrz5.execute-api.us-east-1.amazonaws.com/prod/predictions',
    HISTORY: 'https://z7w5z5wrz5.execute-api.us-east-1.amazonaws.com/prod/history',
    PROD: 'https://z7w5z5wrz5.execute-api.us-east-1.amazonaws.com/prod',
    DEV: 'http://localhost:3000'  // Jika Anda memiliki environment development
};

// Pilih endpoint berdasarkan environment
const API_ENDPOINT = API_CONFIG.PROD;  // Ganti dengan API_CONFIG.DEV untuk development

const chatState = {
    currentStep: 0,
    userData: {},
    questions: [
        {
            text: "Halo! Saya adalah chatbot prediksi diabetes. Siapa nama Anda?",
            type: "text",
            placeholder: "Masukkan nama Anda"
        },
        {
            text: "Pilih jenis kelamin Anda:",
            type: "options",
            options: ["Laki-laki", "Perempuan"]
        },
        {
            text: "Apakah Anda sedang hamil?",
            type: "options",
            options: ["Ya", "Tidak"],
            condition: (userData) => userData.jenisKelamin === "Perempuan"
        },
        {
            text: "Berapa usia Anda?",
            type: "number",
            placeholder: "Masukkan usia Anda"
        },
        {
            text: "Berapa berat badan Anda? (dalam kg)",
            type: "number",
            placeholder: "Contoh: 70"
        },
        {
            text: "Berapa tinggi badan Anda? (dalam cm)",
            type: "number",
            placeholder: "Contoh: 170"
        },
        {
            text: "Berapa tekanan darah Anda? (dalam mmHg)",
            type: "text",
            placeholder: "Contoh: 120/80"
        },
        {
            text: "Berapa kadar gula darah Anda? (dalam mg/dL)",
            type: "number",
            placeholder: "Contoh: 100"
        },
        {
            text: "Apakah ada riwayat diabetes dalam keluarga?",
            type: "options",
            options: ["Ya", "Tidak"]
        },
        {
            text: "Seberapa sering Anda berolahraga dalam seminggu?",
            type: "options",
            options: ["Tidak pernah", "1-2 kali", "3-4 kali", "5 kali atau lebih"]
        }
    ]
};

function initChat() {
    displayBotMessage(chatState.questions[0].text);
    setupInput(chatState.questions[0]);
}

function displayBotMessage(message) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message slide-in-left';
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function displayUserMessage(message) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message slide-in-right';
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function setupInput(question) {
    const inputContainer = document.getElementById('inputContainer');
    const textInput = document.getElementById('textInput');
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';

    // Remove any existing options container
    const existingOptions = inputContainer.querySelector('.options-container');
    if (existingOptions) {
        existingOptions.remove();
    }

    if (question.type === 'options') {
        textInput.style.display = 'none';
        optionsContainer.innerHTML = question.options.map(option => `
            <button class="option-button" onclick="handleOptionClick('${option}')">${option}</button>
        `).join('');
        inputContainer.appendChild(optionsContainer);
    } else {
        textInput.style.display = 'flex';
        const input = document.getElementById('userInput');
        input.type = question.type === 'number' ? 'number' : 'text';
        input.placeholder = question.placeholder || "Ketik jawaban Anda...";
        input.value = '';
        input.focus();
    }
}

function handleOptionClick(option) {
    processUserInput(option);
}

function handleUserInput() {
    const userInput = document.getElementById('userInput');
    if (!userInput) return;
    
    const input = userInput.value.trim();
    if (!input) {
        showError('Input tidak boleh kosong');
        return;
    }
    
    processUserInput(input);
    userInput.value = '';
}

async function processUserInput(input) {
    try {
        const currentQuestion = chatState.questions[chatState.currentStep];
        
        // Validasi jika pertanyaan tidak ditemukan
        if (!currentQuestion) {
            console.error('Question not found for step:', chatState.currentStep);
            showError('Terjadi kesalahan sistem');
            return;
        }

        // Validasi input
        const key = getKeyFromQuestion(currentQuestion.text);
        const validatedInput = validateInput(key, input);
        
        // Store validated input
        if (key === 'nama') {
            if (!chatState.userData.nama) {
                chatState.userData.nama = validatedInput;
            }
        } else {
            chatState.userData[key] = validatedInput;
        }

        displayUserMessage(input);
        
        // Lanjut ke pertanyaan berikutnya
        chatState.currentStep++;
        
        // Cek apakah masih ada pertanyaan
        if (chatState.currentStep < chatState.questions.length) {
            // Cek kondisi pertanyaan
            while (chatState.currentStep < chatState.questions.length) {
                const nextQuestion = chatState.questions[chatState.currentStep];
                if (!nextQuestion.condition || nextQuestion.condition(chatState.userData)) {
                    displayBotMessage(nextQuestion.text);
                    setupInput(nextQuestion);
                    break;
                }
                chatState.currentStep++;
            }
            
            // Jika sudah tidak ada pertanyaan yang sesuai kondisi
            if (chatState.currentStep >= chatState.questions.length) {
                finishChat();
            }
        } else {
            finishChat();
        }
    } catch (error) {
        console.error('Error processing user input:', error);
        showError('Terjadi kesalahan sistem');
    }
}

// Fungsi validasi input
function validateInput(key, value) {
    switch(key) {
        case 'usia':
            const usia = parseInt(value);
            if (isNaN(usia) || usia < 0 || usia > 120) {
                throw new Error('Usia harus antara 0-120 tahun');
            }
            return usia;
            
        case 'beratBadan':
            const berat = parseFloat(value);
            if (isNaN(berat) || berat < 20 || berat > 300) {
                throw new Error('Berat badan harus antara 20-300 kg');
            }
            return berat;
            
        case 'tinggiBadan':
            const tinggi = parseFloat(value);
            if (isNaN(tinggi) || tinggi < 100 || tinggi > 250) {
                throw new Error('Tinggi badan harus antara 100-250 cm');
            }
            return tinggi;
            
        case 'tekananDarah':
            const pattern = /^(\d{2,3})\/(\d{2,3})$/;
            if (!pattern.test(value)) {
                throw new Error('Format tekanan darah harus systolic/diastolic (contoh: 120/80)');
            }
            const [systolic, diastolic] = value.split('/').map(Number);
            if (systolic < 70 || systolic > 200 || diastolic < 40 || diastolic > 130) {
                throw new Error('Nilai tekanan darah tidak valid');
            }
            return value;
            
        case 'gulaDarah':
            const gula = parseFloat(value);
            if (isNaN(gula) || gula < 50 || gula > 500) {
                throw new Error('Kadar gula darah harus antara 50-500 mg/dL');
            }
            return gula;
            
        case 'nama':
            if (!value || value.trim().length < 2) {
                throw new Error('Nama harus diisi minimal 2 karakter');
            }
            return value.trim();
            
        default:
            return value;
    }
}

// Helper function untuk mendapatkan key dari pertanyaan
function getKeyFromQuestion(question) {
    const keyMap = {
        "Halo! Saya adalah chatbot prediksi diabetes. Siapa nama Anda?": "nama",
        "Pilih jenis kelamin Anda:": "jenisKelamin",
        "Apakah Anda sedang hamil?": "hamil",
        "Berapa usia Anda?": "usia",
        "Berapa berat badan Anda? (dalam kg)": "beratBadan",
        "Berapa tinggi badan Anda? (dalam cm)": "tinggiBadan",
        "Berapa tekanan darah Anda? (dalam mmHg)": "tekananDarah",
        "Berapa kadar gula darah Anda? (dalam mg/dL)": "gulaDarah",
        "Apakah ada riwayat diabetes dalam keluarga?": "riwayatKeluarga",
        "Seberapa sering Anda berolahraga dalam seminggu?": "olahraga"
    };
    return keyMap[question] || question.toLowerCase().replace(/[^a-z]/g, '');
}

async function finishChat() {
    try {
        const data = chatState.userData;
        
        // Validate required fields
        const requiredFields = ['nama', 'jenisKelamin', 'usia', 'beratBadan', 'tinggiBadan', 'tekananDarah', 'gulaDarah', 'riwayatKeluarga', 'olahraga'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Data tidak lengkap: ${missingFields.join(', ')}`);
        }

        // Validate numeric fields
        const numericFields = {
            usia: parseInt(data.usia),
            beratBadan: parseFloat(data.beratBadan),
            tinggiBadan: parseFloat(data.tinggiBadan),
            gulaDarah: parseFloat(data.gulaDarah)
        };

        for (const [field, value] of Object.entries(numericFields)) {
            if (isNaN(value)) {
                throw new Error(`${field} harus berupa angka`);
            }
            data[field] = value;
        }
        
        // Hitung BMI
        const bmi = calculateBMI(data.beratBadan, data.tinggiBadan);
        if (isNaN(bmi)) {
            throw new Error('Gagal menghitung BMI: berat atau tinggi badan tidak valid');
        }
        
        // Hitung tingkat risiko
        const riskLevel = calculateDiabetesRisk(data);
        if (!riskLevel) {
            throw new Error('Gagal menghitung tingkat risiko');
        }
        
        // Dapatkan rekomendasi
        const recommendations = getRecommendations(data, riskLevel);
        if (!Array.isArray(recommendations)) {
            throw new Error('Gagal mendapatkan rekomendasi');
        }

        // Format data untuk API
        const apiData = {
            nama: data.nama.trim(),
            jenisKelamin: data.jenisKelamin,
            usia: data.usia,
            beratBadan: data.beratBadan,
            tinggiBadan: data.tinggiBadan,
            tekananDarah: data.tekananDarah,
            gulaDarah: data.gulaDarah,
            riwayatKeluarga: data.riwayatKeluarga,
            olahraga: data.olahraga
        };
        
        console.log('Sending data to API:', JSON.stringify(apiData, null, 2));
        
        // Save result to history
        try {
            await saveResult(data.nama, "Prediksi Diabetes", `Risiko: ${riskLevel}`);
            
            // Save prediction data
            localStorage.setItem('predictionResult', JSON.stringify({
                userData: Object.entries(apiData).map(([label, value]) => ({ label, value })),
                bmi,
                riskLevel,
                recommendations
            }));
            
            // Redirect ke halaman hasil
            window.location.href = 'result.html';
            
        } catch (error) {
            console.error('Error saving result:', error);
            showError("Data akan ditampilkan tetapi gagal disimpan ke database: " + error.message);
            
            // Wait 2 seconds to show the error message before redirecting
            setTimeout(() => {
                window.location.href = 'result.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error in finishChat:', error);
        showError('Terjadi kesalahan: ' + error.message);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initChat();
    
    // Setup event listener untuk tombol kirim
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', handleUserInput);
    }
    
    // Setup event listener untuk input field
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserInput();
            }
        });
    }
});

// Error handling
function showError(message) {
    // Hapus error sebelumnya jika ada
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Tambahkan ke container
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => errorDiv.remove(), 150);
    }, 5000);
}

function createErrorDiv() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'errorMessage';
    errorDiv.className = 'error-message';
    document.body.appendChild(errorDiv);
    return errorDiv;
}

function calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return "Kurus";
    if (bmi >= 18.5 && bmi <= 24.9) return "Normal";
    if (bmi >= 25 && bmi <= 29.9) return "Gemuk";
    return "Obesitas";
}

function getBloodSugarCategory(bloodSugar) {
    if (bloodSugar < 100) return "Normal";
    if (bloodSugar >= 100 && bloodSugar <= 125) return "Pre-diabetes";
    return "Diabetes";
}

function getBloodPressureCategory(bloodPressure) {
    if (bloodPressure < 130) return "Normal";
    if (bloodPressure >= 130 && bloodPressure <= 139) return "Pre-hipertensi";
    return "Hipertensi";
}

function getAgeRiskCategory(age) {
    if (age < 35) return "Risiko rendah";
    if (age >= 35 && age <= 44) return "Risiko sedang";
    return "Risiko tinggi";
}

function calculateDiabetesRisk(data) {
    let riskPoints = 0;
    
    // BMI Risk
    const bmi = calculateBMI(data.beratBadan, data.tinggiBadan);
    if (bmi >= 30) riskPoints += 3;
    else if (bmi >= 25) riskPoints += 2;
    else if (bmi < 18.5) riskPoints += 1;

    // Blood Sugar Risk
    if (data.gulaDarah >= 126) riskPoints += 3;
    else if (data.gulaDarah >= 100) riskPoints += 2;

    // Blood Pressure Risk
    if (data.tekananDarah >= 140) riskPoints += 2;
    else if (data.tekananDarah >= 130) riskPoints += 1;

    // Age Risk
    if (data.usia >= 45) riskPoints += 3;
    else if (data.usia >= 35) riskPoints += 2;

    // Physical Activity Risk
    if (data.olahraga === "Tidak pernah") riskPoints += 2;
    else if (data.olahraga === "1-2 kali seminggu") riskPoints += 1;

    // Family History Risk
    if (data.riwayatKeluarga === "Ya") riskPoints += 2;

    // Determine Risk Level
    if (riskPoints >= 10) return "Sangat Tinggi";
    if (riskPoints >= 7) return "Tinggi";
    if (riskPoints >= 4) return "Sedang";
    return "Rendah";
}

function getRecommendations(data, riskLevel) {
    const recommendations = [];
    
    // Rekomendasi berdasarkan BMI
    const bmi = calculateBMI(data.beratBadan, data.tinggiBadan);
    if (bmi > 25) {
        recommendations.push("Kurangi berat badan melalui diet sehat dan olahraga teratur");
    }
    
    // Rekomendasi berdasarkan gula darah
    if (data.gulaDarah > 100) {
        recommendations.push("Kontrol asupan gula dan karbohidrat");
        recommendations.push("Konsultasikan dengan dokter untuk pemeriksaan lebih lanjut");
    }
    
    // Rekomendasi berdasarkan tekanan darah
    const [systolic, diastolic] = data.tekananDarah.split('/').map(Number);
    if (systolic > 130 || diastolic > 80) {
        recommendations.push("Kurangi konsumsi garam");
        recommendations.push("Kelola stres dengan baik");
    }
    
    // Rekomendasi berdasarkan riwayat keluarga
    if (data.riwayatKeluarga === "Ya") {
        recommendations.push("Lakukan pemeriksaan gula darah rutin");
        recommendations.push("Jaga pola makan sehat");
    }
    
    // Rekomendasi umum berdasarkan tingkat risiko
    if (riskLevel === "Tinggi") {
        recommendations.push("Segera konsultasi dengan dokter");
        recommendations.push("Lakukan pemeriksaan kesehatan menyeluruh");
    } else if (riskLevel === "Sedang") {
        recommendations.push("Mulai menerapkan pola hidup sehat");
        recommendations.push("Pertimbangkan untuk melakukan pemeriksaan kesehatan");
    } else {
        recommendations.push("Pertahankan pola hidup sehat");
        recommendations.push("Lakukan pemeriksaan kesehatan rutin setahun sekali");
    }
    
    return recommendations;
}

// Fungsi untuk generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function submitPrediction(data) {
    try {
        console.log('Submitting prediction:', JSON.stringify(data, null, 2));
        
        const response = await fetch('https://z7w5z5wrz5.execute-api.us-east-1.amazonaws.com/prod/predictions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseText = await response.text();
        console.log('API Response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        try {
            return JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Could not parse response as JSON:', responseText);
            return { success: false, error: 'Invalid response format' };
        }
    } catch (error) {
        console.error('Error submitting prediction:', error);
        return { success: false, error: error.message };
    }
}

async function saveResult(nama, message, response) {
    try {
        // Validate input
        if (!nama || typeof nama !== 'string') {
            throw new Error('Invalid nama parameter');
        }
        if (!message || typeof message !== 'string') {
            throw new Error('Invalid message parameter');
        }
        if (!response || typeof response !== 'string') {
            throw new Error('Invalid response parameter');
        }

        const data = {
            nama: nama.trim(),
            message: message.trim(),
            response: response.trim(),
            timestamp: Date.now()
        };

        console.log('Saving chat history:', JSON.stringify(data, null, 2));

        const apiResponse = await fetch(API_CONFIG.HISTORY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://ventixcareku.my.id'
            },
            body: JSON.stringify(data)
        });

        const responseText = await apiResponse.text();
        console.log('API Response:', apiResponse.status, responseText);

        if (!apiResponse.ok) {
            throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }

        try {
            const result = JSON.parse(responseText);
            console.log('Chat history saved:', result);
            return result;
        } catch (parseError) {
            console.warn('Could not parse response as JSON:', responseText);
            return { success: false, error: 'Invalid response format' };
        }
    } catch (error) {
        console.error('Error saving result:', error);
        throw error;
    }
}

// Fungsi untuk mengambil riwayat prediksi
async function getHistory() {
    try {
        console.log('Fetching history...');  // Debug log
        
        const response = await fetch(`${API_ENDPOINT}/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch history: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('History data:', data);  // Debug log
        displayHistory(data);
    } catch (error) {
        console.error('Error getting history:', error);
        showError('Gagal mengambil riwayat prediksi: ' + error.message);
    }
}

// Fungsi untuk menampilkan riwayat prediksi
function displayHistory(historyData) {
    const chatContainer = document.querySelector('.chat-container');
    const historyDiv = document.createElement('div');
    historyDiv.className = 'history-container';
    
    if (!historyData || historyData.length === 0) {
        historyDiv.innerHTML = '<p>Belum ada riwayat prediksi</p>';
    } else {
        const historyList = document.createElement('ul');
        historyList.className = 'history-list';
        
        historyData.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'history-item';
            listItem.innerHTML = `
                <p><strong>Nama:</strong> ${item.nama}</p>
                <p><strong>Tanggal:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
                <p><strong>Hasil Prediksi:</strong> ${item.riskLevel}</p>
            `;
            historyList.appendChild(listItem);
        });
        
        historyDiv.appendChild(historyList);
    }
    
    chatContainer.appendChild(historyDiv);
}
