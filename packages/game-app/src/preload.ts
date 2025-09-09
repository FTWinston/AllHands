import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getClientConfig: () => ipcRenderer.invoke('get-client-config'),
    startServer: () => ipcRenderer.invoke('start-server'),
    stopServer: () => ipcRenderer.invoke('stop-server'),
    quit: () => ipcRenderer.invoke('quit'),
});
