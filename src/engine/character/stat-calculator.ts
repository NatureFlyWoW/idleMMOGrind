import type { IBalanceConfig } from '@shared/types/balance';
import { PrimaryStat } from '@shared/types/enums';

/**
 * XP required to advance from `level` to `level+1`.
 * Formula: floor(linearCoeff * level + powerCoeff * level^powerExponent)
 */
export function xpToNextLevel(level: number, config: IBalanceConfig): number {
  if (level >= 60) return 0;
  const { linearCoeff, powerCoeff, powerExponent } = config.xp;
  return Math.floor(linearCoeff * level + powerCoeff * Math.pow(level, powerExponent));
}

/**
 * Monster HP at a given level.
 * Formula: floor(hpBase + level * hpLinear + level^hpPowerExponent * hpPowerCoeff)
 */
export function calculateMonsterHP(level: number, config: IBalanceConfig): number {
  const { hpBase, hpLinear, hpPowerExponent, hpPowerCoeff } = config.monsters;
  return Math.floor(hpBase + level * hpLinear + Math.pow(level, hpPowerExponent) * hpPowerCoeff);
}

/**
 * Monster damage per hit at a given level.
 * Formula: floor(damageBase + level * damageLinear + level^damagePowerExponent * damagePowerCoeff)
 */
export function calculateMonsterDamage(level: number, config: IBalanceConfig): number {
  const { damageBase, damageLinear, damagePowerExponent, damagePowerCoeff } = config.monsters;
  return Math.floor(damageBase + level * damageLinear + Math.pow(level, damagePowerExponent) * damagePowerCoeff);
}

/**
 * Monster XP reward at a given level.
 * Formula: floor(xpBase + level * xpLinear + level^xpPowerExponent * xpPowerCoeff)
 */
export function calculateMonsterXP(level: number, config: IBalanceConfig): number {
  const { xpBase, xpLinear, xpPowerExponent, xpPowerCoeff } = config.monsters;
  return Math.floor(xpBase + level * xpLinear + Math.pow(level, xpPowerExponent) * xpPowerCoeff);
}

/**
 * Item stat budget at a given iLevel.
 * Formula: floor(iLevel * budgetLinearCoeff + iLevel^budgetPowerExponent * budgetPowerCoeff)
 */
export function calculateStatBudget(iLevel: number, config: IBalanceConfig): number {
  const { budgetLinearCoeff, budgetPowerExponent, budgetPowerCoeff } = config.gear;
  return Math.floor(iLevel * budgetLinearCoeff + Math.pow(iLevel, budgetPowerExponent) * budgetPowerCoeff);
}

/**
 * Weapon minimum damage.
 * Formula: floor((iLevel * levelCoeff + levelBase) * qualityMultiplier * (weaponSpeed / 2.0))
 */
export function calculateWeaponMinDamage(
  iLevel: number,
  qualityMultiplier: number,
  weaponSpeed: number,
  config: IBalanceConfig,
): number {
  const { levelCoeff, levelBase } = config.gear.weaponMinDmgFormula;
  return Math.floor((iLevel * levelCoeff + levelBase) * qualityMultiplier * (weaponSpeed / 2.0));
}

/**
 * Weapon maximum damage.
 * Formula: floor(minDmg * weaponMaxDmgMultiplier)
 */
export function calculateWeaponMaxDamage(
  iLevel: number,
  qualityMultiplier: number,
  weaponSpeed: number,
  config: IBalanceConfig,
): number {
  const minDmg = calculateWeaponMinDamage(iLevel, qualityMultiplier, weaponSpeed, config);
  return Math.floor(minDmg * config.gear.weaponMaxDmgMultiplier);
}

/**
 * Physical armor damage reduction percentage (0 to 1).
 * Formula: armor / (armor + 400 + 85 * attackerLevel)
 */
export function calculateArmorReduction(
  armor: number,
  attackerLevel: number,
  _config: IBalanceConfig,
): number {
  if (armor <= 0) return 0;
  return armor / (armor + 400 + 85 * attackerLevel);
}

/**
 * Spell resistance damage reduction percentage (0 to 1).
 * Formula: resistance / (resistance + 400 + 85 * attackerLevel)
 */
export function calculateResistReduction(
  resistance: number,
  attackerLevel: number,
  _config: IBalanceConfig,
): number {
  if (resistance <= 0) return 0;
  return resistance / (resistance + 400 + 85 * attackerLevel);
}

