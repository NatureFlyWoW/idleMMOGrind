# Phase 2 -- Profession System (Tasks P1-P5)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/profession-system`
**Worktree:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-profession-system\`
**Depends on:** Phase 1 only (no Phase 2 dependencies)
**Design doc:** `docs/plans/phase2/professions.md`

---

## Task P1 -- Shared Types: Professions, Materials, Recipes

**Goal:** Define all TypeScript interfaces and enums for the profession system.

### Step P1.1 -- Add profession enums to `src/shared/types/enums.ts`

```typescript
// ---- Profession IDs ----
export enum ProfessionId {
  // Gathering
  Mining = 'mining',
  Herbalism = 'herbalism',
  Skinning = 'skinning',
  // Crafting
  Blacksmithing = 'blacksmithing',
  Leatherworking = 'leatherworking',
  Tailoring = 'tailoring',
  Alchemy = 'alchemy',
  Enchanting = 'enchanting',
  Engineering = 'engineering',
  // Secondary
  Cooking = 'cooking',
  FirstAid = 'first_aid',
  Fishing = 'fishing',
}

// ---- Profession Type ----
export enum ProfessionType {
  Gathering = 'gathering',
  Crafting = 'crafting',
  Secondary = 'secondary',
}

// ---- Skill Bracket ----
export enum SkillBracket {
  Apprentice = 'apprentice',
  Journeyman = 'journeyman',
  Expert = 'expert',
  Artisan = 'artisan',
  Master = 'master',
  Grandmaster = 'grandmaster',
}

// ---- Recipe Difficulty Color ----
export enum RecipeDifficulty {
  Orange = 'orange',
  Yellow = 'yellow',
  Green = 'green',
  Gray = 'gray',
}

// ---- Material Tier ----
export enum MaterialTier {
  T1 = 1,
  T2 = 2,
  T3 = 3,
  T4 = 4,
  T5 = 5,
  T6 = 6,
}
```

### Step P1.2 -- Create `src/shared/types/profession.ts`

```typescript
import {
  ProfessionId, ProfessionType, SkillBracket, RecipeDifficulty,
  MaterialTier, GearSlot, ItemQuality, PrimaryStat,
} from './enums';

/** Profession definition */
export interface IProfessionDefinition {
  id: ProfessionId;
  name: string;
  type: ProfessionType;
  description: string;
  skillBrackets: ISkillBracket[];
  pairsWith?: ProfessionId;
}

/** Skill bracket thresholds */
export interface ISkillBracket {
  bracket: SkillBracket;
  skillMin: number;
  skillMax: number;
  requiredLevel: number;
  trainingCost: number;
}

/** Material definition */
export interface IMaterial {
  id: string;
  name: string;
  tier: MaterialTier;
  stackSize: number;
  vendorPrice: number;
  source: 'gathering' | 'monster_drop' | 'dungeon_drop' | 'vendor';
  gatheringProfession?: ProfessionId;
}

/** Recipe definition */
export interface IRecipe {
  id: string;
  professionId: ProfessionId;
  name: string;
  skillRequired: number;
  skillUpChance: { orange: number; yellow: number; green: number; gray: number };
  materials: IRecipeMaterial[];
  craftTimeMs: number;
  output: IRecipeOutput;
}

/** Material requirement for a recipe */
export interface IRecipeMaterial {
  materialId: string;
  quantity: number;
}

/** Recipe output */
export interface IRecipeOutput {
  type: 'item' | 'consumable' | 'enchantment';
  itemTemplateId?: string;
  consumableEffect?: IConsumableEffect;
  enchantEffect?: IEnchantEffect;
  quantity: number;
  iLevel?: number;
  quality?: ItemQuality;
}

/** Consumable buff effect */
export interface IConsumableEffect {
  id: string;
  name: string;
  durationMs: number;
  statBonuses: Partial<Record<PrimaryStat, number>>;
  description: string;
}

/** Enchant effect */
export interface IEnchantEffect {
  id: string;
  name: string;
  slot: GearSlot;
  statBonuses: Partial<Record<PrimaryStat, number>>;
  description: string;
}

/** Player profession state */
export interface IProfessionState {
  professionId: ProfessionId;
  skill: number;
  maxSkill: number;
  knownRecipes: string[];
  currentBracket: SkillBracket;
}

/** Material bank entry */
export interface IMaterialBankEntry {
  materialId: string;
  quantity: number;
}

/** Crafting queue entry */
export interface ICraftingQueueEntry {
  recipeId: string;
  startedAt: number;
  completesAt: number;
}

