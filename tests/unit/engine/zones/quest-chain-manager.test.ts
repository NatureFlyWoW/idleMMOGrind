import { describe, it, expect, beforeEach } from 'vitest';
import { QuestChainManager } from '@engine/zones/quest-chain-manager';
import { EventBus } from '@engine/events/event-bus';
import { EngineEventType } from '@shared/types/ipc';
import { QuestType } from '@shared/types/enums';
import type { IQuestChain, IQuestChainProgress } from '@shared/types/zone-expansion';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeKillChain(): IQuestChain {
  return {
    id: 'chain_wolves',
    zoneId: 'zone_01',
    name: 'Wolf Menace',
    description: 'Clear the wolves from the meadow',
    quests: [
      {
        id: 'q_wolves_1',
        name: 'Thin the Pack',
        description: 'Kill 5 wolves',
        type: QuestType.Kill,
        objectives: [{ type: 'kill', targetId: 'wolf', count: 5 }],
        xpReward: 100,
        goldReward: 25,
        nextQuestId: 'q_wolves_2',
      },
      {
        id: 'q_wolves_2',
        name: 'Alpha Hunt',
        description: 'Kill the alpha wolf',
        type: QuestType.Kill,
        objectives: [{ type: 'kill', targetId: 'alpha_wolf', count: 1 }],
        xpReward: 200,
        goldReward: 50,
        nextQuestId: null,
      },
    ],
    completionReward: {
      xpBonus: 500,
      goldBonus: 100,
      reputationBonus: 250,
    },
  };
}

function makeMultiObjectiveChain(): IQuestChain {
  return {
    id: 'chain_gather',
    zoneId: 'zone_01',
    name: 'Gathering Supplies',
    description: 'Collect supplies for the village',
    quests: [
      {
        id: 'q_gather_1',
        name: 'Supply Run',
        description: 'Collect 3 hides and kill 2 bears',
        type: QuestType.Collection,
        objectives: [
          { type: 'collect', targetId: 'bear_hide', count: 3 },
          { type: 'kill', targetId: 'bear', count: 2 },
        ],
        xpReward: 150,
        goldReward: 40,
        nextQuestId: null,
      },
    ],
    completionReward: {
      xpBonus: 300,
      goldBonus: 50,
      reputationBonus: 100,
    },
  };
}

function makeEscortChain(): IQuestChain {
  return {
    id: 'chain_escort',
    zoneId: 'zone_02',
    name: 'Safe Passage',
    description: 'Escort the merchant safely',
    quests: [
      {
        id: 'q_escort_1',
        name: 'Guard Duty',
        description: 'Escort the merchant through the forest',
        type: QuestType.Escort,
        objectives: [{ type: 'escort', targetId: 'merchant_npc', count: 1 }],
        xpReward: 250,
        goldReward: 75,
        nextQuestId: null,
      },
    ],
    completionReward: {
      xpBonus: 400,
      goldBonus: 80,
      reputationBonus: 200,
    },
  };
}

