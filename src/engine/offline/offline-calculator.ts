import type { IBalanceConfig } from '@shared/types/balance';
import type { SeededRandom } from '@shared/utils/rng';
import { applyDiminishingReturns } from './diminishing-returns';
import {
  calculateMonsterXP,
} from '@engine/character/stat-calculator';
import { awardXP } from '@engine/progression/xp-system';

export interface IOfflineCalcParams {
  characterLevel: number;
  currentXP: number;
  currentZoneLevel: number;
  offlineSeconds: number;
  rng: SeededRandom;
  config: IBalanceConfig;
}

export interface IOfflineResult {
  xpGained: number;
  goldGained: number;
  levelsGained: number;
  monstersKilled: number;
  questsCompleted: number;
  newLevel: number;
  newXP: number;
  simulatedSeconds: number;
  rawOfflineSeconds: number;
  catchUpMultiplier: number;
}

/**
 * Calculate offline progress using statistical estimation.
 * Does NOT simulate every tick -- estimates kills/hour based on character level vs zone.
 */
export function calculateOfflineProgress(params: IOfflineCalcParams): IOfflineResult {
  const { characterLevel, currentXP, currentZoneLevel, offlineSeconds, rng, config } = params;

  if (offlineSeconds <= 0) {
    return {
      xpGained: 0, goldGained: 0, levelsGained: 0,
      monstersKilled: 0, questsCompleted: 0,
      newLevel: characterLevel, newXP: currentXP,
      simulatedSeconds: 0, rawOfflineSeconds: 0,
      catchUpMultiplier: 1,
    };
  }

  // Step 1: Diminishing returns
  const dr = applyDiminishingReturns(offlineSeconds, config);
  const effectiveSeconds = dr.simulatedSeconds;

  // Step 2: Estimate kills
  // Assume ~4 ticks/sec, 3-5 ticks per kill -> ~1 kill per 1-1.25 seconds of game time
  // But combat tick = 250ms, monster dies in 3-5 ticks = 750ms-1250ms
  const avgTicksPerKill = 4;
  const tickIntervalSec = config.combat.baseTickIntervalMs / 1000;
  const killsPerSecond = 1 / (avgTicksPerKill * tickIntervalSec);
  const totalKills = Math.floor(effectiveSeconds * killsPerSecond);

  // Step 3: Calculate XP
  const monsterXP = calculateMonsterXP(currentZoneLevel, config);
  const questMultiplier = config.offline.questBonusMultiplier;
  const totalXP = Math.floor(totalKills * monsterXP * questMultiplier);

  // Step 4: Calculate gold
  const goldMin = Math.floor(config.monsters.goldMinBase + currentZoneLevel * config.monsters.goldMinLinear);
  const goldMax = Math.floor(config.monsters.goldMaxBase + currentZoneLevel * config.monsters.goldMaxLinear);
  const avgGold = (goldMin + goldMax) / 2;
  const totalGold = Math.floor(totalKills * avgGold * 1.3); // 1.3 for quest gold bonus

  // Step 5: Calculate quest completions
  const avgKillsPerQuest = (config.quests.killsPerQuestMin + config.quests.killsPerQuestMax) / 2;
  const questsCompleted = Math.floor(totalKills / avgKillsPerQuest);

  // Step 6: Leveling
  const xpResult = awardXP({
    currentLevel: characterLevel,
    currentXP,
    xpGained: totalXP,
    config,
  });

  // Step 7: Catch-up multiplier
  const offlineHours = offlineSeconds / 3600;
  const catchUpMultiplier = Math.min(
    config.offline.catchUpMaxMultiplier,
    config.offline.catchUpMinMultiplier + (offlineHours / config.offline.catchUpScaleHours) *
      (config.offline.catchUpMaxMultiplier - config.offline.catchUpMinMultiplier),
  );

  return {
    xpGained: totalXP,
    goldGained: totalGold,
    levelsGained: xpResult.levelsGained,
    monstersKilled: totalKills,
    questsCompleted,
    newLevel: xpResult.newLevel,
    newXP: xpResult.remainingXP,
    simulatedSeconds: effectiveSeconds,
    rawOfflineSeconds: offlineSeconds,
    catchUpMultiplier: Math.round(catchUpMultiplier * 10) / 10,
  };
}
