# Idle MMORPG -- Game Design Index

> Version 1.0 | February 7, 2026

Idle MMORPG is an offline idle/incremental game delivered as an Electron desktop application that simulates the classic MMORPG experience inspired by World of Warcraft, EverQuest 2, and RIFT. Players create characters, level through quests and grinding, and engage in endgame gear progression -- all while the game continues to progress offline.

## Core Game Pillars

- **Authentic MMORPG Feel** -- Replicate the systems, terminology, and progression loops that define classic MMORPGs
- **Satisfying Idle Progression** -- Ensure meaningful advancement both during active play and offline periods
- **Deep Character Customization** -- Provide extensive build variety through classes, races, talents, and gear
- **Endgame Loop** -- Create a compelling gear-driven progression system at max level

## Target Audience

- Former or current MMORPG players seeking a nostalgic experience
- Idle game enthusiasts who enjoy deep progression systems
- Players who love character building and optimization
- Those who want MMORPG-style progression without time commitment

## Unique Selling Points

- Fully offline gameplay with robust idle progression
- Authentic MMORPG systems adapted for idle mechanics
- Multiple prestige layers (alts, account-wide bonuses)
- No energy systems or artificial waiting -- pure progression
- Deep build customization with meaningful choices

## GDD Reference Files

| File | Description |
|------|-------------|
| [characters.md](characters.md) | Races, classes, stat bonuses, racial abilities, starting configuration |
| [combat.md](combat.md) | Automated combat loop, stats, damage formulas, ability types, resources |
| [progression.md](progression.md) | XP sources, level ranges, zones, pacing targets, daily/weekly systems |
| [gear.md](gear.md) | Gear slots, item quality tiers, acquisition, item level system |
| [talents.md](talents.md) | Talent point structure, tree tiers, example builds, respec mechanics |
| [dungeons-raids.md](dungeons-raids.md) | Dungeon tiers, raid progression, attunement, boss loot tables |
| [professions.md](professions.md) | Gathering, crafting, and secondary professions, skill progression |
| [economy.md](economy.md) | Gold, Justice Points, Valor Points, Honor Points (future) |
| [prestige.md](prestige.md) | Ascension system, Paragon talent trees, alt character system |
| [reputation.md](reputation.md) | Faction tiers, reputation sources, progressive rewards |
| [achievements.md](achievements.md) | Achievement categories and rewards |
| [ui-ux.md](ui-ux.md) | Main screen layout, character screen, inventory, accessibility |
| [idle-mechanics.md](idle-mechanics.md) | Automation philosophy, active/idle loops, offline balancing |
| [technical.md](technical.md) | Electron architecture, performance, save system, platform targets |

## Development Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| Phase 1 | Months 1-4 | Core systems -- Electron scaffold, character creation, combat, leveling 1-60, gear, talents, save system |
| Phase 2 | Months 5-8 | Content -- 6 leveling zones, 10 dungeons, 4 raids, professions, reputation |
| Phase 3 | Months 9-10 | Meta-progression -- Ascension, Paragon, achievements, collections, alts |
| Phase 4 | Months 11-12 | Polish -- UI/UX refinement, balance tuning, tutorial, Electron optimization, beta testing |