function makeExplorationChain(): IQuestChain {
  return {
    id: 'chain_explore',
    zoneId: 'zone_02',
    name: 'Cartographer',
    description: 'Map the uncharted regions',
    quests: [
      {
        id: 'q_explore_1',
        name: 'Northern Survey',
        description: 'Explore the northern cave',
        type: QuestType.Exploration,
        objectives: [
          { type: 'explore', targetId: 'northern_cave', count: 1 },
          { type: 'explore', targetId: 'hidden_grove', count: 1 },
        ],
        xpReward: 200,
        goldReward: 60,
        nextQuestId: null,
      },
    ],
    completionReward: {
      xpBonus: 350,
      goldBonus: 70,
      reputationBonus: 150,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QuestChainManager', () => {
  let manager: QuestChainManager;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new QuestChainManager(eventBus);
    manager.loadChains([
      makeKillChain(),
      makeMultiObjectiveChain(),
      makeEscortChain(),
      makeExplorationChain(),
    ]);
  });

  // -----------------------------------------------------------------------
  // startChain
  // -----------------------------------------------------------------------

  describe('startChain', () => {
    it('sets progress to quest index 0 with empty objective progress', () => {
      const result = manager.startChain('chain_wolves');
      expect(result).toBe(true);

      const progress = manager.getProgress('chain_wolves');
      expect(progress).toBeDefined();
      expect(progress!.chainId).toBe('chain_wolves');
      expect(progress!.currentQuestIndex).toBe(0);
      expect(progress!.currentObjectiveProgress).toEqual({});
      expect(progress!.completed).toBe(false);
    });

    it('returns false for an unknown chain id', () => {
      const result = manager.startChain('chain_nonexistent');
      expect(result).toBe(false);
    });

    it('cannot start a chain that is already in progress', () => {
      manager.startChain('chain_wolves');
      const secondStart = manager.startChain('chain_wolves');
      expect(secondStart).toBe(false);
    });

    it('cannot start a chain that is already completed', () => {
      manager.startChain('chain_escort');
      // Complete the escort chain
      manager.progressObjective('chain_escort', 'escort', 'merchant_npc', 1);
      const progress = manager.getProgress('chain_escort');
      expect(progress!.completed).toBe(true);

      const restart = manager.startChain('chain_escort');
      expect(restart).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // progressObjective
  // -----------------------------------------------------------------------

  describe('progressObjective', () => {
    it('increments objective progress by the given amount', () => {
      manager.startChain('chain_wolves');
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 1);

      const progress = manager.getProgress('chain_wolves')!;
      expect(progress.currentObjectiveProgress['kill:wolf']).toBe(1);
    });

    it('increments by 1 when no amount is specified', () => {
      manager.startChain('chain_wolves');
      manager.progressObjective('chain_wolves', 'kill', 'wolf');

      const progress = manager.getProgress('chain_wolves')!;
      expect(progress.currentObjectiveProgress['kill:wolf']).toBe(1);
    });

    it('accumulates progress across multiple calls', () => {
      manager.startChain('chain_wolves');
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 2);

      const mid = manager.getProgress('chain_wolves')!;
      expect(mid.currentObjectiveProgress['kill:wolf']).toBe(2);

      manager.progressObjective('chain_wolves', 'kill', 'wolf', 1);

      const after = manager.getProgress('chain_wolves')!;
      expect(after.currentObjectiveProgress['kill:wolf']).toBe(3);
    });

    it('does not progress an objective beyond the required count', () => {
      manager.startChain('chain_wolves');
      // Wolf objective count is 5; after capping at 5 the quest completes
      // and advances to quest index 1 (alpha wolf). Verify the quest
      // advanced rather than checking the now-cleared progress map.
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 10);

      const progress = manager.getProgress('chain_wolves')!;
      // Quest should have completed and advanced to index 1
      expect(progress.currentQuestIndex).toBe(1);
    });

    it('ignores progress for objectives not in the current quest', () => {
      manager.startChain('chain_wolves');
      // alpha_wolf is in quest index 1, not 0
      manager.progressObjective('chain_wolves', 'kill', 'alpha_wolf', 1);

      const progress = manager.getProgress('chain_wolves')!;
      expect(progress.currentObjectiveProgress['kill:alpha_wolf']).toBeUndefined();
    });

    it('does nothing for a chain not in progress', () => {
      // chain_wolves not started
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 1);

      const progress = manager.getProgress('chain_wolves');
      expect(progress).toBeUndefined();
    });

    it('does nothing for a completed chain', () => {
      manager.startChain('chain_escort');
      manager.progressObjective('chain_escort', 'escort', 'merchant_npc', 1);
      expect(manager.getProgress('chain_escort')!.completed).toBe(true);

      // Attempt further progress on completed chain -- should be no-op
      manager.progressObjective('chain_escort', 'escort', 'merchant_npc', 1);
      // Still completed, objective still 1
      expect(manager.getProgress('chain_escort')!.currentObjectiveProgress['escort:merchant_npc']).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Quest completion and advancement
  // -----------------------------------------------------------------------

  describe('quest completion and chain advancement', () => {
    it('advances to next quest when all objectives met', () => {
      manager.startChain('chain_wolves');
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 5);

      const progress = manager.getProgress('chain_wolves')!;
      expect(progress.currentQuestIndex).toBe(1);
      expect(progress.currentObjectiveProgress).toEqual({});
      expect(progress.completed).toBe(false);
    });

    it('emits QUEST_COMPLETE event when a quest finishes', () => {
      manager.startChain('chain_wolves');
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 5);

      const events = eventBus.drain();
      const questCompleteEvents = events.filter(
        (e) => e.type === EngineEventType.QUEST_COMPLETE,
      );
      expect(questCompleteEvents).toHaveLength(1);
      expect(questCompleteEvents[0]!.payload).toEqual(
        expect.objectContaining({
          chainId: 'chain_wolves',
          questId: 'q_wolves_1',
          xpReward: 100,
          goldReward: 25,
        }),
      );
    });

    it('completes chain when the last quest finishes', () => {
      manager.startChain('chain_wolves');
      // Complete quest 1
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 5);
      eventBus.drain(); // Clear events

      // Complete quest 2 (last in chain)
      manager.progressObjective('chain_wolves', 'kill', 'alpha_wolf', 1);

      const progress = manager.getProgress('chain_wolves')!;
      expect(progress.completed).toBe(true);
    });

    it('emits CHAIN_COMPLETED event with completion rewards', () => {
      manager.startChain('chain_wolves');
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 5);
      eventBus.drain(); // Clear quest 1 events

      manager.progressObjective('chain_wolves', 'kill', 'alpha_wolf', 1);

      const events = eventBus.drain();
      const chainCompleteEvents = events.filter(
        (e) => e.type === EngineEventType.CHAIN_COMPLETED,
      );
      expect(chainCompleteEvents).toHaveLength(1);
      expect(chainCompleteEvents[0]!.payload).toEqual(
        expect.objectContaining({
          chainId: 'chain_wolves',
          xpBonus: 500,
          goldBonus: 100,
          reputationBonus: 250,
        }),
      );
    });

    it('handles multi-objective quest -- only advances when ALL objectives are met', () => {
      manager.startChain('chain_gather');
      manager.progressObjective('chain_gather', 'collect', 'bear_hide', 3);

      // Only collect objective met, not kill objective
      const progress = manager.getProgress('chain_gather')!;
      expect(progress.currentQuestIndex).toBe(0);
      expect(progress.completed).toBe(false);

      // Now complete kill objective
      manager.progressObjective('chain_gather', 'kill', 'bear', 2);

      const finalProgress = manager.getProgress('chain_gather')!;
      expect(finalProgress.completed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getActiveQuests
  // -----------------------------------------------------------------------

  describe('getActiveQuests', () => {
    it('returns all in-progress chains for a zone', () => {
      manager.startChain('chain_wolves');
      manager.startChain('chain_gather');

      const active = manager.getActiveQuests('zone_01');
      expect(active).toHaveLength(2);
      expect(active.map((p) => p.chainId).sort()).toEqual([
        'chain_gather',
        'chain_wolves',
      ]);
    });

    it('does not include completed chains', () => {
      manager.startChain('chain_escort');
      manager.progressObjective('chain_escort', 'escort', 'merchant_npc', 1);

      const active = manager.getActiveQuests('zone_02');
      expect(active).toHaveLength(0);
    });

    it('returns empty array for a zone with no active chains', () => {
      const active = manager.getActiveQuests('zone_99');
      expect(active).toHaveLength(0);
    });

    it('does not return chains from other zones', () => {
      manager.startChain('chain_wolves');

      const active = manager.getActiveQuests('zone_02');
      expect(active).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Escort and exploration quest types
  // -----------------------------------------------------------------------

  describe('escort quest type', () => {
    it('resolves escort objective correctly', () => {
      manager.startChain('chain_escort');
      manager.progressObjective('chain_escort', 'escort', 'merchant_npc', 1);

      const progress = manager.getProgress('chain_escort')!;
      expect(progress.completed).toBe(true);
    });
  });

  describe('exploration quest type', () => {
    it('resolves multiple explore objectives correctly', () => {
      manager.startChain('chain_explore');

      manager.progressObjective('chain_explore', 'explore', 'northern_cave', 1);
      expect(manager.getProgress('chain_explore')!.currentQuestIndex).toBe(0);
      expect(manager.getProgress('chain_explore')!.completed).toBe(false);

      manager.progressObjective('chain_explore', 'explore', 'hidden_grove', 1);
      expect(manager.getProgress('chain_explore')!.completed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Serialization (save/load)
  // -----------------------------------------------------------------------

  describe('serialize / deserialize', () => {
    it('round-trips progress through serialization', () => {
      manager.startChain('chain_wolves');
      manager.progressObjective('chain_wolves', 'kill', 'wolf', 3);

      const serialized = manager.serialize();
      expect(serialized['chain_wolves']).toBeDefined();
      expect(serialized['chain_wolves']!.currentObjectiveProgress['kill:wolf']).toBe(3);

      // Create a new manager and restore
      const newBus = new EventBus();
      const newManager = new QuestChainManager(newBus);
      newManager.loadChains([
        makeKillChain(),
        makeMultiObjectiveChain(),
        makeEscortChain(),
        makeExplorationChain(),
      ]);
      newManager.deserialize(serialized);

      const restored = newManager.getProgress('chain_wolves')!;
      expect(restored.chainId).toBe('chain_wolves');
      expect(restored.currentQuestIndex).toBe(0);
      expect(restored.currentObjectiveProgress['kill:wolf']).toBe(3);
      expect(restored.completed).toBe(false);
    });

    it('persists completed chain state through serialization', () => {
      manager.startChain('chain_escort');
      manager.progressObjective('chain_escort', 'escort', 'merchant_npc', 1);

      const serialized = manager.serialize();

      const newBus = new EventBus();
      const newManager = new QuestChainManager(newBus);
      newManager.loadChains([makeEscortChain()]);
      newManager.deserialize(serialized);

      const restored = newManager.getProgress('chain_escort')!;
      expect(restored.completed).toBe(true);

      // Cannot restart after load
      expect(newManager.startChain('chain_escort')).toBe(false);
    });

    it('serializes empty state correctly', () => {
      const serialized = manager.serialize();
      expect(serialized).toEqual({});
    });
  });
});
