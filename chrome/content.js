function createConfirmationPopup(file, codeElement, position) {
    const isDarkTheme = detectTheme();
    const parentPre = codeElement.closest('pre');

    if (parentPre) {
        parentPre.style.border = '2px solid yellow'; // Highlight the parent <pre> tag
    }

    // Retrieve recent files and history from local storage
    const recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];
    const history = JSON.parse(localStorage.getItem('fileHistory')) || [];

    // Create the popup div
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = `${position.bottom + window.scrollY}px`; // Position below the clicked element
    popup.style.left = `${position.left}px`; // Align with the left edge of the clicked element
    popup.style.backgroundColor = isDarkTheme ? '#333' : 'white'; // Set background based on theme
    popup.style.color = isDarkTheme ? 'white' : 'black'; // Set text color based on theme
    popup.style.border = '1px solid #ccc';
    popup.style.padding = '10px';
    popup.style.zIndex = '1000';
    popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    popup.style.display = 'flex'; // Use flexbox for layout
    popup.style.flexDirection = 'column'; // Align items in a column

    // Add CSS for selected state
    const style = document.createElement('style');
    style.textContent = `
        .file-item {
            padding: 5px;
            cursor: pointer; /* Change cursor to pointer */
            transition: background-color 0.3s;
        }
        .file-item:hover {
            background-color: #f0f0f0; /* Highlight on hover */
        }
        .file-item.selected {
            background-color: #007bff; /* Background color when selected */
            color: white; /* Text color when selected */
        }
        .checkbox-label {
            display: block; /* Make label block to fill width */
        }
        .files-container {
            display: grid;
            grid-template-columns: 1fr 1fr; /* Two columns for recent files and history */
            gap: 10px; /* Space between grid items */
        }
        h4 {
            margin: 0;
        }
    `;
    document.head.appendChild(style);

    // Create input and buttons section
    const inputSection = document.createElement('div');
    inputSection.innerHTML = `
        <p>Do you want to update the file?</p>
        <input type="text" id="fileInput" value="${file}" style="width: 100%; box-sizing: border-box;" />
        <div>
            <button id="confirmButton">Yes</button>
            <button id="cancelButton">No</button>
        </div>
    `;
    popup.appendChild(inputSection);

    // Create a container for the recent files and history sections
    const filesContainer = document.createElement('div');
    filesContainer.classList.add('files-container');

    // Create the left side for recent files
    const leftSection = document.createElement('div');
    leftSection.innerHTML = `
        <h4>Recent Files</h4>
        <ul id="recentFilesList" source="recent" style="list-style-type: none; padding: 0; height: 150px; overflow-y: auto;">
            ${recentFiles.map(f => `
                <li class="file-item" data-file="${f}">${f} <button type="button" class="removeFileButton" data-file="${f}">Remove</button></li>
            `).join('')}
        </ul>
        <div id="responseMessage" style="color: green; margin-top: 10px;"></div>
    `;
    filesContainer.appendChild(leftSection);

    // Create the right side for history
    const historySection = document.createElement('div');
    historySection.style.borderLeft = '1px solid #ccc';
    historySection.style.paddingLeft = '10px';
    historySection.innerHTML = `
        <h4>History</h4>
        <ul source="history" style="list-style-type: none; padding: 0; height: 150px; overflow-y: auto;">
            ${history.map((entry) => `
                <li class="file-item" data-file="${entry.filePath}" data-timestamp="${entry.dt}">${entry.filePath} - ${new Date(entry.dt).toLocaleString()}</li>
            `).join('')}
        </ul>
    `;
    filesContainer.appendChild(historySection);

    // Append the files container to the popup
    popup.appendChild(filesContainer);
    document.body.appendChild(popup);

    // Create a function to handle item selection
    function handleItemSelection(event) {
        const allItems = document.querySelectorAll('.file-item');
        
        // Deselect all items first
        allItems.forEach(el => el.classList.remove('selected'));
        
        // Select the clicked item
        this.classList.add('selected');
        
        // Update the input field with the selected file
        document.getElementById('fileInput').value = this.getAttribute('data-file');
    }

    // Add event listeners for all file items
    const allFileItems = document.querySelectorAll('.file-item');
    allFileItems.forEach(item => {
        item.addEventListener('click', handleItemSelection);
    });

    // Add event listeners for buttons
    document.getElementById('confirmButton').addEventListener('click', () => {
        const selectedFile = document.querySelector('.file-item.selected');
        if (!selectedFile) return; // Exit early if no file is selected

        const updatedFile = selectedFile.getAttribute('data-file');
        const fileList = selectedFile.closest('ul');
        const isHistoryItem = fileList.getAttribute('source') === 'history';
        let fileContent;
        let saveToHistory = true; // Default to true

        if (isHistoryItem) {
            // Get the timestamp (dt) from the selected history item
            const dt = selectedFile.getAttribute('data-timestamp');
            
            // Get fileContent from the history entry using dt
            const historyEntry = JSON.parse(localStorage.getItem('fileHistory')).find(entry => entry.dt === dt);
            fileContent = historyEntry ? historyEntry.fileContent : '';
            saveToHistory = false; // Set to false for history items
        } else {
            // Get the content from the code element for recent files
            fileContent = codeElement.textContent;

            // Update recent files in local storage
            const recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];
            const index = recentFiles.indexOf(updatedFile);
            if (index !== -1) {
                recentFiles.splice(index, 1); // Remove the existing item
            }
            recentFiles.unshift(updatedFile); // Add the new item to the beginning
            if (recentFiles.length > 10) {
                recentFiles.pop(); // Keep the list to a maximum of 10 files
            }
            localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
        }

        // Send the message to the background script
        sendMessageToBackground(updatedFile, fileContent, saveToHistory);
    });

    // Remove recent file when the remove button is clicked
    document.querySelectorAll('.removeFileButton').forEach(button => {
        button.addEventListener('click', (event) => {
            const fileToRemove = event.target.getAttribute('data-file');
            const index = recentFiles.indexOf(fileToRemove);
            if (index !== -1) {
                recentFiles.splice(index, 1); // Remove the file from the array
                localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
                setTimeout(() => event.target.closest('li').remove(), 0); // Remove the list item from the DOM
            }
            event.stopPropagation(); // Prevent the click from bubbling up to the list item
        });
    });

    document.getElementById('cancelButton').addEventListener('click', () => {
        dismissPopup(popup, parentPre); // Dismiss the popup
    });

    // Function to handle clicks outside the popup
    function handleClickOutside(event) {
        if (!popup.contains(event.target)) {
            dismissPopup(popup, parentPre); // Dismiss the popup
            document.removeEventListener('click', handleClickOutside); // Clean up event listener
        }
    }

    // Add event listener to detect clicks outside the popup
    document.addEventListener('click', handleClickOutside);
}

