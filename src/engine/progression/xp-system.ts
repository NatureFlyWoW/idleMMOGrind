import type { IBalanceConfig } from '@shared/types/balance';
import { xpToNextLevel, getLevelDiffXpModifier } from '@engine/character/stat-calculator';

const MAX_LEVEL = 60;

export function canGainXPFromMonster(
  playerLevel: number,
  monsterLevel: number,
  config: IBalanceConfig,
): boolean {
  const modifier = getLevelDiffXpModifier(playerLevel, monsterLevel, config);
  return modifier > 0;
}

export function getXPFromMonsterKill(
  playerLevel: number,
  monsterLevel: number,
  baseMonsterXP: number,
  config: IBalanceConfig,
): number {
  const modifier = getLevelDiffXpModifier(playerLevel, monsterLevel, config);
  return Math.floor(baseMonsterXP * modifier);
}

export interface IAwardXPParams {
  currentLevel: number;
  currentXP: number;
  xpGained: number;
  config: IBalanceConfig;
}

export interface IAwardXPResult {
  newLevel: number;
  remainingXP: number;
  levelsGained: number;
  totalXPAbsorbed: number;
}

/**
 * Award XP and handle level-ups. Returns new level and remaining XP.
 */
export function awardXP(params: IAwardXPParams): IAwardXPResult {
  let { currentLevel, currentXP } = params;
  const { xpGained, config } = params;
  const startLevel = currentLevel;

  if (currentLevel >= MAX_LEVEL) {
    return { newLevel: MAX_LEVEL, remainingXP: 0, levelsGained: 0, totalXPAbsorbed: 0 };
  }

  let xpPool = currentXP + xpGained;
  const totalAbsorbed = xpGained;

  while (currentLevel < MAX_LEVEL) {
    const needed = xpToNextLevel(currentLevel, config);
    if (needed <= 0) break;
    if (xpPool < needed) break;

    xpPool -= needed;
    currentLevel++;
  }

  // Clamp at max level
  if (currentLevel >= MAX_LEVEL) {
    xpPool = 0;
  }

  return {
    newLevel: currentLevel,
    remainingXP: xpPool,
    levelsGained: currentLevel - startLevel,
    totalXPAbsorbed: totalAbsorbed,
  };
}
