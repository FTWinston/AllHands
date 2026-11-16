import { ServerAddress } from 'common-data/types/ServerAddress';
import { Screen } from 'common-ui/components/Screen';
import { TimeProviderContext } from 'common-ui/contexts/TimeProviderContext';
import { useDevTimeHotkeys } from 'common-ui/hooks/useDevTimeHotkeys';
import { useCallback, useEffect, useState } from 'react';
import { DevTools } from 'src/features/devtools/DevTools';
import { useRoomConnection } from 'src/hooks/useRoomConnection';
import { GameLobby } from '../features/lobby/GameLobby';
import { MenuSelector } from '../features/menus/MenuSelector';
import { Viewscreen } from '../features/viewscreen/Viewscreen';
import { useServerConnection } from '../hooks/useServerConnection';
import type { ConnectionState } from 'common-data/types/ConnectionState';

export const GameUI = () => {
    const [connectionState, setConnectionState]
        = useState<ConnectionState>('disconnected');

    const [allowMultipleCrews, setAllowMultipleCrews] = useState(false);
    const [serverAddress, setServerAddress] = useState<ServerAddress>();

    const [serverType, setServerType] = useServerConnection(
        serverAddress,
        allowMultipleCrews,
        setServerAddress,
        setConnectionState
    );

    const [room, crewId, shipId, serverState, timeProvider, devEncounters] = useRoomConnection(serverAddress, setConnectionState);

    const disconnect = useCallback(() => {
        setServerType(undefined);
        setServerAddress(undefined);
    }, [setServerType, setServerAddress]);

    // Dev tools are only enabled at build time.
    const devTools = !!import.meta.env.DEV_TOOLS;

    useDevTimeHotkeys(room, devTools, serverState);

    // With dev tools, pausing leaves the game on screen, so orders can be given while paused. The menu is then opened separately.
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (serverState !== 'paused') {
            setMenuOpen(false);
        }
    }, [serverState]);

    const pause = useCallback(() => {
        room?.send('pause');
    }, [room]);

    const openMenu = useCallback(() => {
        setMenuOpen(true);
        if (serverState !== 'paused') {
            room?.send('pause');
        }
    }, [room, serverState]);

    const resume = useCallback(() => {
        room?.send('resume');
    }, [room]);

    const showPausedGame = devTools && serverState === 'paused' && !menuOpen;

    if (connectionState === 'connected' && (serverState !== 'paused' || showPausedGame)) {
        // The viewscreen also covers 'ended', where it shows the outcome.
        if (serverState === 'active' || serverState === 'ended' || showPausedGame) {
            if (room && shipId && timeProvider) {
                const children = devTools && (
                    <DevTools room={room} encounters={devEncounters} paused={serverState === 'paused'} />
                );

                return (
                    <TimeProviderContext.Provider value={timeProvider}>
                        <Viewscreen
                            room={room}
                            shipId={shipId}
                            // A game that's over can't be paused or resumed, so the only place left to go is the main menu.
                            showMenu={serverState === 'ended' ? disconnect : devTools ? openMenu : pause}
                        >
                            {children}
                        </Viewscreen>
                    </TimeProviderContext.Provider>
                );
            } else {
                console.warn(
                    'expected room, shipId & timeProvider to be set when serverState is active', {
                        room, shipId,
                    }
                );
            }
        } else if (serverState === 'setup') {
            if (serverAddress && room && crewId && serverType) {
                return (
                    <>
                        <GameLobby
                            serverAddress={serverAddress}
                            room={room}
                            crewId={crewId}
                            allowMultipleCrews={allowMultipleCrews}
                            disconnect={disconnect}
                        />
                        {devTools && (
                            <DevTools room={room} encounters={devEncounters} inLobby />
                        )}
                    </>
                );
            } else {
                console.warn(
                    'expected serverAddress, room, crewId & serverType to be set when connectionState is setup', {
                        serverAddress, room, crewId, serverType,
                    }
                );
            }
        } else {
            console.warn('unexpected serverState', serverState);
        }
    } else if (connectionState === 'disconnected' || serverState === 'paused') {
        return (
            <MenuSelector
                isConnectedToGame={connectionState === 'connected'}
                hostSingleCrewServer={() => {
                    setAllowMultipleCrews(false);
                    setServerType('local');
                }}
                hostMultiCrewServer={() => {
                    setAllowMultipleCrews(true);
                    setServerType('local');
                }}
                joinServer={(address) => {
                    setServerType('remote');
                    setServerAddress(address);
                }}
                resumeGame={resume}
                disconnect={disconnect}
                quit={window.electronAPI.quit}
            />
        );
    }

    // Whether connectionState is "connecting" or one of the expected/required props is missing, show "connecting" screen.
    return <Screen centered>connecting...</Screen>;
};
