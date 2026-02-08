# Phase 2 Design Brief -- Dungeons and Raids

## Overview

Dungeons and raids are the bridge between leveling content and endgame. They provide instanced, multi-encounter content that rewards better gear than open-world grinding, creating the core "gear up to do harder content" loop that defines MMORPG endgame. In an idle game, the key challenge is making these feel like meaningful events rather than just a different flavor of auto-combat.

## How Dungeons Work in an Idle Game

A dungeon is a sequence of encounters (trash packs + bosses) that the player's character auto-fights through. Unlike open-world combat, dungeons have:

- **Fixed encounter sequence** -- 3-5 bosses in order, with trash between them
- **Per-encounter success rolls** -- Each boss encounter is resolved independently
- **No respawn** -- If a boss is defeated, it stays defeated for that run
- **Run timer** -- Dungeons have a simulated clear time (10-30 minutes of game time)
- **Lockouts** -- Heroic dungeons: 1 clear per day. Normal: unlimited.

### Dungeon Run Flow

```
Player selects dungeon -> Success preview shown -> Run begins
  -> Trash Pack 1 (auto-resolve, minor loot)
  -> Boss 1 (success check, loot roll on success)
  -> Trash Pack 2
  -> Boss 2
  -> ...
  -> Final Boss (best loot table)
  -> Run complete -> Results screen -> Lockout applied
```

### Success Model (Needs Human Decision -- See Open Question #1 in index.md)

**Proposed: Per-Boss Granular Model**

Each boss has an independent success check based on the player's effective power vs the boss's difficulty rating:

```
successChance = clamp(
  (playerPower / bossPowerRequirement) * baseSuccessRate,
  minSuccessChance,
  maxSuccessChance
)
```

Where `playerPower` is derived from: average iLevel, talent build quality (does the spec match the boss type?), and consumable buffs. Values: `baseSuccessRate = 0.70`, `minSuccessChance = 0.05`, `maxSuccessChance = 0.99`.

On failure: the run ends at that boss. Player receives loot from bosses already cleared. No lockout consumed (for heroics). This rewards gear improvement -- each boss becomes a milestone.

**Alternative: Binary Model** -- Single success roll for the entire dungeon. Simpler but less interesting.

### Failed Run Rewards

- Partial loot from cleared bosses
- Partial XP (proportional to bosses cleared)
- Partial reputation gain
- No lockout consumed on failure (heroic)

## 10 Dungeon Definitions

Dungeons are distributed across level ranges, 2 per bracket starting at level 10.

| ID | Name | Level | Bosses | Theme | Clear Time |
|----|------|-------|--------|-------|-----------|
| dgn_01 | Hollow Barrow | 10-15 | 3 | Undead crypt beneath Thornwick | 10 min |
| dgn_02 | Thornwick Sewers | 15-20 | 3 | Flooded tunnels with plague rats | 10 min |
| dgn_03 | Wildwood Sanctum | 20-25 | 3 | Corrupted druid grove | 12 min |
| dgn_04 | Mistmoor Depths | 25-30 | 3 | Submerged bog temple | 12 min |
| dgn_05 | Embercrag Forge | 30-35 | 3 | Dwarven forge overrun by fire elementals | 14 min |
| dgn_06 | Skyreach Aerie | 35-40 | 3 | Wind-blasted mountain fortress | 14 min |
| dgn_07 | Ironhold Dungeons | 40-45 | 4 | Orc prison beneath the fortress | 15 min |
| dgn_08 | Blightcrypt | 45-50 | 4 | Necromancer's laboratory | 15 min |
| dgn_09 | Ashfall Caldera | 50-55 | 4 | Volcanic dragon lair | 15 min |
| dgn_10 | Spire of Twilight | 55-60 | 4 | Reality-warped construct vault | 15 min |

### Heroic Versions (Level 60)

All 10 dungeons have heroic versions:
- +1 boss per dungeon (heroic-only bonus boss)
- Monster HP and damage scaled to level 62 equivalent
- Loot: Rare to Epic, iLevel 60-70
- Daily lockout per dungeon
- Awards Justice Points on completion

