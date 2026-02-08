# Phase 2 Design Brief -- Reputation System

## Overview

Reputation provides a long-term progression track that ties together zones, dungeons, and daily content. Factions grant access to exclusive vendors, recipes, enchants, and cosmetics at increasing reputation tiers. In an idle game, reputation serves as the "slow burn" reward system -- something that accumulates steadily over days and weeks, giving players reasons to return to specific content.

## Player Motivation

- **Vendor unlocks** -- Deterministic gear and recipe access at known thresholds
- **Long-term goals** -- Weeks of play to reach Exalted, providing sustained direction
- **Zone identity** -- Each zone's faction gives that content lasting relevance
- **Alt efficiency** -- Account-wide reputation gains at 50% rate benefit alts
- **Collection** -- Exalted rewards include mounts, titles, and cosmetics

## Reputation Tier Structure

Using the thresholds from the GDD:

| Tier | Cumulative Rep | Incremental | Unlocks |
|------|---------------|-------------|---------|
| Neutral | 0 | -- | Can interact with faction NPCs |
| Friendly | 3,000 | 3,000 | Basic vendor access, tabard purchase |
| Honored | 9,000 | 6,000 | Uncommon gear, profession recipes, enchants |
| Revered | 21,000 | 12,000 | Rare gear, advanced recipes, unique enchants |
| Exalted | 42,000 | 21,000 | Epic gear, mounts, titles, cosmetic rewards |

The increasing gap between tiers creates natural pacing -- early tiers come quickly, later tiers require sustained effort.

## Faction Definitions

Proposed: 12 zone-aligned factions + 2 neutral factions = 14 total.

### Zone Factions (12)

Each zone has an associated faction. Questing and killing monsters in that zone earns reputation.

| ID | Name | Zone | Theme | Key Vendor Rewards |
|----|------|------|-------|--------------------|
| fac_01 | Sunstone Watch | Sunstone Valley | Frontier militia | Starting trinkets, basic recipes |
| fac_02 | Thornwick Guard | Thornwick Hamlet | Village defenders | Uncommon weapons, first aid recipes |
| fac_03 | Wildwood Circle | Wildwood Thicket | Druid protectors | Leather recipes, nature resist gear |
| fac_04 | Silvergrass Wardens | Silvergrass Meadows | Plains rangers | Ranged weapons, agility enchants |
| fac_05 | Mistmoor Scholars | Mistmoor Bog | Arcane researchers | Spell power gear, alchemy recipes |
| fac_06 | Embercrag Smiths | Embercrag Caverns | Master forgers | Blacksmithing recipes, fire resist gear |
| fac_07 | Skyreach Sentinels | Skyreach Summits | Mountain guardians | Plate armor, frost resist gear |
| fac_08 | Ironhold Legion | Ironhold Fortress | Military order | Weapons, engineering schematics |
| fac_09 | Blighted Reclaimers | Blighted Wastes | Undead hunters | Shadow resist gear, cleric recipes |
| fac_10 | Ashfall Dragonseekers | Ashfall Plateau | Dragon scholars | Fire resist gear, high-end alchemy |
| fac_11 | Twilight Watchers | Twilight Reaches | Reality wardens | Spell penetration gear, enchanting formulas |
| fac_12 | Spire Ascendants | Ascendant Spire | Final guardians | Pre-raid Epic gear, attunement quest starters |

### Neutral Factions (2)

These are not tied to a specific zone and provide cross-cutting rewards:

| ID | Name | Rep Source | Key Vendor Rewards |
|----|------|-----------|-------------------|
| fac_guild | Adventurers' Guild | All dungeon completions, weekly quests | Dungeon-enhancing consumables, heirloom tokens |
| fac_artisan | Artisan Collective | Profession skill-ups, crafting deliveries | Rare profession recipes, crafting tools, material bags |

## Reputation Sources

### Questing (Primary Source During Leveling)

- Each quest in a zone awards reputation with that zone's faction
- Base rep per quest: 50-150 depending on quest difficulty
- Quest chain completion bonuses: 250-500 bonus rep
- Estimated rep per zone clear: 2,000-3,500 (reaches Friendly naturally)

### Monster Kills (Passive Trickle)

- Killing monsters in a faction's zone awards small reputation
- Base: 5 rep per kill (normal), 25 rep per kill (elite), 50 rep per kill (boss)
- Only for monsters within the faction's zone
- This is the "idle accumulation" path -- slow but automatic

### Dungeon Completion

- Normal dungeon completion: 100 rep with the dungeon's associated faction
- Heroic dungeon completion: 250 rep with associated faction + 100 Adventurers' Guild rep
- Boss kills within dungeon: 25 rep each

### Raid Completion

- Raid boss kill: 100 rep with relevant faction
- Full raid clear: 500 bonus rep

### Daily Quests (Level 60)

- 10 daily quests available, rotating across factions
- Each daily: 150-300 reputation with a specific faction
- Primary endgame reputation source
- Estimated daily rep: ~2,000 across various factions