// Function to send a message to the background script
function sendMessageToBackground(updatedFile, fileContent, saveToHistory = true) {
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
function detectTheme() {
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

// Function to dismiss the popup and remove highlight
function dismissPopup(popup, parentPre) {
    document.body.removeChild(popup); // Remove the popup
    if (parentPre) {
        parentPre.style.border = ''; // Remove the highlight
    }
}

// Function to find the next code element below clickedElement
function findCode(clickedElement) {
    const allCodeElements = document.querySelectorAll('code');
    let foundCodeElement = null;

    allCodeElements.forEach((codeElement) => {
        if (!foundCodeElement && clickedElement.compareDocumentPosition(codeElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
            foundCodeElement = codeElement;
        }
    });

    return foundCodeElement;
}

// Function to extract filename
function extractFilename(clickedElement, code) {
    let currentElement = clickedElement;
    let excludeElement = code;
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

// Listen for double-click events
document.addEventListener('dblclick', function (event) {
    const clickedElement = event.target;

    // Check if the clicked element contains "Copy"
    if (clickedElement.innerText.includes("Copy")) {
        // Find the code element
        const codeElement = findCode(clickedElement);

        if (codeElement) {
            // Extract the filename, excluding the found code element
            const file = extractFilename(clickedElement, codeElement);

            // Get the position of the clicked element
            const position = clickedElement.getBoundingClientRect();

            // Create and show the confirmation popup
            createConfirmationPopup(file, codeElement, position);
        }
    }
});

// Function to create a docked div
function createDockedDiv() {
    const dockedDiv = document.createElement('div');
    dockedDiv.style.position = 'fixed';
    dockedDiv.style.top = '50%';
    dockedDiv.style.right = `${getScrollbarWidth()}px`; // Set right position to scrollbar width if visible
    dockedDiv.style.transform = 'translateY(-50%)';
    dockedDiv.style.display = 'flex';
    dockedDiv.style.flexDirection = 'row';
    dockedDiv.style.alignItems = 'stretch';
    dockedDiv.style.background = '#f0f0f0';
    dockedDiv.style.border = '1px solid #ccc';
    dockedDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';

    const resizer = document.createElement('div');
    resizer.style.width = '3px';
    resizer.style.cursor = 'ew-resize';
    resizer.style.background = '#ccc';
    dockedDiv.appendChild(resizer);

    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.padding = '10px';
    content.style.background = '#fff';
    content.style.display = 'none'; // Set to hidden by default
    content.innerText = 'This is the content div.';
    dockedDiv.appendChild(content);

    const toggleWrapper = document.createElement('div');
    toggleWrapper.style.display = 'flex';
    toggleWrapper.style.alignItems = 'center';
    dockedDiv.appendChild(toggleWrapper);

    const toggleButton = document.createElement('button');
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.width = '1em';
    toggleButton.style.height = '100px';
    toggleButton.style.background = '#007bff';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.display = 'flex';
    toggleButton.style.flexDirection = 'column';
    toggleButton.style.justifyContent = 'center';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.transition = 'transform 0.3s ease';
    toggleButton.style.outline = 'none';

    // Create dots for the toggle button
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.background = 'white';
        dot.style.borderRadius = '50%';
        dot.style.margin = '2px 0';
        toggleButton.appendChild(dot);
    }
    toggleWrapper.appendChild(toggleButton);
    document.body.appendChild(dockedDiv);

    // Adjust position of dockedDiv based on scrollbar visibility
    adjustDockedDivPosition(dockedDiv);

    // Resize functionality
    let isResizing = false;

    resizer.addEventListener('mousedown', (event) => {
        isResizing = true;
    });

    window.addEventListener('mousemove', (event) => {
        if (isResizing) {
            const newWidth = window.innerWidth - event.clientX;
            if (newWidth < 100) {
                dockedDiv.style.width = 'auto';
                content.style.display = 'none';
            } else {
                dockedDiv.style.width = `${newWidth}px`;
                content.style.display = 'block';
            }
        }
    });

    window.addEventListener('mouseup', () => {
        isResizing = false;
    });

    // Toggle button functionality
    toggleButton.addEventListener('click', () => {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            dockedDiv.style.width = 'auto'; // Set to auto when shown
        } else {
            content.style.display = 'none';
            dockedDiv.style.width = 'auto'; // Set to auto when hidden
        }
    });

    // Hide content when clicking outside of dockedDiv
    window.addEventListener('click', (event) => {
        if (!dockedDiv.contains(event.target) && event.target !== toggleButton) {
            content.style.display = 'none'; // Hide only the content
        }
    });

    // Hover effect for toggleWrapper
    dockedDiv.addEventListener('mouseenter', () => {
        toggleWrapper.classList.add('hovered');
    });

    dockedDiv.addEventListener('mouseleave', () => {
        toggleWrapper.classList.remove('hovered');
        handleMouseLeave();
    });

    const handleMouseEnter = () => {
        dockedDiv.style.opacity = '1';
    };

    // Function to handle mouse leave
    const handleMouseLeave = () => {
        dockedDiv.style.opacity = '0.2';
    };

    // Add event listeners for mouseenter and mouseleave
    dockedDiv.addEventListener('mouseenter', handleMouseEnter);
    handleMouseLeave();
}

function getScrollbarWidth() {
    // Create a temporary div to measure scrollbar width
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

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth; // Calculate scrollbar width
    outer.parentNode.removeChild(outer); // Clean up
    return scrollbarWidth > 0 ? scrollbarWidth : 0; // Return width if present
}

function adjustDockedDivPosition(dockedDiv) {
    // Check if the scrollbar is visible
    if (document.body.scrollHeight > window.innerHeight) {
        dockedDiv.style.right = `${getScrollbarWidth()}px`; // Set right position to scrollbar width
    } else {
        dockedDiv.style.right = '0'; // No scrollbar, align with the right edge
    }
}

// Call the function to create the docked div
createDockedDiv();
