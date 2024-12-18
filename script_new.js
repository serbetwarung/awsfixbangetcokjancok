// Konfigurasi endpoint API
const API_ENDPOINT = 'https://[YOUR_CLOUDFRONT_DOMAIN]';

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
    const input = document.getElementById('userInput');
    const value = input.value.trim();
    if (value) {
        processUserInput(value);
        input.value = '';
    }
}

function processUserInput(input) {
    displayUserMessage(input);
    
    // Save user input
    switch(chatState.currentStep) {
        case 0: chatState.userData.nama = input; break;
        case 1: chatState.userData.jenisKelamin = input; break;
        case 2: 
            if (chatState.userData.jenisKelamin === "Perempuan") {
                chatState.userData.hamil = input;
            } else {
                chatState.userData.usia = parseInt(input);
            }
            break;
        case 3: 
            if (chatState.userData.jenisKelamin === "Perempuan") {
                chatState.userData.usia = parseInt(input);
            } else {
                chatState.userData.beratBadan = parseFloat(input);
            }
            break;
        case 4: chatState.userData.beratBadan = parseFloat(input); break;
        case 5: chatState.userData.tinggiBadan = parseFloat(input); break;
        case 6: chatState.userData.tekananDarah = input; break;
        case 7: chatState.userData.gulaDarah = parseFloat(input); break;
        case 8: chatState.userData.riwayatKeluarga = input; break;
        case 9: chatState.userData.olahraga = input; break;
    }

    chatState.currentStep++;

    // Get next question
    let nextQuestion;
    do {
        nextQuestion = chatState.questions[chatState.currentStep];
        // Skip question if condition exists and is false
        if (nextQuestion && nextQuestion.condition && !nextQuestion.condition(chatState.userData)) {
            chatState.currentStep++;
        }
    } while (nextQuestion && nextQuestion.condition && !nextQuestion.condition(chatState.userData));

    if (nextQuestion) {
        displayBotMessage(nextQuestion.text);
        setupInput(nextQuestion);
    } else {
        finishChat();
    }
}

function finishChat() {
    // Show loading message
    displayBotMessage("Memproses data Anda...");
    
    // Calculate BMI and risk level
    const data = chatState.userData;
    data.bmi = calculateBMI(data.beratBadan, data.tinggiBadan);
    data.bmiCategory = getBMICategory(data.bmi);
    data.riskLevel = calculateDiabetesRisk(data);
    
    // Add timestamp
    data.timestamp = Date.now();
    
    // Save result and redirect
    saveResult(data);
}

function saveResult(data) {
    try {
        // Save to localStorage first as backup
        localStorage.setItem('diabetesResult', JSON.stringify(data));
        
        // Save to history
        let history = JSON.parse(localStorage.getItem('diabetesHistory') || '[]');
        
        // Add new result to beginning of history
        history.unshift(data);
        
        // Keep only the last 50 entries
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        // Save updated history
        localStorage.setItem('diabetesHistory', JSON.stringify(history));
        
        // Redirect to result page
        window.location.href = 'result.html';
    } catch (error) {
        console.error('Error saving result:', error);
        showError("Terjadi kesalahan saat menyimpan data. Mohon coba lagi.");
    }
}

// Error handling
function showError(message) {
    const errorDiv = document.getElementById('errorMessage') || createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function createErrorDiv() {
    const div = document.createElement('div');
    div.id = 'errorMessage';
    div.className = 'error-message';
    document.body.appendChild(div);
    return div;
}

function calculateBMI(weight, height) {
    height = height / 100; // Convert cm to m
    return weight / (height * height);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return "Berat Badan Kurang";
    if (bmi < 25) return "Berat Badan Normal";
    if (bmi < 30) return "Berat Badan Lebih";
    return "Obesitas";
}

function getBloodSugarCategory(bloodSugar) {
    if (bloodSugar < 100) return "Normal";
    if (bloodSugar < 126) return "Prediabetes";
    return "Diabetes";
}

function getBloodPressureCategory(bloodPressure) {
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);
    if (systolic < 120 && diastolic < 80) return "Normal";
    return "Tinggi";
}

