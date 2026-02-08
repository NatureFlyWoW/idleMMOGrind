# Phase 1 Execution Strategy -- Tasks 10-24

> **Author:** @idle-mmo-gpm | **Date:** 2026-02-08
> **Current state:** Tasks 1-8 merged, Task 9 in progress on `feat/character-system`

---

## 1. Dependency Analysis

### 1.1 True Dependency Graph (Verified Against Source)

I traced every import in the plan code against the actual files on main. Below is what each task **actually** imports at compile time versus what the plan claims.

#### Task 10 (Item Generator + Inventory Manager)

| Plan says depends on | Actual imports from those tasks | Verdict |
|---|---|---|
| Tasks 3, 4, 6 | `@shared/types/enums` (Task 3), `@shared/types/item` (Task 3), `@shared/types/balance` (Task 4), `@shared/utils/rng` (Task 5), `@shared/utils/balance-loader` (Task 4), `@engine/character/stat-calculator` (Task 6) | **Correct.** All imports exist on current main. |

**Task 10 has ZERO dependency on Task 9.** It does not import `xp-system`, zones, or anything from the progression module. It can start immediately on a worktree branched from current main.

#### Task 11 (Loot System)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| Task 10 | `@engine/gear/item-generator` (Task 10's output) | **Correct.** Must run after Task 10, on the same branch. |

#### Task 12 (Talent Manager)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| Tasks 3, 4 | `@shared/types/talent` (Task 3), `@shared/types/balance` (Task 4), `@shared/utils/balance-loader` (Task 4) | **Correct.** All imports exist on current main. |

**Task 12 has ZERO dependency on Tasks 9, 10, or 11.** It only uses shared types and the balance config. It can start immediately.

#### Task 13 (Save/Load)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| Tasks 3, 7 | `@shared/types/save` (Task 3), `@shared/types/enums` (Task 3), `zlib`, `crypto` (Node builtins) | **Correct but overstated.** Task 13 (save-io, backup-rotation) only imports shared types. It does NOT import anything from Task 7 (character-factory, combat-formulas). |

**Task 13 has ZERO dependency on Tasks 7-12.** It only uses `ISaveData` and enum types, which are already on main. It can start immediately.

#### Task 14 (Offline Calculator)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| Tasks 6, 9 | `@shared/types/balance` (Task 4), `@engine/offline/diminishing-returns` (self), `@engine/character/stat-calculator` (Task 6), **`@engine/progression/xp-system`** (Task 9) | **Task 9 dependency is REAL.** The offline calculator calls `awardXP()` from the XP system. |

Task 14 is the first task that truly requires Task 9 to be on its branch. Since Task 14 is on the `feat/save-system` branch, that branch needs to be created after Task 9 is merged -- **OR** Task 14 can be branched from `feat/character-system` instead of main.

However, the diminishing-returns module (Step 14.1-14.2) does NOT import from Task 9. Only the offline-calculator (Step 14.3) does. So diminishing-returns can be written independently.

#### Task 15 (Game Loop + Worker Entry)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| Tasks 8, 9, 10, 11, 12 | `@engine/systems/game-system` (already on main), `@engine/events/event-bus` (Task 8, already on main), `@shared/types/ipc` (Task 2, already on main) | **Massively overstated.** |

**Task 15 has ZERO runtime dependency on Tasks 9-12.** The `GameLoop` class uses the `IGameSystem` interface (already on main) and the `EventBus` (already on main). The worker-entry uses `EngineCommandType`/`EngineEventType` (already on main). It calls no concrete system implementations -- it will wire them up later.

Task 15 can start immediately. The plan's dependency list is wrong because Task 15 is a **framework** -- it provides the loop and entry point, not the systems that plug into it.

#### Task 16 (Electron Integration)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| Tasks 1, 13, 15 | `@shared/types/ipc` (Task 2), `@main/save/save-io` (Task 13), `@main/save/backup-rotation` (Task 13), `@engine/worker-entry` (Task 15, path reference only) | **Correct.** Needs save-io and backup-rotation from Task 13. The worker-entry is referenced as a file path string, not a TS import, so it compiles without Task 15 -- but won't function without it. |

