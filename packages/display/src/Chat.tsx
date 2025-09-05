import React, { useState, useEffect } from 'react';
import { Room, Client } from 'colyseus.js';
import type { ServerConfig } from 'server/types/ServerConfig';

interface ChatProps {
  serverConfig: ServerConfig;
}

export const Chat: React.FC<ChatProps> = ({ serverConfig }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!serverConfig) {
      return;
    }

    const wsUrl = `ws://${serverConfig.ipAddress}:${serverConfig.httpPort}`;
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
  }, [serverConfig]);

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
