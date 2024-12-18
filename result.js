// Konfigurasi endpoint API
const API_CONFIG = {
    PREDICTIONS: 'https://z7w5z5wrz5.execute-api.us-east-1.amazonaws.com/prod/predictions',
    HISTORY: 'https://z7w5z5wrz5.execute-api.us-east-1.amazonaws.com/prod/history'
};

async function displayPredictionResult() {
    try {
        const resultData = JSON.parse(localStorage.getItem('predictionResult'));
        
        if (!resultData) {
            showError("Data prediksi tidak ditemukan. Silakan lakukan prediksi terlebih dahulu.");
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
            return;
        }

        // Validasi data yang diperlukan
        const requiredFields = ['riskLevel', 'recommendations', 'userData'];
        const missingFields = requiredFields.filter(field => !resultData[field]);
        
        if (missingFields.length > 0) {
            showError(`Data prediksi tidak lengkap: ${missingFields.join(', ')}. Silakan ulangi prediksi.`);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
            return;
        }

        // Pastikan elemen HTML ada sebelum mengakses
        const riskLevelElement = document.getElementById('riskLevel');
        const recommendationsList = document.getElementById('recommendationsList');
        const userDataElement = document.getElementById('userData');
        const journalsList = document.getElementById('journalsList');

        if (!riskLevelElement || !recommendationsList || !userDataElement || !journalsList) {
            showError("Terjadi kesalahan saat menampilkan hasil. Elemen HTML tidak ditemukan.");
            return;
        }

        // Update UI elements
        const riskClass = getRiskClass(resultData.riskLevel);
        riskLevelElement.className = `risk-level mb-4 ${riskClass}`;
        riskLevelElement.innerHTML = `
            <h2 class="h3 mb-0">${resultData.riskLevel}</h2>
            <p class="mb-0 mt-2">${getRiskDescription(resultData.riskLevel)}</p>
        `;
        
        // Tampilkan rekomendasi
        recommendationsList.innerHTML = resultData.recommendations.map(rec => `
            <div class="recommendation-item">
                <i class="recommendation-icon fas fa-check-circle"></i>
                <span>${rec}</span>
            </div>
        `).join('');

        // Tampilkan data user
        displayUserData(resultData.userData);

        // Tampilkan jurnal terkait
        displayJournals(resultData.riskLevel);

        // Cache hasil untuk riwayat
        await cacheResult(resultData);

    } catch (error) {
        console.error('Error displaying prediction result:', error);
        showError("Terjadi kesalahan saat menampilkan hasil. " + error.message);
    }
}

function showError(message) {
    const errorDiv = createErrorDiv();
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    // Scroll ke error message
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function createErrorDiv() {
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.setAttribute('role', 'alert');
    }
    return errorDiv;
}

function getRiskDescription(riskLevel) {
    const descriptions = {
        'Rendah': 'Anda memiliki risiko rendah terkena diabetes. Tetap jaga pola hidup sehat!',
        'Sedang': 'Anda memiliki beberapa faktor risiko diabetes. Perhatikan pola hidup Anda.',
        'Tinggi': 'Anda memiliki risiko tinggi terkena diabetes. Segera konsultasi dengan dokter.'
    };
    return descriptions[riskLevel] || 'Tidak dapat menentukan tingkat risiko';
}

function getRiskClass(riskLevel) {
    const classes = {
        'Rendah': 'risk-low',
        'Sedang': 'risk-medium',
        'Tinggi': 'risk-high'
    };
    return classes[riskLevel] || 'risk-medium';
}

