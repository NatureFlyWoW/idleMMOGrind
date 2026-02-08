# Phase 2 -- Zone Expansion (Tasks Z1-Z4)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/zone-expansion`
**Worktree:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-zone-expansion\`
**Depends on:** Phase 1 only (no Phase 2 dependencies)
**Design doc:** `docs/plans/phase2/zones-expansion.md`

---

## Task Z1 -- Shared Types: Quest Chains, Monster Subtypes, Rare Spawns, Zone Events

**Goal:** Define all new TypeScript interfaces and enums needed for zone expansion.

### Step Z1.1 -- Add new enums to `src/shared/types/enums.ts`

Add the following enums:

```typescript
// ---- Monster Subtypes (determines material drops) ----
export enum MonsterSubtype {
  Beast = 'beast',
  Humanoid = 'humanoid',
  Elemental = 'elemental',
  Undead = 'undead',
  Construct = 'construct',
  Dragonkin = 'dragonkin',
}

// ---- Quest Types (extend existing with new Phase 2 types) ----
// Add to existing QuestType enum:
//   Escort = 'escort',
//   Exploration = 'exploration',

// ---- Zone Event Types ----
export enum ZoneEventType {
  MonsterSurge = 'monster_surge',
  GatheringBounty = 'gathering_bounty',
  EliteInvasion = 'elite_invasion',
  RareHunt = 'rare_hunt',
  FactionRally = 'faction_rally',
}
```

### Step Z1.2 -- Create `src/shared/types/zone-expansion.ts`

```typescript
import {
  MonsterType, MonsterSubtype, QuestType, GearSlot, ItemQuality,
  ZoneEventType,
} from './enums';

/** Extended monster template with subtype and abilities */
export interface IMonsterTemplateV2 {
  id: string;
  name: string;
  level: number;
  type: MonsterType;
  subtype: MonsterSubtype;
  health: number;
  damage: number;
  armor: number;
  resistance: number;
  attackSpeed: number;
  lootTableId: string;
  xpReward: number;
  goldReward: { min: number; max: number };
  abilities: string[];
  materialDrops: IMaterialDrop[];
}

/** Material drop from a monster */
export interface IMaterialDrop {
  materialId: string;
  chance: number;
  quantity: { min: number; max: number };
  requiresProfession?: string;
}

/** A single quest within a chain */
export interface IChainQuest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  objectives: IQuestObjective[];
  xpReward: number;
  goldReward: number;
  reputationReward?: { factionId: string; amount: number };
  gearReward?: { slot: GearSlot; qualityMin: ItemQuality };
  nextQuestId: string | null;
}

/** Quest objective */
export interface IQuestObjective {
  type: 'kill' | 'collect' | 'dungeon_clear' | 'escort' | 'explore';
  targetId: string;
  count: number;
}

/** Quest chain definition */
export interface IQuestChain {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  quests: IChainQuest[];
  completionReward: {
    xpBonus: number;
    goldBonus: number;
    reputationBonus: number;
    unlocks?: string;
  };
}

/** Quest chain progress state */
export interface IQuestChainProgress {
  chainId: string;
  currentQuestIndex: number;
  currentObjectiveProgress: Record<string, number>;
  completed: boolean;
}

/** Elite area definition */
export interface IEliteArea {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  levelBoost: number;
  hpMultiplier: number;
  damageMultiplier: number;
  xpMultiplier: number;
  reputationMultiplier: number;
  lootQualityBoost: number;
  monsterIds: string[];
}

/** Rare spawn definition */
export interface IRareSpawn {
  id: string;
  zoneId: string;
  name: string;
  level: number;
  hpMultiplier: number;
  damageMultiplier: number;
  spawnChance: number;
  guaranteedDropQuality: ItemQuality;
  guaranteedDropSlot?: GearSlot;
  xpMultiplier: number;
  reputationReward: number;
}

/** Zone event definition */
export interface IZoneEvent {
  id: string;
  zoneId: string;
  type: ZoneEventType;
  durationMs: number;
  cooldownMs: number;
  effects: IZoneEventEffects;
}

