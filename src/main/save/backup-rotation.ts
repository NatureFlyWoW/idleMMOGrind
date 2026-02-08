import fs from 'fs';
import path from 'path';

/**
 * Rotate save backups. Keeps up to maxBackups copies.
 * Before writing a new save, the current .sav becomes .bak1, .bak1 becomes .bak2, etc.
 */
export function rotateSaveBackups(savePath: string, maxBackups: number = 3): void {
  // Delete oldest backup
  const oldest = `${savePath}.bak${maxBackups}`;
  if (fs.existsSync(oldest)) {
    fs.unlinkSync(oldest);
  }

  // Shift backups down: .bak2 -> .bak3, .bak1 -> .bak2, etc.
  for (let i = maxBackups - 1; i >= 1; i--) {
    const from = `${savePath}.bak${i}`;
    const to = `${savePath}.bak${i + 1}`;
    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    }
  }

  // Move current save to .bak1
  if (fs.existsSync(savePath)) {
    fs.renameSync(savePath, `${savePath}.bak1`);
  }
}

/**
 * Write save atomically: write to .tmp, then rename.
 */
export function atomicWriteSave(savePath: string, data: Buffer): void {
  const tmpPath = `${savePath}.tmp`;
  fs.writeFileSync(tmpPath, data);
  // If a previous save exists, rotate it
  rotateSaveBackups(savePath);
  fs.renameSync(tmpPath, savePath);
}

/**
 * Get the save file path for a given slot.
 */
export function getSavePath(userDataPath: string, slot: 1 | 2 | 3): string {
  const dir = path.join(userDataPath, 'saves');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `slot_${slot}_save.sav`);
}
