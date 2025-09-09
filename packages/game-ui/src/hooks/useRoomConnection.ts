import { useEffect, useState } from 'react';
import { Room, Client } from 'colyseus.js';
import { roomIdentifier, type ServerAddress } from 'common-types';
import type { ConnectionState } from '../types/ConnectionState';

export function useRoomConnection(
    serverAddress: ServerAddress | undefined | null,
    setConnectionState: (state: ConnectionState) => void,
) {
    const [connectedRoom, setConnectedRoom] = useState<Room | null>(null);

    useEffect(() => {
        if (!serverAddress) {
            return;
        }

        const wsUrl = `ws://${serverAddress.ip}:${serverAddress.port}`;
        console.log(`connecting to game server at ${wsUrl}...`);

        const client = new Client(wsUrl);

        let room: Room | undefined;

        client
            .joinOrCreate<{ messages: string[] }>(roomIdentifier)
            .then((joiningRoom) => {
                room = joiningRoom;
                setConnectedRoom(joiningRoom);
                setConnectionState('setup');
                console.log('joined successfully', joiningRoom);
            })
            .catch((e) => {
                console.error('join error', e);
                setConnectionState('disconnected');
            });

        return () => {
            room?.leave();
        };
    }, [serverAddress, setConnectionState]);

    return connectedRoom;
}
