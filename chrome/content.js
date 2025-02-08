// Function to create the confirmation popup
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
    popup.style.padding = '5px'; // Changed to 5px
    popup.style.zIndex = '1000';
    popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    popup.style.display = 'flex'; // Use flexbox for layout
    popup.style.flexDirection = 'column'; // Align items in a column

    // Add CSS for selected state and buttons
    const style = document.createElement('style');
    style.textContent = `
        .button-container {
            display: flex;
            justify-content: flex-start; /* Align buttons to the left */
            margin-top: 5px; /* Changed to 5px */
        }
        .button {
            margin-left: 5px; /* Changed to 5px */
        }
        .file-item {
            padding: 5px; /* Remains 5px */
            cursor: pointer; /* Change cursor to pointer */
            transition: background-color 0.3s;
			display:flex;
			justify-content: space-between;
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
            grid-template-columns: 1fr; /* Two columns for recent files and history */
            gap: 5px; /* Changed to 5px */
        }
        h4 {
            margin: 0; /* Remains 0 */
        }
    `;
    document.head.appendChild(style);

    // Create input and buttons section
    const inputSection = document.createElement('div');
    inputSection.innerHTML = `
        <p>Do you want to update the file?</p>
        <input type="text" id="fileInput" value="${file}" style="width: 100%; box-sizing: border-box;" />
        <div class="button-container">
            <button id="confirmButton" class="button">Yes</button>
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
                <li class="file-item" data-file="${f}"><span>${f}</span> <button type="button" class="removeFileButton" data-file="${f}">Remove</button></li>
            `).join('')}
        </ul>
        <div id="responseMessage" style="color: green; margin-top: 5px;"></div> <!-- Changed to 5px -->
    `;
    filesContainer.appendChild(leftSection);

    // Create the right side for history
    const historySection = document.createElement('div');
    historySection.style.borderLeft = '1px solid #ccc';
    historySection.style.paddingLeft = '5px'; // Changed to 5px
    historySection.innerHTML = `
        <h4>History</h4>
        <ul source="history" style="list-style-type: none; padding: 0; height: 150px; overflow-y: auto;">
            ${history.map((entry) => `
                <li class="file-item" data-file="${entry.filePath}" data-timestamp="${entry.dt}">${entry.filePath} - ${new Date(entry.dt).toLocaleString()}</li>
            `).join('')}
        </ul>
    `;
   // filesContainer.appendChild(historySection);

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

    // Add event listeners for the confirm button
    document.getElementById('confirmButton').addEventListener('click', () => {
        const selectedFile = document.querySelector('.file-item.selected');
        if (!selectedFile &&  document.getElementById('fileInput').value.trim().length==0) return; // Exit early if no file is selected

        // Get the trimmed value from the file input
        const updatedFile = document.getElementById('fileInput').value.trim();
        const fileList = selectedFile&&selectedFile.closest('ul');
        const isHistoryItem = fileList&&fileList.getAttribute('source') === 'history';
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

        // Send the message to the background script with the trimmed updatedFile
        sendMessageToBackground(updatedFile, fileContent, saveToHistory);
        //dismissPopup(popup, parentPre); // Dismiss the popup after confirmation
    });

    // Remove recent file when the remove button is clicked
    document.querySelectorAll('.removeFileButton').forEach(button => {
        button.addEventListener('click', (event) => {
            const fileToRemove = event.target.getAttribute('data-file');
            const recentFiles = JSON.parse(localStorage.getItem('recentFiles')) || [];
            const index = recentFiles.indexOf(fileToRemove);
            if (index !== -1) {
                recentFiles.splice(index, 1); // Remove the file from the array
                localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
                setTimeout(() => event.target.closest('li').remove(), 0); // Remove the list item from the DOM
            }
            event.stopPropagation(); // Prevent the click from bubbling up to the list item
        });
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
    content.style.padding = '5px'; // Changed to 5px
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

function adjustDockedDivPosition(dockedDiv) {
    // Check if the scrollbar is visible
    if (document.body.scrollHeight > window.innerHeight) {
        dockedDiv.style.right = `${getScrollbarWidth()}px`; // Set right position to scrollbar width
    } else {
        dockedDiv.style.right = '0'; // No scrollbar, align with the right edge
    }
}

// Create the docked div on page load
createDockedDiv();

  document.addEventListener('dblclick', function(event) {
        const codeElement = event.target.closest('code'); // Find the closest code element

        if (codeElement) {
            const scrollableContainer = findScrollableParent(codeElement);
            if (scrollableContainer) {
                handleScroll(scrollableContainer, codeElement); // Call the scroll function
            }
        }
    });

    // Function to find the nearest scrollable parent
    function findScrollableParent(element) {
        let parent = element.parentElement;

        while (parent) {
            const overflowY = window.getComputedStyle(parent).overflowY;
            const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && 
                                (parent.clientHeight < parent.scrollHeight);
            if (isScrollable) {
                return parent; // Return the first scrollable parent found
            }
            parent = parent.parentElement; // Move up the DOM tree
        }
        return null; // No scrollable parent found
    }

    // Function to handle the scroll logic
    function handleScroll(scrollableContainer, codeElement) {
        const elementRect = codeElement.getBoundingClientRect();
        const containerRect = scrollableContainer.getBoundingClientRect();
        
        // Calculate the top position of the code element relative to the scrollable container
        const scrollY = elementRect.top - containerRect.top + scrollableContainer.scrollTop - 60; // Add 50px offset

        // Scroll to the calculated position
        scrollableContainer.scrollTo({
            top: scrollY,
            behavior: 'smooth'
        });
    }
	console.log('codepilot');