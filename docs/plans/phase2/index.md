# Phase 2 Design Brief -- Overview

> Version 1.0 | February 8, 2026

Phase 2 transforms the functional Phase 1 engine into a content-rich game. Phase 1 delivers a character who can level 1-60, equip gear, allocate talents, and fight monsters across 12 zones. Phase 2 adds the systems that make that journey feel like an MMORPG: instanced dungeons with boss encounters, raids with tiered gear, professions that feed the gear pipeline, reputation factions with vendor rewards, and enriched zone content with quest chains, events, and monster variety.

## Goals

1. **Instanced group content** -- 10 dungeons and 4 raids that use the Phase 1 combat engine in a multi-encounter format with boss mechanics and loot tables.
2. **Crafting economy** -- 9 gathering/crafting professions and 3 secondary professions that create a material-to-gear pipeline alongside the drop-based gear system.
3. **Faction reputation** -- 10+ factions with tiered vendor unlocks, tying zone content and dungeon completion to long-term reward tracks.
4. **Zone depth** -- Expand the existing 12 zones with quest chains, elite areas, rare spawns, zone events, and lore.
5. **Daily/weekly cadence** -- Implement the lockout, daily quest, and weekly reset systems that define endgame rhythm.

## What Phase 1 Delivers (Prerequisites)

Phase 2 builds directly on these Phase 1 systems:

| Phase 1 System | Phase 2 Usage |
|----------------|---------------|
| Combat engine (tick-based, ability priority) | Dungeon/raid encounters reuse the same combat loop |
| Stat calculator + balance.json | Boss stat scaling, profession recipe output, reputation reward budgets |
| Item generator + loot tables | Boss-specific loot tables, crafted item generation, vendor item pools |
| Zone system (12 zones, monsters, quests) | Zone expansion adds quest chains, events, elite areas |
| XP system + leveling curve | Dungeon XP rewards, profession XP, daily quest rewards |
| Talent system | Boss mechanics that reward specific talent builds |
| Save/load + offline calculator | Profession gathering offline, dungeon lockout persistence, reputation save |
| Game loop (Worker Thread) | Dungeon runner and profession timers integrate into the existing tick loop |

## System Dependency Graph

```
                    Zone Expansion
                         |
              +----------+----------+
              |                     |
         Dungeons              Reputation
              |                     |
              +----------+----------+
                         |
                       Raids
                         |
                    Professions*
```

*Professions are mostly independent but their recipes reference dungeon materials and reputation vendors sell profession recipes.*

Interpretation:
- **Zone Expansion** has no Phase 2 dependencies (only Phase 1 zones).
- **Dungeons** depend on enriched zone content for unlock quests.
- **Reputation** depends on zones and dungeons as reputation sources.
- **Raids** depend on dungeons (attunement requires dungeon clears).
- **Professions** can be built in parallel but integrate with all other systems for recipes and material drops.

## Suggested Task/Branch Structure

| Branch | Tasks | Systems | Estimated Complexity | Dependencies |
|--------|-------|---------|---------------------|--------------|
| `feat/zone-expansion` | Z1-Z3 | Quest chains, elite areas, rare spawns, zone events, monster enrichment | Medium | Phase 1 only |
| `feat/dungeon-system` | D1-D5 | Dungeon runner engine, 10 dungeon data files, boss AI, dungeon loot tables, lockout system | High | Zone expansion (unlock quests) |
| `feat/reputation-system` | R1-R3 | Faction data, reputation tracker, vendor system, tabard mechanic | Medium | Zones + dungeons |
| `feat/raid-system` | A1-A4 | Raid runner, 4 raid data files, attunement quests, party simulation, tier sets | High | Dungeons + reputation |
| `feat/profession-system` | P1-P5 | 12 profession definitions, material system, recipe database, crafting engine, gathering automation | High | Can start in parallel; integrates last |
| `feat/daily-weekly` | W1-W2 | Daily quest generator, weekly lockout resets, currency caps, world bosses | Medium | All content systems |
| `feat/phase2-ui` | U1-U6 | Dungeon browser, raid planner, profession panel, reputation panel, quest journal upgrade, vendor screens | High | All engine systems |
| `feat/phase2-integration` | I1 | Cross-system integration tests, balance simulations | Medium | All Phase 2 systems |

**Estimated total: ~30-40 tasks across 8 branches.**

## Merge Order

