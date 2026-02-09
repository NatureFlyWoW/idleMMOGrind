# Phase 2 Implementation Plan -- Index

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Phase 1 engine into a content-rich idle MMORPG with instanced dungeons, raids, professions, faction reputation, zone content expansion, and daily/weekly systems.

**Architecture:** All new engine systems implement `IGameSystem` and register with the `GameLoop`. New shared types extend the existing type barrel at `src/shared/types/index.ts`. New data files live under `data/` as JSON. New balance config sections extend `IBalanceConfig` in `src/shared/types/balance.ts`. New save fields extend `ISaveData` in `src/shared/types/save.ts`. New UI screens are lazy-loaded React components in `src/renderer/`.

**Tech Stack:** Electron 34+, React 19, TypeScript 5 (strict), Vite 6, Vitest 3, pnpm, CSS Modules, Worker Threads

**Design Decisions (Locked):**
1. Per-boss granular dungeon success model (not binary pass/fail)
2. Flat party modifiers for raids (not full AI companion simulation)
3. Passive gathering in current zone (auto-gather during combat)
4. 14 factions (12 zone-aligned + 2 neutral: Adventurers' Guild, Artisan Collective)
5. Crafted gear as catch-up (-3 to -5 iLevel below dungeon drops)
6. Normal dungeons unlimited offline; heroic max 1/day offline; no offline raids
7. 2/4 piece set bonuses only (defer 6-piece to Phase 3)
8. Quest chains: 3-5 quests in early zones, 5-8 in late zones

---

## Task Files

| File | Tasks | Branch | Wave | Status |
|------|-------|--------|------|--------|
| [wave1-zones.md](wave1-zones.md) | Z1-Z4 | `feat/zone-expansion` | 1 | DONE |
| [wave1-professions.md](wave1-professions.md) | P1-P5 | `feat/profession-system` | 1 | DONE |
| [wave2-dungeons.md](wave2-dungeons.md) | D1-D5 | `feat/dungeon-system` | 2 | Pending |
| [wave2-reputation.md](wave2-reputation.md) | R1-R3 | `feat/reputation-system` | 2 | Pending |
| [wave3-raids.md](wave3-raids.md) | A1-A4 | `feat/raid-system` | 3 | Pending |
| [wave3-daily-weekly.md](wave3-daily-weekly.md) | W1-W2 | `feat/daily-weekly` | 3 | Pending |
| [wave4-ui.md](wave4-ui.md) | U1-U6 | `feat/phase2-ui` | 4 | Pending |
| [wave4-integration.md](wave4-integration.md) | I1-I2 | `feat/phase2-integration` | 4 | Pending |
| [phase2_5-art-prototype.md](phase2_5-art-prototype.md) | Art1-Art4 | `feat/art-assets` + `feat/art-integration` | 2.5 | Pending |

## Wave Structure

### Wave 1 (Parallel -- no Phase 2 dependencies) -- DONE
- `feat/zone-expansion` (Z1-Z4): Quest chains, elite areas, rare spawns, zone events, monster enrichment
- `feat/profession-system` (P1-P5): Types, materials, gathering, crafting engine, recipe data

### Art Engine V2 Rebuild -- DONE
- Python engine at `tools/art-engine-v2/` (Pillow + NumPy + opensimplex + click)
- 5 commits, 53 files, 4,647 lines, 204 tests
- Branch: `feat/art-engine-v2` (ready for merge)
- Design: [art-engine-v2-design.md](art-engine-v2-design.md)
- Plan: [art-engine-v2-plan.md](art-engine-v2-plan.md)

### Wave 2 (Parallel -- depends on Wave 1)
- `feat/dungeon-system` (D1-D5): Dungeon runner, per-boss success, 10 dungeon data files, lockout manager
- `feat/reputation-system` (R1-R3): Faction data, reputation tracker, vendor system, tabard mechanic

### Wave 3 (Parallel -- depends on Wave 2)
- `feat/raid-system` (A1-A4): Raid runner with flat party modifiers, 4 raids, attunement, tier sets (2/4)
- `feat/daily-weekly` (W1-W2): Daily quest generator, weekly resets, currency caps

### Wave 4 (Parallel -- depends on all engine work)
- `feat/phase2-ui` (U1-U6): Dungeon browser, raid planner, profession panel, reputation panel, quest journal, vendor screens
- `feat/phase2-integration` (I1-I2): Cross-system integration tests, balance simulations

### Phase 2.5 (After Art Engine V2 + all engine waves -- before Phase 3)
- AI-draft ~200 base templates (sprites, icons, overlays, UI chrome)
- Art asset generation sprint using Art Engine V2 (~3,500 assets)
- Asset integration into React UI
- Playtest and balance feedback loop

## Merge Order

1. `feat/zone-expansion` -- DONE
2. `feat/profession-system` -- DONE
3. **Art Engine V2 rebuild** -- MERGED (204 tests)
4. `feat/dungeon-system` -- needs zones merged
5. `feat/reputation-system` -- needs zones + dungeons merged
6. `feat/raid-system` -- needs dungeons + reputation merged
7. `feat/daily-weekly` -- needs all content systems merged
8. `feat/phase2-ui` -- needs all engine systems merged
9. `feat/phase2-integration` -- final verification on main
10. `feat/art-assets` -- Phase 2.5 art generation
11. `feat/art-integration` -- Phase 2.5 asset wiring + playtest

## Key Deliverables per Branch

| Branch | Key Deliverables |
|--------|-----------------|
| `feat/zone-expansion` | Quest chain system, elite areas, rare spawns, zone events, monster subtypes, ~38 quest chains, ~150 quests, ~30 rares |
| `feat/profession-system` | 12 profession definitions, material system, gathering integration, crafting queue, ~600 recipes, material bank |
| `feat/dungeon-system` | Dungeon runner engine, per-boss success formula, 10 dungeon data files (34 bosses), loot tables, lockout manager |
| `feat/reputation-system` | 14 faction definitions, reputation tracker, vendor manager, tabard system, vendor inventories |
| `feat/raid-system` | Raid runner with party modifiers, 4 raid data files (45 bosses), attunement chains, tier sets (2/4 piece) |
| `feat/daily-weekly` | Daily quest generator, weekly lockout resets, currency caps, world boss system |
| `feat/phase2-ui` | 6 new UI screens: dungeon browser, raid planner, profession panel, reputation panel, quest journal, vendor |
| `feat/phase2-integration` | Integration tests, balance simulations, full suite verification |
| `feat/art-assets` | Batch-generated pixel art: item icons, monster portraits, zone art, UI chrome, faction emblems |
| `feat/art-integration` | Asset wiring into React UI, playtest findings, balance adjustments |

## Total Estimate

- **Phase 2:** 35 tasks across 8 branches
- **Phase 2.5:** 4 task groups across 2 branches
- **New test files:** ~25-30 test files
- **New source files:** ~40-50 source files
- **New data files:** ~80-100 JSON data files
