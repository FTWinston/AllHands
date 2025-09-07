import QRCode from "react-qr-code";
import type { ServerAddress } from "common-types";
import { Chat } from "../game/Chat";
import { Room } from "colyseus.js";

type Props = {
    serverAddress: ServerAddress;
    room: Room;
};

export const JoinCrew: React.FC<Props> = (props) => {
    const { serverAddress, room } = props;

    const serverUrl = `http://${serverAddress.ip}:${serverAddress.port}/?crew=${room.sessionId}`;

    return (
        <main>
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
        </main>
    );
};
