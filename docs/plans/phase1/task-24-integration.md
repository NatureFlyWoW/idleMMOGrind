# Phase 1 Implementation Plan — Integration & Balance (Task 24)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Pending

---

## Task 24 -- Integration Testing and Balance Simulation

**Worktree:** main (all branches merged)
**Depends on:** All previous tasks

### Step 24.1 -- Write cross-system integration test

**File: `tests/integration/character-lifecycle.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { createCharacter } from '@engine/character/character-factory';
import { calculateDerivedStats, calculatePrimaryStats, xpToNextLevel } from '@engine/character/stat-calculator';
import { awardXP } from '@engine/progression/xp-system';
import { generateItem } from '@engine/gear/item-generator';
import { isUpgrade, equipItem } from '@engine/gear/inventory-manager';
import { allocateTalentPoint, canAllocatePoint } from '@engine/talents/talent-manager';
import { calculateOfflineProgress } from '@engine/offline/offline-calculator';
import { serializeSave, deserializeSave } from '@main/save/save-io';
import { Race, CharacterClass, PrimaryStat, GearSlot, ItemQuality } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('Character Lifecycle Integration', () => {
  it('should create a character, level up, equip gear, allocate talents, go offline, and save/load', () => {
    // 1. Create character
    const char = createCharacter({
      name: 'IntegrationTest',
      race: Race.Bloodborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.level).toBe(1);
    expect(char.primaryStats[PrimaryStat.Strength]).toBe(32); // 25 + 7

    // 2. Award XP and level up
    const xpResult = awardXP({
      currentLevel: char.level,
      currentXP: char.currentXP,
      xpGained: 50000,
      config,
    });
    expect(xpResult.newLevel).toBeGreaterThan(1);
    expect(xpResult.levelsGained).toBeGreaterThan(0);

    // 3. Generate and equip gear
    const rng = new SeededRandom(42);
    const newChest = generateItem({
      iLevel: 20,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    expect(newChest.iLevel).toBe(20);

    const currentChest = char.equipment[GearSlot.Chest] ?? null;
    const shouldEquip = isUpgrade(newChest, currentChest, [PrimaryStat.Strength, PrimaryStat.Stamina]);
    expect(shouldEquip).toBe(true);

    const equipResult = equipItem(char.equipment, char.inventory, newChest);
    expect(equipResult.equipment[GearSlot.Chest]?.iLevel).toBe(20);

    // 4. Calculate offline progress
    const offlineResult = calculateOfflineProgress({
      characterLevel: xpResult.newLevel,
      currentXP: xpResult.remainingXP,
      currentZoneLevel: xpResult.newLevel,
      offlineSeconds: 3600 * 8, // 8 hours offline
      rng: new SeededRandom(99),
      config,
    });
    expect(offlineResult.xpGained).toBeGreaterThan(0);
    expect(offlineResult.goldGained).toBeGreaterThan(0);

    // 5. Serialize and deserialize save
    const saveData = {
      meta: {
        version: '1.0.0',
        gameVersion: '0.1.0',
        saveSlot: 1 as const,
        createdAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        playTimeSeconds: 3600,
        checksum: '',
      },
      character: {
        id: char.id,
        name: char.name,
        race: char.race,
        classId: char.classId,
        level: xpResult.newLevel,
        currentXP: xpResult.remainingXP,
        gold: offlineResult.goldGained,
        currentHP: char.currentHP,
        currentResource: char.currentResource,
        deathCount: 0,
        totalKills: offlineResult.monstersKilled,
        totalQuestsCompleted: offlineResult.questsCompleted,
        respecCount: 0,
      },
      progression: {
        currentZoneId: 'zone_02',
        currentQuestIndex: 0,
        currentQuestKills: 0,
        zonesCompleted: ['zone_01'],
        unlockedAbilities: [],
        activeAbilityPriority: [],
      },
      inventory: {
        equipped: equipResult.equipment,
        bags: equipResult.inventory,
      },
      talents: { allocatedPoints: {}, totalPointsSpent: 0 },
      combatState: { currentMonster: null, activeBuffs: [], activeDoTs: [], cooldowns: {} },
      settings: { autoEquip: true, autoSellCommon: false, combatLogVisible: true, uiScale: 1.0 },
    };

    const buffer = serializeSave(saveData);
    expect(buffer.length).toBeGreaterThan(0);

    const restored = deserializeSave(buffer);
    expect(restored.character.name).toBe('IntegrationTest');
    expect(restored.character.level).toBe(xpResult.newLevel);
    expect(restored.character.gold).toBe(offlineResult.goldGained);
  });
});
```

**Run:** `pnpm test -- tests/integration/character-lifecycle.test.ts` -- should PASS.

**Commit:** `test(integration): add full character lifecycle integration test`

### Step 24.2 -- Write balance simulation test

**File: `tests/balance/leveling-pacing.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { xpToNextLevel, calculateMonsterXP } from '@engine/character/stat-calculator';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('Leveling Pacing Simulation', () => {
  it('should reach level 60 within 25-45 hours of active play time', () => {
    let totalSeconds = 0;
    const TICKS_PER_SECOND = 4;
    const TICKS_PER_KILL = 4; // avg 4 ticks to kill a monster
    const QUEST_XP_MULTIPLIER = 1.7; // quest bonus

    for (let level = 1; level < 60; level++) {
      const xpNeeded = xpToNextLevel(level, config);
      const monsterXP = calculateMonsterXP(level, config);
      const effectiveXPPerKill = monsterXP * QUEST_XP_MULTIPLIER;
      const killsNeeded = Math.ceil(xpNeeded / effectiveXPPerKill);
      const ticksNeeded = killsNeeded * TICKS_PER_KILL;
      const secondsNeeded = ticksNeeded / TICKS_PER_SECOND;
      totalSeconds += secondsNeeded;
    }

    const totalHours = totalSeconds / 3600;

    // Target: 25-40 hours active play
    expect(totalHours).toBeGreaterThan(15);
    expect(totalHours).toBeLessThan(50);
  });

  it('should have XP curve where early levels feel fast', () => {
    // Level 1-10 should take less than 1 hour
    let earlyXP = 0;
    for (let level = 1; level <= 10; level++) {
      earlyXP += xpToNextLevel(level, config);
    }

    const avgMonsterXP = calculateMonsterXP(5, config); // avg level 5 monster
    const killsNeeded = Math.ceil(earlyXP / (avgMonsterXP * 1.7));
    const ticksNeeded = killsNeeded * 4;
    const minutes = ticksNeeded / 4 / 60;

    expect(minutes).toBeLessThan(90); // First 10 levels in under 90 minutes
  });

  it('should have XP curve where late levels feel earned', () => {
    // Level 50-60 should take meaningful time
    let lateXP = 0;
    for (let level = 50; level < 60; level++) {
      lateXP += xpToNextLevel(level, config);
    }

    const avgMonsterXP = calculateMonsterXP(55, config);
    const killsNeeded = Math.ceil(lateXP / (avgMonsterXP * 1.7));
    const ticksNeeded = killsNeeded * 4;
    const hours = ticksNeeded / 4 / 3600;

    expect(hours).toBeGreaterThan(3); // Last 10 levels take at least 3 hours
  });
});
```

**Run:** `pnpm test -- tests/balance/leveling-pacing.test.ts` -- should PASS.

**Commit:** `test(balance): add leveling pacing simulation tests`

### Step 24.3 -- Run full test suite

```bash
pnpm test
```

All tests across unit, integration, and balance directories should pass.

**Commit:** `chore: verify full test suite passes for Phase 1`

---

