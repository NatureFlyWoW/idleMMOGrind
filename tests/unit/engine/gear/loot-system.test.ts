import { describe, it, expect } from 'vitest';
import { rollLootDrop, rollItemQuality } from '@engine/gear/loot-system';
import { ItemQuality, PrimaryStat } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('rollItemQuality', () => {
  it('should return a valid quality tier', () => {
    const rng = new SeededRandom(42);
    const quality = rollItemQuality(rng, 50, config);
    expect(Object.values(ItemQuality)).toContain(quality);
  });

  it('should not drop Epic quality below level 40', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const quality = rollItemQuality(rng, 30, config);
      expect(quality).not.toBe(ItemQuality.Epic);
    }
  });

  it('should mostly drop Common and Uncommon', () => {
    const rng = new SeededRandom(42);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      const q = rollItemQuality(rng, 50, config);
      counts[q] = (counts[q] ?? 0) + 1;
    }
    expect(counts[ItemQuality.Common]! + counts[ItemQuality.Uncommon]!).toBeGreaterThan(3000);
  });
});

describe('rollLootDrop', () => {
  it('should sometimes return an item', () => {
    const rng = new SeededRandom(42);
    let drops = 0;
    for (let i = 0; i < 100; i++) {
      const item = rollLootDrop({
        monsterLevel: 20,
        playerLevel: 20,
        classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
        rng,
        config,
      });
      if (item) drops++;
    }
    // With 20% drop chance, expect roughly 15-25 drops out of 100
    expect(drops).toBeGreaterThan(5);
    expect(drops).toBeLessThan(40);
  });

  it('should return null sometimes (no drop)', () => {
    const rng = new SeededRandom(1);
    let nulls = 0;
    for (let i = 0; i < 50; i++) {
      const item = rollLootDrop({
        monsterLevel: 10,
        playerLevel: 10,
        classPrimaryStats: [PrimaryStat.Agility],
        rng,
        config,
      });
      if (!item) nulls++;
    }
    expect(nulls).toBeGreaterThan(0);
  });
});
