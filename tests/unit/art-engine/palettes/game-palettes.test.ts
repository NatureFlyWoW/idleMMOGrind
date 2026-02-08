import { describe, it, expect } from 'vitest';
import {
  QUALITY_COLORS,
  MATERIAL_RAMPS,
  ZONE_PALETTES,
  getMaterialPalette,
} from '../../../../tools/art-engine/src/palettes/game-palettes.js';

describe('QUALITY_COLORS', () => {
  it('has all five quality tiers', () => {
    expect(QUALITY_COLORS.common).toBeDefined();
    expect(QUALITY_COLORS.uncommon).toBeDefined();
    expect(QUALITY_COLORS.rare).toBeDefined();
    expect(QUALITY_COLORS.epic).toBeDefined();
    expect(QUALITY_COLORS.legendary).toBeDefined();
  });

  it('each tier has primary and glow colors', () => {
    for (const tier of Object.values(QUALITY_COLORS)) {
      expect(tier.primary.r).toBeGreaterThanOrEqual(0);
      expect(tier.glow.r).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('MATERIAL_RAMPS', () => {
  it('has ramps for core materials', () => {
    expect(MATERIAL_RAMPS.iron).toBeDefined();
    expect(MATERIAL_RAMPS.gold).toBeDefined();
    expect(MATERIAL_RAMPS.leather).toBeDefined();
    expect(MATERIAL_RAMPS.cloth).toBeDefined();
  });

  it('each ramp has highlight, mid, and shadow colors', () => {
    for (const ramp of Object.values(MATERIAL_RAMPS)) {
      expect(ramp.highlight.r).toBeGreaterThanOrEqual(0);
      expect(ramp.mid.r).toBeGreaterThanOrEqual(0);
      expect(ramp.shadow.r).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('ZONE_PALETTES', () => {
  it('has palettes for all game zones', () => {
    expect(ZONE_PALETTES.startingRegions).toBeDefined();
    expect(ZONE_PALETTES.wildwood).toBeDefined();
    expect(ZONE_PALETTES.mistmoors).toBeDefined();
    expect(ZONE_PALETTES.skyreach).toBeDefined();
    expect(ZONE_PALETTES.blightedWastes).toBeDefined();
    expect(ZONE_PALETTES.ascendantTerritories).toBeDefined();
  });

  it('each zone palette has at least 3 colors', () => {
    for (const palette of Object.values(ZONE_PALETTES)) {
      expect(palette.colors.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('getMaterialPalette', () => {
  it('returns a palette for a valid material type', () => {
    const palette = getMaterialPalette('iron');
    expect(palette.name).toBe('iron');
    expect(palette.colors.length).toBeGreaterThanOrEqual(3);
  });

  it('generates a full ramp from the material colors', () => {
    const palette = getMaterialPalette('gold');
    // Should have at least the 3 base ramp colors expanded to more shades
    expect(palette.colors.length).toBeGreaterThanOrEqual(5);
  });
});
