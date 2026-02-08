import {
  Race,
  CharacterClass,
  PrimaryStat,
  ResourceType,
  GearSlot,
  ItemQuality,
  ArmorType,
  WeaponType,
} from '@shared/types/enums';
import type {
  IPrimaryStatBlock,
  IRaceDefinition,
  IClassDefinition,
  ICharacterCreationParams,
} from '@shared/types/character';
import type { IItem } from '@shared/types/item';

import racesData from '@data/races.json';
import classesData from '@data/classes.json';

// ---------------------------------------------------------------------------
// ICharacterState
// ---------------------------------------------------------------------------

export interface ICharacterState {
  id: string;
  name: string;
  race: Race;
  classId: CharacterClass;
  level: number;
  currentXP: number;
  gold: number;
  primaryStats: IPrimaryStatBlock;
  currentHP: number;
  maxHP: number;
  currentResource: number;
  maxResource: number;
  resourceType: ResourceType;
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  currentZoneId: string;
  deathCount: number;
  totalKills: number;
  totalQuestsCompleted: number;
  respecCount: number;
  playTimeSeconds: number;
}

// ---------------------------------------------------------------------------
// Data lookup helpers
// ---------------------------------------------------------------------------

const races = racesData as unknown as IRaceDefinition[];
const classes = classesData as unknown as IClassDefinition[];

/**
 * Look up a race definition from the loaded races data.
 * Throws if the race id is not found.
 */
export function getRaceDefinition(race: Race): IRaceDefinition {
  const def = races.find((r) => r.id === race);
  if (!def) {
    throw new Error(`Unknown race: ${race}`);
  }
  return def;
}

/**
 * Look up a class definition from the loaded classes data.
 * Throws if the class id is not found.
 */
export function getClassDefinition(classId: CharacterClass): IClassDefinition {
  const def = classes.find((c) => c.id === classId);
  if (!def) {
    throw new Error(`Unknown class: ${classId}`);
  }
  return def;
}

// ---------------------------------------------------------------------------
// Starter equipment generation
// ---------------------------------------------------------------------------

/** Weapon types considered two-handed. */
const TWO_HAND_PATTERNS = ['2h', 'staff', 'bow', 'crossbow'] as const;

function isTwoHanded(weaponType: WeaponType): boolean {
  const value = weaponType as string;
  return TWO_HAND_PATTERNS.some((pattern) => value.includes(pattern));
}

/** Map of armor type name prefixes (used for starter item naming). */
const ARMOR_NAME_PREFIX: Record<ArmorType, string> = {
  [ArmorType.Cloth]: 'Threadbare Cloth',
  [ArmorType.Leather]: 'Worn Leather',
  [ArmorType.Mail]: 'Worn Mail',
  [ArmorType.Plate]: 'Battered Plate',
};

/** Human-readable labels for gear slots. */
const SLOT_LABEL: Record<string, string> = {
  [GearSlot.Head]: 'Helm',
  [GearSlot.Chest]: 'Chestpiece',
  [GearSlot.Legs]: 'Leggings',
  [GearSlot.Feet]: 'Boots',
  [GearSlot.Hands]: 'Gloves',
};

/** Human-readable label for a weapon type. */
function weaponTypeLabel(wt: WeaponType): string {
  const map: Partial<Record<WeaponType, string>> = {
    [WeaponType.Sword1H]: 'Sword',
    [WeaponType.Sword2H]: 'Greatsword',
    [WeaponType.Mace1H]: 'Mace',
    [WeaponType.Mace2H]: 'Warhammer',
    [WeaponType.Axe1H]: 'Hatchet',
    [WeaponType.Axe2H]: 'Battleaxe',
    [WeaponType.Dagger]: 'Dagger',
    [WeaponType.Staff]: 'Staff',
    [WeaponType.Bow]: 'Bow',
    [WeaponType.Crossbow]: 'Crossbow',
    [WeaponType.Wand]: 'Wand',
    [WeaponType.Shield]: 'Shield',
    [WeaponType.OffhandHeld]: 'Tome',
  };
  return map[wt] ?? wt;
}

/**
 * Determine the "main stat" for a class (first entry in primaryStats).
 * Falls back to Strength if the class has no primary stats listed.
 */
function getMainStat(classDef: IClassDefinition): PrimaryStat {
  return classDef.primaryStats[0] ?? PrimaryStat.Strength;
}

/**
 * Create a starter armor piece.
 * iLevel 1, Common quality, +1 main stat, +1 stamina.
 */
