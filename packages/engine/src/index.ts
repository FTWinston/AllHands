import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MyRoom } from "./MyRoom";
import express from "express";
import path from "path";
import http from "http";
import { app as electronApp } from "electron";
import { ServerConfig } from "common-types";

export function startServer(config: ServerConfig) {
    const httpPort = config.httpPort;
    const app = express();
    app.use(express.json());

    const server = http.createServer(app);

    const gameServer = new Server({
        transport: new WebSocketTransport({ server }),
    });

    gameServer.define("my_room", MyRoom);

    // Serve client files
    const playerUiAppPath = electronApp.isPackaged
        ? path.join(process.resourcesPath, "app", "player-ui")
        : path.join(__dirname, "..", "..", "player-ui", "dist");
    app.use(express.static(playerUiAppPath));

    console.log(`Serving client from ${playerUiAppPath}`);

    server.listen(httpPort, () => {
        console.log(`Listening on http://localhost:${httpPort}`);
    });
}
