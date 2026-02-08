# Coding Standards

## TypeScript
- Strict mode, no `any` in committed code
- Interfaces for all game data structures in `src/shared/types/`
- Enums for fixed sets (item quality, gear slot, class, race, etc.)
- Pure functions for all formulas and calculations (testable, no side effects)

## Game Data
- All balance-tunable values in `data/balance.json`, never hardcoded
- Content data (items, quests, talents, etc.) in `data/` as JSON
- Data files validated against TypeScript schemas at build time

## Testing
- Unit tests required for all formulas, calculations, and game logic
- Integration tests for cross-system interactions
- Balance simulation tests that verify pacing targets
- Framework: Vitest (unit + integration), Playwright (E2E)

## Performance
- Worker threads for: combat simulation, offline calculation, loot generation
- No synchronous IPC between main and renderer
- Virtualized lists for combat log, inventory, achievements
- Lazy load non-essential screens (professions, achievements)

## Commits
- Conventional commits: `feat(combat):`, `fix(gear):`, `docs(spec):`, etc.
- Feature branches per system: `feat/combat-engine`, `feat/inventory-ui`, etc.
- PRs reference the relevant spec in `docs/specs/` when applicable
