import React, { useState, useEffect, useRef } from 'react';
import { Room, Client } from 'colyseus.js';
import { roomIdentifier } from 'common-types';

export const Chat: React.FC = () => {
    const roomRef = useRef<Room>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
        const client = new Client(wsUrl);

        client
            .joinOrCreate<{ messages: string[] }>(roomIdentifier)
            .then((room) => {
                roomRef.current = room;
                console.log('joined successfully', room);

                room.onMessage('messages', (message) => {
                    setMessages((prev) => [...prev, message]);
                });
            })
            .catch((e) => {
                console.error('join error', e);
            });

        return () => {
            roomRef.current?.leave();
        };
    }, []);

    const sendMessage = () => {
        if (roomRef.current && message) {
            roomRef.current.send('message', message);
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
