/**
 * Dithering algorithms for pixel art palette constraint.
 *
 * Ordered dithering (Bayer matrix) produces clean, predictable patterns
 * ideal for pixel art — no random noise, just structured tonal transitions.
 */

import { createPixelGrid, type PixelGrid, type RGBA, rgba } from './pixel-grid.js';
import { type Palette, colorDistance } from './palette.js';

/** Bayer matrices for ordered dithering */
const BAYER_2X2 = [
  [0, 2],
  [3, 1],
];

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

function getBayerMatrix(size: 2 | 4 | 8): number[][] {
  switch (size) {
    case 2: return BAYER_2X2;
    case 4: return BAYER_4X4;
    case 8: return BAYER_8X8;
  }
}

/**
 * Simple nearest-color quantization (no dithering).
 * Maps each pixel to the nearest palette color.
 * Preserves fully transparent pixels.
 */
export function quantize(grid: PixelGrid, palette: Palette): PixelGrid {
  const result = createPixelGrid(grid.width, grid.height);

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const pixel = grid.getPixel(x, y);
      if (pixel.a === 0) continue; // preserve transparency
      result.setPixel(x, y, palette.nearest(pixel));
    }
  }

  return result;
}

/**
 * Ordered dithering using a Bayer matrix.
 *
 * For each pixel, the Bayer threshold determines whether to round the color
 * "up" or "down" to the nearest palette colors. This creates structured
 * patterns that simulate smooth gradients using limited colors.
 *
 * Preserves fully transparent pixels.
 */
export function orderedDither(
  grid: PixelGrid,
  palette: Palette,
  matrixSize: 2 | 4 | 8 = 4,
): PixelGrid {
  const result = createPixelGrid(grid.width, grid.height);
  const matrix = getBayerMatrix(matrixSize);
  const matrixScale = matrixSize * matrixSize;

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const pixel = grid.getPixel(x, y);
      if (pixel.a === 0) continue; // preserve transparency

      // Get threshold from Bayer matrix (normalized to -0.5..+0.5)
      const threshold = (matrix[y % matrixSize]![x % matrixSize]! / matrixScale) - 0.5;
      const spread = 64; // How much the dither shifts color values

      // Apply threshold shift to find the two candidate colors
      const shifted = rgba(
        Math.max(0, Math.min(255, Math.round(pixel.r + threshold * spread))),
        Math.max(0, Math.min(255, Math.round(pixel.g + threshold * spread))),
        Math.max(0, Math.min(255, Math.round(pixel.b + threshold * spread))),
        pixel.a,
      );

      result.setPixel(x, y, palette.nearest(shifted));
    }
  }

  return result;
}
