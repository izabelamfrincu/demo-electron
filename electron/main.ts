import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.on("renderer:user-input", (_event, text) => {
  const value = typeof text === "string" ? text : JSON.stringify(text);
  console.log("[renderer:user-input]", value);
});

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,                       
      nodeIntegration: false                        
    }
  });

  win.loadURL("http://localhost:5173"); // Vite dev server
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);