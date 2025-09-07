import { useState } from "react";
import type { ServerAddress } from "common-types";
import { useRoomConnection } from "./useRoomConnection";
import { useHostServer } from "./useHostServer";
import { JoinCrew } from "./JoinCrew";

export const GameApp = () => {
    const [serverAddress, setServerAddress] = useState<ServerAddress>();
    /*const [hostServer, setHostServer] =*/ useHostServer(setServerAddress);
    const room = useRoomConnection(serverAddress);

    return (
        <main>
            <h1>Host UI</h1>
            {serverAddress && room ? (
                <JoinCrew serverAddress={serverAddress} room={room} />
            ) : (
                <p>
                    Waiting for server to start...
                    <br />
                    or should you be connecting to a remote game?
                </p>
            )}

            <button onClick={window.electronAPI.quit}>quit app</button>
        </main>
    );
};
