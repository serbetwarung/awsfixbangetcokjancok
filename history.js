document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Loading history page...');
        loadHistory();
        setupEventListeners();
        console.log('History page loaded successfully');
    } catch (error) {
        console.error('Error loading history:', error);
        showError('Terjadi kesalahan saat memuat riwayat');
    }
});

function setupEventListeners() {
    try {
        const searchInput = document.getElementById('searchInput');
        const riskFilter = document.getElementById('riskFilter');
        const sortOption = document.getElementById('sortOption');

        if (searchInput) searchInput.addEventListener('input', filterHistory);
        if (riskFilter) riskFilter.addEventListener('change', filterHistory);
        if (sortOption) sortOption.addEventListener('change', filterHistory);
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

function loadHistory() {
    try {
        console.log('Fetching history from localStorage...');
        const history = JSON.parse(localStorage.getItem('diabetesHistory') || '[]');
        console.log(`Found ${history.length} history items`);
        displayHistory(history);
    } catch (error) {
        console.error('Error loading history data:', error);
        showError('Terjadi kesalahan saat memuat data riwayat');
    }
}

function displayHistory(history) {
    try {
        const historyList = document.getElementById('historyList');
        const noData = document.getElementById('noData');

        if (!historyList || !noData) {
            console.error('Required elements not found');
            return;
        }

        if (!Array.isArray(history) || history.length === 0) {
            historyList.style.display = 'none';
            noData.style.display = 'block';
            return;
        }

        historyList.style.display = 'block';
        noData.style.display = 'none';
        historyList.innerHTML = '';

        history.forEach((item, index) => {
            if (!item || !item.timestamp) {
                console.warn('Invalid history item found:', item);
                return;
            }

            const date = new Date(item.timestamp);
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="date">
                    <i class="far fa-calendar"></i>
                    ${date.toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
                <div class="name">${item.nama || 'Tanpa Nama'}</div>
                <div class="details">
                    <div class="detail-item">
                        <i class="fas fa-weight"></i>
                        BMI: ${(item.bmi || 0).toFixed(1)}
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-tint"></i>
                        Gula Darah: ${item.gulaDarah || 'N/A'} mg/dL
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-heartbeat"></i>
                        Tekanan Darah: ${item.tekananDarah || 'N/A'}
                    </div>
                </div>
                <div class="risk-badge risk-${(item.riskLevel || 'tidak-diketahui').toLowerCase().replace(' ', '-')}">
                    ${item.riskLevel || 'Tidak Diketahui'}
                </div>
            `;
            
            historyItem.addEventListener('click', () => viewDetails(index));
            historyList.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error displaying history:', error);
        showError('Terjadi kesalahan saat menampilkan riwayat');
    }
}

function filterHistory() {
    try {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const riskLevel = document.getElementById('riskFilter')?.value || '';
        const sortOption = document.getElementById('sortOption')?.value || 'date-desc';

        let history = JSON.parse(localStorage.getItem('diabetesHistory') || '[]');

        history = history.filter(item => 
            item && item.nama && 
            item.nama.toLowerCase().includes(searchTerm) &&
            (riskLevel === '' || item.riskLevel === riskLevel)
        );

        history.sort((a, b) => {
            if (!a || !b) return 0;
            
            switch(sortOption) {
                case 'date-desc':
                    return (b.timestamp || 0) - (a.timestamp || 0);
                case 'date-asc':
                    return (a.timestamp || 0) - (b.timestamp || 0);
                case 'name-asc':
                    return (a.nama || '').localeCompare(b.nama || '');
                case 'name-desc':
                    return (b.nama || '').localeCompare(a.nama || '');
                default:
                    return 0;
            }
        });

        displayHistory(history);
    } catch (error) {
        console.error('Error filtering history:', error);
        showError('Terjadi kesalahan saat memfilter riwayat');
    }
}

function viewDetails(index) {
    try {
        const history = JSON.parse(localStorage.getItem('diabetesHistory') || '[]');
        const item = history[index];
        
        if (!item) {
            console.error('History item not found');
            return;
        }

        localStorage.setItem('diabetesResult', JSON.stringify(item));
        window.location.href = 'result.html';
    } catch (error) {
        console.error('Error viewing details:', error);
        showError('Terjadi kesalahan saat membuka detail');
    }
}

function clearHistory() {
    try {
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        deleteModal.show();
    } catch (error) {
        console.error('Error showing delete modal:', error);
        showError('Terjadi kesalahan saat membuka dialog hapus');
    }
}

function confirmClearHistory() {
    try {
        localStorage.removeItem('diabetesHistory');
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        if (deleteModal) {
            deleteModal.hide();
        }
        loadHistory();
    } catch (error) {
        console.error('Error clearing history:', error);
        showError('Terjadi kesalahan saat menghapus riwayat');
    }
}

function showError(message) {
    const historyList = document.getElementById('historyList');
    if (historyList) {
        historyList.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>
        `;
    }
}
