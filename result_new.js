document.addEventListener('DOMContentLoaded', function() {
    try {
        const result = JSON.parse(localStorage.getItem('diabetesResult') || '{}');
        displayResult(result);
        saveToHistory(result);
    } catch (error) {
        console.error('Error loading result:', error);
        showError('Terjadi kesalahan saat memuat hasil');
    }
});

function displayResult(result) {
    try {
        // Display patient name
        document.getElementById('patientName').textContent = result.nama || 'Pasien';

        // Display BMI information
        const bmiValue = document.getElementById('bmiValue');
        const bmiCategory = document.getElementById('bmiCategory');
        const bmiIndicator = document.getElementById('bmiIndicator');
        
        if (bmiValue && result.bmi) {
            bmiValue.textContent = result.bmi.toFixed(1);
            
            let category = '';
            let position = '0%';
            
            if (result.bmi < 18.5) {
                category = 'Berat Badan Kurang';
                position = '0%';
            } else if (result.bmi < 25) {
                category = 'Berat Badan Normal';
                position = '33%';
            } else if (result.bmi < 30) {
                category = 'Berat Badan Lebih';
                position = '66%';
            } else {
                category = 'Obesitas';
                position = '100%';
            }
            
            if (bmiCategory) bmiCategory.textContent = category;
            if (bmiIndicator) bmiIndicator.style.left = position;
        }

        // Display health metrics
        document.getElementById('heightValue').textContent = `${result.tinggiBadan || 0} cm`;
        document.getElementById('weightValue').textContent = `${result.beratBadan || 0} kg`;
        document.getElementById('activityValue').textContent = result.aktivitasFisik || 'Tidak Ada Data';

        // Display risk level
        const riskLevel = document.getElementById('riskLevel');
        const riskDescription = document.getElementById('riskDescription');
        
        if (riskLevel && result.riskLevel) {
            riskLevel.textContent = result.riskLevel;
            riskLevel.className = `risk-level-card risk-${result.riskLevel.toLowerCase().replace(' ', '-')}`;
            
            // Set risk description based on risk level
            if (riskDescription) {
                switch(result.riskLevel.toLowerCase()) {
                    case 'rendah':
                        riskDescription.textContent = 'Anda memiliki risiko rendah terkena diabetes. Tetap jaga pola hidup sehat!';
                        break;
                    case 'sedang':
                        riskDescription.textContent = 'Anda memiliki beberapa faktor risiko diabetes. Perhatikan pola hidup Anda.';
                        break;
                    case 'tinggi':
                        riskDescription.textContent = 'Anda memiliki risiko tinggi diabetes. Konsultasikan dengan dokter untuk pencegahan.';
                        break;
                    case 'sangat tinggi':
                        riskDescription.textContent = 'Anda memiliki risiko sangat tinggi. Segera konsultasikan dengan dokter.';
                        break;
                    default:
                        riskDescription.textContent = 'Tidak dapat menentukan tingkat risiko.';
                }
            }
        }

        // Display recommendations
        displayRecommendations(result);

    } catch (error) {
        console.error('Error displaying result:', error);
        showError('Terjadi kesalahan saat menampilkan hasil');
    }
}

function displayRecommendations(result) {
    try {
        const recommendationsSection = document.getElementById('recommendationsSection');
        if (!recommendationsSection) return;

        let recommendations = [];

        // BMI-based recommendations
        if (result.bmi < 18.5) {
            recommendations.push({
                icon: 'utensils',
                title: 'Tingkatkan Asupan Nutrisi',
                text: 'Konsumsi makanan bergizi dan tinggi protein untuk mencapai berat badan ideal.'
            });
        } else if (result.bmi > 25) {
            recommendations.push({
                icon: 'weight',
                title: 'Kelola Berat Badan',
                text: 'Kurangi asupan kalori dan tingkatkan aktivitas fisik untuk menurunkan berat badan.'
            });
        }

        // Activity-based recommendations
        if (result.aktivitasFisik === 'Rendah') {
            recommendations.push({
                icon: 'running',
                title: 'Tingkatkan Aktivitas Fisik',
                text: 'Lakukan olahraga minimal 150 menit per minggu untuk kesehatan optimal.'
            });
        }

        // Risk level-based recommendations
        if (result.riskLevel) {
            const riskLevel = result.riskLevel.toLowerCase();
            if (riskLevel === 'tinggi' || riskLevel === 'sangat tinggi') {
                recommendations.push({
                    icon: 'user-md',
                    title: 'Konsultasi Medis',
                    text: 'Segera konsultasikan kondisi Anda dengan dokter untuk penanganan lebih lanjut.'
                });
            }
        }

        // Add general recommendations
        recommendations.push({
            icon: 'apple-alt',
            title: 'Pola Makan Sehat',
            text: 'Konsumsi makanan seimbang dengan banyak sayur dan buah.'
        });

        // Display recommendations
        let recommendationsHTML = `
            <h3 class="mb-4">
                <i class="fas fa-clipboard-list me-2"></i>
                Rekomendasi Khusus
            </h3>
            <div class="recommendations-grid">
        `;

        recommendations.forEach(rec => {
            recommendationsHTML += `
                <div class="recommendation-card">
                    <div class="rec-icon">
                        <i class="fas fa-${rec.icon}"></i>
                    </div>
                    <h4>${rec.title}</h4>
                    <p>${rec.text}</p>
                </div>
            `;
        });

        recommendationsHTML += '</div>';
        recommendationsSection.innerHTML = recommendationsHTML;

    } catch (error) {
        console.error('Error displaying recommendations:', error);
        showError('Terjadi kesalahan saat menampilkan rekomendasi');
    }
}

function saveToHistory(result) {
    try {
        if (!result || !result.timestamp) {
            console.warn('Invalid result data');
            return;
        }

        let history = JSON.parse(localStorage.getItem('diabetesHistory') || '[]');
        
        // Check if this result already exists in history
        const existingIndex = history.findIndex(item => item.timestamp === result.timestamp);
        
        if (existingIndex === -1) {
            // Add new result to history
            history.unshift(result);
            
            // Keep only the last 50 entries
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('diabetesHistory', JSON.stringify(history));
            console.log('Result saved to history');
        }
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

function showError(message) {
    const container = document.querySelector('.result-container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${message}
            </div>
        `;
    }
}
