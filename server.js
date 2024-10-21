const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs').promises; // Use promises version of fs
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
app.post('/endpoint', async (req, res) => {
    const { content, additionalContent } = req.body;

    // Check if additionalContent is defined and is a string
    if (typeof additionalContent !== 'string') {
        return res.status(400).json({ message: 'additionalContent must be a string' });
    }

    // Construct the full file path
    const filePath = path.join(DIR, content);
    const absolutePath = path.resolve(filePath); // Get the absolute path
	console.log(filePath,content);
    // Log the received content and the directory parameter
    console.log('Received content:', content);
    console.log('Received additional content:', additionalContent);
    console.log('Directory parameter:', DIR); // Log the directory parameter

    // Ensure the directory exists
    try {
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    } catch (err) {
        console.error('Error creating directory:', err);
        return res.status(500).json({ message: 'Error creating directory', error: err });
    }

    // Write or update the file with additionalContent
    try {
        await fs.writeFile(absolutePath, additionalContent, { flag: 'w' });
        console.log('File written successfully:', absolutePath); // Log the absolute path
        // Send a response back
        res.json({ message: 'Content received and file updated successfully', status: 'success', filePath: absolutePath });
    } catch (err) {
        console.error('Error writing to file:', err);
        return res.status(500).json({ message: 'Error writing to file', error: err });
    }
});

// Function to search files recursively
const searchFiles = async (dir, fileName) => {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });

    for (const dirent of list) {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            results = results.concat(await searchFiles(res, fileName)); // Recur into subdirectory
        } else if (dirent.isFile() && dirent.name.endsWith(fileName)) {
            results.push(path.relative(DIR, res)); // Add the file path without the DIR prefix
        }
    }

    return results;
};

// New endpoint to search for files by name
app.get('/search', async (req, res) => {
    const fileName = req.query.fileName;

    if (!fileName) {
        return res.status(400).json({ message: 'fileName parameter is required' });
    }

    try {
        const matchedFiles = await searchFiles(absoluteDirPath, fileName);
        console.log('Matched files:', matchedFiles); // Log the matched files
        // Send the list as JSON response
        res.json({ matchedFiles });
    } catch (err) {
        console.error('Error searching files:', err);
        return res.status(500).json({ message: 'Error searching files', error: err });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Using directory: ${DIR}`); // Log the directory parameter when the server starts
    console.log(`Absolute directory path: ${absoluteDirPath}`); // Log the absolute directory path
});