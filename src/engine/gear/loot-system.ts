import { ItemQuality, GearSlot, PrimaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';
import type { IBalanceConfig } from '@shared/types/balance';
import { generateItem } from './item-generator';
import type { SeededRandom } from '@shared/utils/rng';

const EQUIPPABLE_SLOTS: GearSlot[] = [
  GearSlot.Head, GearSlot.Shoulders, GearSlot.Chest, GearSlot.Wrists,
  GearSlot.Hands, GearSlot.Waist, GearSlot.Legs, GearSlot.Feet,
  GearSlot.Neck, GearSlot.Back, GearSlot.Ring1, GearSlot.Ring2,
  GearSlot.Trinket1, GearSlot.Trinket2, GearSlot.MainHand, GearSlot.OffHand,
];

export function rollItemQuality(
  rng: SeededRandom,
  playerLevel: number,
  config: IBalanceConfig,
): ItemQuality {
  const weights = { ...config.gear.qualityWeights };

  // No Epic below configured level, no Legendary in Phase 1
  if (playerLevel < config.gear.epicMinLevel) {
    weights[ItemQuality.Epic] = 0;
  }
  weights[ItemQuality.Legendary] = 0;

  const entries = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .map(([q, w]) => ({ item: q as ItemQuality, weight: w }));

  return rng.weightedChoice(entries);
}

export interface IRollLootDropParams {
  monsterLevel: number;
  playerLevel: number;
  classPrimaryStats: PrimaryStat[];
  rng: SeededRandom;
  config: IBalanceConfig;
}

export function rollLootDrop(params: IRollLootDropParams): IItem | null {
  const { monsterLevel, playerLevel, classPrimaryStats, rng, config } = params;

  // Check if item drops at all
  if (!rng.chance(config.gear.dropChanceBase)) {
    return null;
  }

  const quality = rollItemQuality(rng, playerLevel, config);
  const slot = EQUIPPABLE_SLOTS[rng.nextInt(0, EQUIPPABLE_SLOTS.length - 1)]!;

  const qualityBonus: Record<ItemQuality, number> = {
    [ItemQuality.Common]: 0,
    [ItemQuality.Uncommon]: 1,
    [ItemQuality.Rare]: 2,
    [ItemQuality.Epic]: 4,
    [ItemQuality.Legendary]: 6,
  };

  const iLevel = monsterLevel + qualityBonus[quality];

  return generateItem({
    iLevel,
    quality,
    slot,
    classPrimaryStats,
    rng,
    config,
  });
}
