import { useRoomState } from '@colyseus/react';
import { Room, Client } from '@colyseus/sdk';
import { roomIdentifier } from 'common-data/utils/constants';
import { TimeSynchronizer } from 'common-ui/classes/TimeSynchronizer';
import { useEffect, useRef, useState } from 'react';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';
import type { SectorServerMessages } from 'common-data/features/sectors/types/SectorMessages';
import type { ConnectionState } from 'common-data/types/ConnectionState';
import type { ServerAddress } from 'common-data/types/ServerAddress';
import type { GameState } from 'engine/state/GameState';

// A temporary stub that satisfies useRoomState's property access when room is null.
const emptyRoom = { state: null, serializer: { decoder: null } } as unknown as Room<unknown, GameState>;

export function useRoomConnection(
    serverAddress: ServerAddress | undefined | null,
    setConnectionState: (state: ConnectionState) => void
) {
    const [room, setConnectedRoom] = useState<Room<unknown, GameState> | null>(null);
    const timeSynchronizer = useRef<TimeSynchronizer | null>(null);
    const [crewId, setCrewId] = useState<string | null>(null);
    const [shipId, setShipId] = useState<string | null>(null);
    // Only ever populated by servers built with dev tools; the server sends the list once, right after joining.
    const [devEncounters, setDevEncounters] = useState<DevEncounterInfo[]>([]);

    const gameStatus = useRoomState(room ?? emptyRoom, state => state.gameStatus) ?? 'setup';

    useEffect(() => {
        if (!serverAddress) {
            return;
        }

        const wsUrl = `ws://${serverAddress.ip}:${serverAddress.port}`;
        console.log(`connecting to game server at ${wsUrl}...`);

        const client = new Client(wsUrl);

        let joinedRoom: Room<unknown, GameState> | undefined;

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

                joinedRoom.onMessage<{ shipId: string | null }>('ship', (message) => {
                    console.log(`ship assigned: ${message.shipId}`);
                    setShipId(message.shipId);
                });

                if (import.meta.env.VITE_DEV_TOOLS) {
                    joinedRoom.onMessage<SectorServerMessages['devEncounterList']>('devEncounterList', (encounters) => {
                        setDevEncounters(encounters);
                    });
                }

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

    return [room, crewId, shipId, gameStatus, timeSynchronizer.current, devEncounters] as const;
}
