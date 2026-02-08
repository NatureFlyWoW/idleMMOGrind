import { describe, it, expect } from 'vitest';
import {
  calculatePrimaryStats,
  calculateDerivedStats,
  calculateArmorReduction,
  calculateResistReduction,
  xpToNextLevel,
  calculateMonsterHP,
  calculateMonsterDamage,
  calculateMonsterXP,
  calculateStatBudget,
  calculateWeaponMinDamage,
  calculateWeaponMaxDamage,
} from '@engine/character/stat-calculator';
import { PrimaryStat, ItemQuality } from '@shared/types/enums';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('xpToNextLevel', () => {
  it('should calculate level 1 XP correctly: floor(100*1 + 50*1^1.65) = 150', () => {
    expect(xpToNextLevel(1, config)).toBe(150);
  });

  it('should calculate level 10 XP correctly', () => {
    // floor(100*10 + 50*10^1.65) = floor(1000 + 50*44.668) = floor(1000 + 2233.4) = 3233
    const result = xpToNextLevel(10, config);
    expect(result).toBeGreaterThan(3200);
    expect(result).toBeLessThan(3300);
  });

  it('should calculate level 30 XP correctly', () => {
    // floor(100*30 + 50*30^1.65) = floor(3000 + 50*273.68) = 16684
    const result = xpToNextLevel(30, config);
    expect(result).toBe(16684);
  });

  it('should return 0 for level 60 (max level)', () => {
    expect(xpToNextLevel(60, config)).toBe(0);
  });
});

describe('calculateMonsterHP', () => {
  it('should calculate level 1 monster HP: 40 + 12 + 3*1 = 55', () => {
    const hp = calculateMonsterHP(1, config);
    expect(hp).toBe(55);
  });

  it('should calculate level 30 monster HP: floor(40 + 30*12 + 30^1.4*3) = 750', () => {
    const hp = calculateMonsterHP(30, config);
    expect(hp).toBe(750);
  });
});

describe('calculateMonsterDamage', () => {
  it('should calculate level 1 monster damage', () => {
    const dmg = calculateMonsterDamage(1, config);
    expect(dmg).toBeGreaterThan(7);
    expect(dmg).toBeLessThan(10);
  });
});

describe('calculateMonsterXP', () => {
  it('should calculate level 1 monster XP: 40 + 15 + 2*1 = 57', () => {
    const xp = calculateMonsterXP(1, config);
    expect(xp).toBe(57);
  });

  it('should calculate level 30 monster XP around 935', () => {
    const xp = calculateMonsterXP(30, config);
    expect(xp).toBeGreaterThan(900);
    expect(xp).toBeLessThan(970);
  });
});

describe('calculateStatBudget', () => {
  it('should calculate iLevel 1 budget: floor(1*1.5 + 1^1.2*0.3) = floor(1.8) = 1', () => {
    const budget = calculateStatBudget(1, config);
    expect(budget).toBeGreaterThanOrEqual(1);
    expect(budget).toBeLessThanOrEqual(2);
  });

  it('should calculate iLevel 30 budget around 67', () => {
    const budget = calculateStatBudget(30, config);
    expect(budget).toBeGreaterThan(60);
    expect(budget).toBeLessThan(75);
  });

  it('should calculate iLevel 60 budget: floor(60*1.5 + 60^1.2*0.3) = 130', () => {
    const budget = calculateStatBudget(60, config);
    expect(budget).toBe(130);
  });
});

describe('calculateArmorReduction', () => {
  it('should calculate armor reduction correctly', () => {
    // 3000 / (3000 + 400 + 85*60) = 3000 / 8500 = 0.353
    const reduction = calculateArmorReduction(3000, 60, config);
    expect(reduction).toBeCloseTo(0.353, 2);
  });

  it('should return 0 for 0 armor', () => {
    expect(calculateArmorReduction(0, 60, config)).toBe(0);
  });
});

describe('calculateDerivedStats', () => {
  it('should calculate attack power from strength and agility', () => {
    const primary: Record<PrimaryStat, number> = {
      [PrimaryStat.Strength]: 100,
      [PrimaryStat.Agility]: 50,
      [PrimaryStat.Intellect]: 10,
      [PrimaryStat.Spirit]: 10,
      [PrimaryStat.Stamina]: 80,
    };
    const derived = calculateDerivedStats(primary, { baseHP: 120, baseMana: 200 }, {}, config);
    // AP = STR*2 + AGI*1 = 200 + 50 = 250
    expect(derived.attackPower).toBe(250);
  });

  it('should calculate max health from stamina', () => {
    const primary: Record<PrimaryStat, number> = {
      [PrimaryStat.Strength]: 10,
      [PrimaryStat.Agility]: 10,
      [PrimaryStat.Intellect]: 10,
      [PrimaryStat.Spirit]: 10,
      [PrimaryStat.Stamina]: 100,
    };
    const derived = calculateDerivedStats(primary, { baseHP: 120, baseMana: 200 }, {}, config);
    // HP = STA*10 + baseHP = 1000 + 120 = 1120
    expect(derived.maxHealth).toBe(1120);
  });

  it('should calculate crit chance from agility', () => {
    const primary: Record<PrimaryStat, number> = {
      [PrimaryStat.Strength]: 10,
      [PrimaryStat.Agility]: 104,
      [PrimaryStat.Intellect]: 10,
      [PrimaryStat.Spirit]: 10,
      [PrimaryStat.Stamina]: 10,
    };
    const derived = calculateDerivedStats(primary, { baseHP: 100, baseMana: 200 }, {}, config);
    // crit = 5.0 + (104/52) + 0 = 5.0 + 2.0 = 7.0%
    expect(derived.criticalStrike).toBeCloseTo(7.0, 1);
  });
});
