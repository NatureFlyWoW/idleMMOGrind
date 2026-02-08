import { RecipeDifficulty, SkillBracket } from '@shared/types/enums';
import type { IBalanceConfig } from '@shared/types/balance';

// ---------------------------------------------------------------------------
// Bracket ordering (immutable lookup tables)
// ---------------------------------------------------------------------------

/**
 * Ordered array of all skill brackets from lowest to highest.
 */
const BRACKET_ORDER: readonly SkillBracket[] = [
  SkillBracket.Apprentice,
  SkillBracket.Journeyman,
  SkillBracket.Expert,
  SkillBracket.Artisan,
  SkillBracket.Master,
  SkillBracket.Grandmaster,
] as const;

/**
 * Training costs per bracket (gold). Scales with bracket level.
 */
const BRACKET_TRAINING_COSTS: Readonly<Record<SkillBracket, number>> = {
  [SkillBracket.Apprentice]: 10,
  [SkillBracket.Journeyman]: 50,
  [SkillBracket.Expert]: 100,
  [SkillBracket.Artisan]: 250,
  [SkillBracket.Master]: 500,
  [SkillBracket.Grandmaster]: 1000,
};

/**
 * Minimum character level required to train each bracket.
 */
const BRACKET_REQUIRED_LEVELS: Readonly<Record<SkillBracket, number>> = {
  [SkillBracket.Apprentice]: 1,
  [SkillBracket.Journeyman]: 10,
  [SkillBracket.Expert]: 20,
  [SkillBracket.Artisan]: 35,
  [SkillBracket.Master]: 45,
  [SkillBracket.Grandmaster]: 55,
};

// ---------------------------------------------------------------------------
// Difficulty color calculation
// ---------------------------------------------------------------------------

/**
 * Determine the difficulty color of a recipe relative to the player's current
 * profession skill.
 *
 * - Orange: recipeSkillReq >= currentSkill (guaranteed skill-up)
 * - Yellow: recipeSkillReq >= currentSkill - 25 (75% skill-up)
 * - Green:  recipeSkillReq >= currentSkill - 50 (25% skill-up)
 * - Gray:   everything below (0% skill-up)
 */
export function getRecipeDifficulty(
  recipeSkillReq: number,
  currentSkill: number,
): RecipeDifficulty {
  if (recipeSkillReq >= currentSkill) {
    return RecipeDifficulty.Orange;
  }
  if (recipeSkillReq >= currentSkill - 25) {
    return RecipeDifficulty.Yellow;
  }
  if (recipeSkillReq >= currentSkill - 50) {
    return RecipeDifficulty.Green;
  }
  return RecipeDifficulty.Gray;
}

// ---------------------------------------------------------------------------
// Skill-up chance and rolling
// ---------------------------------------------------------------------------

/**
 * Look up the skill-up chance for a given difficulty color from balance config.
 */
export function getSkillUpChance(
  difficulty: RecipeDifficulty,
  config: IBalanceConfig['professions'],
): number {
  return config.skillUpChances[difficulty];
}

/**
 * Roll a skill-up check for a craft.
 *
 * @param difficulty - The recipe difficulty color
 * @param config - Profession balance config (contains skillUpChances)
 * @param random - A random value in [0, 1) from the RNG
 * @returns true if the skill-up succeeds
 */
export function rollCraftSkillUp(
  difficulty: RecipeDifficulty,
  config: IBalanceConfig['professions'],
  random: number,
): boolean {
  const chance = getSkillUpChance(difficulty, config);
  if (chance <= 0) return false;
  if (chance >= 1) return true;
  return random < chance;
}

// ---------------------------------------------------------------------------
// Bracket management (pure functions)
// ---------------------------------------------------------------------------

/**
 * Determine which bracket a given skill value falls into.
 *
 * The bracketThresholds array is ordered [0, 75, 150, 225, 275, 300].
 * Skill 0-74 = Apprentice, 75-149 = Journeyman, etc.
 */
export function getBracketForSkill(
  skill: number,
  bracketThresholds: number[],
): SkillBracket {
  // Walk backward through thresholds to find the highest bracket the skill qualifies for
  for (let i = bracketThresholds.length - 1; i >= 0; i--) {
    const threshold = bracketThresholds[i];
    if (threshold !== undefined && skill >= threshold) {
      return BRACKET_ORDER[i] ?? SkillBracket.Apprentice;
    }
  }
  return SkillBracket.Apprentice;
}

/**
 * Get the maximum skill for a given bracket.
 *
 * The max skill for a bracket is the threshold of the NEXT bracket.
 * For the last bracket (Grandmaster), the max is the last threshold value (300).
 */
export function getBracketMaxSkill(
  bracket: SkillBracket,
  bracketThresholds: number[],
): number {
  const index = BRACKET_ORDER.indexOf(bracket);
  if (index < 0) return 0;

  // If there is a next bracket, the max is its threshold
  const nextThreshold = bracketThresholds[index + 1];
  if (nextThreshold !== undefined) {
    return nextThreshold;
  }

  // For the last bracket, return the last threshold value
  const lastThreshold = bracketThresholds[bracketThresholds.length - 1];
  return lastThreshold ?? 300;
}

/**
 * Get the gold cost to train a given bracket.
 */
export function getBracketTrainingCost(bracket: SkillBracket): number {
  return BRACKET_TRAINING_COSTS[bracket];
}

/**
 * Get the minimum character level required to train a given bracket.
 */
export function getBracketRequiredLevel(bracket: SkillBracket): number {
  return BRACKET_REQUIRED_LEVELS[bracket];
}

/**
 * Check if a character can train a given bracket based on their level.
 */
export function canTrainBracket(
  bracket: SkillBracket,
  characterLevel: number,
): boolean {
  return characterLevel >= getBracketRequiredLevel(bracket);
}

/**
 * Get the next bracket after the given one, or null if already at Grandmaster.
 */
export function getNextBracket(bracket: SkillBracket): SkillBracket | null {
  const index = BRACKET_ORDER.indexOf(bracket);
  if (index < 0 || index >= BRACKET_ORDER.length - 1) return null;
  return BRACKET_ORDER[index + 1] ?? null;
}
