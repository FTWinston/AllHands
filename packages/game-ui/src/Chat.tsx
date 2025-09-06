import React, { useState, useEffect, useRef } from "react";
import { Room, Client } from "colyseus.js";
import type { ClientConfig } from "common-types";

interface ChatProps {
    clientConfig: ClientConfig;
}

export const Chat: React.FC<ChatProps> = ({ clientConfig }) => {
    const roomRef = useRef<Room>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!clientConfig) {
            return;
        }

        const wsUrl = `ws://${clientConfig.serverIpAddress}:${clientConfig.serverHttpPort}`;
        const client = new Client(wsUrl);

        client
            .joinOrCreate<{ messages: string[] }>("my_room")
            .then((room) => {
                roomRef.current = room;
                console.log("joined successfully", room);

                room.onMessage("messages", (message) => {
                    setMessages((prev) => [...prev, message]);
                });
            })
            .catch((e) => {
                console.error("join error", e);
            });

        return () => {
            roomRef.current?.leave();
        };
    }, [clientConfig]);

    const sendMessage = () => {
        if (roomRef.current && message) {
            roomRef.current.send("message", message);
            setMessage("");
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
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};
