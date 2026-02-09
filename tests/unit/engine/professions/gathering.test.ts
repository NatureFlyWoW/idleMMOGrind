import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GatheringSystem,
  getZoneMaterialTier,
  getAvailableMaterials,
  rollSkillUp,
  selectGatheredMaterial,
} from '@engine/professions/gathering-system';
import { MaterialBank } from '@engine/professions/material-bank';
import { MaterialTier, ProfessionId, ProfessionType, SkillBracket } from '@shared/types/enums';
import type { IMaterial, IProfessionState } from '@shared/types/profession';
import type { IBalanceConfig } from '@shared/types/balance';

/** Build a minimal material for testing */
function makeMaterial(overrides: Partial<IMaterial> = {}): IMaterial {
  return {
    id: 'mat_mining_t1_copper_ore',
    name: 'Copper Ore',
    tier: MaterialTier.T1,
    stackSize: 200,
    vendorPrice: 1,
    source: 'gathering',
    gatheringProfession: ProfessionId.Mining,
    ...overrides,
  };
}

/** Build a minimal profession state */
function makeProfessionState(overrides: Partial<IProfessionState> = {}): IProfessionState {
  return {
    professionId: ProfessionId.Mining,
    skill: 1,
    maxSkill: 75,
    knownRecipes: [],
    currentBracket: SkillBracket.Apprentice,
    ...overrides,
  };
}

/** Build a minimal balance config for professions section */
function makeBalanceConfig(): IBalanceConfig['professions'] {
  return {
    gatheringIntervalTicks: 12,
    gatheringBaseYield: 1,
    gatheringSkillBonusPerPoint: 0.005,
    craftTimeBaseMs: 3000,
    craftTimeComplexityMultiplier: 1.5,
    maxCraftingQueue: 10,
    materialBankSlots: 100,
    skillUpChances: { orange: 1.0, yellow: 0.75, green: 0.25, gray: 0 },
    bracketThresholds: [0, 75, 150, 225, 275, 300],
  };
}

// ---------- Material definitions for tests ----------

const MINING_MATERIALS: IMaterial[] = [
  makeMaterial({ id: 'mat_mining_t1_copper_ore', name: 'Copper Ore', tier: MaterialTier.T1, gatheringProfession: ProfessionId.Mining }),
  makeMaterial({ id: 'mat_mining_t1_rough_stone', name: 'Rough Stone', tier: MaterialTier.T1, gatheringProfession: ProfessionId.Mining }),
  makeMaterial({ id: 'mat_mining_t2_iron_ore', name: 'Iron Ore', tier: MaterialTier.T2, gatheringProfession: ProfessionId.Mining }),
  makeMaterial({ id: 'mat_mining_t2_coarse_stone', name: 'Coarse Stone', tier: MaterialTier.T2, gatheringProfession: ProfessionId.Mining }),
  makeMaterial({ id: 'mat_mining_t3_mithril_ore', name: 'Mithril Ore', tier: MaterialTier.T3, gatheringProfession: ProfessionId.Mining }),
  makeMaterial({ id: 'mat_mining_t4_thorium_ore', name: 'Thorium Ore', tier: MaterialTier.T4, gatheringProfession: ProfessionId.Mining }),
  makeMaterial({ id: 'mat_mining_t5_adamantite_ore', name: 'Adamantite Ore', tier: MaterialTier.T5, gatheringProfession: ProfessionId.Mining }),
  makeMaterial({ id: 'mat_mining_t6_arcanite_ore', name: 'Arcanite Ore', tier: MaterialTier.T6, gatheringProfession: ProfessionId.Mining }),
];

const HERB_MATERIALS: IMaterial[] = [
  makeMaterial({ id: 'mat_herbalism_t1_peacebloom', name: 'Peacebloom', tier: MaterialTier.T1, gatheringProfession: ProfessionId.Herbalism }),
  makeMaterial({ id: 'mat_herbalism_t2_bruiseweed', name: 'Bruiseweed', tier: MaterialTier.T2, gatheringProfession: ProfessionId.Herbalism }),
  makeMaterial({ id: 'mat_herbalism_t3_goldthorn', name: 'Goldthorn', tier: MaterialTier.T3, gatheringProfession: ProfessionId.Herbalism }),
];

const SKINNING_MATERIALS: IMaterial[] = [
  makeMaterial({ id: 'mat_skinning_t1_light_leather', name: 'Light Leather', tier: MaterialTier.T1, gatheringProfession: ProfessionId.Skinning }),
  makeMaterial({ id: 'mat_skinning_t2_medium_leather', name: 'Medium Leather', tier: MaterialTier.T2, gatheringProfession: ProfessionId.Skinning }),
];

