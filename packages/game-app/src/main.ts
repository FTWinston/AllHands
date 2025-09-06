import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { startServer } from "engine";
import { getConfig } from "./getConfig";
import { app as electronApp } from "electron";

const { clientConfig, serverConfig } = getConfig();
startServer(serverConfig);

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

app.whenReady().then(() => {
    ipcMain.handle("get-client-config", () => clientConfig);
    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