/** Gear bonus stats for derived calculation */
export interface IGearBonuses {
  attackPower?: number;
  spellPower?: number;
  critRating?: number;
  hasteRating?: number;
  hitRating?: number;
  armor?: number;
  resistance?: number;
  dodgeRating?: number;
  parryRating?: number;
  health?: number;
  mana?: number;
  healthRegen?: number;
  manaRegen?: number;
}

/** Base class values needed for derived stats */
export interface IClassBases {
  baseHP: number;
  baseMana: number;
}

/** Derived stat results */
export interface IDerivedStats {
  attackPower: number;
  spellPower: number;
  criticalStrike: number;
  haste: number;
  armor: number;
  resistance: number;
  hitRating: number;
  dodge: number;
  parry: number;
  maxHealth: number;
  maxMana: number;
  healthRegen: number;
  manaRegen: number;
}

/**
 * Calculate all derived/secondary stats from primary stats, class bases, and gear bonuses.
 */
export function calculateDerivedStats(
  primary: Record<PrimaryStat, number>,
  classBases: IClassBases,
  gear: IGearBonuses,
  config: IBalanceConfig,
): IDerivedStats {
  const str = primary[PrimaryStat.Strength];
  const agi = primary[PrimaryStat.Agility];
  const int = primary[PrimaryStat.Intellect];
  const spi = primary[PrimaryStat.Spirit];
  const sta = primary[PrimaryStat.Stamina];

  const s = config.stats;

  return {
    attackPower: str * s.attackPowerPerStrength + agi * s.attackPowerPerAgility + (gear.attackPower ?? 0),
    spellPower: int * s.spellPowerPerIntellect + (gear.spellPower ?? 0),
    criticalStrike: s.baseCritPercent + (agi / s.agiPerCritPercent) + ((gear.critRating ?? 0) / s.critRatingPerPercent),
    haste: (gear.hasteRating ?? 0) / s.hasteRatingPerPercent,
    armor: (gear.armor ?? 0) + agi * s.armorPerAgility + sta * s.armorPerStamina,
    resistance: (gear.resistance ?? 0) + int * s.resistPerIntellect,
    hitRating: (gear.hitRating ?? 0) / s.hitRatingPerPercent,
    dodge: s.baseDodgePercent + (agi / 60.0) + ((gear.dodgeRating ?? 0) / s.dodgeRatingPerPercent),
    parry: s.baseParryPercent + ((gear.parryRating ?? 0) / s.parryRatingPerPercent),
    maxHealth: sta * s.healthPerStamina + classBases.baseHP + (gear.health ?? 0),
    maxMana: int * s.manaPerIntellect + classBases.baseMana + (gear.mana ?? 0),
    healthRegen: spi * s.healthRegenPerSpirit + (gear.healthRegen ?? 0),
    manaRegen: spi * s.manaRegenPerSpirit + int * s.manaRegenPerIntellect + (gear.manaRegen ?? 0),
  };
}

/**
 * Calculate primary stats at a given level.
 * stat(level) = floor(classBaseStat + racialBonus + growthRate * (level - 1))
 */
export function calculatePrimaryStats(
  classBase: Record<PrimaryStat, number>,
  raceBonus: Record<PrimaryStat, number>,
  growthRates: Record<PrimaryStat, number>,
  level: number,
): Record<PrimaryStat, number> {
  const result = {} as Record<PrimaryStat, number>;
  for (const stat of Object.values(PrimaryStat)) {
    result[stat] = Math.floor(
      classBase[stat] + raceBonus[stat] + growthRates[stat] * (level - 1),
    );
  }
  return result;
}

/**
 * XP level-difference modifier.
 * Returns multiplier based on how monster level compares to player level.
 */
export function getLevelDiffXpModifier(
  playerLevel: number,
  monsterLevel: number,
  config: IBalanceConfig,
): number {
  const diff = monsterLevel - playerLevel;
  const t = config.xp.levelDiffThresholds;
  const m = config.xp.levelDiffMods;

  if (diff >= t.tooHighAbove) return m.tooHigh;
  if (diff >= t.bonusAbove) return m.above3;
  if (diff >= t.normalAbove) return m.normal;
  if (diff >= t.reducedAbove) return m.below5;
  if (diff >= t.greatlyReducedAbove) return m.below8;
  return m.gray;
}
