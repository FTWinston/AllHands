import { useEffect, useState } from 'react';
import { Room, Client } from 'colyseus.js';
import { roomIdentifier, type ServerAddress, type ConnectionState } from 'common-types';

export function useRoomConnection(
    serverAddress: ServerAddress | undefined | null,
    setConnectionState: (state: ConnectionState) => void,
) {
    const [connectedRoom, setConnectedRoom] = useState<Room | null>(null);
    const [shipId, setShipId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!serverAddress) {
            return;
        }

        const wsUrl = `ws://${serverAddress.ip}:${serverAddress.port}`;
        console.log(`connecting to game server at ${wsUrl}...`);

        const client = new Client(wsUrl);

        let room: Room | undefined;

        client
            .joinOrCreate<{ messages: string[] }>(roomIdentifier, { role: 'ship' })
            .then((joiningRoom) => {
                room = joiningRoom;
                setConnectedRoom(joiningRoom);
                setConnectionState('setup');
                console.log('connected to game server', joiningRoom);

                room.onMessage<{ shipId: string }>('joined', message => {
                    console.log(`joined as ship ${message.shipId}`);
                    setShipId(message.shipId);
                });
            })
            .catch((e) => {
                console.error('join error', e);
                setConnectionState('disconnected');
            });

        return () => {
            room?.leave();
        };
    }, [serverAddress, setConnectionState]);

    return [connectedRoom, shipId] as const;
}