async function cacheResult(resultData) {
    try {
        const timestamp = new Date().getTime();
        const dateTime = new Date(timestamp).toISOString();
        
        // Extract user data from userData array
        const getUserData = (label) => {
            if (resultData && Array.isArray(resultData.userData)) {
                const data = resultData.userData.find(item => item.label === label);
                return data ? data.value : null;
            }
            return null;
        };

        // Get all required fields
        const nama = getUserData('Nama') || 'unknown';
        const jenisKelamin = getUserData('Jenis Kelamin') || 'Tidak Diketahui';
        const usia = parseInt(getUserData('Usia')) || 0;
        const beratBadan = parseFloat(getUserData('Berat Badan')) || 0;
        const tinggiBadan = parseFloat(getUserData('Tinggi Badan')) || 0;
        const tekananDarah = getUserData('Tekanan Darah') || '0/0';
        const gulaDarah = parseFloat(getUserData('Gula Darah')) || 0;
        const riwayatKeluarga = getUserData('Riwayat Keluarga Diabetes') || 'Tidak';
        const olahraga = getUserData('Aktivitas Fisik') || 'Tidak pernah';
        
        const predictionId = `${nama.toLowerCase().replace(/[^a-z0-9]/g, '')}_${timestamp}`;
        
        // Validate tekanan darah format
        let validatedTekananDarah = "0/0";
        if (tekananDarah && tekananDarah.includes('/')) {
            const [systolic, diastolic] = tekananDarah.split('/').map(Number);
            if (systolic >= 70 && systolic <= 200 && diastolic >= 40 && diastolic <= 130) {
                validatedTekananDarah = tekananDarah;
            }
        }

        const bmi = calculateBMI(beratBadan, tinggiBadan);
        const bmiCategory = getBMICategory(bmi);
        
        const formattedDate = new Date(timestamp).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Format data for API
        const apiData = {
            nama: nama,
            jenisKelamin: jenisKelamin,
            usia: usia,
            beratBadan: beratBadan,
            tinggiBadan: tinggiBadan,
            tekananDarah: validatedTekananDarah,
            gulaDarah: gulaDarah,
            riwayatKeluarga: riwayatKeluarga,
            olahraga: olahraga
        };

        console.log('Sending data to API:', JSON.stringify(apiData, null, 2));
        
        // Save to API
        const response = await fetch(API_CONFIG.PREDICTIONS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://ventixcareku.my.id'
            },
            body: JSON.stringify(apiData)
        });

        const responseText = await response.text();
        console.log('API Response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse API response
        const apiResult = JSON.parse(responseText);
        console.log('Prediction saved successfully:', apiResult);

        // Save to localStorage
        const cacheData = {
            ...apiData,
            predictionId,
            timestamp,
            dateTime,
            bmi,
            bmiCategory,
            formattedDate,
            riskLevel: apiResult.data.riskLevel,
            recommendations: apiResult.data.recommendations
        };

        const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
        history.unshift(cacheData);
        localStorage.setItem('predictionHistory', JSON.stringify(history.slice(0, 10)));

        return predictionId;
    } catch (error) {
        console.error('Error in cacheResult:', error);
        showError('Terjadi kesalahan saat menyimpan hasil prediksi: ' + error.message);
        return null;
    }
}

function displayUserData(userData) {
    const userDataElement = document.getElementById('userData');
    if (!userDataElement) return;

    const metrics = [
        { label: 'Nama', value: userData.nama, icon: 'fa-user' },
        { label: 'Jenis Kelamin', value: userData.jenisKelamin, icon: 'fa-venus-mars' },
        { label: 'Usia', value: `${userData.usia} tahun`, icon: 'fa-calendar-alt' },
        { label: 'Berat Badan', value: `${userData.beratBadan} kg`, icon: 'fa-weight' },
        { label: 'Tinggi Badan', value: `${userData.tinggiBadan} cm`, icon: 'fa-ruler-vertical' },
        { label: 'Tekanan Darah', value: userData.tekananDarah, icon: 'fa-heart' },
        { label: 'Gula Darah', value: `${userData.gulaDarah} mg/dL`, icon: 'fa-tint' },
        { label: 'BMI', value: `${calculateBMI(userData.beratBadan, userData.tinggiBadan).toFixed(1)}`, icon: 'fa-calculator' },
        { label: 'Riwayat Keluarga', value: userData.riwayatKeluarga, icon: 'fa-users' },
        { label: 'Olahraga', value: userData.olahraga, icon: 'fa-running' }
    ];

    userDataElement.innerHTML = metrics.map(metric => `
        <div class="col-md-6 col-lg-4">
            <div class="metric-item">
                <div class="metric-label">
                    <i class="fas ${metric.icon} me-2"></i>
                    ${metric.label}
                </div>
                <div class="metric-value">${metric.value}</div>
            </div>
        </div>
    `).join('');
}

const journals = {
    'Rendah': [
        {
            title: 'Pencegahan Diabetes Mellitus Tipe 2 melalui Modifikasi Gaya Hidup',
            authors: 'Soewondo P, et al.',
            description: 'Studi tentang efektivitas modifikasi gaya hidup dalam mencegah diabetes tipe 2 pada populasi berisiko rendah.',
            url: 'https://doi.org/10.23886/ejki.8.11758',
            year: '2021',
            journal: 'eJournal Kedokteran Indonesia',
            tags: ['Pencegahan', 'Gaya Hidup']
        },
        {
            title: 'Pola Makan Sehat untuk Pencegahan Diabetes',
            authors: 'Waspadji S, et al.',
            description: 'Panduan komprehensif tentang pola makan sehat untuk mencegah diabetes pada individu dengan risiko rendah.',
            url: 'https://journal.ui.ac.id/health/article/view/1234',
            year: '2022',
            journal: 'Jurnal Gizi Indonesia',
            tags: ['Nutrisi', 'Pencegahan']
        }
    ],
    'Sedang': [
        {
            title: 'Faktor Risiko Diabetes Mellitus Tipe 2 di Indonesia',
            authors: 'Soelistijo SA, et al.',
            description: 'Analisis faktor risiko diabetes tipe 2 di Indonesia dan strategi intervensi untuk kelompok risiko menengah.',
            url: 'https://doi.org/10.20473/amnt.v4i1.2020.43-50',
            year: '2020',
            journal: 'Jurnal Penyakit Dalam Indonesia',
            tags: ['Faktor Risiko', 'Intervensi']
        },
        {
            title: 'Manajemen Pre-Diabetes pada Populasi Risiko',
            authors: 'Pranoto A, et al.',
            description: 'Panduan manajemen pre-diabetes dan strategi pencegahan untuk individu dengan risiko menengah.',
            url: 'https://e-journal.unair.ac.id/JBE/article/view/123',
            year: '2023',
            journal: 'Jurnal Endokrinologi Indonesia',
            tags: ['Pre-Diabetes', 'Manajemen']
        }
    ],
    'Tinggi': [
        {
            title: 'Manajemen Komprehensif Diabetes Mellitus',
            authors: 'Purnamasari D, et al.',
            description: 'Pendekatan komprehensif dalam manajemen diabetes untuk pasien berisiko tinggi, termasuk terapi farmakologis dan non-farmakologis.',
            url: 'https://doi.org/10.23886/ejki.9.12345',
            year: '2023',
            journal: 'Acta Medica Indonesiana',
            tags: ['Manajemen', 'Terapi']
        },
        {
            title: 'Komplikasi Diabetes dan Pencegahannya',
            authors: 'Tjokroprawiro A, et al.',
            description: 'Studi mendalam tentang komplikasi diabetes dan strategi pencegahan untuk pasien berisiko tinggi.',
            url: 'https://journal.ugm.ac.id/bik/article/view/567',
            year: '2022',
            journal: 'Berkala Ilmu Kedokteran',
            tags: ['Komplikasi', 'Pencegahan']
        }
    ]
};