/** Effects applied during a zone event */
export interface IZoneEventEffects {
  xpMultiplier?: number;
  gatheringMultiplier?: number;
  reputationMultiplier?: number;
  rareSpawnChanceOverride?: number;
  monsterLevelBoost?: number;
  monsterSpawnRateMultiplier?: number;
}

/** Active zone event state */
export interface IActiveZoneEvent {
  eventId: string;
  zoneId: string;
  type: ZoneEventType;
  startedAt: number;
  expiresAt: number;
  effects: IZoneEventEffects;
}
```

### Step Z1.3 -- Export from barrel and write tests

Add `export * from './zone-expansion';` to `src/shared/types/index.ts`.

**Test file:** `tests/unit/shared/zone-expansion-types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  MonsterSubtype, ZoneEventType,
} from '@shared/types/enums';
import type {
  IMonsterTemplateV2, IQuestChain, IEliteArea, IRareSpawn, IZoneEvent,
} from '@shared/types/zone-expansion';

describe('Zone Expansion Types', () => {
  it('MonsterSubtype enum has all 6 values', () => {
    expect(Object.values(MonsterSubtype)).toHaveLength(6);
  });

  it('ZoneEventType enum has all 5 values', () => {
    expect(Object.values(ZoneEventType)).toHaveLength(5);
  });

  it('IQuestChain structure compiles correctly', () => {
    const chain: IQuestChain = {
      id: 'qc_test',
      zoneId: 'zone_01',
      name: 'Test Chain',
      description: 'A test',
      quests: [{
        id: 'q_01',
        name: 'Kill Wolves',
        description: 'Kill 10 wolves',
        type: 'kill' as any,
        objectives: [{ type: 'kill', targetId: 'wolf', count: 10 }],
        xpReward: 100,
        goldReward: 50,
        nextQuestId: null,
      }],
      completionReward: { xpBonus: 500, goldBonus: 100, reputationBonus: 250 },
    };
    expect(chain.quests).toHaveLength(1);
  });
});
```

### Step Z1.4 -- Extend save types

Add to `ISaveProgression` in `src/shared/types/save.ts`:

```typescript
questChains: Record<string, IQuestChainProgress>;
rareSpawnsDefeated: string[];
eliteAreasUnlocked: string[];
activeZoneEvents: IActiveZoneEvent[];
```

### Step Z1.5 -- Extend balance config

Add to `IBalanceConfig` in `src/shared/types/balance.ts`:

```typescript
zones: {
  eliteHpMultiplier: number;
  eliteDamageMultiplier: number;
  eliteXpMultiplier: number;
  eliteReputationMultiplier: number;
  rareSpawnBaseChance: number;
  rareXpMultiplier: number;
  rareReputationReward: number;
  eventCheckIntervalMs: number;
  eventBaseChance: number;
};
```

Add the corresponding values to `data/balance.json`.

### Step Z1.6 -- Run tests, commit

Run: `pnpm test` and `pnpm typecheck`
Commit: `feat(types): add zone expansion interfaces — quest chains, monster subtypes, rares, events`

---

## Task Z2 -- Quest Chain Engine & Monster Subtype System

**Goal:** Implement the quest chain progression engine that replaces Phase 1's standalone quest system, plus the monster subtype system for material drops.

### Step Z2.1 -- Write quest chain manager tests

**File:** `tests/unit/engine/zones/quest-chain-manager.test.ts`

Test cases:
- `startChain(chainId)` sets progress to quest index 0
- `progressObjective(chainId, objectiveType, targetId)` increments objective progress
- Quest completes when all objectives met; advances to next quest in chain
- Chain completes when last quest finishes; awards completion reward
- `getActiveQuests(zoneId)` returns all in-progress chains for a zone
- Quest chain progress persists through save/load (serialization)
- Cannot start a chain that is already in progress or completed
- Escort and exploration quest types resolve correctly

### Step Z2.2 -- Implement quest chain manager

**File:** `src/engine/zones/quest-chain-manager.ts`

```typescript
import type { IQuestChain, IQuestChainProgress, IChainQuest } from '@shared/types/zone-expansion';
import type { EventBus } from '@engine/events/event-bus';

