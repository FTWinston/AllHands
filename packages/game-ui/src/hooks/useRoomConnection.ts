import { Room, Client, getStateCallbacks } from '@colyseus/sdk';
import { roomIdentifier } from 'common-data/utils/constants';
import { TimeSynchronizer } from 'common-ui/classes/TimeSynchronizer';
import { useEffect, useRef, useState } from 'react';
import type { ConnectionState } from 'common-data/types/ConnectionState';
import type { ServerAddress } from 'common-data/types/ServerAddress';
import type { GameState } from 'engine/state/GameState';
import type { GameStatus } from 'engine/types/GameStatus';

export function useRoomConnection(
    serverAddress: ServerAddress | undefined | null,
    setConnectionState: (state: ConnectionState) => void
) {
    const [room, setConnectedRoom] = useState<Room<{ state: GameState }> | null>(null);
    const timeSynchronizer = useRef<TimeSynchronizer | null>(null);
    const [crewId, setCrewId] = useState<string | null>(null);
    const [shipId, setShipId] = useState<string | null>(null);
    const [gameStatus, setGameStatus] = useState<GameStatus>('setup');

    useEffect(() => {
        if (!serverAddress) {
            return;
        }

        const wsUrl = `ws://${serverAddress.ip}:${serverAddress.port}`;
        console.log(`connecting to game server at ${wsUrl}...`);

        const client = new Client(wsUrl);

        let joinedRoom: Room<{ state: GameState }> | undefined;

        client
            .joinOrCreate<GameState>(roomIdentifier, { type: 'ship' })
            .then((joiningRoom) => {
                joinedRoom = joiningRoom;
                setConnectedRoom(joiningRoom);
                console.log('connected to game server', joiningRoom);

                timeSynchronizer.current = new TimeSynchronizer(joiningRoom);

                timeSynchronizer.current.start();

                joinedRoom.onMessage<{ crewId: string }>('joined', (message) => {
                    console.log(`joined as ship for crew ${message.crewId}`);
                    setCrewId(message.crewId);
                    setConnectionState('connected');
                });

                const callbacks = getStateCallbacks(joinedRoom);

                callbacks(joinedRoom.state).crews.onAdd((crew) => {
                    callbacks(crew).listen('shipId', (newId) => {
                        setShipId(newId);
                    });

                    setShipId(crew.crewId);
                });

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
            timeSynchronizer.current?.stop();
            joinedRoom?.leave();
        };
    }, [serverAddress, setConnectionState]);

    return [room, crewId, shipId, gameStatus, timeSynchronizer.current] as const;
}
