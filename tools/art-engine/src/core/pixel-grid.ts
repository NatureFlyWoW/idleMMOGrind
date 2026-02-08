/**
 * PixelGrid — the foundational data structure for the art engine.
 *
 * Wraps a flat RGBA byte array with a clean per-pixel API.
 * Uses the Node.js `canvas` package for PNG export.
 * No anti-aliasing, no sub-pixel operations — pixel art only.
 */

import { createCanvas } from 'canvas';

export interface RGBA {
  readonly r: number; // 0-255
  readonly g: number; // 0-255
  readonly b: number; // 0-255
  readonly a: number; // 0-255
}

export interface PixelGrid {
  readonly width: number;
  readonly height: number;
  setPixel(x: number, y: number, color: RGBA): void;
  getPixel(x: number, y: number): RGBA;
  fill(color: RGBA): void;
  clear(): void;
  clone(): PixelGrid;
  isInBounds(x: number, y: number): boolean;
  /** Export as PNG buffer */
  toPNG(): Buffer;
  /** Get raw pixel data as Uint8ClampedArray (RGBA, row-major) */
  getData(): Uint8ClampedArray;
}

/** Create an RGBA color. Alpha defaults to 255 (opaque). */
export function rgba(r: number, g: number, b: number, a = 255): RGBA {
  return { r, g, b, a };
}

/** Check if two RGBA colors are equal. */
export function rgbaEqual(a: RGBA, b: RGBA): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

export const TRANSPARENT: RGBA = rgba(0, 0, 0, 0);
export const BLACK: RGBA = rgba(0, 0, 0);
export const WHITE: RGBA = rgba(255, 255, 255);

/**
 * Create a new PixelGrid initialized to transparent.
 */
export function createPixelGrid(width: number, height: number): PixelGrid {
  const data = new Uint8ClampedArray(width * height * 4); // RGBA

  function idx(x: number, y: number): number {
    return (y * width + x) * 4;
  }

  const grid: PixelGrid = {
    width,
    height,

    isInBounds(x: number, y: number): boolean {
      return x >= 0 && x < width && y >= 0 && y < height;
    },

    setPixel(x: number, y: number, color: RGBA): void {
      if (!grid.isInBounds(x, y)) return;
      const i = idx(x, y);
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = color.a;
    },

    getPixel(x: number, y: number): RGBA {
      if (!grid.isInBounds(x, y)) return TRANSPARENT;
      const i = idx(x, y);
      return rgba(data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!);
    },

    fill(color: RGBA): void {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          grid.setPixel(x, y, color);
        }
      }
    },

    clear(): void {
      data.fill(0);
    },

    clone(): PixelGrid {
      const copy = createPixelGrid(width, height);
      const copyData = copy.getData();
      copyData.set(data);
      return copy;
    },

    getData(): Uint8ClampedArray {
      return data;
    },

    toPNG(): Buffer {
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(data);
      ctx.putImageData(imageData, 0, 0);
      return canvas.toBuffer('image/png');
    },
  };

  return grid;
}
