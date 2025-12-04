import { ServerAddress } from 'common-data/types/ServerAddress';
import type { ConnectionState } from 'common-data/types/ConnectionState';
import { Screen } from 'common-ui/components/Screen';
import { useState } from 'react';
import { useRoomConnection } from 'src/hooks/useRoomConnection';

import { Game } from '../features/game/Game';
import { GameLobby } from '../features/lobby/GameLobby';
import { MenuSelector } from '../features/menus/MenuSelector';
import { useServerConnection } from '../hooks/useServerConnection';

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

    const [room, crewId, serverState, timeProvider] = useRoomConnection(serverAddress, setConnectionState);

    const disconnect = () => {
        setServerType(undefined);
        setServerAddress(undefined);
    };

    if (connectionState === 'connected' && serverState !== 'paused') {
        if (serverState === 'active') {
            if (room && crewId && timeProvider) {
                return (
                    <Game
                        room={room}
                        crewID={crewId}
                        disconnect={disconnect}
                        timeProvider={timeProvider}
                    />
                );
            } else {
                console.warn(
                    'expected room, crewId & timeProvider to be set when connectionState is active', {
                        room, crewId,
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
                resumeGame={() => {
                    console.log('TODO: resume paused game');
                }}
                disconnect={disconnect}
                quit={window.electronAPI.quit}
            />
        );
    }

    // Whether connectionState is "connecting" or one of the expected/required props is missing, show "connecting" screen.
    return <Screen centered>connecting...</Screen>;
};
