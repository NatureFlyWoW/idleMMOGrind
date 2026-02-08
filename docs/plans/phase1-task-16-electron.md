# Phase 1 Implementation Plan — Electron Integration (Task 16)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Pending

---

## Task 16 -- Electron Shell Integration (IPC Wiring, Auto-Save, Window Lifecycle)

**Worktree:** main (merge all prior branches first)
**Depends on:** Tasks 1, 13, 15

### Step 16.1 -- Implement preload script with contextBridge

**File: `src/main/preload.ts`** (replace existing)

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { MainInvokeChannel, MainSendChannel } from '@shared/types/ipc';

export interface IGameAPI {
  invoke: (channel: MainInvokeChannel, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
  getVersion: () => Promise<string>;
  setEnginePort: (callback: (port: MessagePort) => void) => void;
}

contextBridge.exposeInMainWorld('gameAPI', {
  invoke: (channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  once: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args));
  },

  getVersion: () => ipcRenderer.invoke('app:get-version'),

  setEnginePort: (callback: (port: MessagePort) => void) => {
    ipcRenderer.on('engine:port', (event) => {
      const [port] = event.ports;
      if (port) {
        callback(port);
      }
    });
  },
} satisfies IGameAPI);
```

**Commit:** `feat(main): implement preload script with contextBridge API`

### Step 16.2 -- Implement IPC handlers

**File: `src/main/ipc/ipc-handlers.ts`**

```typescript
import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import { MainInvokeChannel } from '@shared/types/ipc';
import { serializeSave, deserializeSave } from '../save/save-io';
import { atomicWriteSave, getSavePath } from '../save/backup-rotation';
import fs from 'fs';

export function registerIpcHandlers(): void {
  ipcMain.handle(MainInvokeChannel.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(MainInvokeChannel.APP_GET_PLATFORM, () => {
    return process.platform;
  });

  ipcMain.handle(MainInvokeChannel.APP_GET_USER_DATA_PATH, () => {
    return app.getPath('userData');
  });

  ipcMain.handle(MainInvokeChannel.SAVE_GAME, (_event, { slot, saveData }: { slot: 1 | 2 | 3; saveData: unknown }) => {
    try {
      const buffer = serializeSave(saveData as any);
      const savePath = getSavePath(app.getPath('userData'), slot);
      atomicWriteSave(savePath, buffer);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(MainInvokeChannel.LOAD_GAME, (_event, { slot }: { slot: 1 | 2 | 3 }) => {
    try {
      const savePath = getSavePath(app.getPath('userData'), slot);
      if (!fs.existsSync(savePath)) {
        return { success: false, error: 'No save file found' };
      }
      const buffer = fs.readFileSync(savePath);
      const saveData = deserializeSave(buffer);
      return { success: true, data: saveData };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(MainInvokeChannel.LIST_SAVES, () => {
    const userData = app.getPath('userData');
    const saves: Array<{ slot: number; exists: boolean; lastSaved?: string }> = [];
    for (const slot of [1, 2, 3] as const) {
      const savePath = getSavePath(userData, slot);
      if (fs.existsSync(savePath)) {
        try {
          const buffer = fs.readFileSync(savePath);
          const save = deserializeSave(buffer);
          saves.push({ slot, exists: true, lastSaved: save.meta.lastSavedAt });
        } catch {
          saves.push({ slot, exists: true, lastSaved: undefined });
        }
      } else {
        saves.push({ slot, exists: false });
      }
    }
    return saves;
  });

  ipcMain.handle(MainInvokeChannel.DELETE_SAVE, (_event, { slot }: { slot: 1 | 2 | 3 }) => {
    const savePath = getSavePath(app.getPath('userData'), slot);
    if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
    // Also delete backups
    for (let i = 1; i <= 3; i++) {
      const bakPath = `${savePath}.bak${i}`;
      if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath);
    }
    return { success: true };
  });

  ipcMain.handle(MainInvokeChannel.EXPORT_SAVE, async (_event, { slot }: { slot: 1 | 2 | 3 }) => {
    const savePath = getSavePath(app.getPath('userData'), slot);
    if (!fs.existsSync(savePath)) return { success: false, error: 'No save file' };

    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No window' };

    const result = await dialog.showSaveDialog(win, {
      defaultPath: `idle-mmorpg-slot${slot}.sav`,
      filters: [{ name: 'Save Files', extensions: ['sav'] }],
    });

    if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' };

    fs.copyFileSync(savePath, result.filePath);
    return { success: true, path: result.filePath };
  });
}
```

**Commit:** `feat(main): implement IPC handlers for save/load/export`

### Step 16.3 -- Implement auto-save manager

**File: `src/main/save/auto-save.ts`**

```typescript
import { BrowserWindow } from 'electron';
import { MainSendChannel } from '@shared/types/ipc';

export class AutoSaveManager {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number;
  private saveCallback: (() => Promise<void>) | null = null;

  constructor(intervalMs: number = 60000) {
    this.intervalMs = intervalMs;
  }

  setSaveCallback(cb: () => Promise<void>): void {
    this.saveCallback = cb;
  }

  start(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(async () => {
      await this.performAutoSave();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async performAutoSave(): Promise<void> {
    if (!this.saveCallback) return;

    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.send(MainSendChannel.SAVE_AUTO_STARTED);
    }

    try {
      await this.saveCallback();
      if (win) {
        win.webContents.send(MainSendChannel.SAVE_AUTO_COMPLETE);
      }
    } catch (err) {
      if (win) {
        win.webContents.send(MainSendChannel.SAVE_AUTO_FAILED, String(err));
      }
    }
  }
}
```

**Commit:** `feat(main): add auto-save manager with configurable interval`

### Step 16.4 -- Update main.ts with full lifecycle

**File: `src/main/main.ts`** (replace)

```typescript
import { app, BrowserWindow } from 'electron';
import { Worker } from 'worker_threads';
import { MessageChannelMain } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/ipc-handlers';
import { AutoSaveManager } from './save/auto-save';

let mainWindow: BrowserWindow | null = null;
let engineWorker: Worker | null = null;
const autoSaveManager = new AutoSaveManager(60000);

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
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
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
  engineWorker?.terminate();
  app.quit();
});

app.on('before-quit', async () => {
  // Final save before quitting
  await autoSaveManager.performAutoSave();
});
```

**Commit:** `feat(main): wire Electron shell with worker thread, IPC, and auto-save`

---

