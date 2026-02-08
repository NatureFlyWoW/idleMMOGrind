# Phase 1 Implementation Plan — Index

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete Phase 1 of Idle MMORPG: Electron scaffold, shared types, game engine (combat, leveling, gear, talents), save/load, offline progression, and all Phase 1 UI screens.

**Architecture:** Electron 3-process (main, renderer/React, engine/Worker Thread) with MessagePort direct communication. Game logic runs tick-based (4/sec) in Worker Thread. React UI subscribes to state snapshots. All balance values in data/balance.json.

**Tech Stack:** Electron 34+, React 19, TypeScript 5 (strict), Vite 6, Vitest 3, pnpm, CSS Modules, Worker Threads

---

## Task Files

| File | Tasks | Branch | Status |
|------|-------|--------|--------|
| [completed.md](completed.md) | 1-6 | `feat/electron-scaffold`, `feat/shared-types` | DONE |
| [tasks-7-8-combat.md](tasks-7-8-combat.md) | 7-8 | `feat/combat-engine` | DONE |
| [task-9-character.md](task-9-character.md) | 9 | `feat/character-system` | DONE |
| [tasks-10-11-gear.md](tasks-10-11-gear.md) | 10-11 | `feat/gear-system` | DONE |
| [task-12-talent.md](task-12-talent.md) | 12 | `feat/talent-system` | DONE |
| [tasks-13-15-save.md](tasks-13-15-save.md) | 13-15 | `feat/save-system` + `feat/offline-system` | DONE |
| [task-16-electron.md](task-16-electron.md) | 16 | main | DONE |
| [tasks-17-23-ui.md](tasks-17-23-ui.md) | 17-23 | `feat/phase1-ui` | DONE |
| [task-24-integration.md](task-24-integration.md) | 24 | main | DONE |

## Key Deliverables per Branch

| Branch | Key Deliverables |
|--------|-----------------|
| `feat/electron-scaffold` | Project scaffold, package.json, tsconfig, Vite, Vitest, enums, IPC types |
| `feat/shared-types` | All shared interfaces, balance.json, balance loader, RNG, stat calculator |
| `feat/combat-engine` | races.json, classes.json, character factory, combat formulas, ability priority, EventBus |
| `feat/character-system` | XP system, zones.json |
| `feat/gear-system` | Item generator, loot system, inventory manager |
| `feat/talent-system` | Talent manager with allocation, respec, effects |
| `feat/save-system` | Save/load with gzip+checksum, backup rotation, offline calculator, game loop, worker entry |
| main (Task 16) | Preload script, IPC handlers, auto-save, Electron main.ts lifecycle |
| `feat/phase1-ui` | Theme CSS, Panel, Button, ProgressBar, CharacterCreation, MainHub, CharacterPanel, Inventory, CombatLog, OverviewTab, OfflineModal, Settings |
| main (Task 24) | Integration test, balance simulation, full suite verification |

## Merge Order

1. ~~Merge `feat/electron-scaffold` into `main`~~ DONE
2. ~~Merge `feat/shared-types` into `main`~~ DONE
3. ~~Merge `feat/combat-engine` into `main`~~ DONE
4. ~~Merge `feat/character-system` into `main`~~ DONE
5. ~~Merge `feat/gear-system` into `main`~~ DONE
6. ~~Merge `feat/talent-system` into `main`~~ DONE
7. ~~Merge `feat/save-system` into `main`~~ DONE (Tasks 13+15; Task 14 pending)
8. ~~Complete Task 16 on `main`~~ DONE
9. ~~Merge `feat/phase1-ui` into `main`~~ DONE
10. Complete Task 24 on `main` — In Progress

Each merge should include running `pnpm test` and `pnpm typecheck` to verify no regressions.
