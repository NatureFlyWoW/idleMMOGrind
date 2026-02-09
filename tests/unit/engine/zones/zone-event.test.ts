import { describe, it, expect, beforeEach } from 'vitest';
import { ZoneEventManager } from '@engine/zones/zone-event-manager';
import { EventBus } from '@engine/events/event-bus';
import { EngineEventType } from '@shared/types/ipc';
import { ZoneEventType } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import type { IZoneEvent, IActiveZoneEvent } from '@shared/types/zone-expansion';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeZoneEvent(overrides: Partial<IZoneEvent> = {}): IZoneEvent {
  return {
    id: 'event_monster_surge_z01',
    zoneId: 'zone_01',
    type: ZoneEventType.MonsterSurge,
    durationMs: 60_000, // 1 minute
    cooldownMs: 120_000, // 2 minutes
    effects: {
      xpMultiplier: 1.5,
      monsterSpawnRateMultiplier: 2.0,
    },
    ...overrides,
  };
}

function makeGatheringEvent(): IZoneEvent {
  return {
    id: 'event_gathering_z01',
    zoneId: 'zone_01',
    type: ZoneEventType.GatheringBounty,
    durationMs: 90_000, // 1.5 minutes
    cooldownMs: 180_000, // 3 minutes
    effects: {
      gatheringMultiplier: 2.0,
    },
  };
}

