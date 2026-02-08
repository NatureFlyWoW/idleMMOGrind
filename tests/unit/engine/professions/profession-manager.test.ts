import { describe, it, expect, beforeEach } from 'vitest';
import { ProfessionManager } from '@engine/professions/profession-manager';
import {
  ProfessionId, ProfessionType, SkillBracket,
  MaterialTier, ItemQuality, RecipeDifficulty,
} from '@shared/types/enums';
import type {
  IMaterial, IRecipe, IProfessionDefinition,
  IProfessionState, IMaterialBankEntry, ICraftingQueueEntry,
} from '@shared/types/profession';
import type { IBalanceConfig } from '@shared/types/balance';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function makeMaterial(overrides: Partial<IMaterial> = {}): IMaterial {
  return {
    id: 'mat_copper_ore',
    name: 'Copper Ore',
    tier: MaterialTier.T1,
    stackSize: 200,
    vendorPrice: 1,
    source: 'gathering',
    gatheringProfession: ProfessionId.Mining,
    ...overrides,
  };
}

function makeRecipe(overrides: Partial<IRecipe> = {}): IRecipe {
  return {
    id: 'recipe_copper_sword',
    professionId: ProfessionId.Blacksmithing,
    name: 'Copper Sword',
    skillRequired: 1,
    skillUpChance: { orange: 1.0, yellow: 0.75, green: 0.25, gray: 0 },
    materials: [{ materialId: 'mat_copper_ore', quantity: 3 }],
    craftTimeMs: 3000,
    output: {
      type: 'item',
      itemTemplateId: 'item_copper_sword',
      quantity: 1,
      iLevel: 5,
      quality: ItemQuality.Common,
    },
    ...overrides,
  };
}

function makeProfessionDef(overrides: Partial<IProfessionDefinition> = {}): IProfessionDefinition {
  return {
    id: ProfessionId.Mining,
    name: 'Mining',
    type: ProfessionType.Gathering,
    description: 'Mine ores and gems from mineral nodes.',
    skillBrackets: [
      { bracket: SkillBracket.Apprentice, skillMin: 0, skillMax: 75, requiredLevel: 1, trainingCost: 10 },
      { bracket: SkillBracket.Journeyman, skillMin: 75, skillMax: 150, requiredLevel: 10, trainingCost: 50 },
    ],
    ...overrides,
  };
}

const defaultBalanceProfessions: IBalanceConfig['professions'] = {
  gatheringIntervalTicks: 12,
  gatheringBaseYield: 1,
  gatheringSkillBonusPerPoint: 0.005,
  craftTimeBaseMs: 3000,
  craftTimeComplexityMultiplier: 1.5,
  maxCraftingQueue: 10,
  materialBankSlots: 100,
  skillUpChances: {
    [RecipeDifficulty.Orange]: 1.0,
    [RecipeDifficulty.Yellow]: 0.75,
    [RecipeDifficulty.Green]: 0.25,
    [RecipeDifficulty.Gray]: 0,
  },
  bracketThresholds: [0, 75, 150, 225, 275, 300],
};

// Profession definitions for all types
const miningDef = makeProfessionDef();
const herbalismDef = makeProfessionDef({
  id: ProfessionId.Herbalism,
  name: 'Herbalism',
  type: ProfessionType.Gathering,
  description: 'Gather herbs from the wild.',
});
const skinningDef = makeProfessionDef({
  id: ProfessionId.Skinning,
  name: 'Skinning',
  type: ProfessionType.Gathering,
  description: 'Skin beasts for leather.',
});
const blacksmithingDef = makeProfessionDef({
  id: ProfessionId.Blacksmithing,
  name: 'Blacksmithing',
  type: ProfessionType.Crafting,
  description: 'Forge weapons and plate armor.',
});
const leatherworkingDef = makeProfessionDef({
  id: ProfessionId.Leatherworking,
  name: 'Leatherworking',
  type: ProfessionType.Crafting,
  description: 'Craft leather armor.',
});
const tailoringDef = makeProfessionDef({
  id: ProfessionId.Tailoring,
  name: 'Tailoring',
  type: ProfessionType.Crafting,
  description: 'Sew cloth armor.',
});
const alchemyDef = makeProfessionDef({
  id: ProfessionId.Alchemy,
  name: 'Alchemy',
  type: ProfessionType.Crafting,
  description: 'Brew potions and elixirs.',
});
const cookingDef = makeProfessionDef({
  id: ProfessionId.Cooking,
  name: 'Cooking',
  type: ProfessionType.Secondary,
  description: 'Cook food for buffs.',
});
const firstAidDef = makeProfessionDef({
  id: ProfessionId.FirstAid,
  name: 'First Aid',
  type: ProfessionType.Secondary,
  description: 'Craft bandages for healing.',
});
const fishingDef = makeProfessionDef({
  id: ProfessionId.Fishing,
  name: 'Fishing',
  type: ProfessionType.Secondary,
  description: 'Catch fish.',
});

