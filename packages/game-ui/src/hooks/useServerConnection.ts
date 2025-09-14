import { useEffect, useState } from 'react';

import type { ConnectionState, ServerAddress } from 'common-types';

export type ServerType = 'local' | 'remote';

export function useServerConnection(
    serverAddress: ServerAddress | undefined,
    setServerAddress: (value: ServerAddress) => void,
    setConnectionState: (value: ConnectionState) => void,
) {
    const serverTypeState = useState<ServerType>();
    const serverType = serverTypeState[0];

    const isLocal = serverType === 'local';
    const isRemote = serverType === 'remote';

    useEffect(() => {
        if (!isLocal) {
            return;
        }

        const startHosting = async() => {
            setConnectionState('connecting');
            const startServerAddress = await window.electronAPI.startServer();
            setServerAddress(startServerAddress);
        };

        startHosting();
        return () => {
            setConnectionState('disconnected');
            window.electronAPI.stopServer();
        };
    }, [isLocal, setServerAddress, setConnectionState]);

    useEffect(() => {
        if (!isRemote || !serverAddress) {
            return;
        }

        setConnectionState('connecting');

        return () => {
            setConnectionState('disconnected');
        };
    }, [isRemote, serverAddress, setServerAddress, setConnectionState]);

    return serverTypeState;
}