function makeZone02Event(): IZoneEvent {
  return {
    id: 'event_faction_z02',
    zoneId: 'zone_02',
    type: ZoneEventType.FactionRally,
    durationMs: 60_000,
    cooldownMs: 120_000,
    effects: {
      reputationMultiplier: 2.0,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ZoneEventManager', () => {
  let eventBus: EventBus;
  let manager: ZoneEventManager;
  const checkIntervalMs = 5_000; // Short interval for testing
  const eventBaseChance = 0.15;

  beforeEach(() => {
    eventBus = new EventBus();
    manager = new ZoneEventManager(eventBus, checkIntervalMs, eventBaseChance);
  });

  // -----------------------------------------------------------------------
  // Event triggering
  // -----------------------------------------------------------------------

  describe('event triggering', () => {
    it('events trigger based on eventBaseChance checked every eventCheckIntervalMs', () => {
      // Use 100% chance to guarantee trigger
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent();
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const now = 100_000;

      // Advance past one check interval
      highChanceManager.update(rng, now, checkIntervalMs + 1);

      const active = highChanceManager.getActiveEvents('zone_01');
      expect(active.length).toBeGreaterThanOrEqual(1);
    });

    it('does not check for events before interval elapses', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent();
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const now = 100_000;

      // Advance less than one check interval
      highChanceManager.update(rng, now, checkIntervalMs - 1);

      const active = highChanceManager.getActiveEvents('zone_01');
      expect(active).toHaveLength(0);
    });

    it('emits ZONE_EVENT_STARTED when event triggers', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent();
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      highChanceManager.update(rng, 100_000, checkIntervalMs + 1);

      const events = eventBus.drain();
      const startEvents = events.filter(
        (e) => e.type === EngineEventType.ZONE_EVENT_STARTED,
      );
      expect(startEvents.length).toBeGreaterThanOrEqual(1);
      expect(startEvents[0]!.payload).toEqual(
        expect.objectContaining({
          eventId: 'event_monster_surge_z01',
          zoneId: 'zone_01',
          type: ZoneEventType.MonsterSurge,
        }),
      );
    });

    it('does not trigger when roll fails (0% chance)', () => {
      const zeroChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 0);
      const event = makeZoneEvent();
      zeroChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      zeroChanceManager.update(rng, 100_000, checkIntervalMs + 1);

      const active = zeroChanceManager.getActiveEvents('zone_01');
      expect(active).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Active event effects
  // -----------------------------------------------------------------------

  describe('active event effects', () => {
    it('active event applies its effects (xp multiplier)', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent({
        effects: { xpMultiplier: 1.5, gatheringMultiplier: 1.0, reputationMultiplier: 1.0 },
      });
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      highChanceManager.update(rng, 100_000, checkIntervalMs + 1);

      const multipliers = highChanceManager.getActiveMultipliers('zone_01');
      expect(multipliers.xpMultiplier).toBe(1.5);
    });

    it('returns default multipliers (1.0) when no events active', () => {
      const multipliers = manager.getActiveMultipliers('zone_01');
      expect(multipliers.xpMultiplier).toBe(1.0);
      expect(multipliers.gatheringMultiplier).toBe(1.0);
      expect(multipliers.reputationMultiplier).toBe(1.0);
    });
  });

  // -----------------------------------------------------------------------
  // Event expiration
  // -----------------------------------------------------------------------

  describe('event expiration', () => {
    it('event expires after durationMs', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent({ durationMs: 10_000 });
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const startTime = 100_000;

      // Trigger the event
      highChanceManager.update(rng, startTime, checkIntervalMs + 1);
      expect(highChanceManager.getActiveEvents('zone_01').length).toBeGreaterThanOrEqual(1);

      // Advance past duration
      highChanceManager.update(rng, startTime + 15_000, 15_000);

      expect(highChanceManager.getActiveEvents('zone_01')).toHaveLength(0);
    });

    it('emits ZONE_EVENT_EXPIRED when event expires', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent({ durationMs: 10_000 });
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const startTime = 100_000;

      highChanceManager.update(rng, startTime, checkIntervalMs + 1);
      eventBus.drain(); // Clear start events

      // Advance past duration
      highChanceManager.update(rng, startTime + 15_000, 15_000);

      const events = eventBus.drain();
      const expiredEvents = events.filter(
        (e) => e.type === EngineEventType.ZONE_EVENT_EXPIRED,
      );
      expect(expiredEvents.length).toBeGreaterThanOrEqual(1);
      expect(expiredEvents[0]!.payload).toEqual(
        expect.objectContaining({
          eventId: 'event_monster_surge_z01',
          zoneId: 'zone_01',
        }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Cooldown
  // -----------------------------------------------------------------------

  describe('cooldown', () => {
    it('cooldown prevents same event type re-triggering', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent({
        durationMs: 5_000,
        cooldownMs: 60_000,
      });
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const startTime = 100_000;

      // Trigger the event
      highChanceManager.update(rng, startTime, checkIntervalMs + 1);
      expect(highChanceManager.getActiveEvents('zone_01').length).toBeGreaterThanOrEqual(1);

      // Let it expire
      highChanceManager.update(rng, startTime + 10_000, 10_000);
      expect(highChanceManager.getActiveEvents('zone_01')).toHaveLength(0);

      // Try to trigger again -- should be on cooldown
      highChanceManager.update(rng, startTime + 20_000, checkIntervalMs + 1);
      expect(highChanceManager.getActiveEvents('zone_01')).toHaveLength(0);
    });

    it('event can trigger again after cooldown expires', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent({
        durationMs: 5_000,
        cooldownMs: 30_000,
      });
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const startTime = 100_000;

      // Trigger and expire
      highChanceManager.update(rng, startTime, checkIntervalMs + 1);
      highChanceManager.update(rng, startTime + 10_000, 10_000);

      // Wait for cooldown to expire, then check again
      highChanceManager.update(rng, startTime + 50_000, checkIntervalMs + 1);
      expect(highChanceManager.getActiveEvents('zone_01').length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // Multiple zones
  // -----------------------------------------------------------------------

  describe('multiple zones', () => {
    it('multiple events can be active simultaneously in different zones', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event1 = makeZoneEvent();
      const event2 = makeZone02Event();
      highChanceManager.loadZoneEvents([event1, event2]);

      const rng = new SeededRandom(42);
      highChanceManager.update(rng, 100_000, checkIntervalMs + 1);

      const zone01Active = highChanceManager.getActiveEvents('zone_01');
      const zone02Active = highChanceManager.getActiveEvents('zone_02');

      expect(zone01Active.length).toBeGreaterThanOrEqual(1);
      expect(zone02Active.length).toBeGreaterThanOrEqual(1);
    });

    it('multipliers from one zone do not affect another', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event1 = makeZoneEvent({
        effects: { xpMultiplier: 2.0 },
      });
      const event2 = makeZone02Event();
      highChanceManager.loadZoneEvents([event1, event2]);

      const rng = new SeededRandom(42);
      highChanceManager.update(rng, 100_000, checkIntervalMs + 1);

      const zone01Mult = highChanceManager.getActiveMultipliers('zone_01');
      const zone02Mult = highChanceManager.getActiveMultipliers('zone_02');

      // zone_01 has XP multiplier from event1
      expect(zone01Mult.xpMultiplier).toBe(2.0);

      // zone_02 should not have the xp multiplier from zone_01's event
      // (its event only has reputation multiplier)
      expect(zone02Mult.xpMultiplier).toBe(1.0);
      expect(zone02Mult.reputationMultiplier).toBe(2.0);
    });
  });

  // -----------------------------------------------------------------------
  // Combined multipliers (stacking)
  // -----------------------------------------------------------------------

  describe('combined multipliers', () => {
    it('stacks multipliers from multiple active events in the same zone', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);

      // Two events in the same zone with different effects
      const event1 = makeZoneEvent({
        id: 'event_xp_z01',
        type: ZoneEventType.MonsterSurge,
        effects: { xpMultiplier: 1.5 },
        cooldownMs: 0,
      });
      const event2 = makeGatheringEvent();
      highChanceManager.loadZoneEvents([event1, event2]);

      const rng = new SeededRandom(42);
      highChanceManager.update(rng, 100_000, checkIntervalMs + 1);

      const active = highChanceManager.getActiveEvents('zone_01');
      expect(active.length).toBe(2);

      const mult = highChanceManager.getActiveMultipliers('zone_01');
      expect(mult.xpMultiplier).toBe(1.5);
      expect(mult.gatheringMultiplier).toBe(2.0);
    });
  });

  // -----------------------------------------------------------------------
  // Offline event uptime estimate
  // -----------------------------------------------------------------------

  describe('offline event uptime', () => {
    it('offline calculator accounts for average event uptime', () => {
      const event = makeZoneEvent({
        durationMs: 60_000,
        cooldownMs: 120_000,
      });
      manager.loadZoneEvents([event]);

      // Average uptime = duration / (duration + cooldown)
      // = 60000 / (60000 + 120000) = 0.333...
      const avgMultipliers = manager.getAverageOfflineMultipliers('zone_01');

      // With xpMultiplier of 1.5, average = 1.0 + (1.5 - 1.0) * uptime
      // = 1.0 + 0.5 * 0.333 = 1.1666...
      expect(avgMultipliers.xpMultiplier).toBeCloseTo(1.1667, 3);
    });

    it('returns 1.0 multipliers for zone with no events', () => {
      const avgMultipliers = manager.getAverageOfflineMultipliers('zone_99');
      expect(avgMultipliers.xpMultiplier).toBe(1.0);
      expect(avgMultipliers.gatheringMultiplier).toBe(1.0);
      expect(avgMultipliers.reputationMultiplier).toBe(1.0);
    });
  });

  // -----------------------------------------------------------------------
  // Serialization
  // -----------------------------------------------------------------------

  describe('serialize / deserialize', () => {
    it('round-trips activeZoneEvents through serialization', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent({ durationMs: 300_000 }); // Long duration
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const now = 100_000;
      highChanceManager.update(rng, now, checkIntervalMs + 1);

      const active = highChanceManager.getActiveEvents('zone_01');
      expect(active.length).toBeGreaterThanOrEqual(1);

      const serialized = highChanceManager.serialize();

      // Restore in a new manager
      const newBus = new EventBus();
      const newManager = new ZoneEventManager(newBus, checkIntervalMs, 1.0);
      newManager.loadZoneEvents([event]);
      newManager.deserialize(serialized);

      // Events should still be active
      const restoredActive = newManager.getActiveEvents('zone_01');
      expect(restoredActive).toHaveLength(active.length);
      expect(restoredActive[0]!.eventId).toBe(active[0]!.eventId);
    });

    it('cooldown state persists through serialization', () => {
      const highChanceManager = new ZoneEventManager(eventBus, checkIntervalMs, 1.0);
      const event = makeZoneEvent({
        durationMs: 5_000,
        cooldownMs: 300_000,
      });
      highChanceManager.loadZoneEvents([event]);

      const rng = new SeededRandom(42);
      const startTime = 100_000;

      // Trigger and expire
      highChanceManager.update(rng, startTime, checkIntervalMs + 1);
      highChanceManager.update(rng, startTime + 10_000, 10_000);

      const serialized = highChanceManager.serialize();

      // Restore
      const newBus = new EventBus();
      const newManager = new ZoneEventManager(newBus, checkIntervalMs, 1.0);
      newManager.loadZoneEvents([event]);
      newManager.deserialize(serialized);

      // Should still be on cooldown
      const rng2 = new SeededRandom(99);
      newManager.update(rng2, startTime + 20_000, checkIntervalMs + 1);
      expect(newManager.getActiveEvents('zone_01')).toHaveLength(0);
    });

    it('serializes empty state correctly', () => {
      const serialized = manager.serialize();
      expect(serialized).toEqual({
        activeEvents: [],
        cooldowns: {},
        elapsedSinceLastCheck: 0,
      });
    });
  });
});
