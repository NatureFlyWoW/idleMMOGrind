import { BrowserWindow } from 'electron';
import { MainSendChannel } from '@shared/types/ipc';

export class AutoSaveManager {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private saveCallback: (() => Promise<void>) | null = null;

  constructor(intervalMs: number = 60_000) {
    this.intervalMs = intervalMs;
  }

  setSaveCallback(cb: () => Promise<void>): void {
    this.saveCallback = cb;
  }

  start(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      void this.performAutoSave();
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
