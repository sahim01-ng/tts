// Import necessary modules
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

// Load environment variables
dotenv.config();
console.log("Environment variables loaded.");
console.log("IBM_TTS_API_KEY:", process.env.IBM_TTS_API_KEY ? "Loaded" : "Not Found");
console.log("IBM_TTS_URL:", process.env.IBM_TTS_URL || "Not Found");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup — allow only your Netlify frontend domain
app.use(cors({
  origin: 'https://texttospeech3.netlify.app', // 🔁 replace this with your actual Netlify site URL
  methods: ['GET', 'POST'],
}));

// Middleware
app.use(express.json());

// IBM Watson credentials
const IBM_TTS_API_KEY = process.env.IBM_TTS_API_KEY;
const IBM_TTS_URL = process.env.IBM_TTS_URL;

if (!IBM_TTS_API_KEY || !IBM_TTS_URL) {
  console.error("❌ Missing IBM credentials. Set them in .env");
  process.exit(1);
}

// IBM TTS setup
const textToSpeech = new TextToSpeechV1({
  authenticator: new IamAuthenticator({ apikey: IBM_TTS_API_KEY }),
  serviceUrl: IBM_TTS_URL,
  disableSslVerification: false,
});

// ✅ Route: Get voices
app.get('/api/voices', async (req, res) => {
  try {
    const { result } = await textToSpeech.listVoices();
    const voiceList = result.voices.map((voice) => ({
      voice_id: voice.name,
      name: voice.description,
      gender: voice.gender || 'N/A',
      language: voice.language || 'N/A',
      customizable: voice.customizable || false,
    }));
    res.json(voiceList);
  } catch (error) {
    console.error("❌ Error fetching voices:", error);
    res.status(500).json({ error: `Failed to fetch voices: ${error.message}` });
  }
});

// ✅ Route: Generate speech
app.post('/api/generate-speech', async (req, res) => {
  const { text, voice_id } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required for speech generation." });
  }

  try {
    const { result: audioStream } = await textToSpeech.synthesize({
      text,
      voice: voice_id || 'en-US_AllisonV3Voice',
      accept: 'audio/mpeg',
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="speech.mp3"',
    });

    audioStream.pipe(res);
  } catch (error) {
    console.error("❌ Error generating speech:", error);
    res.status(500).json({ error: `Error generating speech: ${error.message}` });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
