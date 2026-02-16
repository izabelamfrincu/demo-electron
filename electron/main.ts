import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECHO_ENDPOINT = process.env.ECHO_ENDPOINT ?? "http://localhost:8080/echo";

async function postUserInputToEchoEndpoint(text: unknown) {
  const value = typeof text === "string" ? text : JSON.stringify(text);
  console.log("[renderer:user-input]", value);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(ECHO_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Accept": "text/plain"
      },
      body: value,
      signal: controller.signal
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error("[spring-boot] non-200", response.status, responseText);
      return;
    }

    console.log("[spring-boot] /echo response:", responseText);
  } catch (error) {
    console.error("[spring-boot] request failed:", error);
  } finally {
    clearTimeout(timeout);
  }
}

ipcMain.on("renderer:user-input", (_event, text) => {
  void postUserInputToEchoEndpoint(text);
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