/** Gathering tick result */
export interface IGatheringResult {
  materialId: string;
  quantity: number;
  skillUp: boolean;
}

/** Crafting result */
export interface ICraftingResult {
  recipeId: string;
  outputItemId?: string;
  consumableEffect?: IConsumableEffect;
  skillUp: boolean;
  newSkill: number;
}
```

### Step P1.3 -- Export from barrel and write type tests

Add `export * from './profession';` to `src/shared/types/index.ts`.

**File:** `tests/unit/shared/profession-types.test.ts`

Test enum counts and interface compilation.

### Step P1.4 -- Extend save types

Add to `ISaveData` in `src/shared/types/save.ts`:

```typescript
professions: {
  primary: [IProfessionState, IProfessionState] | [];
  secondary: IProfessionState[];
  materialBank: IMaterialBankEntry[];
  craftingQueue: ICraftingQueueEntry[];
};
```

### Step P1.5 -- Extend balance config

Add to `IBalanceConfig`:

```typescript
professions: {
  gatheringIntervalTicks: number;
  gatheringBaseYield: number;
  gatheringSkillBonusPerPoint: number;
  craftTimeBaseMs: number;
  craftTimeComplexityMultiplier: number;
  maxCraftingQueue: number;
  materialBankSlots: number;
  skillUpChances: Record<RecipeDifficulty, number>;
  bracketThresholds: number[];
};
```

### Step P1.6 -- Run tests, commit

Commit: `feat(types): add profession, material, and recipe interfaces`

---

## Task P2 -- Material System & Gathering Engine

**Goal:** Implement the material bank (storage), gathering tick integration, and material drop system.

### Step P2.1 -- Write material bank tests

**File:** `tests/unit/engine/professions/material-bank.test.ts`

Test cases:
- `addMaterial(id, qty)` adds to existing stack or creates new entry
- Stacks respect `stackSize` limit from material definition
- `removeMaterial(id, qty)` decrements; returns false if insufficient
- `hasMaterials(requirements[])` checks all recipe materials available
- `getQuantity(id)` returns 0 for unknown materials
- Bank capacity limit (100 unique materials)
- Serialize/deserialize for save

### Step P2.2 -- Implement material bank

**File:** `src/engine/professions/material-bank.ts`

Simple in-memory store backed by a `Map<string, number>`. Methods: `add`, `remove`, `has`, `hasMaterials`, `getQuantity`, `getAll`, `serialize`, `deserialize`.

### Step P2.3 -- Write gathering system tests

**File:** `tests/unit/engine/professions/gathering.test.ts`

Test cases:
- Mining produces ore/stone/gems based on zone level and skill
- Herbalism produces herbs/reagents based on zone and skill
- Skinning triggers on beast-type monster kills (not passive ticks)
- Higher skill unlocks higher-tier materials in same zone
- Gathering rate respects `gatheringIntervalTicks` from balance config
- Skill-up roll on successful gather (100% at low relative skill, decreasing)
- No gathering if character has no gathering profession
- Gathering results added to material bank

### Step P2.4 -- Implement gathering system

**File:** `src/engine/professions/gathering-system.ts`

Implements `IGameSystem`. On tick: if enough ticks since last gather, roll for material based on zone level, profession skill, and profession type. For skinning, hooks into monster-kill events instead.

### Step P2.5 -- Write material data file

**File:** `data/materials.json`

Array of `IMaterial` objects. 6 tiers x 3 gathering types = 18 base materials, plus vendor materials, dungeon materials, and monster-drop materials. Total: ~50-60 materials.

### Step P2.6 -- Run tests, commit

Commit: `feat(professions): implement material bank and gathering system`

---

## Task P3 -- Crafting Engine & Skill Progression

**Goal:** Implement the crafting queue, recipe execution, and profession skill progression.

### Step P3.1 -- Write crafting engine tests

**File:** `tests/unit/engine/professions/crafting-engine.test.ts`

Test cases:
- `queueRecipe(recipeId)` adds to queue if materials available and queue not full
- `queueRecipe` fails if materials insufficient
- `queueRecipe` fails if queue at max capacity (10)
- Processing a craft: deducts materials, produces output, rolls skill-up
- Craft time respects recipe `craftTimeMs`
- Skill-up chance based on recipe difficulty color relative to current skill
- Orange = 100%, Yellow = 75%, Green = 25%, Gray = 0%
- Crafted item goes to inventory (or material bank if consumable/enchant material)
- Queue processes items in FIFO order
- Cancel removes recipe from queue and refunds materials

### Step P3.2 -- Implement crafting engine

**File:** `src/engine/professions/crafting-engine.ts`

Manages the crafting queue. On each tick, if current craft timer has elapsed, complete the craft: produce output, roll skill-up, advance queue.

### Step P3.3 -- Write skill progression tests

**File:** `tests/unit/engine/professions/skill-progression.test.ts`

Test cases:
- `getRecipeDifficulty(recipeSkillReq, currentSkill)` returns correct color
- Skill cap increases when bracket training is purchased
- Skill cannot exceed current bracket max
- Training cost scales with bracket level
- Training requires minimum character level

### Step P3.4 -- Implement skill progression

**File:** `src/engine/professions/skill-progression.ts`

Pure functions for difficulty color calculation, skill-up rolls, bracket management.

### Step P3.5 -- Run tests, commit

Commit: `feat(professions): implement crafting engine and skill progression`

---

## Task P4 -- Profession Manager & Game Loop Integration

**Goal:** Create the top-level profession manager that ties gathering, crafting, and skill progression together, and wire it into the game loop.

### Step P4.1 -- Write profession manager tests

**File:** `tests/unit/engine/professions/profession-manager.test.ts`

Test cases:
- `learnProfession(professionId, slot)` assigns to primary slot (max 2)
- Secondary professions are auto-learned (all 3)
- Cannot learn a third primary profession without unlearning one
- `unlearnProfession(slot)` resets skill and recipes
- `getActiveProfessions()` returns current primary + secondary
- Gathering integration: manager delegates to gathering system
- Crafting integration: manager delegates to crafting engine
- Full save/load round-trip preserves all profession state
- Event emission: `material_gathered`, `recipe_learned`, `item_crafted`, `skill_up`

### Step P4.2 -- Implement profession manager

**File:** `src/engine/professions/profession-manager.ts`

Top-level orchestrator. Owns the `MaterialBank`, `GatheringSystem`, and `CraftingEngine`. Implements `IGameSystem` — delegates tick updates to gathering and crafting subsystems.

### Step P4.3 -- Wire into game loop

Modify `src/engine/worker-entry.ts`:
- Create and register `ProfessionManager` with the `GameLoop`
- Wire monster-kill events to skinning trigger
- Wire gathering results to material bank
- Include profession state in `IGameStateSnapshot`

### Step P4.4 -- Update offline calculator

Modify `src/engine/offline/offline-calculator.ts`:
- Estimate materials gathered during offline period (based on gathering rate * offline seconds)
- Estimate crafting queue progress (if items were queued)

### Step P4.5 -- Run tests, commit

Commit: `feat(professions): wire profession manager into game loop and offline calculator`

---

## Task P5 -- Profession Data Files (Definitions & Recipes)

**Goal:** Create all profession definition and recipe data files.

### Step P5.1 -- Create profession definitions

**File:** `data/professions/definitions.json`

Array of 12 `IProfessionDefinition` objects (3 gathering + 6 crafting + 3 secondary). Each includes skill bracket thresholds, training costs, and pairing info.

### Step P5.2 -- Create recipe files

**Files:** One per profession:
- `data/professions/recipes/blacksmithing.json` (~55 recipes)
- `data/professions/recipes/leatherworking.json` (~55 recipes)
- `data/professions/recipes/tailoring.json` (~55 recipes)
- `data/professions/recipes/alchemy.json` (~55 recipes)
- `data/professions/recipes/enchanting.json` (~50 recipes)
- `data/professions/recipes/engineering.json` (~45 recipes)
- `data/professions/recipes/cooking.json` (~30 recipes)
- `data/professions/recipes/first_aid.json` (~20 recipes)
- `data/professions/recipes/fishing.json` (~15 recipes)

Each recipe follows `IRecipe` schema. Recipes spread across 6 tiers (8-10 per tier for main professions, fewer for secondary). Crafted gear iLevels are -3 to -5 below equivalent dungeon drops at the same skill bracket.

### Step P5.3 -- Write data validation tests

**File:** `tests/unit/data/profession-data-validation.test.ts`

Test cases:
- All recipes reference valid profession IDs
- All recipe materials reference valid material IDs from `materials.json`
- Skill requirements are within valid range (1-300)
- Recipe output iLevels are appropriate for skill bracket
- No duplicate recipe IDs
- All professions have recipes across all 6 tiers
- Crafted gear iLevels respect the catch-up design (-3 to -5 below dungeon drops)

### Step P5.4 -- Run tests, commit

Commit: `feat(professions): add profession definitions and recipe data files`
