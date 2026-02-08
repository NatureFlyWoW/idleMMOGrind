# Idle MMORPG

An offline idle/incremental RPG as an Electron desktop app simulating classic MMORPGs (WoW, EQ2, RIFT). Level 1-60, gear progression, dungeons, raids, prestige — all progressing offline. No energy systems, no pay-to-win.

## Tech Stack

Electron 34+ | React 19 | TypeScript 5 (strict) | Vite 6 | Vitest 3 | pnpm | CSS Modules | Worker Threads

## Key References

- **Game Design:** `docs/gdd/index.md` (split per-system in `docs/gdd/`)
- **Art Style Guide:** `docs/ui/specs/art-style-guide.md`
- **Implementation Plans:** `docs/plans/phase1/index.md`, `docs/plans/phase2/plan-index.md` (each phase in its own subdirectory)
- **Coding Standards:** `docs/standards/coding.md`
- **Git Workflow:** `docs/standards/git-workflow.md`

## Agent Roster

| Agent | Role | Owns | Invoke When |
|-------|------|------|-------------|
| @idle-mmo-gdev | Game engine developer | `src/engine/`, `src/main/`, `src/shared/`, `data/`, `tests/unit/` | Implementing game logic, formulas, data files, tests |
| @idle-mmo-gpm | Game designer / PM | `docs/specs/`, `docs/balance/`, `docs/gdd/` | Design decisions, balance tuning, feature specs |
| @idle-mmo-ui-designer | UI/UX & visual designer | `docs/ui/` | Screen design, wireframes, visual specs, art direction |
| @idle-mmo-frontend-dev | Frontend developer | `src/renderer/` | React components, CSS, Electron renderer, state management |
| @idle-mmo-balance-sim | Balance simulator | `tests/balance/` | Progression validation, DPS curves, pacing checks |
| @idle-mmo-data-validator | Data schema validator | validation scripts | JSON data integrity, enum consistency, reference checks |
| @idle-mmo-qa | QA & integration tester | `tests/integration/` | Cross-system tests, save/load, smoke tests after merges |

## Coordination Rules

- Agents only modify files within their owned directories
- `src/shared/` is co-owned: @idle-mmo-gdev defines interfaces, @idle-mmo-frontend-dev consumes
- `data/` is co-owned: @idle-mmo-gpm specifies content, @idle-mmo-gdev implements schemas
- Game design lives in `docs/gdd/` — agents read only the files they need per task

## Workflow

1. @idle-mmo-gpm writes feature spec in `docs/specs/`
2. @idle-mmo-ui-designer creates wireframes/specs in `docs/ui/`
3. @idle-mmo-gdev implements engine logic in `src/engine/` and data in `data/`
4. @idle-mmo-frontend-dev implements UI in `src/renderer/`
5. @idle-mmo-data-validator checks data integrity
6. @idle-mmo-qa writes integration tests
7. @idle-mmo-balance-sim validates progression targets

## Current Progress

**Phase 1:** COMPLETE (24 tasks, 335 tests) | Plan: `docs/plans/phase1/index.md`

**Phase 2:** PLANNED (35 tasks, 4 waves) | Plan: `docs/plans/phase2/plan-index.md`
- Wave 1: Zone expansion + Professions (parallel)
- Wave 2: Dungeons + Reputation (parallel)
- Wave 3: Raids + Daily/Weekly (parallel)
- Wave 4: UI + Integration tests

**Phase 2.5:** PLANNED (4 task groups) | Art generation + prototype playtest

**Method:** Subagent-Driven Development

## Development Phases

1. **Phase 1 (DONE):** Electron scaffold, character creation, combat, leveling 1-60, gear, talents, save system
2. **Phase 2 (PLANNED):** Zone expansion, 10 dungeons, 4 raids, professions, reputation, daily/weekly
3. **Phase 2.5 (PLANNED):** Art asset generation, UI integration, prototype playtest
4. **Phase 3:** Ascension, Paragon, achievements, collections, alts
5. **Phase 4:** UI polish, balance tuning, tutorial, Electron optimization, beta
