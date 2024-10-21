// Util.js

// Function to send a message to the background script
 function sendMessageToBackground(updatedFile, fileContent, saveToHistory = true) {
    if (saveToHistory) {
        const history = JSON.parse(localStorage.getItem('fileHistory')) || [];
        history.unshift({ filePath: updatedFile, fileContent, dt: Date.now() });

        // Limit history to the last 10 entries
        if (history.length > 10) {
            history.pop(); // Remove the oldest entry
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
 function detectTheme() {
    let isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (!isDarkTheme && !window.matchMedia('(prefers-color-scheme: light)').matches) {
        const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
        const rgb = bodyBgColor.match(/\d+/g); // Extract RGB values

        if (rgb) {
            const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
            isDarkTheme = luminance < 0.5; // Dark if luminance is below 0.5
        }
    }

    return isDarkTheme;
}

// Function to get the scrollbar width
 function getScrollbarWidth() {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // Force scrollbar to appear
    outer.style.width = '100px';
    outer.style.height = '100px';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    inner.style.width = '100%';
    inner.style.height = '100%';
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth; // Calculate width
    outer.parentNode.removeChild(outer); // Clean up
    return scrollbarWidth > 0 ? scrollbarWidth : 0; // Return width
}

// Function to extract a filename from a clicked element
 function extractFilename(clickedElement, codeElement) {
    let currentElement = clickedElement;
    let excludeElement = codeElement;
    while (currentElement) {
        if (!currentElement.contains(excludeElement)) {
            const fileMatch = currentElement.innerText.match(/([a-zA-Z0-9-_]+(\.[a-zA-Z0-9]+)+)/);
            if (fileMatch) {
                return fileMatch[0]; // Return the first matched filename
            }
        } else {
            const childNodes = [...currentElement.childNodes];
            for (const child of childNodes) {
                if (child === excludeElement || excludeElement.contains(child)) {
                    continue; // Skip the excludeElement and its children
                }
                if (!child.innerText) continue;
                const fileMatch = child.innerText.match(/([a-zA-Z0-9-_]+(\.[a-zA-Z0-9]+)+)/);
                if (fileMatch) {
                    return fileMatch[0]; // Return the first matched filename
                }
            }
        }
        currentElement = currentElement.previousElementSibling || currentElement.parentElement;
    }
    return ''; // Return an empty string if no match is found
}