const allDefinitions: IProfessionDefinition[] = [
  miningDef, herbalismDef, skinningDef,
  blacksmithingDef, leatherworkingDef, tailoringDef, alchemyDef,
  cookingDef, firstAidDef, fishingDef,
];

const copperOre = makeMaterial();
const peacebloom = makeMaterial({
  id: 'mat_herbalism_t1_peacebloom',
  name: 'Peacebloom',
  tier: MaterialTier.T1,
  gatheringProfession: ProfessionId.Herbalism,
});
const lightLeather = makeMaterial({
  id: 'mat_skinning_t1_light_leather',
  name: 'Light Leather',
  tier: MaterialTier.T1,
  gatheringProfession: ProfessionId.Skinning,
});

const allMaterials: IMaterial[] = [copperOre, peacebloom, lightLeather];

const copperSwordRecipe = makeRecipe();
const healingPotionRecipe = makeRecipe({
  id: 'recipe_healing_potion',
  professionId: ProfessionId.Alchemy,
  name: 'Healing Potion',
  skillRequired: 1,
  materials: [{ materialId: 'mat_herbalism_t1_peacebloom', quantity: 2 }],
  craftTimeMs: 2000,
  output: {
    type: 'consumable',
    consumableEffect: {
      id: 'effect_healing_potion',
      name: 'Healing Potion',
      durationMs: 0,
      statBonuses: {},
      description: 'Restores health.',
    },
    quantity: 1,
  },
});

const allRecipes: IRecipe[] = [copperSwordRecipe, healingPotionRecipe];

interface ManagerConfig {
  definitions?: IProfessionDefinition[];
  materials?: IMaterial[];
  recipes?: IRecipe[];
  balanceConfig?: IBalanceConfig['professions'];
  zoneLevel?: number;
  rng?: () => number;
}

