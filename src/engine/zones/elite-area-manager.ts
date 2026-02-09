import type { IEliteArea } from '@shared/types/zone-expansion';
import type { QuestChainManager } from './quest-chain-manager';
import type { EventBus } from '@engine/events/event-bus';
import { EngineEventType } from '@shared/types/ipc';

/**
 * Stat multipliers returned for an elite area's monsters.
 */
export interface IEliteStatMultipliers {
  hpMultiplier: number;
  damageMultiplier: number;
  xpMultiplier: number;
  reputationMultiplier: number;
  lootQualityBoost: number;
  levelBoost: number;
}

/**
 * Serialized state for save/load.
 */
export interface IEliteAreaSaveData {
  unlockedZones: string[];
}

/**
 * Manages elite area state per zone.
 *
 * Not an IGameSystem -- it is a stateful service queried by other systems.
 * It checks unlock conditions (all quest chains in a zone complete) and
 * provides stat multipliers for elite area monsters.
 */
export class EliteAreaManager {
  /** Elite area definitions indexed by zone id. */
  private eliteAreas: Map<string, IEliteArea> = new Map();

  /** Elite area definitions indexed by elite area id. */
  private eliteAreasById: Map<string, IEliteArea> = new Map();

  /** Which quest chain ids must be completed per zone to unlock its elite area. */
  private requiredChains: Map<string, string[]> = new Map();

  /** Set of zone ids whose elite areas are unlocked. */
  private unlockedZones: Set<string> = new Set();

  private eventBus: EventBus;
  private questChainManager: QuestChainManager;

  constructor(eventBus: EventBus, questChainManager: QuestChainManager) {
    this.eventBus = eventBus;
    this.questChainManager = questChainManager;
  }

  /**
   * Load elite area definitions and their unlock requirements.
   *
   * @param eliteAreas    - Array of elite area definitions.
   * @param chainRequirements - Map of zoneId -> array of chainIds required for unlock.
   */
  loadEliteAreas(
    eliteAreas: ReadonlyArray<IEliteArea>,
    chainRequirements: Record<string, string[]>,
  ): void {
    for (const ea of eliteAreas) {
      this.eliteAreas.set(ea.zoneId, ea);
      this.eliteAreasById.set(ea.id, ea);
    }
    for (const [zoneId, chains] of Object.entries(chainRequirements)) {
      this.requiredChains.set(zoneId, chains);
    }
  }

  /**
   * Check whether the elite area in the given zone should be unlocked.
   * If all required quest chains are completed and the area is not already
   * unlocked, it marks it as unlocked and emits an event.
   */
  checkUnlocks(zoneId: string): void {
    if (this.unlockedZones.has(zoneId)) {
      return;
    }

    const elite = this.eliteAreas.get(zoneId);
    if (!elite) {
      return;
    }

    const required = this.requiredChains.get(zoneId);
    if (!required) {
      return;
    }

    // Check that every required chain is completed.
    const allComplete = required.every((chainId) => {
      const progress = this.questChainManager.getProgress(chainId);
      return progress !== undefined && progress.completed;
    });

    if (allComplete) {
      this.unlockedZones.add(zoneId);
      this.eventBus.emit(EngineEventType.ELITE_AREA_UNLOCKED, {
        eliteAreaId: elite.id,
        zoneId,
      });
    }
  }

  /**
   * Returns whether the elite area for a zone is unlocked.
   */
  isUnlocked(zoneId: string): boolean {
    return this.unlockedZones.has(zoneId);
  }

  /**
   * Returns whether the player can enter the elite area of a zone.
   * Requires the area to be unlocked AND the player level to be >= zone max level.
   *
   * @param zoneId       - The zone id.
   * @param playerLevel  - The player's current level.
   * @param zoneMaxLevel - The maximum level of the zone.
   */
  canEnter(zoneId: string, playerLevel: number, zoneMaxLevel: number): boolean {
    if (!this.unlockedZones.has(zoneId)) {
      return false;
    }
    return playerLevel >= zoneMaxLevel;
  }

  /**
   * Get the stat multipliers for an elite area by its id.
   * Returns undefined if the elite area id is not recognized.
   */
  getStatMultipliers(eliteAreaId: string): IEliteStatMultipliers | undefined {
    const elite = this.eliteAreasById.get(eliteAreaId);
    if (!elite) {
      return undefined;
    }
    return {
      hpMultiplier: elite.hpMultiplier,
      damageMultiplier: elite.damageMultiplier,
      xpMultiplier: elite.xpMultiplier,
      reputationMultiplier: elite.reputationMultiplier,
      lootQualityBoost: elite.lootQualityBoost,
      levelBoost: elite.levelBoost,
    };
  }

  /**
   * Get the elite area definition for a zone.
   */
  getEliteArea(zoneId: string): IEliteArea | undefined {
    return this.eliteAreas.get(zoneId);
  }

  /**
   * Serialize state for saving.
   */
  serialize(): IEliteAreaSaveData {
    return {
      unlockedZones: [...this.unlockedZones],
    };
  }

  /**
   * Restore state from a save.
   */
  deserialize(data: IEliteAreaSaveData): void {
    this.unlockedZones.clear();
    for (const zoneId of data.unlockedZones) {
      this.unlockedZones.add(zoneId);
    }
  }
}