Task 16 truly needs Task 13 merged. Task 15 is needed for the full system to work but is not a compile-time dependency.

#### Tasks 17-23 (UI Screens)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| Task 16 | UI components import `@shared/types/enums`, `@shared/types/item`, `@shared/types/state`, `@shared/types/combat`, `@data/races.json`, `@data/classes.json`. The OfflineProgressModal imports `IOfflineResult` from `@engine/offline/offline-calculator` (Task 14). | **Mostly false dependency on Task 16.** |

The UI screens are purely React components. They import shared types (all on main) and render data. They do NOT import from `@main/*` or depend on the Electron preload/IPC wiring. The only cross-module import is the OfflineProgressModal importing a TYPE from the offline calculator -- which could be extracted to a shared types file, or the UI branch can include the interface definition.

**Tasks 17-22 can start immediately.** Task 23 (OfflineProgressModal) has a soft dependency on Task 14's `IOfflineResult` type, but this is a simple interface that can be defined locally or in shared types.

#### Task 24 (Integration + Balance Tests)

| Plan says depends on | Actual imports | Verdict |
|---|---|---|
| All previous tasks | Imports from Tasks 6, 7, 9, 10, 11, 12, 13, 14 | **Correct.** This is a capstone that exercises every system. Must run last after all merges. |

### 1.2 False Dependencies Summary

| Task | Claimed dependency | Reality |
|---|---|---|
| Task 10 | "Tasks 3, 4, 6" -- implying 9 via merge order | **No dependency on 9.** Can start from current main. |
| Task 12 | "Tasks 3, 4" -- correct, but merge order after 10-11 | **No dependency on 9, 10, or 11.** Can start from current main. |
| Task 13 | "Tasks 3, 7" | **No dependency on 7.** Only shared types. Can start from current main. |
| Task 15 | "Tasks 8, 9, 10, 11, 12" | **No dependency on 9-12.** Can start from current main. |
| Tasks 17-22 | "Task 16" | **No compile-time dependency on 16.** Can start from current main + shared types. |

### 1.3 Real Dependency DAG (Simplified)

```
Current main (Tasks 1-8)
  |
  +---> Task 9 (XP system, zones) ----+
  |                                     |
  +---> Task 10 -> Task 11             |
  |     (gear)    (loot)               |
  |                                     |
  +---> Task 12 (talents)              |
  |                                     |
  +---> Task 13 (save-io)             |
  |     Task 15 (game loop)            |
  |                                     v
  |                              Task 14 (offline calc)
  |                              depends on Task 9's awardXP()
  |
  +---> Tasks 17-22 (UI components, no engine deps)
  |
  +---> Task 23 (OfflineModal) -- soft dep on IOfflineResult type
  |
  +---> Task 16 (Electron wiring) -- needs 13 + 15
  |
  +---> Task 24 (integration) -- needs everything
```

---

## 2. Parallelization Opportunities

### 2.1 Immediate Parallel Work (Can Start Right Now)

These tasks have no dependency on Task 9 or each other. They can each run as independent subagents on separate worktrees branched from current main:

| Worktree | Tasks | Why it works |
|---|---|---|
| `feat/gear-system` | 10, 11 | Imports only from `@shared/*` and `@engine/character/stat-calculator`, all on main |
| `feat/talent-system` | 12 | Imports only from `@shared/types/talent` and `@shared/types/balance`, all on main |
| `feat/save-system` (partial) | 13, 15 | Task 13: only `@shared/types/save` + Node builtins. Task 15: only `IGameSystem` + `EventBus`, both on main. |
| `feat/phase1-ui` (partial) | 17, 18, 19, 20 | Pure React components. Import `@shared/types/*` and `@data/*.json`, all on main. |

**That is 4 worktrees running in parallel.** Each is independent at compile time.

### 2.2 Second Wave (After Task 9 Merges)

| Worktree | Tasks | Blocked by |
|---|---|---|
| `feat/save-system` (remaining) | 14 | Task 9 (`awardXP` import). If save-system worktree was started early (Tasks 13+15), rebase onto main after Task 9 merges, then implement Task 14. |

### 2.3 Third Wave (After All Engine Merges)

