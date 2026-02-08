import { describe, it, expect, beforeEach } from 'vitest';
import { EliteAreaManager } from '@engine/zones/elite-area-manager';
import { QuestChainManager } from '@engine/zones/quest-chain-manager';
import { EventBus } from '@engine/events/event-bus';
import { EngineEventType } from '@shared/types/ipc';
import { QuestType, ItemQuality } from '@shared/types/enums';
import type { IEliteArea, IQuestChain } from '@shared/types/zone-expansion';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeEliteArea(overrides: Partial<IEliteArea> = {}): IEliteArea {
  return {
    id: 'elite_zone01',
    zoneId: 'zone_01',
    name: 'The Burning Thicket',
    description: 'A dangerous area deep within the forest',
    levelBoost: 3,
    hpMultiplier: 3.0,
    damageMultiplier: 2.0,
    xpMultiplier: 2.5,
    reputationMultiplier: 2.0,
    lootQualityBoost: 1,
    monsterIds: ['elite_treant', 'elite_wolf'],
    ...overrides,
  };
}

function makeChain(id: string, zoneId: string, questCount: number): IQuestChain {
  const quests = [];
  for (let i = 0; i < questCount; i++) {
    quests.push({
      id: `${id}_q${i}`,
      name: `Quest ${i}`,
      description: `Quest ${i} description`,
      type: QuestType.Kill,
      objectives: [{ type: 'kill' as const, targetId: `mob_${i}`, count: 1 }],
      xpReward: 100,
      goldReward: 25,
      nextQuestId: i < questCount - 1 ? `${id}_q${i + 1}` : null,
    });
  }
  return {
    id,
    zoneId,
    name: `Chain ${id}`,
    description: `Chain ${id} description`,
    quests,
    completionReward: {
      xpBonus: 500,
      goldBonus: 100,
      reputationBonus: 250,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EliteAreaManager', () => {
  let eventBus: EventBus;
  let questChainManager: QuestChainManager;
  let eliteManager: EliteAreaManager;

  beforeEach(() => {
    eventBus = new EventBus();
    questChainManager = new QuestChainManager(eventBus);
    eliteManager = new EliteAreaManager(eventBus, questChainManager);
  });

  // -----------------------------------------------------------------------
  // Unlock conditions
  // -----------------------------------------------------------------------

  describe('unlock conditions', () => {
    it('unlocks elite area when all zone quest chains are complete', () => {
      const chain1 = makeChain('chain_a', 'zone_01', 1);
      const chain2 = makeChain('chain_b', 'zone_01', 1);
      const elite = makeEliteArea();

      questChainManager.loadChains([chain1, chain2]);
      eliteManager.loadEliteAreas([elite], {
        zone_01: ['chain_a', 'chain_b'],
      });

      // Not unlocked initially
      expect(eliteManager.isUnlocked('zone_01')).toBe(false);

      // Complete chain_a
      questChainManager.startChain('chain_a');
      questChainManager.progressObjective('chain_a', 'kill', 'mob_0', 1);
      eliteManager.checkUnlocks('zone_01');

      // Still locked -- chain_b not done
      expect(eliteManager.isUnlocked('zone_01')).toBe(false);

      // Complete chain_b
      questChainManager.startChain('chain_b');
      questChainManager.progressObjective('chain_b', 'kill', 'mob_0', 1);
      eliteManager.checkUnlocks('zone_01');

      expect(eliteManager.isUnlocked('zone_01')).toBe(true);
    });

    it('emits ELITE_AREA_UNLOCKED event on unlock', () => {
      const chain1 = makeChain('chain_a', 'zone_01', 1);
      const elite = makeEliteArea();

      questChainManager.loadChains([chain1]);
      eliteManager.loadEliteAreas([elite], {
        zone_01: ['chain_a'],
      });

      questChainManager.startChain('chain_a');
      questChainManager.progressObjective('chain_a', 'kill', 'mob_0', 1);
      eventBus.drain(); // Clear quest/chain events

      eliteManager.checkUnlocks('zone_01');

      const events = eventBus.drain();
      const unlockEvents = events.filter(
        (e) => e.type === EngineEventType.ELITE_AREA_UNLOCKED,
      );
      expect(unlockEvents).toHaveLength(1);
      expect(unlockEvents[0]!.payload).toEqual(
        expect.objectContaining({
          eliteAreaId: 'elite_zone01',
          zoneId: 'zone_01',
        }),
      );
    });

    it('does not emit unlock event twice', () => {
      const chain1 = makeChain('chain_a', 'zone_01', 1);
      const elite = makeEliteArea();

      questChainManager.loadChains([chain1]);
      eliteManager.loadEliteAreas([elite], {
        zone_01: ['chain_a'],
      });

      questChainManager.startChain('chain_a');
      questChainManager.progressObjective('chain_a', 'kill', 'mob_0', 1);
      eventBus.drain();

      eliteManager.checkUnlocks('zone_01');
      eventBus.drain();

      // Check again -- should not emit
      eliteManager.checkUnlocks('zone_01');
      const events = eventBus.drain();
      const unlockEvents = events.filter(
        (e) => e.type === EngineEventType.ELITE_AREA_UNLOCKED,
      );
      expect(unlockEvents).toHaveLength(0);
    });

    it('player does not enter elite area if level < zone max', () => {
      const chain1 = makeChain('chain_a', 'zone_01', 1);
      const elite = makeEliteArea({ levelBoost: 3 });

      questChainManager.loadChains([chain1]);
      eliteManager.loadEliteAreas([elite], {
        zone_01: ['chain_a'],
      });

      // Complete chain to unlock
      questChainManager.startChain('chain_a');
      questChainManager.progressObjective('chain_a', 'kill', 'mob_0', 1);
      eliteManager.checkUnlocks('zone_01');
      expect(eliteManager.isUnlocked('zone_01')).toBe(true);

      // Player level 8, zone max level 10 -- should not be allowed in
      expect(eliteManager.canEnter('zone_01', 8, 10)).toBe(false);

      // Player level 10, zone max level 10 -- allowed
      expect(eliteManager.canEnter('zone_01', 10, 10)).toBe(true);

      // Player level 15, zone max level 10 -- allowed
      expect(eliteManager.canEnter('zone_01', 15, 10)).toBe(true);
    });

    it('canEnter returns false if elite area not unlocked', () => {
      const elite = makeEliteArea();
      eliteManager.loadEliteAreas([elite], {
        zone_01: ['chain_a'],
      });

      expect(eliteManager.canEnter('zone_01', 60, 10)).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Stat multipliers
  // -----------------------------------------------------------------------

  describe('stat multipliers', () => {
    it('elite monsters use boosted stats (HP * multiplier, damage * multiplier)', () => {
      const elite = makeEliteArea({
        hpMultiplier: 3.0,
        damageMultiplier: 2.0,
      });
      eliteManager.loadEliteAreas([elite], { zone_01: [] });

      const multipliers = eliteManager.getStatMultipliers('elite_zone01');
      expect(multipliers).toBeDefined();
      expect(multipliers!.hpMultiplier).toBe(3.0);
      expect(multipliers!.damageMultiplier).toBe(2.0);
    });

    it('elite area XP reward uses configured multiplier', () => {
      const elite = makeEliteArea({ xpMultiplier: 2.5 });
      eliteManager.loadEliteAreas([elite], { zone_01: [] });

      const multipliers = eliteManager.getStatMultipliers('elite_zone01');
      expect(multipliers!.xpMultiplier).toBe(2.5);
    });

    it('elite area loot quality is boosted by lootQualityBoost', () => {
      const elite = makeEliteArea({ lootQualityBoost: 2 });
      eliteManager.loadEliteAreas([elite], { zone_01: [] });

      const multipliers = eliteManager.getStatMultipliers('elite_zone01');
      expect(multipliers!.lootQualityBoost).toBe(2);
    });

    it('returns undefined multipliers for unknown elite area', () => {
      const multipliers = eliteManager.getStatMultipliers('nonexistent');
      expect(multipliers).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  describe('serialize / deserialize', () => {
    it('round-trips unlocked state through serialization', () => {
      const chain1 = makeChain('chain_a', 'zone_01', 1);
      const elite = makeEliteArea();

      questChainManager.loadChains([chain1]);
      eliteManager.loadEliteAreas([elite], {
        zone_01: ['chain_a'],
      });

      questChainManager.startChain('chain_a');
      questChainManager.progressObjective('chain_a', 'kill', 'mob_0', 1);
      eliteManager.checkUnlocks('zone_01');
      expect(eliteManager.isUnlocked('zone_01')).toBe(true);

      const serialized = eliteManager.serialize();

      // Create a new manager and restore
      const newBus = new EventBus();
      const newQCM = new QuestChainManager(newBus);
      const newEliteManager = new EliteAreaManager(newBus, newQCM);
      newEliteManager.loadEliteAreas([elite], {
        zone_01: ['chain_a'],
      });
      newEliteManager.deserialize(serialized);

      expect(newEliteManager.isUnlocked('zone_01')).toBe(true);
    });

    it('serializes empty state correctly', () => {
      const serialized = eliteManager.serialize();
      expect(serialized).toEqual({ unlockedZones: [] });
    });
  });
});
