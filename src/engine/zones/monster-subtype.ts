import { MonsterSubtype } from '@shared/types/enums';
import type { IMaterialDrop } from '@shared/types/zone-expansion';
import type { SeededRandom } from '@shared/utils/rng';

/**
 * Material drop result from a roll.
 */
export interface IMaterialDropResult {
  materialId: string;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Drop table templates by monster subtype
// ---------------------------------------------------------------------------

const BEAST_DROPS: ReadonlyArray<IMaterialDrop> = [
  {
    materialId: 'leather',
    chance: 0.6,
    quantity: { min: 1, max: 3 },
    requiresProfession: 'skinning',
  },
  {
    materialId: 'meat',
    chance: 0.5,
    quantity: { min: 1, max: 2 },
  },
];

const HUMANOID_DROPS: ReadonlyArray<IMaterialDrop> = [
  {
    materialId: 'cloth',
    chance: 0.55,
    quantity: { min: 1, max: 3 },
  },
  {
    materialId: 'coins',
    chance: 0.4,
    quantity: { min: 1, max: 5 },
  },
];

const ELEMENTAL_DROPS: ReadonlyArray<IMaterialDrop> = [
  {
    materialId: 'reagent',
    chance: 0.45,
    quantity: { min: 1, max: 2 },
  },
  {
    materialId: 'elemental_core',
    chance: 0.2,
    quantity: { min: 1, max: 1 },
  },
];

const UNDEAD_DROPS: ReadonlyArray<IMaterialDrop> = [
  {
    materialId: 'bone_dust',
    chance: 0.5,
    quantity: { min: 1, max: 3 },
  },
  {
    materialId: 'rune_fragment',
    chance: 0.25,
    quantity: { min: 1, max: 2 },
  },
];

const CONSTRUCT_DROPS: ReadonlyArray<IMaterialDrop> = [
  {
    materialId: 'gears',
    chance: 0.5,
    quantity: { min: 1, max: 2 },
  },
  {
    materialId: 'stone',
    chance: 0.45,
    quantity: { min: 1, max: 3 },
  },
];

const DRAGONKIN_DROPS: ReadonlyArray<IMaterialDrop> = [
  {
    materialId: 'dragon_scale',
    chance: 0.35,
    quantity: { min: 1, max: 2 },
  },
  {
    materialId: 'dragon_essence',
    chance: 0.15,
    quantity: { min: 1, max: 1 },
  },
];

const DROP_TABLE_MAP: ReadonlyMap<MonsterSubtype, ReadonlyArray<IMaterialDrop>> = new Map([
  [MonsterSubtype.Beast, BEAST_DROPS],
  [MonsterSubtype.Humanoid, HUMANOID_DROPS],
  [MonsterSubtype.Elemental, ELEMENTAL_DROPS],
  [MonsterSubtype.Undead, UNDEAD_DROPS],
  [MonsterSubtype.Construct, CONSTRUCT_DROPS],
  [MonsterSubtype.Dragonkin, DRAGONKIN_DROPS],
]);

// ---------------------------------------------------------------------------
// Public API -- pure functions
// ---------------------------------------------------------------------------

/**
 * Returns the material drop table template for a given monster subtype.
 * This is a read-only snapshot; callers should use `rollMaterialDrops` to
 * resolve actual drops with RNG.
 */
export function getMaterialDropTable(subtype: MonsterSubtype): ReadonlyArray<IMaterialDrop> {
  return DROP_TABLE_MAP.get(subtype) ?? [];
}

/**
 * Roll actual material drops from a drop table using seeded RNG.
 *
 * @param drops        - The drop table entries to roll against.
 * @param rng          - A seeded random number generator.
 * @param professions  - List of professions the player has (used to gate
 *                       drops with `requiresProfession`). If omitted,
 *                       profession-gated drops are skipped.
 * @returns Array of material drop results with resolved quantities.
 */
export function rollMaterialDrops(
  drops: ReadonlyArray<IMaterialDrop>,
  rng: SeededRandom,
  professions: ReadonlyArray<string> = [],
): IMaterialDropResult[] {
  const results: IMaterialDropResult[] = [];

  for (const drop of drops) {
    // Skip profession-gated drops if the player lacks the required profession
    if (drop.requiresProfession && !professions.includes(drop.requiresProfession)) {
      continue;
    }

    // Roll for this drop
    if (rng.chance(drop.chance)) {
      const quantity = rng.nextInt(drop.quantity.min, drop.quantity.max);
      results.push({
        materialId: drop.materialId,
        quantity,
      });
    }
  }

  return results;
}
