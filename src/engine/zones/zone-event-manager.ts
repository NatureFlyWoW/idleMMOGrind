import type { IZoneEvent, IActiveZoneEvent } from '@shared/types/zone-expansion';
import type { EventBus } from '@engine/events/event-bus';
import type { SeededRandom } from '@shared/utils/rng';
import { EngineEventType } from '@shared/types/ipc';

/**
 * Combined multipliers from all active events in a zone.
 */
export interface IZoneMultipliers {
  xpMultiplier: number;
  gatheringMultiplier: number;
  reputationMultiplier: number;
}

/**
 * Serialized state for save/load.
 */
export interface IZoneEventSaveData {
  activeEvents: IActiveZoneEvent[];
  cooldowns: Record<string, number>;
  elapsedSinceLastCheck: number;
}

/**
 * Manages periodic zone events.
 *
 * Implements IGameSystem. On each update(), accumulates elapsed time and
 * checks whether to trigger new events (random roll per check interval).
 * Maintains a list of active events and their expiration times. Provides
 * multiplier getters consumed by combat, gathering, and reputation systems.
 */
/**
 * Note: Does not implement IGameSystem because update() requires
 * SeededRandom and nowMs parameters beyond the IGameSystem contract.
 * Integrated into the game loop via direct calls.
 */
export class ZoneEventManager {
  /** Zone event definitions indexed by zone id. */
  private eventsByZone: Map<string, IZoneEvent[]> = new Map();

  /** Zone event definitions indexed by event id. */
  private eventsById: Map<string, IZoneEvent> = new Map();

  /** Currently active events. */
  private activeEvents: IActiveZoneEvent[] = [];

  /** Cooldown timestamps per event id -- the time the cooldown expires. */
  private cooldowns: Map<string, number> = new Map();

  /** Time accumulated since the last event check. */
  private elapsedSinceLastCheck: number = 0;

  private eventBus: EventBus;
  private checkIntervalMs: number;
  private eventBaseChance: number;

  constructor(
    eventBus: EventBus,
    checkIntervalMs: number,
    eventBaseChance: number,
  ) {
    this.eventBus = eventBus;
    this.checkIntervalMs = checkIntervalMs;
    this.eventBaseChance = eventBaseChance;
  }

  /**
   * Load zone event definitions.
   */
  loadZoneEvents(events: ReadonlyArray<IZoneEvent>): void {
    for (const event of events) {
      this.eventsById.set(event.id, event);

      const existing = this.eventsByZone.get(event.zoneId);
      if (existing) {
        existing.push(event);
      } else {
        this.eventsByZone.set(event.zoneId, [event]);
      }
    }
  }

  /**
   * IGameSystem.update -- called each game tick.
   *
   * @param rng     - Seeded random for deterministic event rolls.
   * @param nowMs   - Current timestamp in milliseconds.
   * @param deltaMs - Milliseconds elapsed since last update.
   */
  update(rng: SeededRandom, nowMs: number, deltaMs: number): void {
    // Expire old events first
    this.expireEvents(nowMs);

    // Accumulate time for check interval
    this.elapsedSinceLastCheck += deltaMs;

    // Process as many full intervals as have elapsed
    while (this.elapsedSinceLastCheck >= this.checkIntervalMs) {
      this.elapsedSinceLastCheck -= this.checkIntervalMs;
      this.rollForEvents(rng, nowMs);
    }
  }

  /**
   * Get all active events in a zone.
   */
  getActiveEvents(zoneId: string): ReadonlyArray<IActiveZoneEvent> {
    return this.activeEvents.filter((e) => e.zoneId === zoneId);
  }

  /**
   * Get combined multipliers from all active events in a zone.
   * Returns 1.0 for any multiplier that has no active contribution.
   */
  getActiveMultipliers(zoneId: string): IZoneMultipliers {
    const result: IZoneMultipliers = {
      xpMultiplier: 1.0,
      gatheringMultiplier: 1.0,
      reputationMultiplier: 1.0,
    };

    for (const active of this.activeEvents) {
      if (active.zoneId !== zoneId) {
        continue;
      }
      if (active.effects.xpMultiplier !== undefined) {
        result.xpMultiplier = active.effects.xpMultiplier;
      }
      if (active.effects.gatheringMultiplier !== undefined) {
        result.gatheringMultiplier = active.effects.gatheringMultiplier;
      }
      if (active.effects.reputationMultiplier !== undefined) {
        result.reputationMultiplier = active.effects.reputationMultiplier;
      }
    }

    return result;
  }

