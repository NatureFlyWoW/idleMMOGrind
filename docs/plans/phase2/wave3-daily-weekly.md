# Phase 2 -- Daily/Weekly Systems (Tasks W1-W2)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/daily-weekly`
**Worktree:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-daily-weekly\`
**Depends on:** All Wave 1 + Wave 2 branches merged to main
**Design doc:** `docs/plans/phase2/reputation.md` (daily quest section)

---

## Task W1 -- Daily Quest Generator & Currency Caps

**Goal:** Implement the daily quest rotation system and currency cap management.

### Step W1.1 -- Add types to `src/shared/types/daily-weekly.ts`

```typescript
import { CurrencyType } from './enums';

/** Daily quest definition */
export interface IDailyQuest {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  factionId: string;
  objectives: { type: 'kill' | 'collect'; targetId: string; count: number }[];
  rewards: {
    xp: number;
    gold: number;
    reputation: number;
    currency?: { type: CurrencyType; amount: number };
  };
}

/** Daily quest pool (loaded from data) */
export interface IDailyQuestPool {
  quests: IDailyQuest[];
  dailySlots: number;
  resetHourUTC: number;
}

/** Weekly reset state */
export interface IWeeklyResetState {
  lastWeeklyReset: number;
  raidLockoutsCleared: string[];
  weeklyQuestsCompleted: string[];
  valorPointsEarned: number;
  valorPointsCap: number;
}

/** Currency cap config */
export interface ICurrencyCap {
  currency: CurrencyType;
  weeklyCap: number;
  totalCap: number;
}

/** Player daily/weekly state in save */
export interface ISaveDailyWeeklyState {
  dailyQuests: {
    available: string[];
    completed: string[];
    lastDailyReset: number;
  };
  weeklyState: IWeeklyResetState;
  currencyTotals: Partial<Record<CurrencyType, number>>;
}
```

Export from barrel.

### Step W1.2 -- Write daily quest generator tests

**File:** `tests/unit/engine/daily-weekly/daily-quest-generator.test.ts`

Test cases:
- `generateDailyQuests(pool, date, rng)` selects `dailySlots` quests (10)
- Selected quests distributed across factions (no more than 2 per faction)
- Same seed + date produces same quest selection (deterministic)
- Different date produces different selection
- `isDailyResetNeeded(lastReset, now)` detects when reset is due
- Daily reset clears completed list and generates new quests
- Quest completion awards reputation, XP, gold, currency

### Step W1.3 -- Implement daily quest generator

**File:** `src/engine/daily-weekly/daily-quest-generator.ts`

### Step W1.4 -- Write currency manager tests

**File:** `tests/unit/engine/daily-weekly/currency-manager.test.ts`

Test cases:
- `addCurrency(type, amount)` respects weekly cap
- Valor points capped at weekly limit (e.g., 1000/week)
- Justice points have total cap (e.g., 4000) but no weekly cap
- `canAfford(type, amount)` check
- `spend(type, amount)` deducts; returns false if insufficient
- Weekly reset clears valor earned counter but not total balance
- Currency state serializes/deserializes

### Step W1.5 -- Implement currency manager

**File:** `src/engine/daily-weekly/currency-manager.ts`

### Step W1.6 -- Extend balance config

Add to `IBalanceConfig`:

```typescript
dailyWeekly: {
  dailyQuestSlots: number;
  dailyResetHourUTC: number;
  weeklyResetDay: number;
  weeklyResetHourUTC: number;
  valorWeeklyCap: number;
  justiceTotalCap: number;
  dailyQuestXPBase: number;
  dailyQuestGoldBase: number;
  dailyQuestRepRange: { min: number; max: number };
};
```

### Step W1.7 -- Run tests, commit

Commit: `feat(daily): implement daily quest generator and currency cap manager`

---

## Task W2 -- Weekly Resets, World Bosses & Game Loop Integration

**Goal:** Implement weekly reset logic, world boss system, and wire everything into the game loop.

### Step W2.1 -- Write weekly reset manager tests

**File:** `tests/unit/engine/daily-weekly/weekly-reset.test.ts`

Test cases:
- Weekly reset clears all raid lockouts
- Weekly reset resets valor earned counter
- Weekly reset refreshes weekly quest availability
- `isWeeklyResetNeeded(lastReset, now)` detects reset
- Reset fires event `weekly_reset_occurred`
- World boss spawns on weekly reset (1 per week)

### Step W2.2 -- Implement weekly reset manager

**File:** `src/engine/daily-weekly/weekly-reset-manager.ts`

### Step W2.3 -- Write world boss tests

**File:** `tests/unit/engine/daily-weekly/world-boss.test.ts`

Test cases:
- One world boss spawns per week from a rotating pool
- World boss is level 62 equivalent (heroic difficulty)
- World boss has enhanced loot table (Epic+ quality)
- World boss awards reputation with relevant zone faction
- Can only attempt world boss once per week
- World boss can be attempted offline (counts as 1 heroic equivalent)

### Step W2.4 -- Implement world boss system

**File:** `src/engine/daily-weekly/world-boss.ts`

### Step W2.5 -- Create data files

**Files:**
- `data/factions/dailies.json` -- Daily quest pool (50+ quests distributed across factions)
- `data/world-bosses.json` -- World boss definitions (12 bosses, rotating weekly)

### Step W2.6 -- Wire into game loop

Modify `src/engine/worker-entry.ts`:
- Check daily reset on each tick (compare timestamps)
- Check weekly reset on each tick
- Process daily quest objectives alongside normal quest tracking
- Include daily/weekly state in `IGameStateSnapshot`
- Currency state accessible for vendor purchases

### Step W2.7 -- Update offline calculator

- Offline daily quest completion estimate (if quests were available)
- World boss attempt during offline (if eligible)

### Step W2.8 -- Write data validation tests

**File:** `tests/unit/data/daily-weekly-validation.test.ts`

Test cases:
- All daily quests reference valid zone and faction IDs
- Daily quest objectives reference valid monster IDs
- World boss levels and loot tables are valid
- No duplicate daily quest or world boss IDs

### Step W2.9 -- Run full test suite, commit

Commit: `feat(daily): implement weekly resets, world bosses, and game loop integration`
