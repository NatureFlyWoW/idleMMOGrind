/**
 * Game palette definitions derived from the art style guide.
 *
 * All colors match docs/ui/specs/art-style-guide.md exactly.
 * These are the canonical color values for the entire game.
 */

import { type RGBA, rgba } from '../core/pixel-grid.js';
import { createPalette, createPaletteFromHex, parseHex, type Palette } from '../core/palette.js';

// --- Quality tier colors ---

export const QUALITY_COLORS = {
  common:    { primary: parseHex('#9D9D9D'), glow: parseHex('#9D9D9D') },
  uncommon:  { primary: parseHex('#1EFF00'), glow: parseHex('#1EFF00') },
  rare:      { primary: parseHex('#0070DD'), glow: parseHex('#4A9FFF') },
  epic:      { primary: parseHex('#A335EE'), glow: parseHex('#C77DFF') },
  legendary: { primary: parseHex('#FF8000'), glow: parseHex('#FFB347') },
} as const;

export type QualityTier = keyof typeof QUALITY_COLORS;

// --- Material color ramps (highlight -> mid -> shadow) ---

export const MATERIAL_RAMPS = {
  iron:    { highlight: parseHex('#C0C0C0'), mid: parseHex('#708090'), shadow: parseHex('#2F4F4F') },
  gold:    { highlight: parseHex('#FFFACD'), mid: parseHex('#FFD700'), shadow: parseHex('#B8860B') },
  leather: { highlight: parseHex('#D2691E'), mid: parseHex('#8B4513'), shadow: parseHex('#654321') },
  cloth:   { highlight: parseHex('#FFF8DC'), mid: parseHex('#F5DEB3'), shadow: parseHex('#D2B48C') },
  bone:    { highlight: parseHex('#FFFFF0'), mid: parseHex('#FFF8E7'), shadow: parseHex('#D2C6A5') },
  crystal: { highlight: parseHex('#E1BEE7'), mid: parseHex('#AB47BC'), shadow: parseHex('#6A1B9A') },
  wood:    { highlight: parseHex('#D2A679'), mid: parseHex('#8B6914'), shadow: parseHex('#5D4037') },
  stone:   { highlight: parseHex('#9E9E9E'), mid: parseHex('#616161'), shadow: parseHex('#424242') },
} as const;

export type MaterialType = keyof typeof MATERIAL_RAMPS;

// --- Zone signature palettes ---

export const ZONE_PALETTES = {
  startingRegions: createPaletteFromHex('startingRegions', [
    '#7CB342', '#FDD835', '#87CEEB', '#A5D6A7', '#FFF176', '#81D4FA',
  ]),
  wildwood: createPaletteFromHex('wildwood', [
    '#2E7D32', '#5D4037', '#8D6E63', '#388E3C', '#795548', '#A1887F',
  ]),
  mistmoors: createPaletteFromHex('mistmoors', [
    '#5C6BC0', '#7E57C2', '#455A64', '#7986CB', '#9575CD', '#78909C',
  ]),
  skyreach: createPaletteFromHex('skyreach', [
    '#42A5F5', '#ECEFF1', '#607D8B', '#64B5F6', '#CFD8DC', '#90A4AE',
  ]),
  blightedWastes: createPaletteFromHex('blightedWastes', [
    '#9CCC65', '#8E24AA', '#3E2723', '#AED581', '#AB47BC', '#5D4037',
  ]),
  ascendantTerritories: createPaletteFromHex('ascendantTerritories', [
    '#FFD54F', '#9C27B0', '#F5F5F5', '#FFE082', '#BA68C8', '#FAFAFA',
  ]),
} as const;

/**
 * Build a full palette from a material's ramp colors.
 * Expands the 3 base colors (highlight, mid, shadow) into a smooth ramp.
 */
export function getMaterialPalette(material: MaterialType): Palette {
  const ramp = MATERIAL_RAMPS[material];
  const colors: RGBA[] = [];

  // Generate intermediate colors between highlight -> mid -> shadow
  const steps = [ramp.highlight, ramp.mid, ramp.shadow];

  for (let i = 0; i < steps.length - 1; i++) {
    const from = steps[i]!;
    const to = steps[i + 1]!;
    // 3 intermediate steps between each pair
    for (let t = 0; t <= 3; t++) {
      const frac = t / 3;
      colors.push(rgba(
        Math.round(from.r + (to.r - from.r) * frac),
        Math.round(from.g + (to.g - from.g) * frac),
        Math.round(from.b + (to.b - from.b) * frac),
      ));
    }
  }

  return createPalette(material, colors);
}
