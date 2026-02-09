import { describe, it, expect, beforeEach } from 'vitest';
import { RareSpawnManager } from '@engine/zones/rare-spawn-manager';
import { EventBus } from '@engine/events/event-bus';
import { EngineEventType } from '@shared/types/ipc';
import { ItemQuality, GearSlot } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import type { IRareSpawn } from '@shared/types/zone-expansion';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeRareSpawn(overrides: Partial<IRareSpawn> = {}): IRareSpawn {
  return {
    id: 'rare_ancient_treant',
    zoneId: 'zone_01',
    name: 'Ancient Treant',
    level: 15,
    hpMultiplier: 5.0,
    damageMultiplier: 3.0,
    spawnChance: 0.03,
    guaranteedDropQuality: ItemQuality.Rare,
    xpMultiplier: 5.0,
    reputationReward: 100,
    ...overrides,
  };
}

function makeHighChanceRare(): IRareSpawn {
  return makeRareSpawn({
    id: 'rare_easy_trigger',
    spawnChance: 1.0, // Always triggers for testing
  });
}

function makeSecondRare(): IRareSpawn {
  return makeRareSpawn({
    id: 'rare_shadow_beast',
    zoneId: 'zone_01',
    name: 'Shadow Beast',
    level: 18,
    hpMultiplier: 4.0,
    damageMultiplier: 2.5,
    spawnChance: 0.05,
    guaranteedDropQuality: ItemQuality.Epic,
    guaranteedDropSlot: GearSlot.MainHand,
    xpMultiplier: 6.0,
    reputationReward: 150,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RareSpawnManager', () => {
  let eventBus: EventBus;
  let manager: RareSpawnManager;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new RareSpawnManager(eventBus);
  });

  // -----------------------------------------------------------------------
  // Spawn trigger
  // -----------------------------------------------------------------------

  describe('spawn trigger', () => {
    it('rare spawn triggers based on spawnChance per monster kill', () => {
      const rare = makeHighChanceRare(); // 100% chance
      manager.loadRareSpawns([rare]);

      const rng = new SeededRandom(42);
      const result = manager.rollForRareSpawn('zone_01', rng, Date.now());

      expect(result).toBeDefined();
      expect(result!.id).toBe('rare_easy_trigger');
    });

    it('does not trigger when roll fails', () => {
      // Extremely low chance -- use a spawnChance of 0
      const rare = makeRareSpawn({ spawnChance: 0 });
      manager.loadRareSpawns([rare]);

      const rng = new SeededRandom(42);
      const result = manager.rollForRareSpawn('zone_01', rng, Date.now());

      expect(result).toBeUndefined();
    });

    it('emits RARE_SPAWN_APPEARED event when triggered', () => {
      const rare = makeHighChanceRare();
      manager.loadRareSpawns([rare]);

      const rng = new SeededRandom(42);
      manager.rollForRareSpawn('zone_01', rng, Date.now());

      const events = eventBus.drain();
      const spawnEvents = events.filter(
        (e) => e.type === EngineEventType.RARE_SPAWN_APPEARED,
      );
      expect(spawnEvents).toHaveLength(1);
      expect(spawnEvents[0]!.payload).toEqual(
        expect.objectContaining({
          rareSpawnId: 'rare_easy_trigger',
          zoneId: 'zone_01',
        }),
      );
    });

    it('returns undefined for a zone with no rare spawns', () => {
      manager.loadRareSpawns([makeRareSpawn()]); // zone_01 only

      const rng = new SeededRandom(42);
      const result = manager.rollForRareSpawn('zone_99', rng, Date.now());

      expect(result).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Stat multipliers
  // -----------------------------------------------------------------------

  describe('stat multipliers', () => {
    it('rare spawn has boosted HP and damage (multipliers)', () => {
      const rare = makeRareSpawn({
        hpMultiplier: 5.0,
        damageMultiplier: 3.0,
      });
      manager.loadRareSpawns([rare]);

      const stats = manager.getRareStats('rare_ancient_treant');
      expect(stats).toBeDefined();
      expect(stats!.hpMultiplier).toBe(5.0);
      expect(stats!.damageMultiplier).toBe(3.0);
    });
  });

  // -----------------------------------------------------------------------
  // Guaranteed drops
  // -----------------------------------------------------------------------

  describe('guaranteed drops', () => {
    it('rare spawn always drops guaranteedDropQuality or better', () => {
      const rare = makeRareSpawn({
        guaranteedDropQuality: ItemQuality.Rare,
      });
      manager.loadRareSpawns([rare]);

      const stats = manager.getRareStats('rare_ancient_treant');
      expect(stats!.guaranteedDropQuality).toBe(ItemQuality.Rare);
    });

    it('rare spawn can have a guaranteed drop slot', () => {
      const rare = makeRareSpawn({
        guaranteedDropQuality: ItemQuality.Epic,
        guaranteedDropSlot: GearSlot.MainHand,
      });
      manager.loadRareSpawns([rare]);

      const stats = manager.getRareStats('rare_ancient_treant');
      expect(stats!.guaranteedDropSlot).toBe(GearSlot.MainHand);
    });
  });

  // -----------------------------------------------------------------------
  // XP and reputation
  // -----------------------------------------------------------------------

  describe('xp and reputation rewards', () => {
    it('rare spawn grants bonus XP multiplier', () => {
      const rare = makeRareSpawn({ xpMultiplier: 5.0 });
      manager.loadRareSpawns([rare]);

      const stats = manager.getRareStats('rare_ancient_treant');
      expect(stats!.xpMultiplier).toBe(5.0);
    });

    it('rare spawn grants reputation reward', () => {
      const rare = makeRareSpawn({ reputationReward: 100 });
      manager.loadRareSpawns([rare]);

      const stats = manager.getRareStats('rare_ancient_treant');
      expect(stats!.reputationReward).toBe(100);
    });
  });

  // -----------------------------------------------------------------------
  // Cooldown / re-trigger prevention
  // -----------------------------------------------------------------------

  describe('cooldown / re-trigger prevention', () => {
    it('rare spawn defeat is tracked and cannot re-trigger in short window', () => {
      const rare = makeHighChanceRare();
      manager.loadRareSpawns([rare]);

      const now = Date.now();
      const rng = new SeededRandom(42);

      // First trigger
      const first = manager.rollForRareSpawn('zone_01', rng, now);
      expect(first).toBeDefined();

      // Record defeat
      manager.recordDefeat('rare_easy_trigger', now);

      // Try again immediately (within 5-minute cooldown)
      const rng2 = new SeededRandom(99);
      const second = manager.rollForRareSpawn('zone_01', rng2, now + 1000);
      expect(second).toBeUndefined();
    });

    it('rare spawn can re-trigger after cooldown expires', () => {
      const rare = makeHighChanceRare();
      manager.loadRareSpawns([rare]);

      const now = Date.now();
      const cooldownMs = manager.getCooldownMs();

      // First trigger and defeat
      const rng = new SeededRandom(42);
      manager.rollForRareSpawn('zone_01', rng, now);
      manager.recordDefeat('rare_easy_trigger', now);

      // After cooldown has elapsed
      const rng2 = new SeededRandom(99);
      const result = manager.rollForRareSpawn('zone_01', rng2, now + cooldownMs + 1);
      expect(result).toBeDefined();
    });

    it('emits RARE_SPAWN_DEFEATED event on defeat', () => {
      const rare = makeHighChanceRare();
      manager.loadRareSpawns([rare]);

      manager.recordDefeat('rare_easy_trigger', Date.now());

      const events = eventBus.drain();
      const defeatEvents = events.filter(
        (e) => e.type === EngineEventType.RARE_SPAWN_DEFEATED,
      );
      expect(defeatEvents).toHaveLength(1);
      expect(defeatEvents[0]!.payload).toEqual(
        expect.objectContaining({
          rareSpawnId: 'rare_easy_trigger',
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Statistical distribution
  // -----------------------------------------------------------------------

  describe('statistical distribution', () => {
    it('triggers at roughly the expected rate over many rolls', () => {
      const rare = makeRareSpawn({ spawnChance: 0.10 }); // 10%
      manager.loadRareSpawns([rare]);

      let triggers = 0;
      const trials = 5000;
      const rng = new SeededRandom(42);

      for (let i = 0; i < trials; i++) {
        // Use a fresh timestamp far enough apart to avoid cooldown
        const result = manager.rollForRareSpawn(
          'zone_01',
          rng,
          Date.now() + i * 1_000_000,
        );
        if (result) {
          triggers++;
          // Clear cooldown for statistical test
          manager.clearCooldowns();
        }
      }

      // With 10% chance over 5000 trials, expect roughly 400-600
      expect(triggers).toBeGreaterThan(350);
      expect(triggers).toBeLessThan(650);
    });
  });

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  describe('serialize / deserialize', () => {
    it('round-trips rareSpawnsDefeated through serialization', () => {
      const rare = makeHighChanceRare();
      manager.loadRareSpawns([rare]);

      const now = Date.now();
      manager.recordDefeat('rare_easy_trigger', now);

      const serialized = manager.serialize();
      expect(serialized.defeatedRares['rare_easy_trigger']).toBe(now);

      // Restore in a new manager
      const newBus = new EventBus();
      const newManager = new RareSpawnManager(newBus);
      newManager.loadRareSpawns([rare]);
      newManager.deserialize(serialized);

      // Should still be on cooldown
      const rng = new SeededRandom(42);
      const result = newManager.rollForRareSpawn('zone_01', rng, now + 1000);
      expect(result).toBeUndefined();
    });

    it('serializes empty state correctly', () => {
      const serialized = manager.serialize();
      expect(serialized).toEqual({ defeatedRares: {} });
    });
  });
});
