import { type ConnectionState } from 'common-types';
import { Screen } from 'common-ui/components/Screen';
import { useState } from 'react';
import { GameLobby } from '../features/lobby/GameLobby';
import { useRoomConnection } from '../hooks/useRoomConnection';
import { CrewUI } from './CrewUI';

export const PlayerUI = () => {
    const [connectionState, setConnectionState]
        = useState<ConnectionState>('connecting');

    const [room, crewId, role, ready, serverState] = useRoomConnection(setConnectionState);

    if (connectionState === 'connected') {
        if (serverState === 'active') {
            if (room && crewId && role) {
                return (
                    <CrewUI
                        role={role}
                        room={room}
                    />
                );
            } else {
                console.warn(
                    'expected room, crewId & role to be set when serverState is active', {
                        room, crewId, role,
                    }
                );
            }
        } else if (serverState === 'setup') {
            if (room && crewId) {
                return (
                    <GameLobby
                        room={room}
                        crewId={crewId}
                        role={role}
                        ready={ready}
                    />
                );
            } else {
                console.warn(
                    'expected room & crewId to be set when serverState is setup', {
                        room, crewId,
                    }
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
