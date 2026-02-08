# Phase 1 Implementation Plan — Character System (Task 9)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Pending

---

## Task 9 -- XP and Leveling System

**Worktree:** `feat/character-system`
**Branch:** `feat/character-system`
**Depends on:** Tasks 6, 7, 8

### Step 9.1 -- Write XP system tests

**File: `tests/unit/engine/progression/xp-system.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { awardXP, canGainXPFromMonster } from '@engine/progression/xp-system';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('canGainXPFromMonster', () => {
  it('should return false if monster is 5+ levels above player', () => {
    expect(canGainXPFromMonster(10, 15, config)).toBe(false);
  });

  it('should return true for same-level monster', () => {
    expect(canGainXPFromMonster(10, 10, config)).toBe(true);
  });

  it('should return false for gray monsters (8+ levels below)', () => {
    expect(canGainXPFromMonster(20, 11, config)).toBe(false);
  });

  it('should return true for monsters slightly below', () => {
    expect(canGainXPFromMonster(20, 18, config)).toBe(true);
  });
});

describe('awardXP', () => {
  it('should level up when XP exceeds threshold', () => {
    const result = awardXP({
      currentLevel: 1,
      currentXP: 100,
      xpGained: 100,
      config,
    });
    // XP to level 2 = 150. With 100 current + 100 gained = 200, should level to 2 with 50 remainder
    expect(result.newLevel).toBe(2);
    expect(result.remainingXP).toBe(50);
    expect(result.levelsGained).toBe(1);
  });

  it('should handle multiple level-ups from large XP gains', () => {
    const result = awardXP({
      currentLevel: 1,
      currentXP: 0,
      xpGained: 50000,
      config,
    });
    expect(result.newLevel).toBeGreaterThan(5);
    expect(result.levelsGained).toBeGreaterThan(4);
  });

  it('should not exceed level 60', () => {
    const result = awardXP({
      currentLevel: 59,
      currentXP: 60000,
      xpGained: 100000,
      config,
    });
    expect(result.newLevel).toBe(60);
  });

  it('should not gain XP at level 60', () => {
    const result = awardXP({
      currentLevel: 60,
      currentXP: 0,
      xpGained: 1000,
      config,
    });
    expect(result.newLevel).toBe(60);
    expect(result.levelsGained).toBe(0);
    expect(result.remainingXP).toBe(0);
  });
});
```

### Step 9.2 -- Implement XP system

**File: `src/engine/progression/xp-system.ts`**

```typescript
import type { IBalanceConfig } from '@shared/types/balance';
import { xpToNextLevel, getLevelDiffXpModifier } from '@engine/character/stat-calculator';

const MAX_LEVEL = 60;

export function canGainXPFromMonster(
  playerLevel: number,
  monsterLevel: number,
  config: IBalanceConfig,
): boolean {
  const modifier = getLevelDiffXpModifier(playerLevel, monsterLevel, config);
  return modifier > 0;
}

export function getXPFromMonsterKill(
  playerLevel: number,
  monsterLevel: number,
  baseMonsterXP: number,
  config: IBalanceConfig,
): number {
  const modifier = getLevelDiffXpModifier(playerLevel, monsterLevel, config);
  return Math.floor(baseMonsterXP * modifier);
}

export interface IAwardXPParams {
  currentLevel: number;
  currentXP: number;
  xpGained: number;
  config: IBalanceConfig;
}

export interface IAwardXPResult {
  newLevel: number;
  remainingXP: number;
  levelsGained: number;
  totalXPAbsorbed: number;
}

/**
 * Award XP and handle level-ups. Returns new level and remaining XP.
 */
export function awardXP(params: IAwardXPParams): IAwardXPResult {
  let { currentLevel, currentXP } = params;
  const { xpGained, config } = params;
  const startLevel = currentLevel;

  if (currentLevel >= MAX_LEVEL) {
    return { newLevel: MAX_LEVEL, remainingXP: 0, levelsGained: 0, totalXPAbsorbed: 0 };
  }

  let xpPool = currentXP + xpGained;
  let totalAbsorbed = xpGained;

  while (currentLevel < MAX_LEVEL) {
    const needed = xpToNextLevel(currentLevel, config);
    if (needed <= 0) break;
    if (xpPool < needed) break;

    xpPool -= needed;
    currentLevel++;
  }

  // Clamp at max level
  if (currentLevel >= MAX_LEVEL) {
    xpPool = 0;
  }

  return {
    newLevel: currentLevel,
    remainingXP: xpPool,
    levelsGained: currentLevel - startLevel,
    totalXPAbsorbed: totalAbsorbed,
  };
}
```

**Run:** `pnpm test -- tests/unit/engine/progression/xp-system.test.ts` -- should PASS.

**Commit:** `feat(progression): add XP system with level-up logic and level difference modifiers`

