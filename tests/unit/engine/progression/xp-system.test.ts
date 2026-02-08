import { describe, it, expect } from 'vitest';
import { awardXP, canGainXPFromMonster } from '@engine/progression/xp-system';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('canGainXPFromMonster', () => {
  it('should return false if monster is 5+ levels above player', () => {
    expect(canGainXPFromMonster(10, 15, config)).toBe(false);
  });

  it('should return true for same-level monster', () => {
    expect(canGainXPFromMonster(10, 10, config)).toBe(true);
  });

  it('should return false for gray monsters (8+ levels below)', () => {
    expect(canGainXPFromMonster(20, 11, config)).toBe(false);
  });

  it('should return true for monsters slightly below', () => {
    expect(canGainXPFromMonster(20, 18, config)).toBe(true);
  });
});

describe('awardXP', () => {
  it('should level up when XP exceeds threshold', () => {
    const result = awardXP({
      currentLevel: 1,
      currentXP: 100,
      xpGained: 100,
      config,
    });
    // XP to level 2 = 150. With 100 current + 100 gained = 200, should level to 2 with 50 remainder
    expect(result.newLevel).toBe(2);
    expect(result.remainingXP).toBe(50);
    expect(result.levelsGained).toBe(1);
  });

  it('should handle multiple level-ups from large XP gains', () => {
    const result = awardXP({
      currentLevel: 1,
      currentXP: 0,
      xpGained: 50000,
      config,
    });
    expect(result.newLevel).toBeGreaterThan(5);
    expect(result.levelsGained).toBeGreaterThan(4);
  });

  it('should not exceed level 60', () => {
    const result = awardXP({
      currentLevel: 59,
      currentXP: 60000,
      xpGained: 100000,
      config,
    });
    expect(result.newLevel).toBe(60);
  });

  it('should not gain XP at level 60', () => {
    const result = awardXP({
      currentLevel: 60,
      currentXP: 0,
      xpGained: 1000,
      config,
    });
    expect(result.newLevel).toBe(60);
    expect(result.levelsGained).toBe(0);
    expect(result.remainingXP).toBe(0);
  });
});
