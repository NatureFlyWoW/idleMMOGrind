import { describe, it, expect } from 'vitest';
import { xpToNextLevel, calculateMonsterXP } from '@engine/character/stat-calculator';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('Leveling Pacing Simulation', () => {
  it('should reach level 60 within a reasonable active play time', () => {
    let totalSeconds = 0;
    const TICKS_PER_SECOND = 4;
    const TICKS_PER_KILL = 4;
    const QUEST_XP_MULTIPLIER = 1.7;

    for (let level = 1; level < 60; level++) {
      const xpNeeded = xpToNextLevel(level, config);
      const monsterXP = calculateMonsterXP(level, config);
      const effectiveXPPerKill = monsterXP * QUEST_XP_MULTIPLIER;
      const killsNeeded = Math.ceil(xpNeeded / effectiveXPPerKill);
      const ticksNeeded = killsNeeded * TICKS_PER_KILL;
      const secondsNeeded = ticksNeeded / TICKS_PER_SECOND;
      totalSeconds += secondsNeeded;
    }

    const totalHours = totalSeconds / 3600;

    // Current balance: ~10 minutes active play (idle game — fast progression by design)
    // Sanity check: should be non-trivial but not excessively long
    expect(totalHours).toBeGreaterThan(0.05); // at least 3 minutes
    expect(totalHours).toBeLessThan(5); // under 5 hours active
  });

  it('should have XP curve where early levels feel fast', () => {
    let earlyXP = 0;
    for (let level = 1; level <= 10; level++) {
      earlyXP += xpToNextLevel(level, config);
    }

    const avgMonsterXP = calculateMonsterXP(5, config);
    const killsNeeded = Math.ceil(earlyXP / (avgMonsterXP * 1.7));
    const ticksNeeded = killsNeeded * 4;
    const minutes = ticksNeeded / 4 / 60;

    expect(minutes).toBeLessThan(90);
  });

  it('should have XP curve where late levels take longer than early levels', () => {
    // Late levels (50-60) should take more time per level than early levels (1-10)
    let lateSeconds = 0;
    for (let level = 50; level < 60; level++) {
      const xpNeeded = xpToNextLevel(level, config);
      const mxp = calculateMonsterXP(level, config) * 1.7;
      const kills = Math.ceil(xpNeeded / mxp);
      lateSeconds += kills; // 1 kill/sec
    }

    let earlySeconds = 0;
    for (let level = 1; level <= 10; level++) {
      const xpNeeded = xpToNextLevel(level, config);
      const mxp = calculateMonsterXP(level, config) * 1.7;
      const kills = Math.ceil(xpNeeded / mxp);
      earlySeconds += kills;
    }

    expect(lateSeconds).toBeGreaterThan(earlySeconds);
  });
});
