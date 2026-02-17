import { useRoomState } from '@colyseus/react';
import { Room, Client, getStateCallbacks } from '@colyseus/sdk';
import { engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole, type CrewRole } from 'common-data/features/ships/types/CrewRole';
import { roomIdentifier, soloCrewIdentifier } from 'common-data/utils/constants';
import { TimeSynchronizer } from 'common-ui/classes/TimeSynchronizer';
import { useEffect, useRef, useState } from 'react';
import type { ConnectionState } from 'common-data/types/ConnectionState';
import type { GameState } from 'engine/state/GameState';

// A temporary stub that satisfies useRoomState's property access when room is null.
const emptyRoom = { state: null, serializer: { decoder: null } } as unknown as Room<{ state: GameState }>;

export function useRoomConnection(
    setConnectionState: (state: ConnectionState) => void
) {
    const [connectedRoom, setConnectedRoom] = useState<Room<{ state: GameState }> | null>(null);
    const timeSynchronizer = useRef<TimeSynchronizer | null>(null);
    const [crewId, setCrewId] = useState<string | null>(null);
    const [shipId, setShipId] = useState<string | null>(null);
    const [role, setRole] = useState<CrewRole | null>(null);
    const [ready, setReady] = useState(false);

    const gameStatus = useRoomState(connectedRoom ?? emptyRoom, state => state.gameStatus) ?? 'setup';

    useEffect(() => {
        const crewId = new URLSearchParams(window.location.search).get('crew') ?? soloCrewIdentifier;

        setCrewId(crewId);

        const wsUrl = `ws://${window.location.hostname}:${window.location.port}`;
        console.log(`connecting to game server at ${wsUrl}..., using crew ID ${crewId}`);

        const client = new Client(wsUrl);

        let joinedRoom: Room<{ state: GameState }> | undefined;

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

                joinedRoom.onMessage<{ shipId: string | null }>('ship', (message) => {
                    console.log(`ship assigned: ${message.shipId}`);
                    setShipId(message.shipId);
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

    return [connectedRoom, crewId, shipId, role, ready, gameStatus, timeSynchronizer.current] as const;
}
