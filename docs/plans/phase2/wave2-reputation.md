# Phase 2 -- Reputation System (Tasks R1-R3)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/reputation-system`
**Worktree:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-reputation-system\`
**Depends on:** `feat/zone-expansion` + `feat/dungeon-system` merged to main
**Design doc:** `docs/plans/phase2/reputation.md`

---

## Task R1 -- Shared Types: Factions, Reputation, Vendors

**Goal:** Define all reputation-related TypeScript interfaces.

### Step R1.1 -- Create `src/shared/types/reputation.ts`

```typescript
import { ReputationTier, CurrencyType, GearSlot, ItemQuality } from './enums';

/** Faction definition */
export interface IFactionDefinition {
  id: string;
  name: string;
  description: string;
  zoneId: string | null;
  isNeutral: boolean;
  tierThresholds: Record<ReputationTier, number>;
  tabardItemId?: string;
}

/** Reputation tier info */
export interface IReputationTierInfo {
  tier: ReputationTier;
  currentRep: number;
  tierMin: number;
  tierMax: number;
  progressPercent: number;
}

/** Vendor item for sale */
export interface IVendorItem {
  itemTemplateId: string;
  name: string;
  cost: { currency: CurrencyType; amount: number };
  requiredTier: ReputationTier;
  slot?: GearSlot;
  quality?: ItemQuality;
  iLevel?: number;
  isRecipe?: boolean;
  recipeId?: string;
}

/** Faction vendor inventory */
export interface IFactionVendor {
  factionId: string;
  items: IVendorItem[];
}

/** Reputation gain event */
export interface IReputationGain {
  factionId: string;
  amount: number;
  source: 'quest' | 'kill' | 'dungeon' | 'raid' | 'daily' | 'tabard' | 'token';
}

/** Tabard definition */
export interface ITabard {
  id: string;
  factionId: string;
  name: string;
  heroicBonusRep: number;
}

/** Player reputation state in save */
export interface ISaveReputationState {
  factions: Record<string, number>;
  tabardEquipped: string | null;
  dailyQuests: {
    availableToday: string[];
    completedToday: string[];
    lastResetTimestamp: number;
  };
  currencies: Partial<Record<CurrencyType, number>>;
}
```

### Step R1.2 -- Export from barrel and write type tests

Add `export * from './reputation';` to `src/shared/types/index.ts`.

**File:** `tests/unit/shared/reputation-types.test.ts`

### Step R1.3 -- Extend save types

Add `reputation: ISaveReputationState;` to `ISaveData`.

### Step R1.4 -- Extend balance config

Add to `IBalanceConfig`:

```typescript
reputation: {
  killRepBase: number;
  killRepElite: number;
  killRepBoss: number;
  questRepBase: number;
  questChainCompletionBonus: number;
  dungeonNormalRep: number;
  dungeonHeroicRep: number;
  dungeonBossRep: number;
  raidBossRep: number;
  raidClearBonus: number;
  tabardHeroicBonusRep: number;
  tokenRepValue: number;
  dailyRepRange: { min: number; max: number };
  altRepMultiplier: number;
};
```

### Step R1.5 -- Run tests, commit

Commit: `feat(types): add faction, reputation, and vendor interfaces`

---

## Task R2 -- Reputation Tracker & Vendor Manager

**Goal:** Implement the reputation tracker engine and vendor purchase system.

### Step R2.1 -- Write reputation tracker tests

**File:** `tests/unit/engine/reputation/reputation-tracker.test.ts`

Test cases:
- `addReputation(factionId, amount, source)` increments reputation value
- Reputation value is clamped to 0 minimum
- `getTier(factionId)` computes correct tier from value (Neutral/Friendly/Honored/Revered/Exalted)
- Tier thresholds: 0/3000/9000/21000/42000
- `getTierProgress(factionId)` returns progress within current tier
- Tabard bonus: wearing faction tabard adds `tabardHeroicBonusRep` on heroic dungeon kills
- Reputation gain events emitted: `reputation_gained`, `tier_reached`
- Full serialize/deserialize round-trip

### Step R2.2 -- Implement reputation tracker

**File:** `src/engine/reputation/reputation-tracker.ts`

```typescript
import type { IFactionDefinition, IReputationGain, IReputationTierInfo } from '@shared/types/reputation';
import type { EventBus } from '@engine/events/event-bus';
import { ReputationTier } from '@shared/types/enums';