| Location | Tasks | Blocked by |
|---|---|---|
| `feat/phase1-ui` (remaining) | 21, 22, 23 | Tasks 21-22 have no real blockers but logically build on 19-20. Task 23's OfflineProgressModal needs `IOfflineResult` type. |
| main | 16 | Tasks 13 + 15 merged |

### 2.4 Final

| Location | Task | Blocked by |
|---|---|---|
| main | 24 | Everything merged |

---

## 3. Optimal Execution Order

### 3.1 Maximum Parallelism Timeline

```
TIME  SLOT A              SLOT B             SLOT C              SLOT D
---   --------            --------           --------            --------
T0    Task 9 (in prog)    Tasks 10-11        Task 12             Task 13 + 15
      feat/character-sys   feat/gear-system   feat/talent-system  feat/save-system
      [MEDIUM]             [MEDIUM+SIMPLE]    [SIMPLE]            [MEDIUM+SIMPLE]

T1    -- merge Task 9 --   -- merge 10-11 --  -- merge 12 --     -- keep worktree --
      Task 14 (offline)    Tasks 17-19 (UI)
      on save-system       feat/phase1-ui
      [MEDIUM]             [MEDIUM]

T2    -- merge save-sys -- Tasks 20-23 (UI)
      Task 16 (main)       feat/phase1-ui
      [MEDIUM]             [MEDIUM]

T3    -- merge UI --
      Task 24 (main)
      [MEDIUM]
```

### 3.2 Practical Session Plan

Given the subagent-driven approach (one agent per task), here is the most efficient ordering:

**Session 1: Launch 4 parallel subagents**

1. **Subagent A** -- Task 9 (already in progress, let it finish)
2. **Subagent B** -- Tasks 10-11 on `feat/gear-system` worktree from main
   - Task 10: item-generator (tests + impl), inventory-manager (tests + impl)
   - Task 11: loot-system (tests + impl)
   - Sequential within the branch (11 imports from 10)
3. **Subagent C** -- Task 12 on `feat/talent-system` worktree from main
   - Single task: talent-manager (tests + impl)
4. **Subagent D** -- Tasks 13 + 15 on `feat/save-system` worktree from main
   - Task 13: save-io (tests + impl), backup-rotation (impl)
   - Task 15: game-loop (impl), worker-entry (impl)
   - These are independent of each other within the branch

**Between Session 1 and 2: Merge sprint**

