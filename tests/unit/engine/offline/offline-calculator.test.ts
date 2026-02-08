import { describe, it, expect } from 'vitest';
import { calculateOfflineProgress } from '@engine/offline/offline-calculator';
import { loadBalanceConfig } from '@shared/utils/balance-loader';
import { SeededRandom } from '@shared/utils/rng';

const config = loadBalanceConfig();

describe('calculateOfflineProgress', () => {
  it('should return zero gains for 0 seconds offline', () => {
    const result = calculateOfflineProgress({
      characterLevel: 10,
      currentXP: 0,
      currentZoneLevel: 10,
      offlineSeconds: 0,
      rng: new SeededRandom(42),
      config,
    });
    expect(result.xpGained).toBe(0);
    expect(result.goldGained).toBe(0);
    expect(result.levelsGained).toBe(0);
  });

  it('should gain XP and gold for 1 hour offline', () => {
    const result = calculateOfflineProgress({
      characterLevel: 10,
      currentXP: 0,
      currentZoneLevel: 10,
      offlineSeconds: 3600,
      rng: new SeededRandom(42),
      config,
    });
    expect(result.xpGained).toBeGreaterThan(0);
    expect(result.goldGained).toBeGreaterThan(0);
    expect(result.monstersKilled).toBeGreaterThan(0);
  });

  it('should be deterministic with same seed', () => {
    const params = {
      characterLevel: 20,
      currentXP: 5000,
      currentZoneLevel: 20,
      offlineSeconds: 7200,
      config,
    };
    const r1 = calculateOfflineProgress({ ...params, rng: new SeededRandom(42) });
    const r2 = calculateOfflineProgress({ ...params, rng: new SeededRandom(42) });
    expect(r1.xpGained).toBe(r2.xpGained);
    expect(r1.goldGained).toBe(r2.goldGained);
  });

  it('should not exceed level 60', () => {
    const result = calculateOfflineProgress({
      characterLevel: 59,
      currentXP: 60000,
      currentZoneLevel: 59,
      offlineSeconds: 86400,
      rng: new SeededRandom(42),
      config,
    });
    expect(result.newLevel).toBeLessThanOrEqual(60);
  });
});