### Dungeon Boss Template

Each boss needs:
- `id`, `name`, `level`, `dungeonId`
- `healthMultiplier` (relative to zone monsters of same level)
- `damageMultiplier`
- `mechanicType` -- determines how the boss challenges the player (see below)
- `lootTableId` -- references boss-specific loot table
- `enrageTimer` -- time limit before boss deals massive damage (prevents infinite attempts)

### Boss Mechanic Types

Bosses have a primary mechanic that affects the success formula. These are resolved as modifiers to the success check, not simulated in real-time:

| Mechanic | Effect | Countered By |
|----------|--------|-------------|
| `high_damage` | Reduces success if player lacks survivability | High Stamina, armor, defensive talents |
| `magic_heavy` | Spell-based damage, ignores armor | Resistance stat, magic defense talents |
| `enrage` | DPS check -- must kill before timer | Raw DPS output, offensive talents |
| `aoe_damage` | Sustained damage over time | Health regen, Spirit, HoT abilities |
| `debuff_stacking` | Applies stacking debuffs | Debuff resistance, specific class abilities |
| `phase_shift` | Boss gains immunity phases | Sustained DPS + patience (longer timer) |

## 4 Raid Definitions

Raids are level 60 content that unlock sequentially through attunement.

| ID | Name | Size | Bosses | iLevel | Attunement Requires |
|----|------|------|--------|--------|-------------------|
| raid_01 | Emberforge Depths | 10p | 8 | 71-75 | Clear 3 heroic dungeons, avg iLevel 63+ |
| raid_02 | Shadowspire Citadel | 10p | 10 | 76-80 | Clear raid_01, avg iLevel 73+, exalted with 1 faction |
| raid_03 | Temple of the Forsaken | 25p | 12 | 81-85 | Clear raid_02, avg iLevel 78+, complete attunement quest chain |
| raid_04 | The Eternal Crypt | 25p | 15 | 86-90 | Clear raid_03, avg iLevel 83+, complete attunement quest chain |

### Raid-Specific Mechanics

Raids differ from dungeons in several ways:

