import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import './server'; // Start the server
import { getConfig } from './getConfig';
import { app as electronApp } from 'electron';

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    const hostUiIndexPath = electronApp.isPackaged
      ? path.join(process.resourcesPath, 'app', 'host-ui', 'index.html')
      : path.join(__dirname, '..', '..', 'host-ui', 'dist', 'index.html');

    mainWindow.loadFile(hostUiIndexPath)
  }
}

app.whenReady().then(() => {
  ipcMain.handle('get-config', getConfig);
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
