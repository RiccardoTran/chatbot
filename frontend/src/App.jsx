import React, { useState } from 'react';
import Chatbot from './Chatbot.jsx';
import Sidebar from './Sidebar.jsx';
import './App.css';

const App = () => {
  const [chats, setChats] = useState([
    { name: "Chat 1", messages: [{ text: "Ciao! Come posso aiutarti oggi?", sender: "bot" }] },
    { name: "Chat 2", messages: [{ text: "Benvenuto nella Chat 2!", sender: "bot" }] }
  ]);
  const [selectedChatIndex, setSelectedChatIndex] = useState(0);

  const selectChat = (index) => {
    setSelectedChatIndex(index);
  };

  const sendMessageToBackend = async (message) => {
    const selectedChat = chats[selectedChatIndex];
    const updatedMessages = [...selectedChat.messages, { text: message, sender: "user" }];

    // Invio della richiesta al backend
    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: message,
          name: selectedChat.name,
          contextType: 'text' // Puoi modificare il tipo di contesto secondo le necessità
        }),
      });

      const data = await response.json();
      const botResponse = data.response;

      // Aggiornamento dello stato con la risposta del bot
      const newChats = [...chats];
      newChats[selectedChatIndex].messages = [...updatedMessages, { text: botResponse, sender: "bot" }];
      setChats(newChats);

    } catch (error) {
      console.error('Error while sending message:', error);
      // Gestisci l'errore, ad esempio mostrando un messaggio all'utente
    }
  };

  return (
    <div className="App">
      <Sidebar chats={chats} selectChat={selectChat} />
      <Chatbot
        selectedChat={chats[selectedChatIndex]}
        onSendMessage={sendMessageToBackend}
      />
    </div>
  );
};

export default App;
