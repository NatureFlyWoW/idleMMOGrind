import { describe, it, expect } from 'vitest';
import {
  calculatePhysicalDamage,
  calculateSpellDamage,
  calculateHealing,
} from '@engine/combat/formulas';
import { SeededRandom } from '@shared/utils/rng';
import { DamageType } from '@shared/types/enums';

// ---------------------------------------------------------------------------
// Physical damage
// ---------------------------------------------------------------------------

describe('calculatePhysicalDamage', () => {
  it('should deal damage when hit lands', () => {
    const rng = new SeededRandom(42);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 50,
      weaponDamageMax: 100,
      attackPower: 200,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0.2,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThan(0);
    expect(result.type).toBe(DamageType.Physical);
  });

  it('should return miss when hit check fails', () => {
    const rng = new SeededRandom(42);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 50,
      weaponDamageMax: 100,
      attackPower: 200,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 0,
      rng,
    });
    expect(result.amount).toBe(0);
    expect(result.type).toBe(DamageType.Physical);
    expect(result.isCrit).toBe(false);
  });

  it('should apply armor reduction', () => {
    const rng = new SeededRandom(99);
    const noArmor = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 100,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 1.0,
      rng,
    });
    const rng2 = new SeededRandom(99);
    const withArmor = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 100,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0.3,
      hitChance: 1.0,
      rng: rng2,
    });
    expect(withArmor.amount).toBeLessThan(noArmor.amount);
  });

  it('should never deal less than 1 damage on a hit', () => {
    const rng = new SeededRandom(1);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 1,
      weaponDamageMax: 1,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0.99,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThanOrEqual(1);
  });

  it('should apply crit multiplier when crit lands', () => {
    // Use guaranteed crit (critChance = 1.0) vs guaranteed no-crit (critChance = 0)
    const rng1 = new SeededRandom(50);
    const noCrit = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 1.0,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(50);
    const withCrit = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 1.0,
      critMultiplier: 1.0,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng2,
    });

    expect(withCrit.isCrit).toBe(true);
    expect(noCrit.isCrit).toBe(false);
    // With critMultiplier=1.0, crit should do 2x the non-crit damage
    expect(withCrit.amount).toBe(noCrit.amount * 2);
  });

  it('should include ability flat bonus in damage', () => {
    const rng1 = new SeededRandom(77);
    const noBonus = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(77);
    const withBonus = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 50,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng2,
    });
    expect(withBonus.amount).toBe(noBonus.amount + 50);
  });

  it('should apply ability coefficient to scale damage', () => {
    const rng1 = new SeededRandom(88);
    const coeff1 = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(88);
    const coeff2 = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 2.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng2,
    });
    expect(coeff2.amount).toBe(coeff1.amount * 2);
  });

  it('should include attack power normalized by weapon speed', () => {
    const rng1 = new SeededRandom(55);
    const noAP = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 0,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(55);
    const withAP = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 140,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 1.0,
      rng: rng2,
    });
    // AP contribution = (140 / 14) * 2.0 = 20
    expect(withAP.amount).toBe(noAP.amount + 20);
  });

  it('should clamp armor reduction to [0, 1]', () => {
    // armorReduction > 1 should be treated as 1 (100%), yielding min damage of 1
    const rng = new SeededRandom(11);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 100,
      weaponDamageMax: 100,
      attackPower: 200,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 1.5,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBe(1);
  });

  it('should be deterministic with the same seed', () => {
    const makeParams = (rng: SeededRandom) => ({
      weaponDamageMin: 40,
      weaponDamageMax: 120,
      attackPower: 180,
      weaponSpeed: 2.5,
      abilityCoefficient: 1.2,
      abilityFlatBonus: 10,
      critChance: 0.3,
      critMultiplier: 0.5,
      armorReduction: 0.15,
      hitChance: 0.95,
      rng,
    });
    const result1 = calculatePhysicalDamage(makeParams(new SeededRandom(123)));
    const result2 = calculatePhysicalDamage(makeParams(new SeededRandom(123)));
    expect(result1.amount).toBe(result2.amount);
    expect(result1.isCrit).toBe(result2.isCrit);
  });
});

// ---------------------------------------------------------------------------
// Spell damage
// ---------------------------------------------------------------------------

