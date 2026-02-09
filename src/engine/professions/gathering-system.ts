import type { IMaterial, IProfessionState, IGatheringResult } from '@shared/types/profession';
import type { IBalanceConfig } from '@shared/types/balance';
import { MaterialTier, ProfessionId } from '@shared/types/enums';
import type { MaterialBank } from './material-bank';

// ---------------------------------------------------------------------------
// Constants: skill thresholds for each material tier.
// A gathering profession needs at least this skill to gather the tier.
// ---------------------------------------------------------------------------

const TIER_SKILL_THRESHOLDS: Record<number, number> = {
  [MaterialTier.T1]: 1,
  [MaterialTier.T2]: 50,
  [MaterialTier.T3]: 125,
  [MaterialTier.T4]: 200,
  [MaterialTier.T5]: 250,
  [MaterialTier.T6]: 275,
};

// Tier ranges mapped from zone level
const TIER_ZONE_RANGES: Array<{ minLevel: number; maxLevel: number; tier: MaterialTier }> = [
  { minLevel: 1, maxLevel: 10, tier: MaterialTier.T1 },
  { minLevel: 11, maxLevel: 20, tier: MaterialTier.T2 },
  { minLevel: 21, maxLevel: 30, tier: MaterialTier.T3 },
  { minLevel: 31, maxLevel: 40, tier: MaterialTier.T4 },
  { minLevel: 41, maxLevel: 50, tier: MaterialTier.T5 },
  { minLevel: 51, maxLevel: 60, tier: MaterialTier.T6 },
];

// Gathering profession IDs that work on ticks (not event-based)
const TICK_GATHERING_PROFESSIONS: ReadonlySet<ProfessionId> = new Set([
  ProfessionId.Mining,
  ProfessionId.Herbalism,
]);

// Skill-up thresholds: how far past the tier threshold before skill-up chance drops to 0
const SKILLUP_RANGE_PER_TIER = 75;

// ---------------------------------------------------------------------------
// Pure functions (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Determine the material tier available in a zone based on zone level.
 * Clamps to T1..T6.
 */
export function getZoneMaterialTier(zoneLevel: number): MaterialTier {
  if (zoneLevel <= 0) return MaterialTier.T1;

  for (let i = TIER_ZONE_RANGES.length - 1; i >= 0; i--) {
    const range = TIER_ZONE_RANGES[i]!;
    if (zoneLevel >= range.minLevel) {
      return range.tier;
    }
  }
  return MaterialTier.T1;
}

/**
 * Get all materials available for gathering given profession, zone tier, and skill.
 *
 * Returns materials whose:
 * 1. `source` is 'gathering'
 * 2. `gatheringProfession` matches the profession
 * 3. `tier` is <= zoneTier
 * 4. Player skill meets the tier's skill threshold
 */
export function getAvailableMaterials(
  allMaterials: IMaterial[],
  professionId: ProfessionId,
  zoneTier: MaterialTier,
  skill: number,
): IMaterial[] {
  return allMaterials.filter(mat => {
    if (mat.source !== 'gathering') return false;
    if (mat.gatheringProfession !== professionId) return false;
    if (mat.tier > zoneTier) return false;
    const threshold = TIER_SKILL_THRESHOLDS[mat.tier] ?? 1;
    return skill >= threshold;
  });
}

/**
 * Select a material from the available pool using a random value.
 * Uniform distribution across the pool.
 */
export function selectGatheredMaterial(
  pool: IMaterial[],
  random: number,
): IMaterial | null {
  if (pool.length === 0) return null;
  const index = Math.min(Math.floor(random * pool.length), pool.length - 1);
  return pool[index]!;
}

/**
 * Determine whether the player gets a skill-up from a successful gather.
 *
 * Chance = 1 - (skill - tierThreshold) / SKILLUP_RANGE_PER_TIER
 * Clamped to [0, 1].
 *
 * At skill = tierThreshold => 100% chance
 * At skill = tierThreshold + SKILLUP_RANGE_PER_TIER => 0% chance
 */
export function rollSkillUp(
  skill: number,
  materialTier: MaterialTier,
  random: number,
): boolean {
  const threshold = TIER_SKILL_THRESHOLDS[materialTier] ?? 1;
  const progress = (skill - threshold) / SKILLUP_RANGE_PER_TIER;
  const chance = Math.max(0, Math.min(1, 1 - progress));

  if (chance <= 0) return false;
  if (chance >= 1) return true;

  return random < chance;
}

// ---------------------------------------------------------------------------
// GatheringSystem configuration
// ---------------------------------------------------------------------------

