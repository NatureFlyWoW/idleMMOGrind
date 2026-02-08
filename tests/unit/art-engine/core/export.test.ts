import { describe, it, expect, afterEach } from 'vitest';
import { exportPNG, exportSpriteSheet } from '../../../../tools/art-engine/src/core/export.js';
import { createPixelGrid, rgba } from '../../../../tools/art-engine/src/core/pixel-grid.js';
import * as fs from 'fs';
import * as path from 'path';

const TEST_OUTPUT_DIR = path.resolve('tools/art-engine/output/test');

afterEach(() => {
  // Clean up test output files
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
  }
});

describe('exportPNG', () => {
  it('writes a valid PNG file to disk', async () => {
    const grid = createPixelGrid(16, 16);
    grid.fill(rgba(255, 0, 0));
    const outPath = path.join(TEST_OUTPUT_DIR, 'test-red.png');
    await exportPNG(grid, outPath);

    expect(fs.existsSync(outPath)).toBe(true);
    const buffer = fs.readFileSync(outPath);
    // PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer.length).toBeGreaterThan(50);
  });

  it('creates intermediate directories if needed', async () => {
    const grid = createPixelGrid(4, 4);
    grid.fill(rgba(0, 255, 0));
    const outPath = path.join(TEST_OUTPUT_DIR, 'sub/dir/test.png');
    await exportPNG(grid, outPath);
    expect(fs.existsSync(outPath)).toBe(true);
  });
});

describe('exportSpriteSheet', () => {
  it('combines multiple grids into a single image', async () => {
    const grids = [
      createPixelGrid(16, 16),
      createPixelGrid(16, 16),
      createPixelGrid(16, 16),
      createPixelGrid(16, 16),
    ];
    grids[0]!.fill(rgba(255, 0, 0));
    grids[1]!.fill(rgba(0, 255, 0));
    grids[2]!.fill(rgba(0, 0, 255));
    grids[3]!.fill(rgba(255, 255, 0));

    const outPath = path.join(TEST_OUTPUT_DIR, 'spritesheet.png');
    await exportSpriteSheet(grids, 2, outPath); // 2 columns

    expect(fs.existsSync(outPath)).toBe(true);
    const buffer = fs.readFileSync(outPath);
    expect(buffer[0]).toBe(0x89); // valid PNG
  });
});
