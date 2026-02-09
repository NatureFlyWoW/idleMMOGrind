import { describe, it, expect, beforeEach } from 'vitest';
import { CraftingEngine } from '@engine/professions/crafting-engine';
import { MaterialBank } from '@engine/professions/material-bank';
import { RecipeDifficulty, MaterialTier, ProfessionId, ItemQuality } from '@shared/types/enums';
import type { IMaterial, IRecipe, IProfessionState } from '@shared/types/profession';
import type { IBalanceConfig } from '@shared/types/balance';

// ---------------------------------------------------------------------------
// Helpers
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
    materials: [
      { materialId: 'mat_copper_ore', quantity: 3 },
    ],
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

function makeProfessionState(overrides: Partial<IProfessionState> = {}): IProfessionState {
  return {
    professionId: ProfessionId.Blacksmithing,
    skill: 1,
    maxSkill: 75,
    knownRecipes: ['recipe_copper_sword'],
    currentBracket: 'apprentice' as IProfessionState['currentBracket'],
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

// Materials
const copperOre = makeMaterial();
const ironOre = makeMaterial({
  id: 'mat_iron_ore',
  name: 'Iron Ore',
  tier: MaterialTier.T2,
});

const registry = new Map<string, IMaterial>([
  [copperOre.id, copperOre],
  [ironOre.id, ironOre],
]);

const recipes = new Map<string, IRecipe>();

function setupRecipes(): void {
  const copperSword = makeRecipe();
  const ironSword = makeRecipe({
    id: 'recipe_iron_sword',
    name: 'Iron Sword',
    skillRequired: 50,
    materials: [
      { materialId: 'mat_iron_ore', quantity: 5 },
    ],
    craftTimeMs: 5000,
    output: {
      type: 'item',
      itemTemplateId: 'item_iron_sword',
      quantity: 1,
      iLevel: 15,
      quality: ItemQuality.Uncommon,
    },
  });
  const healingPotion = makeRecipe({
    id: 'recipe_healing_potion',
    professionId: ProfessionId.Alchemy,
    name: 'Healing Potion',
    skillRequired: 10,
    materials: [
      { materialId: 'mat_copper_ore', quantity: 2 },
    ],
    craftTimeMs: 2000,
    output: {
      type: 'consumable',
      quantity: 1,
      consumableEffect: {
        id: 'effect_heal_minor',
        name: 'Minor Healing',
        durationMs: 0,
        statBonuses: {},
        description: 'Heals a small amount.',
      },
    },
  });

  recipes.clear();
  recipes.set(copperSword.id, copperSword);
  recipes.set(ironSword.id, ironSword);
  recipes.set(healingPotion.id, healingPotion);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CraftingEngine', () => {
  let bank: MaterialBank;
  let profState: IProfessionState;
  let engine: CraftingEngine;
  let rngValue: number;

  beforeEach(() => {
    setupRecipes();
    bank = new MaterialBank(registry, 100);
    profState = makeProfessionState();
    rngValue = 0.5;

    engine = new CraftingEngine({
      materialBank: bank,
      professionState: profState,
      recipes,
      balanceConfig: defaultBalanceProfessions,
      rng: () => rngValue,
    });
  });

  // -----------------------------------------------------------------------
  // queueRecipe
  // -----------------------------------------------------------------------

  describe('queueRecipe', () => {
    it('should add recipe to queue when materials are available', () => {
      bank.add('mat_copper_ore', 10);

      const result = engine.queueRecipe('recipe_copper_sword');
      expect(result.success).toBe(true);
      expect(engine.getQueue()).toHaveLength(1);
      expect(engine.getQueue()[0]!.recipeId).toBe('recipe_copper_sword');
    });

    it('should deduct materials when queuing a recipe', () => {
      bank.add('mat_copper_ore', 10);

      engine.queueRecipe('recipe_copper_sword');
      // Recipe requires 3 copper ore
      expect(bank.getQuantity('mat_copper_ore')).toBe(7);
    });

    it('should fail if materials are insufficient', () => {
      bank.add('mat_copper_ore', 1); // need 3

      const result = engine.queueRecipe('recipe_copper_sword');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('material');
      expect(engine.getQueue()).toHaveLength(0);
      // Materials should NOT be deducted
      expect(bank.getQuantity('mat_copper_ore')).toBe(1);
    });

    it('should fail if queue is at max capacity', () => {
      bank.add('mat_copper_ore', 200); // enough for many crafts

      // Fill the queue to max (10)
      for (let i = 0; i < 10; i++) {
        const r = engine.queueRecipe('recipe_copper_sword');
        expect(r.success).toBe(true);
      }

      // 11th should fail
      const result = engine.queueRecipe('recipe_copper_sword');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('queue');
      expect(engine.getQueue()).toHaveLength(10);
    });

    it('should fail if recipe is unknown', () => {
      const result = engine.queueRecipe('recipe_nonexistent');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('recipe');
    });

    it('should set correct completesAt time for first queue entry', () => {
      bank.add('mat_copper_ore', 10);

      engine.queueRecipe('recipe_copper_sword');
      const entry = engine.getQueue()[0]!;
      expect(entry.completesAt).toBe(entry.startedAt + 3000);
    });
  });

  // -----------------------------------------------------------------------
  // Processing crafts (update / tick)
  // -----------------------------------------------------------------------

  describe('processing crafts', () => {
    it('should complete a craft after craftTimeMs has elapsed', () => {
      bank.add('mat_copper_ore', 10);
      engine.queueRecipe('recipe_copper_sword');

      // Advance time by the full craft duration
      const results = engine.update(3000);
      expect(results).toHaveLength(1);
      expect(results[0]!.recipeId).toBe('recipe_copper_sword');
      expect(engine.getQueue()).toHaveLength(0);
    });

    it('should NOT complete a craft before craftTimeMs has elapsed', () => {
      bank.add('mat_copper_ore', 10);
      engine.queueRecipe('recipe_copper_sword');

      // Advance by less than craft time
      const results = engine.update(2999);
      expect(results).toHaveLength(0);
      expect(engine.getQueue()).toHaveLength(1);
    });

    it('should produce output item in the crafting result', () => {
      bank.add('mat_copper_ore', 10);
      engine.queueRecipe('recipe_copper_sword');

      const results = engine.update(3000);
      expect(results[0]!.outputItemId).toBe('item_copper_sword');
    });

    it('should produce consumable effect for consumable recipes', () => {
      bank.add('mat_copper_ore', 10);
      profState.professionId = ProfessionId.Alchemy;
      profState.knownRecipes.push('recipe_healing_potion');

      engine.queueRecipe('recipe_healing_potion');
      const results = engine.update(2000);
      expect(results[0]!.consumableEffect).toBeDefined();
      expect(results[0]!.consumableEffect!.id).toBe('effect_heal_minor');
    });

    it('should roll skill-up on craft completion', () => {
      bank.add('mat_copper_ore', 10);
      // skill=1, recipe skillRequired=1 => orange => 100% chance
      rngValue = 0.99; // Should still skill up at 100%

      engine.queueRecipe('recipe_copper_sword');
      const results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(true);
      expect(results[0]!.newSkill).toBe(2);
      expect(profState.skill).toBe(2);
    });

    it('should NOT skill-up when skill is at maxSkill', () => {
      profState.skill = 75;
      profState.maxSkill = 75;
      bank.add('mat_copper_ore', 10);

      engine.queueRecipe('recipe_copper_sword');
      const results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(false);
      expect(results[0]!.newSkill).toBe(75);
    });

    it('should process queue in FIFO order', () => {
      bank.add('mat_copper_ore', 200);
      bank.add('mat_iron_ore', 200);
      profState.skill = 50;
      profState.maxSkill = 300;
      profState.knownRecipes.push('recipe_iron_sword');

      engine.queueRecipe('recipe_copper_sword'); // 3000ms
      engine.queueRecipe('recipe_iron_sword');    // 5000ms

      // First craft completes at 3000ms
      const results1 = engine.update(3000);
      expect(results1).toHaveLength(1);
      expect(results1[0]!.recipeId).toBe('recipe_copper_sword');

      // Second craft starts after first completes, takes 5000ms more
      const results2 = engine.update(5000);
      expect(results2).toHaveLength(1);
      expect(results2[0]!.recipeId).toBe('recipe_iron_sword');
    });

    it('should handle multiple crafts completing in a single update', () => {
      bank.add('mat_copper_ore', 200);

      engine.queueRecipe('recipe_copper_sword'); // 3000ms
      engine.queueRecipe('recipe_copper_sword'); // 3000ms

      // Advance 6000ms -- both should complete
      const results = engine.update(6000);
      expect(results).toHaveLength(2);
      expect(results[0]!.recipeId).toBe('recipe_copper_sword');
      expect(results[1]!.recipeId).toBe('recipe_copper_sword');
    });

    it('should return empty array when queue is empty', () => {
      const results = engine.update(10000);
      expect(results).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Craft time
  // -----------------------------------------------------------------------

  describe('craft time', () => {
    it('should respect recipe craftTimeMs', () => {
      bank.add('mat_copper_ore', 10);

      engine.queueRecipe('recipe_copper_sword');

      // Not done at 2999ms
      expect(engine.update(2999)).toHaveLength(0);
      // Done at 3000ms
      expect(engine.update(1)).toHaveLength(1);
    });

    it('should use different craft times for different recipes', () => {
      bank.add('mat_iron_ore', 10);
      profState.skill = 50;
      profState.maxSkill = 300;
      profState.knownRecipes.push('recipe_iron_sword');

      engine.queueRecipe('recipe_iron_sword'); // 5000ms

      expect(engine.update(4999)).toHaveLength(0);
      expect(engine.update(1)).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Skill-up chances by difficulty color
  // -----------------------------------------------------------------------

  describe('skill-up chances by difficulty', () => {
    it('orange recipe (skillReq >= currentSkill) => 100% skill-up', () => {
      // skill=1, recipe skillRequired=1 => orange
      bank.add('mat_copper_ore', 10);
      rngValue = 0.99; // Even high roll should succeed
      profState.skill = 1;

      engine.queueRecipe('recipe_copper_sword');
      const results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(true);
    });

    it('yellow recipe => 75% skill-up chance', () => {
      // skill=20, recipe skillRequired=1 => currentSkill - recipeReq = 19
      // Since 1 >= 20 - 25 = -5 => yellow
      bank.add('mat_copper_ore', 20);
      profState.skill = 20;
      profState.maxSkill = 300;

      // rng = 0.5 < 0.75 => should skill up
      rngValue = 0.5;
      engine.queueRecipe('recipe_copper_sword');
      let results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(true);

      // rng = 0.80 >= 0.75 => should NOT skill up
      rngValue = 0.80;
      engine.queueRecipe('recipe_copper_sword');
      results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(false);
    });

    it('green recipe => 25% skill-up chance', () => {
      // skill=40, recipe skillRequired=1 => currentSkill - recipeReq = 39
      // 1 >= 40 - 50 = -10 => green (recipeReq >= currentSkill - 50)
      bank.add('mat_copper_ore', 20);
      profState.skill = 40;
      profState.maxSkill = 300;

      // rng = 0.1 < 0.25 => should skill up
      rngValue = 0.1;
      engine.queueRecipe('recipe_copper_sword');
      let results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(true);

      // rng = 0.5 >= 0.25 => should NOT skill up
      rngValue = 0.5;
      engine.queueRecipe('recipe_copper_sword');
      results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(false);
    });

    it('gray recipe => 0% skill-up chance', () => {
      // skill=60, recipe skillRequired=1 => currentSkill - recipeReq = 59
      // 1 < 60 - 50 = 10 => gray
      bank.add('mat_copper_ore', 10);
      profState.skill = 60;
      profState.maxSkill = 300;
      rngValue = 0.0;

      engine.queueRecipe('recipe_copper_sword');
      const results = engine.update(3000);
      expect(results[0]!.skillUp).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Cancel
  // -----------------------------------------------------------------------

  describe('cancel', () => {
    it('should remove recipe from queue', () => {
      bank.add('mat_copper_ore', 20);
      engine.queueRecipe('recipe_copper_sword');
      engine.queueRecipe('recipe_copper_sword');

      expect(engine.getQueue()).toHaveLength(2);

      const result = engine.cancel(0);
      expect(result).toBe(true);
      expect(engine.getQueue()).toHaveLength(1);
    });

    it('should refund materials on cancel', () => {
      bank.add('mat_copper_ore', 10);
      engine.queueRecipe('recipe_copper_sword'); // costs 3
      expect(bank.getQuantity('mat_copper_ore')).toBe(7);

      engine.cancel(0);
      expect(bank.getQuantity('mat_copper_ore')).toBe(10);
    });

    it('should return false for invalid queue index', () => {
      expect(engine.cancel(0)).toBe(false);
      expect(engine.cancel(-1)).toBe(false);
      expect(engine.cancel(99)).toBe(false);
    });

    it('should recalculate completion times when cancelling front of queue', () => {
      bank.add('mat_copper_ore', 200);

      engine.queueRecipe('recipe_copper_sword'); // index 0
      engine.queueRecipe('recipe_copper_sword'); // index 1

      // Cancel the first one -- the second should become active
      engine.cancel(0);
      const queue = engine.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0]!.recipeId).toBe('recipe_copper_sword');
    });
  });

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  describe('serialization', () => {
    it('should serialize and deserialize queue state', () => {
      bank.add('mat_copper_ore', 200);
      engine.queueRecipe('recipe_copper_sword');
      engine.queueRecipe('recipe_copper_sword');

      const serialized = engine.serialize();
      expect(serialized.queue).toHaveLength(2);
      expect(serialized.elapsedMs).toBeDefined();

      // Create a new engine and deserialize
      const newEngine = new CraftingEngine({
        materialBank: bank,
        professionState: profState,
        recipes,
        balanceConfig: defaultBalanceProfessions,
        rng: () => rngValue,
      });
      newEngine.deserialize(serialized);
      expect(newEngine.getQueue()).toHaveLength(2);
    });
  });
});
