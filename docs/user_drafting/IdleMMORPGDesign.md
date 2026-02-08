# Idle MMORPG - Game Design

# Document

**Version:** 1.
**Date:** February 7, 2026
**Author:** Game Design Team
**Genre:** Offline Idle/Incremental RPG
**Target Platform:** PC/Mobile (Electron Desktop App)

## Executive Summary

Idle MMORPG is an offline idle/incremental game delivered as an Electron desktop
application that simulates the classic MMORPG experience inspired by World of Warcraft,
EverQuest 2, and RIFT. Players create characters, level through quests and grinding, and
engage in the endgame gear progression loop—all while the game continues to progress
offline. The game captures the dopamine-driven progression systems of traditional
MMORPGs while adapting them for the idle game format, allowing players to experience the
satisfaction of character growth and gear acquisition without requiring constant active
play[9][14].

## Core Game Pillars

- **Authentic MMORPG Feel** : Replicate the systems, terminology, and progression
    loops that define classic MMORPGs
- **Satisfying Idle Progression** : Ensure meaningful advancement both during active
    play and offline periods
- **Deep Character Customization** : Provide extensive build variety through classes,
    races, talents, and gear
- **Endgame Loop** : Create a compelling gear-driven progression system at max level

## Game Overview

## Concept

Players create a character from multiple race and class combinations, then level that
character from 1 to 60 through automated quest completion and monster grinding. The game
simulates MMORPG combat and progression systems, including gear acquisition, spell
learning, talent specialization, and profession development. Upon reaching level 60, players
engage in the classic MMORPG endgame loop: running dungeons and raids to acquire
progressively better gear, which enables them to tackle harder content for even more
powerful equipment[9][14].

## Target Audience


- Former or current MMORPG players seeking a nostalgic experience
- Idle game enthusiasts who enjoy deep progression systems
- Players who love character building and optimization
- Those who want MMORPG-style progression without time commitment

### Unique Selling Points

- Fully offline gameplay with robust idle progression
- Authentic MMORPG systems adapted for idle mechanics
- Multiple prestige layers (alts, account-wide bonuses)
- No energy systems or artificial waiting—pure progression
- Deep build customization with meaningful choices

## Character Creation System

### Races

Players choose from 8 distinct races, each with unique racial abilities and stat modifiers that
influence optimal class pairings.

```
Race Stat Bonuses Racial Ability
```
```
Valeborn +2 All Stats Ambition: +10% Quest XP
```
```
Stoneguard +5 STR, +5 STA Iron^ Skin:^ Reduce^ damage^
taken
```
```
Sylvani +5 INT, +5 AGI
Arcane Heritage: +5% Spell
Power
```
```
Bloodborn +7 STR, +3 STA
Savage Rage: +10%
Physical Damage
```
```
Hollowed +5 INT, +3 SPI
Undying Will: Status
immunity
```
```
Tinkersoul +7 INT, +3 SPI
Brilliant Mind: +5% Mana
Pool
```
```
Wildkin +5 AGI, +5 STA
Primal Fury: Attack speed
boost
```
```
Earthborn +7 STA, +3 STR
Titan's Vigor: +5% Health
Pool
```
Table 1: Race stat bonuses and abilities

### Classes


Nine classes provide distinct gameplay experiences, each with three specialization trees
unlocked at level 10.

```
Class Primary Stats Specializations
```
```
Blademaster STR, STA
Weapon Arts, Berserker,
Guardian
```
```
Sentinel STR, STA, SPI
Light, Defender,
Vengeance
```
```
Stalker AGI, STA
Beast Bond, Precision,
Survival
```
```
Shadow AGI, STA Venom,^ Blade^ Dance,^
Stealth
```
```
Cleric INT, SPI Order, Radiance, Void
```
```
Arcanist INT, SPI
Spellweave, Pyromancy,
Cryomancy
```
```
Summoner INT, STA
Corruption, Pact Binding,
Chaos
```
```
Channeler INT, AGI, STA
Storm Calling, Spirit
Weapon, Renewal
```
```
Shapeshifter INT, AGI, STR
Astral, Primal, Grove
Warden
```
Table 2: Class specializations

