import { type ConnectionState } from 'common-types';
import { Screen } from 'common-ui';
import { useState } from 'react';
import { useRoomConnection } from '../hooks/useRoomConnection';
import { GameLobby } from '../features/menus/GameLobby';

export const PlayerUI = () => {
    const [connectionState, setConnectionState] =
        useState<ConnectionState>('connecting');

    const [room, shipId, role] = useRoomConnection(setConnectionState);

    if (connectionState === 'active') {
        if (room && shipId && role) {
            switch (role) {
                case 'helm':
                    return <Screen>Helm console (not implemented yet)</Screen>;
                case 'tactical':
                    return <Screen>Tactical console (not implemented yet)</Screen>;
                case 'sensors':
                    return <Screen>Sensors console (not implemented yet)</Screen>;
                case 'engineer':
                    return <Screen>Engineer console (not implemented yet)</Screen>;
                default:
                    console.warn('unexpected role', role);
            }
        } else {
            console.warn(
                'expected room, shipId & role to be set when connectionState is active', {
                    room, shipId, role,
                },
            );
        }
    } else if (connectionState === 'setup') {
        if (room && shipId) {
            return (
                <GameLobby
                    room={room}
                    shipId={shipId}
                />
            );
        } else {
            console.warn(
                'expected room & shipId to be set when connectionState is setup', {
                    room, shipId,
                },
            );
        }
    } else if (connectionState === 'disconnected') {
        return <Screen centered>Disconnected from game</Screen>;
    }
    
    // Whether connectionState is "connecting" or one of the expected/required props is missing, show "connecting" screen.
    return <Screen centered>connecting...</Screen>;
};