export class QuestChainManager {
  private chains: Map<string, IQuestChain> = new Map();
  private progress: Map<string, IQuestChainProgress> = new Map();
  private eventBus: EventBus;

  constructor(eventBus: EventBus) { this.eventBus = eventBus; }

  loadChains(chains: IQuestChain[]): void { /* index by id */ }
  startChain(chainId: string): boolean { /* create progress entry */ }
  progressObjective(chainId: string, type: string, targetId: string, amount?: number): void { /* ... */ }
  checkQuestCompletion(chainId: string): boolean { /* check all objectives met */ }
  advanceQuest(chainId: string): void { /* move to next quest or complete chain */ }
  getActiveQuests(zoneId: string): IQuestChainProgress[] { /* filter by zone */ }
  getProgress(chainId: string): IQuestChainProgress | undefined { /* ... */ }
  serialize(): Record<string, IQuestChainProgress> { /* for save */ }
  deserialize(data: Record<string, IQuestChainProgress>): void { /* for load */ }
}
```

### Step Z2.3 -- Write monster subtype resolver tests

**File:** `tests/unit/engine/zones/monster-subtype.test.ts`

Test cases:
- Beast subtype returns leather/meat material drops
- Humanoid subtype returns cloth/coins
- Elemental returns reagents/cores
- Undead returns bone dust/rune fragments
- Construct returns gears/stone
- Dragonkin returns scales/essence
- Material drop respects `requiresProfession` field (skinning only from beasts)
- Drop chance rolls correctly

### Step Z2.4 -- Implement monster subtype resolver

**File:** `src/engine/zones/monster-subtype.ts`

Pure function that takes a `MonsterSubtype` and returns the material drop table template. Used by the game loop when a monster is killed to determine material drops alongside regular loot.

### Step Z2.5 -- Run tests, commit

Run: `pnpm test` and `pnpm typecheck`
Commit: `feat(zones): implement quest chain manager and monster subtype material drops`

---

## Task Z3 -- Elite Areas, Rare Spawns, and Zone Events Engine

**Goal:** Implement the three zone enrichment systems: elite areas with stat multipliers, rare spawn encounters, and periodic zone events.

### Step Z3.1 -- Write elite area manager tests

**File:** `tests/unit/engine/zones/elite-area.test.ts`

Test cases:
- Elite area unlocks when all zone quest chains are complete
- Elite monsters use boosted stats (HP * multiplier, damage * multiplier)
- Elite area XP reward uses configured multiplier
- Elite area loot quality is boosted by `lootQualityBoost`
- Player does not enter elite area if level < zone max

### Step Z3.2 -- Implement elite area manager

**File:** `src/engine/zones/elite-area-manager.ts`

Manages elite area state per zone. Checks unlock conditions, applies stat multipliers to monsters in elite areas, integrates with game loop.

### Step Z3.3 -- Write rare spawn manager tests

**File:** `tests/unit/engine/zones/rare-spawn.test.ts`

Test cases:
- Rare spawn triggers based on `spawnChance` per monster kill
- Rare spawn has boosted HP and damage (multipliers)
- Rare spawn always drops `guaranteedDropQuality` or better
- Rare spawn grants bonus XP and reputation
- Rare spawn defeat is tracked (cannot re-trigger same rare in short window)
- `rareSpawnsDefeated` persists in save

### Step Z3.4 -- Implement rare spawn manager

**File:** `src/engine/zones/rare-spawn-manager.ts`

Rolls for rare spawn on each monster kill. If triggered, replaces the next combat encounter with the rare monster. Emits `rare_spawn_appeared` and `rare_spawn_defeated` events.

### Step Z3.5 -- Write zone event manager tests

**File:** `tests/unit/engine/zones/zone-event.test.ts`

Test cases:
- Events trigger based on `eventBaseChance` checked every `eventCheckIntervalMs`
- Active event applies its effects (xp/gathering/reputation multipliers)
- Event expires after `durationMs`
- Cooldown prevents same event type re-triggering
- Multiple events can be active simultaneously in different zones
- Offline calculator accounts for average event uptime
- `activeZoneEvents` serialize/deserialize for save

### Step Z3.6 -- Implement zone event manager

**File:** `src/engine/zones/zone-event-manager.ts`

Implements `IGameSystem`. On each tick, checks if a new event should trigger (random roll). Maintains active event list. Provides multiplier getters consumed by combat, gathering, and reputation systems.

### Step Z3.7 -- Run tests, commit

Run: `pnpm test` and `pnpm typecheck`
Commit: `feat(zones): implement elite areas, rare spawns, and zone event systems`

---

## Task Z4 -- Zone Data Files & Game Loop Integration

**Goal:** Create all zone content data files and wire the new zone systems into the game loop.

### Step Z4.1 -- Create quest chain data files

**Files:** `data/zones/quests/zone_01.json` through `data/zones/quests/zone_12.json`

Each file contains an array of `IQuestChain` objects for that zone. Follow the quest chain distribution from the design doc:
- Zones 1-2: 2 chains each, 3-5 quests per chain
- Zones 3-6: 3 chains each, 4-6 quests per chain
- Zones 7-8: 3 chains each, 5-7 quests per chain
- Zones 9-12: 4 chains each, 5-8 quests per chain

Total: ~38 chains, ~150 quests.

### Step Z4.2 -- Create monster data files

**Files:** `data/zones/monsters/zone_01.json` through `data/zones/monsters/zone_12.json`

Each file contains an array of `IMonsterTemplateV2` objects. Enrich existing monster IDs from `zones.json` with subtypes, abilities, and material drops. Add 1-2 new monster types per zone. Total: ~70 unique monsters.

### Step Z4.3 -- Create elite area data files

**Files:** `data/zones/elites/zone_03.json` through `data/zones/elites/zone_12.json`

10 elite areas (zones 3-12). Each file contains one `IEliteArea` object.

### Step Z4.4 -- Create rare spawn data files

**Files:** `data/zones/rares/zone_01.json` through `data/zones/rares/zone_12.json`

2-3 rare spawns per zone. Each file contains an array of `IRareSpawn` objects. Total: ~30 rares.

### Step Z4.5 -- Create zone events data file

**File:** `data/zones/events.json`

Array of `IZoneEvent` definitions. 5 event types across all 12 zones.

### Step Z4.6 -- Wire zone systems into game loop

Modify `src/engine/game-loop.ts` and `src/engine/worker-entry.ts`:
- Register `QuestChainManager` as a system (processes quest objectives on monster kills)
- Register `RareSpawnManager` (rolls on each kill)
- Register `ZoneEventManager` (checks event triggers periodically)
- Register `EliteAreaManager` (checks unlock conditions)

### Step Z4.7 -- Update offline calculator

Modify `src/engine/offline/offline-calculator.ts`:
- Add quest chain progression to offline results (complete X quests per hour estimate)
- Add average zone event uptime bonus to XP/gold calculations
- Add rare spawn probability over offline period

### Step Z4.8 -- Write data validation tests

**File:** `tests/unit/data/zone-data-validation.test.ts`

Test cases:
- All quest chains reference valid zone IDs
- All monster subtypes are valid enum values
- All quest objectives reference valid monster IDs or dungeon IDs
- All rare spawns reference valid zone IDs
- All elite areas reference valid zone IDs
- Quest reward iLevels are appropriate for zone level range
- No duplicate quest/chain IDs across all files

### Step Z4.9 -- Run full test suite, commit

Run: `pnpm test` and `pnpm typecheck`
Commit: `feat(zones): add zone content data files and wire systems into game loop`