export interface GatheringSystemConfig {
  materialBank: MaterialBank;
  professions: IProfessionState[];
  allMaterials: IMaterial[];
  balanceConfig: IBalanceConfig['professions'];
  zoneLevel: number;
  /** Injectable RNG for deterministic testing. Returns [0, 1). */
  rng?: () => number;
}

// ---------------------------------------------------------------------------
// GatheringSystem class
// ---------------------------------------------------------------------------

/**
 * Handles passive gathering ticks (mining, herbalism) and event-based
 * gathering (skinning on monster kill).
 *
 * Implements a tick-based approach: every `gatheringIntervalTicks` ticks,
 * attempts a gather for each tick-based gathering profession the player has.
 *
 * Skinning is triggered by calling `onMonsterKill()` when a beast-type
 * monster is defeated.
 */
export class GatheringSystem {
  private readonly bank: MaterialBank;
  private readonly professions: IProfessionState[];
  private readonly allMaterials: IMaterial[];
  private readonly config: IBalanceConfig['professions'];
  private readonly rng: () => number;

  private zoneLevel: number;
  private tickCounter = 0;
  private lastGatherResult: IGatheringResult | null = null;

  constructor(opts: GatheringSystemConfig) {
    this.bank = opts.materialBank;
    this.professions = opts.professions;
    this.allMaterials = opts.allMaterials;
    this.config = opts.balanceConfig;
    this.zoneLevel = opts.zoneLevel;
    this.rng = opts.rng ?? Math.random;
  }

  /**
   * Update the zone level (called when the player changes zones).
   */
  setZoneLevel(level: number): void {
    this.zoneLevel = level;
  }

  /**
   * Advance one tick. Returns the gather result if a gather occurred, null otherwise.
   * Only tick-based gathering professions (mining, herbalism) are processed here.
   */
  tick(): IGatheringResult | null {
    this.tickCounter++;

    if (this.tickCounter < this.config.gatheringIntervalTicks) {
      return null;
    }

    // Reset counter
    this.tickCounter = 0;

    // Find tick-based gathering professions
    const tickProfessions = this.professions.filter(
      p => TICK_GATHERING_PROFESSIONS.has(p.professionId),
    );

    if (tickProfessions.length === 0) return null;

    let lastResult: IGatheringResult | null = null;

    for (const profState of tickProfessions) {
      const result = this.gatherForProfession(profState, this.zoneLevel);
      if (result) {
        lastResult = result;
      }
    }

    this.lastGatherResult = lastResult;
    return lastResult;
  }

  /**
   * Handle a monster kill event. If the player has skinning and the monster
   * is a beast type, attempt to gather leather.
   *
   * @param monsterId - The monster template ID
   * @param monsterLevel - The monster's level
   * @param isBeast - Whether the monster is a beast type (skinnable)
   */
  onMonsterKill(
    _monsterId: string,
    monsterLevel: number,
    isBeast: boolean,
  ): IGatheringResult | null {
    if (!isBeast) return null;

    const skinningProf = this.professions.find(
      p => p.professionId === ProfessionId.Skinning,
    );
    if (!skinningProf) return null;

    const result = this.gatherForProfession(skinningProf, monsterLevel);
    if (result) {
      this.lastGatherResult = result;
    }
    return result;
  }

  /**
   * Get the last gather result (useful for reading skill-up info after tick).
   */
  getLastGatherResult(): IGatheringResult | null {
    return this.lastGatherResult;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private gatherForProfession(
    profState: IProfessionState,
    level: number,
  ): IGatheringResult | null {
    const zoneTier = getZoneMaterialTier(level);
    const available = getAvailableMaterials(
      this.allMaterials,
      profState.professionId,
      zoneTier,
      profState.skill,
    );

    if (available.length === 0) return null;

    const material = selectGatheredMaterial(available, this.rng());
    if (!material) return null;

    // Calculate yield: base + skill bonus
    const yieldBonus = Math.floor(
      profState.skill * this.config.gatheringSkillBonusPerPoint,
    );
    const quantity = this.config.gatheringBaseYield + yieldBonus;

    // Add to bank
    this.bank.add(material.id, quantity);

    // Roll for skill-up
    let skillUp = false;
    if (profState.skill < profState.maxSkill) {
      skillUp = rollSkillUp(profState.skill, material.tier, this.rng());
      if (skillUp) {
        profState.skill = Math.min(profState.skill + 1, profState.maxSkill);
      }
    }

    return {
      materialId: material.id,
      quantity,
      skillUp,
    };
  }
}
