import {
  GearSlot, ItemQuality, ArmorType, WeaponType, PrimaryStat,
} from './enums';

/** Stat range for item generation */
export interface IStatRange {
  min: number;
  max: number;
}

/** A concrete item instance in a player's inventory/equipment */
export interface IItem {
  id: string;
  templateId: string;
  name: string;
  slot: GearSlot;
  quality: ItemQuality;
  iLevel: number;
  requiredLevel: number;
  armorType?: ArmorType;
  weaponType?: WeaponType;
  primaryStats: Partial<Record<PrimaryStat, number>>;
  secondaryStats: Record<string, number>;
  weaponDamage?: { min: number; max: number };
  weaponSpeed?: number;
  armor?: number;
  durability: { current: number; max: number };
  sellValue: number;
  flavorText?: string;
}

/** Template used for item generation (loot tables reference these) */
export interface IItemTemplate {
  id: string;
  name: string;
  slot: GearSlot;
  armorType?: ArmorType;
  weaponType?: WeaponType;
  classAffinity?: string[];
  weaponSpeed?: number;
  flavorText?: string;
}

/** A loot drop definition in a loot table */
export interface ILootDrop {
  dropChance: number;
  qualityWeights: Record<ItemQuality, number>;
  slotPool: GearSlot[];
  iLevelRange: { min: number; max: number };
}

/** Loot table for a monster or chest */
export interface ILootTable {
  id: string;
  monsterLevel: number;
  drops: ILootDrop[];
}

/** Set bonus (Phase 2+, but interface defined now) */
export interface ISetBonus {
  setId: string;
  setName: string;
  requiredPieces: number;
  bonusStats: Partial<Record<PrimaryStat, number>>;
  bonusDescription: string;
}

/** Unique equip effect (Phase 2+) */
export interface IUniqueEffect {
  id: string;
  name: string;
  description: string;
  procChance?: number;
  cooldownMs?: number;
}

/** Slot budget weight for item generation */
export const SLOT_BUDGET_WEIGHT: Record<GearSlot, number> = {
  [GearSlot.Chest]: 1.0,
  [GearSlot.Legs]: 1.0,
  [GearSlot.Head]: 0.85,
  [GearSlot.Shoulders]: 0.85,
  [GearSlot.Hands]: 0.7,
  [GearSlot.Feet]: 0.7,
  [GearSlot.Waist]: 0.7,
  [GearSlot.Wrists]: 0.55,
  [GearSlot.Back]: 0.55,
  [GearSlot.Neck]: 0.5,
  [GearSlot.Ring1]: 0.5,
  [GearSlot.Ring2]: 0.5,
  [GearSlot.Trinket1]: 0.45,
  [GearSlot.Trinket2]: 0.45,
  [GearSlot.MainHand]: 1.2,
  [GearSlot.OffHand]: 0.6,
};

/** Quality stat multiplier */
export const QUALITY_STAT_MULTIPLIER: Record<ItemQuality, number> = {
  [ItemQuality.Common]: 1.0,
  [ItemQuality.Uncommon]: 1.3,
  [ItemQuality.Rare]: 1.7,
  [ItemQuality.Epic]: 2.2,
  [ItemQuality.Legendary]: 3.0,
};
