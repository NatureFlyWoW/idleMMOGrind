import { describe, it, expect } from 'vitest';
import { generateItem } from '@engine/gear/item-generator';
import { GearSlot, ItemQuality, PrimaryStat } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('generateItem', () => {
  it('should generate an item with correct iLevel and quality', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    expect(item.iLevel).toBe(30);
    expect(item.quality).toBe(ItemQuality.Rare);
    expect(item.slot).toBe(GearSlot.Chest);
  });

  it('should assign primary stats based on class affinity', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    const totalPrimary = Object.values(item.primaryStats).reduce((a, b) => a + (b ?? 0), 0);
    expect(totalPrimary).toBeGreaterThan(0);
  });

  it('should generate weapons with damage range', () => {
    const rng = new SeededRandom(42);
    const weapon = generateItem({
      iLevel: 30,
      quality: ItemQuality.Uncommon,
      slot: GearSlot.MainHand,
      classPrimaryStats: [PrimaryStat.Strength],
      weaponSpeed: 2.0,
      rng,
      config,
    });
    expect(weapon.weaponDamage).toBeDefined();
    expect(weapon.weaponDamage!.min).toBeGreaterThan(0);
    expect(weapon.weaponDamage!.max).toBeGreaterThan(weapon.weaponDamage!.min);
  });

  it('should calculate required level as max(1, iLevel - 3)', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Common,
      slot: GearSlot.Head,
      classPrimaryStats: [PrimaryStat.Intellect],
      rng,
      config,
    });
    expect(item.requiredLevel).toBe(27);
  });

  it('should not drop below required level 1', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 1,
      quality: ItemQuality.Common,
      slot: GearSlot.Head,
      classPrimaryStats: [PrimaryStat.Intellect],
      rng,
      config,
    });
    expect(item.requiredLevel).toBe(1);
  });

  it('should scale stat budget with quality multiplier', () => {
    const rng1 = new SeededRandom(42);
    const common = generateItem({
      iLevel: 30, quality: ItemQuality.Common, slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength], rng: rng1, config,
    });
    const rng2 = new SeededRandom(42);
    const epic = generateItem({
      iLevel: 30, quality: ItemQuality.Epic, slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength], rng: rng2, config,
    });
    const commonTotal = Object.values(common.primaryStats).reduce((a, b) => a + (b ?? 0), 0)
      + Object.values(common.secondaryStats).reduce((a, b) => a + b, 0);
    const epicTotal = Object.values(epic.primaryStats).reduce((a, b) => a + (b ?? 0), 0)
      + Object.values(epic.secondaryStats).reduce((a, b) => a + b, 0);
    expect(epicTotal).toBeGreaterThan(commonTotal);
  });
});
