import type {
  IRecipe,
  ICraftingQueueEntry,
  ICraftingResult,
  IProfessionState,
} from '@shared/types/profession';
import type { IBalanceConfig } from '@shared/types/balance';
import type { MaterialBank } from './material-bank';
import { getRecipeDifficulty, rollCraftSkillUp } from './skill-progression';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CraftingEngineConfig {
  materialBank: MaterialBank;
  professionState: IProfessionState;
  recipes: Map<string, IRecipe>;
  balanceConfig: IBalanceConfig['professions'];
  /** Injectable RNG for deterministic testing. Returns [0, 1). */
  rng?: () => number;
}

export interface QueueResult {
  success: boolean;
  reason?: string;
}

export interface CraftingEngineSaveData {
  queue: ICraftingQueueEntry[];
  elapsedMs: number;
}

// ---------------------------------------------------------------------------
// CraftingEngine
// ---------------------------------------------------------------------------

/**
 * Manages the crafting queue for a single profession.
 *
 * This is NOT an IGameSystem -- it is owned and driven by ProfessionManager
 * which calls `update(deltaMs)` on each game tick.
 *
 * On each update, if the current craft timer has elapsed, the craft completes:
 * materials were already deducted at queue time, output is produced, a skill-up
 * roll is made, and the queue advances to the next entry.
 */
export class CraftingEngine {
  private readonly bank: MaterialBank;
  private readonly profState: IProfessionState;
  private readonly recipes: Map<string, IRecipe>;
  private readonly config: IBalanceConfig['professions'];
  private readonly rng: () => number;

  /** Internal queue of pending crafts */
  private queue: ICraftingQueueEntry[] = [];

  /** Accumulated time (ms) on the currently active craft */
  private elapsedMs = 0;

  constructor(opts: CraftingEngineConfig) {
    this.bank = opts.materialBank;
    this.profState = opts.professionState;
    this.recipes = opts.recipes;
    this.config = opts.balanceConfig;
    this.rng = opts.rng ?? Math.random;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Add a recipe to the crafting queue.
   *
   * Validates:
   * 1. Recipe exists in the registry
   * 2. Queue is not at max capacity
   * 3. Materials are available in the material bank
   *
   * On success, materials are deducted immediately and the recipe is appended
   * to the queue.
   */
  queueRecipe(recipeId: string): QueueResult {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) {
      return { success: false, reason: 'Unknown recipe: recipe not found in registry' };
    }

    if (this.queue.length >= this.config.maxCraftingQueue) {
      return { success: false, reason: 'Crafting queue is full: queue at max capacity' };
    }

    if (!this.bank.hasMaterials(recipe.materials)) {
      return { success: false, reason: 'Insufficient material: not enough materials in bank' };
    }

    // Deduct materials immediately
    for (const mat of recipe.materials) {
      this.bank.remove(mat.materialId, mat.quantity);
    }

    // Calculate timing
    const now = Date.now();
    const entry: ICraftingQueueEntry = {
      recipeId,
      startedAt: now,
      completesAt: now + recipe.craftTimeMs,
    };

    this.queue.push(entry);

    return { success: true };
  }

  /**
   * Advance the crafting queue by `deltaMs` milliseconds.
   *
   * Returns an array of completed crafting results (may be 0, 1, or more if
   * multiple crafts finish within the elapsed time).
   */
  update(deltaMs: number): ICraftingResult[] {
    if (this.queue.length === 0) return [];

    const results: ICraftingResult[] = [];
    let remaining = deltaMs;

    while (remaining > 0 && this.queue.length > 0) {
      const current = this.queue[0]!;
      const recipe = this.recipes.get(current.recipeId);

      if (!recipe) {
        // Corrupted entry -- remove it
        this.queue.shift();
        this.elapsedMs = 0;
        continue;
      }

      const timeNeeded = recipe.craftTimeMs - this.elapsedMs;

      if (remaining >= timeNeeded) {
        // Craft completes
        remaining -= timeNeeded;
        this.elapsedMs = 0;
        this.queue.shift();

        const result = this.completeCraft(recipe);
        results.push(result);
      } else {
        // Partial progress
        this.elapsedMs += remaining;
        remaining = 0;
      }
    }

    return results;
  }

  /**
   * Cancel a recipe at the given queue index.
   * Refunds materials to the material bank.
   *
   * @returns true if the cancellation succeeded, false if the index is invalid
   */
  cancel(index: number): boolean {
    if (index < 0 || index >= this.queue.length) return false;

    const entry = this.queue[index]!;
    const recipe = this.recipes.get(entry.recipeId);

    // Remove from queue
    this.queue.splice(index, 1);

    // If we cancelled the front of the queue, reset elapsed time
    if (index === 0) {
      this.elapsedMs = 0;
    }

    // Refund materials
    if (recipe) {
      for (const mat of recipe.materials) {
        this.bank.add(mat.materialId, mat.quantity);
      }
    }

    return true;
  }

  /**
   * Get a read-only copy of the current queue.
   */
  getQueue(): readonly ICraftingQueueEntry[] {
    return [...this.queue];
  }

  /**
   * Serialize the engine state for saving.
   */
  serialize(): CraftingEngineSaveData {
    return {
      queue: [...this.queue],
      elapsedMs: this.elapsedMs,
    };
  }

  /**
   * Restore the engine state from saved data.
   */
  deserialize(data: CraftingEngineSaveData): void {
    this.queue = [...data.queue];
    this.elapsedMs = data.elapsedMs;
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  /**
   * Complete a single craft: produce output, roll skill-up, return result.
   * Materials were already deducted at queue time.
   */
  private completeCraft(recipe: IRecipe): ICraftingResult {
    // Determine difficulty and roll skill-up
    const difficulty = getRecipeDifficulty(recipe.skillRequired, this.profState.skill);
    let skillUp = false;

    if (this.profState.skill < this.profState.maxSkill) {
      skillUp = rollCraftSkillUp(difficulty, this.config, this.rng());
      if (skillUp) {
        this.profState.skill = Math.min(
          this.profState.skill + 1,
          this.profState.maxSkill,
        );
      }
    }

    const result: ICraftingResult = {
      recipeId: recipe.id,
      skillUp,
      newSkill: this.profState.skill,
    };

    // Attach output based on type
    if (recipe.output.type === 'item' && recipe.output.itemTemplateId) {
      result.outputItemId = recipe.output.itemTemplateId;
    } else if (recipe.output.type === 'consumable' && recipe.output.consumableEffect) {
      result.consumableEffect = recipe.output.consumableEffect;
    }

    return result;
  }
}
