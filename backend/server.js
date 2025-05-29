// Import necessary modules
const express = require('express');
const cors = require('cors'); // For handling Cross-Origin Resource Sharing
const dotenv = require('dotenv'); // For loading environment variables from .env file
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

// Load environment variables from .env file
dotenv.config();
console.log("Environment variables loaded.");
console.log("Attempting to read IBM_TTS_API_KEY from .env:", process.env.IBM_TTS_API_KEY ? "Key Loaded (first 5 chars: " + process.env.IBM_TTS_API_KEY.substring(0, 5) + "...)" : "Key NOT Loaded");
console.log("Attempting to read IBM_TTS_URL from .env:", process.env.IBM_TTS_URL || "URL NOT Loaded");


// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000; // Use port 5000 or an environment variable

// Enable CORS for all routes, allowing your React frontend to communicate
app.use(cors());
// Enable Express to parse JSON request bodies
app.use(express.json());

// --- IBM Watson TTS Configuration ---
// Retrieve API Key and URL from environment variables for security
const IBM_TTS_API_KEY = process.env.IBM_TTS_API_KEY;
const IBM_TTS_URL = process.env.IBM_TTS_URL;

// Basic validation to ensure credentials are set
if (!IBM_TTS_API_KEY || !IBM_TTS_URL) {
    console.error("Error: IBM_TTS_API_KEY and IBM_TTS_URL environment variables must be set.");
    process.exit(1); // Exit the process if credentials are missing
}

// Initialize the IBM Watson Text to Speech service
const textToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({
        apikey: IBM_TTS_API_KEY,
    }),
    serviceUrl: IBM_TTS_URL,
    disableSslVerification: false, // Set to true for self-signed certificates in development, but not recommended for production
});
// --- End IBM Watson TTS Configuration ---


// API Endpoint to fetch available voices
app.get('/api/voices', async (req, res) => {
    try {
        // Call the IBM Watson API to list all available voices
        const { result: availableVoices } = await textToSpeech.listVoices();
        const voiceList = [];
        for (const voice of availableVoices.voices) {
            // Extract relevant information for the frontend, similar to the Flask backend
            voiceList.push({
                voice_id: voice.name, // IBM uses 'name' as the unique identifier for voices
                name: voice.description, // A more human-readable description of the voice
                gender: voice.gender || 'N/A', // Gender of the voice, if available
                language: voice.language || 'N/A', // Language code (e.g., 'en-US')
                customizable: voice.customizable || false, // Indicates if the voice can be customized
            });
        }
        res.json(voiceList); // Send the list of voices as a JSON response
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error fetching voices from IBM Watson:", error);
        // Return an error response to the frontend
        res.status(500).json({ error: `Failed to fetch voices: ${error.message || error}` });
    }
});

// API Endpoint to generate speech from text
app.post('/api/generate-speech', async (req, res) => {
    const { text, voice_id } = req.body; // Extract text and voice_id from the request body

    // Validate input text
    if (!text) {
        return res.status(400).json({ error: "Text is required for speech generation." });
    }

    try {
        // Synthesize the text into audio using the specified voice and format
        const { result: audioStream } = await textToSpeech.synthesize({
            text: text,
            voice: voice_id || 'en-US_AllisonV3Voice', // Default voice if none is provided
            accept: 'audio/mpeg', // Request audio in MP3 format
        });

        // Set response headers for audio file download
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': 'attachment; filename="speech.mp3"',
        });

        // Pipe the audio stream directly to the response
        audioStream.pipe(res);

    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error generating speech with IBM Watson:", error);
        // Return an error response to the frontend
        res.status(500).json({ error: `Error generating speech: ${error.message || error}` });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Node.js backend server running on port ${PORT}`);
});
// API Endpoint to fetch available voices
app.get('/api/voices', async (req, res) => {
    try {
        // Call the IBM Watson API to list all available voices
        const { result: availableVoices } = await textToSpeech.listVoices();
        const voiceList = [];
        for (const voice of availableVoices.voices) {
            // Extract relevant information for the frontend, similar to the Flask backend
            voiceList.push({
                voice_id: voice.name, // IBM uses 'name' as the unique identifier for voices
                name: voice.description, // A more human-readable description of the voice
                gender: voice.gender || 'N/A', // Gender of the voice, if available
                language: voice.language || 'N/A', // Language code (e.g., 'en-US', 'hi-IN')
                customizable: voice.customizable || false, // Indicates if the voice can be customized
            });
        }
        res.json(voiceList); // Send the list of voices as a JSON response
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error fetching voices from IBM Watson:", error);
        // Return an error response to the frontend
        res.status(500).json({ error: `Failed to fetch voices: ${error.message || error}` });
    }
});

// Initialize the IBM Watson Text to Speech service
const TextToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({
        apikey: IBM_TTS_API_KEY,
    }),
    serviceUrl: IBM_TTS_URL,
    disableSslVerification: false,
});
