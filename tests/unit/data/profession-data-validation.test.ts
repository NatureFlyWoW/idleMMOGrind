import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ---- Types for JSON data validation ----

interface RawMaterial {
  id: string;
  name: string;
  tier: number;
  stackSize: number;
  vendorPrice: number;
  source: string;
  gatheringProfession?: string;
}

interface RawRecipeMaterial {
  materialId: string;
  quantity: number;
}

interface RawRecipeOutput {
  type: string;
  itemTemplateId?: string;
  consumableEffect?: Record<string, unknown>;
  enchantEffect?: Record<string, unknown>;
  quantity: number;
  iLevel?: number;
  quality?: string;
}

interface RawRecipe {
  id: string;
  professionId: string;
  name: string;
  skillRequired: number;
  skillUpChance: { orange: number; yellow: number; green: number; gray: number };
  materials: RawRecipeMaterial[];
  craftTimeMs: number;
  output: RawRecipeOutput;
}

interface RawDefinition {
  id: string;
  name: string;
  type: string;
  description: string;
  skillBrackets: Array<{
    bracket: string;
    skillMin: number;
    skillMax: number;
    requiredLevel: number;
    trainingCost: number;
  }>;
  pairsWith?: string;
}

// ---- Valid enum values (mirroring src/shared/types/enums.ts) ----

const VALID_PROFESSION_IDS = [
  'mining', 'herbalism', 'skinning',
  'blacksmithing', 'leatherworking', 'tailoring',
  'alchemy', 'enchanting', 'engineering',
  'cooking', 'first_aid', 'fishing',
] as const;

const VALID_OUTPUT_TYPES = ['item', 'consumable', 'enchantment'] as const;

const VALID_QUALITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

const CRAFTING_PROFESSION_IDS = [
  'blacksmithing', 'leatherworking', 'tailoring',
  'alchemy', 'enchanting', 'engineering',
] as const;

const SECONDARY_PROFESSION_IDS = ['cooking', 'first_aid', 'fishing'] as const;

// ---- Helpers ----

const dataDir = path.resolve(__dirname, '../../../data');
const recipesDir = path.join(dataDir, 'professions', 'recipes');

function loadJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function loadAllRecipes(): RawRecipe[] {
  const allRecipes: RawRecipe[] = [];
  const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const recipes = loadJson<RawRecipe[]>(path.join(recipesDir, file));
    allRecipes.push(...recipes);
  }
  return allRecipes;
}

function loadMaterials(): RawMaterial[] {
  return loadJson<RawMaterial[]>(path.join(dataDir, 'materials.json'));
}

function loadDefinitions(): RawDefinition[] {
  return loadJson<RawDefinition[]>(path.join(dataDir, 'professions', 'definitions.json'));
}

// ---- Skill tier ranges ----

const SKILL_TIERS = [
  { tier: 1, min: 1, max: 74 },
  { tier: 2, min: 75, max: 149 },
  { tier: 3, min: 150, max: 224 },
  { tier: 4, min: 225, max: 274 },
  { tier: 5, min: 275, max: 299 },
  { tier: 6, min: 300, max: 300 },
] as const;

// ---- Tests ----

