import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Import the CSS file for styling

function App() {
  // State variables for managing application data and UI
  const [text, setText] = useState(''); // Stores the text input by the user
  const [voices, setVoices] = useState([]); // Stores the list of available voices from the API
  const [selectedVoice, setSelectedVoice] = useState(''); // Stores the currently selected voice ID
  const [loading, setLoading] = useState(false); // Indicates if speech generation is in progress
  const [error, setError] = useState(null); // Stores any error messages
  const audioRef = useRef(null); // Reference to the HTML <audio> element

  // Base URL for your Node.js backend API
  const API_BASE_URL = 'https://tts-yl80.onrender.com';

  // useEffect hook to fetch available voices when the component mounts
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        // Make a GET request to your backend's /api/voices endpoint
        const response = await fetch(`${API_BASE_URL}/voices`);
        if (!response.ok) {
          // If the response is not OK (e.g., 404, 500), throw an error
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Parse the JSON response
        setVoices(data); // Update the voices state with the fetched data
        if (data.length > 0) {
          // Set the first voice in the list as the default selected voice
          setSelectedVoice(data[0].voice_id);
        }
      } catch (e) {
        // Catch any errors during the fetch operation and set the error state
        setError("Failed to fetch voices: " + e.message);
        console.error("Error fetching voices:", e);
      }
    };
    fetchVoices(); // Call the fetchVoices function
  }, []); // Empty dependency array means this effect runs only once after initial render

  // Function to handle the speech generation process
  const handleGenerateSpeech = async () => {
    setLoading(true); // Set loading to true to show a loading indicator
    setError(null); // Clear any previous error messages
    try {
      // Make a POST request to your backend's /api/generate-speech endpoint
      const response = await fetch(`${API_BASE_URL}/generate-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Specify content type as JSON
        },
        // Send the text and selected voice ID in the request body
        body: JSON.stringify({ text, voice_id: selectedVoice }),
      });

      if (!response.ok) {
        // If the response is not OK, try to parse the error message from the backend
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Get the audio data as a Blob
      const audioBlob = await response.blob();
      // Create a URL for the audio Blob
      const audioUrl = URL.createObjectURL(audioBlob);
      // Set the audio player's source and play the audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }

    } catch (e) {
      // Catch any errors during speech generation and set the error state
      setError("Error generating speech: " + e.message);
      console.error("Error generating speech:", e);
    } finally {
      setLoading(false); // Set loading back to false regardless of success or failure
    }
  };

  // Function to handle downloading the generated speech
  const handleDownloadSpeech = () => {
    // Check if there's audio loaded in the player
    if (audioRef.current && audioRef.current.src) {
      const link = document.createElement('a'); // Create a temporary anchor element
      link.href = audioRef.current.src; // Set its href to the audio URL
      link.download = 'generated_speech.mp3'; // Set the download filename
      document.body.appendChild(link); // Append the link to the document body
      link.click(); // Programmatically click the link to trigger download
      document.body.removeChild(link); // Remove the link from the document body
    } else {
      // If no audio is available, show an alert
      // Using a custom message box or modal would be better in a real app,
      // but for simplicity, we'll use alert here as per instructions.
      // IMPORTANT: In a real app, replace alert() with a custom modal UI.
      alert("No audio to download. Please generate speech first!");
    }
  };

  return (
    <div className="app-container">
      <h1>AI Text-to-Speech with IBM Watson</h1>

      {/* Display error message if any */}
      {error && <div className="error-message">{error}</div>}

      <div className="input-section">
        <textarea
          placeholder="Enter text here..."
          value={text}
          onChange={(e) => setText(e.target.value)} // Update text state on input change
          rows="10"
          className="text-input"
        ></textarea>
        <div className="controls">
          <label htmlFor="voice-select">Select Voice:</label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)} // Update selected voice state
            className="voice-select"
          >
            {/* Map through the voices array to create dropdown options */}
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name} ({voice.language}) - {voice.gender}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateSpeech}
            disabled={loading || !text} // Disable button if loading or no text
            className="generate-button"
          >
            {loading ? 'Generating...' : 'Generate Speech'}
          </button>
        </div>
      </div>

      <div className="audio-section">
        {/* Audio player element */}
        <audio ref={audioRef} controls className="audio-player"></audio>
        <button
          onClick={handleDownloadSpeech}
          // Disable download button if no audio is loaded
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
