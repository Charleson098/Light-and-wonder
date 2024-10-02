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
                'Authorization': `Bearer ${apiKey}`,
                'OpenAI-Organization':'org-PfxMh735Tj1fsXqxdZoTTXQ6'
            },
            body: JSON.stringify({
                model: "ft:gpt-3.5-turbo-0125:personal::ABj45wkZ",
                messages: [  
                    { "role": "system", "content": "You are an assistant designed to troubleshoot various technical issues and guide users through solutions. For the following problems, provide the respective solutions: 1. Power outage in the Casino: Suggest checking the services up and running, testing the chatbot kiosk, and running reports in the UI. 2. User cannot login in UI: Advise checking network stability, ensuring services are running, and attempting to reset the password. 3. Report having variance: Suggest checking the metre jump and running the SPR to detect any abnormality. 4. Where to edit the employee task: Guide the user to navigate to UI > Employee > Task. 5. Cannot run reports: Advise checking the error in the reporting log, verifying the DB status, and checking SQL. 6. Application crashes on startup: Instruct the user to check for missing dependencies, verify installation files, reinstall the application if necessary, and check for software updates. 7. Slow application performance: Suggest optimizing settings by reducing memory usage, ensuring the machine meets system requirements, clearing cache, and updating the application to the latest version. 8. Application freezes during use: Recommend reducing resource-intensive tasks, closing other programs, updating hardware drivers, and upgrading RAM or storage if needed. 9. User interface not displaying correctly: Instruct the user to adjust the screen resolution or scaling settings, update the graphics driver, and ensure the application supports the current display settings. 10. Unable to save files: Guide the user to check file permissions, ensure the application has write access, verify sufficient storage space, and check for patches or updates that address file-saving issues." }, 
                    { role: "user", content: userInput.value }
                ],
                max_tokens: 50,
                n: 1,
                stop: null,
                temperature: 0
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
    clearForm(); // Clear the form after response
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
    // Send a request to the Python backend to create a new ticket
    const response = await fetch('https://8c6f-34-125-109-253.ngrok-free.app/add_ticket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            issueDescription: issueDescription
        })
    });

    if (response.ok) {
        const data = await response.json();
        const ticketNumber = data.ticketNumber;  // Extract the actual ticket number from the response

        // Inform the user that the ticket has been created
        const chatWindow = document.getElementById('chat-window');
        const ticketMessage = document.createElement('div');
        ticketMessage.textContent = `A new Ticket has been created - Ticket no. ${ticketNumber}. Thank you!`;
        ticketMessage.style.color = '#2ecc71';
        chatWindow.appendChild(ticketMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom

        clearForm(); // Clear the form after ticket creation
    } else {
        console.error('Error creating ticket.');
    }
}

function clearForm() {
    const chatWindow = document.getElementById('chat-window');

    // Remove the resolution prompt by checking for text content
    const resolutionDivs = chatWindow.getElementsByTagName('div');
    for (let div of resolutionDivs) {
        if (div.textContent.includes("Did this resolve your issue?")) {
            div.remove();
            break;
        }
    }

    // Remove description input
    const descriptionInput = chatWindow.querySelector('#description-input');
    if (descriptionInput) descriptionInput.remove();

    // Remove submit button
    const submitButton = chatWindow.querySelector('#submit-description');
    if (submitButton) submitButton.remove();
}
