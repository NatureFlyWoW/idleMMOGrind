import { describe, it, expect } from 'vitest';
import {
  ProfessionId,
  ProfessionType,
  SkillBracket,
  RecipeDifficulty,
  MaterialTier,
  GearSlot,
  ItemQuality,
  PrimaryStat,
} from '@shared/types/enums';
import type {
  IProfessionDefinition,
  ISkillBracket,
  IRecipe,
  IRecipeMaterial,
  IRecipeOutput,
  IConsumableEffect,
  IEnchantEffect,
  IProfessionState,
  IMaterial,
  IMaterialBankEntry,
  ICraftingQueueEntry,
  IGatheringResult,
  ICraftingResult,
} from '@shared/types/profession';

// ---- ProfessionId ----

describe('ProfessionId enum', () => {
  it('should have exactly 12 values', () => {
    expect(Object.values(ProfessionId)).toHaveLength(12);
  });

  it('should contain gathering professions', () => {
    expect(ProfessionId.Mining).toBe('mining');
    expect(ProfessionId.Herbalism).toBe('herbalism');
    expect(ProfessionId.Skinning).toBe('skinning');
  });

  it('should contain crafting professions', () => {
    expect(ProfessionId.Blacksmithing).toBe('blacksmithing');
    expect(ProfessionId.Leatherworking).toBe('leatherworking');
    expect(ProfessionId.Tailoring).toBe('tailoring');
    expect(ProfessionId.Alchemy).toBe('alchemy');
    expect(ProfessionId.Enchanting).toBe('enchanting');
    expect(ProfessionId.Engineering).toBe('engineering');
  });

  it('should contain secondary professions', () => {
    expect(ProfessionId.Cooking).toBe('cooking');
    expect(ProfessionId.FirstAid).toBe('first_aid');
    expect(ProfessionId.Fishing).toBe('fishing');
  });
});

// ---- ProfessionType ----

describe('ProfessionType enum', () => {
  it('should have exactly 3 values', () => {
    expect(Object.values(ProfessionType)).toHaveLength(3);
  });

  it('should contain all profession types', () => {
    expect(ProfessionType.Gathering).toBe('gathering');
    expect(ProfessionType.Crafting).toBe('crafting');
    expect(ProfessionType.Secondary).toBe('secondary');
  });
});

// ---- SkillBracket ----

describe('SkillBracket enum', () => {
  it('should have exactly 6 values', () => {
    expect(Object.values(SkillBracket)).toHaveLength(6);
  });

  it('should contain all skill brackets in progression order', () => {
    expect(SkillBracket.Apprentice).toBe('apprentice');
    expect(SkillBracket.Journeyman).toBe('journeyman');
    expect(SkillBracket.Expert).toBe('expert');
    expect(SkillBracket.Artisan).toBe('artisan');
    expect(SkillBracket.Master).toBe('master');
    expect(SkillBracket.Grandmaster).toBe('grandmaster');
  });
});

// ---- RecipeDifficulty ----

describe('RecipeDifficulty enum', () => {
  it('should have exactly 4 values', () => {
    expect(Object.values(RecipeDifficulty)).toHaveLength(4);
  });

  it('should contain all difficulty colors', () => {
    expect(RecipeDifficulty.Orange).toBe('orange');
    expect(RecipeDifficulty.Yellow).toBe('yellow');
    expect(RecipeDifficulty.Green).toBe('green');
    expect(RecipeDifficulty.Gray).toBe('gray');
  });
});

// ---- MaterialTier ----

describe('MaterialTier enum', () => {
  it('should have exactly 6 values', () => {
    // Numeric enums produce both forward and reverse mappings,
    // so filter to numeric values only.
    const numericValues = Object.values(MaterialTier).filter(
      (v) => typeof v === 'number',
    );
    expect(numericValues).toHaveLength(6);
  });

  it('should map T1 through T6 to numbers 1 through 6', () => {
    expect(MaterialTier.T1).toBe(1);
    expect(MaterialTier.T2).toBe(2);
    expect(MaterialTier.T3).toBe(3);
    expect(MaterialTier.T4).toBe(4);
    expect(MaterialTier.T5).toBe(5);
    expect(MaterialTier.T6).toBe(6);
  });
});

// ---- IProfessionDefinition interface ----

