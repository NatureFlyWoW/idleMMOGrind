import { describe, it, expect } from 'vitest';
import { drawLine, drawRect, drawEllipse, floodFill } from '../../../../tools/art-engine/src/core/primitives.js';
import { createPixelGrid, rgba, rgbaEqual, BLACK, WHITE, TRANSPARENT } from '../../../../tools/art-engine/src/core/pixel-grid.js';

/** Count non-transparent pixels in a grid */
function countPixels(grid: ReturnType<typeof createPixelGrid>): number {
  let count = 0;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (!rgbaEqual(grid.getPixel(x, y), TRANSPARENT)) count++;
    }
  }
  return count;
}

describe('drawLine (Bresenham)', () => {
  it('draws a horizontal line', () => {
    const grid = createPixelGrid(10, 10);
    drawLine(grid, 2, 5, 7, 5, BLACK);
    // All pixels from x=2 to x=7 at y=5 should be black
    for (let x = 2; x <= 7; x++) {
      expect(rgbaEqual(grid.getPixel(x, 5), BLACK)).toBe(true);
    }
    // Pixels outside the line should be transparent
    expect(rgbaEqual(grid.getPixel(1, 5), TRANSPARENT)).toBe(true);
    expect(rgbaEqual(grid.getPixel(8, 5), TRANSPARENT)).toBe(true);
  });

  it('draws a vertical line', () => {
    const grid = createPixelGrid(10, 10);
    drawLine(grid, 3, 1, 3, 8, BLACK);
    for (let y = 1; y <= 8; y++) {
      expect(rgbaEqual(grid.getPixel(3, y), BLACK)).toBe(true);
    }
  });

  it('draws a diagonal line', () => {
    const grid = createPixelGrid(10, 10);
    drawLine(grid, 0, 0, 9, 9, BLACK);
    // A 10-pixel diagonal should have exactly 10 pixels
    expect(countPixels(grid)).toBe(10);
    expect(rgbaEqual(grid.getPixel(0, 0), BLACK)).toBe(true);
    expect(rgbaEqual(grid.getPixel(9, 9), BLACK)).toBe(true);
  });

  it('draws a single point when start equals end', () => {
    const grid = createPixelGrid(10, 10);
    drawLine(grid, 5, 5, 5, 5, BLACK);
    expect(countPixels(grid)).toBe(1);
  });
});

describe('drawRect', () => {
  it('draws an outline rectangle', () => {
    const grid = createPixelGrid(10, 10);
    drawRect(grid, 2, 2, 5, 5, BLACK, false);
    // Corners should be filled
    expect(rgbaEqual(grid.getPixel(2, 2), BLACK)).toBe(true);
    expect(rgbaEqual(grid.getPixel(6, 6), BLACK)).toBe(true);
    // Interior should be transparent
    expect(rgbaEqual(grid.getPixel(4, 4), TRANSPARENT)).toBe(true);
  });

  it('draws a filled rectangle', () => {
    const grid = createPixelGrid(10, 10);
    drawRect(grid, 2, 2, 3, 3, BLACK, true);
    // All interior pixels should be filled
    for (let y = 2; y < 5; y++) {
      for (let x = 2; x < 5; x++) {
        expect(rgbaEqual(grid.getPixel(x, y), BLACK)).toBe(true);
      }
    }
    // Total pixels: 3x3 = 9
    expect(countPixels(grid)).toBe(9);
  });
});

describe('drawEllipse', () => {
  it('draws a circle (rx === ry) with some pixels', () => {
    const grid = createPixelGrid(20, 20);
    drawEllipse(grid, 10, 10, 5, 5, BLACK, false);
    const count = countPixels(grid);
    expect(count).toBeGreaterThan(10); // circle circumference > 2*pi*r pixels roughly
  });

  it('draws a filled ellipse', () => {
    const grid = createPixelGrid(20, 20);
    drawEllipse(grid, 10, 10, 5, 5, BLACK, true);
    // Center should be filled
    expect(rgbaEqual(grid.getPixel(10, 10), BLACK)).toBe(true);
    // Far corner should not
    expect(rgbaEqual(grid.getPixel(0, 0), TRANSPARENT)).toBe(true);
  });
});

describe('floodFill', () => {
  it('fills a bounded area', () => {
    const grid = createPixelGrid(10, 10);
    // Draw a rectangle border
    drawRect(grid, 2, 2, 6, 6, BLACK, false);
    // Flood fill interior
    const red = rgba(255, 0, 0);
    floodFill(grid, 4, 4, red);
    // Interior should be red
    expect(rgbaEqual(grid.getPixel(4, 4), red)).toBe(true);
    // Border should still be black
    expect(rgbaEqual(grid.getPixel(2, 2), BLACK)).toBe(true);
    // Exterior should still be transparent
    expect(rgbaEqual(grid.getPixel(0, 0), TRANSPARENT)).toBe(true);
  });

  it('does nothing when target color equals fill color', () => {
    const grid = createPixelGrid(5, 5);
    grid.fill(BLACK);
    floodFill(grid, 2, 2, BLACK);
    // Still all black, no infinite loop
    expect(rgbaEqual(grid.getPixel(0, 0), BLACK)).toBe(true);
  });
});