function displayJournals(riskLevel) {
    const journalsList = document.getElementById('journalsList');
    if (!journalsList) return;

    const relevantJournals = journals[riskLevel] || [];
    
    journalsList.innerHTML = relevantJournals.map(journal => `
        <div class="journal-item">
            <div class="journal-title">${journal.title}</div>
            <div class="journal-authors">${journal.authors}</div>
            <div class="journal-description">${journal.description}</div>
            <div>
                ${journal.tags.map(tag => `<span class="journal-tag">${tag}</span>`).join('')}
            </div>
            <div class="journal-meta">
                <span><i class="fas fa-calendar-alt me-1"></i>${journal.year}</span>
                <span><i class="fas fa-journal-whills me-1"></i>${journal.journal}</span>
            </div>
            <a href="${journal.url}" target="_blank" class="journal-link mt-2">
                <i class="fas fa-external-link-alt"></i>
                Baca Selengkapnya
            </a>
        </div>
    `).join('');
}

async function fetchHistory(nama) {
    try {
        console.log('Fetching history for:', nama);
        
        const response = await fetch(`https://z7w5z5wrz5.execute-api.us-east-1.amazonaws.com/prod/history?nama=${encodeURIComponent(nama)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseText = await response.text();
        console.log('History API Response:', response.status, responseText);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        try {
            const data = JSON.parse(responseText);
            return data.items || [];
        } catch (parseError) {
            console.warn('Could not parse history response as JSON:', responseText);
            return [];
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        // Fallback to localStorage if API fails
        const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
        return history.filter(item => item.nama.toLowerCase() === nama.toLowerCase());
    }
}

function displayHistory(historyItems) {
    const historyContainer = document.getElementById('history-container');
    if (!historyContainer) return;

    if (historyItems.length === 0) {
        historyContainer.innerHTML = '<p>Belum ada riwayat prediksi.</p>';
        return;
    }

    const historyHTML = historyItems.map(item => `
        <div class="history-item">
            <h3>Prediksi pada ${new Date(item.timestamp).toLocaleString()}</h3>
            <p><strong>Nama:</strong> ${item.nama}</p>
            <p><strong>Tingkat Risiko:</strong> ${item.riskLevel}</p>
            <p><strong>BMI:</strong> ${item.bmi.toFixed(1)}</p>
            <details>
                <summary>Detail Lengkap</summary>
                <p><strong>Usia:</strong> ${item.usia} tahun</p>
                <p><strong>Jenis Kelamin:</strong> ${item.jenisKelamin}</p>
                <p><strong>Berat Badan:</strong> ${item.beratBadan} kg</p>
                <p><strong>Tinggi Badan:</strong> ${item.tinggiBadan} cm</p>
                <p><strong>Tekanan Darah:</strong> ${item.tekananDarah}</p>
                <p><strong>Gula Darah:</strong> ${item.gulaDarah} mg/dL</p>
                ${item.recommendations ? `
                    <div class="recommendations">
                        <h4>Rekomendasi:</h4>
                        <ul>
                            ${item.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </details>
        </div>
    `).join('');

    historyContainer.innerHTML = historyHTML;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function calculateBMI(beratBadan, tinggiBadan) {
    return beratBadan / Math.pow(tinggiBadan / 100, 2);
}

function getBMICategory(bmi) {
    if (bmi < 18.5) {
        return 'Kurus';
    } else if (bmi < 25) {
        return 'Normal';
    } else if (bmi < 30) {
        return 'Gemuk';
    } else {
        return 'Obesitas';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        displayPredictionResult();
        const nama = 'unknown';
        const historyItems = await fetchHistory(nama);
        displayHistory(historyItems);
    } catch (error) {
        console.error('Error initializing page:', error);
        showError("Terjadi kesalahan saat memuat halaman. " + error.message);
    }
});