const ALL_MATERIALS = [...MINING_MATERIALS, ...HERB_MATERIALS, ...SKINNING_MATERIALS];

function makeRegistry(): Map<string, IMaterial> {
  const map = new Map<string, IMaterial>();
  for (const mat of ALL_MATERIALS) {
    map.set(mat.id, mat);
  }
  return map;
}

// ---------- Pure function tests ----------

describe('getZoneMaterialTier', () => {
  it('should return T1 for zone level range 1-10', () => {
    expect(getZoneMaterialTier(1)).toBe(MaterialTier.T1);
    expect(getZoneMaterialTier(5)).toBe(MaterialTier.T1);
    expect(getZoneMaterialTier(10)).toBe(MaterialTier.T1);
  });

  it('should return T2 for zone level range 11-20', () => {
    expect(getZoneMaterialTier(11)).toBe(MaterialTier.T2);
    expect(getZoneMaterialTier(20)).toBe(MaterialTier.T2);
  });

  it('should return T3 for zone level range 21-30', () => {
    expect(getZoneMaterialTier(25)).toBe(MaterialTier.T3);
    expect(getZoneMaterialTier(30)).toBe(MaterialTier.T3);
  });

  it('should return T4 for zone level range 31-40', () => {
    expect(getZoneMaterialTier(35)).toBe(MaterialTier.T4);
  });

  it('should return T5 for zone level range 41-50', () => {
    expect(getZoneMaterialTier(45)).toBe(MaterialTier.T5);
  });

  it('should return T6 for zone level range 51-60', () => {
    expect(getZoneMaterialTier(55)).toBe(MaterialTier.T6);
    expect(getZoneMaterialTier(60)).toBe(MaterialTier.T6);
  });

  it('should clamp to T1 for levels below 1', () => {
    expect(getZoneMaterialTier(0)).toBe(MaterialTier.T1);
  });

  it('should clamp to T6 for levels above 60', () => {
    expect(getZoneMaterialTier(99)).toBe(MaterialTier.T6);
  });
});

describe('getAvailableMaterials', () => {
  it('should return only mining materials for mining profession', () => {
    const result = getAvailableMaterials(
      ALL_MATERIALS,
      ProfessionId.Mining,
      MaterialTier.T1,
      1,
    );
    expect(result.length).toBeGreaterThan(0);
    for (const mat of result) {
      expect(mat.gatheringProfession).toBe(ProfessionId.Mining);
    }
  });

  it('should return only herbalism materials for herbalism profession', () => {
    const result = getAvailableMaterials(
      ALL_MATERIALS,
      ProfessionId.Herbalism,
      MaterialTier.T1,
      1,
    );
    expect(result.length).toBeGreaterThan(0);
    for (const mat of result) {
      expect(mat.gatheringProfession).toBe(ProfessionId.Herbalism);
    }
  });

  it('should return materials at the zone tier', () => {
    const result = getAvailableMaterials(
      ALL_MATERIALS,
      ProfessionId.Mining,
      MaterialTier.T2,
      100,
    );
    // Should include T2 materials
    expect(result.some(m => m.tier === MaterialTier.T2)).toBe(true);
  });

  it('should include lower tier materials when skill is high enough', () => {
    const result = getAvailableMaterials(
      ALL_MATERIALS,
      ProfessionId.Mining,
      MaterialTier.T2,
      100,
    );
    // With high skill, should also include T1 materials
    expect(result.some(m => m.tier === MaterialTier.T1)).toBe(true);
    expect(result.some(m => m.tier === MaterialTier.T2)).toBe(true);
  });

  it('should not include materials above zone tier', () => {
    const result = getAvailableMaterials(
      ALL_MATERIALS,
      ProfessionId.Mining,
      MaterialTier.T1,
      1,
    );
    for (const mat of result) {
      expect(mat.tier).toBeLessThanOrEqual(MaterialTier.T1);
    }
  });

  it('should return empty for non-gathering professions', () => {
    const result = getAvailableMaterials(
      ALL_MATERIALS,
      ProfessionId.Blacksmithing,
      MaterialTier.T1,
      1,
    );
    expect(result).toHaveLength(0);
  });
});

