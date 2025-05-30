import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // ✅ Updated API base URL with `/api`
  const API_BASE_URL = 'https://tts-lcak.onrender.com/api';

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/voices`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setVoices(data);
        if (data.length > 0) {
          setSelectedVoice(data[0].voice_id);
        }
      } catch (e) {
        setError("Failed to fetch voices: " + e.message);
        console.error("Error fetching voices:", e);
      }
    };
    fetchVoices();
  }, []);

  const handleGenerateSpeech = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice_id: selectedVoice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }

    } catch (e) {
      setError("Error generating speech: " + e.message);
      console.error("Error generating speech:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSpeech = () => {
    if (audioRef.current && audioRef.current.src) {
      const link = document.createElement('a');
      link.href = audioRef.current.src;
      link.download = 'generated_speech.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("No audio to download. Please generate speech first!");
    }
  };

  return (
    <div className="app-container">
      <h1>AI Text-to-Speech with IBM Watson</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="input-section">
        <textarea
          placeholder="Enter text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="10"
          className="text-input"
        ></textarea>
        <div className="controls">
          <label htmlFor="voice-select">Select Voice:</label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="voice-select"
          >
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name} ({voice.language}) - {voice.gender}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateSpeech}
            disabled={loading || !text}
            className="generate-button"
          >
            {loading ? 'Generating...' : 'Generate Speech'}
          </button>
        </div>
      </div>

      <div className="audio-section">
        <audio ref={audioRef} controls className="audio-player"></audio>
        <button
          onClick={handleDownloadSpeech}
          disabled={!audioRef.current || !audioRef.current.src}
          className="download-button"
        >
          Download Audio
        </button>
      </div>

      <div className="footer">
        <p>Powered by IBM Watson Text to Speech</p>
      </div>
    </div>
  );
}

export default App;
