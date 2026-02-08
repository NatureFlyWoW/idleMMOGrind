# Idle MMORPG

An offline idle/incremental RPG delivered as an Electron desktop app that simulates the classic MMORPG experience (WoW, EQ2, RIFT). Players create characters, level 1-60 through automated quests and grinding, then engage in endgame gear progression through dungeons and raids — all while progressing offline. No energy systems, no pay-to-win.

## Reference Documents

- **Game Design Document (canonical):** `reference/Idle_MMORPG_Design.pdf`
  - All game systems, formulas, content, and progression targets are defined here
  - When in doubt about a mechanic, consult the GDD first
  - Design changes must be documented and reconciled with the GDD

## Tech Stack

- **Platform:** Electron (Windows, macOS, Linux)
- **Language:** TypeScript (strict mode)
- **Frontend:** React, CSS Modules, HTML5 Canvas/WebGL for sprites
- **Backend/Engine:** Node.js, Worker Threads for heavy computation
- **Build:** Electron Builder, pnpm
- **Save Format:** JSON with gzip compression
- **Testing:** Vitest (unit), Playwright (integration/E2E)

## Project Structure

```
idle-mmorpg/
├── .claude/
│   └── agents/               # Subagent definitions
│       ├── idle-mmo-gdev.md
│       ├── idle-mmo-gpm.md
│       ├── idle-mmo-ui-designer.md
│       └── idle-mmo-frontend-dev.md
├── reference/                # Design docs, research, competitive analysis (read-only reference)
│   └── Idle_MMORPG_Design.pdf
├── docs/                     # Living documentation
│   ├── specs/                # Feature specifications (@idle-mmo-gpm writes)
│   ├── balance/              # Balance sheets, progression curves (@idle-mmo-gpm writes)
│   ├── ui/                   # Wireframes, visual specs, interaction specs (@idle-mmo-ui-designer writes)
│   │   ├── wireframes/
│   │   ├── specs/
│   │   └── interactions/
│   └── architecture/         # Technical architecture decisions (@idle-mmo-gdev writes)
├── src/
│   ├── main/                 # Electron main process
│   │   ├── save/             # Save/load system
│   │   ├── ipc/              # IPC channel definitions
│   │   └── updater/          # Auto-update system
│   ├── engine/               # Game engine (runs in Worker Threads)
│   │   ├── combat/           # Combat system, damage formulas, ability priority
│   │   ├── progression/      # XP, leveling, quest completion
│   │   ├── gear/             # Item generation, loot tables, iLevel, set bonuses
│   │   ├── talents/          # Talent trees, point allocation, respec
│   │   ├── dungeons/         # Dungeon/raid simulation, success chance, lockouts
│   │   ├── professions/      # Gathering, crafting, recipes
│   │   ├── economy/          # Gold, Justice/Valor Points, vendors
│   │   ├── reputation/       # Faction reputation, rewards
│   │   ├── prestige/         # Ascension, Paragon trees, alt bonuses
│   │   ├── offline/          # Offline progression calculation
│   │   └── character/        # Race/class definitions, stats, creation
│   ├── renderer/             # Electron renderer process (React app)
│   │   ├── components/       # React UI components
│   │   │   ├── character/    # Paper doll, stat panel, buff bar
│   │   │   ├── inventory/    # Grid, item slots, bag tabs
│   │   │   ├── talents/      # Tree visualization, nodes
│   │   │   ├── combat/       # Combat log, DPS meter
│   │   │   ├── quests/       # Quest tracker, journal
│   │   │   ├── dungeons/     # Browser, loot preview
│   │   │   ├── professions/  # Crafting grid, recipe list
│   │   │   ├── achievements/ # Category panels, progress
│   │   │   ├── shared/       # Tooltips, modals, buttons, bars
│   │   │   └── layout/       # Hub layout, navigation, panels
│   │   ├── hooks/            # useGameState, useTooltip, useDragDrop
│   │   ├── styles/           # Theme, component CSS, global styles
│   │   └── assets/           # Icons, UI chrome, sprites
│   └── shared/               # Types, constants, utils shared between main/renderer/engine
│       ├── types/            # TypeScript interfaces for game data
│       ├── constants/        # Game constants, balance values
│       └── utils/            # Pure utility functions
├── data/                     # Game data files (JSON)
│   ├── races.json
│   ├── classes.json
│   ├── talents/              # Per-class talent tree definitions
│   ├── abilities/            # Per-class ability definitions
│   ├── items/                # Item templates, loot tables
│   ├── dungeons/             # Dungeon definitions, boss mechanics
│   ├── raids/                # Raid definitions
│   ├── quests/               # Quest chains per zone
│   ├── zones/                # Zone definitions
│   ├── professions/          # Recipes, materials
│   ├── factions/             # Reputation thresholds, rewards
│   └── balance.json          # Tunable balance parameters (XP curves, drop rates, etc.)
└── tests/
    ├── unit/                 # Unit tests mirroring src/ structure
    ├── integration/          # Cross-system integration tests
    └── balance/              # Balance simulation tests
```

