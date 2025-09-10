import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { startServer } from 'engine';
import type { ServerAddress } from 'common-types';
import { getClientConfig } from './getClientConfig';
import { getServerConfig } from './getServerConfig';
import { app as electronApp } from 'electron';

// Add global error handlers to prevent app from quitting on errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process
});

// Override process.exit to prevent Colyseus from exiting the process during shutdown.
// (That's the last action of a call to its gracefullyShutdown method, but we want to control app exit ourselves.)
// To exit, you must call quitApp.
const originalExit = process.exit;
let allowExit = true;

process.exit = ((code?: number) => {
    if (allowExit) {
        originalExit(code);
    }
}) as typeof process.exit;

const clientConfig = getClientConfig();

let stopServer: undefined | (() => Promise<void>);

async function tryStopServer() {
    if (!stopServer) {
        return;
    }

    const performStop = stopServer;
    stopServer = undefined;
    
    allowExit = false; // Don't allow process.exit to work during server stop.
    await performStop();
    allowExit = true;
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: clientConfig.width,
        height: clientConfig.height,
        fullscreen: clientConfig.fullscreen,
        autoHideMenuBar: true,
        resizable: !clientConfig.fullscreen,
        frame: !clientConfig.fullscreen, // Frame off in fullscreen mode, on otherwise.
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const hostUiIndexPath = electronApp.isPackaged
        ? path.join(process.resourcesPath, 'app', 'game-ui', 'index.html')
        : path.join(__dirname, '..', '..', 'game-ui', 'dist', 'index.html');

    mainWindow.loadFile(hostUiIndexPath);
}

async function quitApp() {
    await tryStopServer();

    app.quit();
}

app.on('window-all-closed', quitApp);

app.whenReady().then(() => {
    ipcMain.handle('get-client-config', () => clientConfig);

    ipcMain.handle('start-server', () => {
        const serverConfig = getServerConfig();
        stopServer = startServer(serverConfig);

        const result: ServerAddress = {
            ip: serverConfig.ipAddress,
            port: serverConfig.httpPort,
        };

        return result;
    });

    ipcMain.handle('stop-server', tryStopServer);

    ipcMain.handle('quit', quitApp);

    createWindow();

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
