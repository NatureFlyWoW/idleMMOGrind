import { describe, it, expect } from 'vitest';
import { createPalette, colorDistance, parseHex } from '../../../../tools/art-engine/src/core/palette.js';
import { rgba } from '../../../../tools/art-engine/src/core/pixel-grid.js';

describe('parseHex', () => {
  it('parses #RRGGBB format', () => {
    expect(parseHex('#FF0000')).toEqual(rgba(255, 0, 0));
    expect(parseHex('#00FF00')).toEqual(rgba(0, 255, 0));
    expect(parseHex('#0070DD')).toEqual(rgba(0, 112, 221));
  });

  it('parses #RRGGBBAA format', () => {
    expect(parseHex('#FF000080')).toEqual(rgba(255, 0, 0, 128));
  });

  it('is case-insensitive', () => {
    expect(parseHex('#ff0000')).toEqual(rgba(255, 0, 0));
  });
});

describe('colorDistance', () => {
  it('returns 0 for identical colors', () => {
    const c = rgba(100, 100, 100);
    expect(colorDistance(c, c)).toBe(0);
  });

  it('returns a positive value for different colors', () => {
    expect(colorDistance(rgba(0, 0, 0), rgba(255, 255, 255))).toBeGreaterThan(0);
  });

  it('black-to-white is greater than black-to-gray', () => {
    const black = rgba(0, 0, 0);
    const gray = rgba(128, 128, 128);
    const white = rgba(255, 255, 255);
    expect(colorDistance(black, white)).toBeGreaterThan(colorDistance(black, gray));
  });
});

describe('Palette', () => {
  const palette = createPalette('test', [
    rgba(255, 0, 0),   // red
    rgba(0, 255, 0),   // green
    rgba(0, 0, 255),   // blue
    rgba(255, 255, 0), // yellow
  ]);

  describe('nearest', () => {
    it('returns exact match when color is in palette', () => {
      expect(palette.nearest(rgba(255, 0, 0))).toEqual(rgba(255, 0, 0));
    });

    it('returns nearest color for non-palette color', () => {
      // Close to red
      expect(palette.nearest(rgba(240, 10, 10))).toEqual(rgba(255, 0, 0));
      // Close to green
      expect(palette.nearest(rgba(10, 240, 10))).toEqual(rgba(0, 255, 0));
    });
  });

  describe('ramp', () => {
    it('generates a color ramp of the specified length', () => {
      const ramp = palette.ramp(rgba(200, 100, 50), 5);
      expect(ramp).toHaveLength(5);
    });

    it('goes from light to dark', () => {
      const ramp = palette.ramp(rgba(200, 100, 50), 5);
      // First color should be lighter (higher luminance)
      const firstLum = ramp[0]!.r + ramp[0]!.g + ramp[0]!.b;
      const lastLum = ramp[4]!.r + ramp[4]!.g + ramp[4]!.b;
      expect(firstLum).toBeGreaterThan(lastLum);
    });
  });

  describe('properties', () => {
    it('has the correct name', () => {
      expect(palette.name).toBe('test');
    });

    it('has the correct color count', () => {
      expect(palette.colors).toHaveLength(4);
    });
  });
});