## Agent Roster & Directory Ownership

### @idle-mmo-gdev — Senior Game Developer
- **Owns:** `src/engine/`, `src/main/`, `src/shared/`, `data/`, `tests/`
- **Role:** Implements all game systems, combat engine, progression, gear/loot, dungeons/raids, offline simulation, save system
- **Invoke when:** Implementing game logic, fixing bugs in game systems, performance optimization, writing tests, data file creation

### @idle-mmo-gpm — Game Product Manager / Designer
- **Owns:** `docs/specs/`, `docs/balance/`, `reference/`
- **Role:** Feature specs, balance design, roadmap, progression curves, content planning, acceptance criteria
- **Invoke when:** Design decisions needed, new feature scoping, balance tuning, content planning, competitive analysis

### @idle-mmo-ui-designer — UI/UX & Visual Designer
- **Owns:** `docs/ui/`
- **Role:** Wireframes, visual specs, interaction design, icon/sprite specifications, design system
- **Invoke when:** New screen/component design, UX review, visual spec creation, asset requirements

### @idle-mmo-frontend-dev — Frontend Developer
- **Owns:** `src/renderer/`
- **Role:** Implements React UI components, CSS theming, Electron renderer, state management, animations
- **Invoke when:** Building UI components, implementing designs, Electron renderer work, frontend performance

## Coordination Rules

### Directory Boundaries
- Agents only modify files within their owned directories
- `src/shared/` is co-owned: @idle-mmo-gdev defines interfaces, @idle-mmo-frontend-dev consumes them
- `data/` is co-owned: @idle-mmo-gpm specifies content, @idle-mmo-gdev implements the schemas and validates

### Workflow
1. **@idle-mmo-gpm** writes feature spec in `docs/specs/` with acceptance criteria
2. **@idle-mmo-ui-designer** creates wireframes/specs in `docs/ui/` for any UI-facing features
3. **@idle-mmo-gdev** implements engine logic in `src/engine/` and data schemas in `data/`
4. **@idle-mmo-frontend-dev** implements UI in `src/renderer/` based on designer specs and engine interfaces

### Communication
- Agents communicate via JSON status messages (see individual agent files for protocol)
- Blocking issues should name the blocked agent and the specific need
- Balance parameters live in `data/balance.json` — @idle-mmo-gpm defines values, @idle-mmo-gdev implements consumption

## Coding Standards

### TypeScript
- Strict mode, no `any` in committed code
- Interfaces for all game data structures in `src/shared/types/`
- Enums for fixed sets (item quality, gear slot, class, race, etc.)
- Pure functions for all formulas and calculations (testable, no side effects)

### Game Data
- All balance-tunable values in `data/balance.json`, never hardcoded
- Content data (items, quests, talents, etc.) in `data/` as JSON
- Data files validated against TypeScript schemas at build time

### Testing
- Unit tests required for all formulas, calculations, and game logic
- Integration tests for cross-system interactions (e.g., gear equip → stat recalculation → combat DPS change)
- Balance simulation tests that verify pacing targets (time-to-level, time-to-Ascension)

### Git
- Conventional commits: `feat(combat):`, `fix(gear):`, `docs(spec):`, etc.
- Feature branches per system: `feat/combat-engine`, `feat/inventory-ui`, etc.
- PRs reference the relevant spec in `docs/specs/` when applicable

### Git Worktrees
Use git worktrees to isolate feature work from `main`. This prevents half-finished work from polluting the main branch and allows parallel development streams.

