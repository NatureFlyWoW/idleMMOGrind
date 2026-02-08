# Phase 2 Design Brief -- Zone Content Expansion

## Overview

Phase 1 delivers 12 zones with basic monster lists and simple quest counts. Phase 2 transforms these into content-rich areas with quest chains, elite sub-zones, rare spawns, zone events, and deeper monster variety. The goal is making each zone feel like a distinct place with its own story, challenges, and rewards -- not just a level-appropriate monster farm.

## What "Expanding Zones" Means for an Idle Game

Zone expansion does not change the fundamental idle loop (auto-fight monsters, complete quests, earn loot). Instead, it adds layers:

1. **Quest chains** replace generic "kill X" quests with narrative sequences that build toward zone conclusions
2. **Elite areas** within zones provide optional harder content with better rewards
3. **Rare spawns** add excitement through low-probability, high-reward encounters
4. **Zone events** create periodic changes that break monotony and reward check-ins
5. **Monster enrichment** adds variety to existing monster lists with new types and abilities

The key principle: expansion should not require more active management. All new content auto-progresses like existing content, but with more variety and better pacing.

## Quest Chain System

### Current State (Phase 1)

Phase 1 zones have a `questCount` (10-22 quests per zone) and quests are generated procedurally from zone monster lists. Quests are standalone kill/collection tasks.

### Phase 2 Expansion

Replace standalone quests with structured quest chains:

