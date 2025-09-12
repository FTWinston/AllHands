import { useEffect, useState } from 'react';
import { Room, Client, getStateCallbacks } from 'colyseus.js';
import { roomIdentifier, type ConnectionState, type CrewRole } from 'common-types';
import type { GameState, GameStatus } from 'engine';

export function useRoomConnection(
    setConnectionState: (state: ConnectionState) => void,
) {
    const [connectedRoom, setConnectedRoom] = useState<Room<GameState> | null>(null);
    const [shipId, setShipId] = useState<string | undefined>(undefined);
    const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
    const [role, setRole] = useState<CrewRole | null>(null);

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

        let joinedRoom: Room<GameState> | undefined;

        client
            .joinOrCreate<GameState>(roomIdentifier, { type: 'crew', shipId })
            .then((joiningRoom) => {
                joinedRoom = joiningRoom;
                setConnectedRoom(joiningRoom);
                setConnectionState('connected');
                console.log('connected to game server', joiningRoom);

                const callbacks = getStateCallbacks(joinedRoom);
                
                setGameStatus(joinedRoom.state.gameStatus);
                
                callbacks(joinedRoom.state).listen('gameStatus', (newGameStatus: GameStatus) => {
                    console.log('gameStatus changed to', newGameStatus);
                    setGameStatus(newGameStatus);
                });

                setRole(null);
                
                joinedRoom.onLeave((code) => {
                    console.log('disconnected from server', code);
                    setConnectionState('disconnected');
                });
            })
            .catch((e) => {
                console.error('join error', e);
                setConnectionState('disconnected');
            });

        return () => {
            joinedRoom?.leave();
        };
    }, [setConnectionState]);

    return [connectedRoom, shipId, gameStatus, role] as const;
}
