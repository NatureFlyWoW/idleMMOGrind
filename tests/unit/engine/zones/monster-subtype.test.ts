import { describe, it, expect } from 'vitest';
import {
  getMaterialDropTable,
  rollMaterialDrops,
} from '@engine/zones/monster-subtype';
import { MonsterSubtype } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import type { IMaterialDrop } from '@shared/types/zone-expansion';

// ---------------------------------------------------------------------------
// getMaterialDropTable -- returns template drops for each subtype
// ---------------------------------------------------------------------------

describe('getMaterialDropTable', () => {
  it('Beast subtype returns leather and meat material drops', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Beast);
    const materialIds = drops.map((d) => d.materialId);
    expect(materialIds).toContain('leather');
    expect(materialIds).toContain('meat');
  });

  it('Beast leather requires skinning profession', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Beast);
    const leather = drops.find((d) => d.materialId === 'leather');
    expect(leather).toBeDefined();
    expect(leather!.requiresProfession).toBe('skinning');
  });

  it('Beast meat does not require a profession', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Beast);
    const meat = drops.find((d) => d.materialId === 'meat');
    expect(meat).toBeDefined();
    expect(meat!.requiresProfession).toBeUndefined();
  });

  it('Humanoid subtype returns cloth and coins', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Humanoid);
    const materialIds = drops.map((d) => d.materialId);
    expect(materialIds).toContain('cloth');
    expect(materialIds).toContain('coins');
  });

  it('Elemental subtype returns reagents and cores', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Elemental);
    const materialIds = drops.map((d) => d.materialId);
    expect(materialIds).toContain('reagent');
    expect(materialIds).toContain('elemental_core');
  });

  it('Undead subtype returns bone dust and rune fragments', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Undead);
    const materialIds = drops.map((d) => d.materialId);
    expect(materialIds).toContain('bone_dust');
    expect(materialIds).toContain('rune_fragment');
  });

  it('Construct subtype returns gears and stone', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Construct);
    const materialIds = drops.map((d) => d.materialId);
    expect(materialIds).toContain('gears');
    expect(materialIds).toContain('stone');
  });

  it('Dragonkin subtype returns scales and essence', () => {
    const drops = getMaterialDropTable(MonsterSubtype.Dragonkin);
    const materialIds = drops.map((d) => d.materialId);
    expect(materialIds).toContain('dragon_scale');
    expect(materialIds).toContain('dragon_essence');
  });

  it('all drop tables have valid structure', () => {
    const subtypes = Object.values(MonsterSubtype);
    for (const subtype of subtypes) {
      const drops = getMaterialDropTable(subtype);
      expect(drops.length).toBeGreaterThanOrEqual(2);
      for (const drop of drops) {
        expect(drop.materialId).toBeTruthy();
        expect(drop.chance).toBeGreaterThan(0);
        expect(drop.chance).toBeLessThanOrEqual(1);
        expect(drop.quantity.min).toBeGreaterThanOrEqual(1);
        expect(drop.quantity.max).toBeGreaterThanOrEqual(drop.quantity.min);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// rollMaterialDrops -- uses RNG to roll actual drops from a drop table
// ---------------------------------------------------------------------------

describe('rollMaterialDrops', () => {
  it('returns drops when RNG rolls under the chance threshold', () => {
    const rng = new SeededRandom(42);
    const drops: IMaterialDrop[] = [
      { materialId: 'leather', chance: 1.0, quantity: { min: 1, max: 3 } },
    ];

    const results = rollMaterialDrops(drops, rng);
    expect(results).toHaveLength(1);
    expect(results[0]!.materialId).toBe('leather');
    expect(results[0]!.quantity).toBeGreaterThanOrEqual(1);
    expect(results[0]!.quantity).toBeLessThanOrEqual(3);
  });

  it('returns empty array when RNG rolls above the chance threshold', () => {
    const rng = new SeededRandom(42);
    const drops: IMaterialDrop[] = [
      { materialId: 'leather', chance: 0, quantity: { min: 1, max: 1 } },
    ];

    const results = rollMaterialDrops(drops, rng);
    expect(results).toHaveLength(0);
  });

  it('respects requiresProfession -- filters drops when professions not provided', () => {
    const rng = new SeededRandom(42);
    const drops: IMaterialDrop[] = [
      {
        materialId: 'leather',
        chance: 1.0,
        quantity: { min: 1, max: 1 },
        requiresProfession: 'skinning',
      },
      { materialId: 'meat', chance: 1.0, quantity: { min: 1, max: 1 } },
    ];

    // No professions provided: should only get meat
    const results = rollMaterialDrops(drops, rng);
    expect(results).toHaveLength(1);
    expect(results[0]!.materialId).toBe('meat');
  });

  it('includes profession-gated drops when the profession is available', () => {
    const rng = new SeededRandom(42);
    const drops: IMaterialDrop[] = [
      {
        materialId: 'leather',
        chance: 1.0,
        quantity: { min: 1, max: 1 },
        requiresProfession: 'skinning',
      },
      { materialId: 'meat', chance: 1.0, quantity: { min: 1, max: 1 } },
    ];

    const results = rollMaterialDrops(drops, rng, ['skinning']);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.materialId).sort()).toEqual(['leather', 'meat']);
  });

  it('rolls deterministic quantities with seeded RNG', () => {
    const drops: IMaterialDrop[] = [
      { materialId: 'leather', chance: 1.0, quantity: { min: 1, max: 5 } },
    ];

    const rng1 = new SeededRandom(100);
    const results1 = rollMaterialDrops(drops, rng1);

    const rng2 = new SeededRandom(100);
    const results2 = rollMaterialDrops(drops, rng2);

    expect(results1).toEqual(results2);
  });

  it('can roll multiple drops from the same table', () => {
    const rng = new SeededRandom(42);
    const drops: IMaterialDrop[] = [
      { materialId: 'cloth', chance: 1.0, quantity: { min: 1, max: 2 } },
      { materialId: 'coins', chance: 1.0, quantity: { min: 1, max: 5 } },
    ];

    const results = rollMaterialDrops(drops, rng);
    expect(results).toHaveLength(2);
  });

  it('returns empty array for an empty drop table', () => {
    const rng = new SeededRandom(42);
    const results = rollMaterialDrops([], rng);
    expect(results).toHaveLength(0);
  });
});
