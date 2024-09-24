const apiKey = 'sk-svcacct-CMaeBCQHRQFZEPpkosPPuI34_R2rtgG1L6nuqsy_klx4a0iqrAg7vgo3y-5MxRLWfrAGZ1ADSOxT3BlbkFJRtJfiteqlUFWoLLVxyZEftL3RKGrYn5k7sHLf5GUFiDZC-CgyjbGO8TIBL7gQ3l5rzu2Cej0engA'; // Replace with your actual API key

// Add event listeners to prompts
document.querySelectorAll('.prompt').forEach(item => {
    item.addEventListener('click', () => {
        const query = item.getAttribute('data-query');
        document.getElementById('user-input').value = query; // Set the query in the input box
        sendMessage(); // Automatically send the message
    });
});

// Introduce a simple rate limit using a cooldown period (e.g., 5 seconds)
let canSendRequest = true;

async function sendMessage() {
    if (!canSendRequest) {
        alert('Please wait a few seconds before sending another request.');
        return;
    }

    const userInput = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');

    // Append user message to the chat window
    const userMessage = document.createElement('div');
    userMessage.textContent = userInput.value;
    userMessage.style.color = '#3498db';
    chatWindow.appendChild(userMessage);

    try {
        // Set cooldown to prevent too many requests
        canSendRequest = false;
        setTimeout(() => {
            canSendRequest = true;
        }, 5000); // 5 seconds cooldown

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: userInput.value }],
                max_tokens: 50, // Set a low token limit to conserve free tier usage
                n: 1,            // Request only one response
                stop: null,      // No stop sequences specified
                temperature: 0.7 // Control randomness; lower values make responses more focused
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        if (data.choices && data.choices.length > 0) {
            const botMessageContent = data.choices[0].message.content.trim();

            // Append bot response to the chat window
            const botMessage = document.createElement('div');
            botMessage.textContent = botMessageContent;
            botMessage.style.color = '#ecf0f1';
            chatWindow.appendChild(botMessage);

            // Show Yes/No buttons after GPT response
            askForResolution();
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Error:', error);

        // Display an error message if the API request fails
        const errorMessage = document.createElement('div');
        errorMessage.textContent = "Error fetching response: " + error.message;
        errorMessage.style.color = 'red';
        chatWindow.appendChild(errorMessage);
    }

    // Clear the input field
    userInput.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom of the chat window
}

// Function to show Yes/No options after GPT response
function askForResolution() {
    const chatWindow = document.getElementById('chat-window');

    // Show the yes/no buttons for the user to respond
    const resolutionPrompt = document.createElement('div');
    resolutionPrompt.innerHTML = `
        Did this resolve your issue? 
        <button id='yes-btn'>Yes</button> 
        <button id='no-btn'>No</button>
    `;
    chatWindow.appendChild(resolutionPrompt);

    // Attach event listeners to the Yes and No buttons
    document.getElementById('yes-btn').addEventListener('click', handleYesClick);
    document.getElementById('no-btn').addEventListener('click', handleNoClick);

    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Function to handle 'Yes' click
function handleYesClick() {
    const chatWindow = document.getElementById('chat-window');
    const thankYouMessage = document.createElement('div');
    thankYouMessage.textContent = 'Thank you! We are glad to have helped.';
    thankYouMessage.style.color = '#2ecc71';
    chatWindow.appendChild(thankYouMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Function to handle 'No' click
function handleNoClick() {
    const chatWindow = document.getElementById('chat-window');

    const retryMessage = document.createElement('div');
    retryMessage.textContent = 'Please describe the issue further:';
    retryMessage.style.color = '#e74c3c';
    chatWindow.appendChild(retryMessage);

    const inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'description-input');
    chatWindow.appendChild(inputBox);

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.id = 'submit-description';
    chatWindow.appendChild(submitButton);

    submitButton.addEventListener('click', () => {
        const descriptionInput = document.getElementById('description-input').value;
        submitNewTicket(descriptionInput);
    });

    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Function to submit a new ticket and add a row to the Excel file (Python)
async function submitNewTicket(issueDescription) {
    const ticketNumber = await getNewTicketNumber(); // Get a new ticket number (via Python or API)

    // Append new ticket information to the Excel file using Python
    const response = await fetch('https://8117-35-237-223-57.ngrok-free.app/add_ticket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ticketNumber: ticketNumber,
            issueDescription: issueDescription
        })
    });

    if (response.ok) {
        // Inform the user that the ticket has been created
        const chatWindow = document.getElementById('chat-window');
        const ticketMessage = document.createElement('div');
        ticketMessage.textContent = `A new Ticket has been created - Ticket no. ${ticketNumber}. Thank you!`;
        ticketMessage.style.color = '#2ecc71';
        chatWindow.appendChild(ticketMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
    } else {
        console.error('Error creating ticket.');
    }
}

// Mock function to get a new ticket number (should be replaced by Python logic)
async function getNewTicketNumber() {
    const randomTicketNumber = `1-${Math.floor(1000000000 + Math.random() * 9000000000)}`; // 10-digit ticket number
    return randomTicketNumber;
}