### Step 9.3 -- Create zones data file

**File: `data/zones/zones.json`**

```json
[
  { "id": "zone_01", "name": "Sunstone Valley", "description": "A peaceful starting valley with gentle hills and farmsteads.", "levelRange": { "min": 1, "max": 5 }, "monsterIds": ["wolf", "boar", "bandit", "spider"], "questCount": 10, "nextZoneId": "zone_02", "theme": "starting" },
  { "id": "zone_02", "name": "Thornwick Hamlet", "description": "A farming community under threat from undead and giant spiders.", "levelRange": { "min": 5, "max": 10 }, "monsterIds": ["giant-spider", "undead-farmer", "scarecrow", "plague-rat", "cultist"], "questCount": 12, "nextZoneId": "zone_03", "theme": "starting" },
  { "id": "zone_03", "name": "Wildwood Thicket", "description": "A dense ancient forest teeming with corrupted wildlife.", "levelRange": { "min": 11, "max": 15 }, "monsterIds": ["treant", "wild-bear", "corrupted-druid", "forest-sprite", "thorn-elemental"], "questCount": 15, "nextZoneId": "zone_04", "theme": "wildwood" },
  { "id": "zone_04", "name": "Silvergrass Meadows", "description": "Rolling plains roamed by centaurs and harpies.", "levelRange": { "min": 15, "max": 20 }, "monsterIds": ["centaur-warrior", "harpy", "rogue-elemental", "plains-lion", "dust-devil"], "questCount": 15, "nextZoneId": "zone_05", "theme": "wildwood" },
  { "id": "zone_05", "name": "Mistmoor Bog", "description": "A treacherous swamp filled with poisonous creatures.", "levelRange": { "min": 21, "max": 25 }, "monsterIds": ["lizardfolk", "bog-wraith", "toxic-ooze", "swamp-horror", "marsh-crawler"], "questCount": 18, "nextZoneId": "zone_06", "theme": "mistmoors" },
  { "id": "zone_06", "name": "Embercrag Caverns", "description": "Deep underground caverns lit by rivers of molten rock.", "levelRange": { "min": 25, "max": 30 }, "monsterIds": ["fire-elemental", "dwarven-ghost", "cave-spider", "magma-wurm", "ember-golem"], "questCount": 18, "nextZoneId": "zone_07", "theme": "mistmoors" },
  { "id": "zone_07", "name": "Skyreach Summits", "description": "Snow-capped peaks with fierce mountain predators.", "levelRange": { "min": 31, "max": 35 }, "monsterIds": ["griffon", "wind-elemental", "yeti", "mountain-goat", "frost-wyrm", "avalanche-golem"], "questCount": 18, "nextZoneId": "zone_08", "theme": "skyreach" },
  { "id": "zone_08", "name": "Ironhold Fortress", "description": "A war-torn fortress under siege by orc raiders.", "levelRange": { "min": 35, "max": 40 }, "monsterIds": ["orc-raider", "siege-engine", "orc-warlord", "battle-troll", "war-shaman", "orc-berserker"], "questCount": 20, "nextZoneId": "zone_09", "theme": "skyreach" },
  { "id": "zone_09", "name": "Blighted Wastes", "description": "A cursed wasteland where the undead armies march endlessly.", "levelRange": { "min": 41, "max": 45 }, "monsterIds": ["skeleton-knight", "plague-beast", "death-knight", "bone-dragon", "ghoul-pack", "necromancer"], "questCount": 20, "nextZoneId": "zone_10", "theme": "blighted" },
  { "id": "zone_10", "name": "Ashfall Plateau", "description": "A volcanic plateau dominated by dragonkin and fire giants.", "levelRange": { "min": 45, "max": 50 }, "monsterIds": ["dragonkin", "fire-giant", "lava-lurker", "obsidian-golem", "phoenix-spawn", "magma-lord"], "questCount": 20, "nextZoneId": "zone_11", "theme": "blighted" },
  { "id": "zone_11", "name": "Twilight Reaches", "description": "An ethereal realm where reality frays at the edges.", "levelRange": { "min": 51, "max": 55 }, "monsterIds": ["shadow-stalker", "corrupted-angel", "void-tender", "twilight-sentinel", "phase-beast", "reality-shredder"], "questCount": 22, "nextZoneId": "zone_12", "theme": "ascendant" },
  { "id": "zone_12", "name": "Ascendant Spire", "description": "The final challenge: ancient constructs guard the path to power.", "levelRange": { "min": 55, "max": 60 }, "monsterIds": ["ancient-construct", "void-lord", "spire-guardian", "arcane-colossus", "ascendant-wraith", "entropy-weaver"], "questCount": 22, "nextZoneId": null, "theme": "ascendant" }
]
```

**Commit:** `feat(data): add zones.json with all 12 leveling zone definitions`

---

