---
name: idle-mmo-validate-data
description: Validates game data files against TypeScript schemas and GDD constraints. Use after modifying any file in data/ or src/shared/types/.
---

# Data Validation

Invoke the @idle-mmo-data-validator agent to check data integrity.

## When to Use
- After modifying any file in `data/`
- After changing interfaces in `src/shared/types/`
- After adding new enum values
- Before merging data-heavy branches

## What Gets Checked
- Enum values in TypeScript match JSON data files
- Stat budgets follow iLevel formulas
- Loot table probabilities are valid
- Cross-file reference integrity (zone IDs -> dungeon IDs, class IDs -> talent trees)
- balance.json values within GDD-specified ranges

## How to Run
Invoke the @idle-mmo-data-validator agent with the specific files or directories that changed.
