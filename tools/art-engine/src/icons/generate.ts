/**
 * Icon generation pipeline.
 */

import { createPixelGrid, type PixelGrid, rgba, rgbaEqual, TRANSPARENT } from '../core/pixel-grid.js';
import { createRNG } from '../core/seed.js';
import { type MaterialType } from '../palettes/game-palettes.js';
import { loadTemplate } from './templates.js';
import { shadeRegion } from './shading.js';
import { applyQualityTier } from './quality-tier.js';
import { type IconGenerationParams } from './types.js';

const OUTLINE_COLOR = rgba(15, 10, 10);

export function generateIcon(params: IconGenerationParams): PixelGrid {
  const template = loadTemplate(params.category, params.type);
  const grid = createPixelGrid(template.size.width, template.size.height);
  const rng = createRNG(params.seed);

  // Seed-driven variation in lighting for visual uniqueness
  const lightAngleJitter = (rng.next() - 0.5) * 30; // +/- 15 degrees
  const ambientJitter = (rng.next() - 0.5) * 0.1;   // +/- 0.05

  for (const region of template.regions) {
    const material = params.materialOverrides?.[region.name] ?? region.material;
    shadeRegion(grid, region, {
      material: material as MaterialType,
      lightAngle: template.lightingAngle + lightAngleJitter,
      ambientLight: Math.max(0.1, Math.min(0.5, 0.3 + ambientJitter)),
      ditherStrength: 0.3 + rng.next() * 0.2,
    }, rng);
  }

  drawOutline(grid, params.outlineWidth ?? 2);
  applyQualityTier(grid, params.quality, rng);

  return grid;
}

function drawOutline(grid: PixelGrid, width: number): void {
  const outlinePixels: [number, number][] = [];

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (!rgbaEqual(grid.getPixel(x, y), TRANSPARENT)) continue;

      let nearSolid = false;
      for (let dy = -width; dy <= width && !nearSolid; dy++) {
        for (let dx = -width; dx <= width && !nearSolid; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (Math.abs(dx) + Math.abs(dy) > width + 1) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (!grid.isInBounds(nx, ny)) continue;
          if (!rgbaEqual(grid.getPixel(nx, ny), TRANSPARENT)) {
            nearSolid = true;
          }
        }
      }

      if (nearSolid) {
        outlinePixels.push([x, y]);
      }
    }
  }

  for (const [x, y] of outlinePixels) {
    grid.setPixel(x, y, OUTLINE_COLOR);
  }
}
