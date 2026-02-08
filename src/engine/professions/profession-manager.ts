import type { IGameSystem } from '../systems/game-system';
import type {
  IProfessionDefinition,
  IProfessionState,
  IMaterial,
  IMaterialBankEntry,
  IRecipe,
  ICraftingQueueEntry,
  IGatheringResult,
  ICraftingResult,
} from '@shared/types/profession';
import type { IBalanceConfig } from '@shared/types/balance';
import { ProfessionId, ProfessionType, SkillBracket } from '@shared/types/enums';
import { MaterialBank } from './material-bank';
import { GatheringSystem } from './gathering-system';
import { CraftingEngine, type CraftingEngineSaveData, type QueueResult } from './crafting-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfessionManagerConfig {
  definitions: IProfessionDefinition[];
  materials: IMaterial[];
  recipes: IRecipe[];
  balanceConfig: IBalanceConfig['professions'];
  zoneLevel: number;
  /** Injectable RNG for deterministic testing. Returns [0, 1). */
  rng?: () => number;
}

export interface ProfessionManagerResult {
  success: boolean;
  reason?: string;
}

export interface ProfessionManagerEvent {
  type: string;
  payload: Record<string, unknown>;
}

export interface ActiveProfessions {
  primary: [IProfessionState | null, IProfessionState | null];
  secondary: IProfessionState[];
}

export interface ProfessionManagerSaveData {
  primary: [IProfessionState | null, IProfessionState | null];
  secondary: IProfessionState[];
  materialBank: IMaterialBankEntry[];
  craftingEngines: Record<string, CraftingEngineSaveData>;
}

// ---------------------------------------------------------------------------
// ProfessionManager
// ---------------------------------------------------------------------------

/**
 * Top-level orchestrator for the profession system.
 *
 * Owns the MaterialBank, GatheringSystem, and CraftingEngine instances.
 * Implements IGameSystem and delegates tick updates to gathering and crafting
 * subsystems.
 *
 * Registered with the GameLoop as a single system. On each update():
 *  1. GatheringSystem ticks (passive mining/herbalism)
 *  2. CraftingEngine processes queue for each crafting profession
 */
export class ProfessionManager implements IGameSystem {
  private readonly definitions: Map<ProfessionId, IProfessionDefinition>;
  private readonly allMaterials: IMaterial[];
  private readonly allRecipes: Map<string, IRecipe>;
  private readonly balanceConfig: IBalanceConfig['professions'];
  private readonly rng: () => number;

  private readonly materialBank: MaterialBank;

  /** Primary profession slots: [slot 0, slot 1]. null = empty. */
  private primarySlots: [IProfessionState | null, IProfessionState | null] = [null, null];

  /** Secondary professions (auto-learned, always 3). */
  private secondaryProfessions: IProfessionState[] = [];

  /** GatheringSystem -- recreated when primary professions change. */
  private gatheringSystem: GatheringSystem | null = null;

  /** CraftingEngine per crafting/secondary profession (keyed by ProfessionId). */
  private craftingEngines: Map<string, CraftingEngine> = new Map();

  /** Internal event queue. Drained by the caller. */
  private events: ProfessionManagerEvent[] = [];

  /** Current zone level for gathering tier calculation. */
  private zoneLevel: number;

  constructor(config: ProfessionManagerConfig) {
    this.definitions = new Map(config.definitions.map(d => [d.id, d]));
    this.allMaterials = config.materials;
    this.allRecipes = new Map(config.recipes.map(r => [r.id, r]));
    this.balanceConfig = config.balanceConfig;
    this.rng = config.rng ?? Math.random;
    this.zoneLevel = config.zoneLevel;

    // Build material registry for the bank
    const materialRegistry = new Map<string, IMaterial>();
    for (const mat of config.materials) {
      materialRegistry.set(mat.id, mat);
    }
    this.materialBank = new MaterialBank(materialRegistry, config.balanceConfig.materialBankSlots);

    // Auto-learn secondary professions
    this.initSecondaryProfessions();
  }