### Tabard System

- Purchase a faction tabard at Friendly
- While wearing a tabard, heroic dungeon kills grant bonus rep for that faction
- Bonus: +75 rep per heroic boss kill for the tabard faction
- Allows players to target specific factions during dungeon farming

### Reputation Tokens

- Rare monster drops that grant 250 rep with a specific faction
- Trade-in items that convert between factions at a loss (250 token = 150 rep for different faction)

## Vendor System

Each faction has a vendor with inventory that unlocks at reputation tiers.

### Vendor Inventory Structure

```
vendor: {
  factionId: string,
  tiers: {
    friendly: [
      { itemTemplateId: string, cost: { currency: "gold" | "justice" | "valor", amount: number } }
    ],
    honored: [...],
    revered: [...],
    exalted: [...]
  }
}
```

### Reward Budget Per Faction

| Tier | Gear Count | Recipe Count | Other |
|------|-----------|-------------|-------|
| Friendly | 1-2 Uncommon items | 1 recipe | Tabard, basic consumables |
| Honored | 2-3 Uncommon items | 2-3 recipes | Enchant formula |
| Revered | 2-3 Rare items | 2-3 rare recipes | Unique enchant, crafting materials |
| Exalted | 1-2 Epic items | 1 epic recipe | Mount, title, cosmetic set |

### Vendor Gear Balance

Vendor gear fills a specific niche: reliable, deterministic upgrades at known price points.

| Faction Tier | Vendor Gear iLevel | Comparison |
|-------------|-------------------|------------|
| Honored (zone fac) | Zone level +2 | Slightly better than quest rewards |
| Revered (zone fac) | Zone level +5 | Comparable to dungeon drops |
| Exalted (endgame facs) | 63-68 | Pre-raid catch-up, between quests and heroics |
| Exalted (Spire Ascendants) | 68-72 | On par with early heroic drops |

Vendor gear is purchased with gold (leveling factions) or Justice/Valor Points (endgame factions).

## New Engine Systems

### Reputation Tracker

Core engine module:
- Stores current reputation value per faction per character
- Computes current tier from value
- Applies reputation gains from all sources
- Handles account-wide alt bonus (50% rate)
- Emits events: `reputation_gained`, `tier_reached`

### Vendor Manager

Handles vendor interactions:
- Checks faction tier requirements for purchases
- Validates currency costs
- Generates vendor inventory based on faction + tier
- Processes purchases (deduct currency, add item to inventory)

### Daily Quest Generator

Generates daily quests at level 60:
- Selects 10 quests from a pool, distributed across factions
- Each quest has: kill target, zone, reputation reward, gold/currency reward
- Resets at midnight (configurable in balance.json)
- Tracks completion state in save file

## Data Files

| File | Contents |
|------|----------|
| `data/factions/definitions.json` | 14 faction definitions (id, name, zone, description) |
| `data/factions/vendors/*.json` | Per-faction vendor inventories (tiered item lists with costs) |
| `data/factions/dailies.json` | Daily quest pool (50+ quests, 10 selected per day) |
| `data/factions/tabards.json` | Tabard items (cosmetic + faction assignment) |

## Save File Additions

```typescript
// Added to ISaveData
reputation: {
  factions: Record<string, number>,    // factionId -> current rep value
  tabardEquipped: string | null,       // factionId of equipped tabard
  dailyQuests: {
    availableToday: string[],          // quest IDs
    completedToday: string[],          // quest IDs
    lastResetTimestamp: number
  }
}
```

## Integration Points

| System | Integration |
|--------|------------|
| Questing | Quest completion triggers reputation gain |
| Dungeons | Dungeon/boss completion triggers reputation gain |
| Raids | Raid boss kills trigger reputation gain |
| Professions | Reputation vendors sell recipes; Artisan Collective tracks crafting |
| Gear | Vendor gear purchased at rep tiers |
| Tabards | Equipped tabard modifies dungeon reputation gains |
| Save/load | Reputation state persists across sessions |
| Offline | Reputation accumulates from offline monster kills and quest completions |

## Balance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Friendly from questing alone | Achievable by clearing zone | Natural progression |
| Honored from questing + grinding | ~2-4 hours in zone | Moderate investment |
| Revered | ~1-2 weeks of daily play | Significant commitment |
| Exalted | ~3-4 weeks of daily play | Major achievement |
| Daily rep gain (level 60, all sources) | ~2,000-3,000 total | Split across factions |
| Time to first Exalted (focused farming) | ~2-3 weeks | Meaningful but achievable |

## Future Considerations

- **Reputation-gated zone events** that unlock at Revered
- **Faction-specific daily quest chains** (multi-day arcs at Honored+)
- **Cross-faction diplomacy** -- Gaining rep with one faction slightly reduces another (creates meaningful choice)
- **Paragon reputation** -- After Exalted, continued rep gains award loot boxes (Phase 3)
- **Achievement integration** -- "Exalted with X factions" achievements (Phase 3)
