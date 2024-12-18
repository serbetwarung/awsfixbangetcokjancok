const API_ENDPOINT = 'https://oy6b1k8t66.execute-api.us-east-1.amazonaws.com/prod';

function displayResult(result) {
    if (!result || !result.nama) {
        console.warn('No result data found');
        return;
    }

    // Display patient name
    document.getElementById('patientName').textContent = result.nama;

    // Display BMI
    const bmiValue = document.getElementById('bmiValue');
    const bmiCategory = document.getElementById('bmiCategory');
    const bmiIndicator = document.getElementById('bmiIndicator');

    if (result.bmi) {
        bmiValue.textContent = result.bmi;
        const category = getBMICategory(parseFloat(result.bmi));
        bmiCategory.textContent = `Kategori: ${category}`;
        bmiCategory.className = `bmi-category ${getBMICategoryClass(category)}`;
        
        // Set BMI indicator position
        const position = ((parseFloat(result.bmi) - 18.5) / (30 - 18.5)) * 100;
        bmiIndicator.style.left = `${Math.min(Math.max(position, 0), 100)}%`;
    }

    // Display health metrics
    if (result.tinggiBadan) document.getElementById('heightValue').textContent = `${result.tinggiBadan} cm`;
    if (result.beratBadan) document.getElementById('weightValue').textContent = `${result.beratBadan} kg`;
    if (result.olahraga) document.getElementById('activityValue').textContent = getActivityLevel(result.olahraga);

    // Calculate and display risk level
    const riskLevel = calculateRiskLevel(result);
    const riskLevelElement = document.getElementById('riskLevel');
    const riskDescription = document.getElementById('riskDescription');
    
    riskLevelElement.textContent = riskLevel;
    riskLevelElement.className = `risk-level-card ${getRiskClass(riskLevel)}`;
    riskDescription.textContent = getRiskDescription(riskLevel);

    // Display recommendations
    const recommendationsContainer = document.getElementById('recommendations');
    const recommendations = getRecommendations(result, riskLevel);
    if (recommendationsContainer) {
        recommendations.forEach(rec => {
            const recElement = document.createElement('div');
            recElement.className = 'recommendation-item';
            recElement.innerHTML = `
                <i class="fas ${rec.icon}"></i>
                <div class="recommendation-text">${rec.text}</div>
            `;
            recommendationsContainer.appendChild(recElement);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Get data from URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const userData = Object.fromEntries(urlParams);

        // Calculate BMI if height and weight are present
        if (userData.tinggiBadan && userData.beratBadan) {
            const height_m = userData.tinggiBadan / 100;
            const bmi = userData.beratBadan / (height_m * height_m);
            userData.bmi = bmi.toFixed(1);
        }

        // Add timestamp
        userData.timestamp = new Date().toISOString();

        // Save to localStorage for history
        localStorage.setItem('diabetesResult', JSON.stringify(userData));

        // Display the result
        displayResult(userData);
        saveToHistory(userData);
    } catch (error) {
        console.error('Error loading result:', error);
        showError('Terjadi kesalahan saat memuat hasil');
    }
});

async function saveToHistory(result) {
    try {
        if (!result || !result.nama) {
            console.warn('Invalid result data');
            return;
        }

        const userId = getUserId();
        const historyItem = {
            userId: userId,
            timestamp: new Date().toISOString(),
            nama: result.nama,
            jenisKelamin: result.jenisKelamin,
            usia: result.usia,
            beratBadan: result.beratBadan,
            tinggiBadan: result.tinggiBadan,
            tekananDarah: result.tekananDarah,
            gulaDarah: result.gulaDarah,
            riwayatKeluarga: result.riwayatKeluarga,
            olahraga: result.olahraga,
            bmi: result.bmi
        };

        const response = await fetch(`${API_ENDPOINT}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyItem)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('History saved successfully');
    } catch (error) {
        console.error('Error saving history:', error);
        showError('Terjadi kesalahan saat menyimpan riwayat');
    }
}

function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.role = 'alert';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
