import React, { useState, useEffect } from 'react';
import { Room } from 'colyseus.js';

interface ChatProps {
    room: Room;
}

export const Chat: React.FC<ChatProps> = (props) => {
    const { room } = props;
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        room.onMessage('messages', (message) => {
            setMessages((prev) => [...prev, message]);
        });
    }, [room]);

    const sendMessage = () => {
        if (message) {
            room.send('message', message);
            setMessage('');
        }
    };

    return (
        <div>
            <h3>Chat</h3>
            <div>
                {messages.map((msg, i) => (
                    <div key={i}>{msg}</div>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};
