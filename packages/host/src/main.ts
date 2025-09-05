import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { startServer } from "server";
import { getConfig } from "./getConfig";
import { app as electronApp } from "electron";

const config = getConfig();
startServer(config);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    const hostUiIndexPath = electronApp.isPackaged
        ? path.join(process.resourcesPath, "app", "display", "index.html")
        : path.join(__dirname, "..", "..", "display", "dist", "index.html");

    mainWindow.loadFile(hostUiIndexPath);
}

app.whenReady().then(() => {
    ipcMain.handle("get-config", getConfig);
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
