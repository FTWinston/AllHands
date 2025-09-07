import { useEffect, useState } from "react";
import { Room, Client } from "colyseus.js";
import { roomIdentifier, type ServerAddress } from "common-types";

export function useRoomConnection(
    serverAddress: ServerAddress | undefined | null,
) {
    const [connectedRoom, setConnectedRoom] = useState<Room | null>(null);

    useEffect(() => {
        if (!serverAddress) {
            return;
        }

        const wsUrl = `ws://${serverAddress.ip}:${serverAddress.port}`;
        console.log(`connecting to ws server at ${wsUrl}...`);

        const client = new Client(wsUrl);

        let room: Room | undefined;

        client
            .joinOrCreate<{ messages: string[] }>(roomIdentifier)
            .then((joiningRoom) => {
                room = joiningRoom;
                setConnectedRoom(joiningRoom);
                console.log("joined successfully", joiningRoom);
            })
            .catch((e) => {
                console.error("join error", e);
            });

        return () => {
            room?.leave();
        };
    }, [serverAddress]);

    return connectedRoom;
}
