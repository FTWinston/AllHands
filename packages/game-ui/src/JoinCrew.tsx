import QRCode from "react-qr-code";
import type { ServerAddress } from "common-types";
import { Chat } from "./Chat";
import { Room } from "colyseus.js";

type Props = {
    serverAddress: ServerAddress;
    room: Room;
};

export const JoinCrew: React.FC<Props> = (props) => {
    const { serverAddress, room } = props;

    const serverUrl =
        serverAddress && room
            ? `http://${serverAddress.ip}:${serverAddress.port}/?crew=${room.sessionId}`
            : "";

    return (
        <div>
            <h2>Scan to connect</h2>
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
        </div>
    );
};
