import { DamageType } from '@shared/types/enums';
import type { IDamageResult } from '@shared/types/combat';
import type { SeededRandom } from '@shared/utils/rng';

// ---------------------------------------------------------------------------
// Parameter interfaces
// ---------------------------------------------------------------------------

export interface IPhysicalDamageParams {
  weaponDamageMin: number;
  weaponDamageMax: number;
  attackPower: number;
  weaponSpeed: number;
  abilityCoefficient: number;
  abilityFlatBonus: number;
  critChance: number;
  critMultiplier: number;
  armorReduction: number;
  hitChance: number;
  rng: SeededRandom;
}

export interface ISpellDamageParams {
  baseDamage: number;
  spellPower: number;
  spellCoefficient: number;
  critChance: number;
  critMultiplier: number;
  resistReduction: number;
  hitChance: number;
  rng: SeededRandom;
}

export interface IHealingParams {
  baseHeal: number;
  spellPower: number;
  healCoefficient: number;
  critChance: number;
  critMultiplier: number;
  rng: SeededRandom;
}

// ---------------------------------------------------------------------------
// Physical damage
// ---------------------------------------------------------------------------

/**
 * Calculate physical damage for a single hit.
 *
 * Formula:
 *   weaponDmg    = rng in [weaponDamageMin, weaponDamageMax]
 *   baseDamage   = weaponDmg + (attackPower / 14) * weaponSpeed
 *   abilityDmg   = baseDamage * abilityCoefficient + abilityFlatBonus
 *   if crit:       abilityDmg *= (1 + critMultiplier)
 *   after armor:   abilityDmg *= (1 - armorReduction)
 *   floor, min 1 on hit; 0 on miss
 */
export function calculatePhysicalDamage(params: IPhysicalDamageParams): IDamageResult {
  const {
    weaponDamageMin,
    weaponDamageMax,
    attackPower,
    weaponSpeed,
    abilityCoefficient,
    abilityFlatBonus,
    critChance,
    critMultiplier,
    armorReduction,
    hitChance,
    rng,
  } = params;

  // Hit check -- consume an RNG value regardless of outcome for determinism
  const isHit = rng.chance(hitChance);
  if (!isHit) {
    return { amount: 0, type: DamageType.Physical, isCrit: false };
  }

  // Roll weapon damage
  const weaponDmg = rng.nextInt(weaponDamageMin, weaponDamageMax);

  // Base damage with attack power normalization
  const baseDamage = weaponDmg + (attackPower / 14) * weaponSpeed;

  // Apply ability coefficient and flat bonus
  let damage = baseDamage * abilityCoefficient + abilityFlatBonus;

  // Crit check
  const isCrit = rng.chance(critChance);
  if (isCrit) {
    damage *= 1 + critMultiplier;
  }

  // Armor reduction
  damage *= 1 - clamp01(armorReduction);

  // Floor and enforce minimum 1 on a landed hit
  damage = Math.max(1, Math.floor(damage));

  return { amount: damage, type: DamageType.Physical, isCrit };
}

// ---------------------------------------------------------------------------
// Spell damage
// ---------------------------------------------------------------------------

/**
 * Calculate spell damage for a single hit.
 *
 * Formula:
 *   damage       = baseDamage + (spellPower * spellCoefficient)
 *   if crit:       damage *= (1 + critMultiplier)
 *   after resist:  damage *= (1 - resistReduction)
 *   floor, min 1 on hit; 0 on miss
 */
export function calculateSpellDamage(params: ISpellDamageParams): IDamageResult {
  const {
    baseDamage,
    spellPower,
    spellCoefficient,
    critChance,
    critMultiplier,
    resistReduction,
    hitChance,
    rng,
  } = params;

  // Hit check
  const isHit = rng.chance(hitChance);
  if (!isHit) {
    return { amount: 0, type: DamageType.Spell, isCrit: false };
  }

  // Base spell damage
  let damage = baseDamage + spellPower * spellCoefficient;

  // Crit check
  const isCrit = rng.chance(critChance);
  if (isCrit) {
    damage *= 1 + critMultiplier;
  }

  // Resist reduction
  damage *= 1 - clamp01(resistReduction);

  // Floor and enforce minimum 1 on a landed hit
  damage = Math.max(1, Math.floor(damage));

  return { amount: damage, type: DamageType.Spell, isCrit };
}

// ---------------------------------------------------------------------------
// Healing
// ---------------------------------------------------------------------------

/**
 * Calculate healing for a single heal event.
 *
 * Formula:
 *   heal = baseHeal + (spellPower * healCoefficient)
 *   if crit: heal *= (1 + critMultiplier)
 *   No miss check. Min 1 healing.
 */
export function calculateHealing(params: IHealingParams): IDamageResult {
  const {
    baseHeal,
    spellPower,
    healCoefficient,
    critChance,
    critMultiplier,
    rng,
  } = params;

  // Base heal value
  let heal = baseHeal + spellPower * healCoefficient;

  // Crit check
  const isCrit = rng.chance(critChance);
  if (isCrit) {
    heal *= 1 + critMultiplier;
  }

  // Floor and enforce minimum 1
  heal = Math.max(1, Math.floor(heal));

  return { amount: heal, type: DamageType.Healing, isCrit };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Clamp a value to [0, 1] for reduction percentages */
function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
