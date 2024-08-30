import React, { useState } from 'react';
import './Chatbot.css';

const Chatbot = ({ selectedChat, onSendMessage }) => {
  const [input, setInput] = useState("");
  const suggestions = ["Qual è il meteo oggi?", "Raccontami una barzelletta", "Quali sono le ultime notizie?"];

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onSendMessage(`File caricato: ${file.name}`);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      onSendMessage(`File caricato: ${file.name}`);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="chatbot" onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="chatbot-messages">
        {selectedChat.messages.map((msg, index) => (
          <div key={index} className={`message-container ${msg.sender}`}>
            {msg.sender === "user" ? (
              <>
                <div className={`message ${msg.sender}`}>
                  <strong className="message-name">Utente</strong>
                  <p>{msg.text}</p>
                </div>
                <img src="/pics/user-icon.jpg" alt="profile" className="profile-icon" />
              </>
            ) : (
              <>
                <img src="/pics/bot-icon.jpeg" alt="profile" className="profile-icon" />
                <div className={`message ${msg.sender}`}>
                  <strong className="message-name">Assistente</strong>
                  <p>{msg.text}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="chatbot-suggestions">
        {suggestions.map((suggestion, index) => (
          <button key={index} onClick={() => handleSuggestionClick(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <input
          type="file"
          id="file-upload"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload" className="file-upload-label">
          📎
        </label>
        <button onClick={handleSend}>Invia</button>
      </div>
    </div>
  );
};

export default Chatbot;