**Worktree Location:** `C:\Users\Caus\Desktop\idleMMOGrind-worktrees\<branch-name>\`

**Workflow:**
1. Create a worktree for each major feature/system:
   ```bash
   git worktree add ../idleMMOGrind-worktrees/feat-combat-engine feat/combat-engine
   git worktree add ../idleMMOGrind-worktrees/feat-character-creation feat/character-creation
   ```
2. Work in the worktree directory, commit there
3. When feature is complete and reviewed, merge back to `main`
4. Clean up: `git worktree remove ../idleMMOGrind-worktrees/<branch>`

**When to use worktrees:**
- Any implementation work (engine systems, UI components, data files)
- Large documentation efforts that span multiple sessions
- Experimental/prototype work

**When NOT to use worktrees:**
- Quick single-file fixes on `main`
- Reading/research tasks
- Updating CLAUDE.md or memory files (these stay on `main`)

**Branch naming convention:**
- `feat/<system>` — New feature work (e.g., `feat/combat-engine`, `feat/inventory-ui`)
- `docs/<topic>` — Documentation work (e.g., `docs/phase1-specs`)
- `fix/<issue>` — Bug fixes
- `refactor/<scope>` — Refactoring work

### Performance
- Worker threads for: combat simulation, offline calculation, loot generation
- No synchronous IPC between main and renderer
- Virtualized lists for combat log, inventory, achievements
- Lazy load non-essential screens (professions, achievements)

## Key Game Parameters (Quick Reference)

| Parameter | Value |
|-----------|-------|
| Level cap | 60 |
| Talent points | 51 (level 10-60) |
| Gear slots | 15 |
| Quality tiers | Common/Uncommon/Rare/Epic/Legendary |
| Endgame iLevel range | 60-90 |
| Raids | 4 (sequential attunement) |
| Offline max | 24h (diminishing after 12h) |
| Time to first Ascension | 25-40 hours |
| Paragon trees | 5 (250 Ascensions to max) |
| Races | 8 |
| Classes | 9 (27 specs) |
| Professions | 9 primary + 3 secondary |
| Currencies | Gold, Justice Points (4K cap), Valor Points (1K/week cap) |

## Superpowers Skills (Mandatory Workflows)

The `superpowers` plugin provides structured workflows that MUST be followed. Invoke the relevant skill via `/skill-name` BEFORE starting work. If there's even a 1% chance a skill applies, invoke it first.

### Skill → When to Use

| Skill | Trigger |
|-------|---------|
| `/brainstorming` | Before ANY creative work: new features, components, systems, design decisions |
| `/writing-plans` | When you have requirements and need to plan multi-step implementation |
| `/executing-plans` | When a written plan exists and you're ready to implement |
| `/subagent-driven-development` | When executing plans with independent tasks using subagents |
| `/dispatching-parallel-agents` | When 2+ independent tasks can run simultaneously |
| `/test-driven-development` | Before writing ANY implementation code — write tests first |
| `/systematic-debugging` | When encountering ANY bug, test failure, or unexpected behavior |
| `/using-git-worktrees` | Before starting feature work that needs isolation from `main` |
| `/requesting-code-review` | After completing a feature, before merging |
| `/receiving-code-review` | When processing code review feedback |
| `/finishing-a-development-branch` | When implementation is complete and ready to integrate |
| `/verification-before-completion` | Before claiming any work is "done" — verify with actual output |

### Priority Order
1. **Process skills first** (brainstorming, debugging) — determines HOW to approach
2. **Implementation skills second** (TDD, executing-plans) — guides execution

### Examples
- "Add combat system" → `/brainstorming` → `/writing-plans` → `/using-git-worktrees` → `/test-driven-development` → `/executing-plans`
- "Fix XP calculation bug" → `/systematic-debugging` → fix → `/verification-before-completion`
- "Build inventory UI" → `/brainstorming` → `/writing-plans` → `/using-git-worktrees` → `/subagent-driven-development`

## Development Phases

1. **Phase 1 (Months 1-4):** Electron scaffold, character creation, combat, leveling 1-60, gear, talents, save system
2. **Phase 2 (Months 5-8):** 6 zones, 10 dungeons, 4 raids, professions, reputation
3. **Phase 3 (Months 9-10):** Ascension, Paragon, achievements, collections, alts
4. **Phase 4 (Months 11-12):** UI polish, balance tuning, tutorial, Electron optimization, beta
