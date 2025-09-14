import { Room, Client, getStateCallbacks } from 'colyseus.js';
import { roomIdentifier, type ConnectionState, type CrewRole } from 'common-types';
import { useEffect, useState } from 'react';

import type { GameState, GameStatus } from 'engine';

export function useRoomConnection(
    setConnectionState: (state: ConnectionState) => void,
) {
    const [connectedRoom, setConnectedRoom] = useState<Room<GameState> | null>(null);
    const [crewId, setCrewId] = useState<string | undefined>(undefined);
    const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
    const [role, setRole] = useState<CrewRole | null>(null);

    useEffect(() => {
        const crewId = new URLSearchParams(window.location.search).get('crew');

        if (crewId === null) {
            setConnectionState('disconnected');
            return;
        }

        const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
        console.log(`connecting to game server at ${wsUrl}..., using crew ID ${crewId}`);

        setCrewId(crewId);

        const client = new Client(wsUrl);

        let joinedRoom: Room<GameState> | undefined;

        client
            .joinOrCreate<GameState>(roomIdentifier, { type: 'crew', crewId })
            .then((joiningRoom) => {
                joinedRoom = joiningRoom;
                setConnectedRoom(joiningRoom);
                console.log('connected to game server', joiningRoom);

                joinedRoom.onMessage<{ crewId: string }>('joined', message => {
                    console.log(`joined crew ${message.crewId}`);
                    setCrewId(message.crewId);
                    setConnectionState('connected');
                });

                const callbacks = getStateCallbacks(joinedRoom);

                setGameStatus(joinedRoom.state.gameStatus);

                callbacks(joinedRoom.state).listen('gameStatus', (newGameStatus: GameStatus) => {
                    console.log('gameStatus changed to', newGameStatus);
                    setGameStatus(newGameStatus);
                });

                // TODO: track local role, call setRole if it changes.
                //const ship = joinedRoom.state.ships.get(crewId);
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

    return [connectedRoom, crewId, gameStatus, role] as const;
}