describe('calculateSpellDamage', () => {
  it('should deal spell damage when hit lands', () => {
    const rng = new SeededRandom(42);
    const result = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 150,
      spellCoefficient: 0.8,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0.1,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThan(0);
    expect(result.type).toBe(DamageType.Spell);
  });

  it('should return miss when hit check fails', () => {
    const rng = new SeededRandom(42);
    const result = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 150,
      spellCoefficient: 0.8,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0,
      hitChance: 0,
      rng,
    });
    expect(result.amount).toBe(0);
    expect(result.type).toBe(DamageType.Spell);
    expect(result.isCrit).toBe(false);
  });

  it('should apply spell power with coefficient', () => {
    const rng1 = new SeededRandom(10);
    const noSP = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 0,
      spellCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0,
      hitChance: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(10);
    const withSP = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 200,
      spellCoefficient: 0.5,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0,
      hitChance: 1.0,
      rng: rng2,
    });
    // Difference should be spellPower * coefficient = 200 * 0.5 = 100
    expect(withSP.amount).toBe(noSP.amount + 100);
  });

  it('should apply resist reduction', () => {
    const rng1 = new SeededRandom(20);
    const noResist = calculateSpellDamage({
      baseDamage: 200,
      spellPower: 100,
      spellCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0,
      hitChance: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(20);
    const withResist = calculateSpellDamage({
      baseDamage: 200,
      spellPower: 100,
      spellCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0.25,
      hitChance: 1.0,
      rng: rng2,
    });
    expect(withResist.amount).toBeLessThan(noResist.amount);
    // 300 * (1 - 0.25) = 225; 300 * 1.0 = 300
    expect(noResist.amount).toBe(300);
    expect(withResist.amount).toBe(225);
  });

  it('should apply crit multiplier when crit lands', () => {
    const rng1 = new SeededRandom(30);
    const noCrit = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 0,
      spellCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 1.0,
      resistReduction: 0,
      hitChance: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(30);
    const withCrit = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 0,
      spellCoefficient: 1.0,
      critChance: 1.0,
      critMultiplier: 1.0,
      resistReduction: 0,
      hitChance: 1.0,
      rng: rng2,
    });
    expect(withCrit.isCrit).toBe(true);
    expect(noCrit.isCrit).toBe(false);
    expect(withCrit.amount).toBe(noCrit.amount * 2);
  });

  it('should never deal less than 1 damage on a hit', () => {
    const rng = new SeededRandom(5);
    const result = calculateSpellDamage({
      baseDamage: 1,
      spellPower: 0,
      spellCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0.99,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThanOrEqual(1);
  });

  it('should be deterministic with the same seed', () => {
    const makeParams = (rng: SeededRandom) => ({
      baseDamage: 150,
      spellPower: 300,
      spellCoefficient: 0.7,
      critChance: 0.25,
      critMultiplier: 0.5,
      resistReduction: 0.12,
      hitChance: 0.96,
      rng,
    });
    const result1 = calculateSpellDamage(makeParams(new SeededRandom(456)));
    const result2 = calculateSpellDamage(makeParams(new SeededRandom(456)));
    expect(result1.amount).toBe(result2.amount);
    expect(result1.isCrit).toBe(result2.isCrit);
  });
});

// ---------------------------------------------------------------------------
// Healing
// ---------------------------------------------------------------------------

describe('calculateHealing', () => {
  it('should produce positive healing', () => {
    const rng = new SeededRandom(42);
    const result = calculateHealing({
      baseHeal: 200,
      spellPower: 100,
      healCoefficient: 0.5,
      critChance: 0,
      critMultiplier: 0.5,
      rng,
    });
    expect(result.amount).toBeGreaterThan(200);
    expect(result.type).toBe(DamageType.Healing);
  });

  it('should never heal for less than 1', () => {
    const rng = new SeededRandom(7);
    const result = calculateHealing({
      baseHeal: 0,
      spellPower: 0,
      healCoefficient: 0,
      critChance: 0,
      critMultiplier: 0.5,
      rng,
    });
    expect(result.amount).toBeGreaterThanOrEqual(1);
  });

  it('should apply crit multiplier when crit lands', () => {
    const rng1 = new SeededRandom(60);
    const noCrit = calculateHealing({
      baseHeal: 200,
      spellPower: 0,
      healCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 1.0,
      rng: rng1,
    });
    const rng2 = new SeededRandom(60);
    const withCrit = calculateHealing({
      baseHeal: 200,
      spellPower: 0,
      healCoefficient: 1.0,
      critChance: 1.0,
      critMultiplier: 1.0,
      rng: rng2,
    });
    expect(withCrit.isCrit).toBe(true);
    expect(noCrit.isCrit).toBe(false);
    expect(withCrit.amount).toBe(noCrit.amount * 2);
  });

  it('should scale with spell power and coefficient', () => {
    const rng1 = new SeededRandom(15);
    const base = calculateHealing({
      baseHeal: 100,
      spellPower: 0,
      healCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 0.5,
      rng: rng1,
    });
    const rng2 = new SeededRandom(15);
    const scaled = calculateHealing({
      baseHeal: 100,
      spellPower: 200,
      healCoefficient: 0.5,
      critChance: 0,
      critMultiplier: 0.5,
      rng: rng2,
    });
    // spellPower contribution = 200 * 0.5 = 100
    expect(scaled.amount).toBe(base.amount + 100);
  });

  it('should not have a miss mechanic', () => {
    // Healing should always land -- there is no hitChance parameter
    const rng = new SeededRandom(99);
    const result = calculateHealing({
      baseHeal: 50,
      spellPower: 50,
      healCoefficient: 1.0,
      critChance: 0,
      critMultiplier: 0.5,
      rng,
    });
    expect(result.amount).toBeGreaterThan(0);
  });

  it('should be deterministic with the same seed', () => {
    const makeParams = (rng: SeededRandom) => ({
      baseHeal: 300,
      spellPower: 250,
      healCoefficient: 0.6,
      critChance: 0.2,
      critMultiplier: 0.5,
      rng,
    });
    const result1 = calculateHealing(makeParams(new SeededRandom(789)));
    const result2 = calculateHealing(makeParams(new SeededRandom(789)));
    expect(result1.amount).toBe(result2.amount);
    expect(result1.isCrit).toBe(result2.isCrit);
  });
});
