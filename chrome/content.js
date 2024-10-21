function createConfirmationPopup(file, codeElement, position) {
    const isDarkTheme = detectTheme();
    const parentPre = codeElement.closest('pre');

    if (parentPre) {
        parentPre.style.border = '2px solid yellow'; // Highlight the parent <pre> tag with a yellow border
    }

    // Retrieve recent files from local storage
    const recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];

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

    popup.innerHTML = `
        <p>Do you want to update the file?</p>
        <input type="text" id="fileInput" value="${file}" />
        <div id="recentFilesList">
            ${recentFiles.map(f => `
                <label>
                    <input type="radio" name="recentFile" value="${f}" /> ${f}
                    <button type="button" class="removeFileButton" data-file="${f}">Remove</button>
                </label>
            `).join('')}
        </div>
        <div>
        <button id="confirmButton">Yes</button>
        <button id="cancelButton">No</button>
        </div>
        <div id="responseMessage" style="color: green; margin-top: 10px;"></div>
    `;

    document.body.appendChild(popup);

    // Add event listeners for buttons
    document.getElementById('confirmButton').addEventListener('click', () => {
        const updatedFile = document.getElementById('fileInput').value;

        // Save the input value to recent files in local storage
        const index = recentFiles.indexOf(updatedFile);
        if (index !== -1) {
            recentFiles.splice(index, 1); // Remove the existing item
        }
        recentFiles.unshift(updatedFile); // Add the new item to the beginning
        if (recentFiles.length > 10) {
            recentFiles.pop(); // Keep the list to a maximum of 10 files
        }
        localStorage.setItem('recentFiles', JSON.stringify(recentFiles));

        // Send a message to the background script with the updated file path and content
        chrome.runtime.sendMessage({ filePath: updatedFile, fileContent: codeElement.textContent }, (response) => {
            const responseMessage = document.getElementById('responseMessage');
            responseMessage.textContent = response.data.message; // Show the response message
        });
    });

    // Update the input value when a recent file radio button is clicked
    document.getElementById('recentFilesList').addEventListener('change', (event) => {
        if (event.target.name === 'recentFile') {
            document.getElementById('fileInput').value = event.target.value;
        }
    });

    // Remove recent file when the remove button is clicked
    document.querySelectorAll('.removeFileButton').forEach(button => {
        button.addEventListener('click', (event) => {
            const fileToRemove = event.target.getAttribute('data-file');
            const index = recentFiles.indexOf(fileToRemove);
            if (index !== -1) {
                recentFiles.splice(index, 1); // Remove the file from the array
                localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
                setTimeout(()=>
                event.target.closest('label').remove(),0); // Remove the label element from the DOM
            }
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

// Function to detect the theme of the page
function detectTheme() {
    // Determine if the page uses a dark theme
    let isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // If theme is not set, detect based on background color
    if (!window.matchMedia('(prefers-color-scheme: dark)').matches && !window.matchMedia('(prefers-color-scheme: light)').matches) {
        const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
        const rgb = bodyBgColor.match(/\d+/g); // Extract RGB values

        if (rgb) {
            // Convert RGB to luminance
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

// Function to find the next code element anywhere below clickedElement
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

function extractFilename(clickedElement, code) {
    let currentElement = clickedElement;

    let excludeElement=code;
    while (currentElement) {
        // Case 1: currentElement does not contain excludeElement
        if (!currentElement.contains(excludeElement)) {
            const fileMatch = currentElement.innerText.match(/([a-zA-Z0-9-_]+(\.[a-zA-Z0-9]+)+)/);
            if (fileMatch) {
                return fileMatch[0]; // Return the first matched filename
            }
        } else {
            // Case 2: currentElement contains excludeElement, check children excluding excludeElement and its descendants
            const childNodes = [...currentElement.childNodes];
            for (const child of childNodes) {
                if (child === excludeElement || excludeElement.contains(child)) {
                    continue; // Skip the excludeElement and its children
                }
                if(!child.innerText)continue;
                const fileMatch = child.innerText.match(/([a-zA-Z0-9-_]+(\.[a-zA-Z0-9]+)+)/);
                if (fileMatch) {
                    return fileMatch[0]; // Return the first matched filename
                }
            }
        }
        
        // Move to the previous sibling or parent
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

function createDockedDiv() {
    // Create the docked div
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

    // Create the resizer
    const resizer = document.createElement('div');
    resizer.style.width = '3px';
    resizer.style.cursor = 'ew-resize';
    resizer.style.background = '#ccc';
    dockedDiv.appendChild(resizer);

    // Create the content div
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.padding = '10px';
    content.style.background = '#fff';
    content.style.display = 'none'; // Set to hidden by default
    content.innerText = 'This is the content div.';
    dockedDiv.appendChild(content);

    // Create the toggle button
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