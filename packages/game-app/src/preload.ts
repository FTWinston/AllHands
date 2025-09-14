import { ServerConfig } from 'common-types';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getClientConfig: () => ipcRenderer.invoke('get-client-config'),
    startServer: (configOverride?: Partial<ServerConfig>) => ipcRenderer.invoke('start-server', configOverride),
    stopServer: () => ipcRenderer.invoke('stop-server'),
    quit: () => ipcRenderer.invoke('quit'),
});
