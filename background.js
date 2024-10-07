chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.content) {
        // Prepare the data to send to the backend
        const dataToSend = {
            content: request.content,
            additionalContent: request.additionalContent // Include the additional content
        };

        // Send data to backend
        fetch('http://localhost:4000/endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // You can respond back if needed
            sendResponse({ status: 'success', data: data });
        })
        .catch((error) => {
            console.error('Error:', error);
            sendResponse({ status: 'error', error: error });
        });

        // Indicate that the response will be sent asynchronously
        return true; 
    }
});