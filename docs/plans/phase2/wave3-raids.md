# Phase 2 -- Raid System (Tasks A1-A4)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/raid-system`
**Worktree:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-raid-system\`
**Depends on:** `feat/dungeon-system` + `feat/reputation-system` merged to main
**Design doc:** `docs/plans/phase2/dungeons-raids.md`

**Key Design Decisions:**
- Flat party modifiers (not full AI simulation)
- 2/4 piece set bonuses only (defer 6-piece to Phase 3)
- Weekly lockout with boss progress persisting within the week

---

## Task A1 -- Shared Types: Raids, Attunement, Tier Sets

**Goal:** Define all raid-related TypeScript interfaces.

### Step A1.1 -- Add raid enums to `src/shared/types/enums.ts`

```typescript
// ---- Raid Size ----
export enum RaidSize {
  TenPlayer = '10p',
  TwentyFivePlayer = '25p',
}

// ---- Attunement Status ----
export enum AttunementStatus {
  Locked = 'locked',
  InProgress = 'in_progress',
  Complete = 'complete',
}
```

### Step A1.2 -- Create `src/shared/types/raid.ts`

```typescript
import {
  RaidSize, AttunementStatus, BossMechanicType, CurrencyType,
  GearSlot, ItemQuality, PrimaryStat, CharacterClass,
} from './enums';
import type { IBossDefinition, IBossLootEntry } from './dungeon';

/** Raid boss (extends dungeon boss with raid-specific fields) */
export interface IRaidBoss extends IBossDefinition {
  tierTokenClasses?: CharacterClass[];
  bonusRollTable: IBossLootEntry[];
}

/** Raid definition */
export interface IRaidDefinition {
  id: string;
  name: string;
  description: string;
  size: RaidSize;
  bosses: IRaidBoss[];
  iLevelRange: { min: number; max: number };
  attunementRequirements: IAttunementRequirement;
  weeklyLockoutReset: 'tuesday' | 'wednesday';
  clearTimeEstimateMs: number;
  tierSetId: string;
}

/** Attunement requirement */
export interface IAttunementRequirement {
  requiredDungeonClears?: string[];
  requiredRaidClears?: string[];
  requiredILevel?: number;
  requiredReputation?: { factionId: string; tier: string };
  attunementQuestChainId?: string;
}

/** Attunement quest chain */
export interface IAttunementChain {
  id: string;
  raidId: string;
  name: string;
  quests: IAttunementQuest[];
}

/** Attunement quest step */
export interface IAttunementQuest {
  id: string;
  name: string;
  description: string;
  type: 'dungeon_clear' | 'item_collect' | 'boss_kill' | 'reputation';
  targetId: string;
  count: number;
  rewards: { xp: number; gold: number; itemTemplateId?: string };
}

/** Tier set definition */
export interface ITierSet {
  id: string;
  name: string;
  raidId: string;
  classId: CharacterClass;
  pieces: ITierSetPiece[];
  bonuses: ITierSetBonus[];
}

/** Tier set piece */
export interface ITierSetPiece {
  slot: GearSlot;
  itemTemplateId: string;
  tokenBossId: string;
}

/** Tier set bonus (2-piece and 4-piece only in Phase 2) */
export interface ITierSetBonus {
  requiredPieces: 2 | 4;
  description: string;
  statBonuses?: Partial<Record<PrimaryStat, number>>;
  effectId?: string;
}

/** Flat party modifier for raids */
export interface IPartyModifier {
  raidSize: RaidSize;
  baseBonus: number;
  roleMatchBonus: number;
  roleMismatchPenalty: number;
}

/** Raid boss progress within weekly lockout */
export interface IRaidProgress {
  raidId: string;
  bossesDefeated: string[];
  weekStartTimestamp: number;
}