- **Party simulation** -- Player is part of a 5-person (10p raids) or 5-person (25p raids) group with AI companions. (See Open Question #2 in index.md for simulation depth.)
- **Weekly lockout** -- 1 clear per raid per week. Boss progress persists within the week.
- **Boss progression** -- Bosses must be defeated in order. Progress saves between sessions.
- **Bonus rolls** -- Spend Justice/Valor Points for extra loot chance per boss.
- **Tier tokens** -- Some bosses drop class-specific tier tokens redeemable for set pieces.

### Tier Set System

Each raid tier has class-specific set pieces:

| Set Threshold | Bonus Type | Example (Arcanist Pyromancy) |
|--------------|------------|------------------------------|
| 2-piece | Minor passive | +5% fire spell damage |
| 4-piece | Major passive | Flamebolt crits grant 10% haste for 6s |
| 6-piece | Build-defining | Meteor Strike cooldown reduced by 50% |

Set pieces occupy: Head, Shoulders, Chest, Hands, Legs (5 slots). Collecting 6 requires off-set pieces from the same tier, which count toward the set if the player has the right tier token.

**OPEN: Start with 2/4 bonuses in Phase 2, add 6-piece in Phase 3? See index.md question #7.**

### Attunement Quest Chains

Each raid (except the first) requires completing an attunement quest chain:

- 5-8 quests per chain
- Mix of dungeon clears, item collections, and boss kills
- Provides narrative context for the raid
- Account-wide once completed (alts skip attunement)
- Rewards: unique gear piece, gold, reputation

## New Engine Systems

### Dungeon Runner

A new engine module that manages dungeon/raid runs:

- Receives a dungeon ID and character state
- Resolves each encounter sequentially using the Phase 1 combat engine
- Applies boss mechanic modifiers to success checks
- Generates loot from boss loot tables on success
- Tracks lockout state
- Emits events: `dungeon_started`, `boss_defeated`, `boss_failed`, `dungeon_completed`
- Integrates with the game loop as a "dungeon tick" mode

### Lockout Manager

Tracks daily (heroic dungeon) and weekly (raid) lockouts:

- Persists in save file
- Resets at configured intervals (midnight daily, weekly reset)
- Exposes `canRun(contentId): boolean` and `applyLockout(contentId): void`

### Party Simulator (Raids Only)

Simulates AI party members for raid content:

- Generates party composition (1 tank, 1 healer, 3 DPS for 10p; scaling for 25p)
- AI companions contribute flat performance bonuses based on raid tier
- Player's character is the "main" -- their gear/build is the primary success factor
- Party composition bonuses: +10% if player fills a needed role, -10% if role is missing

## Loot System Integration

### Boss Loot Tables

Each boss has a dedicated loot table with:
- 2-3 guaranteed drops per kill (shared across the run, player gets 1)
- Slot-specific items (e.g., Boss 3 always drops weapons/trinkets)
- Quality floor: Normal bosses = Uncommon+, Heroic = Rare+, Raid = Epic+
- Tier tokens on specific raid bosses (every 2-3 bosses)

### Loot Table Structure

```
boss_loot_table: {
  bossId: string,
  drops: [
    { itemTemplateId, dropChance, qualityOverride?, isTokenDrop? }
  ],
  bonusRollTable: [
    { itemTemplateId, dropChance }  // available via bonus roll currency
  ]
}
```

This extends the existing `ILootTable` interface from Phase 1.

## Balance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Normal dungeon clear rate (appropriate level, quest gear) | 80-95% per boss | Should feel achievable during leveling |
| Heroic dungeon clear rate (fresh 60, iLevel 58-62) | 60-75% per boss | Gear check -- motivates farming normals first |
| Heroic dungeon clear rate (geared, iLevel 68+) | 95-99% per boss | Farm mode for daily rewards |
| Raid tier 1 clear rate (iLevel 65-70) | 50-70% per boss | Challenging, requires progression |
| Raid tier 4 clear rate (iLevel 83-88) | 40-60% per boss | Genuine end-game challenge |
| Normal dungeon clear time | 10-15 min game time | Quick content during leveling |
| Heroic dungeon clear time | 20-30 min game time | Meaningful daily activity |
| Raid clear time (full) | 45-90 min game time | Major weekly event |

## Data File Schema

Each dungeon: `data/dungeons/{dungeon_id}.json`
Each raid: `data/raids/{raid_id}.json`

Example dungeon file structure:
```json
{
  "id": "dgn_01",
  "name": "Hollow Barrow",
  "description": "...",
  "levelRange": { "min": 10, "max": 15 },
  "heroicLevel": 62,
  "normalClearTimeMs": 600000,
  "heroicClearTimeMs": 1200000,
  "unlockRequirement": { "zoneId": "zone_02", "questsCompleted": 8 },
  "bosses": [
    {
      "id": "boss_dgn01_01",
      "name": "Rotting Patriarch",
      "healthMultiplier": 5.0,
      "damageMultiplier": 2.0,
      "mechanicType": "high_damage",
      "enrageTimerMs": 180000,
      "lootTableId": "loot_boss_dgn01_01"
    }
  ],
  "trashPacks": 4,
  "trashLootChance": 0.15,
  "completionRewards": {
    "xpMultiplier": 2.0,
    "reputationFactionId": "faction_thornwick",
    "reputationAmount": 250,
    "justicePoints": 50
  }
}
```

## Future Considerations

- **Mythic+ dungeons** -- Scaling difficulty with keystones (Phase 3 or 4)
- **Raid hard modes** -- Optional boss mechanics for better loot (Phase 3)
- **Dungeon achievements** -- Speed clears, no-death, all-boss clears (Phase 3)
- **World bosses** -- Weekly spawning elite bosses in open zones (Phase 2, daily/weekly system)
