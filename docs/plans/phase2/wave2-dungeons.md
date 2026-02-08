# Phase 2 -- Dungeon System (Tasks D1-D5)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/dungeon-system`
**Worktree:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-dungeon-system\`
**Depends on:** `feat/zone-expansion` merged to main
**Design doc:** `docs/plans/phase2/dungeons-raids.md`

**Key Design Decision:** Per-boss granular success model. Each boss has an independent success check. Failed runs end at the boss where the player failed; partial loot from cleared bosses is awarded. No lockout consumed on failure.

---

## Task D1 -- Shared Types: Dungeons, Bosses, Lockouts

**Goal:** Define all dungeon-related TypeScript interfaces.

### Step D1.1 -- Add dungeon enums to `src/shared/types/enums.ts`

```typescript
// ---- Boss Mechanic Types ----
export enum BossMechanicType {
  HighDamage = 'high_damage',
  MagicHeavy = 'magic_heavy',
  Enrage = 'enrage',
  AoeDamage = 'aoe_damage',
  DebuffStacking = 'debuff_stacking',
  PhaseShift = 'phase_shift',
}

// ---- Dungeon Run Status ----
export enum DungeonRunStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
}

// ---- Currency Type ----
export enum CurrencyType {
  Gold = 'gold',
  JusticePoints = 'justice_points',
  ValorPoints = 'valor_points',
}
```

### Step D1.2 -- Create `src/shared/types/dungeon.ts`

```typescript
import {
  DungeonDifficulty, BossMechanicType, DungeonRunStatus,
  CurrencyType, ItemQuality, GearSlot,
} from './enums';

/** Boss definition within a dungeon */
export interface IBossDefinition {
  id: string;
  name: string;
  level: number;
  healthMultiplier: number;
  damageMultiplier: number;
  mechanicType: BossMechanicType;
  enrageTimerMs: number;
  lootTable: IBossLootEntry[];
}

/** Boss-specific loot table entry */
export interface IBossLootEntry {
  itemTemplateId: string;
  dropChance: number;
  qualityOverride?: ItemQuality;
  slotOverride?: GearSlot;
  isTokenDrop?: boolean;
}

/** Dungeon definition */
export interface IDungeonDefinition {
  id: string;
  name: string;
  description: string;
  levelRange: { min: number; max: number };
  heroicLevel: number;
  normalClearTimeMs: number;
  heroicClearTimeMs: number;
  unlockRequirement: IDungeonUnlockReq;
  bosses: IBossDefinition[];
  heroicBonusBoss?: IBossDefinition;
  trashPacks: number;
  trashLootChance: number;
  completionRewards: IDungeonRewards;
}

/** Dungeon unlock requirement */
export interface IDungeonUnlockReq {
  zoneId: string;
  questChainsCompleted?: number;
  minLevel?: number;
}

/** Dungeon completion rewards */
export interface IDungeonRewards {
  xpMultiplier: number;
  reputationFactionId: string;
  reputationAmount: number;
  justicePoints: number;
  valorPoints?: number;
}

/** Per-boss result in a dungeon run */
export interface IBossResult {
  bossId: string;
  succeeded: boolean;
  successChance: number;
  lootDropped: string[];
}

/** Result of a complete dungeon run */
export interface IDungeonRunResult {
  dungeonId: string;
  difficulty: DungeonDifficulty;
  status: DungeonRunStatus;
  bossResults: IBossResult[];
  totalXP: number;
  totalGold: number;
  totalReputation: number;
  currencyRewards: Partial<Record<CurrencyType, number>>;
  lootItems: string[];
  clearTimeMs: number;
  timestamp: number;
}

/** Lockout entry */
export interface IDungeonLockout {
  dungeonId: string;
  difficulty: DungeonDifficulty;
  completedAt: number;
  expiresAt: number;
}