/** Player raid state in save */
export interface ISaveRaidState {
  attunements: Record<string, AttunementStatus>;
  attunementProgress: Record<string, { questIndex: number; objectiveProgress: Record<string, number> }>;
  raidProgress: IRaidProgress[];
  weeklyLockouts: { raidId: string; completedAt: number; expiresAt: number }[];
  tierTokens: Record<string, number>;
  bonusRollsUsed: Record<string, number>;
}
```

### Step A1.3 -- Export from barrel, extend save, extend balance, write type tests

Add `export * from './raid';` to barrel. Add `raids: ISaveRaidState;` to `ISaveData`.

Add to `IBalanceConfig`:

```typescript
raids: {
  partyModifiers: Record<RaidSize, IPartyModifier>;
  weeklyLockoutDays: number;
  bonusRollCost: { currency: CurrencyType; amount: number };
  maxBonusRollsPerBoss: number;
  tierTokenDropChance: number;
};
```

**Test file:** `tests/unit/shared/raid-types.test.ts`

### Step A1.4 -- Commit

Commit: `feat(types): add raid, attunement, and tier set interfaces`

---

## Task A2 -- Raid Runner & Party Modifier System

**Goal:** Implement the raid runner engine with flat party modifiers and tier set bonus tracking.

### Step A2.1 -- Write party modifier tests

**File:** `tests/unit/engine/raids/party-modifier.test.ts`

Test cases:
- 10-player raid: base bonus applies to success formula
- 25-player raid: different base bonus
- Player filling needed role (tank/healer) gets `roleMatchBonus`
- Player missing needed role gets `roleMismatchPenalty`
- Party modifier is a flat multiplier to success chance (not additive)

### Step A2.2 -- Implement party modifier calculator

**File:** `src/engine/raids/party-modifier.ts`

Pure function: `calculatePartyModifier(raidSize, playerRole, config)` -> number

### Step A2.3 -- Write raid runner tests

**File:** `tests/unit/engine/raids/raid-runner.test.ts`

Test cases:
- Raid run processes bosses sequentially (like dungeon runner)
- Party modifier applied to each boss success check
- Weekly lockout: boss progress persists within the week
- Can resume raid from last defeated boss
- Full clear applies weekly lockout
- Partial clear: can re-enter and continue
- Bonus roll: spend currency for extra loot chance per boss
- Tier token drops on configured bosses
- Events emitted: `raid_started`, `raid_boss_defeated`, `raid_boss_failed`, `raid_completed`
- Attunement check: cannot enter raid without meeting requirements

### Step A2.4 -- Implement raid runner

**File:** `src/engine/raids/raid-runner.ts`

Extends `DungeonRunner` concept but with weekly lockout semantics, party modifiers, bonus rolls, and tier tokens.

### Step A2.5 -- Write tier set bonus tests

**File:** `tests/unit/engine/raids/tier-set-bonus.test.ts`

Test cases:
- 0-1 pieces equipped: no bonus
- 2 pieces: 2-piece bonus active
- 3 pieces: still only 2-piece bonus
- 4 pieces: both 2-piece and 4-piece bonuses active
- Tier set bonus stats added to computed stats
- Different classes have different tier set definitions
- Tier set detection works across equipment slots (Head, Shoulders, Chest, Hands, Legs)

### Step A2.6 -- Implement tier set bonus calculator

**File:** `src/engine/raids/tier-set-bonus.ts`

Checks equipped items against tier set definitions. Returns active bonuses.

### Step A2.7 -- Run tests, commit

Commit: `feat(raids): implement raid runner with party modifiers and tier set bonuses`

---

## Task A3 -- Attunement System & Game Loop Integration

**Goal:** Implement attunement quest chains and wire raids into the game loop.

### Step A3.1 -- Write attunement manager tests

**File:** `tests/unit/engine/raids/attunement-manager.test.ts`

Test cases:
- Raid 1 has no attunement (auto-available at iLevel threshold)
- Raids 2-4 require attunement quest chain completion
- Attunement progress tracks quest-by-quest
- Attunement objectives: dungeon clears, item collections, boss kills, reputation checks
- Completed attunement is account-wide (stored per-account, not per-character)
- Cannot start raid without complete attunement
- Attunement status serializes/deserializes

### Step A3.2 -- Implement attunement manager

**File:** `src/engine/raids/attunement-manager.ts`

### Step A3.3 -- Wire raids into game loop

Modify `src/engine/worker-entry.ts`:
- Add raid run request handling (IPC)
- Raid runner pauses normal combat during run
- Weekly lockout reset logic (check timestamp on each tick)
- Include raid state in `IGameStateSnapshot`
- Tier set bonus integrated into stat calculator

### Step A3.4 -- Update IPC types

Add raid-related IPC messages: `RaidRunRequest`, `RaidRunResult`, `RaidListRequest`, `AttunementStatusRequest`.

### Step A3.5 -- Run tests, commit

Commit: `feat(raids): implement attunement system and wire raids into game loop`

---

## Task A4 -- Raid Data Files (4 Raids)

**Goal:** Create all 4 raid data files with boss definitions, tier sets, and attunement chains.

### Step A4.1 -- Create raid data files

**Files:**
- `data/raids/raid_01.json` -- Emberforge Depths (10p, 8 bosses, iLevel 71-75)
- `data/raids/raid_02.json` -- Shadowspire Citadel (10p, 10 bosses, iLevel 76-80)
- `data/raids/raid_03.json` -- Temple of the Forsaken (25p, 12 bosses, iLevel 81-85)
- `data/raids/raid_04.json` -- The Eternal Crypt (25p, 15 bosses, iLevel 86-90)

Total: 45 raid bosses with mechanic types, loot tables, and tier token drops.

### Step A4.2 -- Create tier set data

**File:** `data/raids/tier-sets.json`

9 classes x 4 raids = 36 tier set definitions. Each with:
- 5 pieces (Head, Shoulders, Chest, Hands, Legs)
- 2-piece bonus (minor passive)
- 4-piece bonus (major passive)

### Step A4.3 -- Create attunement chain data

**File:** `data/raids/attunements.json`

3 attunement chains (raids 2-4). Each with 5-8 quests mixing dungeon clears, item collections, and boss kills.

### Step A4.4 -- Write data validation tests

**File:** `tests/unit/data/raid-data-validation.test.ts`

Test cases:
- All raids have valid boss definitions
- Tier set pieces reference valid item template IDs
- Attunement chains reference valid dungeon/raid IDs
- Boss levels and iLevel ranges are appropriate
- No duplicate raid, boss, or tier set IDs
- Each class has exactly one tier set per raid tier

### Step A4.5 -- Run full test suite, commit

Commit: `feat(raids): add 4 raid data files with 45 bosses, tier sets, and attunement chains`
