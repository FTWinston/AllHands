import { type ConnectionState } from 'common-data/types/ConnectionState';
import { Screen } from 'common-ui/components/Screen';
import { TimeProviderContext } from 'common-ui/contexts/TimeProviderContext';
import { useDevTimeHotkeys } from 'common-ui/hooks/useDevTimeHotkeys';
import { useWakeLock } from 'common-ui/hooks/useWakeLock';
import { useState } from 'react';
import { CrewGameEnded } from '../features/gameEnded/CrewGameEnded';
import { GameLobby } from '../features/lobby/GameLobby';
import { useRoomConnection } from '../hooks/useRoomConnection';
import { CrewUI } from './CrewUI';

export const PlayerUI = () => {
    const [connectionState, setConnectionState]
        = useState<ConnectionState>('connecting');

    const [room, crewId, shipId, role, serverState, timeProvider, devTools] = useRoomConnection(setConnectionState);

    useWakeLock();
    useDevTimeHotkeys(room, devTools, serverState);

    if (connectionState === 'connected') {
        // With dev tools, the crew can still reach their cards while paused.
        if (serverState === 'active' || (devTools && serverState === 'paused')) {
            if (room && shipId && role && timeProvider) {
                return (
                    <TimeProviderContext.Provider value={timeProvider}>
                        <CrewUI
                            room={room}
                            shipId={shipId}
                            role={role}
                        />
                        {serverState === 'paused' && (
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 10,
                                    padding: '0.1em 0.6em',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    pointerEvents: 'none',
                                }}
                            >
                                Paused
                            </div>
                        )}
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
        } else if (serverState === 'ended') {
            if (room) {
                return <CrewGameEnded room={room} />;
            } else {
                console.warn('expected room to be set when serverState is ended');
            }
        } else {
            console.warn('unexpected serverState', serverState);
        }
    } else if (connectionState === 'disconnected') {
        return <Screen centered>Disconnected from game</Screen>;
    }

    // Whether connectionState is "connecting" or one of the expected/required props is missing, show "connecting" screen.
    return <Screen centered>connecting...</Screen>;
};