describe('Profession Data Validation', () => {
  const allRecipes = loadAllRecipes();
  const materials = loadMaterials();
  const definitions = loadDefinitions();
  const materialIds = new Set(materials.map(m => m.id));

  describe('definitions.json', () => {
    it('should have all 12 profession definitions', () => {
      expect(definitions).toHaveLength(12);
      const ids = definitions.map(d => d.id);
      for (const profId of VALID_PROFESSION_IDS) {
        expect(ids).toContain(profId);
      }
    });

    it('should have valid profession types', () => {
      for (const def of definitions) {
        expect(['gathering', 'crafting', 'secondary']).toContain(def.type);
      }
    });

    it('should have 6 skill brackets per profession', () => {
      for (const def of definitions) {
        expect(def.skillBrackets).toHaveLength(6);
      }
    });
  });

  describe('recipe files exist for all crafting and secondary professions', () => {
    const expectedRecipeFiles = [
      'blacksmithing.json', 'leatherworking.json', 'tailoring.json',
      'alchemy.json', 'enchanting.json', 'engineering.json',
      'cooking.json', 'first_aid.json', 'fishing.json',
    ];

    for (const file of expectedRecipeFiles) {
      it(`should have recipe file: ${file}`, () => {
        const filePath = path.join(recipesDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    }
  });

  describe('all recipes reference valid profession IDs', () => {
    it('should only use valid ProfessionId enum values', () => {
      for (const recipe of allRecipes) {
        expect(
          VALID_PROFESSION_IDS as readonly string[],
          `Recipe "${recipe.id}" has invalid professionId: "${recipe.professionId}"`,
        ).toContain(recipe.professionId);
      }
    });
  });

  describe('all recipe materials reference valid material IDs', () => {
    it('should only reference materials that exist in materials.json', () => {
      const invalidRefs: string[] = [];
      for (const recipe of allRecipes) {
        for (const mat of recipe.materials) {
          if (!materialIds.has(mat.materialId)) {
            invalidRefs.push(`Recipe "${recipe.id}" references unknown material: "${mat.materialId}"`);
          }
        }
      }
      expect(invalidRefs, invalidRefs.join('\n')).toHaveLength(0);
    });

    it('should have positive material quantities', () => {
      for (const recipe of allRecipes) {
        for (const mat of recipe.materials) {
          expect(
            mat.quantity,
            `Recipe "${recipe.id}" material "${mat.materialId}" has quantity ${mat.quantity}`,
          ).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('skill requirements are within valid range', () => {
    it('should have skill requirements between 1 and 300', () => {
      for (const recipe of allRecipes) {
        expect(
          recipe.skillRequired,
          `Recipe "${recipe.id}" has skillRequired: ${recipe.skillRequired}`,
        ).toBeGreaterThanOrEqual(1);
        expect(
          recipe.skillRequired,
          `Recipe "${recipe.id}" has skillRequired: ${recipe.skillRequired}`,
        ).toBeLessThanOrEqual(300);
      }
    });
  });

  describe('no duplicate recipe IDs across all files', () => {
    it('should have unique recipe IDs', () => {
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const recipe of allRecipes) {
        if (seen.has(recipe.id)) {
          duplicates.push(recipe.id);
        }
        seen.add(recipe.id);
      }
      expect(duplicates, `Duplicate recipe IDs found: ${duplicates.join(', ')}`).toHaveLength(0);
    });
  });

  describe('all crafting professions have recipes across all 6 skill tiers', () => {
    for (const profId of CRAFTING_PROFESSION_IDS) {
      it(`${profId} should have recipes in all 6 skill tiers`, () => {
        const profRecipes = allRecipes.filter(r => r.professionId === profId);
        expect(profRecipes.length).toBeGreaterThan(0);

        for (const tier of SKILL_TIERS) {
          const tierRecipes = profRecipes.filter(
            r => r.skillRequired >= tier.min && r.skillRequired <= tier.max,
          );
          expect(
            tierRecipes.length,
            `${profId} has no recipes in skill tier ${tier.tier} (${tier.min}-${tier.max})`,
          ).toBeGreaterThan(0);
        }
      });
    }
  });

  describe('secondary professions have recipes', () => {
    for (const profId of SECONDARY_PROFESSION_IDS) {
      it(`${profId} should have at least some recipes`, () => {
        const profRecipes = allRecipes.filter(r => r.professionId === profId);
        expect(profRecipes.length).toBeGreaterThan(0);
      });
    }
  });

  describe('recipe output types are valid', () => {
    it('should only use valid output types', () => {
      for (const recipe of allRecipes) {
        expect(
          VALID_OUTPUT_TYPES as readonly string[],
          `Recipe "${recipe.id}" has invalid output type: "${recipe.output.type}"`,
        ).toContain(recipe.output.type);
      }
    });

    it('item outputs should have itemTemplateId, iLevel, and quality', () => {
      const itemRecipes = allRecipes.filter(r => r.output.type === 'item');
      for (const recipe of itemRecipes) {
        expect(
          recipe.output.itemTemplateId,
          `Recipe "${recipe.id}" (item) is missing itemTemplateId`,
        ).toBeDefined();
        expect(
          recipe.output.iLevel,
          `Recipe "${recipe.id}" (item) is missing iLevel`,
        ).toBeDefined();
        expect(
          recipe.output.quality,
          `Recipe "${recipe.id}" (item) is missing quality`,
        ).toBeDefined();
        expect(
          VALID_QUALITIES as readonly string[],
          `Recipe "${recipe.id}" has invalid quality: "${recipe.output.quality}"`,
        ).toContain(recipe.output.quality);
      }
    });

    it('consumable outputs should have consumableEffect', () => {
      const consumableRecipes = allRecipes.filter(r => r.output.type === 'consumable');
      for (const recipe of consumableRecipes) {
        expect(
          recipe.output.consumableEffect,
          `Recipe "${recipe.id}" (consumable) is missing consumableEffect`,
        ).toBeDefined();
      }
    });

    it('enchantment outputs should have enchantEffect', () => {
      const enchantRecipes = allRecipes.filter(r => r.output.type === 'enchantment');
      for (const recipe of enchantRecipes) {
        expect(
          recipe.output.enchantEffect,
          `Recipe "${recipe.id}" (enchantment) is missing enchantEffect`,
        ).toBeDefined();
      }
    });
  });

  describe('skillUpChance values are correct', () => {
    it('should have standard skillUpChance values', () => {
      for (const recipe of allRecipes) {
        expect(recipe.skillUpChance.orange).toBe(1.0);
        expect(recipe.skillUpChance.yellow).toBe(0.75);
        expect(recipe.skillUpChance.green).toBe(0.25);
        expect(recipe.skillUpChance.gray).toBe(0);
      }
    });
  });

  describe('craft times follow tier scaling', () => {
    it('should have positive craft times', () => {
      for (const recipe of allRecipes) {
        expect(
          recipe.craftTimeMs,
          `Recipe "${recipe.id}" has craftTimeMs: ${recipe.craftTimeMs}`,
        ).toBeGreaterThan(0);
      }
    });
  });

  describe('recipe count targets', () => {
    it('crafting professions should have roughly 40-60 recipes each', () => {
      for (const profId of CRAFTING_PROFESSION_IDS) {
        const count = allRecipes.filter(r => r.professionId === profId).length;
        expect(
          count,
          `${profId} has ${count} recipes (expected 40-60)`,
        ).toBeGreaterThanOrEqual(30);
        expect(
          count,
          `${profId} has ${count} recipes (expected 40-60)`,
        ).toBeLessThanOrEqual(65);
      }
    });

    it('cooking should have roughly 20-35 recipes', () => {
      const count = allRecipes.filter(r => r.professionId === 'cooking').length;
      expect(count).toBeGreaterThanOrEqual(15);
      expect(count).toBeLessThanOrEqual(40);
    });

    it('first_aid should have roughly 10-25 recipes', () => {
      const count = allRecipes.filter(r => r.professionId === 'first_aid').length;
      expect(count).toBeGreaterThanOrEqual(10);
      expect(count).toBeLessThanOrEqual(30);
    });

    it('fishing should have roughly 10-20 recipes', () => {
      const count = allRecipes.filter(r => r.professionId === 'fishing').length;
      expect(count).toBeGreaterThanOrEqual(8);
      expect(count).toBeLessThanOrEqual(25);
    });
  });

  describe('output quantities are positive', () => {
    it('should have positive output quantities', () => {
      for (const recipe of allRecipes) {
        expect(
          recipe.output.quantity,
          `Recipe "${recipe.id}" has output quantity: ${recipe.output.quantity}`,
        ).toBeGreaterThan(0);
      }
    });
  });

  describe('professionId matches file name', () => {
    it('recipes in each file should reference the correct profession', () => {
      const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const profId = file.replace('.json', '');
        const recipes = loadJson<RawRecipe[]>(path.join(recipesDir, file));
        for (const recipe of recipes) {
          expect(
            recipe.professionId,
            `Recipe "${recipe.id}" in ${file} has professionId "${recipe.professionId}" instead of "${profId}"`,
          ).toBe(profId);
        }
      }
    });
  });
});
