import React, { useState, useEffect } from 'react';
import { Room, Client } from 'colyseus.js';

export const Chat: React.FC = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
    const client = new Client(wsUrl);

    client.joinOrCreate<any>("my_room").then(room => {
      setRoom(room);
      console.log("joined successfully", room);

      room.onMessage("messages", (message) => {
        setMessages(prev => [...prev, message]);
      });

    }).catch(e => {
      console.error("join error", e);
    });

    return () => {
      room?.leave();
    }
  }, []);

  const sendMessage = () => {
    if (room && message) {
      room.send("message", message);
      setMessage('');
    }
  };

  return (
    <div>
      <h3>Chat</h3>
      <div>
        {messages.map((msg, i) => <div key={i}>{msg}</div>)}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};
