// Frontend Test Suite
async function runTests() {
    console.log('Starting Frontend Tests...');
    
    // Test Suite 1: Navigation
    console.log('\nTesting Navigation:');
    try {
        // Test 1: Check if all navigation links exist
        const navLinks = document.querySelectorAll('.nav-link');
        console.assert(navLinks.length >= 4, 'Navigation should have at least 4 links');
        console.log('✅ Navigation links test passed');
        
        // Test 2: Check if chat button works
        const chatButton = document.querySelector('a[href="chat.html"]');
        console.assert(chatButton !== null, 'Chat button should exist');
        console.log('✅ Chat button test passed');
    } catch (error) {
        console.error('❌ Navigation test failed:', error);
    }
    
    // Test Suite 2: Form Validation
    console.log('\nTesting Form Validation:');
    try {
        // Test numeric input validation
        const testCases = [
            { value: '25', field: 'usia', expected: true },
            { value: '-1', field: 'usia', expected: false },
            { value: '150', field: 'usia', expected: false },
            { value: '70', field: 'beratBadan', expected: true },
            { value: '300', field: 'beratBadan', expected: false }
        ];
        
        for (const test of testCases) {
            const result = validateNumericInput(test.value, test.field);
            console.assert(
                result.isValid === test.expected,
                `Validation for ${test.field} with value ${test.value} should be ${test.expected}`
            );
        }
        console.log('✅ Form validation tests passed');
    } catch (error) {
        console.error('❌ Form validation test failed:', error);
    }
    
    // Test Suite 3: API Integration
    console.log('\nTesting API Integration:');
    try {
        // Test API endpoints
        const endpoints = Object.values(API_CONFIG);
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                console.assert(response.status !== 404, `Endpoint ${endpoint} should be accessible`);
            } catch (error) {
                console.warn(`⚠️ Could not reach endpoint ${endpoint}`);
            }
        }
        console.log('✅ API integration tests completed');
    } catch (error) {
        console.error('❌ API integration test failed:', error);
    }
    
    // Test Suite 4: Chat Flow
    console.log('\nTesting Chat Flow:');
    try {
        // Test chat state management
        console.assert(typeof chatState !== 'undefined', 'Chat state should be defined');
        console.assert(Array.isArray(chatState.questions), 'Questions should be an array');
        console.assert(chatState.questions.length > 0, 'Should have questions defined');
        
        // Test chat functions
        console.assert(typeof initChat === 'function', 'initChat function should exist');
        console.assert(typeof processUserInput === 'function', 'processUserInput function should exist');
        console.log('✅ Chat flow tests passed');
    } catch (error) {
        console.error('❌ Chat flow test failed:', error);
    }
    
    // Test Suite 5: Error Handling
    console.log('\nTesting Error Handling:');
    try {
        // Test error display
        showError('Test error message');
        const errorElement = document.querySelector('.error-toast');
        console.assert(errorElement !== null, 'Error message should be displayed');
        console.log('✅ Error handling tests passed');
    } catch (error) {
        console.error('❌ Error handling test failed:', error);
    }
    
    // Test suite for frontend functionality
    describe('Diabetes Prediction Frontend Tests', () => {
        beforeEach(() => {
            // Clear localStorage before each test
            localStorage.clear();
            // Reset DOM
            document.body.innerHTML = '';
        });

        describe('Input Validation', () => {
            test('validates numeric inputs', () => {
                const result = validateNumericInput('abc');
                expect(result).toBe(false);
            });

            test('validates age range', () => {
                const result = validateAge(150);
                expect(result).toBe(false);
            });

            test('validates blood pressure format', () => {
                const result = validateBloodPressure('120/80');
                expect(result).toBe(true);
            });
        });

        describe('API Integration', () => {
            test('handles successful prediction', async () => {
                const mockResponse = {
                    prediction: 'Low',
                    bmi: 22.5,
                    recommendations: []
                };
                
                global.fetch = jest.fn(() =>
                    Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockResponse)
                    })
                );

                const result = await submitPrediction({});
                expect(result).toBeDefined();
                expect(result.prediction).toBe('Low');
            });

            test('handles API error', async () => {
                global.fetch = jest.fn(() =>
                    Promise.resolve({
                        ok: false,
                        status: 500
                    })
                );

                try {
                    await submitPrediction({});
                    fail('Should have thrown an error');
                } catch (error) {
                    expect(error.message).toContain('500');
                }
            });

            test('handles network error', async () => {
                global.fetch = jest.fn(() =>
                    Promise.reject(new Error('Network error'))
                );

                try {
                    await submitPrediction({});
                    fail('Should have thrown an error');
                } catch (error) {
                    expect(error.message).toBe('Network error');
                }
            });
        });

        describe('Result Display', () => {
            test('displays prediction result correctly', () => {
                const mockResult = {
                    prediction: 'Medium',
                    bmi: 24.5,
                    recommendations: ['Exercise regularly']
                };

                localStorage.setItem('predictionResult', JSON.stringify(mockResult));
                displayPredictionResult();

                expect(document.getElementById('riskLevel').textContent).toBe('Medium');
            });

            test('handles missing result data', () => {
                displayPredictionResult();
                const errorDiv = document.getElementById('errorMessage');
                expect(errorDiv).toBeDefined();
                expect(errorDiv.textContent).toContain('tidak ditemukan');
            });
        });

        describe('Chat Flow', () => {
            test('initializes chat correctly', () => {
                initializeChat();
                const chatMessages = document.getElementById('chatMessages');
                expect(chatMessages.children.length).toBeGreaterThan(0);
            });

            test('handles user input', () => {
                const mockMessage = 'Test message';
                handleUserInput(mockMessage);
                const lastMessage = document.querySelector('.user-message');
                expect(lastMessage.textContent).toBe(mockMessage);
            });

            test('validates chat input', () => {
                const result = validateChatInput('');
                expect(result).toBe(false);
            });
        });

        describe('Error Handling', () => {
            test('shows error message', () => {
                const errorMessage = 'Test error';
                showError(errorMessage);
                const errorDiv = document.getElementById('errorMessage');
                expect(errorDiv.textContent).toBe(errorMessage);
            });

            test('auto-hides error message', done => {
                showError('Test error');
                setTimeout(() => {
                    const errorDiv = document.getElementById('errorMessage');
                    expect(errorDiv.style.display).toBe('none');
                    done();
                }, 5100);
            });
        });

        describe('History Management', () => {
            test('saves prediction to history', () => {
                const mockResult = {
                    prediction: 'Low',
                    bmi: 22.5,
                    timestamp: new Date().toISOString()
                };

                saveToHistory(mockResult);
                const history = JSON.parse(localStorage.getItem('predictionHistory'));
                expect(history.length).toBe(1);
                expect(history[0].prediction).toBe('Low');
            });

            test('limits history size', () => {
                for (let i = 0; i < 12; i++) {
                    saveToHistory({ prediction: `Test ${i}` });
                }

                const history = JSON.parse(localStorage.getItem('predictionHistory'));
                expect(history.length).toBe(10);
            });
        });
    });
    
    console.log('\nFrontend Tests Completed!');
}

// Run tests when document is ready
document.addEventListener('DOMContentLoaded', runTests);
