const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const path = require('path');

const app = express();
const argv = yargs(hideBin(process.argv)).argv;

// Default to 3000 if no port is specified
const PORT = argv.port || 3000;
// Get the directory parameter, default to an empty string if not provided
const DIR = argv.dir || '';

// Get the absolute path of the directory
const absoluteDirPath = path.resolve(DIR);

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies

// API endpoint to receive content
app.post('/endpoint', (req, res) => {
    const { content, additionalContent } = req.body;

    // Construct the full file path
    const filePath = path.join(DIR, content);
    const absolutePath = path.resolve(filePath); // Get the absolute path

    // Log the received content and the directory parameter
    console.log('Received content:', content);
    console.log('Received additional content:', additionalContent);
    console.log('Directory parameter:', DIR); // Log the directory parameter

    // Ensure the directory exists
    fs.mkdir(DIR, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            return res.status(500).json({ message: 'Error creating directory', error: err });
        }

        // Write or update the file with additionalContent
        fs.writeFile(absolutePath, additionalContent, { flag: 'w' }, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).json({ message: 'Error writing to file', error: err });
            }

            console.log('File written successfully:', absolutePath); // Log the absolute path
            // Send a response back
            res.json({ message: 'Content received and file updated successfully', status: 'success', filePath: absolutePath });
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Using directory: ${DIR}`); // Log the directory parameter when the server starts
    console.log(`Absolute directory path: ${absoluteDirPath}`); // Log the absolute directory path
});