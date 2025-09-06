import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
    getClientConfig: () => ipcRenderer.invoke("get-client-config"),
    quit: () => ipcRenderer.invoke("quit"),
});