export class ReputationTracker {
  private factions: Map<string, IFactionDefinition> = new Map();
  private reputation: Map<string, number> = new Map();
  private equippedTabard: string | null = null;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) { this.eventBus = eventBus; }

  loadFactions(factions: IFactionDefinition[]): void { /* ... */ }
  addReputation(gain: IReputationGain): void { /* ... */ }
  getTier(factionId: string): ReputationTier { /* ... */ }
  getTierInfo(factionId: string): IReputationTierInfo { /* ... */ }
  equipTabard(factionId: string): void { /* ... */ }
  getEquippedTabard(): string | null { /* ... */ }
  serialize(): Record<string, number> { /* ... */ }
  deserialize(data: Record<string, number>): void { /* ... */ }
}
```

### Step R2.3 -- Write vendor manager tests

**File:** `tests/unit/engine/reputation/vendor-manager.test.ts`

Test cases:
- `getAvailableItems(factionId)` returns items for current tier and below
- Cannot purchase items above current reputation tier
- Purchase deducts currency (gold/justice/valor)
- Purchase fails if insufficient currency
- Purchased item added to inventory
- Recipe purchase adds recipe to profession known recipes
- Vendor inventory loaded from data files

### Step R2.4 -- Implement vendor manager

**File:** `src/engine/reputation/vendor-manager.ts`

### Step R2.5 -- Run tests, commit

Commit: `feat(reputation): implement reputation tracker and vendor manager`

---

## Task R3 -- Faction Data, Vendor Inventories & Game Loop Integration

**Goal:** Create all faction data files and wire reputation into the game loop.

### Step R3.1 -- Create faction definitions

**File:** `data/factions/definitions.json`

14 faction definitions (12 zone + 2 neutral). Each includes: id, name, description, zoneId, tier thresholds, tabard info.

### Step R3.2 -- Create vendor inventory files

**Files:** `data/factions/vendors/fac_01.json` through `data/factions/vendors/fac_12.json`, plus `fac_guild.json` and `fac_artisan.json`.

14 vendor files. Each contains tiered inventory:
- Friendly: 1-2 Uncommon items, 1 recipe, tabard
- Honored: 2-3 Uncommon items, 2-3 recipes, enchant formula
- Revered: 2-3 Rare items, 2-3 rare recipes, unique enchant
- Exalted: 1-2 Epic items, 1 epic recipe

### Step R3.3 -- Create tabard data

**File:** `data/factions/tabards.json`

14 tabard items, one per faction.

### Step R3.4 -- Wire reputation into game loop

Modify `src/engine/worker-entry.ts`:
- Hook monster kills to reputation gains (zone faction)
- Hook quest completion to reputation gains
- Hook dungeon completion to reputation gains
- Apply tabard bonus on heroic dungeon kills
- Include reputation state in `IGameStateSnapshot`
- Add currency tracking to game state

### Step R3.5 -- Update offline calculator

Add reputation gain estimation to offline progress:
- Monster kills generate reputation (killRepBase * kills)
- Quest completions generate reputation
- Average zone event rep bonus

### Step R3.6 -- Write data validation tests

**File:** `tests/unit/data/faction-data-validation.test.ts`

Test cases:
- All factions have valid zone IDs (or null for neutral)
- All vendor items have valid currency types
- Vendor item iLevels match expected tier ranges
- Tier thresholds are monotonically increasing
- No duplicate faction or vendor item IDs

### Step R3.7 -- Run full test suite, commit

Commit: `feat(reputation): add faction data, vendor inventories, and game loop integration`
