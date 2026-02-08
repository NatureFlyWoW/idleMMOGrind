import { describe, it, expect } from 'vitest';
import {
  getRecipeDifficulty,
  getSkillUpChance,
  rollCraftSkillUp,
  getBracketForSkill,
  getBracketMaxSkill,
  getBracketTrainingCost,
  getBracketRequiredLevel,
  canTrainBracket,
  getNextBracket,
} from '@engine/professions/skill-progression';
import { RecipeDifficulty, SkillBracket } from '@shared/types/enums';
import type { IBalanceConfig } from '@shared/types/balance';

const defaultBalanceProfessions: IBalanceConfig['professions'] = {
  gatheringIntervalTicks: 12,
  gatheringBaseYield: 1,
  gatheringSkillBonusPerPoint: 0.005,
  craftTimeBaseMs: 3000,
  craftTimeComplexityMultiplier: 1.5,
  maxCraftingQueue: 10,
  materialBankSlots: 100,
  skillUpChances: {
    [RecipeDifficulty.Orange]: 1.0,
    [RecipeDifficulty.Yellow]: 0.75,
    [RecipeDifficulty.Green]: 0.25,
    [RecipeDifficulty.Gray]: 0,
  },
  bracketThresholds: [0, 75, 150, 225, 275, 300],
};

// ---------------------------------------------------------------------------
// getRecipeDifficulty
// ---------------------------------------------------------------------------

describe('getRecipeDifficulty', () => {
  it('should return Orange when recipeSkillReq >= currentSkill', () => {
    expect(getRecipeDifficulty(50, 50)).toBe(RecipeDifficulty.Orange);
    expect(getRecipeDifficulty(60, 50)).toBe(RecipeDifficulty.Orange);
    expect(getRecipeDifficulty(1, 1)).toBe(RecipeDifficulty.Orange);
  });

  it('should return Yellow when recipeSkillReq >= currentSkill - 25', () => {
    // currentSkill=50, recipeReq=30 => 30 >= 50-25=25 => yellow
    expect(getRecipeDifficulty(30, 50)).toBe(RecipeDifficulty.Yellow);
    // Boundary: recipeReq = currentSkill - 1 => still yellow
    expect(getRecipeDifficulty(49, 50)).toBe(RecipeDifficulty.Yellow);
    // Boundary: recipeReq = currentSkill - 25 => still yellow
    expect(getRecipeDifficulty(25, 50)).toBe(RecipeDifficulty.Yellow);
  });

  it('should return Green when recipeSkillReq >= currentSkill - 50', () => {
    // currentSkill=50, recipeReq=5 => 5 >= 50-50=0 => green
    expect(getRecipeDifficulty(5, 50)).toBe(RecipeDifficulty.Green);
    // Boundary: recipeReq = currentSkill - 26 => green (not yellow)
    expect(getRecipeDifficulty(24, 50)).toBe(RecipeDifficulty.Green);
    // Boundary: recipeReq = currentSkill - 50 => still green
    expect(getRecipeDifficulty(0, 50)).toBe(RecipeDifficulty.Green);
  });

  it('should return Gray when recipeSkillReq < currentSkill - 50', () => {
    // currentSkill=60, recipeReq=1 => 1 < 60-50=10 => gray
    expect(getRecipeDifficulty(1, 60)).toBe(RecipeDifficulty.Gray);
    // Boundary: recipeReq = currentSkill - 51 => gray
    expect(getRecipeDifficulty(9, 60)).toBe(RecipeDifficulty.Gray);
  });

  it('should handle edge cases with skill=0 and skill=1', () => {
    expect(getRecipeDifficulty(1, 0)).toBe(RecipeDifficulty.Orange);
    expect(getRecipeDifficulty(0, 0)).toBe(RecipeDifficulty.Orange);
    expect(getRecipeDifficulty(1, 1)).toBe(RecipeDifficulty.Orange);
  });

  it('should handle high skill values', () => {
    expect(getRecipeDifficulty(300, 300)).toBe(RecipeDifficulty.Orange);
    expect(getRecipeDifficulty(275, 300)).toBe(RecipeDifficulty.Yellow);
    expect(getRecipeDifficulty(250, 300)).toBe(RecipeDifficulty.Green);
    expect(getRecipeDifficulty(249, 300)).toBe(RecipeDifficulty.Gray);
  });
});

// ---------------------------------------------------------------------------
// getSkillUpChance
// ---------------------------------------------------------------------------

