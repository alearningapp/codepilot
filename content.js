// Function to create a confirmation popup
function createConfirmationPopup(file, codeElement, position) {
    // Highlight the code element
    codeElement.style.border = '2px solid yellow'; // Highlight with a yellow border

    // Create the popup div
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = `${position.bottom + window.scrollY}px`; // Position below the clicked element
    popup.style.left = `${position.left}px`; // Align with the left edge of the clicked element
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid #ccc';
    popup.style.padding = '10px';
    popup.style.zIndex = '1000';
    popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';

    popup.innerHTML = `
        <p>Do you want to update the file?</p>
        <pre>${file}</pre>
        <button id="confirmButton">Yes</button>
        <button id="cancelButton">No</button>
        <div id="responseMessage" style="color: green; margin-top: 10px;"></div>
    `;

    document.body.appendChild(popup);

    // Add event listeners for buttons
    document.getElementById('confirmButton').addEventListener('click', () => {
        // Send a message to the background script with the file and additional content
        chrome.runtime.sendMessage({ content: file, additionalContent: codeElement.textContent }, (response) => {
            const responseMessage = document.getElementById('responseMessage');
            responseMessage.textContent = response.data.message; // Updated line for both success and failure
        });
    });

    document.getElementById('cancelButton').addEventListener('click', () => {
        dismissPopup(popup, codeElement); // Dismiss the popup
    });

    // Function to handle clicks outside the popup
    function handleClickOutside(event) {
        if (!popup.contains(event.target)) {
            dismissPopup(popup, codeElement); // Dismiss the popup
            document.removeEventListener('click', handleClickOutside); // Clean up event listener
        }
    }

    // Add event listener to detect clicks outside the popup
    document.addEventListener('click', handleClickOutside);
}

// Function to dismiss the popup and remove highlight
function dismissPopup(popup, codeElement) {
    document.body.removeChild(popup); // Remove the popup
    codeElement.style.border = ''; // Remove the highlight
}

// Listen for double-click events
document.addEventListener('dblclick', function (event) {
    const clickedElement = event.target;

    // Use regex to extract the filename with the format filename.postfix
    const fileMatch = clickedElement.innerText.match(/([a-zA-Z0-9-_]+(\.[a-zA-Z0-9]+)+)/);
    const file = fileMatch ? fileMatch[0] : ''; // Get the matched filename

    // Find the closest h3 tag and its next sibling div containing a code tag
    const h3Element = clickedElement.closest('h3');

    if (h3Element) {
        let nextDiv = h3Element.nextElementSibling;

        // Find the next sibling div that contains a code tag
        while (nextDiv) {
            if (nextDiv.tagName === 'DIV' && nextDiv.querySelector('code')) {
                const codeElement = nextDiv.querySelector('code');

                // Get the position of the clicked element
                const position = clickedElement.getBoundingClientRect();

                // Create and show the confirmation popup
                createConfirmationPopup(file, codeElement, position);
                break; // Exit the loop once the correct div is found
            }
            nextDiv = nextDiv.nextElementSibling; // Move to the next sibling
        }
    }
});
