---
name: idle-mmo-balance-check
description: Runs balance simulations against GDD progression targets. Use after modifying combat formulas, XP curves, loot tables, or balance.json.
---

# Balance Check

Invoke the @idle-mmo-balance-sim agent to validate progression targets.

## When to Use
- After modifying combat formulas in `src/engine/combat/`
- After changing XP curves or leveling pacing
- After modifying loot tables or drop rates
- After updating `data/balance.json`
- Before finalizing any balance-affecting PR

## Key Targets Validated
- Time-to-60: 25-40 hours
- Early leveling: 1-2 levels/hour (1-30)
- Mid leveling: 1 level per 1-2 hours (31-59)
- Offline efficiency: 100% (0-12h) -> 75% (12-18h) -> 50% (18-24h)
- Currency caps: Justice Points 4000, Valor Points 1000/week
- First Ascension: 25-40 hours total

## How to Run
Invoke the @idle-mmo-balance-sim agent with the specific system or formula that changed.
