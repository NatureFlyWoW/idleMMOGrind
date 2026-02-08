import { GearSlot, ItemQuality, PrimaryStat, SecondaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';
import { SLOT_BUDGET_WEIGHT, QUALITY_STAT_MULTIPLIER } from '@shared/types/item';
import type { IBalanceConfig } from '@shared/types/balance';
import { calculateStatBudget, calculateWeaponMinDamage, calculateWeaponMaxDamage } from '@engine/character/stat-calculator';
import type { SeededRandom } from '@shared/utils/rng';

const NAME_PREFIXES: Record<ItemQuality, string[]> = {
  [ItemQuality.Common]: ['Worn', 'Simple', 'Plain', 'Crude'],
  [ItemQuality.Uncommon]: ['Sturdy', 'Reinforced', 'Fine', 'Solid'],
  [ItemQuality.Rare]: ['Masterwork', 'Enchanted', 'Superior', 'Tempered'],
  [ItemQuality.Epic]: ['Ancient', 'Legendary', 'Mythic', 'Exalted'],
  [ItemQuality.Legendary]: ['Godforged', 'Eternal', 'Celestial', 'Divine'],
};

const SLOT_NAMES: Record<GearSlot, string> = {
  [GearSlot.Head]: 'Helm',
  [GearSlot.Shoulders]: 'Pauldrons',
  [GearSlot.Chest]: 'Chestpiece',
  [GearSlot.Wrists]: 'Bracers',
  [GearSlot.Hands]: 'Gauntlets',
  [GearSlot.Waist]: 'Belt',
  [GearSlot.Legs]: 'Leggings',
  [GearSlot.Feet]: 'Boots',
  [GearSlot.Neck]: 'Amulet',
  [GearSlot.Back]: 'Cloak',
  [GearSlot.Ring1]: 'Ring',
  [GearSlot.Ring2]: 'Ring',
  [GearSlot.Trinket1]: 'Trinket',
  [GearSlot.Trinket2]: 'Trinket',
  [GearSlot.MainHand]: 'Weapon',
  [GearSlot.OffHand]: 'Shield',
};

const SECONDARY_STAT_POOL = [
  SecondaryStat.CritChance,
  SecondaryStat.Haste,
  SecondaryStat.HitRating,
  SecondaryStat.Armor,
];

export interface IGenerateItemParams {
  iLevel: number;
  quality: ItemQuality;
  slot: GearSlot;
  classPrimaryStats: PrimaryStat[];
  weaponSpeed?: number;
  rng: SeededRandom;
  config: IBalanceConfig;
}

export function generateItem(params: IGenerateItemParams): IItem {
  const { iLevel, quality, slot, classPrimaryStats, rng, config } = params;

  // Calculate total stat budget
  const rawBudget = calculateStatBudget(iLevel, config);
  const qualityMult = QUALITY_STAT_MULTIPLIER[quality];
  const slotWeight = SLOT_BUDGET_WEIGHT[slot];
  const totalBudget = Math.floor(rawBudget * qualityMult * slotWeight);

  // Split budget: 70% primary, 30% secondary
  const primaryBudget = Math.floor(totalBudget * config.gear.primaryStatSplit);
  const secondaryBudget = totalBudget - primaryBudget;

  // Assign primary stats
  const primaryStats: Partial<Record<PrimaryStat, number>> = {};
  if (classPrimaryStats.length >= 2) {
    const mainStat = classPrimaryStats[0]!;
    const offStat = classPrimaryStats[1]!;
    primaryStats[mainStat] = Math.floor(primaryBudget * 0.6);
    primaryStats[offStat] = primaryBudget - Math.floor(primaryBudget * 0.6);
  } else if (classPrimaryStats.length === 1) {
    primaryStats[classPrimaryStats[0]!] = primaryBudget;
  }

  // Assign secondary stats (1-2 random from pool)
  const secondaryStats: Record<string, number> = {};
  const numSecondary = rng.nextInt(1, 2);
  const shuffled = [...SECONDARY_STAT_POOL].sort(() => rng.next() - 0.5);
  for (let i = 0; i < numSecondary && i < shuffled.length; i++) {
    const stat = shuffled[i]!;
    const share = i === 0 ? Math.ceil(secondaryBudget / numSecondary) : secondaryBudget - Math.ceil(secondaryBudget / numSecondary);
    if (share > 0) {
      secondaryStats[stat] = share;
    }
  }

  // Generate name
  const prefixes = NAME_PREFIXES[quality];
  const prefix = prefixes[rng.nextInt(0, prefixes.length - 1)]!;
  const slotName = SLOT_NAMES[slot];
  const name = `${prefix} ${slotName}`;

  // Weapon damage
  let weaponDamage: { min: number; max: number } | undefined;
  let weaponSpeed: number | undefined;
  if (slot === GearSlot.MainHand || slot === GearSlot.OffHand) {
    weaponSpeed = params.weaponSpeed ?? 2.0;
    const minDmg = calculateWeaponMinDamage(iLevel, qualityMult, weaponSpeed, config);
    const maxDmg = calculateWeaponMaxDamage(iLevel, qualityMult, weaponSpeed, config);
    weaponDamage = { min: Math.max(1, minDmg), max: Math.max(2, maxDmg) };
  }

  return {
    id: crypto.randomUUID(),
    templateId: `generated-${slot}-${iLevel}`,
    name,
    slot,
    quality,
    iLevel,
    requiredLevel: Math.max(1, iLevel - 3),
    primaryStats,
    secondaryStats,
    weaponDamage,
    weaponSpeed,
    durability: { current: 100, max: 100 },
    sellValue: Math.floor(iLevel * qualityMult * 2),
  };
}
