import { useEffect, useState } from 'react';
import { Room, Client } from 'colyseus.js';
import { roomIdentifier, type ConnectionState } from 'common-types';
import { CrewRole } from 'packages/common-types/src/CrewRole';

export function useRoomConnection(
    setConnectionState: (state: ConnectionState) => void,
) {
    const [connectedRoom, setConnectedRoom] = useState<Room | null>(null);
    const [shipId, setShipId] = useState<string | undefined>(undefined);
    const [role, setRole] = useState<CrewRole | undefined>(undefined);

    useEffect(() => {
        const shipId = new URLSearchParams(window.location.search).get('ship');

        if (shipId === null) {
            setConnectionState('disconnected');
            return;
        }
        
        const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
        console.log(`connecting to game server at ${wsUrl}..., using ship ID ${shipId}`);

        setShipId(shipId);

        const client = new Client(wsUrl);

        let room: Room | undefined;

        client
            .joinOrCreate<{ messages: string[] }>(roomIdentifier, { role: 'crew', shipId })
            .then((joiningRoom) => {
                room = joiningRoom;
                setConnectedRoom(joiningRoom);
                setConnectionState('setup');
                console.log('connected to game server', joiningRoom);

                room.onMessage<{ role: CrewRole }>('role', message => {
                    console.log(`assigned role ${message.role}`);
                    setRole(message.role);
                });

                room.onLeave((code) => {
                    console.log('disconnected from server', code);
                    setConnectionState('disconnected');
                });
            })
            .catch((e) => {
                console.error('join error', e);
                setConnectionState('disconnected');
            });

        return () => {
            room?.leave();
        };
    }, [setConnectionState]);

    return [connectedRoom, shipId, role] as const;
}
