import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { MyRoom } from './MyRoom';
import express from 'express';
import path from 'path';
import http from 'http';
import { getConfig } from '../getConfig';
import { app as electronApp } from 'electron';

const config = getConfig();
const httpPort = config.httpPort;
const app = express();
app.use(express.json());

const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server
  })
});

gameServer.define('my_room', MyRoom);

// Serve client files
const clientPath = electronApp.isPackaged
  ? path.join(process.resourcesPath, 'app', 'client')
  : path.join(__dirname, '..', '..', '..', 'client', 'dist');
app.use(express.static(clientPath));

console.log(`Serving client from ${clientPath}`);

server.listen(httpPort, () => {
  console.log(`Listening on http://localhost:${ httpPort }`)
});
