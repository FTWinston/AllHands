import { Room, Client, getStateCallbacks } from 'colyseus.js';
import { engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole, type CrewRole } from 'common-data/features/ships/types/CrewRole';
import { roomIdentifier, soloCrewIdentifier } from 'common-data/utils/constants';
import { TimeSynchronizer } from 'common-ui/classes/TimeSynchronizer';
import { useEffect, useRef, useState } from 'react';
import type { ConnectionState } from 'common-data/types/ConnectionState';

import type { GameState, GameStatus } from 'engine';

export function useRoomConnection(
    setConnectionState: (state: ConnectionState) => void
) {
    const [connectedRoom, setConnectedRoom] = useState<Room<GameState> | null>(null);
    const timeSynchronizer = useRef<TimeSynchronizer | null>(null);
    const [crewId, setCrewId] = useState<string | undefined>(undefined);
    const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
    const [role, setRole] = useState<CrewRole | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const crewId = new URLSearchParams(window.location.search).get('crew') ?? soloCrewIdentifier;

        setCrewId(crewId);

        const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
        console.log(`connecting to game server at ${wsUrl}..., using crew ID ${crewId}`);

        const client = new Client(wsUrl);

        let joinedRoom: Room<GameState> | undefined;

        console.log('sending join options', { type: 'crew', crewId });

        client
            .joinOrCreate<GameState>(roomIdentifier, { type: 'crew', crewId })
            .then((joiningRoom) => {
                joinedRoom = joiningRoom;
                setConnectedRoom(joiningRoom);
                console.log('connected to game server', joiningRoom);

                timeSynchronizer.current = new TimeSynchronizer(joiningRoom);

                timeSynchronizer.current.start();

                joinedRoom.onMessage<{ crewId: string }>('joined', (message) => {
                    console.log(`joined crew ${message.crewId}`);

                    if (!joinedRoom) {
                        console.error('joinedRoom is undefined in joined message handler');
                        setConnectionState('disconnected');
                        return;
                    }

                    const crew = joinedRoom.state.crews.get(crewId);
                    if (!crew) {
                        console.error(`crew ${crewId} not found in room state`);
                        setConnectionState('disconnected');
                        joinedRoom.leave();
                        return;
                    }

                    // Update role and ready based on server state.
                    const updateRoleAndReady = () => {
                        if (!joinedRoom) {
                            return;
                        }

                        if (crew.helmClientId === joinedRoom.sessionId) {
                            setRole(helmClientRole);
                        } else if (crew.tacticalClientId === joinedRoom.sessionId) {
                            setRole(tacticalClientRole);
                        } else if (crew.sensorsClientId === joinedRoom.sessionId) {
                            setRole(sensorClientRole);
                        } else if (crew.engineerClientId === joinedRoom.sessionId) {
                            setRole(engineerClientRole);
                        } else {
                            setRole(null);
                        }
                        setReady(crew.crewReady.get(joinedRoom.sessionId) ?? false);
                    };
                    updateRoleAndReady();

                    // Do this again when roles or ready states change.
                    const callbacks = getStateCallbacks(joinedRoom);
                    callbacks(crew).onChange(updateRoleAndReady);

                    setConnectionState('connected');
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
            timeSynchronizer.current?.stop();
            joinedRoom?.leave();
        };
    }, [setConnectionState]);

    return [connectedRoom, crewId, role, ready, gameStatus, timeSynchronizer.current] as const;
}