describe('IProfessionDefinition interface', () => {
  it('should compile with a valid profession definition object', () => {
    const blacksmithing: IProfessionDefinition = {
      id: ProfessionId.Blacksmithing,
      name: 'Blacksmithing',
      type: ProfessionType.Crafting,
      description: 'Forge weapons and plate armor from metal bars.',
      skillBrackets: [
        {
          bracket: SkillBracket.Apprentice,
          skillMin: 0,
          skillMax: 75,
          requiredLevel: 5,
          trainingCost: 10,
        },
        {
          bracket: SkillBracket.Journeyman,
          skillMin: 50,
          skillMax: 150,
          requiredLevel: 10,
          trainingCost: 50,
        },
      ],
      pairsWith: ProfessionId.Mining,
    };

    expect(blacksmithing.id).toBe(ProfessionId.Blacksmithing);
    expect(blacksmithing.type).toBe(ProfessionType.Crafting);
    expect(blacksmithing.skillBrackets).toHaveLength(2);
    expect(blacksmithing.pairsWith).toBe(ProfessionId.Mining);
  });

  it('should allow pairsWith to be omitted', () => {
    const cooking: IProfessionDefinition = {
      id: ProfessionId.Cooking,
      name: 'Cooking',
      type: ProfessionType.Secondary,
      description: 'Prepare food that grants stat buffs.',
      skillBrackets: [],
    };

    expect(cooking.pairsWith).toBeUndefined();
  });
});

// ---- IRecipe interface ----

describe('IRecipe interface', () => {
  it('should compile with a valid recipe object', () => {
    const recipe: IRecipe = {
      id: 'recipe-copper-sword',
      professionId: ProfessionId.Blacksmithing,
      name: 'Copper Sword',
      skillRequired: 25,
      skillUpChance: { orange: 1.0, yellow: 0.75, green: 0.25, gray: 0 },
      materials: [
        { materialId: 'mat-copper-bar', quantity: 4 },
        { materialId: 'mat-rough-stone', quantity: 1 },
      ],
      craftTimeMs: 3000,
      output: {
        type: 'item',
        itemTemplateId: 'item-copper-sword',
        quantity: 1,
        iLevel: 10,
        quality: ItemQuality.Common,
      },
    };

    expect(recipe.id).toBe('recipe-copper-sword');
    expect(recipe.professionId).toBe(ProfessionId.Blacksmithing);
    expect(recipe.materials).toHaveLength(2);
    expect(recipe.output.type).toBe('item');
    expect(recipe.output.quality).toBe(ItemQuality.Common);
  });

  it('should compile with a consumable output recipe', () => {
    const recipe: IRecipe = {
      id: 'recipe-health-potion',
      professionId: ProfessionId.Alchemy,
      name: 'Minor Health Potion',
      skillRequired: 1,
      skillUpChance: { orange: 1.0, yellow: 0.75, green: 0.25, gray: 0 },
      materials: [{ materialId: 'mat-peacebloom', quantity: 2 }],
      craftTimeMs: 2000,
      output: {
        type: 'consumable',
        consumableEffect: {
          id: 'effect-minor-health',
          name: 'Minor Health Potion',
          durationMs: 0,
          statBonuses: { [PrimaryStat.Stamina]: 5 },
          description: 'Restores a small amount of health.',
        },
        quantity: 1,
      },
    };

    expect(recipe.output.type).toBe('consumable');
    expect(recipe.output.consumableEffect).toBeDefined();
    expect(recipe.output.consumableEffect!.statBonuses[PrimaryStat.Stamina]).toBe(5);
  });

  it('should compile with an enchantment output recipe', () => {
    const recipe: IRecipe = {
      id: 'recipe-enchant-weapon-minor-str',
      professionId: ProfessionId.Enchanting,
      name: 'Enchant Weapon - Minor Strength',
      skillRequired: 50,
      skillUpChance: { orange: 1.0, yellow: 0.75, green: 0.25, gray: 0 },
      materials: [{ materialId: 'mat-strange-dust', quantity: 4 }],
      craftTimeMs: 4000,
      output: {
        type: 'enchantment',
        enchantEffect: {
          id: 'ench-minor-str',
          name: 'Minor Strength',
          slot: GearSlot.MainHand,
          statBonuses: { [PrimaryStat.Strength]: 3 },
          description: 'Adds 3 Strength to a weapon.',
        },
        quantity: 1,
      },
    };

    expect(recipe.output.type).toBe('enchantment');
    expect(recipe.output.enchantEffect).toBeDefined();
    expect(recipe.output.enchantEffect!.slot).toBe(GearSlot.MainHand);
  });
});