function createStarterArmor(
  slot: GearSlot,
  armorType: ArmorType,
  mainStat: PrimaryStat,
): IItem {
  const label = SLOT_LABEL[slot] ?? slot;
  const armorLabel = ARMOR_NAME_PREFIX[armorType];

  const stats: Partial<Record<PrimaryStat, number>> = { [mainStat]: 1 };
  if (mainStat !== PrimaryStat.Stamina) {
    stats[PrimaryStat.Stamina] = 1;
  }

  return {
    id: crypto.randomUUID(),
    templateId: `starter-${slot}`,
    name: `${armorLabel} ${label}`,
    slot,
    quality: ItemQuality.Common,
    iLevel: 1,
    requiredLevel: 1,
    armorType,
    primaryStats: stats,
    secondaryStats: {},
    armor: 1,
    durability: { current: 100, max: 100 },
    sellValue: 1,
  };
}

/**
 * Create a starter weapon.
 * iLevel 1, Common quality, +1 main stat.
 * 1H: damage 3-5, speed 2.0
 * 2H: damage 5-8, speed 3.0
 */
function createStarterWeapon(
  weaponType: WeaponType,
  mainStat: PrimaryStat,
): IItem {
  const twoHanded = isTwoHanded(weaponType);
  const label = weaponTypeLabel(weaponType);

  return {
    id: crypto.randomUUID(),
    templateId: `starter-weapon-${weaponType}`,
    name: `Worn ${label}`,
    slot: GearSlot.MainHand,
    quality: ItemQuality.Common,
    iLevel: 1,
    requiredLevel: 1,
    weaponType,
    primaryStats: { [mainStat]: 1 },
    secondaryStats: {},
    weaponDamage: twoHanded ? { min: 5, max: 8 } : { min: 3, max: 5 },
    weaponSpeed: twoHanded ? 3.0 : 2.0,
    durability: { current: 100, max: 100 },
    sellValue: 1,
  };
}

// ---------------------------------------------------------------------------
// Character factory
// ---------------------------------------------------------------------------

/** Armor slots that receive starter gear. */
const STARTER_ARMOR_SLOTS: GearSlot[] = [
  GearSlot.Head,
  GearSlot.Chest,
  GearSlot.Legs,
  GearSlot.Feet,
  GearSlot.Hands,
];

/** Default inventory size (number of slots). */
const DEFAULT_INVENTORY_SIZE = 28;

/**
 * Create a new level-1 character with starting stats, equipment, and defaults.
 *
 * @param params - Character creation parameters (name, race, classId)
 * @returns A fully initialised ICharacterState
 */
export function createCharacter(params: ICharacterCreationParams): ICharacterState {
  const raceDef = getRaceDefinition(params.race);
  const classDef = getClassDefinition(params.classId);

  // ---- Starting primary stats = class base + race bonus ----
  const primaryStats: IPrimaryStatBlock = {
    [PrimaryStat.Strength]:
      classDef.baseStats[PrimaryStat.Strength] + raceDef.statBonuses[PrimaryStat.Strength],
    [PrimaryStat.Agility]:
      classDef.baseStats[PrimaryStat.Agility] + raceDef.statBonuses[PrimaryStat.Agility],
    [PrimaryStat.Intellect]:
      classDef.baseStats[PrimaryStat.Intellect] + raceDef.statBonuses[PrimaryStat.Intellect],
    [PrimaryStat.Spirit]:
      classDef.baseStats[PrimaryStat.Spirit] + raceDef.statBonuses[PrimaryStat.Spirit],
    [PrimaryStat.Stamina]:
      classDef.baseStats[PrimaryStat.Stamina] + raceDef.statBonuses[PrimaryStat.Stamina],
  };

  // ---- HP: stamina * 10 + class baseHP ----
  const maxHP = primaryStats[PrimaryStat.Stamina] * 10 + classDef.baseHP;

  // ---- Resource: rage starts at 0, others start at baseResource ----
  const resourceType = classDef.resourceType as ResourceType;
  const maxResource = classDef.baseResource;
  const currentResource = resourceType === ResourceType.Rage ? 0 : maxResource;

  // ---- Starting equipment ----
  const mainStat = getMainStat(classDef);
  const equipment: Partial<Record<GearSlot, IItem | null>> = {};

  for (const slot of STARTER_ARMOR_SLOTS) {
    equipment[slot] = createStarterArmor(slot, classDef.armorType as ArmorType, mainStat);
  }

  const firstWeaponType = classDef.weaponTypes[0] as WeaponType;
  equipment[GearSlot.MainHand] = createStarterWeapon(firstWeaponType, mainStat);

  // ---- Empty inventory ----
  const inventory: (IItem | null)[] = new Array<IItem | null>(DEFAULT_INVENTORY_SIZE).fill(null);

  return {
    id: crypto.randomUUID(),
    name: params.name,
    race: params.race,
    classId: params.classId,
    level: 1,
    currentXP: 0,
    gold: 0,
    primaryStats,
    currentHP: maxHP,
    maxHP,
    currentResource,
    maxResource,
    resourceType,
    equipment,
    inventory,
    currentZoneId: 'zone_01',
    deathCount: 0,
    totalKills: 0,
    totalQuestsCompleted: 0,
    respecCount: 0,
    playTimeSeconds: 0,
  };
}
