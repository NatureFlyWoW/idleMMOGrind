/**
 * Palette system for the art engine.
 *
 * Enforces limited color palettes (pixel art constraint).
 * Provides nearest-color matching and color ramp generation.
 */

import { type RGBA, rgba } from './pixel-grid.js';

export interface Palette {
  readonly name: string;
  readonly colors: readonly RGBA[];
  /** Find the nearest palette color to the given color */
  nearest(color: RGBA): RGBA;
  /** Generate a color ramp (light -> dark) of N steps based on a base color */
  ramp(baseColor: RGBA, steps: number): RGBA[];
}

/**
 * Euclidean distance in RGB space (ignoring alpha).
 * Simple and sufficient for palette quantization at pixel art scales.
 */
export function colorDistance(a: RGBA, b: RGBA): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Parse a hex color string (#RRGGBB or #RRGGBBAA) to RGBA. */
export function parseHex(hex: string): RGBA {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
  return rgba(r, g, b, a);
}

/** Create a palette from hex strings. */
export function createPaletteFromHex(name: string, hexColors: readonly string[]): Palette {
  return createPalette(name, hexColors.map(parseHex));
}

/**
 * Create a Palette with nearest-color matching and ramp generation.
 */
export function createPalette(name: string, colors: readonly RGBA[]): Palette {
  return {
    name,
    colors,

    nearest(color: RGBA): RGBA {
      let bestColor = colors[0]!;
      let bestDist = Infinity;

      for (const c of colors) {
        const dist = colorDistance(color, c);
        if (dist < bestDist) {
          bestDist = dist;
          bestColor = c;
        }
      }

      return bestColor;
    },

    ramp(baseColor: RGBA, steps: number): RGBA[] {
      const result: RGBA[] = [];

      for (let i = 0; i < steps; i++) {
        // t goes from 0 (lightest) to 1 (darkest)
        const t = steps === 1 ? 0.5 : i / (steps - 1);

        // Lighten (t=0): shift toward white; Darken (t=1): shift toward black
        // Mid-point (t=0.5) is the base color
        let r: number, g: number, b: number;

        if (t < 0.5) {
          // Light half: lerp from white toward base
          const lt = t * 2; // 0..1
          r = Math.round(255 + (baseColor.r - 255) * lt);
          g = Math.round(255 + (baseColor.g - 255) * lt);
          b = Math.round(255 + (baseColor.b - 255) * lt);
        } else {
          // Dark half: lerp from base toward black
          const dt = (t - 0.5) * 2; // 0..1
          r = Math.round(baseColor.r * (1 - dt));
          g = Math.round(baseColor.g * (1 - dt));
          b = Math.round(baseColor.b * (1 - dt));
        }

        result.push(rgba(
          Math.max(0, Math.min(255, r)),
          Math.max(0, Math.min(255, g)),
          Math.max(0, Math.min(255, b)),
          baseColor.a,
        ));
      }

      return result;
    },
  };
}
