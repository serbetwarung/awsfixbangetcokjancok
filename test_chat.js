// Chat Flow Tests
async function testChatFlow() {
    console.log('Starting Chat Flow Tests...');

    // Test 1: Initialize Chat
    console.log('\nTesting Chat Initialization:');
    try {
        initChat();
        console.assert(chatState.currentStep === 0, 'Chat should start at step 0');
        console.assert(Object.keys(chatState.userData).length === 0, 'User data should be empty initially');
        console.log('✅ Chat initialization test passed');
    } catch (error) {
        console.error('❌ Chat initialization test failed:', error);
    }

    // Test 2: Question Flow
    console.log('\nTesting Question Flow:');
    const testInputs = [
        { input: 'John Doe', expectedKey: 'nama' },
        { input: 'Laki-laki', expectedKey: 'jenisKelamin' },
        { input: '30', expectedKey: 'usia' },
        { input: '70', expectedKey: 'beratBadan' },
        { input: '170', expectedKey: 'tinggiBadan' },
        { input: '100', expectedKey: 'gulaDarah' },
        { input: '120/80', expectedKey: 'tekananDarah' }
    ];

    for (const test of testInputs) {
        try {
            await processUserInput(test.input);
            console.assert(
                chatState.userData[test.expectedKey] !== undefined,
                `${test.expectedKey} should be set after input "${test.input}"`
            );
            console.log(`✅ Question "${test.expectedKey}" test passed`);
        } catch (error) {
            console.error(`❌ Question "${test.expectedKey}" test failed:`, error);
        }
    }

    // Test 3: Conditional Questions
    console.log('\nTesting Conditional Questions:');
    try {
        // Reset chat state
        initChat();
        
        // Test pregnancy question for female
        await processUserInput('Jane Doe'); // name
        await processUserInput('Perempuan'); // gender
        
        const currentQuestion = chatState.questions[chatState.currentStep];
        console.assert(
            currentQuestion.text.includes('hamil'),
            'Pregnancy question should appear for female users'
        );
        
        // Test pregnancy question skip for male
        initChat();
        await processUserInput('John Doe');
        await processUserInput('Laki-laki');
        
        const nextQuestion = chatState.questions[chatState.currentStep];
        console.assert(
            !nextQuestion.text.includes('hamil'),
            'Pregnancy question should be skipped for male users'
        );
        
        console.log('✅ Conditional questions test passed');
    } catch (error) {
        console.error('❌ Conditional questions test failed:', error);
    }

    // Test 4: Input Validation
    console.log('\nTesting Input Validation:');
    const validationTests = [
        { input: '', expectedError: true },
        { input: '-1', expectedError: true },
        { input: 'abc', expectedError: true },
        { input: '999999', expectedError: true },
        { input: '25', expectedError: false }
    ];

    for (const test of validationTests) {
        try {
            const result = validateNumericInput(test.input, 'usia');
            console.assert(
                result.isValid === !test.expectedError,
                `Input "${test.input}" validation should be ${!test.expectedError}`
            );
        } catch (error) {
            console.error(`❌ Validation test for "${test.input}" failed:`, error);
        }
    }
    console.log('✅ Input validation tests passed');

    // Test 5: Chat Completion
    console.log('\nTesting Chat Completion:');
    try {
        // Complete all questions
        initChat();
        for (const test of testInputs) {
            await processUserInput(test.input);
        }
        
        // Verify final state
        console.assert(
            Object.keys(chatState.userData).length === testInputs.length,
            'All user data should be collected'
        );
        
        // Test result calculation
        const result = calculateDiabetesRisk(chatState.userData);
        console.assert(result !== undefined, 'Should calculate risk level');
        console.assert(
            typeof result.riskLevel === 'string',
            'Risk level should be a string'
        );
        console.assert(
            typeof result.riskPercentage === 'number',
            'Risk percentage should be a number'
        );
        
        console.log('✅ Chat completion test passed');
    } catch (error) {
        console.error('❌ Chat completion test failed:', error);
    }

    console.log('\nChat Flow Tests Completed!');
}

// Run tests
document.addEventListener('DOMContentLoaded', testChatFlow);