function getAgeRiskCategory(age) {
    if (age < 40) return "Rendah";
    if (age < 60) return "Sedang";
    return "Tinggi";
}

function calculateDiabetesRisk(data) {
    let riskScore = 0;
    
    // BMI Risk
    if (data.bmi >= 30) riskScore += 3;
    else if (data.bmi >= 25) riskScore += 2;
    
    // Age Risk
    if (data.usia >= 60) riskScore += 3;
    else if (data.usia >= 40) riskScore += 2;
    
    // Blood Sugar Risk
    if (data.gulaDarah >= 126) riskScore += 4;
    else if (data.gulaDarah >= 100) riskScore += 2;
    
    // Family History Risk
    if (data.riwayatKeluarga === "Ya") riskScore += 3;
    
    // Physical Activity Risk
    if (data.olahraga === "Tidak pernah") riskScore += 2;
    else if (data.olahraga === "1-2 kali") riskScore += 1;
    
    // Blood Pressure Risk
    const [systolic, diastolic] = data.tekananDarah.split('/').map(Number);
    if (systolic >= 140 || diastolic >= 90) riskScore += 2;
    
    // Determine Risk Level
    if (riskScore >= 10) return "Sangat Tinggi";
    if (riskScore >= 7) return "Tinggi";
    if (riskScore >= 4) return "Sedang";
    return "Rendah";
}

function getRecommendations(data, riskLevel) {
    let recommendations = [];
    
    // BMI-based recommendations
    if (data.bmi < 18.5) {
        recommendations.push({
            category: "Berat Badan",
            text: "Tingkatkan asupan kalori sehat dan konsultasikan dengan ahli gizi untuk mencapai berat badan ideal."
        });
    } else if (data.bmi >= 25) {
        recommendations.push({
            category: "Berat Badan",
            text: "Kurangi asupan kalori dan tingkatkan aktivitas fisik untuk mencapai berat badan ideal."
        });
    }
    
    // Blood sugar recommendations
    if (data.gulaDarah >= 100) {
        recommendations.push({
            category: "Gula Darah",
            text: "Pantau kadar gula darah secara teratur dan batasi konsumsi makanan tinggi gula."
        });
    }
    
    // Physical activity recommendations
    if (data.olahraga === "Tidak pernah" || data.olahraga === "1-2 kali") {
        recommendations.push({
            category: "Aktivitas Fisik",
            text: "Tingkatkan aktivitas fisik minimal 30 menit per hari, 5 kali seminggu."
        });
    }
    
    // Blood pressure recommendations
    const [systolic, diastolic] = data.tekananDarah.split('/').map(Number);
    if (systolic >= 130 || diastolic >= 80) {
        recommendations.push({
            category: "Tekanan Darah",
            text: "Kurangi konsumsi garam, kelola stres, dan konsultasikan dengan dokter."
        });
    }
    
    // Risk level specific recommendations
    if (riskLevel === "Tinggi" || riskLevel === "Sangat Tinggi") {
        recommendations.push({
            category: "Konsultasi Medis",
            text: "Segera konsultasikan kondisi Anda dengan dokter untuk pemeriksaan lebih lanjut."
        });
    }
    
    // General recommendations
    recommendations.push({
        category: "Pola Makan",
        text: "Konsumsi makanan seimbang dengan banyak sayur dan buah."
    });
    
    if (data.riwayatKeluarga === "Ya") {
        recommendations.push({
            category: "Pemeriksaan Rutin",
            text: "Lakukan pemeriksaan gula darah secara rutin karena adanya riwayat diabetes dalam keluarga."
        });
    }
    
    return recommendations;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initChat();
    
    // Setup enter key listener for text input
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserInput();
            }
        });
    }
});