### Starting Configuration

- Players allocate 10 bonus stat points during creation
- Starting gear quality: Common (white items)
- Base stats scale with race/class combination
- Each race/class starts in a thematic zone (e.g., Stoneguard in Ironpeak Vale)

## Core Progression Systems

### Leveling (1-60)

#### Experience Sources

1. **Questing System** : Automated quest completion provides 70% of leveling XP
    - Quest types: Kill quests, collection quests, dungeon quests, elite quests
    - Quest chains unlock progressively through level ranges
    - Quest rewards: XP, gold, gear, reputation


2. **Monster Grinding** : Passive XP gain from defeating enemies
    - XP scales with monster level relative to character level
    - Zone-appropriate monsters auto-selected based on level
    - Elite and rare monsters provide XP bonuses
3. **Dungeon Runs** : Instanced content with bonus XP and guaranteed loot
    - Unlocked every 5 levels (10, 15, 20, etc.)
    - Dungeon completion grants chunk XP reward
    - Boss kills provide gear upgrade opportunities

#### Level Ranges and Zones

The game divides into six level ranges, each with 2-3 thematic zones:

```
Level Range Zone Theme Key Features
```
```
1-10 Starting Regions
Tutorial mechanics,
common gear
```
```
11-20 Wildwood & Meadows
First dungeon, uncommon
gear
```
```
21-30 Mistmoors & Caverns
Talent specialization
deepens
```
```
31-40 Skyreach Summits Rare gear drops, mounts
```
```
41-50 Blighted Wastes Elite quests, epic gear
```
```
51-60 Ascendant Territories
Attunement quests, raid
prep
```
Table 3: Leveling zones and progression

#### Offline Progression

- Game simulates up to 24 hours of offline time at full speed[17]
- Offline gains: XP, gold, gear drops, quest completions
- "Catch-up" multiplier when returning: 2-5x rewards based on offline duration[12]
- Visual summary screen shows all offline progress

### Combat System

#### Automated Combat Loop

Combat is fully automated but influenced by player build choices:

1. Character auto-attacks current target
2. Abilities fire based on priority system and resource availability


3. Damage/healing calculated using MMORPG-style formulas
4. Loot rolled upon enemy defeat
5. Next target auto-selected from available monsters

#### Stats and Attributes

Five primary stats govern character performance:

```
Stat Effects
```
```
Strength (STR) Physical damage, carry capacity
```
```
Agility (AGI) Critical chance, dodge, ranged damage
```
```
Intellect (INT) Spell power, mana pool
```
```
Spirit (SPI) Mana regen, health regen
```
```
Stamina (STA) Health pool, survivability
```
Table 4: Primary stats

Secondary stats derived from gear and talents:

- Critical Strike Chance/Damage
- Haste (attack/cast speed)
- Armor/Resistance
- Hit Rating (accuracy)
- Expertise (parry/dodge reduction)
- Spell Penetration

#### Damage and Healing Formulas

Physical Damage = (Weapon Damage + STR modifier) × (1 + Critical multiplier) × (1 - Enemy
Armor reduction)

Spell Damage = (Base Spell + INT modifier) × (1 + Critical multiplier) × (1 - Enemy
Resistance)

Healing = (Base Heal + INT modifier) × (1 + Critical multiplier)

### Gear System

#### Gear Slots

Characters equip items in 15 slots:

- Head, Shoulders, Chest, Wrists, Hands, Waist, Legs, Feet (Armor)
- Neck, Back, Ring 1, Ring 2, Trinket 1, Trinket 2 (Jewelry)
- Main Hand, Off Hand/Two-Hand (Weapons)


#### Item Quality Tiers

```
Quality Color Source
```
```
Common Gray Vendor trash, early game
```
```
Uncommon Green
Quest rewards, world drops
(1-30)
```
```
Rare Blue
Dungeon bosses, rare
spawns (20-60)
```
```
Epic Purple
Raid bosses, high-end
dungeons (60+)
```
```
Legendary Orange Ultimate^ raid^ bosses,^
prestige content
```
Table 5: Item quality tiers

