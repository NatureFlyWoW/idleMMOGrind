import { app, BrowserWindow, MessageChannelMain } from 'electron';
import { Worker, type Transferable } from 'worker_threads';
import path from 'path';
import { registerIpcHandlers } from './ipc/ipc-handlers';
import { AutoSaveManager } from './save/auto-save';

let mainWindow: BrowserWindow | null = null;
let engineWorker: Worker | null = null;
const autoSaveManager = new AutoSaveManager(60_000);

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    title: 'Idle MMORPG',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    void mainWindow.loadURL('http://localhost:5173');
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function spawnEngineWorker(): void {
  if (!mainWindow) return;

  engineWorker = new Worker(
    path.join(__dirname, '../engine/worker-entry.js'),
  );

  const { port1, port2 } = new MessageChannelMain();

  // Send port1 to renderer
  mainWindow.webContents.postMessage('engine:port', null, [port1]);

  // Send port2 to worker
  engineWorker.postMessage({ type: 'port', port: port2 }, [port2 as unknown as Transferable]);

  engineWorker.on('error', (err) => {
    console.error('Engine worker error:', err);
  });

  engineWorker.on('exit', (code) => {
    console.log('Engine worker exited with code:', code);
    engineWorker = null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  mainWindow?.webContents.on('did-finish-load', () => {
    spawnEngineWorker();
    autoSaveManager.start();
  });
});

app.on('window-all-closed', () => {
  autoSaveManager.stop();
  void engineWorker?.terminate();
  app.quit();
});

app.on('before-quit', () => {
  // Final save before quitting
  void autoSaveManager.performAutoSave();
});
