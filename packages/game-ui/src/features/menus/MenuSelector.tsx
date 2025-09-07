import type { ServerAddress } from "common-types";
import { JoinCrew } from "./JoinCrew";
import { Room } from "colyseus.js";
import { MainMenu } from "./MainMenu";
import { useState } from "react";

type Props = {
    hostServer: boolean;
    setHostServer: (value: boolean) => void;
    serverAddress: ServerAddress | undefined;
    room: Room<unknown> | null;
};

export const MenuSelector: React.FC<Props> = (props) => {
    const [joinServer, setJoinServer] = useState(false);

    if (props.hostServer || joinServer) {
        if (props.serverAddress && props.room) {
            return (
                <JoinCrew
                    serverAddress={props.serverAddress}
                    room={props.room}
                />
            );
        } else if (props.hostServer) {
            return "starting...";
        }

        // TODO: we need a useJoinServer hook for actually doing this, then a menu for it.
        return "connecting...";
    }

    return (
        <MainMenu
            hostServer={() => props.setHostServer(true)}
            joinServer={() => setJoinServer(true)}
            quit={window.electronAPI.quit}
        />
    );
};
