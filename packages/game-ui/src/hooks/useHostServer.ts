import { useEffect, useState } from "react";
import type { ServerAddress } from "common-types";

export function useHostServer(
    setServerAddress: (value: ServerAddress) => void,
) {
    const hostServerState = useState(false);
    const hostServer = hostServerState[0];

    useEffect(() => {
        if (!hostServer) {
            return;
        }

        const startHosting = async () => {
            const startServerAddress = await window.electronAPI.startServer();
            setServerAddress(startServerAddress);

            console.log(
                `connected to local server at ${startServerAddress.ip}:${startServerAddress.port}`,
            );
        };

        startHosting();
        return () => {
            window.electronAPI.stopServer();
        };
    }, [hostServer, setServerAddress]);

    return hostServerState;
}
