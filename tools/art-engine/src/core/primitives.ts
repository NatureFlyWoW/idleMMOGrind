/**
 * Pixel-level shape drawing primitives.
 *
 * All algorithms work at integer coordinates — no anti-aliasing.
 * Bresenham's line, midpoint ellipse, scanline fill.
 */

import { type PixelGrid, type RGBA, rgbaEqual } from './pixel-grid.js';

/** Bresenham's line algorithm. Draws from (x0,y0) to (x1,y1) inclusive. */
export function drawLine(
  grid: PixelGrid,
  x0: number, y0: number,
  x1: number, y1: number,
  color: RGBA,
): void {
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  let cx = x0;
  let cy = y0;

  for (;;) {
    grid.setPixel(cx, cy, color);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      cx += sx;
    }
    if (e2 <= dx) {
      err += dx;
      cy += sy;
    }
  }
}

/**
 * Draw a rectangle.
 * (x, y) is top-left corner. w and h are dimensions.
 * If filled, fills the entire w x h area. If not, draws only the border.
 */
export function drawRect(
  grid: PixelGrid,
  x: number, y: number,
  w: number, h: number,
  color: RGBA,
  filled = false,
): void {
  if (filled) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        grid.setPixel(px, py, color);
      }
    }
  } else {
    // Top and bottom edges
    for (let px = x; px < x + w; px++) {
      grid.setPixel(px, y, color);
      grid.setPixel(px, y + h - 1, color);
    }
    // Left and right edges
    for (let py = y; py < y + h; py++) {
      grid.setPixel(x, py, color);
      grid.setPixel(x + w - 1, py, color);
    }
  }
}

/**
 * Midpoint ellipse algorithm.
 * (cx, cy) is center, rx/ry are radii.
 */
export function drawEllipse(
  grid: PixelGrid,
  cx: number, cy: number,
  rx: number, ry: number,
  color: RGBA,
  filled = false,
): void {
  if (rx <= 0 || ry <= 0) return;

  let x = 0;
  let y = ry;
  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const twoRx2 = 2 * rx2;
  const twoRy2 = 2 * ry2;
  let px = 0;
  let py = twoRx2 * y;

  // Region 1
  let p = Math.round(ry2 - rx2 * ry + 0.25 * rx2);
  while (px < py) {
    if (filled) {
      drawHLine(grid, cx - x, cx + x, cy + y, color);
      drawHLine(grid, cx - x, cx + x, cy - y, color);
    } else {
      plotEllipsePoints(grid, cx, cy, x, y, color);
    }
    x++;
    px += twoRy2;
    if (p < 0) {
      p += ry2 + px;
    } else {
      y--;
      py -= twoRx2;
      p += ry2 + px - py;
    }
  }

  // Region 2
  p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
  while (y >= 0) {
    if (filled) {
      drawHLine(grid, cx - x, cx + x, cy + y, color);
      drawHLine(grid, cx - x, cx + x, cy - y, color);
    } else {
      plotEllipsePoints(grid, cx, cy, x, y, color);
    }
    y--;
    py -= twoRx2;
    if (p > 0) {
      p += rx2 - py;
    } else {
      x++;
      px += twoRy2;
      p += rx2 - py + px;
    }
  }
}

function plotEllipsePoints(
  grid: PixelGrid, cx: number, cy: number,
  x: number, y: number, color: RGBA,
): void {
  grid.setPixel(cx + x, cy + y, color);
  grid.setPixel(cx - x, cy + y, color);
  grid.setPixel(cx + x, cy - y, color);
  grid.setPixel(cx - x, cy - y, color);
}

function drawHLine(grid: PixelGrid, x0: number, x1: number, y: number, color: RGBA): void {
  for (let x = x0; x <= x1; x++) {
    grid.setPixel(x, y, color);
  }
}

/**
 * Flood fill using a queue (BFS). Fills connected region of target color with fill color.
 */
export function floodFill(grid: PixelGrid, startX: number, startY: number, fillColor: RGBA): void {
  if (!grid.isInBounds(startX, startY)) return;

  const targetColor = grid.getPixel(startX, startY);
  if (rgbaEqual(targetColor, fillColor)) return;

  const queue: [number, number][] = [[startX, startY]];
  const visited = new Set<number>();
  const key = (x: number, y: number): number => y * grid.width + x;

  visited.add(key(startX, startY));

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    grid.setPixel(x, y, fillColor);

    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as const) {
      if (!grid.isInBounds(nx, ny)) continue;
      const k = key(nx, ny);
      if (visited.has(k)) continue;
      if (!rgbaEqual(grid.getPixel(nx, ny), targetColor)) continue;
      visited.add(k);
      queue.push([nx, ny]);
    }
  }
}
