/**
 * File export utilities for the art engine.
 *
 * Handles writing PixelGrids to PNG files and compositing sprite sheets.
 */

import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { type PixelGrid } from './pixel-grid.js';

/** Export a PixelGrid as a PNG file. Creates directories as needed. */
export async function exportPNG(grid: PixelGrid, filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const buffer = grid.toPNG();
  fs.writeFileSync(filePath, buffer);
}

/**
 * Combine multiple PixelGrids into a single sprite sheet PNG.
 * All grids must be the same dimensions.
 *
 * @param grids - Array of PixelGrids to combine
 * @param columns - Number of columns in the sheet
 * @param filePath - Output file path
 */
export async function exportSpriteSheet(
  grids: PixelGrid[],
  columns: number,
  filePath: string,
): Promise<void> {
  if (grids.length === 0) return;

  const cellWidth = grids[0]!.width;
  const cellHeight = grids[0]!.height;
  const rows = Math.ceil(grids.length / columns);
  const sheetWidth = cellWidth * columns;
  const sheetHeight = cellHeight * rows;

  const canvas = createCanvas(sheetWidth, sheetHeight);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < grids.length; i++) {
    const grid = grids[i]!;
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * cellWidth;
    const y = row * cellHeight;

    const imageData = ctx.createImageData(grid.width, grid.height);
    imageData.data.set(grid.getData());
    ctx.putImageData(imageData, x, y);
  }

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}
