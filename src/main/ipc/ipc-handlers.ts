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

  ipcMain.handle(
    MainInvokeChannel.SAVE_GAME,
    (_event, { slot, saveData }: { slot: 1 | 2 | 3; saveData: unknown }) => {
      try {
        const buffer = serializeSave(saveData as Parameters<typeof serializeSave>[0]);
        const savePath = getSavePath(app.getPath('userData'), slot);
        atomicWriteSave(savePath, buffer);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  );

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

  ipcMain.handle(
    MainInvokeChannel.EXPORT_SAVE,
    async (_event, { slot }: { slot: 1 | 2 | 3 }) => {
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
    },
  );
}
