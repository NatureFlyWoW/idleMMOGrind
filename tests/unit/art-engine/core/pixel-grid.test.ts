import { describe, it, expect } from 'vitest';
import {
  createPixelGrid,
  rgba,
  rgbaEqual,
  TRANSPARENT,
  BLACK,
  WHITE,
} from '../../../../tools/art-engine/src/core/pixel-grid.js';

describe('RGBA helpers', () => {
  it('rgba() creates a color object', () => {
    const c = rgba(255, 128, 0, 255);
    expect(c).toEqual({ r: 255, g: 128, b: 0, a: 255 });
  });

  it('rgba() defaults alpha to 255', () => {
    const c = rgba(100, 100, 100);
    expect(c.a).toBe(255);
  });

  it('rgbaEqual() compares two colors', () => {
    expect(rgbaEqual(rgba(1, 2, 3), rgba(1, 2, 3))).toBe(true);
    expect(rgbaEqual(rgba(1, 2, 3), rgba(1, 2, 4))).toBe(false);
  });
});

describe('PixelGrid', () => {
  describe('createPixelGrid', () => {
    it('creates a grid of the specified dimensions', () => {
      const grid = createPixelGrid(48, 48);
      expect(grid.width).toBe(48);
      expect(grid.height).toBe(48);
    });

    it('initializes all pixels to transparent', () => {
      const grid = createPixelGrid(4, 4);
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          expect(grid.getPixel(x, y)).toEqual(TRANSPARENT);
        }
      }
    });
  });

  describe('setPixel / getPixel', () => {
    it('sets and gets a pixel color', () => {
      const grid = createPixelGrid(10, 10);
      const red = rgba(255, 0, 0);
      grid.setPixel(5, 5, red);
      expect(grid.getPixel(5, 5)).toEqual(red);
    });

    it('ignores out-of-bounds setPixel (no throw)', () => {
      const grid = createPixelGrid(10, 10);
      expect(() => grid.setPixel(-1, 5, BLACK)).not.toThrow();
      expect(() => grid.setPixel(10, 5, BLACK)).not.toThrow();
      expect(() => grid.setPixel(5, -1, BLACK)).not.toThrow();
      expect(() => grid.setPixel(5, 10, BLACK)).not.toThrow();
    });

    it('returns TRANSPARENT for out-of-bounds getPixel', () => {
      const grid = createPixelGrid(10, 10);
      expect(grid.getPixel(-1, 0)).toEqual(TRANSPARENT);
      expect(grid.getPixel(10, 0)).toEqual(TRANSPARENT);
    });
  });

  describe('fill', () => {
    it('fills all pixels with the given color', () => {
      const grid = createPixelGrid(4, 4);
      const blue = rgba(0, 0, 255);
      grid.fill(blue);
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          expect(grid.getPixel(x, y)).toEqual(blue);
        }
      }
    });
  });

  describe('clear', () => {
    it('resets all pixels to transparent', () => {
      const grid = createPixelGrid(4, 4);
      grid.fill(BLACK);
      grid.clear();
      expect(grid.getPixel(0, 0)).toEqual(TRANSPARENT);
    });
  });

  describe('clone', () => {
    it('creates an independent copy', () => {
      const grid = createPixelGrid(4, 4);
      grid.setPixel(0, 0, BLACK);
      const copy = grid.clone();
      expect(copy.getPixel(0, 0)).toEqual(BLACK);
      // Mutating original doesn't affect clone
      grid.setPixel(0, 0, WHITE);
      expect(copy.getPixel(0, 0)).toEqual(BLACK);
    });
  });

  describe('isInBounds', () => {
    it('returns true for valid coordinates', () => {
      const grid = createPixelGrid(10, 10);
      expect(grid.isInBounds(0, 0)).toBe(true);
      expect(grid.isInBounds(9, 9)).toBe(true);
    });

    it('returns false for out-of-bounds coordinates', () => {
      const grid = createPixelGrid(10, 10);
      expect(grid.isInBounds(-1, 0)).toBe(false);
      expect(grid.isInBounds(10, 0)).toBe(false);
    });
  });

  describe('toPNG', () => {
    it('exports a valid PNG buffer', () => {
      const grid = createPixelGrid(4, 4);
      grid.fill(rgba(255, 0, 0));
      const buffer = grid.toPNG();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // PNG magic bytes
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // P
      expect(buffer[2]).toBe(0x4e); // N
      expect(buffer[3]).toBe(0x47); // G
    });
  });
});
