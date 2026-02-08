import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('gameAPI', {
  getVersion: () => '0.1.0',
});
