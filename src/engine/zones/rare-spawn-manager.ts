import type { IRareSpawn } from '@shared/types/zone-expansion';
import type { ItemQuality, GearSlot } from '@shared/types/enums';
import type { EventBus } from '@engine/events/event-bus';
import type { SeededRandom } from '@shared/utils/rng';
import { EngineEventType } from '@shared/types/ipc';

/**
 * Stats and reward info for a rare spawn.
 */
export interface IRareSpawnStats {
  id: string;
  name: string;
  level: number;
  hpMultiplier: number;
  damageMultiplier: number;
  xpMultiplier: number;
  reputationReward: number;
  guaranteedDropQuality: ItemQuality;
  guaranteedDropSlot?: GearSlot;
}

/**
 * Serialized state for save/load.
 */
export interface IRareSpawnSaveData {
  defeatedRares: Record<string, number>;
}

/**
 * Default cooldown after defeating a rare spawn: 5 minutes.
 */
const DEFAULT_COOLDOWN_MS = 300_000;

/**
 * Manages rare spawn encounters per zone.
 *
 * Not an IGameSystem -- called by the combat system when a monster is killed.
 * Rolls to see if a rare should spawn next. If triggered, replaces the next
 * combat encounter with the rare monster. Emits events for rare spawn
 * appeared and defeated.
 *
 * Tracks defeated rares with timestamps to prevent re-triggers within a
 * cooldown window.
 */
export class RareSpawnManager {
  /** Rare spawn definitions indexed by zone id (multiple rares per zone). */
  private raresByZone: Map<string, IRareSpawn[]> = new Map();

  /** Rare spawn definitions indexed by rare id. */
  private raresById: Map<string, IRareSpawn> = new Map();

  /** Timestamps of when each rare was last defeated. */
  private defeatedRares: Map<string, number> = new Map();

  private eventBus: EventBus;
  private cooldownMs: number;

  constructor(eventBus: EventBus, cooldownMs: number = DEFAULT_COOLDOWN_MS) {
    this.eventBus = eventBus;
    this.cooldownMs = cooldownMs;
  }

  /**
   * Load rare spawn definitions.
   */
  loadRareSpawns(rares: ReadonlyArray<IRareSpawn>): void {
    for (const rare of rares) {
      this.raresById.set(rare.id, rare);

      const existing = this.raresByZone.get(rare.zoneId);
      if (existing) {
        existing.push(rare);
      } else {
        this.raresByZone.set(rare.zoneId, [rare]);
      }
    }
  }

  /**
   * Roll for a rare spawn in the given zone. Called on each monster kill.
   *
   * For each rare spawn definition in the zone, rolls against its spawnChance.
   * Rares on cooldown (recently defeated) are skipped. Returns the first rare
   * that triggers, or undefined if none did.
   *
   * @param zoneId - The current zone id.
   * @param rng    - Seeded random for deterministic rolls.
   * @param nowMs  - Current timestamp in milliseconds.
   * @returns The triggered rare spawn, or undefined.
   */
  rollForRareSpawn(
    zoneId: string,
    rng: SeededRandom,
    nowMs: number,
  ): IRareSpawn | undefined {
    const zoneRares = this.raresByZone.get(zoneId);
    if (!zoneRares || zoneRares.length === 0) {
      return undefined;
    }

    for (const rare of zoneRares) {
      // Skip if on cooldown
      const lastDefeated = this.defeatedRares.get(rare.id);
      if (lastDefeated !== undefined && nowMs - lastDefeated < this.cooldownMs) {
        continue;
      }

      if (rng.chance(rare.spawnChance)) {
        this.eventBus.emit(EngineEventType.RARE_SPAWN_APPEARED, {
          rareSpawnId: rare.id,
          zoneId: rare.zoneId,
          name: rare.name,
          level: rare.level,
        });
        return rare;
      }
    }

    return undefined;
  }

  /**
   * Record that a rare spawn was defeated. Starts its cooldown timer and
   * emits a RARE_SPAWN_DEFEATED event.
   *
   * @param rareId - The rare spawn id.
   * @param nowMs  - Current timestamp in milliseconds.
   */
  recordDefeat(rareId: string, nowMs: number): void {
    this.defeatedRares.set(rareId, nowMs);

    this.eventBus.emit(EngineEventType.RARE_SPAWN_DEFEATED, {
      rareSpawnId: rareId,
      defeatedAt: nowMs,
    });
  }

  /**
   * Get the stats and reward info for a rare spawn by id.
   */
  getRareStats(rareId: string): IRareSpawnStats | undefined {
    const rare = this.raresById.get(rareId);
    if (!rare) {
      return undefined;
    }
    return {
      id: rare.id,
      name: rare.name,
      level: rare.level,
      hpMultiplier: rare.hpMultiplier,
      damageMultiplier: rare.damageMultiplier,
      xpMultiplier: rare.xpMultiplier,
      reputationReward: rare.reputationReward,
      guaranteedDropQuality: rare.guaranteedDropQuality,
      guaranteedDropSlot: rare.guaranteedDropSlot,
    };
  }

  /**
   * Get the cooldown duration in milliseconds.
   */
  getCooldownMs(): number {
    return this.cooldownMs;
  }

  /**
   * Clear all cooldowns (used for testing / debug).
   */
  clearCooldowns(): void {
    this.defeatedRares.clear();
  }

  /**
   * Serialize state for saving.
   */
  serialize(): IRareSpawnSaveData {
    const defeatedRares: Record<string, number> = {};
    for (const [rareId, timestamp] of this.defeatedRares) {
      defeatedRares[rareId] = timestamp;
    }
    return { defeatedRares };
  }

  /**
   * Restore state from a save.
   */
  deserialize(data: IRareSpawnSaveData): void {
    this.defeatedRares.clear();
    for (const [rareId, timestamp] of Object.entries(data.defeatedRares)) {
      this.defeatedRares.set(rareId, timestamp);
    }
  }
}
