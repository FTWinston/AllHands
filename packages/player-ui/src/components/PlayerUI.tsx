import { CrewRole, engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole, type ConnectionState } from 'common-types';
import { Screen } from 'common-ui';
import { useState } from 'react';
import { useRoomConnection } from '../hooks/useRoomConnection';
import { GameLobby } from '../features/menus/GameLobby';
import { Helm } from '../features/helm';
import { Engineer } from '../features/engineer';
import { Sensors } from '../features/sensors';
import { Tactical } from '../features/tactical';

export const PlayerUI = () => {
    const [connectionState, setConnectionState] =
        useState<ConnectionState>('connecting');

    const [room, shipId, serverState] = useRoomConnection(setConnectionState);
    const [role, setRole] = useState<CrewRole | null>(null); // TODO: track this with a listener in useRoomConnection

    if (connectionState === 'connected') {
        if (serverState === 'active') {
            if (room && shipId && role) {
                switch (role) {
                    case helmClientRole:
                        return <Helm room={room} />;
                    case tacticalClientRole:
                        return <Tactical room={room} />;
                    case sensorClientRole:
                        return <Sensors room={room} />;
                    case engineerClientRole:
                        return <Engineer room={room} />;
                    default:
                        console.warn('unexpected role', role);
                }
            } else {
                console.warn(
                    'expected room, shipId & role to be set when serverState is active', {
                        room, shipId, role,
                    },
                );
            }
        } else if (serverState === 'setup') {
            if (room && shipId) {
                return (
                    <GameLobby
                        room={room}
                        shipId={shipId}
                        role={role}
                        setRole={setRole}
                    />
                );
            } else {
                console.warn(
                    'expected room & shipId to be set when serverState is setup', {
                        room, shipId,
                    },
                );
            }
        } else if (serverState === 'paused') {
            return <Screen centered>paused</Screen>;
        } else {
            console.warn('unexpected serverState', serverState);
        }
    } else if (connectionState === 'disconnected') {
        return <Screen centered>Disconnected from game</Screen>;
    }
    
    // Whether connectionState is "connecting" or one of the expected/required props is missing, show "connecting" screen.
    return <Screen centered>connecting...</Screen>;
};
