import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MyRoom } from "./MyRoom";
import express from "express";
import path from "path";
import http from "http";
import { app as electronApp } from "electron";
import { ServerConfig } from "./types/ServerConfig";

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
    const crewAppPath = electronApp.isPackaged
        ? path.join(process.resourcesPath, "app", "crew")
        : path.join(__dirname, "..", "..", "crew", "dist");
    app.use(express.static(crewAppPath));

    console.log(`Serving client from ${crewAppPath}`);

    server.listen(httpPort, () => {
        console.log(`Listening on http://localhost:${httpPort}`);
    });
}
