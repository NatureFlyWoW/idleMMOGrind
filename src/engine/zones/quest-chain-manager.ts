import type {
  IQuestChain,
  IQuestChainProgress,
  IQuestObjective,
} from '@shared/types/zone-expansion';
import type { EventBus } from '@engine/events/event-bus';
import { EngineEventType } from '@shared/types/ipc';

/**
 * Manages quest chain progression.
 *
 * Not an IGameSystem itself -- called by other systems when relevant events
 * happen (monster kills, dungeon clears, exploration triggers, etc.).
 *
 * Objective progress is tracked using composite keys `${objectiveType}:${targetId}`.
 */
export class QuestChainManager {
  private chains: Map<string, IQuestChain> = new Map();
  private progress: Map<string, IQuestChainProgress> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /** Index chain definitions by id for fast lookup. */
  loadChains(chains: ReadonlyArray<IQuestChain>): void {
    for (const chain of chains) {
      this.chains.set(chain.id, chain);
    }
  }

  /**
   * Begin a quest chain. Creates a progress entry at quest index 0.
   * Returns false if the chain id is unknown, already in progress, or
   * already completed.
   */
  startChain(chainId: string): boolean {
    if (!this.chains.has(chainId)) {
      return false;
    }

    const existing = this.progress.get(chainId);
    if (existing) {
      // Already in progress or completed
      return false;
    }

    this.progress.set(chainId, {
      chainId,
      currentQuestIndex: 0,
      currentObjectiveProgress: {},
      completed: false,
    });

    return true;
  }

  /**
   * Record progress toward an objective in the current quest of a chain.
   *
   * @param chainId  - The quest chain id.
   * @param type     - The objective type (kill, collect, escort, explore, dungeon_clear).
   * @param targetId - The target entity id for this objective.
   * @param amount   - How much progress to add (defaults to 1).
   */
  progressObjective(
    chainId: string,
    type: string,
    targetId: string,
    amount: number = 1,
  ): void {
    const prog = this.progress.get(chainId);
    if (!prog || prog.completed) {
      return;
    }

    const chain = this.chains.get(chainId);
    if (!chain) {
      return;
    }

    const currentQuest = chain.quests[prog.currentQuestIndex];
    if (!currentQuest) {
      return;
    }

    // Find the matching objective in the current quest
    const compositeKey = `${type}:${targetId}`;
    const objective = currentQuest.objectives.find(
      (obj) => obj.type === type && obj.targetId === targetId,
    );

    if (!objective) {
      // This objective type/target doesn't match anything in the current quest
      return;
    }

    // Increment progress, capped at the objective's required count
    const current = prog.currentObjectiveProgress[compositeKey] ?? 0;
    prog.currentObjectiveProgress[compositeKey] = Math.min(
      current + amount,
      objective.count,
    );

    // Check if the current quest is now complete
    if (this.areAllObjectivesMet(currentQuest.objectives, prog.currentObjectiveProgress)) {
      this.advanceQuest(chainId);
    }
  }

  /**
   * Check whether all objectives of the current quest are met.
   * Returns false if the chain is not in progress or has no current quest.
   */
  checkQuestCompletion(chainId: string): boolean {
    const prog = this.progress.get(chainId);
    if (!prog || prog.completed) {
      return false;
    }

    const chain = this.chains.get(chainId);
    if (!chain) {
      return false;
    }

    const currentQuest = chain.quests[prog.currentQuestIndex];
    if (!currentQuest) {
      return false;
    }

    return this.areAllObjectivesMet(
      currentQuest.objectives,
      prog.currentObjectiveProgress,
    );
  }

  /**
   * Advance to the next quest in the chain, or complete the chain if the
   * last quest just finished. Emits QUEST_COMPLETE and (optionally)
   * CHAIN_COMPLETED events.
   */
  advanceQuest(chainId: string): void {
    const prog = this.progress.get(chainId);
    if (!prog || prog.completed) {
      return;
    }

    const chain = this.chains.get(chainId);
    if (!chain) {
      return;
    }

    const completedQuest = chain.quests[prog.currentQuestIndex];
    if (!completedQuest) {
      return;
    }

    // Emit quest completion event
    this.eventBus.emit(EngineEventType.QUEST_COMPLETE, {
      chainId,
      questId: completedQuest.id,
      questIndex: prog.currentQuestIndex,
      xpReward: completedQuest.xpReward,
      goldReward: completedQuest.goldReward,
      reputationReward: completedQuest.reputationReward,
      gearReward: completedQuest.gearReward,
    });

    const nextIndex = prog.currentQuestIndex + 1;

    if (nextIndex >= chain.quests.length) {
      // Chain is complete
      prog.completed = true;

      this.eventBus.emit(EngineEventType.CHAIN_COMPLETED, {
        chainId,
        xpBonus: chain.completionReward.xpBonus,
        goldBonus: chain.completionReward.goldBonus,
        reputationBonus: chain.completionReward.reputationBonus,
        unlocks: chain.completionReward.unlocks,
      });
    } else {
      // Advance to next quest, reset objective progress
      prog.currentQuestIndex = nextIndex;
      prog.currentObjectiveProgress = {};
    }
  }

  /**
   * Return all in-progress (non-completed) chain progress entries for the
   * given zone.
   */
  getActiveQuests(zoneId: string): IQuestChainProgress[] {
    const result: IQuestChainProgress[] = [];

    for (const [chainId, prog] of this.progress) {
      if (prog.completed) {
        continue;
      }

      const chain = this.chains.get(chainId);
      if (chain && chain.zoneId === zoneId) {
        result.push(prog);
      }
    }

    return result;
  }

  /** Get the progress for a specific chain, or undefined if not started. */
  getProgress(chainId: string): IQuestChainProgress | undefined {
    return this.progress.get(chainId);
  }

  /** Serialize all progress for saving. */
  serialize(): Record<string, IQuestChainProgress> {
    const result: Record<string, IQuestChainProgress> = {};
    for (const [chainId, prog] of this.progress) {
      result[chainId] = {
        chainId: prog.chainId,
        currentQuestIndex: prog.currentQuestIndex,
        currentObjectiveProgress: { ...prog.currentObjectiveProgress },
        completed: prog.completed,
      };
    }
    return result;
  }

  /** Restore progress from a save file. */
  deserialize(data: Record<string, IQuestChainProgress>): void {
    this.progress.clear();
    for (const [chainId, prog] of Object.entries(data)) {
      this.progress.set(chainId, {
        chainId: prog.chainId,
        currentQuestIndex: prog.currentQuestIndex,
        currentObjectiveProgress: { ...prog.currentObjectiveProgress },
        completed: prog.completed,
      });
    }
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private areAllObjectivesMet(
    objectives: ReadonlyArray<IQuestObjective>,
    progress: Record<string, number>,
  ): boolean {
    for (const obj of objectives) {
      const key = `${obj.type}:${obj.targetId}`;
      const current = progress[key] ?? 0;
      if (current < obj.count) {
        return false;
      }
    }
    return true;
  }
}
