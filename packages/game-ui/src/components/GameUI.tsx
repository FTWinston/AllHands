import { useRoomConnection } from 'game-ui/hooks/useRoomConnection';
import { Game } from '../features/game/Game';
import { GameLobby } from '../features/menus/GameLobby';
import { MainMenu } from '../features/menus/MainMenu';
import { useServerConnection } from '../hooks/useServerConnection';
import { useState } from 'react';
import { ServerAddress, type ConnectionState } from 'common-types';
import { Screen } from 'common-ui';

export const GameUI = () => {
    const [connectionState, setConnectionState] =
        useState<ConnectionState>('disconnected');

    const [allowMultipleCrews] = useState(false); // TODO: make this configurable via MainMenu
    const [serverAddress, setServerAddress] = useState<ServerAddress>();

    const [serverType, setServerType] = useServerConnection(
        serverAddress,
        setServerAddress,
        setConnectionState,
    );

    const [room, shipId] = useRoomConnection(serverAddress, setConnectionState);

    const disconnect = () => {
        setServerType(undefined);
        setServerAddress(undefined);
    };

    if (connectionState === 'active') {
        if (room && shipId) {
            return <Game room={room} shipId={shipId} disconnect={disconnect} />;
        } else {
            console.warn(
                'expected room & shipId to be set when connectionState is active', {
                    room, shipId,
                },
            );
        }
    } else if (connectionState === 'setup') {
        if (serverAddress && room && shipId && serverType) {
            return (
                <GameLobby
                    serverAddress={serverAddress}
                    room={room}
                    shipId={shipId}
                    serverType={serverType}
                    allowMultipleCrews={allowMultipleCrews}
                    disconnect={disconnect}
                />
            );
        } else {
            console.warn(
                'expected serverAddress, room, shipId & serverType to be set when connectionState is setup', {
                    serverAddress, room, shipId, serverType,
                },
            );
        }
    } else if (connectionState === 'disconnected') {
        return (
            <MainMenu
                hostServer={() => setServerType('local')}
                joinServer={(address) => {
                    setServerType('remote');
                    setServerAddress(address);
                }}
                quit={window.electronAPI.quit}
            />
        );
    }

    // Whether connectionState is "connecting" or one of the expected/required props is missing, show "connecting" screen.
    return <Screen centered>connecting...</Screen>;
};
