// Util.js

// Function to send a message to the background script
export function sendMessageToBackground(updatedFile, fileContent, saveToHistory = true) {
    // Save to local storage for history version if saveToHistory is true
    if (saveToHistory) {
        const history = JSON.parse(localStorage.getItem('fileHistory')) || [];
        history.push({ filePath: updatedFile, fileContent, dt: Date.now() });

        // Limit history to the last 10 entries
        if (history.length > 10) {
            history.shift(); // Remove the oldest entry
        }
        localStorage.setItem('fileHistory', JSON.stringify(history));
    }

    // Send a message to the background script
    chrome.runtime.sendMessage({ filePath: updatedFile, fileContent }, (response) => {
        const responseMessage = document.getElementById('responseMessage');
        responseMessage.textContent = response.data.message; // Show the response message
    });
}

// Function to detect the theme of the page
export function detectTheme() {
    let isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (!window.matchMedia('(prefers-color-scheme: dark)').matches && !window.matchMedia('(prefers-color-scheme: light)').matches) {
        const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
        const rgb = bodyBgColor.match(/\d+/g); // Extract RGB values

        if (rgb) {
            const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
            isDarkTheme = luminance < 0.5; // Consider it dark if luminance is below 0.5
        }
    }

    return isDarkTheme;
}
