"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    sendInput: (text) => electron_1.ipcRenderer.send("renderer:user-input", text)
});
//# sourceMappingURL=preload.cjs.map