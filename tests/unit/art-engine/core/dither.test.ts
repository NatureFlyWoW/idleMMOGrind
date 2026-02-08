import { describe, it, expect } from 'vitest';
import { orderedDither, quantize } from '../../../../tools/art-engine/src/core/dither.js';
import { createPixelGrid, rgba, rgbaEqual } from '../../../../tools/art-engine/src/core/pixel-grid.js';
import { createPalette } from '../../../../tools/art-engine/src/core/palette.js';

describe('quantize', () => {
  it('maps each pixel to the nearest palette color', () => {
    const palette = createPalette('bw', [rgba(0, 0, 0), rgba(255, 255, 255)]);
    const grid = createPixelGrid(4, 4);
    grid.fill(rgba(200, 200, 200));
    const result = quantize(grid, palette);
    expect(rgbaEqual(result.getPixel(0, 0), rgba(255, 255, 255))).toBe(true);
  });

  it('maps dark colors to black in a BW palette', () => {
    const palette = createPalette('bw', [rgba(0, 0, 0), rgba(255, 255, 255)]);
    const grid = createPixelGrid(4, 4);
    grid.fill(rgba(50, 50, 50));
    const result = quantize(grid, palette);
    expect(rgbaEqual(result.getPixel(0, 0), rgba(0, 0, 0))).toBe(true);
  });

  it('preserves transparent pixels', () => {
    const palette = createPalette('bw', [rgba(0, 0, 0), rgba(255, 255, 255)]);
    const grid = createPixelGrid(4, 4);
    const result = quantize(grid, palette);
    expect(result.getPixel(0, 0).a).toBe(0);
  });
});

describe('orderedDither', () => {
  it('returns a grid of the same dimensions', () => {
    const palette = createPalette('bw', [rgba(0, 0, 0), rgba(255, 255, 255)]);
    const grid = createPixelGrid(8, 8);
    grid.fill(rgba(128, 128, 128));
    const result = orderedDither(grid, palette, 4);
    expect(result.width).toBe(8);
    expect(result.height).toBe(8);
  });

  it('produces a mix of palette colors for mid-tone input', () => {
    const palette = createPalette('bw', [rgba(0, 0, 0), rgba(255, 255, 255)]);
    const grid = createPixelGrid(8, 8);
    grid.fill(rgba(128, 128, 128));
    const result = orderedDither(grid, palette, 4);

    let blackCount = 0;
    let whiteCount = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const p = result.getPixel(x, y);
        if (rgbaEqual(p, rgba(0, 0, 0))) blackCount++;
        if (rgbaEqual(p, rgba(255, 255, 255))) whiteCount++;
      }
    }
    expect(blackCount).toBeGreaterThan(0);
    expect(whiteCount).toBeGreaterThan(0);
    expect(blackCount + whiteCount).toBe(64);
  });

  it('produces all-black for a black input', () => {
    const palette = createPalette('bw', [rgba(0, 0, 0), rgba(255, 255, 255)]);
    const grid = createPixelGrid(4, 4);
    grid.fill(rgba(0, 0, 0));
    const result = orderedDither(grid, palette, 2);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        expect(rgbaEqual(result.getPixel(x, y), rgba(0, 0, 0))).toBe(true);
      }
    }
  });

  it('preserves transparent pixels', () => {
    const palette = createPalette('bw', [rgba(0, 0, 0), rgba(255, 255, 255)]);
    const grid = createPixelGrid(4, 4);
    const result = orderedDither(grid, palette, 2);
    expect(result.getPixel(0, 0).a).toBe(0);
  });
});
