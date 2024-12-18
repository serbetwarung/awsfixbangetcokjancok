// API Integration Tests
async function testAPIEndpoints() {
    console.log('Starting API Integration Tests...');

    const testCases = [
        {
            name: 'Prediction Endpoint',
            endpoint: API_CONFIG.PREDICTION,
            method: 'POST',
            body: {
                age: 25,
                gender: 'Male',
                bmi: 22,
                bloodSugar: 85,
                bloodPressure: '120/80'
            },
            expectedStatus: 200
        },
        {
            name: 'Chat Endpoint',
            endpoint: API_CONFIG.CHAT,
            method: 'POST',
            body: {
                user_id: 'test_user',
                message: 'Hello'
            },
            expectedStatus: 200
        },
        {
            name: 'History Endpoint',
            endpoint: API_CONFIG.HISTORY,
            method: 'GET',
            expectedStatus: 200
        }
    ];

    for (const test of testCases) {
        console.log(`\nTesting ${test.name}:`);
        try {
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const response = await fetch(test.endpoint, options);
            console.assert(
                response.status === test.expectedStatus,
                `Expected status ${test.expectedStatus}, got ${response.status}`
            );

            const data = await response.json();
            console.assert(data !== null, 'Response should contain valid JSON');

            console.log(`✅ ${test.name} test passed`);
        } catch (error) {
            console.error(`❌ ${test.name} test failed:`, error);
        }
    }
}

// Test retry mechanism
async function testRetryMechanism() {
    console.log('\nTesting Retry Mechanism:');
    
    const maxRetries = 3;
    let retryCount = 0;
    
    async function makeRequest() {
        try {
            const response = await fetch(API_CONFIG.CHAT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: 'test_user',
                    message: 'test message'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('✅ Request successful');
            return await response.json();
        } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`Retry attempt ${retryCount}...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                return makeRequest();
            }
            throw error;
        }
    }
    
    try {
        await makeRequest();
        console.log('✅ Retry mechanism test passed');
    } catch (error) {
        console.error('❌ Retry mechanism test failed:', error);
    }
}

// Test error handling
async function testErrorHandling() {
    console.log('\nTesting Error Handling:');
    
    const testCases = [
        {
            name: 'Invalid JSON',
            body: 'invalid json',
            expectedError: 'Invalid JSON'
        },
        {
            name: 'Missing Required Fields',
            body: {},
            expectedError: 'Missing required fields'
        },
        {
            name: 'Empty Message',
            body: { user_id: 'test_user', message: '' },
            expectedError: 'Message must be a non-empty string'
        }
    ];
    
    for (const test of testCases) {
        try {
            const response = await fetch(API_CONFIG.CHAT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: typeof test.body === 'string' ? test.body : JSON.stringify(test.body)
            });
            
            const data = await response.json();
            console.assert(
                data.error && data.error.includes(test.expectedError),
                `Expected error containing "${test.expectedError}"`
            );
            
            console.log(`✅ ${test.name} error handling test passed`);
        } catch (error) {
            console.error(`❌ ${test.name} error handling test failed:`, error);
        }
    }
}

// Run all tests
async function runAllTests() {
    await testAPIEndpoints();
    await testRetryMechanism();
    await testErrorHandling();
    console.log('\nAll API Integration Tests Completed!');
}

// Run tests when document is ready
document.addEventListener('DOMContentLoaded', runAllTests);
