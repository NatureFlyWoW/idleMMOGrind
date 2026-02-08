import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  rotateSaveBackups,
  atomicWriteSave,
  getSavePath,
} from '@main/save/backup-rotation';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'idle-mmo-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('rotateSaveBackups', () => {
  it('should move current save to .bak1', () => {
    const savePath = path.join(tmpDir, 'save.sav');
    fs.writeFileSync(savePath, 'original');

    rotateSaveBackups(savePath);

    expect(fs.existsSync(savePath)).toBe(false);
    expect(fs.readFileSync(`${savePath}.bak1`, 'utf-8')).toBe('original');
  });

  it('should shift existing backups down', () => {
    const savePath = path.join(tmpDir, 'save.sav');
    fs.writeFileSync(savePath, 'current');
    fs.writeFileSync(`${savePath}.bak1`, 'backup1');

    rotateSaveBackups(savePath);

    expect(fs.existsSync(savePath)).toBe(false);
    expect(fs.readFileSync(`${savePath}.bak1`, 'utf-8')).toBe('current');
    expect(fs.readFileSync(`${savePath}.bak2`, 'utf-8')).toBe('backup1');
  });

  it('should delete the oldest backup when at max', () => {
    const savePath = path.join(tmpDir, 'save.sav');
    fs.writeFileSync(savePath, 'current');
    fs.writeFileSync(`${savePath}.bak1`, 'backup1');
    fs.writeFileSync(`${savePath}.bak2`, 'backup2');
    fs.writeFileSync(`${savePath}.bak3`, 'backup3');

    rotateSaveBackups(savePath);

    expect(fs.existsSync(savePath)).toBe(false);
    expect(fs.readFileSync(`${savePath}.bak1`, 'utf-8')).toBe('current');
    expect(fs.readFileSync(`${savePath}.bak2`, 'utf-8')).toBe('backup1');
    expect(fs.readFileSync(`${savePath}.bak3`, 'utf-8')).toBe('backup2');
    // backup3 (oldest) should be gone
  });

  it('should do nothing if no save file exists', () => {
    const savePath = path.join(tmpDir, 'nonexistent.sav');
    // Should not throw
    rotateSaveBackups(savePath);
    expect(fs.existsSync(`${savePath}.bak1`)).toBe(false);
  });

  it('should respect custom maxBackups parameter', () => {
    const savePath = path.join(tmpDir, 'save.sav');
    fs.writeFileSync(savePath, 'current');
    fs.writeFileSync(`${savePath}.bak1`, 'backup1');
    fs.writeFileSync(`${savePath}.bak2`, 'backup2');

    rotateSaveBackups(savePath, 2);

    expect(fs.readFileSync(`${savePath}.bak1`, 'utf-8')).toBe('current');
    expect(fs.readFileSync(`${savePath}.bak2`, 'utf-8')).toBe('backup1');
    // backup2 was the oldest and should be gone (shifted out)
  });
});

describe('atomicWriteSave', () => {
  it('should write data to the save path', () => {
    const savePath = path.join(tmpDir, 'save.sav');
    const data = Buffer.from('test-save-data');

    atomicWriteSave(savePath, data);

    expect(fs.existsSync(savePath)).toBe(true);
    expect(fs.readFileSync(savePath).toString()).toBe('test-save-data');
  });

  it('should rotate existing save to .bak1 before writing new', () => {
    const savePath = path.join(tmpDir, 'save.sav');
    fs.writeFileSync(savePath, 'old-data');

    atomicWriteSave(savePath, Buffer.from('new-data'));

    expect(fs.readFileSync(savePath).toString()).toBe('new-data');
    expect(fs.readFileSync(`${savePath}.bak1`).toString()).toBe('old-data');
  });

  it('should not leave .tmp file after successful write', () => {
    const savePath = path.join(tmpDir, 'save.sav');
    atomicWriteSave(savePath, Buffer.from('data'));

    expect(fs.existsSync(`${savePath}.tmp`)).toBe(false);
  });

  it('should handle multiple consecutive saves with rotation', () => {
    const savePath = path.join(tmpDir, 'save.sav');

    atomicWriteSave(savePath, Buffer.from('save-v1'));
    atomicWriteSave(savePath, Buffer.from('save-v2'));
    atomicWriteSave(savePath, Buffer.from('save-v3'));

    expect(fs.readFileSync(savePath).toString()).toBe('save-v3');
    expect(fs.readFileSync(`${savePath}.bak1`).toString()).toBe('save-v2');
    expect(fs.readFileSync(`${savePath}.bak2`).toString()).toBe('save-v1');
  });
});

describe('getSavePath', () => {
  it('should create saves directory if it does not exist', () => {
    const userDataPath = path.join(tmpDir, 'userdata');
    const result = getSavePath(userDataPath, 1);

    expect(fs.existsSync(path.join(userDataPath, 'saves'))).toBe(true);
    expect(result).toBe(path.join(userDataPath, 'saves', 'slot_1_save.sav'));
  });

  it('should return correct path for each slot', () => {
    const userDataPath = path.join(tmpDir, 'userdata');

    expect(getSavePath(userDataPath, 1)).toContain('slot_1_save.sav');
    expect(getSavePath(userDataPath, 2)).toContain('slot_2_save.sav');
    expect(getSavePath(userDataPath, 3)).toContain('slot_3_save.sav');
  });

  it('should not fail if saves directory already exists', () => {
    const userDataPath = path.join(tmpDir, 'userdata');
    fs.mkdirSync(path.join(userDataPath, 'saves'), { recursive: true });

    const result = getSavePath(userDataPath, 1);
    expect(result).toContain('slot_1_save.sav');
  });
});