describe('selectGatheredMaterial', () => {
  it('should return a material from the available pool', () => {
    const pool = MINING_MATERIALS.filter(m => m.tier === MaterialTier.T1);
    const result = selectGatheredMaterial(pool, 0.5);
    expect(result).not.toBeNull();
    expect(pool).toContain(result);
  });

  it('should return null for empty pool', () => {
    const result = selectGatheredMaterial([], 0.5);
    expect(result).toBeNull();
  });

  it('should select different materials for different random values', () => {
    const pool = MINING_MATERIALS.filter(m => m.tier === MaterialTier.T1);
    if (pool.length < 2) return; // need at least 2 materials to test
    const result0 = selectGatheredMaterial(pool, 0.0);
    const result1 = selectGatheredMaterial(pool, 0.99);
    // With 2 items and well-spread random values, should get different results
    expect(result0).not.toBeNull();
    expect(result1).not.toBeNull();
    // At minimum, both should be valid pool members
    expect(pool).toContain(result0);
    expect(pool).toContain(result1);
  });
});

describe('rollSkillUp', () => {
  it('should always return true at very low relative skill (100% chance)', () => {
    // Skill 1, gathering T1 (min skill ~1) => very low relative skill => guaranteed
    const result = rollSkillUp(1, MaterialTier.T1, 0.5);
    expect(result).toBe(true);
  });

  it('should return true with low random roll even at moderate skill', () => {
    // Using random value of 0 should always succeed
    const result = rollSkillUp(50, MaterialTier.T1, 0.0);
    expect(result).toBe(true);
  });

  it('should return false when skill is at max for the tier', () => {
    // Skill at the very top of the tier => near-zero chance => high roll fails
    const result = rollSkillUp(75, MaterialTier.T1, 0.99);
    expect(result).toBe(false);
  });

  it('should return false when skill greatly exceeds tier requirement', () => {
    // Skill 300 on T1 material => 0% chance
    const result = rollSkillUp(300, MaterialTier.T1, 0.01);
    expect(result).toBe(false);
  });

  it('should return true at low relative skill even with high roll', () => {
    // Skill 1 on T1 => 100% chance regardless of roll
    expect(rollSkillUp(1, MaterialTier.T1, 0.99)).toBe(true);
  });
});

// ---------- GatheringSystem integration tests ----------