**Quest Chain Structure:**
- Each zone has 2-4 quest chains
- Each chain has 3-8 quests (see Open Question #8 in index.md)
- Chains progress linearly (quest 2 unlocks after quest 1)
- Final quest in a chain awards a significant reward (rare gear, reputation boost, zone unlock)
- Chains have narrative flavor text providing zone lore

**Quest Chain Template:**
```
questChain: {
  id: string,
  zoneId: string,
  name: string,
  description: string,
  quests: [
    {
      id: string,
      name: string,
      description: string,
      type: QuestType,
      objectives: { targetId: string, count: number }[],
      xpReward: number,
      goldReward: number,
      reputationReward: { factionId: string, amount: number },
      gearReward?: { slot: GearSlot, qualityMin: ItemQuality },
      nextQuestId: string | null
    }
  ],
  completionReward: {
    xpBonus: number,
    goldBonus: number,
    reputationBonus: number,
    unlocks?: string  // e.g., "elite_area_zone_03", "dungeon_dgn_03"
  }
}
```

### Quest Types Expanded

Phase 1 has: Kill, Collection, Dungeon, Elite, Attunement.

Phase 2 adds context to these types within chains:
- **Kill** -- Kill N specific monsters (now targeting named types within the chain narrative)
- **Collection** -- Gather N items from monster drops (material drops specific to the quest)
- **Elite** -- Kill an elite monster (zone mini-boss, harder than normal)
- **Dungeon** -- Complete a specific dungeon (links zone chains to dungeon content)
- **Escort** -- Protect an NPC for N combat ticks (auto-resolved, success based on DPS)
- **Exploration** -- Reach a zone sub-area (auto-completed based on time in zone)

### Quest Chain Examples

**Sunstone Valley -- "The Shadow Beneath"** (3 quests)
1. Kill 10 wolves threatening the farms (Kill)
2. Collect 5 tainted pelts from the wolves (Collection)
3. Defeat the Shadow Wolf alpha in the cave (Elite) -- Rewards: Uncommon weapon

**Blighted Wastes -- "The Lich's Instruments"** (6 quests)
1. Destroy 15 skeleton knights in the outer wastes (Kill)
2. Collect 8 soul shards from necromancers (Collection)
3. Defeat the Boneguard Captain (Elite)
4. Enter the Blightcrypt dungeon and clear the first wing (Dungeon)
5. Collect the Lich's Phylactery fragment from the crypt (Collection)
6. Destroy the Bone Dragon guardian (Elite) -- Rewards: Rare chest armor, 500 Reclaimers rep

### Quest Chain Distribution

| Zone | Chains | Total Quests | Level Range |
|------|--------|-------------|-------------|
| Sunstone Valley | 2 chains | 6-8 quests | 1-5 |
| Thornwick Hamlet | 2 chains | 8-10 quests | 5-10 |
| Wildwood Thicket | 3 chains | 10-12 quests | 11-15 |
| Silvergrass Meadows | 3 chains | 10-12 quests | 15-20 |
| Mistmoor Bog | 3 chains | 12-14 quests | 21-25 |
| Embercrag Caverns | 3 chains | 12-14 quests | 25-30 |
| Skyreach Summits | 3 chains | 12-14 quests | 31-35 |
| Ironhold Fortress | 3 chains | 14-16 quests | 35-40 |
| Blighted Wastes | 4 chains | 14-16 quests | 41-45 |
| Ashfall Plateau | 4 chains | 14-16 quests | 45-50 |
| Twilight Reaches | 4 chains | 16-18 quests | 51-55 |
| Ascendant Spire | 4 chains | 16-18 quests | 55-60 |

**Total: ~38 quest chains, ~150 quests.**

## Elite Areas

Each zone (except starting zones) has an elite sub-area with tougher monsters and better rewards.

### Elite Area Design

- Monsters are 2-3 levels higher than the zone's normal range
- Monster HP and damage: 2x normal
- Loot quality: +1 tier (Uncommon becomes Rare, etc.)
- XP per kill: 1.5x normal
- Reputation gain: 2x normal
- Some quest chain objectives direct the player to elite areas

### Elite Area List

| Zone | Elite Area | Monster Types | Level Boost |
|------|-----------|---------------|-------------|
| Wildwood Thicket | The Blighted Grove | Ancient Treants, Corrupted Dryads | +2 |
| Silvergrass Meadows | Centaur Warcamp | Centaur Champions, War Riders | +2 |
| Mistmoor Bog | The Sunken Temple | Bog Lords, Ancient Horrors | +3 |
| Embercrag Caverns | The Molten Core | Greater Fire Elementals, Lava Lords | +3 |
| Skyreach Summits | Frost Dragon's Perch | Frost Drakes, Ice Giants | +2 |
| Ironhold Fortress | The War Chief's Sanctum | Orc Champions, Battle Trolls | +3 |
| Blighted Wastes | The Necropolis | Death Knights, Bone Golems | +3 |
| Ashfall Plateau | The Dragon Roost | Elder Dragonkin, Fire Lords | +3 |
| Twilight Reaches | The Void Rift | Void Walkers, Reality Renders | +3 |
| Ascendant Spire | The Final Chamber | Ascendant Lords, Entropy Titans | +3 |

### Auto-Progression Into Elite Areas

The engine should:
1. Complete all normal quest chains in the zone first
2. If player level exceeds zone max by 1+, auto-enter elite area
3. If player level is at zone max, offer elite area as an option (active choice)
4. Elite areas are optional -- the player can move to the next zone instead

## Rare Spawns

Rare monsters that appear infrequently and drop above-average loot.

### Rare Spawn Mechanics

- Each zone has 2-3 rare spawns
- Spawn chance: 1-3% per monster kill in the zone (checked on each kill)
- Rare monster stats: 3x HP, 2x damage, level +1
- Guaranteed Rare+ quality drop
- Bonus XP: 5x normal monster XP
- Bonus reputation: 50 rep with zone faction
- Combat log entry: special "Rare spawn appeared!" notification

### Rare Spawn List (Sampling)

| Zone | Rare Spawn | Level | Notable Drop |
|------|-----------|-------|-------------|
| Sunstone Valley | Old Shadowfang | 5 | Shadowfang Fang (Uncommon dagger) |
| Thornwick Hamlet | Plaguemother | 10 | Plaguemother's Veil (Uncommon cloth helm) |
| Mistmoor Bog | The Lurking Horror | 25 | Lurker's Eye (Rare trinket) |
| Skyreach Summits | Frostmaw | 35 | Frostmaw's Claw (Rare weapon) |
| Blighted Wastes | The Bone Colossus | 45 | Colossus Fragment (Rare shield) |
| Ascendant Spire | Entropy Incarnate | 60 | Entropy Shard (Epic trinket) |

**Total: ~30 rare spawns across 12 zones (2-3 per zone).**

## Zone Events

Periodic events that temporarily modify zone behavior. These add variety to the idle loop and reward active check-ins.

### Event Types

| Event Type | Effect | Duration | Trigger |
|------------|--------|----------|---------|
| Monster Surge | 2x monster spawn rate, +50% XP | 30 min | Random, 1-2 per day per zone |
| Gathering Bounty | 2x gathering yield | 30 min | Random, tied to zone resource type |
| Elite Invasion | Elite monsters appear in normal areas | 15 min | Random, 1 per day per zone |
| Rare Hunt | Rare spawn chance increased to 10% | 10 min | Triggered after killing 100+ monsters in zone |
| Faction Rally | 2x reputation gain in zone | 30 min | Random, 1 per day |

### Event Mechanics

- Events are tracked per-zone in the game state
- Events fire based on randomized timers in the game loop
- Active events are visible in the UI (zone panel shows active event)
- Events occur during offline play (offline calculator accounts for average event uptime)
- Events do not require player action -- they automatically apply their bonuses

### Event Data Structure

Each event definition: `id`, `zoneId`, `type` (monster_surge/gathering_bounty/elite_invasion/rare_hunt/faction_rally), `durationMs`, `cooldownMs`, and an `effects` object with optional multipliers (xp, gathering, reputation, rareSpawnChance, monsterLevelBoost).

## Monster Enrichment

### Current State

Phase 1 zones have 4-6 monster IDs per zone as strings in `zones.json`. Monsters are generated from templates using balance formulas.

### Phase 2 Expansion

Add explicit `IMonsterTemplate` data files per zone with:
- Specific monster abilities (some monsters buff themselves, some have DoTs)
- Monster subtypes that affect loot (beast -> skinning materials, humanoid -> cloth, elemental -> reagents)
- Named monster variants (mini-bosses within quest chains)
- Monster families (wolf pack, orc warband) for thematic grouping

### Monster Subtype System

| Subtype | Material Drop | Example |
|---------|--------------|---------|
| Beast | Leather (Skinning), Meat (Cooking) | Wolf, Bear, Drake |
| Humanoid | Cloth (Tailoring), Coins (gold bonus) | Bandit, Orc, Cultist |
| Elemental | Reagents (Alchemy), Cores (Engineering) | Fire Elemental, Wind Elemental |
| Undead | Bone Dust (Alchemy), Rune Fragments (Enchanting) | Skeleton, Ghoul, Wraith |
| Construct | Gears (Engineering), Stone (Mining) | Golem, Ancient Construct |
| Dragonkin | Scales (Leatherworking), Essence (Alchemy) | Dragonkin, Drake, Wyrm |

This subtype system feeds directly into the profession material pipeline.

### New Monster Data Structure

Extend `IMonsterTemplate` with: `subtype` (beast/humanoid/elemental/undead/construct/dragonkin), `abilities` array, and `materialDrops` array (materialId, chance, requiresProfession). Per-zone data files: `data/zones/monsters/{zone_id}.json`.

## New Data Files

| File | Contents |
|------|----------|
| `data/zones/quests/{zone_id}.json` | Quest chains per zone (~38 chains, ~150 quests) |
| `data/zones/monsters/{zone_id}.json` | Full monster definitions per zone (~70 unique monsters) |
| `data/zones/elites/{zone_id}.json` | Elite area definitions (10 elite areas) |
| `data/zones/rares/{zone_id}.json` | Rare spawn definitions (~30 rare spawns) |
| `data/zones/events.json` | Zone event definitions and trigger rules |

## Save File Additions

```typescript
// Added to ISaveProgression
questChains: Record<string, {
  chainId: string,
  currentQuestIndex: number,
  completed: boolean
}>,
rareSpawnsDefeated: string[],  // rare monster IDs
eliteAreasUnlocked: string[],  // elite area IDs
```

## Integration Points

| System | Integration |
|--------|------------|
| Combat engine | Monster abilities add variety to combat resolution |
| Professions | Monster subtypes determine material drops |
| Reputation | Quest chains and kills feed faction reputation |
| Dungeons | Quest chains unlock/require dungeon completions |
| Loot system | Rare spawns and elite areas use enhanced loot tables |
| Offline calculator | Events averaged, quest chains progress, materials accumulate |

## Balance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Quests per zone | 6-18 (scaling with level) | More content in later zones |
| Quest chain length | 3-8 quests | Fits idle pacing while feeling narrative |
| Elite area XP multiplier | 1.5x | Worth the risk, not mandatory |
| Rare spawn frequency | 1-3% per kill | Exciting but not so rare as to be frustrating |
| Zone events per day | 3-5 total across all events | Noticeable but not constant |
| Total unique monsters | ~70 across all zones | Each zone has 5-8 unique templates |

## Complexity Assessment

| Component | Effort | Risk | Notes |
|-----------|--------|------|-------|
| Quest chains | Medium | Low | Mostly data work, reuses Phase 1 quest system |
| Elite areas | Low | Low | Zone sub-region with stat multipliers |
| Rare spawns | Low | Low | Random encounter with enhanced loot table |
| Zone events | Medium | Medium | New timer system in game loop, offline calculation |
| Monster enrichment | Medium | Low | Data-heavy but uses existing combat engine |
| Monster subtypes | Medium | Medium | New enum, touches loot system and professions |

## Future Considerations

- **Zone story arcs** that span multiple zones (e.g., tracking a villain across 3 zones)
- **Hidden zones** unlocked by completing all quest chains in a region
- **Zone achievements** for full completion (all quests, all rares, all events)
- **Seasonal zone events** that rotate monthly (Phase 4 content)
- **Zone difficulty scaling** for Ascension runs (monsters scale with Ascension count)
