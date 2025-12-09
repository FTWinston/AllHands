import { ServerAddress } from 'common-data/types/ServerAddress';
import { Screen } from 'common-ui/components/Screen';
import { useCallback, useState } from 'react';
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

    const [room, crewId, shipId, serverState, timeProvider] = useRoomConnection(serverAddress, setConnectionState);

    const disconnect = useCallback(() => {
        setServerType(undefined);
        setServerAddress(undefined);
    }, [setServerType, setServerAddress]);

    const pause = useCallback(() => {
        room?.send('pause');
    }, [room]);

    const resume = useCallback(() => {
        room?.send('resume');
    }, [room]);

    if (connectionState === 'connected' && serverState !== 'paused') {
        if (serverState === 'active') {
            if (room && shipId && timeProvider) {
                return (
                    <Viewscreen
                        room={room}
                        shipId={shipId}
                        showMenu={pause}
                        timeProvider={timeProvider}
                    />
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
                    <GameLobby
                        serverAddress={serverAddress}
                        room={room}
                        crewId={crewId}
                        allowMultipleCrews={allowMultipleCrews}
                        disconnect={disconnect}
                    />
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
