// Import necessary modules
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

// Load environment variables
dotenv.config();
console.log("IBM_TTS_API_KEY Loaded:", process.env.IBM_TTS_API_KEY ? "Yes" : "No");
console.log("IBM_TTS_URL Loaded:", process.env.IBM_TTS_URL ? "Yes" : "No");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS only for Netlify frontend
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://texttospeech3.netlify.app',
      'http://localhost:3000' // if you use this for local testing
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// IBM Watson credentials
const IBM_TTS_API_KEY = process.env.IBM_TTS_API_KEY;
const IBM_TTS_URL = process.env.IBM_TTS_URL;

if (!IBM_TTS_API_KEY || !IBM_TTS_URL) {
  console.error("❌ IBM credentials missing in .env");
  process.exit(1);
}

// Initialize Watson service
const textToSpeech = new TextToSpeechV1({
  authenticator: new IamAuthenticator({ apikey: IBM_TTS_API_KEY }),
  serviceUrl: IBM_TTS_URL,
  disableSslVerification: false,
});

// ✅ GET /api/voices
app.get('/api/voices', async (req, res) => {
  try {
    const { result } = await textToSpeech.listVoices();
    const voiceList = result.voices.map(voice => ({
      voice_id: voice.name,
      name: voice.description,
      gender: voice.gender || 'N/A',
      language: voice.language || 'N/A',
      customizable: voice.customizable || false,
    }));
    res.json(voiceList);
  } catch (error) {
    console.error("Error fetching voices:", error);
    res.status(500).json({ error: `Failed to fetch voices: ${error.message}` });
  }
});

// ✅ POST /api/generate-speech
app.post('/api/generate-speech', async (req, res) => {
  const { text, voice_id } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required for speech generation." });
  }

  try {
    const { result: audioStream } = await textToSpeech.synthesize({
      text: text,
      voice: voice_id || 'en-US_AllisonV3Voice',
      accept: 'audio/mpeg',
    });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="speech.mp3"',
    });

    audioStream.pipe(res);
  } catch (error) {
    console.error("Error generating speech:", error);
    res.status(500).json({ error: `Error generating speech: ${error.message}` });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
