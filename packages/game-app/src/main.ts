import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { startServer } from "engine";
import type { ServerAddress } from "common-types";
import { getClientConfig } from "./getClientConfig";
import { getServerConfig } from "./getServerConfig";
import { app as electronApp } from "electron";

const clientConfig = getClientConfig();

let stopServer: undefined | (() => void);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: clientConfig.width,
        height: clientConfig.height,
        fullscreen: clientConfig.fullscreen,
        autoHideMenuBar: true,
        resizable: !clientConfig.fullscreen,
        frame: !clientConfig.fullscreen, // Frame off in fullscreen mode, on otherwise.
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    const hostUiIndexPath = electronApp.isPackaged
        ? path.join(process.resourcesPath, "app", "game-ui", "index.html")
        : path.join(__dirname, "..", "..", "game-ui", "dist", "index.html");

    mainWindow.loadFile(hostUiIndexPath);
}

function quitApp() {
    if (process.platform !== "darwin") {
        app.quit();
    }

    stopServer?.();
    stopServer = undefined;
}

app.on("window-all-closed", quitApp);

app.whenReady().then(() => {
    ipcMain.handle("get-client-config", () => clientConfig);

    ipcMain.handle("start-server", () => {
        const serverConfig = getServerConfig();
        stopServer = startServer(serverConfig);

        const result: ServerAddress = {
            ip: serverConfig.ipAddress,
            port: serverConfig.httpPort,
        };

        return result;
    });

    ipcMain.handle("stop-server", () => {
        stopServer?.();
        stopServer = undefined;
    });

    ipcMain.handle("quit", quitApp);

    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
