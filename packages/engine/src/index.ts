import path from 'path';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { Server } from 'colyseus';
import { roomIdentifier } from 'common-data/utils/constants';
import { app as electronApp } from 'electron';
import express from 'express';
import { GameRoom } from './classes/GameRoom';
import type { ServerConfig } from 'common-data/types/ServerConfig';

function getPlayerUiAppPath(): string {
    return electronApp.isPackaged
        ? path.join(process.resourcesPath, 'app', 'player-ui')
        : path.join(__dirname, '..', '..', 'player-ui', 'dist');
}

export async function startServer(config: ServerConfig) {
    const playerUiAppPath = getPlayerUiAppPath();
    console.log(`Serving content from ${playerUiAppPath}`);

    const gameServer = new Server({
        transport: new WebSocketTransport({
            pingInterval: config.pingInterval,
        }),
        express: (app) => {
            app.use(express.json());
            app.use(express.static(playerUiAppPath));
        },
    });

    gameServer.define(roomIdentifier, GameRoom, config);

    if (config.simulateLatencyMs > 0) {
        console.log(
            `Simulating ${config.simulateLatencyMs}ms latency on all connections`
        );
        gameServer.simulateLatency(config.simulateLatencyMs);
    }

    await gameServer.listen(config.httpPort);
    console.log(`Listening on http://${config.ipAddress}:${config.httpPort}`);

    return async () => {
        console.log('Stopping server...');
        await gameServer.gracefullyShutdown(true);
    };
}
