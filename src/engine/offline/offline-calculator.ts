import type { IBalanceConfig } from '@shared/types/balance';
import type { SeededRandom } from '@shared/utils/rng';
import { applyDiminishingReturns } from './diminishing-returns';
import {
  calculateMonsterXP,
} from '@engine/character/stat-calculator';
import { awardXP } from '@engine/progression/xp-system';
import type { IZoneEvent } from '@shared/types/zone-expansion';

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

// ---------------------------------------------------------------------------
// Zone-aware offline estimation helpers (pure functions)
// ---------------------------------------------------------------------------

/**
 * Estimate quest chain completions during an offline period.
 *
 * Uses the kill rate (kills per second) and average kills per quest to
 * estimate how many quests in a chain can be completed. Quest chains
 * are sequential, so each completed quest advances the chain.
 *
 * @param offlineSeconds    - Effective offline seconds (after diminishing returns).
 * @param killsPerSecond    - Estimated kill rate.
 * @param avgKillsPerQuest  - Average kills required per quest objective.
 * @param questsInChain     - Number of quests in the chain (default 5).
 * @returns Number of quests estimated to complete.
 */
export function estimateQuestChainProgress(
  offlineSeconds: number,
  killsPerSecond: number,
  avgKillsPerQuest: number,
  questsInChain: number = 5,
): number {
  if (offlineSeconds <= 0 || killsPerSecond <= 0 || avgKillsPerQuest <= 0) {
    return 0;
  }

  const totalKills = offlineSeconds * killsPerSecond;
  const questsFromKills = Math.floor(totalKills / avgKillsPerQuest);

  // Cannot complete more quests than exist in the chain
  return Math.min(questsFromKills, questsInChain);
}

/**
 * Calculate the average XP multiplier from zone events over a long
 * offline period.
 *
 * For each event, computes its statistical uptime fraction:
 *   uptime = duration / (duration + cooldown)
 *
 * The average multiplier accounts for the probability the event is
 * active at any given moment, weighted by the base trigger chance:
 *   avgXpMult = 1.0 + sum((eventXpMult - 1.0) * uptime * baseChance) for all zone events
 *
 * For long offline periods (hours), this converges to the expected value.
 *
 * @param zoneEvents     - Array of event definitions for the zone.
 * @param eventBaseChance - Probability of an event triggering per check interval.
 * @returns Average XP multiplier (>= 1.0).
 */
export function estimateZoneEventXpMultiplier(
  zoneEvents: ReadonlyArray<IZoneEvent>,
  eventBaseChance: number,
): number {
  if (zoneEvents.length === 0 || eventBaseChance <= 0) {
    return 1.0;
  }

  let totalBonus = 0;

  for (const event of zoneEvents) {
    const xpMult = event.effects.xpMultiplier;
    if (xpMult === undefined || xpMult <= 1.0) {
      continue;
    }

    // Uptime fraction: how much of the cycle the event is active
    const cycleDuration = event.durationMs + event.cooldownMs;
    if (cycleDuration <= 0) {
      continue;
    }

    const uptimeFraction = event.durationMs / cycleDuration;

    // Weight by trigger chance -- on average, the event fires with this probability
    totalBonus += (xpMult - 1.0) * uptimeFraction * eventBaseChance;
  }

  return 1.0 + totalBonus;
}

/**
 * Calculate the probability of encountering at least one rare spawn
 * during an offline period.
 *
 * Uses the complement probability approach:
 *   P(at least one) = 1 - (1 - spawnChance) ^ numberOfKills
 *
 * @param rareSpawnChance - Per-kill probability of spawning a rare.
 * @param totalKills      - Total monster kills during the offline period.
 * @returns Probability between 0 and 1.
 */
export function estimateRareSpawnProbability(
  rareSpawnChance: number,
  totalKills: number,
): number {
  if (rareSpawnChance <= 0 || totalKills <= 0) {
    return 0;
  }
  if (rareSpawnChance >= 1) {
    return 1;
  }

  return 1 - Math.pow(1 - rareSpawnChance, totalKills);
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
