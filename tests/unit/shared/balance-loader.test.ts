import { describe, it, expect } from 'vitest';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

describe('loadBalanceConfig', () => {
  it('should load and return balance config from data/balance.json', () => {
    const config = loadBalanceConfig();
    expect(config).toBeDefined();
    expect(config.xp.linearCoeff).toBe(100);
    expect(config.xp.powerExponent).toBe(1.65);
    expect(config.combat.baseTickIntervalMs).toBe(250);
    expect(config.stats.healthPerStamina).toBe(10);
    expect(config.monsters.hpBase).toBe(40);
    expect(config.gear.budgetLinearCoeff).toBe(1.5);
    expect(config.offline.maxOfflineSeconds).toBe(86400);
    expect(config.talents.totalPoints).toBe(51);
  });

  it('should have correct quality multipliers', () => {
    const config = loadBalanceConfig();
    expect(config.gear.qualityStatMultiplier.common).toBe(1.0);
    expect(config.gear.qualityStatMultiplier.uncommon).toBe(1.3);
    expect(config.gear.qualityStatMultiplier.rare).toBe(1.7);
    expect(config.gear.qualityStatMultiplier.epic).toBe(2.2);
    expect(config.gear.qualityStatMultiplier.legendary).toBe(3.0);
  });

  it('should have 5 tier requirements for talents', () => {
    const config = loadBalanceConfig();
    expect(config.talents.tierRequirements).toHaveLength(5);
    expect(config.talents.tierRequirements).toEqual([0, 5, 10, 15, 20]);
  });
});