describe('getSkillUpChance', () => {
  it('should return 1.0 for Orange difficulty', () => {
    expect(getSkillUpChance(RecipeDifficulty.Orange, defaultBalanceProfessions)).toBe(1.0);
  });

  it('should return 0.75 for Yellow difficulty', () => {
    expect(getSkillUpChance(RecipeDifficulty.Yellow, defaultBalanceProfessions)).toBe(0.75);
  });

  it('should return 0.25 for Green difficulty', () => {
    expect(getSkillUpChance(RecipeDifficulty.Green, defaultBalanceProfessions)).toBe(0.25);
  });

  it('should return 0 for Gray difficulty', () => {
    expect(getSkillUpChance(RecipeDifficulty.Gray, defaultBalanceProfessions)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// rollCraftSkillUp
// ---------------------------------------------------------------------------

describe('rollCraftSkillUp', () => {
  it('should always return true for orange (100% chance)', () => {
    expect(rollCraftSkillUp(RecipeDifficulty.Orange, defaultBalanceProfessions, 0.99)).toBe(true);
  });

  it('should return true for yellow when roll < 0.75', () => {
    expect(rollCraftSkillUp(RecipeDifficulty.Yellow, defaultBalanceProfessions, 0.5)).toBe(true);
  });

  it('should return false for yellow when roll >= 0.75', () => {
    expect(rollCraftSkillUp(RecipeDifficulty.Yellow, defaultBalanceProfessions, 0.75)).toBe(false);
    expect(rollCraftSkillUp(RecipeDifficulty.Yellow, defaultBalanceProfessions, 0.99)).toBe(false);
  });

  it('should return true for green when roll < 0.25', () => {
    expect(rollCraftSkillUp(RecipeDifficulty.Green, defaultBalanceProfessions, 0.1)).toBe(true);
  });

  it('should return false for green when roll >= 0.25', () => {
    expect(rollCraftSkillUp(RecipeDifficulty.Green, defaultBalanceProfessions, 0.25)).toBe(false);
    expect(rollCraftSkillUp(RecipeDifficulty.Green, defaultBalanceProfessions, 0.5)).toBe(false);
  });

  it('should always return false for gray (0% chance)', () => {
    expect(rollCraftSkillUp(RecipeDifficulty.Gray, defaultBalanceProfessions, 0.0)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bracket management
// ---------------------------------------------------------------------------

describe('getBracketForSkill', () => {
  const thresholds = defaultBalanceProfessions.bracketThresholds;

  it('should return Apprentice for skill 0-74', () => {
    expect(getBracketForSkill(0, thresholds)).toBe(SkillBracket.Apprentice);
    expect(getBracketForSkill(74, thresholds)).toBe(SkillBracket.Apprentice);
  });

  it('should return Journeyman for skill 75-149', () => {
    expect(getBracketForSkill(75, thresholds)).toBe(SkillBracket.Journeyman);
    expect(getBracketForSkill(149, thresholds)).toBe(SkillBracket.Journeyman);
  });

  it('should return Expert for skill 150-224', () => {
    expect(getBracketForSkill(150, thresholds)).toBe(SkillBracket.Expert);
    expect(getBracketForSkill(224, thresholds)).toBe(SkillBracket.Expert);
  });

  it('should return Artisan for skill 225-274', () => {
    expect(getBracketForSkill(225, thresholds)).toBe(SkillBracket.Artisan);
    expect(getBracketForSkill(274, thresholds)).toBe(SkillBracket.Artisan);
  });

  it('should return Master for skill 275-299', () => {
    expect(getBracketForSkill(275, thresholds)).toBe(SkillBracket.Master);
    expect(getBracketForSkill(299, thresholds)).toBe(SkillBracket.Master);
  });

  it('should return Grandmaster for skill 300', () => {
    expect(getBracketForSkill(300, thresholds)).toBe(SkillBracket.Grandmaster);
  });
});

describe('getBracketMaxSkill', () => {
  const thresholds = defaultBalanceProfessions.bracketThresholds;

  it('should return 75 for Apprentice', () => {
    expect(getBracketMaxSkill(SkillBracket.Apprentice, thresholds)).toBe(75);
  });

  it('should return 150 for Journeyman', () => {
    expect(getBracketMaxSkill(SkillBracket.Journeyman, thresholds)).toBe(150);
  });

  it('should return 225 for Expert', () => {
    expect(getBracketMaxSkill(SkillBracket.Expert, thresholds)).toBe(225);
  });

  it('should return 275 for Artisan', () => {
    expect(getBracketMaxSkill(SkillBracket.Artisan, thresholds)).toBe(275);
  });

  it('should return 300 for Master', () => {
    expect(getBracketMaxSkill(SkillBracket.Master, thresholds)).toBe(300);
  });

  it('should return 300 for Grandmaster (max skill cap)', () => {
    expect(getBracketMaxSkill(SkillBracket.Grandmaster, thresholds)).toBe(300);
  });
});

describe('skill cap increases when bracket training is purchased', () => {
  const thresholds = defaultBalanceProfessions.bracketThresholds;

  it('should raise maxSkill from 75 to 150 when training Journeyman', () => {
    const apprenticeMax = getBracketMaxSkill(SkillBracket.Apprentice, thresholds);
    const journeymanMax = getBracketMaxSkill(SkillBracket.Journeyman, thresholds);
    expect(apprenticeMax).toBe(75);
    expect(journeymanMax).toBe(150);
    expect(journeymanMax).toBeGreaterThan(apprenticeMax);
  });
});

describe('skill cannot exceed current bracket max', () => {
  const thresholds = defaultBalanceProfessions.bracketThresholds;

  it('should cap at bracket max when skill would exceed it', () => {
    const max = getBracketMaxSkill(SkillBracket.Apprentice, thresholds);
    const skill = 80; // Over the cap
    const clamped = Math.min(skill, max);
    expect(clamped).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// Training cost
// ---------------------------------------------------------------------------

describe('getBracketTrainingCost', () => {
  it('should return 10 for Apprentice', () => {
    expect(getBracketTrainingCost(SkillBracket.Apprentice)).toBe(10);
  });

  it('should return 50 for Journeyman', () => {
    expect(getBracketTrainingCost(SkillBracket.Journeyman)).toBe(50);
  });

  it('should return 100 for Expert', () => {
    expect(getBracketTrainingCost(SkillBracket.Expert)).toBe(100);
  });

  it('should return 250 for Artisan', () => {
    expect(getBracketTrainingCost(SkillBracket.Artisan)).toBe(250);
  });

  it('should return 500 for Master', () => {
    expect(getBracketTrainingCost(SkillBracket.Master)).toBe(500);
  });

  it('should return 1000 for Grandmaster', () => {
    expect(getBracketTrainingCost(SkillBracket.Grandmaster)).toBe(1000);
  });

  it('should scale with bracket level', () => {
    const costs = [
      getBracketTrainingCost(SkillBracket.Apprentice),
      getBracketTrainingCost(SkillBracket.Journeyman),
      getBracketTrainingCost(SkillBracket.Expert),
      getBracketTrainingCost(SkillBracket.Artisan),
      getBracketTrainingCost(SkillBracket.Master),
      getBracketTrainingCost(SkillBracket.Grandmaster),
    ];
    // Each cost should be greater than the previous
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1]!);
    }
  });
});

// ---------------------------------------------------------------------------
// Training level requirements
// ---------------------------------------------------------------------------

describe('getBracketRequiredLevel', () => {
  it('should return 1 for Apprentice (available immediately)', () => {
    expect(getBracketRequiredLevel(SkillBracket.Apprentice)).toBe(1);
  });

  it('should return 10 for Journeyman', () => {
    expect(getBracketRequiredLevel(SkillBracket.Journeyman)).toBe(10);
  });

  it('should return 20 for Expert', () => {
    expect(getBracketRequiredLevel(SkillBracket.Expert)).toBe(20);
  });

  it('should return 35 for Artisan', () => {
    expect(getBracketRequiredLevel(SkillBracket.Artisan)).toBe(35);
  });

  it('should return 45 for Master', () => {
    expect(getBracketRequiredLevel(SkillBracket.Master)).toBe(45);
  });

  it('should return 55 for Grandmaster', () => {
    expect(getBracketRequiredLevel(SkillBracket.Grandmaster)).toBe(55);
  });

  it('should have increasing level requirements', () => {
    const levels = [
      getBracketRequiredLevel(SkillBracket.Apprentice),
      getBracketRequiredLevel(SkillBracket.Journeyman),
      getBracketRequiredLevel(SkillBracket.Expert),
      getBracketRequiredLevel(SkillBracket.Artisan),
      getBracketRequiredLevel(SkillBracket.Master),
      getBracketRequiredLevel(SkillBracket.Grandmaster),
    ];
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThan(levels[i - 1]!);
    }
  });
});

// ---------------------------------------------------------------------------
// canTrainBracket
// ---------------------------------------------------------------------------

describe('canTrainBracket', () => {
  it('should return true when character level meets requirement', () => {
    expect(canTrainBracket(SkillBracket.Journeyman, 10)).toBe(true);
    expect(canTrainBracket(SkillBracket.Journeyman, 15)).toBe(true);
  });

  it('should return false when character level is too low', () => {
    expect(canTrainBracket(SkillBracket.Journeyman, 9)).toBe(false);
    expect(canTrainBracket(SkillBracket.Grandmaster, 54)).toBe(false);
  });

  it('should always allow Apprentice training', () => {
    expect(canTrainBracket(SkillBracket.Apprentice, 1)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getNextBracket
// ---------------------------------------------------------------------------

describe('getNextBracket', () => {
  it('should return Journeyman for Apprentice', () => {
    expect(getNextBracket(SkillBracket.Apprentice)).toBe(SkillBracket.Journeyman);
  });

  it('should return Expert for Journeyman', () => {
    expect(getNextBracket(SkillBracket.Journeyman)).toBe(SkillBracket.Expert);
  });

  it('should return Artisan for Expert', () => {
    expect(getNextBracket(SkillBracket.Expert)).toBe(SkillBracket.Artisan);
  });

  it('should return Master for Artisan', () => {
    expect(getNextBracket(SkillBracket.Artisan)).toBe(SkillBracket.Master);
  });

  it('should return Grandmaster for Master', () => {
    expect(getNextBracket(SkillBracket.Master)).toBe(SkillBracket.Grandmaster);
  });

  it('should return null for Grandmaster (no next bracket)', () => {
    expect(getNextBracket(SkillBracket.Grandmaster)).toBeNull();
  });
});
