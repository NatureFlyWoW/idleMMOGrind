/**
 * Quality tier visual effects for icons.
 */

import { type PixelGrid, rgba, rgbaEqual, TRANSPARENT, type RGBA } from '../core/pixel-grid.js';
import { QUALITY_COLORS, type QualityTier } from '../palettes/game-palettes.js';
import { type SeededRNG } from '../core/seed.js';

interface QualityConfig {
  borderColor: RGBA;
  glowColor: RGBA;
  glowRadius: number;
  glowIntensity: number;
}

const QUALITY_CONFIGS: Record<QualityTier, QualityConfig> = {
  common: {
    borderColor: QUALITY_COLORS.common.primary,
    glowColor: QUALITY_COLORS.common.glow,
    glowRadius: 0,
    glowIntensity: 0,
  },
  uncommon: {
    borderColor: QUALITY_COLORS.uncommon.primary,
    glowColor: QUALITY_COLORS.uncommon.glow,
    glowRadius: 1,
    glowIntensity: 0.2,
  },
  rare: {
    borderColor: QUALITY_COLORS.rare.primary,
    glowColor: QUALITY_COLORS.rare.glow,
    glowRadius: 1,
    glowIntensity: 0.4,
  },
  epic: {
    borderColor: QUALITY_COLORS.epic.primary,
    glowColor: QUALITY_COLORS.epic.glow,
    glowRadius: 2,
    glowIntensity: 0.6,
  },
  legendary: {
    borderColor: QUALITY_COLORS.legendary.primary,
    glowColor: QUALITY_COLORS.legendary.glow,
    glowRadius: 2,
    glowIntensity: 0.9,
  },
};

export function applyQualityTier(grid: PixelGrid, quality: QualityTier, _rng: SeededRNG): void {
  const config = QUALITY_CONFIGS[quality];
  if (config.glowRadius === 0) return;

  const edges: [number, number][] = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (rgbaEqual(grid.getPixel(x, y), TRANSPARENT)) continue;

      const hasTransparentNeighbor =
        rgbaEqual(grid.getPixel(x - 1, y), TRANSPARENT) ||
        rgbaEqual(grid.getPixel(x + 1, y), TRANSPARENT) ||
        rgbaEqual(grid.getPixel(x, y - 1), TRANSPARENT) ||
        rgbaEqual(grid.getPixel(x, y + 1), TRANSPARENT);

      if (hasTransparentNeighbor) {
        edges.push([x, y]);
      }
    }
  }

  for (const [ex, ey] of edges) {
    for (let dy = -config.glowRadius; dy <= config.glowRadius; dy++) {
      for (let dx = -config.glowRadius; dx <= config.glowRadius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = ex + dx;
        const ny = ey + dy;
        if (!grid.isInBounds(nx, ny)) continue;
        if (!rgbaEqual(grid.getPixel(nx, ny), TRANSPARENT)) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > config.glowRadius) continue;

        const falloff = 1 - dist / (config.glowRadius + 1);
        const alpha = Math.round(255 * config.glowIntensity * falloff);

        grid.setPixel(nx, ny, rgba(
          config.glowColor.r,
          config.glowColor.g,
          config.glowColor.b,
          alpha,
        ));
      }
    }
  }
}