function createManager(overrides: ManagerConfig = {}): ProfessionManager {
  return new ProfessionManager({
    definitions: overrides.definitions ?? allDefinitions,
    materials: overrides.materials ?? allMaterials,
    recipes: overrides.recipes ?? allRecipes,
    balanceConfig: overrides.balanceConfig ?? defaultBalanceProfessions,
    zoneLevel: overrides.zoneLevel ?? 5,
    rng: overrides.rng ?? (() => 0.5),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfessionManager', () => {
  let manager: ProfessionManager;

  beforeEach(() => {
    manager = createManager();
  });

  // -------------------------------------------------------------------------
  // learnProfession
  // -------------------------------------------------------------------------

  describe('learnProfession', () => {
    it('should assign a gathering profession to primary slot 0', () => {
      const result = manager.learnProfession(ProfessionId.Mining, 0);
      expect(result.success).toBe(true);

      const active = manager.getActiveProfessions();
      expect(active.primary[0]?.professionId).toBe(ProfessionId.Mining);
    });

    it('should assign a crafting profession to primary slot 1', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const result = manager.learnProfession(ProfessionId.Blacksmithing, 1);
      expect(result.success).toBe(true);

      const active = manager.getActiveProfessions();
      expect(active.primary[1]?.professionId).toBe(ProfessionId.Blacksmithing);
    });

    it('should allow two primary professions (max 2)', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      manager.learnProfession(ProfessionId.Blacksmithing, 1);

      const active = manager.getActiveProfessions();
      expect(active.primary.length).toBe(2);
      expect(active.primary[0]?.professionId).toBe(ProfessionId.Mining);
      expect(active.primary[1]?.professionId).toBe(ProfessionId.Blacksmithing);
    });

    it('should reject invalid slot numbers', () => {
      const result = manager.learnProfession(ProfessionId.Mining, 2);
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should reject secondary profession in primary slot', () => {
      const result = manager.learnProfession(ProfessionId.Cooking, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should reject learning the same profession twice', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const result = manager.learnProfession(ProfessionId.Mining, 1);
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should reject unknown profession ID', () => {
      const result = manager.learnProfession('nonexistent' as ProfessionId, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should reject if slot is already occupied', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const result = manager.learnProfession(ProfessionId.Herbalism, 0);
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should initialize profession state with skill 1 and apprentice bracket', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const active = manager.getActiveProfessions();
      const mining = active.primary[0]!;
      expect(mining.skill).toBe(1);
      expect(mining.maxSkill).toBe(75);
      expect(mining.currentBracket).toBe(SkillBracket.Apprentice);
      expect(mining.knownRecipes).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Secondary professions auto-learned
  // -------------------------------------------------------------------------

  describe('secondary professions', () => {
    it('should auto-learn all 3 secondary professions on construction', () => {
      const active = manager.getActiveProfessions();
      expect(active.secondary.length).toBe(3);

      const secondaryIds = active.secondary.map(p => p.professionId);
      expect(secondaryIds).toContain(ProfessionId.Cooking);
      expect(secondaryIds).toContain(ProfessionId.FirstAid);
      expect(secondaryIds).toContain(ProfessionId.Fishing);
    });

    it('should initialize secondary professions with skill 1 and apprentice bracket', () => {
      const active = manager.getActiveProfessions();
      for (const sec of active.secondary) {
        expect(sec.skill).toBe(1);
        expect(sec.maxSkill).toBe(75);
        expect(sec.currentBracket).toBe(SkillBracket.Apprentice);
      }
    });
  });

  // -------------------------------------------------------------------------
  // unlearnProfession
  // -------------------------------------------------------------------------

  describe('unlearnProfession', () => {
    it('should reset skill, recipes, and free the slot', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const result = manager.unlearnProfession(0);
      expect(result.success).toBe(true);

      const active = manager.getActiveProfessions();
      expect(active.primary[0]).toBeNull();
    });

    it('should return false for an already empty slot', () => {
      const result = manager.unlearnProfession(0);
      expect(result.success).toBe(false);
    });

    it('should return false for invalid slot', () => {
      const result = manager.unlearnProfession(2);
      expect(result.success).toBe(false);
    });

    it('should allow learning a new profession after unlearning', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      manager.unlearnProfession(0);
      const result = manager.learnProfession(ProfessionId.Herbalism, 0);
      expect(result.success).toBe(true);

      const active = manager.getActiveProfessions();
      expect(active.primary[0]?.professionId).toBe(ProfessionId.Herbalism);
    });
  });

  // -------------------------------------------------------------------------
  // getActiveProfessions
  // -------------------------------------------------------------------------

  describe('getActiveProfessions', () => {
    it('should return primary slots as null when empty', () => {
      const active = manager.getActiveProfessions();
      expect(active.primary[0]).toBeNull();
      expect(active.primary[1]).toBeNull();
    });

    it('should return current primary + secondary after learning', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const active = manager.getActiveProfessions();

      expect(active.primary[0]?.professionId).toBe(ProfessionId.Mining);
      expect(active.primary[1]).toBeNull();
      expect(active.secondary.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Gathering integration
  // -------------------------------------------------------------------------

  describe('gathering integration', () => {
    it('should delegate tick updates to gathering system', () => {
      manager.learnProfession(ProfessionId.Mining, 0);

      // Tick 12 times (gatheringIntervalTicks = 12) to trigger a gather
      for (let i = 0; i < 12; i++) {
        manager.update({}, 250);
      }

      // Material bank should have materials
      const bank = manager.getMaterialBank();
      expect(bank.length).toBeGreaterThan(0);
    });

    it('should not gather when no gathering professions are learned', () => {
      manager.learnProfession(ProfessionId.Blacksmithing, 0);

      for (let i = 0; i < 24; i++) {
        manager.update({}, 250);
      }

      const bank = manager.getMaterialBank();
      expect(bank.length).toBe(0);
    });

    it('should trigger skinning on monster kill for beast-type monsters', () => {
      manager.learnProfession(ProfessionId.Skinning, 0);
      const result = manager.onMonsterKill('monster_wolf', 5, true);
      expect(result).not.toBeNull();
      expect(result!.materialId).toBe(lightLeather.id);
    });

    it('should not trigger skinning for non-beast monsters', () => {
      manager.learnProfession(ProfessionId.Skinning, 0);
      const result = manager.onMonsterKill('monster_bandit', 5, false);
      expect(result).toBeNull();
    });

    it('should not trigger skinning without skinning profession', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const result = manager.onMonsterKill('monster_wolf', 5, true);
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Crafting integration
  // -------------------------------------------------------------------------

  describe('crafting integration', () => {
    it('should delegate queueRecipe to crafting engine', () => {
      manager.learnProfession(ProfessionId.Blacksmithing, 0);

      // Add materials to bank
      manager.addMaterialToBank(copperOre.id, 10);

      const result = manager.queueRecipe(ProfessionId.Blacksmithing, copperSwordRecipe.id);
      expect(result.success).toBe(true);

      const queue = manager.getCraftingQueue(ProfessionId.Blacksmithing);
      expect(queue.length).toBe(1);
      expect(queue[0]!.recipeId).toBe(copperSwordRecipe.id);
    });

    it('should reject queueRecipe for unlearned profession', () => {
      const result = manager.queueRecipe(ProfessionId.Blacksmithing, copperSwordRecipe.id);
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should complete crafts when enough time passes via update', () => {
      manager.learnProfession(ProfessionId.Blacksmithing, 0);
      manager.addMaterialToBank(copperOre.id, 10);
      manager.queueRecipe(ProfessionId.Blacksmithing, copperSwordRecipe.id);

      // Craft takes 3000ms; run 12 ticks at 250ms each = 3000ms
      for (let i = 0; i < 12; i++) {
        manager.update({}, 250);
      }

      const queue = manager.getCraftingQueue(ProfessionId.Blacksmithing);
      expect(queue.length).toBe(0);
    });

    it('should delegate cancelRecipe to crafting engine', () => {
      manager.learnProfession(ProfessionId.Blacksmithing, 0);
      manager.addMaterialToBank(copperOre.id, 10);
      manager.queueRecipe(ProfessionId.Blacksmithing, copperSwordRecipe.id);

      const result = manager.cancelRecipe(ProfessionId.Blacksmithing, 0);
      expect(result).toBe(true);

      const queue = manager.getCraftingQueue(ProfessionId.Blacksmithing);
      expect(queue.length).toBe(0);

      // Materials should be refunded
      const bank = manager.getMaterialBank();
      const copperEntry = bank.find(e => e.materialId === copperOre.id);
      expect(copperEntry?.quantity).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  // Save/Load round-trip
  // -------------------------------------------------------------------------

  describe('save/load round-trip', () => {
    it('should preserve all profession state across serialize/deserialize', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      manager.learnProfession(ProfessionId.Blacksmithing, 1);

      // Add some materials
      manager.addMaterialToBank(copperOre.id, 50);
      manager.addMaterialToBank(peacebloom.id, 25);

      // Queue a craft
      manager.queueRecipe(ProfessionId.Blacksmithing, copperSwordRecipe.id);

      // Serialize
      const saved = manager.serialize();

      // Create a fresh manager and deserialize
      const manager2 = createManager();
      manager2.deserialize(saved);

      // Verify primary professions
      const active2 = manager2.getActiveProfessions();
      expect(active2.primary[0]?.professionId).toBe(ProfessionId.Mining);
      expect(active2.primary[1]?.professionId).toBe(ProfessionId.Blacksmithing);

      // Verify secondary professions preserved
      expect(active2.secondary.length).toBe(3);

      // Verify material bank
      const bank2 = manager2.getMaterialBank();
      const copper2 = bank2.find(e => e.materialId === copperOre.id);
      // 50 minus 3 used for craft = 47
      expect(copper2?.quantity).toBe(47);
      const peace2 = bank2.find(e => e.materialId === peacebloom.id);
      expect(peace2?.quantity).toBe(25);

      // Verify crafting queue
      const queue2 = manager2.getCraftingQueue(ProfessionId.Blacksmithing);
      expect(queue2.length).toBe(1);
      expect(queue2[0]!.recipeId).toBe(copperSwordRecipe.id);
    });

    it('should handle empty state round-trip', () => {
      const saved = manager.serialize();
      const manager2 = createManager();
      manager2.deserialize(saved);

      const active = manager2.getActiveProfessions();
      expect(active.primary[0]).toBeNull();
      expect(active.primary[1]).toBeNull();
      expect(active.secondary.length).toBe(3);
    });

    it('should handle partial state (one primary) round-trip', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      const saved = manager.serialize();

      const manager2 = createManager();
      manager2.deserialize(saved);

      const active = manager2.getActiveProfessions();
      expect(active.primary[0]?.professionId).toBe(ProfessionId.Mining);
      expect(active.primary[1]).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Event emission
  // -------------------------------------------------------------------------

  describe('event emission', () => {
    it('should record material_gathered event on successful gather', () => {
      manager.learnProfession(ProfessionId.Mining, 0);

      // Tick through gathering interval
      for (let i = 0; i < 12; i++) {
        manager.update({}, 250);
      }

      const events = manager.drainEvents();
      const gatherEvents = events.filter(e => e.type === 'material_gathered');
      expect(gatherEvents.length).toBeGreaterThan(0);
      expect(gatherEvents[0]!.payload).toHaveProperty('materialId');
      expect(gatherEvents[0]!.payload).toHaveProperty('quantity');
    });

    it('should record item_crafted event when a craft completes', () => {
      manager.learnProfession(ProfessionId.Blacksmithing, 0);
      manager.addMaterialToBank(copperOre.id, 10);
      manager.queueRecipe(ProfessionId.Blacksmithing, copperSwordRecipe.id);

      // Advance enough for craft to complete
      for (let i = 0; i < 12; i++) {
        manager.update({}, 250);
      }

      const events = manager.drainEvents();
      const craftEvents = events.filter(e => e.type === 'item_crafted');
      expect(craftEvents.length).toBe(1);
      expect(craftEvents[0]!.payload).toHaveProperty('recipeId', copperSwordRecipe.id);
    });

    it('should record skill_up event on skill increase', () => {
      // Use RNG that always returns 0 => guarantees skill-up
      const mgr = createManager({ rng: () => 0 });
      mgr.learnProfession(ProfessionId.Mining, 0);

      // Tick through gathering interval
      for (let i = 0; i < 12; i++) {
        mgr.update({}, 250);
      }

      const events = mgr.drainEvents();
      const skillUpEvents = events.filter(e => e.type === 'skill_up');
      expect(skillUpEvents.length).toBeGreaterThan(0);
      expect(skillUpEvents[0]!.payload).toHaveProperty('professionId');
      expect(skillUpEvents[0]!.payload).toHaveProperty('newSkill');
    });

    it('should record recipe_learned event when a recipe is learned', () => {
      manager.learnProfession(ProfessionId.Blacksmithing, 0);
      manager.learnRecipe(ProfessionId.Blacksmithing, copperSwordRecipe.id);

      const events = manager.drainEvents();
      const recipeEvents = events.filter(e => e.type === 'recipe_learned');
      expect(recipeEvents.length).toBe(1);
      expect(recipeEvents[0]!.payload).toHaveProperty('recipeId', copperSwordRecipe.id);
    });

    it('should clear events after draining', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      for (let i = 0; i < 12; i++) {
        manager.update({}, 250);
      }

      manager.drainEvents();
      const secondDrain = manager.drainEvents();
      expect(secondDrain.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // IGameSystem interface
  // -------------------------------------------------------------------------

  describe('IGameSystem interface', () => {
    it('should implement update(state, deltaMs)', () => {
      expect(typeof manager.update).toBe('function');
      // Should not throw with empty state
      manager.update({}, 250);
    });

    it('should tolerate being called with no professions learned', () => {
      // Should not throw
      for (let i = 0; i < 100; i++) {
        manager.update({}, 250);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Zone level changes
  // -------------------------------------------------------------------------

  describe('zone level', () => {
    it('should update zone level for gathering system', () => {
      manager.learnProfession(ProfessionId.Mining, 0);
      manager.setZoneLevel(20);

      // Gathering should use the new zone level for tier calculation
      // Just verify it does not throw
      for (let i = 0; i < 12; i++) {
        manager.update({}, 250);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Material bank access
  // -------------------------------------------------------------------------

  describe('material bank access', () => {
    it('should expose material bank contents', () => {
      manager.addMaterialToBank(copperOre.id, 10);
      const bank = manager.getMaterialBank();
      expect(bank.length).toBe(1);
      expect(bank[0]!.materialId).toBe(copperOre.id);
      expect(bank[0]!.quantity).toBe(10);
    });

    it('should allow adding materials directly (for quest rewards, loot, etc.)', () => {
      const added = manager.addMaterialToBank(copperOre.id, 5);
      expect(added).toBe(5);
    });
  });
});