// ---- IProfessionState interface ----

describe('IProfessionState interface', () => {
  it('should compile with a valid profession state object', () => {
    const state: IProfessionState = {
      professionId: ProfessionId.Mining,
      skill: 45,
      maxSkill: 75,
      knownRecipes: ['recipe-smelt-copper'],
      currentBracket: SkillBracket.Apprentice,
    };

    expect(state.professionId).toBe(ProfessionId.Mining);
    expect(state.skill).toBe(45);
    expect(state.maxSkill).toBe(75);
    expect(state.knownRecipes).toHaveLength(1);
    expect(state.currentBracket).toBe(SkillBracket.Apprentice);
  });
});

// ---- IMaterial interface ----

describe('IMaterial interface', () => {
  it('should compile with a valid material object', () => {
    const material: IMaterial = {
      id: 'mat-copper-ore',
      name: 'Copper Ore',
      tier: MaterialTier.T1,
      stackSize: 20,
      vendorPrice: 2,
      source: 'gathering',
      gatheringProfession: ProfessionId.Mining,
    };

    expect(material.id).toBe('mat-copper-ore');
    expect(material.tier).toBe(MaterialTier.T1);
    expect(material.source).toBe('gathering');
    expect(material.gatheringProfession).toBe(ProfessionId.Mining);
  });

  it('should allow gatheringProfession to be omitted for non-gathering materials', () => {
    const material: IMaterial = {
      id: 'mat-ruined-leather',
      name: 'Ruined Leather Scraps',
      tier: MaterialTier.T1,
      stackSize: 20,
      vendorPrice: 1,
      source: 'monster_drop',
    };

    expect(material.gatheringProfession).toBeUndefined();
  });
});

// ---- IMaterialBankEntry interface ----

describe('IMaterialBankEntry interface', () => {
  it('should compile with a valid bank entry', () => {
    const entry: IMaterialBankEntry = {
      materialId: 'mat-copper-ore',
      quantity: 15,
    };

    expect(entry.materialId).toBe('mat-copper-ore');
    expect(entry.quantity).toBe(15);
  });
});

// ---- ICraftingQueueEntry interface ----

describe('ICraftingQueueEntry interface', () => {
  it('should compile with a valid queue entry', () => {
    const entry: ICraftingQueueEntry = {
      recipeId: 'recipe-copper-sword',
      startedAt: 1000,
      completesAt: 4000,
    };

    expect(entry.recipeId).toBe('recipe-copper-sword');
    expect(entry.completesAt - entry.startedAt).toBe(3000);
  });
});

// ---- IGatheringResult interface ----

describe('IGatheringResult interface', () => {
  it('should compile with a valid gathering result', () => {
    const result: IGatheringResult = {
      materialId: 'mat-copper-ore',
      quantity: 1,
      skillUp: true,
    };

    expect(result.materialId).toBe('mat-copper-ore');
    expect(result.skillUp).toBe(true);
  });
});

// ---- ICraftingResult interface ----

describe('ICraftingResult interface', () => {
  it('should compile with a valid crafting result', () => {
    const result: ICraftingResult = {
      recipeId: 'recipe-copper-sword',
      outputItemId: 'item-copper-sword-001',
      skillUp: true,
      newSkill: 26,
    };

    expect(result.recipeId).toBe('recipe-copper-sword');
    expect(result.outputItemId).toBe('item-copper-sword-001');
    expect(result.skillUp).toBe(true);
    expect(result.newSkill).toBe(26);
  });

  it('should allow outputItemId to be omitted for consumable/enchant results', () => {
    const result: ICraftingResult = {
      recipeId: 'recipe-health-potion',
      consumableEffect: {
        id: 'effect-minor-health',
        name: 'Minor Health Potion',
        durationMs: 0,
        statBonuses: {},
        description: 'Restores a small amount of health.',
      },
      skillUp: false,
      newSkill: 10,
    };

    expect(result.outputItemId).toBeUndefined();
    expect(result.consumableEffect).toBeDefined();
  });
});