#### Gear Acquisition

1. **Leveling Gear (1-59)**
    - Quest rewards provide steady upgrades every 2-3 levels
    - World drops from monsters (random chance)
    - Dungeon bosses guarantee rare-quality items
    - Crafted gear from professions fills gaps
2. **Endgame Gear (60)**
    - Heroic Dungeons: Rare and Epic gear (item level 60-70)
    - 10-Player Raids: Epic gear (item level 71-80)
    - 25-Player Raids: Epic and Legendary gear (item level 81-90)
    - Each tier requires completing previous tier for "attunement"

#### Item Level System

Item Level (iLevel) determines stat budgets:

- Each quality tier has iLevel ranges
- Higher iLevel = more total stats on item
- Stat distribution varies by slot and type
- Average iLevel determines character power

### Talent System

#### Talent Points

- Gain 1 talent point per level starting at level 10 (51 total points)


- Each specialization has 3 talent trees (25 points each tree)
- Points unlock more powerful abilities as you go deeper
- Can respec for gold cost (increases with each respec)

#### Talent Tree Structure

Each tree contains:

- Tier 1 (0 points required): Basic enhancements
- Tier 2 (5 points required): Moderate power increases
- Tier 3 (10 points required): Significant modifiers
- Tier 4 (15 points required): Build-defining passives
- Tier 5 (20 points required): Ultimate capstone talent

Example - Arcanist Pyromancy Tree:

```
Talent Effect
```
```
Searing Touch (Tier 1) Crits cause burning DoT
```
```
Enhanced Flamebolt (Tier 2) +15% Flamebolt damage
```
```
Infernal Focus (Tier 3) +5% spell crit chance
```
```
Flame Eruption (Tier 4) Consume DoTs for burst damage
```
```
Meteor Strike (Tier 5) Unlock devastating fire spell
```
Table 6: Fire Mage talent progression

### Spell and Ability System

#### Ability Acquisition

- Core abilities unlock at specific levels (e.g., Fireball at 1, Frostbolt at 4)
- Specialization abilities unlock through talent investment
- Ability ranks purchasable from class trainers using gold
- Higher ranks increase damage/healing and reduce cast time

#### Ability Types