/** Player dungeon state in save */
export interface ISaveDungeonState {
  lockouts: IDungeonLockout[];
  dungeonsCompleted: Record<string, number>;
  heroicDungeonsCompleted: Record<string, number>;
  lastDungeonRun?: IDungeonRunResult;
}
```

### Step D1.3 -- Export from barrel and write type tests

Add `export * from './dungeon';` to `src/shared/types/index.ts`.

**File:** `tests/unit/shared/dungeon-types.test.ts`

Test enum values and interface compilation.

### Step D1.4 -- Extend save types

Add `dungeons: ISaveDungeonState;` to `ISaveData` in `src/shared/types/save.ts`.

### Step D1.5 -- Extend balance config

Add to `IBalanceConfig`:

```typescript
dungeons: {
  baseSuccessRate: number;
  minSuccessChance: number;
  maxSuccessChance: number;
  mechanicModifiers: Record<BossMechanicType, {
    statWeight: string;
    penaltyFactor: number;
  }>;
  heroicStatMultiplier: number;
  heroicLockoutHours: number;
  trashXpFraction: number;
  trashGoldFraction: number;
};
```

Add values to `data/balance.json`.

### Step D1.6 -- Run tests, commit

Commit: `feat(types): add dungeon, boss, and lockout interfaces`

---

## Task D2 -- Dungeon Success Formula & Boss Encounter Resolution

**Goal:** Implement the per-boss success calculation and encounter resolution logic.

### Step D2.1 -- Write boss success formula tests

**File:** `tests/unit/engine/dungeons/boss-success.test.ts`

Test cases:
- Base success = `(playerPower / bossPowerReq) * baseSuccessRate`
- Result clamped between `minSuccessChance` (0.05) and `maxSuccessChance` (0.99)
- Overgeared player (power >> requirement) approaches max success
- Undergeared player (power << requirement) approaches min success
- `high_damage` mechanic: penalizes players with low Stamina/armor
- `magic_heavy` mechanic: penalizes players with low resistance
- `enrage` mechanic: penalizes players with low DPS
- `aoe_damage` mechanic: penalizes players with low health regen
- `debuff_stacking` mechanic: penalizes based on spirit/class abilities
- `phase_shift` mechanic: requires sustained DPS over longer timer
- Player power calculation includes: average iLevel, relevant stat totals, talent bonuses

### Step D2.2 -- Implement boss success formula

**File:** `src/engine/dungeons/boss-success.ts`

Pure functions:
- `calculatePlayerPower(stats, equipment, talents, config)` -> number
- `calculateBossRequirement(boss, difficulty, config)` -> number
- `calculateSuccessChance(playerPower, bossReq, mechanicType, stats, config)` -> number
- `resolveBossEncounter(successChance, rng)` -> boolean

### Step D2.3 -- Write boss loot resolution tests

**File:** `tests/unit/engine/dungeons/boss-loot.test.ts`

Test cases:
- On boss success, roll each loot table entry against `dropChance`
- At least 1 drop per boss kill (forced if all rolls fail)
- Quality floor: Normal = Uncommon+, Heroic = Rare+
- Token drops are tracked separately
- Loot generated with correct iLevel for dungeon level range

### Step D2.4 -- Implement boss loot resolution

**File:** `src/engine/dungeons/boss-loot.ts`

Uses existing `item-generator.ts` and `loot-system.ts`. Extends with boss-specific loot table support.

### Step D2.5 -- Run tests, commit

Commit: `feat(dungeons): implement per-boss success formula and loot resolution`

---

## Task D3 -- Dungeon Runner Engine

**Goal:** Implement the dungeon runner that processes a complete dungeon run sequentially through trash packs and bosses.

### Step D3.1 -- Write dungeon runner tests

**File:** `tests/unit/engine/dungeons/dungeon-runner.test.ts`

Test cases:
- `startRun(dungeonId, difficulty, characterState)` initializes a run
- Trash packs auto-resolve with minor loot/XP
- Each boss resolved sequentially using boss-success formula
- Run stops at first failed boss (status = Failed)
- Successful full clear sets status = Completed
- Partial loot from cleared bosses on failure
- Partial XP proportional to bosses cleared
- Partial reputation proportional to bosses cleared
- Heroic mode applies `heroicStatMultiplier` to all bosses
- Heroic bonus boss appended to boss list
- Events emitted: `dungeon_started`, `boss_defeated`, `boss_failed`, `dungeon_completed`
- Clear time calculated based on trash packs + boss encounters

### Step D3.2 -- Implement dungeon runner

**File:** `src/engine/dungeons/dungeon-runner.ts`

```typescript
import type { IDungeonDefinition, IDungeonRunResult, IBossResult } from '@shared/types/dungeon';
import type { IComputedStats } from '@shared/types/state';
import type { IBalanceConfig } from '@shared/types/balance';
import type { EventBus } from '@engine/events/event-bus';
import type { SeededRandom } from '@shared/utils/rng';
import { DungeonDifficulty, DungeonRunStatus } from '@shared/types/enums';

export class DungeonRunner {
  constructor(
    private eventBus: EventBus,
    private config: IBalanceConfig,
  ) {}

