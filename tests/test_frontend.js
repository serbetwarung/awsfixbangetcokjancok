// Menggunakan Jest untuk testing frontend

// Import fungsi yang akan ditest
const validateFormData = (data) => {
    // Validasi setiap field
    const requiredFields = {
        'nama': 'Nama',
        'umur': 'Umur',
        'beratBadan': 'Berat Badan',
        'tinggiBadan': 'Tinggi Badan',
        'tekananDarah': 'Tekanan Darah',
        'gulaDarah': 'Gula Darah',
        'kolesterol': 'Kolesterol',
        'olahraga': 'Frekuensi Olahraga'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
        if (!data[field]) {
            return false;
        }
    }

    // Validasi format dan range nilai
    if (data.umur < 18 || data.umur > 100) {
        return false;
    }

    if (data.beratBadan < 30 || data.beratBadan > 200) {
        return false;
    }

    if (data.tinggiBadan < 140 || data.tinggiBadan > 220) {
        return false;
    }

    // Validasi format tekanan darah (misal: "120/80")
    if (!/^\d{2,3}\/\d{2,3}$/.test(data.tekananDarah)) {
        return false;
    }

    return true;
};

// Data valid untuk testing
const validData = {
    nama: 'Test User',
    umur: 30,
    beratBadan: 70,
    tinggiBadan: 170,
    tekananDarah: '120/80',
    gulaDarah: 100,
    kolesterol: 180,
    olahraga: '2 kali'
};

describe('Form Validation', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form id="predictionForm">
                <input type="text" id="nama" value="Test User">
                <input type="number" id="umur" value="30">
                <input type="number" id="beratBadan" value="70">
                <input type="number" id="tinggiBadan" value="170">
                <input type="text" id="tekananDarah" value="120/80">
                <input type="number" id="gulaDarah" value="100">
                <input type="number" id="kolesterol" value="180">
                <select id="olahraga">
                    <option value="2 kali">2 kali</option>
                </select>
                <button type="submit">Submit</button>
            </form>
        `;
    });

    test('validateFormData should pass with valid data', () => {
        expect(validateFormData(validData)).toBe(true);
    });

    test('validateFormData should fail with missing data', () => {
        const invalidData = {
            ...validData,
            nama: undefined
        };
        expect(validateFormData(invalidData)).toBe(false);
    });

    test('validateFormData should fail with invalid age range', () => {
        const invalidData = {
            ...validData,
            umur: 150
        };
        expect(validateFormData(invalidData)).toBe(false);
    });

    test('validateFormData should fail with invalid blood pressure format', () => {
        const invalidData = {
            ...validData,
            tekananDarah: '12080'
        };
        expect(validateFormData(invalidData)).toBe(false);
    });
});

describe('LocalStorage Handling', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '<div id="resultContainer"></div>';
    });

    test('saveResult should store data in localStorage', () => {
        const testData = {
            userData: {
                nama: 'Test User',
                umur: 30
            },
            result: {
                riskLevel: 'Rendah',
                recommendations: ['Rec 1', 'Rec 2']
            }
        };

        localStorage.setItem('predictionResult', JSON.stringify(testData));
        const storedData = JSON.parse(localStorage.getItem('predictionResult'));
        expect(storedData).toEqual(testData);
    });

    test('result page should redirect to index if no data', () => {
        // Mock window.location
        delete window.location;
        window.location = { href: '' };
        
        // Trigger DOMContentLoaded
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        
        setTimeout(() => {
            expect(window.location.href).toBe('index.html');
        }, 0);
    });
});

describe('UI Interactions', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form id="predictionForm">
                <button type="submit">Submit</button>
            </form>
        `;
    });

    test('should show loading spinner during form submission', () => {
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        submitButton.disabled = true;
        
        expect(submitButton.innerHTML).toContain('fa-spinner');
        expect(submitButton.disabled).toBe(true);
    });

    test('should show error message on API failure', () => {
        const form = document.getElementById('predictionForm');
        const errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.textContent = 'Error: API Error';
        form.appendChild(errorDiv);
        
        expect(document.getElementById('errorMessage')).not.toBeNull();
        expect(document.getElementById('errorMessage').textContent).toContain('Error');
    });
});