1. **Direct Damage** : Instant damage (e.g., Flamebolt, Shadow Strike)
2. **Damage Over Time (DoT)** : Periodic damage (e.g., Plaguetouch, Rending Slash)
3. **Area of Effect (AoE)** : Multiple target damage (e.g., Frostfall, Blade Tempest)
4. **Heal Over Time (HoT)** : Periodic healing (e.g., Wildgrowth, Restoration Aura)
5. **Direct Healing** : Instant healing (e.g., Rapid Mend, Divine Touch)
6. **Buffs** : Temporary stat increases (e.g., Empowering Word, Sentinel's Blessing)


7. **Debuffs** : Enemy weakening (e.g., Hex of Weakness, Armor Breach)
8. **Crowd Control** : Disable enemies (e.g., Transfigure, Silence Strike)

#### Resource Management

Each class uses specific resources:

```
Resource Classes
```
```
Mana
Arcanist, Cleric, Summoner, Channeler,
Shapeshifter, Sentinel
```
```
Energy Shadow, Shapeshifter (Primal)
```
```
Rage Blademaster, Shapeshifter (Primal)
```
```
Soul Power Reaper (future expansion)
```
Table 7: Class resources

Resources regenerate automatically with rates modified by Spirit and other stats.

### Profession System

#### Gathering Professions

- **Mining** : Gather ore from resource nodes, used in Blacksmithing/Engineering
- **Herbalism** : Collect herbs, used in Alchemy
- **Skinning** : Harvest leather from defeated beasts, used in Leatherworking

#### Crafting Professions

- **Blacksmithing** : Craft plate armor and weapons
- **Leatherworking** : Craft leather and mail armor
- **Tailoring** : Craft cloth armor
- **Alchemy** : Create potions and elixirs for buffs
- **Enchanting** : Add permanent stat bonuses to gear
- **Engineering** : Create gadgets, bombs, and unique items

#### Profession Leveling

- Profession skill ranges from 1-
- Skill increases by crafting/gathering appropriate level items
- Higher skill unlocks better recipes
- Recipes acquired from trainers, drops, and reputation vendors
- Each character can have 2 primary professions + all secondary professions (Cooking,
    First Aid, Fishing)


## Endgame Systems

### Dungeon System

#### Dungeon Tiers

1. **Normal Dungeons (Levels 10-59)**
    - 3 bosses per dungeon
    - 10-15 minute clear time
    - Uncommon to Rare gear drops
2. **Heroic Dungeons (Level 60)**
    - Same dungeons, increased difficulty
    - 4-5 bosses
    - 20-30 minute clear time
    - Rare to Epic gear (iLevel 60-70)
    - Daily lockout system (1 clear per day per dungeon)
3. **Mythic Dungeons (Level 60, future content)**
    - Scaling difficulty tiers (Mythic +1, +2, +3, etc.)
    - Higher tiers = better gear + prestige currency

#### Dungeon Mechanics

- Auto-run dungeons with success chance based on gear/build
- Success rate displayed before starting (60-99%)
- Failed runs grant partial rewards
- Boss loot tables contain slot-specific gear
- Dungeon completion awards reputation and currencies

### Raid System

#### Raid Tiers

Level 60 raids unlock sequentially through attunement quests:

```
Raid Size Bosses Item Level
```
```
Emberforge Depths 10-player 8 bosses 71-
```
```
Shadowspire
Citadel
10-player 10 bosses 76-
```
```
Temple of the
Forsaken
25-player 12 bosses 81-
```

```
The Eternal Crypt 25-player 15 bosses 86-
```
Table 8: Raid progression tiers

#### Attunement System

- Complete quest chain to unlock each raid
- Requirements: Clear previous raid, achieve minimum average iLevel, complete
    specific dungeons
- Attunement is account-wide (benefits alt characters)

#### Raid Mechanics

- Raids simulate 5-player "guild groups" with AI companions
- Each boss has unique mechanics affecting strategy
- Players optimize their character for group composition bonuses
- Weekly lockout: 1 clear per raid per week
- Bonus rolls available using currency for extra loot chances

#### Boss Loot Tables

Each boss drops 2-3 items from a loot table:

- Armor tokens (redeemable for class-specific pieces)
- Weapons with unique effects
- Trinkets with powerful proc effects
- Tier set pieces (wearing 2/4/6 pieces grants set bonuses)

### Reputation System

#### Factions

10+ factions provide progressive rewards:

\begin{table}

```
Reputation Level Benefits
```
```
Neutral (0) No benefits
```
```
Friendly (3,000) Access to faction vendor
```
```
Honored (9,000) Uncommon items, recipes
```
```
Revered (21,000) Rare items, enchants
```
```
Exalted (42,000) Epic items, mounts, titles
```

\end table>

#### Reputation Sources

- Quest completion in faction zones
- Dungeon and raid boss kills
- Daily quests (unlock at level 60)
- Reputation tokens from monster drops
- Wearing faction tabards in dungeons

### Daily and Weekly Systems

#### Daily Quests

- Unlock at level 60
- 10 daily quests available per day
- Rewards: Gold, reputation, Justice Points currency
- Reset at midnight server time

#### Weekly Activities

- Raid lockouts reset weekly
- Weekly quest for bonus Valor Points
- World boss spawns (guaranteed Epic loot)
- PvP season rewards (future system)

### Currency Systems

#### Gold

- Primary currency earned from quests, monster kills, vendor sales
- Used for: Ability training, gear repairs, consumables, profession recipes, mounts
- Scales from copper/silver (early) to gold (endgame)

#### Justice Points

- Earned from: Daily quests, heroic dungeon completion, raid participation
- Used for: Purchasing Rare and Epic gear from vendors
- Alternative to RNG loot drops
- Cap: 4,000 points

#### Valor Points

- Earned from: Weekly quests, raid bosses, high-tier content


- Used for: Best-in-slot Epic gear
- Weekly cap: 1,000 points (encourages consistent play)

#### Honor Points (future PvP system)

- Earned from PvP activities
- Used for PvP-specific gear with resilience stat

## Prestige and Meta-Progression

### Ascension System (Primary Prestige)

#### Overview

After reaching level 60 and clearing The Eternal Crypt raid, players can "Ascend" their
character, gaining permanent account-wide bonuses.

#### Ascension Benefits

Each Ascension grants:

- +2% XP gain (account-wide)
- +1% gold gain (account-wide)
- +1% gear drop chance (account-wide)
- 1 Ascension Point for Paragon talent tree
- Prestige cosmetic rewards (titles, transmog appearances)

#### Post-Ascension

Character resets to level 1 but retains:

- All unlocked races and classes
- Profession knowledge (recipes remain learned)
- Achievement progress
- Mount and pet collections
- Transmog (appearance) collection

### Paragon System

#### Paragon Talents

Ascension Points spent in account-wide Paragon talent trees:

1. **Power Tree** : Increase damage and healing (up to +50%)
2. **Resilience Tree** : Increase health and survivability (up to +50%)


3. **Fortune Tree** : Increase loot quality and gold drops (up to +30%)
4. **Swiftness Tree** : Increase leveling speed and quest completion (up to +40%)
5. **Mastery Tree** : Unlock special abilities and convenience features

Each tree contains 50 talent nodes requiring 250 total Ascensions to max.

### Alt Character System

#### Benefits of Alt Characters

- Experience different class/race combinations
- All alts benefit from account-wide Paragon bonuses
- Shared gold and currency pools
- Profession synergies (alts can have different profession pairs)
- Achievement hunting across multiple characters

#### Alt Advantages

- Reduced leveling time due to Paragon bonuses
- Account-wide reputation gains at 50% rate
- Heirloom gear system (bind-on-account items that scale with level)

### Achievement System

#### Achievement Categories

- Leveling: Reach specific levels, complete zone quests
- Dungeon: Complete all dungeons, speed clears, no-death runs
- Raid: Boss kills, tier completions, hard mode clears
- Professions: Reach max skill, craft specific items
- Collections: Mounts, pets, transmog appearances
- Exploration: Discover all zones, find hidden areas
- Combat: Kill milestones, critical hit records
- Wealth: Accumulate gold, spend thresholds

#### Achievement Rewards

- Achievement Points for leaderboard ranking
- Titles displayed with character name
- Unique mounts and pets
- Cosmetic rewards (transmog gear, effects)
- Paragon bonus points for major achievement milestones


## Idle Mechanics Design

### Automation Philosophy

The game balances active engagement with idle automation:

- **Always Progressing** : Combat, questing, and gathering happen automatically
- **Meaningful Choices** : Players make strategic decisions about build, gear, and
    content
- **Check-in Rewards** : Returning to game provides satisfying progress summary
- **No Artificial Gates** : No energy systems or forced wait timers

### Active vs Idle Gameplay Loop

#### Active Play Session (15-30 minutes)

1. Review offline progress and loot acquired
2. Equip gear upgrades (auto-equip option available)
3. Allocate stat/talent points from level-ups
4. Select next quest chain or content tier
5. Adjust build for upcoming challenges
6. Spend currencies at vendors
7. Craft items using gathered materials
8. Initiate dungeon/raid runs

#### Idle/Offline Progression

- Combat continues automatically
- Quest objectives completed based on average clear time
- Loot accumulated in inventory (auto-sold if full)
- Profession gathering occurs passively
- Resources regenerate for next active session
- Up to 24 hours of progress calculated on return[17]

### Progression Pacing

#### Early Game (Levels 1-30)

- Rapid leveling: 1-2 levels per hour
- Frequent gear upgrades every 2-3 levels
- New abilities unlock regularly
- Simple combat rotation


- Focus on learning systems

#### Mid Game (Levels 31-59)

- Moderate leveling: 1 level per 1-2 hours
- Gear upgrades every 4-5 levels
- Talent specialization deepens
- Combat complexity increases
- Dungeons become primary progression

#### Endgame (Level 60)

- Focus shifts to gear item level
- Daily/weekly content structure
- Long-term goals (raid progression, reputations)
- Multiple concurrent objectives
- Preparation for Ascension

The pacing follows idle game best practices with accelerating early progress and increasingly
long-term goals as players invest more time[9][14][20].

### Balancing Offline Gains

To prevent exploitation while maintaining satisfying returns:

- **Diminishing Returns** : Offline efficiency reduces after 12 hours (100% → 75% →
    50%)
- **Activity Caps** : Dungeon/raid completions limited even offline (max 1 heroic
    dungeon, no raid progress)
- **Gear Quality Limits** : Offline play caps at Rare quality drops; Epic+ requires active
    boss kills
- **Resource Caps** : Inventory space limits gathering; full bags = excess sold for gold
- **Comeback Mechanics** : Longer offline periods grant temporary XP/loot bonuses on
    return[12]

## UI/UX Design

### Main Screen Layout

\begin{itemize}
\item **Character Panel** : Avatar display, health/mana bars, level progress, buffs/debuffs
\item **Combat Log** : Scrolling text showing actions, damage, loot drops
\item **Quest Tracker** : Current quest objectives and progress
\item **Quick Stats** : DPS meter, time to next level, gold earned per hour
\item **Navigation Tabs** : Character, Inventory, Talents, Professions, Social, Achievements
\end{itemize>


### Character Screen

Displays comprehensive character information:

- Full stat breakdown with tooltips
- Gear slots with equipped items
- Talent tree visualization
- Active buffs and cooldowns
- Combat statistics (DPS, healing, damage taken)

### Inventory Management

- Grid-based inventory (bag slots)
- Auto-sort by quality/type
- Quick-sell vendor trash
- Gear comparison tooltips (green/red stat changes)
- Transmog collection tab

### Quest Journal

- Active quests with progress bars
- Available quests in current zone
- Completed quest history
- Quest chain visualization
- Rewards preview

### Dungeon/Raid Browser

- List of available instances
- Lockout status indicators
- Success rate prediction
- Loot table preview
- Queue for auto-run or manual start

### Accessibility Features

- **Auto-Equip** : Automatically equip better gear based on stat priorities
- **Recommended Builds** : Pre-made talent specs for each class
- **Smart Progression** : Game suggests next content tier based on gear level
- **Tooltips** : Comprehensive explanations for all systems
- **Colorblind Modes** : Alternative color schemes for item quality


## Technical Considerations

### Electron Desktop Application

The game is built as an Electron desktop application, providing several key
advantages[35][38][41]:

\begin{itemize}
\item **Cross-Platform** : Single codebase deploys to Windows, macOS, and Linux
\item **Web Technologies** : Built with HTML5, JavaScript/TypeScript, and CSS for rapid
development
\item **Native Integration** : Access to file system, system tray, and desktop notifications
\item **Auto-Updates** : Built-in update system for seamless patches and content delivery
\end{itemize>

#### Electron Architecture Benefits

- Leverages Chromium rendering engine for consistent UI across platforms[42]
- Node.js backend enables efficient file I/O and save management
- Multi-process architecture separates game logic from rendering[48]
- WebGL support for 2D sprite rendering and visual effects
- Hardware acceleration for smooth animations and transitions

#### Performance Optimization for Electron[42][48]

- Worker threads for heavy computation (combat calculations, loot generation)
- Avoid blocking main process—offload to renderer or background processes
- Stream-based file reading for large save files to prevent memory bloat
- Lazy loading for asset collections (transmog library, achievement database)
- Native modules (optional) for performance-critical systems like checksum verification
- Minimize synchronous IPC calls between main and renderer processes

### Save System

- Auto-save every 5 minutes using Node.js file system
- Local save files stored in user data directory (platform-agnostic)
- Optional cloud save via Steam Cloud or custom backend
- Manual save/export for backups (JSON format)
- Save file includes: Character data, progress flags, inventory, achievements, Paragon
    progress
- Compression for large save files (gzip or similar)

### Platform Targets

- **Primary** : PC Desktop (Windows, macOS, Linux via Electron)


- **Future Consideration** : Mobile port using Cordova/Capacitor (requires UI
    redesign)
- **Future Consideration** : Web version (limited features, browser constraints)

## Development Roadmap

### Phase 1: Core Systems (Months 1-4)

- Electron application scaffolding and build pipeline setup
- Character creation and race/class implementation
- Basic combat system and stat calculations
- Leveling 1-60 with quest system
- Gear system and inventory
- Talent trees (basic implementation)
- Local save system with auto-save functionality

### Phase 2: Content and Progression (Months 5-8)

- 6 leveling zones with quest chains
- 10 dungeons (2 per level range)
- 4 raids for endgame
- Profession system implementation
- Reputation factions and vendors

### Phase 3: Meta-Progression (Months 9-10)

- Ascension system
- Paragon talent trees
- Achievement system
- Collections (mounts, pets, transmog)
- Alt character systems

### Phase 4: Polish and Balance (Months 11-12)

- UI/UX refinement
- Balance tuning (leveling speed, drop rates, scaling)
- Tutorial and onboarding flow
- Electron performance optimization and memory profiling
- Code signing and installer creation for all platforms
- Beta testing and feedback iteration
-


## Research Analysis

### Existing Games in Space

```
Game Strengths Weaknesses
```
```
AdVenture Quest Deep RPG systems Pay-to-win mechanics
```
```
Idle Champions D&D license appeal Complex, overwhelming
```
```
Melvor Idle RuneScape nostalgia Less MMORPG feel
```
```
NGU Idle Extensive progression Abstract theme
```
Table 9: Competitive landscape

### Our Differentiation

- Most authentic MMORPG simulation in idle format
- Focus on WoW-era nostalgia and terminology
- No pay-to-win or energy systems
- Offline-first design philosophy
- Deep but accessible systems

## Risks and Mitigation

### Design Risks

\begin{table}

```
Risk Mitigation Strategy
```
```
Too complex for idle audience Gradual system introduction, tutorials
```
```
Too simple for MMORPG fans Deep build customization, endgame depth
```
```
Progression too slow/fast Extensive playtesting, tunable variables
```
```
Lack of social elements Achievement sharing, leaderboards
```
\end{table>

### Technical Risks

- **Save corruption** : Multiple backup systems, cloud sync verification
- **Balance exploits** : Server-side validation for offline gains (if online features added)
- **Performance on mobile** : Scalable graphics settings, optimization passes


- **Cross-platform sync** : Robust cloud save architecture from day one

## Conclusion

Idle MMORPG combines the depth and satisfaction of classic MMORPGs with the
accessibility and convenience of idle games. By faithfully replicating beloved MMORPG
systems—races, classes, talents, gear progression, dungeons, and raids—while adapting them
for automated gameplay, the game delivers a unique experience that appeals to both
nostalgia-driven MMORPG veterans and idle game enthusiasts seeking deeper progression
systems.

The core gameplay loop of leveling, gearing, and tackling increasingly difficult content
translates naturally to the idle format, while the Ascension prestige system provides virtually
unlimited replayability. With careful attention to pacing, meaningful player choices, and
satisfying offline progression, Idle MMORPG has the potential to define a new subgenre: the
offline MMORPG simulator.

## Appendices

### Appendix A: Sample Combat Calculations

**Example: Level 60 Pyromancy Arcanist vs Raid Boss**

Character Stats:

```
● Intellect: 500 (from gear and talents)
● Spell Power: 850
● Critical Strike Chance: 25%
```
```
● Haste: 15%
```
Flamebolt Cast:

```
● Base Damage: 800-
● INT Modifier: +500 damage
```
```
● Spell Power Modifier: +850 damage
● Total Non-Crit: 2150-2250 damage
● Critical Hit (25% chance): 3225-3375 damage
● Cast Time: 2.5s reduced by 15% haste = 2.125s
● DPS: ~1035 average
```
### Appendix B: Sample Talent Build

**Pyromancy Arcanist - Maximum Damage Spec (51 points)**

Pyromancy Tree (31 points):

```
● Searing Touch 5/5: Crits cause 40% of damage as DoT
```

```
● Enhanced Flamebolt 5/5: +15% Flamebolt damage
● Immolation 2/2: +10% Fire spell crit damage
● Infernal Focus 3/3: +6% spell crit chance
● Flame Eruption 1/1: Consume DoTs for burst
● Meteor Strike 1/1: Unlock Meteor Strike spell
```
Spellweave Tree (20 points):

```
● Arcane Veil 2/2: -10% threat, +2% spell hit
● Spell Accuracy 5/5: +10% spell hit chance
● Mana Resonance 5/5: 10% chance for free spell
● Expanded Reserves 5/5: +10% mana pool
● Temporal Burst 1/1: Instant cast ultimate
```
This build maximizes fire damage and critical strikes while taking essential hit chance and
mana efficiency from Spellweave.

### Appendix C: Progression Checklist

**Player Journey from 1-60 to Ascension:**

1. Create character, choose race/class
2. Complete starting region (levels 1-10)
3. Unlock talent specialization at 10
4. Progress through leveling zones (11-59)
5. Complete 8-10 dungeons during leveling
6. Reach level 60, equip quest/dungeon gear
7. Run Heroic Dungeons for rare/epic gear (iLevel 60-70)
8. Complete attunement quest chain for raids
9. Clear Emberforge Depths raid (iLevel 71-75)
10. Clear Shadowspire Citadel raid (iLevel 76-80)
11. Gear up for 25-player content
12. Clear Temple of the Forsaken (iLevel 81-85)
13. Clear The Eternal Crypt (iLevel 86-90)
14. Achieve average iLevel 90+ across all slots
15. Perform Ascension ritual
16. Allocate Paragon point in account-wide tree
17. Start new character or same class with bonuses

Total estimated time: 25-40 hours to first Ascension depending on Paragon bonuses.

## References


[1] Best Idle Game in 2026: What to Play for Endless Progression. (2026, January 2). Clicker
Heroes Blog. https://blog.clickerheroes.com/best-idle-game-2025/

[2] Incremental game. (2014, June 16). Wikipedia.
https://en.wikipedia.org/wiki/Incremental_game

[3] From Taps to Tactics: 6 Core Systems That Make or Break Idle Games. (2025, April 16).
Subtle Jungle. https://subtlezungle.substack.com/p/6-core-systems-that-make-or-break

[4] Incremental Auto-Battle RPG With Layers Of Progression Systems! - Nomad Idle [Demo].
(2025, February 14). Wanderbots. https://www.youtube.com/watch?v=MM6YZdr22lU

[5] Mechanics of Incremental Games 6 - Scaling and Exponents. Reddit
r/incremental_games.
https://www.reddit.com/r/incremental_games/comments/1ydowj/mechanics_of_incremen
tal_games_6_scaling_and/

[6] How to design idle games. (2024, July 2). Machinations.
https://machinations.io/articles/idle-games-and-how-to-design-them

[7] How did others design their offline progression system for their idle game? Reddit
r/incremental_games.
https://www.reddit.com/r/incremental_games/comments/ap0wlq/how_did_others_design
_their_offline_progression/

[8] Idle game design and monetization. (2024, April 21). The Mind Studios.
https://games.themindstudios.com/post/idle-clicker-game-design-and-monetization/

[9] Idle Game Design Principles. (2025, June 17). Eric's Substack.
https://ericguan.substack.com/p/idle-game-design-principles


