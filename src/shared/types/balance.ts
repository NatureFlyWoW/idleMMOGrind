import { ItemQuality } from './enums';

export interface IBalanceConfig {
  xp: {
    /** Coefficients for xpToNextLevel = floor(a * level + b * level^c) */
    linearCoeff: number;
    powerCoeff: number;
    powerExponent: number;
    /** Level difference XP modifiers */
    levelDiffMods: {
      tooHigh: number;
      above3: number;
      normal: number;
      below5: number;
      below8: number;
      gray: number;
    };
    /** Thresholds for level diff categories (relative to player level) */
    levelDiffThresholds: {
      tooHighAbove: number;
      bonusAbove: number;
      normalAbove: number;
      reducedAbove: number;
      greatlyReducedAbove: number;
    };
  };

  combat: {
    baseTickIntervalMs: number;
    uiUpdateIntervalMs: number;
    baseCritMultiplier: number;
    baseMissChancePhysical: number;
    baseMissChanceSpell: number;
    baseMonsterDodge: number;
    deathGoldPenalty: number;
    deathDurabilityLoss: number;
    deathRespawnDelayMs: number;
    energyPerTick: number;
    energyCap: number;
    ragePerHitDealt: number;
    ragePerHitTaken: number;
    rageCap: number;
    rageDecayPerTick: number;
  };

  stats: {
    healthPerStamina: number;
    manaPerIntellect: number;
    attackPowerPerStrength: number;
    attackPowerPerAgility: number;
    spellPowerPerIntellect: number;
    agiPerCritPercent: number;
    critRatingPerPercent: number;
    hasteRatingPerPercent: number;
    hitRatingPerPercent: number;
    dodgeRatingPerPercent: number;
    parryRatingPerPercent: number;
    armorPerAgility: number;
    armorPerStamina: number;
    resistPerIntellect: number;
    baseDodgePercent: number;
    baseParryPercent: number;
    baseCritPercent: number;
    healthRegenPerSpirit: number;
    manaRegenPerSpirit: number;
    manaRegenPerIntellect: number;
    outOfCombatHealthRegenMult: number;
    outOfCombatManaRegenMult: number;
  };

  monsters: {
    /** HP = a + (level * b) + (level^c * d) */
    hpBase: number;
    hpLinear: number;
    hpPowerExponent: number;
    hpPowerCoeff: number;
    damageBase: number;
    damageLinear: number;
    damagePowerExponent: number;
    damagePowerCoeff: number;
    armorBase: number;
    armorLinear: number;
    resistBase: number;
    resistLinear: number;
    xpBase: number;
    xpLinear: number;
    xpPowerExponent: number;
    xpPowerCoeff: number;
    goldMinBase: number;
    goldMinLinear: number;
    goldMaxBase: number;
    goldMaxLinear: number;
  };

  gear: {
    /** statBudget = floor(iLevel * a + iLevel^b * c) */
    budgetLinearCoeff: number;
    budgetPowerExponent: number;
    budgetPowerCoeff: number;
    qualityStatMultiplier: Record<ItemQuality, number>;
    primaryStatSplit: number;
    secondaryStatSplit: number;
    dropChanceBase: number;
    qualityWeights: Record<ItemQuality, number>;
    epicMinLevel: number;
    weaponMinDmgFormula: {
      levelCoeff: number;
      levelBase: number;
    };
    weaponMaxDmgMultiplier: number;
    weaponSpeeds: Record<string, number>;
  };

  offline: {
    maxOfflineSeconds: number;
    tier1Hours: number;
    tier1Efficiency: number;
    tier2Hours: number;
    tier2Efficiency: number;
    tier3Efficiency: number;
    catchUpMinMultiplier: number;
    catchUpMaxMultiplier: number;
    catchUpScaleHours: number;
    maxDropQualityOffline: ItemQuality;
    questBonusMultiplier: number;
  };

  quests: {
    killsPerQuestMin: number;
    killsPerQuestMax: number;
    xpMultiplier: number;
    gearRewardChance: number;
  };

  talents: {
    firstTalentLevel: number;
    lastTalentLevel: number;
    totalPoints: number;
    tierRequirements: number[];
    respecBaseCost: number;
    respecCostPerLevel: number;
    respecCountMultiplier: number;
  };
}
