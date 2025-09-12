import { useEffect, useState } from 'react';
import { Room, Client, getStateCallbacks } from 'colyseus.js';
import { roomIdentifier, type ServerAddress, type ConnectionState } from 'common-types';
import type { GameState, GameStatus } from 'engine';

export function useRoomConnection(
    serverAddress: ServerAddress | undefined | null,
    setConnectionState: (state: ConnectionState) => void,
) {
    const [room, setConnectedRoom] = useState<Room<GameState> | null>(null);
    const [shipId, setShipId] = useState<string | undefined>(undefined);
    const [gameStatus, setGameStatus] = useState<GameStatus>('setup');

    useEffect(() => {
        if (!serverAddress) {
            return;
        }

        const wsUrl = `ws://${serverAddress.ip}:${serverAddress.port}`;
        console.log(`connecting to game server at ${wsUrl}...`);

        const client = new Client(wsUrl);

        let joinedRoom: Room<GameState> | undefined;

        client
            .joinOrCreate<GameState>(roomIdentifier, { type: 'ship' })
            .then((joiningRoom) => {
                joinedRoom = joiningRoom;
                setConnectedRoom(joiningRoom);
                setConnectionState('connected');
                console.log('connected to game server', joiningRoom);

                joinedRoom.onMessage<{ shipId: string }>('joined', message => {
                    console.log(`joined as ship ${message.shipId}`);
                    setShipId(message.shipId);
                });

                const callbacks = getStateCallbacks(joinedRoom);
                
                setGameStatus(joinedRoom.state.gameStatus);
                
                callbacks(joinedRoom.state).listen('gameStatus', (newGameStatus: GameStatus) => {
                    console.log('gameStatus changed to', newGameStatus);
                    setGameStatus(newGameStatus);
                });

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
    }, [serverAddress, setConnectionState]);

    return [room, shipId, gameStatus] as const;
}
