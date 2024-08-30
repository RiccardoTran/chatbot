import React from 'react';
import './Sidebar.css';


const Sidebar = ({ chats, selectChat }) => {
  return (
    <div className="sidebar">
      <h2>Chat</h2>
      <ul>
        {chats.map((chat, index) => (
          <li key={index} onClick={() => selectChat(index)}>
            {chat.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
