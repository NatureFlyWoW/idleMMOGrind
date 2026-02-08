/**
 * Material-aware pixel shading for icon regions.
 */

import { type PixelGrid, rgba } from '../core/pixel-grid.js';
import { type SeededRNG } from '../core/seed.js';
import { type Palette } from '../core/palette.js';
import { getMaterialPalette, type MaterialType } from '../palettes/game-palettes.js';
import { type ShapeRegion } from './types.js';

export interface ShadingParams {
  material: MaterialType;
  lightAngle: number;
  ambientLight: number;
  ditherStrength: number;
}

export function shadeRegion(
  grid: PixelGrid,
  region: ShapeRegion,
  params: ShadingParams,
  rng: SeededRNG,
): void {
  const palette = getMaterialPalette(params.material);
  const colors = palette.colors;
  if (colors.length === 0) return;

  const rad = (params.lightAngle * Math.PI) / 180;
  const lightDx = Math.cos(rad);
  const lightDy = -Math.sin(rad);

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of region.pixels) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  for (const [x, y] of region.pixels) {
    const nx = (x - minX) / rangeX;
    const ny = (y - minY) / rangeY;
    const posLight = nx * lightDx + ny * lightDy;
    const intensity = params.ambientLight + (1 - params.ambientLight) * (posLight * 0.5 + 0.5) * region.depth;
    const clamped = Math.max(0, Math.min(1, intensity));

    // Map continuous intensity to a float index, apply dither jitter before rounding
    let floatIdx = clamped * (colors.length - 1);

    if (params.ditherStrength > 0) {
      const jitter = (rng.next() - 0.5) * params.ditherStrength * (colors.length - 1);
      floatIdx += jitter;
    }

    const colorIdx = Math.max(0, Math.min(colors.length - 1, Math.round(floatIdx)));
    const color = colors[colorIdx]!;
    grid.setPixel(x, y, color);
  }
}