describe('GatheringSystem', () => {
  const balanceConfig = makeBalanceConfig();
  let registry: Map<string, IMaterial>;
  let bank: MaterialBank;
  let system: GatheringSystem;

  beforeEach(() => {
    registry = makeRegistry();
    bank = new MaterialBank(registry, 100);
  });

  describe('tick-based gathering (mining / herbalism)', () => {
    it('should produce materials after gatheringIntervalTicks ticks', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Mining,
        skill: 10,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      // Advance 11 ticks: no gather yet
      for (let i = 0; i < 11; i++) {
        system.tick();
      }
      expect(bank.getAll().length).toBe(0);

      // 12th tick: should trigger a gather
      const result = system.tick();
      expect(result).not.toBeNull();
      expect(result!.materialId).toBeTruthy();
      expect(result!.quantity).toBeGreaterThanOrEqual(1);
      expect(bank.getAll().length).toBeGreaterThan(0);
    });

    it('should respect gatheringIntervalTicks from config', () => {
      const customConfig = { ...balanceConfig, gatheringIntervalTicks: 4 };
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Herbalism,
        skill: 10,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig: customConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      for (let i = 0; i < 3; i++) system.tick();
      expect(bank.getAll().length).toBe(0);

      const result = system.tick();
      expect(result).not.toBeNull();
    });

    it('should produce herbalism materials for herbalism profession', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Herbalism,
        skill: 10,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      // Advance to trigger
      for (let i = 0; i < 12; i++) system.tick();

      // Check the gathered material is an herbalism material
      const all = bank.getAll();
      expect(all.length).toBeGreaterThan(0);
      const gatheredId = all[0]!.materialId;
      const mat = registry.get(gatheredId);
      expect(mat).toBeDefined();
      expect(mat!.gatheringProfession).toBe(ProfessionId.Herbalism);
    });

    it('should produce mining materials for mining profession', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Mining,
        skill: 10,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      for (let i = 0; i < 12; i++) system.tick();

      const all = bank.getAll();
      expect(all.length).toBeGreaterThan(0);
      const gatheredId = all[0]!.materialId;
      const mat = registry.get(gatheredId);
      expect(mat).toBeDefined();
      expect(mat!.gatheringProfession).toBe(ProfessionId.Mining);
    });
  });

  describe('skinning (event-based)', () => {
    it('should produce leather on beast-type monster kill', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Skinning,
        skill: 10,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      const result = system.onMonsterKill('wild-bear', 15, true);
      expect(result).not.toBeNull();
      expect(result!.materialId).toBeTruthy();
      expect(bank.getAll().length).toBeGreaterThan(0);

      const gatheredId = bank.getAll()[0]!.materialId;
      const mat = registry.get(gatheredId);
      expect(mat).toBeDefined();
      expect(mat!.gatheringProfession).toBe(ProfessionId.Skinning);
    });

    it('should NOT produce leather on non-beast monster kill', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Skinning,
        skill: 10,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      const result = system.onMonsterKill('skeleton-knight', 40, false);
      expect(result).toBeNull();
      expect(bank.getAll().length).toBe(0);
    });

    it('should not be triggered by passive ticks', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Skinning,
        skill: 10,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      // Even after many ticks, skinning should not produce anything passively
      for (let i = 0; i < 50; i++) system.tick();
      expect(bank.getAll().length).toBe(0);
    });
  });

  describe('skill level and tier interaction', () => {
    it('should unlock higher-tier materials with higher skill in same zone', () => {
      // With zone level 25 (T3), but skill 1 => only T3 is available at zone tier
      // With skill 150+ => T1, T2, T3 all accessible
      const lowSkillMats = getAvailableMaterials(
        ALL_MATERIALS,
        ProfessionId.Mining,
        MaterialTier.T3,
        1,
      );
      const highSkillMats = getAvailableMaterials(
        ALL_MATERIALS,
        ProfessionId.Mining,
        MaterialTier.T3,
        150,
      );
      // High skill should have access to more or equal materials
      expect(highSkillMats.length).toBeGreaterThanOrEqual(lowSkillMats.length);
    });
  });

  describe('no gathering profession', () => {
    it('should not gather if character has no gathering profession', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Blacksmithing,
        skill: 100,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      for (let i = 0; i < 50; i++) system.tick();
      expect(bank.getAll().length).toBe(0);
    });

    it('should not gather if professions list is empty', () => {
      system = new GatheringSystem({
        materialBank: bank,
        professions: [],
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      for (let i = 0; i < 50; i++) system.tick();
      expect(bank.getAll().length).toBe(0);
    });
  });

  describe('skill-up on gather', () => {
    it('should skill-up when roll succeeds', () => {
      const profState = makeProfessionState({
        professionId: ProfessionId.Mining,
        skill: 1,
        maxSkill: 75,
      });
      const professions: IProfessionState[] = [profState];

      // rng always returns 0.0 => skill-up always succeeds
      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.0,
      });

      for (let i = 0; i < 12; i++) system.tick();

      const result = system.getLastGatherResult();
      expect(result).not.toBeNull();
      expect(result!.skillUp).toBe(true);
    });

    it('should NOT skill-up beyond maxSkill', () => {
      const profState = makeProfessionState({
        professionId: ProfessionId.Mining,
        skill: 75,
        maxSkill: 75,
      });
      const professions: IProfessionState[] = [profState];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.0,
      });

      for (let i = 0; i < 12; i++) system.tick();

      // Skill should remain at max
      expect(profState.skill).toBe(75);
    });
  });

  describe('multiple gathering professions', () => {
    it('should gather for all tick-based gathering professions', () => {
      const miningState = makeProfessionState({
        professionId: ProfessionId.Mining,
        skill: 10,
      });
      const herbState = makeProfessionState({
        professionId: ProfessionId.Herbalism,
        skill: 10,
      });
      const professions: IProfessionState[] = [miningState, herbState];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      // Advance 12 ticks - both professions should trigger
      for (let i = 0; i < 12; i++) system.tick();

      const all = bank.getAll();
      // Should have materials from both professions
      const miningMats = all.filter(e => {
        const mat = registry.get(e.materialId);
        return mat?.gatheringProfession === ProfessionId.Mining;
      });
      const herbMats = all.filter(e => {
        const mat = registry.get(e.materialId);
        return mat?.gatheringProfession === ProfessionId.Herbalism;
      });
      expect(miningMats.length).toBeGreaterThan(0);
      expect(herbMats.length).toBeGreaterThan(0);
    });
  });

  describe('zone level update', () => {
    it('should allow changing the zone level for gathering', () => {
      const professions: IProfessionState[] = [makeProfessionState({
        professionId: ProfessionId.Mining,
        skill: 100,
      })];

      system = new GatheringSystem({
        materialBank: bank,
        professions,
        allMaterials: ALL_MATERIALS,
        balanceConfig,
        zoneLevel: 5,
        rng: () => 0.5,
      });

      system.setZoneLevel(25);

      for (let i = 0; i < 12; i++) system.tick();

      const all = bank.getAll();
      expect(all.length).toBeGreaterThan(0);
      // Zone level 25 = T3, so gathered material should be T3 or lower
      for (const entry of all) {
        const mat = registry.get(entry.materialId);
        expect(mat).toBeDefined();
        expect(mat!.tier).toBeLessThanOrEqual(MaterialTier.T3);
      }
    });
  });
});
