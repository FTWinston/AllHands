import QRCode from "react-qr-code";
import type { ServerAddress } from "common-types";
import { Screen } from "common-ui";
import { Chat } from "../game/Chat";
import { Room } from "colyseus.js";
import type { ServerType } from "../../hooks/useServerConnection";
import { Button } from "common-ui";

type Props = {
    serverAddress: ServerAddress;
    serverType: ServerType;
    allowMultipleCrews: boolean;
    room: Room;
    disconnect: () => void;
};

export const GameLobby: React.FC<Props> = (props) => {
    const { serverAddress, room } = props;

    const serverUrl = `http://${serverAddress.ip}:${serverAddress.port}/?crew=${room.sessionId}`;

    // TODO: show a message about starting when all roles are filled,
    // or if allowMultipleCrews is true, a "Start Game" button if you're the host,
    // or just a message about waiting for the host, if not the host.
    // (Should the First Player be the host by default, so this still works for a dedicated server? Needs to account for disconnecting if so.)

    // Would a "ready" button cover all of those eventualities?

    return (
        <Screen>
            <h1>Scan to connect</h1>
            <p>
                Open your phone camera and scan the QR code below to join the
                game.
            </p>
            <p>
                Or open your browser and go to{" "}
                <a href={serverUrl}>{serverUrl}</a>
            </p>
            <QRCode value={serverUrl} size={256} />

            <Chat room={room} />

            <Button
                onClick={props.disconnect}
                label="Disconnect"
                size="medium"
                appearance="secondary"
            />
        </Screen>
    );
};