  /**
   * Estimate average offline multipliers for a zone, based on event
   * uptime probability.
   *
   * uptime = duration / (duration + cooldown)
   * averageMultiplier = 1.0 + (multiplier - 1.0) * uptime
   *
   * This is a statistical approximation used by the offline calculator.
   */
  getAverageOfflineMultipliers(zoneId: string): IZoneMultipliers {
    const result: IZoneMultipliers = {
      xpMultiplier: 1.0,
      gatheringMultiplier: 1.0,
      reputationMultiplier: 1.0,
    };

    const zoneEvents = this.eventsByZone.get(zoneId);
    if (!zoneEvents || zoneEvents.length === 0) {
      return result;
    }

    for (const event of zoneEvents) {
      const uptime = event.durationMs / (event.durationMs + event.cooldownMs);

      if (event.effects.xpMultiplier !== undefined) {
        result.xpMultiplier += (event.effects.xpMultiplier - 1.0) * uptime;
      }
      if (event.effects.gatheringMultiplier !== undefined) {
        result.gatheringMultiplier += (event.effects.gatheringMultiplier - 1.0) * uptime;
      }
      if (event.effects.reputationMultiplier !== undefined) {
        result.reputationMultiplier += (event.effects.reputationMultiplier - 1.0) * uptime;
      }
    }

    return result;
  }

  /**
   * Serialize state for saving.
   */
  serialize(): IZoneEventSaveData {
    const cooldowns: Record<string, number> = {};
    for (const [eventId, expiresAt] of this.cooldowns) {
      cooldowns[eventId] = expiresAt;
    }

    return {
      activeEvents: this.activeEvents.map((e) => ({ ...e, effects: { ...e.effects } })),
      cooldowns,
      elapsedSinceLastCheck: this.elapsedSinceLastCheck,
    };
  }

  /**
   * Restore state from a save.
   */
  deserialize(data: IZoneEventSaveData): void {
    this.activeEvents = data.activeEvents.map((e) => ({
      ...e,
      effects: { ...e.effects },
    }));

    this.cooldowns.clear();
    for (const [eventId, expiresAt] of Object.entries(data.cooldowns)) {
      this.cooldowns.set(eventId, expiresAt);
    }

    this.elapsedSinceLastCheck = data.elapsedSinceLastCheck;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Remove expired events and start their cooldowns.
   */
  private expireEvents(nowMs: number): void {
    const expired: IActiveZoneEvent[] = [];
    const remaining: IActiveZoneEvent[] = [];

    for (const active of this.activeEvents) {
      if (nowMs >= active.expiresAt) {
        expired.push(active);
      } else {
        remaining.push(active);
      }
    }

    this.activeEvents = remaining;

    for (const event of expired) {
      // Start cooldown
      const definition = this.eventsById.get(event.eventId);
      if (definition) {
        this.cooldowns.set(event.eventId, nowMs + definition.cooldownMs);
      }

      this.eventBus.emit(EngineEventType.ZONE_EVENT_EXPIRED, {
        eventId: event.eventId,
        zoneId: event.zoneId,
        type: event.type,
      });
    }
  }

  /**
   * Roll for new events across all zones.
   */
  private rollForEvents(rng: SeededRandom, nowMs: number): void {
    for (const [_zoneId, zoneEvents] of this.eventsByZone) {
      for (const event of zoneEvents) {
        // Skip if already active
        if (this.activeEvents.some((a) => a.eventId === event.id)) {
          continue;
        }

        // Skip if on cooldown
        const cooldownExpires = this.cooldowns.get(event.id);
        if (cooldownExpires !== undefined && nowMs < cooldownExpires) {
          continue;
        }

        // Roll for this event
        if (rng.chance(this.eventBaseChance)) {
          const activeEvent: IActiveZoneEvent = {
            eventId: event.id,
            zoneId: event.zoneId,
            type: event.type,
            startedAt: nowMs,
            expiresAt: nowMs + event.durationMs,
            effects: { ...event.effects },
          };

          this.activeEvents.push(activeEvent);

          // Clear any expired cooldown entry
          this.cooldowns.delete(event.id);

          this.eventBus.emit(EngineEventType.ZONE_EVENT_STARTED, {
            eventId: event.id,
            zoneId: event.zoneId,
            type: event.type,
            durationMs: event.durationMs,
            effects: { ...event.effects },
          });
        }
      }
    }
  }
}
