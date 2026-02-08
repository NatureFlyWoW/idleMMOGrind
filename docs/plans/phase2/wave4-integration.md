# Phase 2 -- Integration & Balance Testing (Tasks I1-I2)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Branch:** `feat/phase2-integration`
**Depends on:** All Phase 2 branches merged to main
**Run directly on main after all merges.**

---

## Task I1 -- Cross-System Integration Tests

**Goal:** Verify that all Phase 2 systems work together correctly.

### Step I1.1 -- Dungeon lifecycle integration test

**File:** `tests/integration/dungeon-lifecycle.test.ts`

End-to-end test:
1. Create character, level to dungeon-appropriate level
2. Complete zone quest chains to unlock dungeon
3. Run normal dungeon: verify per-boss success resolution, loot drops, XP/gold/rep
4. Run heroic dungeon: verify lockout applied, heroic bonus boss, Justice Points
5. Verify lockout prevents re-run, verify lockout expires after configured hours
6. Save/load round-trip preserves dungeon state

### Step I1.2 -- Raid lifecycle integration test

**File:** `tests/integration/raid-lifecycle.test.ts`

End-to-end test:
1. Create max-level character with heroic dungeon gear
2. Verify raid 1 attunement auto-passes (iLevel check only)
3. Run raid 1: verify party modifier, per-boss resolution, tier token drops
4. Verify weekly lockout and boss progress persistence
5. Progress raid 2 attunement: complete required quest chain steps
6. Save/load round-trip preserves raid state

### Step I1.3 -- Profession lifecycle integration test

**File:** `tests/integration/profession-lifecycle.test.ts`

End-to-end test:
1. Create character, learn Mining + Blacksmithing
2. Verify gathering produces materials based on zone
3. Craft item from recipe: verify materials consumed, item produced, skill up
4. Level profession through multiple brackets
5. Verify crafted gear iLevel is appropriate (catch-up, -3 to -5 below dungeon drops)
6. Save/load round-trip preserves profession state and material bank

### Step I1.4 -- Reputation lifecycle integration test

**File:** `tests/integration/reputation-lifecycle.test.ts`

End-to-end test:
1. Create character, quest in zone 1
2. Verify reputation gained from quests and kills
3. Reach Friendly: verify tabard purchasable, vendor items available
4. Equip tabard: verify heroic dungeon bonus rep
5. Purchase vendor item: verify currency deducted, item in inventory
6. Verify daily quest generation and completion
7. Save/load round-trip preserves reputation state

### Step I1.5 -- Offline progression integration test

**File:** `tests/integration/offline-phase2.test.ts`

Verify offline calculator handles Phase 2 systems:
1. Offline quest chain progression
2. Offline material gathering
3. Offline normal dungeon runs (unlimited)
4. Offline heroic dungeon (max 1)
5. No offline raid progress
6. Reputation accumulation during offline
7. Zone event average uptime bonus

### Step I1.6 -- Run full suite, commit

Commit: `test(integration): add Phase 2 cross-system integration tests`

---

## Task I2 -- Balance Simulation Tests

**Goal:** Verify that Phase 2 pacing targets are met through simulation.

### Step I2.1 -- Dungeon pacing simulation

**File:** `tests/balance/dungeon-pacing.test.ts`

Simulations:
- Normal dungeon clear rate at appropriate level with quest gear: 80-95% per boss
- Heroic dungeon clear rate at fresh 60 (iLevel 58-62): 60-75% per boss
- Heroic dungeon clear rate with gear (iLevel 68+): 95-99% per boss
- Normal dungeon clear time: 10-15 min game time
- Heroic dungeon clear time: 20-30 min game time

### Step I2.2 -- Raid pacing simulation

**File:** `tests/balance/raid-pacing.test.ts`

Simulations:
- Raid tier 1 clear rate (iLevel 65-70): 50-70% per boss
- Raid tier 4 clear rate (iLevel 83-88): 40-60% per boss
- Raid full clear time: 45-90 min game time
- Time from first heroic gear to raid-ready: ~1-2 weeks of daily play

### Step I2.3 -- Profession pacing simulation

**File:** `tests/balance/profession-pacing.test.ts`

Simulations:
- Skill 1-300 total time: 15-20 hours
- Material gathering rate: 1 per 30s base, up to 1 per 15s at max skill
- Crafted gear iLevel vs dungeon drops at equivalent level: -3 to -5

### Step I2.4 -- Reputation pacing simulation

**File:** `tests/balance/reputation-pacing.test.ts`

Simulations:
- Friendly from questing alone in zone: achievable
- Time to Honored: 2-4 hours in zone
- Time to Revered: 1-2 weeks daily play
- Time to Exalted: 3-4 weeks daily play
- Daily rep gain at 60: ~2,000-3,000 across factions

### Step I2.5 -- Run full test suite and typecheck

Run: `pnpm test` and `pnpm typecheck`

### Step I2.6 -- Commit

Commit: `test(balance): add Phase 2 pacing simulations for dungeons, raids, professions, and reputation`
