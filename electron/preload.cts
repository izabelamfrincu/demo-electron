import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld("api", {
  sendInput: (text: string) => ipcRenderer.send("renderer:user-input", text)
});