- Merge `feat/character-system` (Task 9) into main
- Merge `feat/gear-system` (Tasks 10-11) into main
- Merge `feat/talent-system` (Task 12) into main
- Rebase `feat/save-system` onto main (now has Task 9's `awardXP`)

**Session 2: Launch 2 parallel subagents**

5. **Subagent E** -- Task 14 on `feat/save-system` worktree (rebased)
   - diminishing-returns (tests + impl)
   - offline-calculator (tests + impl)
6. **Subagent F** -- Tasks 17-20 on `feat/phase1-ui` worktree from main
   - Task 17: CSS theme, Panel, Button, ProgressBar components
   - Task 18: CharacterCreationScreen
   - Task 19: MainGameScreen layout
   - Task 20: CharacterPanel
   - Sequential within the branch (each builds on prior components)

**Between Session 2 and 3: Merge sprint**

- Merge `feat/save-system` (Tasks 13-15) into main
- Keep `feat/phase1-ui` worktree going

**Session 3: Launch 2 subagents (or continue 1)**

7. **Subagent G** -- Task 16 on main (requires save-system merged)
   - preload.ts, ipc-handlers.ts, auto-save.ts, main.ts update
8. **Subagent F (continued)** -- Tasks 21-23 on `feat/phase1-ui`
   - Task 21: ItemSlot + InventoryGrid
   - Task 22: CombatLog + OverviewTab
   - Task 23: OfflineProgressModal + SettingsTab
   - Note: extract `IOfflineResult` interface to `@shared/types/offline.ts` or include it in the UI branch

**Between Session 3 and 4: Merge sprint**

- Merge `feat/phase1-ui` into main (after Task 16)

**Session 4: Final**

9. **Subagent H** -- Task 24 on main
   - character-lifecycle integration test
   - leveling-pacing balance simulation
   - Full test suite run

### 3.3 Merge Order (Revised for Parallelism)

The original merge order was strictly sequential. The revised order allows batch merging:

1. Merge `feat/character-system` (Task 9)
2. Merge `feat/gear-system` (Tasks 10-11) -- no conflict with 9
3. Merge `feat/talent-system` (Task 12) -- no conflict with 9 or 10-11
4. Merge `feat/save-system` (Tasks 13-15, after Task 14 completes)
5. Complete Task 16 on main
6. Merge `feat/phase1-ui` (Tasks 17-23)
7. Complete Task 24 on main

Steps 2 and 3 can merge in any order (or simultaneously) since they touch completely different files:
- `feat/gear-system`: `src/engine/gear/*`, `tests/unit/engine/gear/*`
- `feat/talent-system`: `src/engine/talents/*`, `tests/unit/engine/talents/*`

---

## 4. Complexity Estimates

| Task | Description | Complexity | Estimate | Rationale |
|---|---|---|---|---|
| 9 | XP system + zones.json | Simple | < 30 min | 2 functions + 1 data file. Already in progress. |
| 10 | Item generator + inventory manager | Medium | 30-45 min | 2 modules with tests. generateItem has stat budget logic. |
| 11 | Loot system | Simple | < 20 min | 1 module, 2 functions, straightforward RNG logic. |
| 12 | Talent manager | Simple | < 25 min | 1 module, 5 pure functions, no complex state. |
| 13 | Save/load serialization + backup | Medium | 30-40 min | gzip + checksum + atomic write. Node fs operations. |
| 14 | Offline progression | Medium | 30-45 min | Diminishing returns + offline calculator. Calls awardXP. |
| 15 | Game loop + worker entry | Medium | 30-40 min | setInterval loop + Worker thread MessagePort wiring. |
| 16 | Electron integration | Medium | 40-50 min | Preload, IPC handlers, auto-save, main.ts rewrite. Electron-specific APIs. |
| 17 | Shared UI components | Simple | 20-30 min | CSS variables + 3 React components. Pure presentational. |
| 18 | Character creation screen | Medium | 30-40 min | Complex form with validation, data display, CSS grid layout. |
| 19 | Main game screen layout | Simple | 20-25 min | Grid layout + tab navigation. Placeholder content. |
| 20 | Character panel | Simple-Medium | 25-30 min | Paper doll + stat display. Reads snapshot interface. |
| 21 | Inventory grid + item slots | Medium | 30-40 min | ItemSlot with tooltips, InventoryGrid, quality colors, context menu. |
| 22 | Combat log + overview tab | Medium | 30-35 min | Scrolling log with colored entries, combat state display. |
| 23 | Offline modal + settings | Simple-Medium | 25-30 min | Modal overlay + settings form with save slot management. |
| 24 | Integration + balance tests | Simple-Medium | 25-30 min | 2 test files that compose existing modules. No new logic. |

**Total estimated agent-time: ~7-9 hours**
**With 4-way parallelism, wall-clock time: ~3-4 hours** (plus merge overhead)

---

## 5. Risk Areas

### 5.1 High Risk: Type Mismatches

**Task 14 (offline-calculator)** -- This is the highest-risk task. It imports `awardXP` from Task 9 AND calls `calculateMonsterHP`, `calculateMonsterDamage`, `calculateMonsterXP` from stat-calculator. It also references `config.offline.*`, `config.monsters.*`, `config.quests.*`, and `config.combat.baseTickIntervalMs`. Any balance.json key that does not exist will cause a runtime error. The balance interface already defines all these keys, but the actual balance.json values may not match expectations.

**Mitigation:** Run `pnpm typecheck` after implementing. Validate balance.json against `IBalanceConfig`.

### 5.2 Medium Risk: Missing Exports from stat-calculator

**Task 10 (item-generator)** imports `calculateStatBudget`, `calculateWeaponMinDamage`, `calculateWeaponMaxDamage` from `@engine/character/stat-calculator`. These functions **already exist on main** (verified above). No risk here.

### 5.3 Medium Risk: Task 15 GameLoop System Interface

The `GameLoop.tick()` method calls `system.update({}, this.config.tickIntervalMs)`. The `IGameSystem` interface takes `update(state: unknown, deltaMs: number)`. This compiles fine but is a design concern -- passing `{}` as state is a placeholder. When real systems get registered (combat, progression, loot), they will need actual game state. This will need revision in Phase 2 or when wiring systems together.

**Mitigation:** Accept the placeholder for Phase 1. The game loop is a framework -- real system wiring happens when the combat/progression systems are built.

### 5.4 Medium Risk: Task 16 Electron Main Process

The main.ts rewrite references `worker-entry.js` by file path. If the Vite/esbuild build does not output `worker-entry.js` at the expected path, the worker will fail to spawn at runtime. This is a build configuration issue, not a code issue.

**Mitigation:** Task 16 should include a manual smoke test: `pnpm dev` and verify the Electron window opens and the worker spawns.

### 5.5 Low Risk: UI Component Props Mismatch

Tasks 20-22 import interfaces like `ICharacterSnapshot`, `IComputedStats`, `IGameStateSnapshot`, `ICombatLogEntry` from shared types. These interfaces are already defined (verified above). The risk is that the plan's component props reference fields that do not exist on these interfaces. I checked: `ICharacterSnapshot` has all fields referenced by `CharacterPanel.tsx`, and `IGameStateSnapshot` has all fields referenced by `OverviewTab.tsx`. No mismatch found.

### 5.6 Low Risk: Task 23 OfflineProgressModal Import

The plan imports `IOfflineResult` from `@engine/offline/offline-calculator`. This file will not exist on the UI branch if Task 14 has not been merged. Two solutions:
1. Move the `IOfflineResult` interface to `@shared/types/offline.ts` (preferred).
2. Define the interface locally in the component file.

**Recommendation:** When implementing Task 14, export `IOfflineResult` from a shared types file. The UI branch should depend on this shared type, not the engine implementation.

### 5.7 Risk Summary Table

| Task | Risk Level | Primary Risk | Impact if Hit |
|---|---|---|---|
| 14 | High | awardXP import, balance.json key mismatches | Compile failure, incorrect offline results |
| 15 | Medium | Placeholder state passing in game loop | Technical debt, needs revision later |
| 16 | Medium | Worker file path, Electron build config | Runtime failure, no game engine |
| 23 | Low | IOfflineResult type location | Easy workaround, 5-min fix |
| All UI | Low | Prop/interface drift | Quick fixes at integration time |

---

## 6. Recommendations

### 6.1 Rebatch: Move Task 15 to feat/save-system

The plan puts Task 15 on `feat/save-system` but claims it depends on Tasks 8-12. Since Task 15 has **zero** real dependencies on 9-12, it should be implemented as part of the first wave alongside Task 13. Both are on the same branch (`feat/save-system`), and implementing them together makes the branch self-contained: "all non-UI infrastructure."

**Action:** Start `feat/save-system` worktree from current main. Implement Tasks 13 + 15 together. After Task 9 merges, rebase and add Task 14.

### 6.2 Rebatch: Start UI Work Early

The plan chains Tasks 17-23 after Task 16 (Electron integration). This is unnecessary. The React components are pure -- they do not depend on the Electron shell. Start `feat/phase1-ui` from current main and build Tasks 17-20 in the first wave.

**Action:** Start `feat/phase1-ui` worktree from current main. Implement Tasks 17-20 in Session 1.

### 6.3 Extract IOfflineResult to Shared Types

Before Task 14 implementation, add the `IOfflineResult` interface to `src/shared/types/offline.ts`. This allows the UI branch (Task 23) to import the type without depending on the engine module.

**Action:** @idle-mmo-gdev should create `src/shared/types/offline.ts` with the interface as part of Task 14.

### 6.4 Do Not Skip Any Tasks

All remaining tasks contribute to the Phase 1 deliverable. However, some have lower priority:

- **Task 23 (SettingsTab)** could be simplified to just save/load buttons. The auto-equip and auto-sell toggles are UI-only and do not wire to engine logic in Phase 1.
- **Task 20 (CharacterPanel paper doll)** is a placeholder graphic. Keep it as-is (a box that says "Paper Doll") -- the real paper doll comes with Phase 4 UI polish.

### 6.5 Session Workflow for Maximum Throughput

The ideal execution uses the following pattern:

```
1. Create 4 worktrees simultaneously:
   - feat/gear-system from main
   - feat/talent-system from main
   - feat/save-system from main
   - feat/phase1-ui from main

2. Launch subagents:
   - A: Tasks 10-11 on feat/gear-system
   - B: Task 12 on feat/talent-system
   - C: Tasks 13+15 on feat/save-system
   - D: Tasks 17-20 on feat/phase1-ui

3. Wait for Task 9 to finish (already in progress)

4. Merge sprint (sequential, fast):
   - Merge feat/character-system -> main
   - Merge feat/gear-system -> main (no conflict)
   - Merge feat/talent-system -> main (no conflict)
   - Typecheck + test after each merge

5. Rebase feat/save-system onto new main
   - Launch subagent E: Task 14 on feat/save-system
   - Meanwhile, subagent D continues Tasks 21-23 on feat/phase1-ui

6. Merge feat/save-system -> main
   - Launch subagent F: Task 16 on main

7. Merge feat/phase1-ui -> main
   - Launch subagent G: Task 24 on main

8. Final verification: pnpm test && pnpm typecheck
```

### 6.6 Worktree Commands (Ready to Execute)

```bash
# Session 1 worktrees (all from current main)
git worktree add ../idleMMOGrind-worktrees/feat-gear-system feat/gear-system
git worktree add ../idleMMOGrind-worktrees/feat-talent-system feat/talent-system
git worktree add ../idleMMOGrind-worktrees/feat-save-system feat/save-system
git worktree add ../idleMMOGrind-worktrees/feat-phase1-ui feat/phase1-ui

# After each worktree: cd into it and run pnpm install
```

### 6.7 Critical Path

The critical path (longest chain of sequential dependencies) is:

```
Task 9 (in progress) -> merge -> Task 14 -> merge -> Task 16 -> merge UI -> Task 24
```

Everything else can be parallelized around this chain. The critical path has approximately **4 merge points** and **3-4 hours of agent work** spread across them. Total wall-clock time is dominated by this chain, not by the parallel work.

### 6.8 Merge Conflict Risk Assessment

| Branch pair | Conflict risk | Overlapping files |
|---|---|---|
| gear-system vs talent-system | None | Completely separate directories |
| gear-system vs character-system | None | gear/ vs progression/ |
| save-system vs gear-system | None | main/save/ vs engine/gear/ |
| phase1-ui vs any engine branch | None | renderer/ vs engine/ |
| save-system vs character-system | Low | Both touch engine/, but different subdirs |
| Task 16 vs save-system | None | Task 16 imports from save-system, no file overlap |

No merge conflicts are expected between any parallel branches. They all touch completely separate directories.

---

## Summary Table

| Wave | Tasks | Worktree | Blocked by | Estimated time |
|---|---|---|---|---|
| Wave 1 (now) | 9 | feat/character-system | Nothing (in progress) | 30 min |
| Wave 1 (now) | 10-11 | feat/gear-system | Nothing | 45-60 min |
| Wave 1 (now) | 12 | feat/talent-system | Nothing | 20-25 min |
| Wave 1 (now) | 13, 15 | feat/save-system | Nothing | 60-80 min |
| Wave 1 (now) | 17-20 | feat/phase1-ui | Nothing | 90-120 min |
| Merge 1 | -- | main | Wave 1 complete | 15 min |
| Wave 2 | 14 | feat/save-system | Task 9 merged | 30-45 min |
| Wave 2 | 21-23 | feat/phase1-ui | Tasks 17-20 done | 60-90 min |
| Merge 2 | -- | main | Wave 2 complete | 10 min |
| Wave 3 | 16 | main | Tasks 13+15 merged | 40-50 min |
| Merge 3 | -- | main | Task 16 + UI merge | 10 min |
| Wave 4 | 24 | main | Everything merged | 25-30 min |

**Total wall-clock estimate with parallel execution: 3.5-4.5 hours**
(Down from 7-9 hours sequential)