1. `feat/zone-expansion` -- no Phase 2 deps
2. `feat/dungeon-system` -- needs zones
3. `feat/profession-system` -- can overlap with dungeons, but merge after for material drops
4. `feat/reputation-system` -- needs zones + dungeons
5. `feat/raid-system` -- needs dungeons + reputation
6. `feat/daily-weekly` -- needs all content
7. `feat/phase2-ui` -- needs all engine systems
8. `feat/phase2-integration` -- final verification

## New Data Files Needed

| File | Contents |
|------|----------|
| `data/dungeons/*.json` | 10 dungeon definitions (bosses, loot tables, unlock requirements) |
| `data/raids/*.json` | 4 raid definitions (bosses, tier sets, attunement chains) |
| `data/professions/*.json` | 12 profession definitions (recipes, materials, skill curves) |
| `data/factions/*.json` | 10+ faction definitions (reputation thresholds, vendor inventories) |
| `data/zones/quests/*.json` | Per-zone quest chain definitions |
| `data/zones/events/*.json` | Zone event definitions |
| `data/materials.json` | Material/reagent definitions for professions |
| `data/vendors.json` | Vendor inventories (reputation-gated, currency-priced) |

## New Shared Types Needed

- `IDungeonDefinition`, `IBossDefinition`, `IDungeonRun`, `IDungeonLockout`
- `IRaidDefinition`, `IRaidBoss`, `IAttunementChain`, `ITierSet`
- `IProfessionDefinition`, `IRecipe`, `IMaterial`, `ICraftingResult`
- `IFactionDefinition`, `IReputationState`, `IVendorInventory`
- `IQuestChain`, `IZoneEvent`, `IRareSpawn`
- `IDailyQuest`, `IWeeklyReset`

## New Balance Config Sections

`data/balance.json` will need new sections:

- `dungeons` -- success rate formula, clear time scaling, lockout durations
- `raids` -- party composition bonuses, boss enrage timers, weekly lockout
- `professions` -- skill gain rates, recipe difficulty curves, gathering yields
- `reputation` -- gain rates per source, diminishing returns, tabard multiplier
- `dailyWeekly` -- quest reward budgets, currency caps, reset timing

## Open Design Questions (Need Human Input)

1. **Dungeon success model** -- Should dungeon success be binary (pass/fail based on gear score) or granular (per-boss with partial progress)? The GDD says "success chance 60-99%", but per-boss granularity would feel more MMORPG-authentic.

2. **Raid party composition** -- The GDD says "5-player guild groups with AI companions." Do we simulate 4 AI party members with roles (tank, healer, 2 DPS + player), or abstract the party bonus as a flat modifier? Full simulation is more authentic but significantly more complex.

3. **Profession idle integration** -- Should gathering happen automatically in the current zone (passive income while grinding), or require explicit "send character to gather" actions? The former is simpler; the latter creates meaningful choice.

4. **How many factions?** -- The GDD says "10+ factions." We need to decide the exact count and whether each zone has a faction, or some factions are cross-zone. Proposed: 12 factions (1 per zone) plus 2 neutral factions.

5. **Crafted vs dropped gear** -- Should crafted gear compete with dungeon drops at the same iLevel, or serve as a "catch-up" mechanism (slightly lower stats but guaranteed)? This affects whether professions feel mandatory or optional.

6. **Offline dungeon runs** -- The idle mechanics GDD says "max 1 heroic dungeon offline, no raid progress." Should normal dungeons during leveling also be limited offline?

7. **Set bonus complexity** -- Tier sets with 2/4/6 piece bonuses are defined in the GDD. Should Phase 2 implement all three thresholds, or start with 2/4 and add 6-piece in Phase 3?

8. **Quest chain length** -- How many quests per chain? Long chains (10-15 quests) feel more MMORPG but slow idle pacing. Short chains (3-5) fit idle better but feel less epic.

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Dungeon/raid runner complexity | High | High | Start with simple success-chance model; add per-boss granularity later |
| Data volume (10 dungeons x 3-5 bosses x loot tables) | Medium | High | Template-based generation for boss stats; hand-craft loot tables |
| Profession economy balance | High | Medium | Keep profession output as catch-up gear; balance sim validates |
| Save file size growth | Medium | Medium | Lazy-load dungeon/raid history; only persist active state |
| UI scope creep | High | Medium | Strict wireframe-first approach; no features without specs |

## Per-System Design Docs

| Document | System |
|----------|--------|
| [dungeons-raids.md](dungeons-raids.md) | Dungeon and raid system design |
| [professions.md](professions.md) | Profession system design |
| [reputation.md](reputation.md) | Reputation system design |
| [zones-expansion.md](zones-expansion.md) | Zone content expansion |