  // -----------------------------------------------------------------------
  // IGameSystem
  // -----------------------------------------------------------------------

  update(_state: unknown, deltaMs: number): void {
    // 1. Gathering ticks
    if (this.gatheringSystem) {
      const gatherResult = this.gatheringSystem.tick();
      if (gatherResult) {
        this.events.push({
          type: 'material_gathered',
          payload: {
            materialId: gatherResult.materialId,
            quantity: gatherResult.quantity,
          },
        });
        if (gatherResult.skillUp) {
          const profState = this.findGatheringProfForMaterial(gatherResult.materialId);
          this.events.push({
            type: 'skill_up',
            payload: {
              professionId: profState?.professionId ?? 'unknown',
              newSkill: profState?.skill ?? 0,
            },
          });
        }
      }
    }

    // 2. Crafting queue processing
    for (const [profId, engine] of this.craftingEngines) {
      const results = engine.update(deltaMs);
      for (const result of results) {
        this.events.push({
          type: 'item_crafted',
          payload: {
            recipeId: result.recipeId,
            outputItemId: result.outputItemId ?? null,
            skillUp: result.skillUp,
            newSkill: result.newSkill,
            professionId: profId,
          },
        });
        if (result.skillUp) {
          this.events.push({
            type: 'skill_up',
            payload: {
              professionId: profId,
              newSkill: result.newSkill,
            },
          });
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Learn / Unlearn
  // -----------------------------------------------------------------------

  learnProfession(professionId: ProfessionId, slot: number): ProfessionManagerResult {
    // Validate slot
    if (slot !== 0 && slot !== 1) {
      return { success: false, reason: 'Invalid slot: must be 0 or 1' };
    }

    // Look up definition
    const def = this.definitions.get(professionId);
    if (!def) {
      return { success: false, reason: `Unknown profession: ${professionId}` };
    }

    // Secondary professions cannot be placed in primary slots
    if (def.type === ProfessionType.Secondary) {
      return { success: false, reason: 'Secondary professions cannot be placed in primary slots' };
    }

    // Check if slot is already occupied
    if (this.primarySlots[slot] !== null) {
      return { success: false, reason: `Slot ${slot} is already occupied` };
    }

    // Check if profession is already learned (in any slot)
    if (this.isProfessionLearned(professionId)) {
      return { success: false, reason: `Profession ${professionId} is already learned` };
    }

    // Create initial state
    const state: IProfessionState = {
      professionId,
      skill: 1,
      maxSkill: this.balanceConfig.bracketThresholds[1] ?? 75,
      knownRecipes: [],
      currentBracket: SkillBracket.Apprentice,
    };

    this.primarySlots[slot] = state;

    // Rebuild subsystems
    this.rebuildGatheringSystem();
    this.rebuildCraftingEngines();

    return { success: true };
  }

  unlearnProfession(slot: number): ProfessionManagerResult {
    if (slot !== 0 && slot !== 1) {
      return { success: false, reason: 'Invalid slot: must be 0 or 1' };
    }

    if (this.primarySlots[slot] === null) {
      return { success: false, reason: `Slot ${slot} is already empty` };
    }

    const profId = this.primarySlots[slot]!.professionId;

    // Remove crafting engine for this profession if it exists
    this.craftingEngines.delete(profId);

    // Clear the slot
    this.primarySlots[slot] = null;

    // Rebuild subsystems
    this.rebuildGatheringSystem();
    this.rebuildCraftingEngines();

    return { success: true };
  }

  // -----------------------------------------------------------------------
  // Public API: Queries
  // -----------------------------------------------------------------------

  getActiveProfessions(): ActiveProfessions {
    return {
      primary: [this.primarySlots[0], this.primarySlots[1]],
      secondary: [...this.secondaryProfessions],
    };
  }

  getMaterialBank(): IMaterialBankEntry[] {
    return this.materialBank.getAll();
  }

  getCraftingQueue(professionId: ProfessionId): readonly ICraftingQueueEntry[] {
    const engine = this.craftingEngines.get(professionId);
    if (!engine) return [];
    return engine.getQueue();
  }

  // -----------------------------------------------------------------------
  // Public API: Actions
  // -----------------------------------------------------------------------

  queueRecipe(professionId: ProfessionId, recipeId: string): QueueResult {
    const engine = this.craftingEngines.get(professionId);
    if (!engine) {
      return { success: false, reason: `Profession ${professionId} is not learned or has no crafting engine` };
    }
    return engine.queueRecipe(recipeId);
  }

  cancelRecipe(professionId: ProfessionId, index: number): boolean {
    const engine = this.craftingEngines.get(professionId);
    if (!engine) return false;
    return engine.cancel(index);
  }

  learnRecipe(professionId: ProfessionId, recipeId: string): ProfessionManagerResult {
    // Find the profession state
    const profState = this.findProfessionState(professionId);
    if (!profState) {
      return { success: false, reason: `Profession ${professionId} is not learned` };
    }

    const recipe = this.allRecipes.get(recipeId);
    if (!recipe) {
      return { success: false, reason: `Unknown recipe: ${recipeId}` };
    }

    if (profState.knownRecipes.includes(recipeId)) {
      return { success: false, reason: 'Recipe already known' };
    }

    profState.knownRecipes.push(recipeId);

    this.events.push({
      type: 'recipe_learned',
      payload: {
        professionId,
        recipeId,
      },
    });

    return { success: true };
  }

  /**
   * Add materials directly to the bank (for quest rewards, monster drops, etc.).
   */
  addMaterialToBank(materialId: string, quantity: number): number {
    return this.materialBank.add(materialId, quantity);
  }

  /**
   * Handle a monster kill event. Delegates to the gathering system for skinning.
   */
  onMonsterKill(monsterId: string, monsterLevel: number, isBeast: boolean): IGatheringResult | null {
    if (!this.gatheringSystem) return null;
    const result = this.gatheringSystem.onMonsterKill(monsterId, monsterLevel, isBeast);
    if (result) {
      this.events.push({
        type: 'material_gathered',
        payload: {
          materialId: result.materialId,
          quantity: result.quantity,
        },
      });
      if (result.skillUp) {
        this.events.push({
          type: 'skill_up',
          payload: {
            professionId: ProfessionId.Skinning as string,
            newSkill: this.findProfessionState(ProfessionId.Skinning)?.skill ?? 0,
          },
        });
      }
    }
    return result;
  }

  setZoneLevel(level: number): void {
    this.zoneLevel = level;
    if (this.gatheringSystem) {
      this.gatheringSystem.setZoneLevel(level);
    }
  }

  // -----------------------------------------------------------------------
  // Events
  // -----------------------------------------------------------------------

  drainEvents(): ProfessionManagerEvent[] {
    const drained = this.events;
    this.events = [];
    return drained;
  }

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  serialize(): ProfessionManagerSaveData {
    const craftingEngines: Record<string, CraftingEngineSaveData> = {};
    for (const [profId, engine] of this.craftingEngines) {
      craftingEngines[profId] = engine.serialize();
    }

    return {
      primary: [
        this.primarySlots[0] ? { ...this.primarySlots[0], knownRecipes: [...this.primarySlots[0].knownRecipes] } : null,
        this.primarySlots[1] ? { ...this.primarySlots[1], knownRecipes: [...this.primarySlots[1].knownRecipes] } : null,
      ],
      secondary: this.secondaryProfessions.map(s => ({
        ...s,
        knownRecipes: [...s.knownRecipes],
      })),
      materialBank: this.materialBank.serialize(),
      craftingEngines,
    };
  }

  deserialize(data: ProfessionManagerSaveData): void {
    // Restore primary slots
    this.primarySlots = [
      data.primary[0] ? { ...data.primary[0], knownRecipes: [...data.primary[0].knownRecipes] } : null,
      data.primary[1] ? { ...data.primary[1], knownRecipes: [...data.primary[1].knownRecipes] } : null,
    ];

    // Restore secondary professions
    this.secondaryProfessions = data.secondary.map(s => ({
      ...s,
      knownRecipes: [...s.knownRecipes],
    }));

    // Restore material bank
    this.materialBank.deserialize(data.materialBank);

    // Rebuild subsystems
    this.rebuildGatheringSystem();
    this.rebuildCraftingEngines();

    // Restore crafting engine state
    for (const [profId, engineData] of Object.entries(data.craftingEngines)) {
      const engine = this.craftingEngines.get(profId);
      if (engine) {
        engine.deserialize(engineData);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Private
  // -----------------------------------------------------------------------

  private initSecondaryProfessions(): void {
    this.secondaryProfessions = [];
    for (const [, def] of this.definitions) {
      if (def.type === ProfessionType.Secondary) {
        this.secondaryProfessions.push({
          professionId: def.id,
          skill: 1,
          maxSkill: this.balanceConfig.bracketThresholds[1] ?? 75,
          knownRecipes: [],
          currentBracket: SkillBracket.Apprentice,
        });
      }
    }
  }

  private isProfessionLearned(professionId: ProfessionId): boolean {
    if (this.primarySlots[0]?.professionId === professionId) return true;
    if (this.primarySlots[1]?.professionId === professionId) return true;
    return this.secondaryProfessions.some(p => p.professionId === professionId);
  }

  private findProfessionState(professionId: ProfessionId): IProfessionState | null {
    if (this.primarySlots[0]?.professionId === professionId) return this.primarySlots[0];
    if (this.primarySlots[1]?.professionId === professionId) return this.primarySlots[1];
    const sec = this.secondaryProfessions.find(p => p.professionId === professionId);
    return sec ?? null;
  }

  private findGatheringProfForMaterial(materialId: string): IProfessionState | null {
    const mat = this.allMaterials.find(m => m.id === materialId);
    if (!mat || !mat.gatheringProfession) return null;
    return this.findProfessionState(mat.gatheringProfession);
  }

  private rebuildGatheringSystem(): void {
    // Collect all gathering profession states
    const gatheringProfessions: IProfessionState[] = [];
    for (const slot of this.primarySlots) {
      if (slot) {
        const def = this.definitions.get(slot.professionId);
        if (def && def.type === ProfessionType.Gathering) {
          gatheringProfessions.push(slot);
        }
      }
    }

    if (gatheringProfessions.length === 0) {
      this.gatheringSystem = null;
      return;
    }

    this.gatheringSystem = new GatheringSystem({
      materialBank: this.materialBank,
      professions: gatheringProfessions,
      allMaterials: this.allMaterials,
      balanceConfig: this.balanceConfig,
      zoneLevel: this.zoneLevel,
      rng: this.rng,
    });
  }

  private rebuildCraftingEngines(): void {
    const oldEngines = new Map(this.craftingEngines);
    this.craftingEngines = new Map();

    // Build crafting engines for primary crafting professions
    for (const slot of this.primarySlots) {
      if (slot) {
        const def = this.definitions.get(slot.professionId);
        if (def && def.type === ProfessionType.Crafting) {
          this.getOrCreateCraftingEngine(slot, oldEngines);
        }
      }
    }

    // Build crafting engines for secondary professions
    for (const sec of this.secondaryProfessions) {
      this.getOrCreateCraftingEngine(sec, oldEngines);
    }
  }

  private getOrCreateCraftingEngine(
    profState: IProfessionState,
    oldEngines: Map<string, CraftingEngine>,
  ): void {
    // Preserve existing engine state if possible
    const existing = oldEngines.get(profState.professionId);
    if (existing) {
      this.craftingEngines.set(profState.professionId, existing);
      return;
    }

    // Filter recipes for this profession
    const profRecipes = new Map<string, IRecipe>();
    for (const [id, recipe] of this.allRecipes) {
      if (recipe.professionId === profState.professionId) {
        profRecipes.set(id, recipe);
      }
    }

    const engine = new CraftingEngine({
      materialBank: this.materialBank,
      professionState: profState,
      recipes: profRecipes,
      balanceConfig: this.balanceConfig,
      rng: this.rng,
    });

    this.craftingEngines.set(profState.professionId, engine);
  }
}
