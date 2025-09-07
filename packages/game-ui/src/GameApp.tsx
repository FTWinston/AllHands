import { useState } from "react";
import type { ServerAddress } from "common-types";
import { useRoomConnection } from "./hooks/useRoomConnection";
import { useHostServer } from "./hooks/useHostServer";
import { MenuSelector } from "./features/menus/MenuSelector";

export const GameApp = () => {
    const [serverAddress, setServerAddress] = useState<ServerAddress>();
    const [hostServer, setHostServer] = useHostServer(setServerAddress);
    const room = useRoomConnection(serverAddress);

    return (
        <MenuSelector
            hostServer={hostServer}
            setHostServer={setHostServer}
            serverAddress={serverAddress}
            room={room}
        />
    );
};
