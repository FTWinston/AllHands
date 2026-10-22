import { type ConnectionState } from 'common-data/types/ConnectionState';
import { Screen } from 'common-ui/components/Screen';
import { TimeProviderContext } from 'common-ui/contexts/TimeProviderContext';
import { sounds } from 'common-ui/features/sound/sounds';
import { useWakeLock } from 'common-ui/hooks/useWakeLock';
import { useEffect, useRef, useState } from 'react';
import { GameLobby } from '../features/lobby/GameLobby';
import { useRoomConnection } from '../hooks/useRoomConnection';
import { CrewUI } from './CrewUI';

export const PlayerUI = () => {
    const [connectionState, setConnectionState]
        = useState<ConnectionState>('connecting');

    const [room, crewId, shipId, role, serverState, timeProvider] = useRoomConnection(setConnectionState);

    useWakeLock();
    useGameStartSound(serverState);

    if (connectionState === 'connected') {
        if (serverState === 'active') {
            if (room && shipId && role && timeProvider) {
                return (
                    <TimeProviderContext.Provider value={timeProvider}>
                        <CrewUI
                            room={room}
                            shipId={shipId}
                            role={role}
                        />
                    </TimeProviderContext.Provider>
                );
            } else {
                console.warn(
                    'expected room, shipId, role & timeProvider to be set when serverState is active', {
                        room, shipId, role,
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

/** Play a chord when the game goes from the lobby to actually playing. */
function useGameStartSound(serverState: string | null | undefined) {
    const previousState = useRef(serverState);

    useEffect(() => {
        if (previousState.current === 'setup' && serverState === 'active') {
            sounds.gameStarted();
        }
        previousState.current = serverState;
    }, [serverState]);
}