  runDungeon(params: {
    dungeon: IDungeonDefinition;
    difficulty: DungeonDifficulty;
    playerStats: IComputedStats;
    playerILevel: number;
    rng: SeededRandom;
  }): IDungeonRunResult { /* ... */ }
}
```

### Step D3.3 -- Run tests, commit

Commit: `feat(dungeons): implement dungeon runner engine with sequential boss resolution`

---

## Task D4 -- Lockout Manager & Game Loop Integration

**Goal:** Implement the lockout system and wire dungeons into the game loop.

### Step D4.1 -- Write lockout manager tests

**File:** `tests/unit/engine/dungeons/lockout-manager.test.ts`

Test cases:
- `canRun(dungeonId, difficulty)` returns true if no active lockout
- `applyLockout(dungeonId, difficulty)` creates lockout entry
- Heroic lockouts expire after `heroicLockoutHours`
- Normal dungeons have no lockout
- Expired lockouts are cleaned up
- `getLockouts()` returns all active lockouts
- Lockout state serializes/deserializes for save
- Lockout not applied on failed runs

### Step D4.2 -- Implement lockout manager

**File:** `src/engine/dungeons/lockout-manager.ts`

### Step D4.3 -- Wire dungeons into game loop

Modify `src/engine/worker-entry.ts`:
- Add dungeon run request handling (IPC message from renderer)
- Dungeon runner pauses normal combat during run
- On run completion, apply lockout and add loot to inventory
- Include dungeon state in `IGameStateSnapshot`

### Step D4.4 -- Update IPC types

Add to `src/shared/types/ipc.ts`:
- `DungeonRunRequest` message (dungeonId, difficulty)
- `DungeonRunResult` message (IDungeonRunResult)
- `DungeonListRequest` / `DungeonListResponse`

### Step D4.5 -- Update offline calculator

Modify `src/engine/offline/offline-calculator.ts`:
- Normal dungeons: estimate clears based on success rate and clear time
- Heroic dungeons: max 1 offline clear if lockout available
- No raid progress offline

### Step D4.6 -- Run tests, commit

Commit: `feat(dungeons): implement lockout manager and wire into game loop`

---

## Task D5 -- Dungeon Data Files (10 Dungeons)

**Goal:** Create all 10 dungeon data files with boss definitions, loot tables, and unlock requirements.

### Step D5.1 -- Create dungeon data files

**Files:** `data/dungeons/dgn_01.json` through `data/dungeons/dgn_10.json`

Follow the dungeon table from the design doc:
- `dgn_01` Hollow Barrow (lv 10-15, 3 bosses)
- `dgn_02` Thornwick Sewers (lv 15-20, 3 bosses)
- `dgn_03` Wildwood Sanctum (lv 20-25, 3 bosses)
- `dgn_04` Mistmoor Depths (lv 25-30, 3 bosses)
- `dgn_05` Embercrag Forge (lv 30-35, 3 bosses)
- `dgn_06` Skyreach Aerie (lv 35-40, 3 bosses)
- `dgn_07` Ironhold Dungeons (lv 40-45, 4 bosses)
- `dgn_08` Blightcrypt (lv 45-50, 4 bosses)
- `dgn_09` Ashfall Caldera (lv 50-55, 4 bosses)
- `dgn_10` Spire of Twilight (lv 55-60, 4 bosses)

Each dungeon includes: boss definitions with mechanic types, loot tables, unlock requirements, heroic bonus boss, clear time estimates.

Total: 34 normal bosses + 10 heroic bonus bosses = 44 boss definitions.

### Step D5.2 -- Create boss loot tables

Loot tables embedded in dungeon files. Each boss has 2-3 loot entries with:
- Slot-specific drops (early bosses: common slots; final bosses: weapons/trinkets)
- Quality floors (Normal: Uncommon+, Heroic: Rare+)
- Token drops on specific bosses (placeholder for raid tier system)

### Step D5.3 -- Write data validation tests

**File:** `tests/unit/data/dungeon-data-validation.test.ts`

Test cases:
- All dungeons have valid zone ID references
- Boss levels match dungeon level range
- Boss mechanic types are valid enum values
- Loot table entries have valid drop chances (0-1)
- Heroic bonus boss exists for each dungeon
- Clear times are reasonable (10-30 min range)
- Unlock requirements reference valid quest chain IDs or zone IDs
- No duplicate boss or dungeon IDs

### Step D5.4 -- Run full test suite, commit

Commit: `feat(dungeons): add 10 dungeon data files with 44 boss definitions`
