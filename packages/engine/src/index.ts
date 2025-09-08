import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { GameRoom } from "./GameRoom";
import express from "express";
import path from "path";
import http from "http";
import { app as electronApp } from "electron";
import { roomIdentifier, ServerConfig } from "common-types";

function createWebServer(ipAddress: string, httpPort: number): http.Server {
    const expressApp = express();
    expressApp.use(express.json());

    const server = http.createServer(expressApp);

    // Serve player UI files
    const playerUiAppPath = electronApp.isPackaged
        ? path.join(process.resourcesPath, "app", "player-ui")
        : path.join(__dirname, "..", "..", "player-ui", "dist");

    expressApp.use(express.static(playerUiAppPath));

    console.log(`Serving content from ${playerUiAppPath}`);

    server.listen(httpPort, () => {
        console.log(`Listening on http://${ipAddress}:${httpPort}`);
    });

    return server;
}

function createGameServer(
    webServer: http.Server,
    config: ServerConfig,
): Server {
    const gameServer = new Server({
        transport: new WebSocketTransport({
            server: webServer,
            pingInterval: config.pingInterval,
        }),
    });

    gameServer.define(roomIdentifier, GameRoom);

    if (config.simulateLatencyMs > 0) {
        console.log(
            `Simulating ${config.simulateLatencyMs}ms latency on all connections`,
        );
        gameServer.simulateLatency(config.simulateLatencyMs);
    }

    return gameServer;
}

export function startServer(config: ServerConfig) {
    const webServer = createWebServer(config.ipAddress, config.httpPort);

    const gameServer = createGameServer(webServer, config);

    return async () => {
        console.log("Stopping server...");
        await gameServer.gracefullyShutdown(true);
        webServer.close();
    };
}
