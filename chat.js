document.addEventListener('DOMContentLoaded', function() {
    const chatWidget = document.getElementById('chatWidget');
    const toggleChat = document.getElementById('toggleChat');
    const minimizeChat = document.getElementById('minimizeChat');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendMessage = document.getElementById('sendMessage');

    let isMinimized = true;

    // Toggle chat widget
    toggleChat.addEventListener('click', () => {
        isMinimized = !isMinimized;
        chatWidget.style.display = isMinimized ? 'none' : 'flex';
    });

    minimizeChat.addEventListener('click', () => {
        isMinimized = true;
        chatWidget.style.display = 'none';
    });

    // Send message function
    async function sendMessageToBot() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        userInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        try {
            const response = await fetch('https://ytn982zmy4.execute-api.us-east-1.amazonaws.com/prod/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                })
            });

            const data = await response.json();
            
            // Hide typing indicator
            hideTypingIndicator();

            // Add bot response to chat
            addMessage(data.message, 'bot');
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            addMessage('Maaf, terjadi kesalahan. Silakan coba lagi nanti.', 'bot');
        }
    }

    // Add message to chat
    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        typingDiv.id = 'typingIndicator';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Event listeners
    sendMessage.addEventListener('click', sendMessageToBot);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageToBot();
        }
    });
});
