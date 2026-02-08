import { contextBridge, ipcRenderer } from 'electron';
import type { MainInvokeChannel } from '@shared/types/ipc';

export interface IGameAPI {
  invoke: (channel: MainInvokeChannel, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
  getVersion: () => Promise<string>;
  setEnginePort: (callback: (port: Electron.MessagePortMain) => void) => void;
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

  setEnginePort: (callback: (port: Electron.MessagePortMain) => void) => {
    ipcRenderer.on('engine:port', (event) => {
      const [port] = event.ports;
      if (port) {
        callback(port);
      }
    });
  },
} satisfies IGameAPI);
