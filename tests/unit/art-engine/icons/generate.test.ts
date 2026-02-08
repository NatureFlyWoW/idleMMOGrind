import { describe, it, expect } from 'vitest';
import { generateIcon } from '../../../../tools/art-engine/src/icons/generate.js';
import { rgbaEqual, TRANSPARENT } from '../../../../tools/art-engine/src/core/pixel-grid.js';

describe('generateIcon', () => {
  it('produces a grid of the correct size', () => {
    const grid = generateIcon({
      category: 'weapon',
      type: 'longsword',
      quality: 'common',
      seed: 42,
    });
    expect(grid.width).toBe(48);
    expect(grid.height).toBe(48);
  });

  it('has non-transparent pixels (something was drawn)', () => {
    const grid = generateIcon({
      category: 'weapon',
      type: 'longsword',
      quality: 'common',
      seed: 42,
    });
    let nonTransparent = 0;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (!rgbaEqual(grid.getPixel(x, y), TRANSPARENT)) nonTransparent++;
      }
    }
    expect(nonTransparent).toBeGreaterThan(50);
  });

  it('is reproducible (same seed = same output)', () => {
    const grid1 = generateIcon({
      category: 'weapon',
      type: 'longsword',
      quality: 'epic',
      seed: 42,
    });
    const grid2 = generateIcon({
      category: 'weapon',
      type: 'longsword',
      quality: 'epic',
      seed: 42,
    });

    for (let y = 0; y < grid1.height; y++) {
      for (let x = 0; x < grid1.width; x++) {
        expect(rgbaEqual(grid1.getPixel(x, y), grid2.getPixel(x, y))).toBe(true);
      }
    }
  });

  it('produces different output for different seeds', () => {
    const grid1 = generateIcon({
      category: 'weapon',
      type: 'longsword',
      quality: 'rare',
      seed: 42,
    });
    const grid2 = generateIcon({
      category: 'weapon',
      type: 'longsword',
      quality: 'rare',
      seed: 99,
    });

    let diffs = 0;
    for (let y = 0; y < grid1.height; y++) {
      for (let x = 0; x < grid1.width; x++) {
        if (!rgbaEqual(grid1.getPixel(x, y), grid2.getPixel(x, y))) diffs++;
      }
    }
    expect(diffs).toBeGreaterThan(0);
  });

  it('produces different output for different quality tiers', () => {
    const common = generateIcon({ category: 'weapon', type: 'longsword', quality: 'common', seed: 42 });
    const epic = generateIcon({ category: 'weapon', type: 'longsword', quality: 'epic', seed: 42 });

    let diffs = 0;
    for (let y = 0; y < common.height; y++) {
      for (let x = 0; x < common.width; x++) {
        if (!rgbaEqual(common.getPixel(x, y), epic.getPixel(x, y))) diffs++;
      }
    }
    expect(diffs).toBeGreaterThan(0);
  });

  it('draws an outline around the icon', () => {
    const grid = generateIcon({
      category: 'weapon',
      type: 'longsword',
      quality: 'common',
      seed: 42,
    });
    let darkBorderPixels = 0;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const p = grid.getPixel(x, y);
        if (p.a > 0 && p.r < 30 && p.g < 30 && p.b < 30) darkBorderPixels++;
      }
    }
    expect(darkBorderPixels).toBeGreaterThan(10);
  });
});
