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

    const [room, crewID, serverState] = useRoomConnection(serverAddress, setConnectionState);

    const disconnect = () => {
        setServerType(undefined);
        setServerAddress(undefined);
    };

    if (connectionState === 'connected') {
        if (serverState === 'active') {
            if (room && crewID) {
                return <Game room={room} crewID={crewID} disconnect={disconnect} />;
            } else {
                console.warn(
                    'expected room & crewID to be set when connectionState is active', {
                        room, crewID,
                    },
                );
            }
        } else if (serverState === 'setup') {
            if (serverAddress && room && crewID && serverType) {
                return (
                    <GameLobby
                        serverAddress={serverAddress}
                        room={room}
                        crewId={crewID}
                        serverType={serverType}
                        allowMultipleCrews={allowMultipleCrews}
                        disconnect={disconnect}
                    />
                );
            } else {
                console.warn(
                    'expected serverAddress, room, crewID & serverType to be set when connectionState is setup', {
                        serverAddress, room, crewID, serverType,
                    },
                );
            }
        } else if (serverState === 'paused') {
            return <Screen centered>paused</Screen>;
        } else {
            console.warn('unexpected serverState', serverState);
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
