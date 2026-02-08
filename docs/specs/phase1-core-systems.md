# Phase 1 Feature Specification: Core Systems

**Document ID:** SPEC-P1-001
**Version:** 1.0.0
**Author:** @idle-mmo-gpm
**Status:** Draft
**Phase:** 1 of 4 (Months 1-4)
**Last Updated:** 2026-02-08
**Assigned To:** @idle-mmo-gdev (engine/data), @idle-mmo-frontend-dev (renderer), @idle-mmo-ui-designer (wireframes)

---

## Table of Contents

1. [Phase 1 Scope Definition](#1-phase-1-scope-definition)
2. [Character Creation System](#2-character-creation-system)
3. [Core Stat System](#3-core-stat-system)
4. [Combat Engine](#4-combat-engine)
5. [Leveling and XP System](#5-leveling-and-xp-system)
6. [Gear System](#6-gear-system)
7. [Talent System](#7-talent-system)
8. [Save and Load System](#8-save-and-load-system)
9. [Offline Progression](#9-offline-progression)
10. [Electron Application Shell](#10-electron-application-shell)
11. [Data Schemas](#11-data-schemas)
12. [Acceptance Criteria](#12-acceptance-criteria)

---

## 1. Phase 1 Scope Definition

### 1.1 Overview

Phase 1 delivers the foundational game loop: a player can create a character, watch it fight monsters automatically, gain XP, level from 1 to 60, equip gear, allocate talent points, save progress, and accumulate offline gains. By the end of Phase 1, a player should be able to sit down, create a character, and experience the core idle MMORPG progression loop end-to-end.

### 1.2 What Gets Built

| System | Scope |
|--------|-------|
| Electron Shell | Window management, IPC scaffolding, Worker Thread architecture, auto-save timer |
| Character Creation | Full race/class selection (8 races, 9 classes), name entry, stat preview, starting gear assignment |
| Stat System | All 5 primary stats, all 6 secondary stats, derived stat calculations, race/class/gear modifiers |
| Combat Engine | Auto-combat loop with ability priority system, damage/healing formulas, resource (mana/energy/rage) management, monster definitions for zones 1-60, combat log |
| Leveling/XP | XP curve for 1-60, quest simulation engine (auto-accept/auto-complete), zone progression, monster grinding XP |
| Gear System | Item generation from loot tables, 15 equipment slots, 5 quality tiers, iLevel 1-60 (leveling range), equip/unequip, stat budget calculations, basic inventory (28-slot bag) |
| Talent System | 3 talent trees per class (27 total specs), 51 talent points, tier gating, point allocation/respec |
| Save/Load | JSON save format with gzip, auto-save every 60 seconds, manual save, save slot management (3 slots), data integrity validation |
| Offline Progression | Time-based simulation for up to 24h, diminishing returns curve, offline loot/XP/gold accumulation, return summary screen |
| Gold Economy (basic) | Gold drops from monsters, gold from quest completions, gold cost for respec, gold cost for training abilities |

### 1.3 What Does NOT Get Built in Phase 1

| System | Deferred To |
|--------|-------------|
| Zone-specific content (named quests, storylines, unique NPCs) | Phase 2 |
| Dungeons and Raids | Phase 2 |
| Professions | Phase 2 |
| Reputation system | Phase 2 |
| Justice Points / Valor Points | Phase 2 |
| Heroic/Mythic difficulty | Phase 2 |
| Ascension / Paragon | Phase 3 |
| Achievements / Collections | Phase 3 |
| Alt system / Heirlooms | Phase 3 |
| Tutorial / New player flow | Phase 4 |
| UI polish / Animations | Phase 4 |
| Auto-updater | Phase 4 |

### 1.4 Phase 1 Deliverable Milestones

| Milestone | Target | Description |
|-----------|--------|-------------|
| M1.1 | Month 1, Week 2 | Electron shell boots, Worker Thread communicates with renderer, IPC channels defined |
| M1.2 | Month 1, Week 4 | Character creation flow complete, character saved to disk |
| M1.3 | Month 2, Week 2 | Combat engine running in Worker Thread, monsters die, XP gained, combat log visible |
| M1.4 | Month 2, Week 4 | Leveling 1-60 functional, zone auto-progression, quest simulation loop |
| M1.5 | Month 3, Week 2 | Gear system: items drop, equip/unequip, stats recalculate, inventory works |
| M1.6 | Month 3, Week 4 | Talent trees rendered, points allocatable, talents affect combat |
| M1.7 | Month 4, Week 2 | Offline progression calculates on return, summary screen displays gains |
| M1.8 | Month 4, Week 4 | Full Phase 1 integration pass, save/load robust, edge cases handled |

### 1.5 Success Criteria for Phase 1 Completion

A player must be able to:
1. Launch the app and create a character (choosing race, class, name)
2. Watch their character auto-combat monsters appropriate to their level
3. Gain XP and level up automatically from 1 to 60
4. Receive gear drops and have them auto-equip if they are upgrades (or manually equip from inventory)
5. Allocate talent points as they become available (starting at level 10)
6. Close the app, reopen hours later, and see an offline progress summary
7. Save and load across 3 save slots without data loss

---

## 2. Character Creation System

### 2.1 Overview

Character creation is the player's first interaction with the game. It must feel like a classic MMORPG character creator -- race selection with visible stat impacts, class selection with role descriptions, and a name input. The flow should take 1-3 minutes for a first-time player, with enough information to make an informed choice without being overwhelming.

**Player Motivation:** Identity, Fantasy Fulfillment, Anticipation of Power

### 2.2 Creation Flow

```
[New Character] -> [Race Selection] -> [Class Selection] -> [Name Entry] -> [Confirmation] -> [Enter Game]
```

Each step shows a live preview of the character's starting stats, adjusting as selections change.

### 2.3 Race Definitions

All 8 races with their exact stat bonuses and racial abilities:

```typescript
enum Race {
  Valeborn = "valeborn",
  Stoneguard = "stoneguard",
  Sylvani = "sylvani",
  Bloodborn = "bloodborn",
  Hollowed = "hollowed",
  Tinkersoul = "tinkersoul",
  Wildkin = "wildkin",
  Earthborn = "earthborn",
}

interface RaceDefinition {
  id: Race;
  name: string;
  description: string;            // 2-3 sentence lore blurb
  statBonuses: PrimaryStatBlock;   // Additive bonuses to base stats
  racialAbility: RacialAbility;    // Passive or triggered racial
  recommendedClasses: ClassId[];   // UI hint, not restriction
  armorAffinity: ArmorType;        // Flavor only in Phase 1
}
```

| Race | STR | AGI | INT | SPI | STA | Racial Ability | Description |
|------|-----|-----|-----|-----|-----|---------------|-------------|
| Valeborn | +2 | +2 | +2 | +2 | +2 | Versatile Learner: +10% Quest XP | Balanced, good for any class. Lore: Adaptable descendants of wandering explorers. |
| Stoneguard | +5 | +0 | +0 | +0 | +5 | Iron Skin: +5% Armor value | Tanky melee. Lore: Mountain-dwelling warriors carved from living stone. |
| Sylvani | +0 | +5 | +5 | +0 | +0 | Arcane Affinity: +5% Spell Power | Caster/agility hybrid. Lore: Forest-born scholars attuned to ley lines. |
| Bloodborn | +7 | +0 | +0 | +0 | +3 | Blood Fury: +10% Physical Damage | Aggressive melee. Lore: War-bred berserkers with crimson veins. |
| Hollowed | +0 | +0 | +5 | +3 | +0 | Spectral Ward: Immune to Fear/Charm effects | Caster with CC immunity. Lore: Undead spirits bound by ancient pacts. |
| Tinkersoul | +0 | +0 | +7 | +3 | +0 | Mana Capacitor: +5% Maximum Mana | Pure caster. Lore: Gnome-like inventors powered by arcane batteries. |
| Wildkin | +0 | +5 | +0 | +0 | +5 | Feral Instinct: +3% Attack Speed | Agility/survivability. Lore: Beast-touched nomads from untamed wilds. |
| Earthborn | +3 | +0 | +0 | +0 | +7 | Living Fortitude: +5% Maximum HP | Tanks/survivability. Lore: Stone-skinned giants from the deep earth. |

### 2.4 Class Definitions

All 9 classes with their primary stats, roles, specialization trees, and armor/weapon proficiencies.

```typescript
enum ClassId {
  Blademaster = "blademaster",
  Sentinel = "sentinel",
  Stalker = "stalker",
  Shadow = "shadow",
  Cleric = "cleric",
  Arcanist = "arcanist",
  Summoner = "summoner",
  Channeler = "channeler",
  Shapeshifter = "shapeshifter",
}

enum Role {
  Tank = "tank",
  MeleeDPS = "melee_dps",
  RangedDPS = "ranged_dps",
  Healer = "healer",
}

enum ResourceType {
  Mana = "mana",
  Energy = "energy",
  Rage = "rage",
}

interface ClassDefinition {
  id: ClassId;
  name: string;
  description: string;
  primaryStats: StatId[];         // Which stats the class scales from (ordered by priority)
  roles: Role[];                  // Available roles (depends on spec)
  resourceType: ResourceType;
  armorType: ArmorType;           // Cloth, Leather, Mail, Plate
  weaponTypes: WeaponType[];      // Allowed weapon types
  specs: [SpecDefinition, SpecDefinition, SpecDefinition];
  baseAbilities: AbilityId[];     // Abilities known at level 1
}
```

| Class | Primary Stats | Resource | Armor | Roles | Spec 1 | Spec 2 | Spec 3 |
|-------|--------------|----------|-------|-------|--------|--------|--------|
| Blademaster | STR, STA | Rage | Plate | Tank, Melee DPS | Weapon Arts (DPS) | Berserker (DPS) | Guardian (Tank) |
| Sentinel | STR, STA, SPI | Mana | Plate | Tank, Melee DPS, Healer | Light (Healer) | Defender (Tank) | Vengeance (DPS) |
| Stalker | AGI, STA | Mana | Mail | Ranged DPS, Melee DPS | Beast Bond (Ranged) | Precision (Ranged) | Survival (Melee) |
| Shadow | AGI, STA | Energy | Leather | Melee DPS | Venom (DoT DPS) | Blade Dance (Burst DPS) | Stealth (Burst DPS) |
| Cleric | INT, SPI | Mana | Cloth | Healer, Ranged DPS | Order (Healer) | Radiance (DPS) | Void (DPS) |
| Arcanist | INT, SPI | Mana | Cloth | Ranged DPS | Spellweave (Arcane DPS) | Pyromancy (Fire DPS) | Cryomancy (Frost DPS) |
| Summoner | INT, STA | Mana | Cloth | Ranged DPS | Corruption (DoT DPS) | Pact Binding (Pet DPS) | Chaos (Burst DPS) |
| Channeler | INT, AGI, STA | Mana | Mail | Ranged DPS, Healer, Melee DPS | Storm Calling (Ranged DPS) | Spirit Weapon (Melee DPS) | Renewal (Healer) |
| Shapeshifter | INT, AGI, STR | Mana | Leather | Tank, Melee DPS, Healer | Astral (Ranged DPS) | Primal (Tank/Melee DPS) | Grove Warden (Healer) |

### 2.5 Starting Stats

Every character begins with a base stat block determined by class, then modified by race:

```typescript
// Final starting stats = classBaseStats + raceBonuses
// All characters start at level 1

interface BaseStats {
  strength: number;
  agility: number;
  intellect: number;
  spirit: number;
  stamina: number;
}
```

**Class Base Stats at Level 1:**

| Class | STR | AGI | INT | SPI | STA | Base HP | Base Mana/Energy/Rage |
|-------|-----|-----|-----|-----|-----|---------|----------------------|
| Blademaster | 25 | 15 | 8 | 10 | 22 | 120 | 100 (Rage, starts at 0) |
| Sentinel | 22 | 12 | 14 | 16 | 20 | 110 | 200 (Mana) |
| Stalker | 12 | 24 | 14 | 12 | 18 | 100 | 200 (Mana) |
| Shadow | 12 | 26 | 8 | 10 | 16 | 90 | 100 (Energy) |
| Cleric | 8 | 10 | 24 | 22 | 14 | 80 | 300 (Mana) |
| Arcanist | 6 | 10 | 28 | 18 | 12 | 70 | 350 (Mana) |
| Summoner | 8 | 10 | 26 | 16 | 16 | 80 | 320 (Mana) |
| Channeler | 14 | 16 | 22 | 14 | 18 | 100 | 280 (Mana) |
| Shapeshifter | 16 | 18 | 20 | 14 | 18 | 100 | 260 (Mana) |

**Example:** A Bloodborn Blademaster starts with STR 25+7=32, AGI 15+0=15, INT 8+0=8, SPI 10+0=10, STA 22+3=25.

### 2.6 Starting Equipment

Each class receives a starter weapon and armor set (all Common quality, iLevel 1):

| Class | Weapon | Armor Set |
|-------|--------|-----------|
| Blademaster | Worn Greatsword (2H Sword) | Battered Plate (Head, Chest, Legs, Boots, Gloves) |
| Sentinel | Worn Mace + Worn Shield (1H + Shield) | Battered Plate (Head, Chest, Legs, Boots, Gloves) |
| Stalker | Worn Longbow (Ranged) | Worn Mail (Head, Chest, Legs, Boots, Gloves) |
| Shadow | 2x Worn Daggers (Dual Wield) | Worn Leather (Head, Chest, Legs, Boots, Gloves) |
| Cleric | Worn Staff (2H Staff) | Threadbare Cloth (Head, Chest, Legs, Boots, Gloves) |
| Arcanist | Worn Staff (2H Staff) | Threadbare Cloth (Head, Chest, Legs, Boots, Gloves) |
| Summoner | Worn Wand + Worn Tome (1H + Off-hand) | Threadbare Cloth (Head, Chest, Legs, Boots, Gloves) |
| Channeler | Worn Mace + Worn Totem (1H + Off-hand) | Worn Mail (Head, Chest, Legs, Boots, Gloves) |
| Shapeshifter | Worn Staff (2H Staff) | Worn Leather (Head, Chest, Legs, Boots, Gloves) |

All starting gear provides minimal stats (+1 to primary stat, +1 STA per piece). Total starting gear contribution: approximately +5 primary stat, +5 STA.

### 2.7 Character Name Validation

```typescript
interface NameValidation {
  minLength: 2;
  maxLength: 16;
  allowedPattern: /^[A-Za-z][A-Za-z'-]*$/;  // Letters, hyphens, apostrophes. Must start with letter.
  reservedNames: string[];                    // List of blocked names (profanity, system terms)
  trimWhitespace: true;
  capitalizeFirst: true;                      // Auto-capitalize first letter
}
```

### 2.8 Edge Cases

- **No class restriction by race:** All race/class combinations are valid. The `recommendedClasses` field is advisory only.
- **Duplicate names:** Allowed in Phase 1 (single-player). Each character has a unique internal UUID.
- **Empty name:** Rejected. UI disables confirmation button until a valid name is entered.
- **Back navigation:** Player can go back to any previous step. Selections are preserved until changed.
- **Save slot full:** If all 3 save slots are occupied, the player must delete one before creating a new character.

---

## 3. Core Stat System

### 3.1 Overview

The stat system is the backbone of all combat, gear, and talent calculations. Every stat must be precisely defined so that gear upgrades, talent effects, and level-up gains produce predictable and testable outcomes.

### 3.2 Primary Stats

Primary stats increase by a fixed amount per level (class-dependent growth rate) and are augmented by gear and talents.

```typescript
interface PrimaryStats {
  strength: number;    // Physical damage, carry capacity
  agility: number;     // Crit chance, dodge, ranged damage
  intellect: number;   // Spell power, mana pool
  spirit: number;      // Mana/HP regen rates
  stamina: number;     // Health pool
}
```

**Per-Level Growth (added each level from 2-60):**

| Class | STR/lvl | AGI/lvl | INT/lvl | SPI/lvl | STA/lvl |
|-------|---------|---------|---------|---------|---------|
| Blademaster | 2.5 | 1.0 | 0.3 | 0.5 | 2.0 |
| Sentinel | 2.0 | 0.8 | 1.0 | 1.2 | 1.8 |
| Stalker | 0.8 | 2.5 | 1.0 | 0.8 | 1.5 |
| Shadow | 0.8 | 2.8 | 0.3 | 0.5 | 1.2 |
| Cleric | 0.3 | 0.5 | 2.2 | 2.0 | 1.0 |
| Arcanist | 0.2 | 0.5 | 2.8 | 1.5 | 0.8 |
| Summoner | 0.3 | 0.5 | 2.5 | 1.2 | 1.2 |
| Channeler | 1.0 | 1.2 | 2.0 | 1.0 | 1.5 |
| Shapeshifter | 1.2 | 1.5 | 1.8 | 1.0 | 1.5 |

**Formula:**
```
stat(level) = classBaseStat + racialBonus + (perLevelGrowth * (level - 1)) + gearBonus + talentBonus
```

**Example:** Level 30 Bloodborn Blademaster STR = 25 + 7 + (2.5 * 29) + gearSTR + talentSTR = 32 + 72.5 + gear + talents = 104.5 (floor to 104) + gear + talents.

**Important:** All stat values are floored to integers for display, but internal calculations use full precision (floating point).

### 3.3 Secondary/Derived Stats

Secondary stats are computed from primary stats and gear bonuses. They are never directly leveled.

```typescript
interface SecondaryStats {
  attackPower: number;       // Scales physical ability damage
  spellPower: number;        // Scales spell ability damage
  criticalStrike: number;    // Percentage chance for 150% damage (base)
  haste: number;             // Percentage reduction to combat tick interval
  armor: number;             // Physical damage reduction
  resistance: number;        // Spell damage reduction
  hitRating: number;         // Reduces miss chance against higher-level targets
  expertise: number;         // Reduces dodge/parry chance of target
  spellPenetration: number;  // Reduces target resistance
  dodge: number;             // Percentage chance to avoid physical attack entirely
  parry: number;             // Percentage chance to deflect (tanks only, reduces damage by 50%)
  maxHealth: number;         // Total health pool
  maxMana: number;           // Total mana pool (if applicable)
  healthRegen: number;       // HP per combat tick while idle (out of combat: 5x)
  manaRegen: number;         // Mana per combat tick (out of combat: 3x)
}
```

**Derivation Formulas:**

```
attackPower       = (strength * 2) + (agility * 1) + gearAttackPower
spellPower        = (intellect * 1.5) + gearSpellPower
criticalStrike %  = 5.0 + (agility / 52.0) + gearCritRating / 14.0
haste %           = gearHasteRating / 15.7
armor             = gearArmor + (agility * 2) + (stamina * 0.5)
resistance        = gearResistance + (intellect * 0.5)
hitRating %       = gearHitRating / 15.8
expertise %       = gearExpertise / 15.8
spellPenetration  = gearSpellPen
dodge %           = 3.0 + (agility / 60.0) + gearDodgeRating / 18.9
parry %           = 3.0 + gearParryRating / 22.1   (only for Plate-wearing classes in defensive spec)
maxHealth         = (stamina * 10) + classBaseHP + gearHealth
maxMana           = (intellect * 8) + classBaseMana + gearMana (only for mana users)
healthRegen       = (spirit * 0.5) + gearHealthRegen           per combat tick (3 seconds)
manaRegen         = (spirit * 1.0) + (intellect * 0.25) + gearManaRegen   per combat tick (3 seconds)
```

**Rating-to-Percentage Conversion:** These use a constant denominator (e.g., 14.0 for crit). This means at level 60 with endgame gear, a player might accumulate ~200 crit rating = ~14.3% crit from gear, plus base 5% + agility contribution. This keeps crit in a healthy 25-40% range for geared characters.

### 3.4 Resource Systems

Three resource types, each with distinct regeneration models:

**Mana (Cleric, Arcanist, Summoner, Channeler, Sentinel, Stalker, Shapeshifter):**
- Starts at maximum
- Spent by abilities
- Regenerates via spirit-based manaRegen per combat tick
- Out of combat: 3x regen rate
- If mana reaches 0, character auto-attacks only until enough mana for cheapest ability

**Energy (Shadow):**
- Starts at 100 (fixed cap)
- Regenerates at 10 energy per combat tick (3 seconds), always
- Abilities cost 25-60 energy
- Fast-paced: abilities used frequently with short cooldowns

**Rage (Blademaster):**
- Starts at 0
- Generates from: dealing damage (+5 rage per hit), taking damage (+3 rage per hit taken)
- Maximum: 100
- Decays at 2/tick when out of combat
- Abilities cost 15-50 rage
- Ramp-up class: weak at fight start, strong once rage is built

### 3.5 Stat Caps and Diminishing Returns

To prevent degenerate stacking at endgame:

| Stat | Soft Cap | Hard Cap | DR Formula Above Soft Cap |
|------|----------|----------|--------------------------|
| Critical Strike | 40% | 75% | Each point above 40% gives 50% effectiveness |
| Haste | 30% | 50% | Each point above 30% gives 50% effectiveness |
| Dodge | 25% | 50% | Each point above 25% gives 40% effectiveness |
| Hit Rating | 8% (boss cap) | 8% | No DR, but no benefit past cap vs equal-level |
| Parry | 15% | 30% | Each point above 15% gives 40% effectiveness |

**Note:** Diminishing returns apply to the final computed percentage, not to individual sources.

---

## 4. Combat Engine

### 4.1 Overview

Combat is the core gameplay loop. Since this is an idle game, combat runs automatically. The player's agency comes from build choices (class, talents, gear) that affect how efficiently combat proceeds. The combat engine runs in a Worker Thread to avoid blocking the UI.

**Player Motivation:** Progression (watching numbers go up), Mastery (optimizing builds for faster kills), Anticipation (hoping for rare drops)

### 4.2 Architecture

```
[Renderer Process]  <-- IPC -->  [Main Process]  <-- Worker Thread -->  [Combat Engine]
     UI display                   Save/Load, IPC                         All game logic
```

The combat engine runs a continuous tick-based simulation. State updates are batched and sent to the renderer at a configurable UI update rate (default: every 500ms) to keep the UI responsive without excessive IPC traffic.

### 4.3 Combat Tick Model

```typescript
interface CombatConfig {
  BASE_TICK_INTERVAL_MS: 3000;    // 3 seconds per combat tick (base)
  UI_UPDATE_INTERVAL_MS: 500;     // How often to push state to renderer
  IDLE_SPEEDUP_FACTOR: 1;         // Normal speed during active play
  OFFLINE_SPEEDUP_FACTOR: number; // Determined by offline formula (see Section 9)
}
```

**Tick Sequence (per tick):**
1. **Resource Regeneration** -- Mana/Energy/Rage regen applied
2. **Player Ability Execution** -- AI selects and executes best ability from priority list
3. **Damage Application (Player -> Monster)** -- Calculate damage, apply to monster HP
4. **Check Monster Death** -- If monster HP <= 0, go to Loot Phase
5. **Monster Ability Execution** -- Monster attacks player
6. **Damage Application (Monster -> Player)** -- Calculate damage, apply to player HP
7. **Check Player Death** -- If player HP <= 0, go to Death Phase
8. **Status Effect Processing** -- Tick DoTs, HoTs, buff/debuff durations
9. **Emit State Update** -- If UI_UPDATE_INTERVAL has elapsed, push to renderer

**Effective Tick Interval:**
```
effectiveTickInterval = BASE_TICK_INTERVAL_MS / (1 + haste% / 100)
```
At 30% haste: 3000 / 1.30 = 2308ms per tick.

### 4.4 Ability Priority System

Each class/spec has a default ability priority list that the auto-combat AI follows. The AI evaluates abilities from highest to lowest priority and uses the first one that is (a) off cooldown, (b) has sufficient resource, and (c) meets conditional requirements.

```typescript
interface AbilityPriority {
  abilityId: string;
  priority: number;                    // Lower number = higher priority
  conditions: AbilityCondition[];      // All must be true to use
}

interface AbilityCondition {
  type: "health_below" | "health_above" | "resource_above" | "resource_below"
      | "target_health_below" | "buff_missing" | "debuff_missing"
      | "cooldown_ready" | "always";
  value?: number;                      // Percentage or flat value depending on type
  buffId?: string;
  debuffId?: string;
}
```

**Example Priority List -- Blademaster (Weapon Arts spec):**

| Priority | Ability | Resource | Cooldown | Condition |
|----------|---------|----------|----------|-----------|
| 1 | Execute | 20 Rage | None | Target HP < 20% |
| 2 | Mortal Strike | 30 Rage | 6s | Always |
| 3 | Overpower | 15 Rage | 5s | Always |
| 4 | Rend | 15 Rage | None | Debuff "Rend" missing on target |
| 5 | Heroic Strike | 20 Rage | None | Rage > 60 |
| 6 | Auto-Attack | 0 | None | Always (fallback) |

**Auto-Attack:** Always occurs each tick as a baseline. Special abilities are used in addition to the auto-attack when conditions are met.

### 4.5 Damage Formulas

**Physical Damage (per hit):**
```
baseDamage = weaponDamage + (attackPower / 14) * weaponSpeed
abilityDamage = baseDamage * abilityCoefficient + abilityFlatBonus
critRoll = random(0, 100) < criticalStrike% ? true : false
critMultiplier = critRoll ? 1.5 : 1.0    // Talents can increase to 2.0
hitRoll = random(0, 100)
missChance = max(0, 5.0 - hitRating%)     // 5% base miss, reduced by hit rating
dodgeChance = targetDodge%                 // Monsters have 5% base dodge
finalDamage = floor(abilityDamage * critMultiplier * (1 - armorReduction))

armorReduction = targetArmor / (targetArmor + 400 + 85 * attackerLevel)
// At level 60 vs a monster with 3000 armor: 3000 / (3000 + 400 + 5100) = 35.3% reduction
```

**Spell Damage (per cast):**
```
baseDamage = spellBaseDamage + (spellPower * spellCoefficient)
critRoll = random(0, 100) < spellCriticalStrike% ? true : false
critMultiplier = critRoll ? 1.5 : 1.0
hitRoll = random(0, 100)
missChance = max(0, 4.0 - hitRating%)      // 4% base miss for spells
resistReduction = targetResistance / (targetResistance + 400 + 85 * attackerLevel)
finalDamage = floor(baseDamage * critMultiplier * (1 - resistReduction))
```

**Healing (per cast):**
```
baseHeal = spellBaseHeal + (spellPower * healCoefficient)
critRoll = random(0, 100) < spellCriticalStrike% ? true : false
critMultiplier = critRoll ? 1.5 : 1.0
finalHeal = floor(baseHeal * critMultiplier)
// Healing cannot exceed max HP (overheal is tracked but wasted)
```

**Damage over Time (DoT):**
```
totalDamage = baseDamage + (spellPower * dotCoefficient)
damagePerTick = totalDamage / numberOfTicks
// DoTs tick once per combat tick (3s base) for their duration
// DoTs CAN crit (each tick rolls independently)
```

### 4.6 Monster Definitions

Monsters are defined per zone level range. Each monster has:

```typescript
interface MonsterDefinition {
  id: string;
  name: string;
  level: number;
  type: "normal" | "elite" | "boss";    // Only normal in Phase 1
  health: number;
  damage: number;                        // Damage per hit (flat, pre-armor)
  armor: number;
  resistance: number;
  attackSpeed: number;                   // Ticks between attacks (1 = every tick)
  abilities: MonsterAbility[];           // Simple abilities (Phase 1: just basic attacks)
  lootTableId: string;
  xpReward: number;
  goldReward: GoldRange;
}

interface GoldRange {
  min: number;
  max: number;
}
```

**Monster Stat Scaling Formula (for procedural generation):**

```
monsterHP(level) = 40 + (level * 12) + (level^1.4 * 3)
monsterDamage(level) = 5 + (level * 2.5) + (level^1.3 * 0.8)
monsterArmor(level) = 20 + (level * 15)
monsterResistance(level) = 10 + (level * 8)
monsterXP(level) = 40 + (level * 15) + (level^1.6 * 2)
monsterGoldMin(level) = floor(1 + level * 0.5)
monsterGoldMax(level) = floor(3 + level * 1.2)
```

**Example at Level 30:**
- HP: 40 + 360 + 3 * 30^1.4 = 40 + 360 + 3 * 107.5 = 722.5 ~ 723
- Damage: 5 + 75 + 0.8 * 30^1.3 = 5 + 75 + 0.8 * 60.5 = 128.4 ~ 128
- XP: 40 + 450 + 2 * 30^1.6 = 40 + 450 + 2 * 222.4 = 934.8 ~ 935

**Time to Kill Target:** A level-appropriate geared character should kill a normal monster in 3-5 ticks (9-15 seconds). This creates a satisfying cadence of roughly 4-6 kills per minute.

### 4.7 Combat Outcomes

**Monster Death:**
1. Monster HP reaches 0
2. XP awarded to player (modified by level difference, bonuses)
3. Gold awarded (random within range)
4. Loot roll performed (see Section 6 for loot tables)
5. Combat log entry generated
6. Next monster spawned immediately (no delay in idle mode)

**Player Death:**
1. Player HP reaches 0
2. 10% gold penalty (floor of 10% of current gold deducted)
3. Gear durability reduced by 10% across all equipped items (Phase 1: track durability but no repair cost yet)
4. Player respawns at full HP/mana after 5-second delay
5. Combat resumes against a new monster
6. No XP loss

**Level Difference XP Modifier:**
```
if monsterLevel >= playerLevel + 5:   XP = 0 (monster too high, cannot engage)
if monsterLevel >= playerLevel + 3:   XP *= 1.2 (bonus for fighting above level)
if monsterLevel >= playerLevel - 2:   XP *= 1.0 (normal)
if monsterLevel >= playerLevel - 5:   XP *= 0.75 (reduced, slightly below)
if monsterLevel >= playerLevel - 8:   XP *= 0.25 (greatly reduced)
if monsterLevel <  playerLevel - 8:   XP = 0 (grey, no XP)
```

### 4.8 Combat Log

The combat engine produces structured log entries that the renderer displays:

```typescript
interface CombatLogEntry {
  timestamp: number;            // Game tick number
  type: "damage_dealt" | "damage_taken" | "heal" | "ability_used"
      | "buff_applied" | "buff_expired" | "debuff_applied" | "debuff_expired"
      | "monster_killed" | "player_death" | "xp_gained" | "gold_gained"
      | "loot_dropped" | "level_up" | "miss" | "dodge" | "parry" | "crit";
  source: string;               // Character name or monster name
  target: string;
  value?: number;               // Damage/heal amount, XP, gold
  abilityName?: string;
  itemName?: string;            // For loot drops
  isCritical?: boolean;
}
```

The combat log is a ring buffer of the last 500 entries. Older entries are discarded.

---

## 5. Leveling and XP System

### 5.1 Overview

Leveling 1-60 is the first major progression arc. The XP curve must deliver the target pacing: rapid early levels to hook the player, gradually slowing mid-game, and reaching a satisfying pace at 50+ where each level feels earned. The total time from 1 to 60 should be approximately 20-30 hours of game time (combining active and idle play).

**Player Motivation:** Progression (the core idle game dopamine loop), Anticipation (new talents, zones, abilities), Power Fantasy (getting visibly stronger)

### 5.2 XP Curve Formula

```
xpToNextLevel(level) = floor(100 * level + 50 * level^1.65)
```

**XP Table (key levels):**

| Level | XP Required | Cumulative XP | Est. Time to Level (minutes) | Cumulative Time (hours) |
|-------|-------------|---------------|------------------------------|------------------------|
| 1 | 150 | 0 | 2 | 0.03 |
| 2 | 259 | 150 | 3 | 0.08 |
| 5 | 1,059 | 2,007 | 5 | 0.30 |
| 10 | 3,232 | 11,837 | 10 | 1.0 |
| 15 | 6,251 | 34,116 | 15 | 2.1 |
| 20 | 10,078 | 73,792 | 20 | 3.6 |
| 25 | 14,711 | 134,854 | 28 | 5.7 |
| 30 | 20,131 | 221,088 | 35 | 8.4 |
| 35 | 26,340 | 336,236 | 42 | 11.9 |
| 40 | 33,340 | 484,164 | 50 | 16.1 |
| 45 | 41,123 | 668,840 | 58 | 21.0 |
| 50 | 49,686 | 894,306 | 65 | 26.6 |
| 55 | 59,021 | 1,164,733 | 72 | 32.9 |
| 59 | 67,371 | 1,431,219 | 78 | 38.8 |
| 60 | -- (max) | 1,498,590 | -- | ~40 (max with idle) |

**Design Note:** The cumulative time assumes a mix of active and idle play. Pure active play with optimal gear should reach 60 in ~25 hours. Pure idle (with diminishing returns) takes closer to 40 hours.

### 5.3 XP Sources

**Questing (Target: 70% of total XP):**
Quests are simulated, not manually accepted. The system auto-generates and completes quests as the player's character fights in a zone.

```typescript
interface QuestSimulation {
  questsPerZone: number;          // 15-25 quests per zone
  killsPerQuest: number;          // 8-15 monster kills to "complete"
  questXPMultiplier: number;      // 2.5x the XP of the kills themselves
  questGoldReward: GoldRange;     // Flat gold on completion
  questGearChance: number;        // 30% chance of gear reward per quest
}
```

**Quest Completion Flow:**
1. When a character enters a zone level range, a quest queue is populated
2. Each quest has a kill counter (8-15 kills of zone-appropriate monsters)
3. Each monster kill in the zone increments the active quest's counter
4. When the counter fills, the quest "completes":
   - Bonus XP awarded (2.5x the total monster XP from those kills)
   - Gold reward awarded
   - 30% chance of a gear item appropriate to zone level
   - Next quest in the queue activates
5. When all quests in a zone are complete, the character moves to the next zone
6. If the character outleves the zone, they auto-advance

**Monster Grinding (Target: 30% of total XP):**
All monster kill XP contributes directly, independent of quest progress.

### 5.4 Zone Progression

```typescript
interface ZoneDefinition {
  id: string;
  name: string;
  levelRange: { min: number; max: number };
  description: string;
  monsterTypes: MonsterDefinition[];    // 4-6 monster types per zone
  questCount: number;
  nextZoneId: string | null;
}
```

**Zone Table:**

| Zone ID | Zone Name | Level Range | Monster Count | Quest Count | Theme |
|---------|-----------|-------------|---------------|-------------|-------|
| zone_01 | Sunstone Valley | 1-5 | 4 | 10 | Peaceful starting valley, boars, wolves, bandits |
| zone_02 | Thornwick Hamlet | 5-10 | 5 | 12 | Farmland under threat, spiders, undead farmers |
| zone_03 | Wildwood Thicket | 11-15 | 5 | 15 | Dense forest, treants, wild beasts, corrupted druids |
| zone_04 | Silvergrass Meadows | 15-20 | 5 | 15 | Rolling plains, centaurs, harpies, rogue elementals |
| zone_05 | Mistmoor Bog | 21-25 | 5 | 18 | Swamp, lizardfolk, bog wraiths, toxic oozes |
| zone_06 | Embercrag Caverns | 25-30 | 5 | 18 | Underground, fire elementals, dwarven ghosts, spiders |
| zone_07 | Skyreach Summits | 31-35 | 6 | 18 | Mountain peaks, griffons, wind elementals, yeti |
| zone_08 | Ironhold Fortress | 35-40 | 6 | 20 | Siege warfare zone, orc raiders, siege engines, warlords |
| zone_09 | Blighted Wastes | 41-45 | 6 | 20 | Cursed wasteland, undead armies, plague beasts |
| zone_10 | Ashfall Plateau | 45-50 | 6 | 20 | Volcanic zone, dragonkin, fire giants, lava lurkers |
| zone_11 | Twilight Reaches | 51-55 | 6 | 22 | Ethereal zone, shadow beings, corrupted angels |
| zone_12 | Ascendant Spire | 55-60 | 6 | 22 | Final leveling zone, ancient constructs, void lords |

**Auto-Progression Rules:**
- Character fights the highest-level monster in their current zone that is within level range (playerLevel +2 to playerLevel -2 preferred)
- When the character reaches the maximum level of the current zone, they auto-advance to the next zone
- If a character is overleveled for a zone (more than 3 levels above zone max), they skip it entirely

### 5.5 Level-Up Effects

When a character levels up:
1. **Stats increase** per the class growth table (Section 3.2)
2. **HP/Mana restored to full** (instant)
3. **New abilities unlocked** at specific levels (see class ability tables in `data/abilities/`)
4. **Talent point gained** at levels 10-60 (one point per level, 51 total)
5. **Visual celebration** -- combat log entry, level-up notification
6. **Auto-zone check** -- if new level exceeds current zone, advance

**Ability Unlock Schedule (generic, all classes follow this pattern):**

| Level | Unlock |
|-------|--------|
| 1 | Basic attack + 1 class ability |
| 4 | 2nd class ability |
| 8 | 3rd class ability |
| 10 | Talent tree available, 1st talent point |
| 14 | 4th class ability |
| 20 | 5th class ability |
| 26 | 6th class ability |
| 32 | 7th class ability |
| 40 | 8th class ability |
| 50 | 9th class ability |
| 58 | 10th class ability (capstone rotation ability) |

### 5.6 XP Modifiers

All XP modifiers are multiplicative with each other:

```
finalXP = baseXP * levelDifferenceMod * racialMod * ascensionMod * catchUpMod
```

| Modifier | Source | Value |
|----------|--------|-------|
| Level Difference | Section 4.7 | 0 to 1.2 |
| Valeborn Racial | Race selection | 1.10 (quest XP only) |
| Ascension Bonus | Per Ascension cycle | 1.0 + (ascensionCount * 0.02) |
| Catch-up Multiplier | Returning from offline | 2.0 to 5.0 (decays over 30 minutes) |

---

## 6. Gear System

### 6.1 Overview

Gear is the primary expression of character power and the core endgame motivator. In Phase 1, we build the full item model including generation, equipping, inventory, and stat budgets for leveling content (iLevel 1-60). Endgame gear tiers (iLevel 60-90) will be generated in Phase 2 alongside dungeon/raid content, but the system must be architected to support them.

**Player Motivation:** Acquisition (the loot dopamine hit), Power (visible stat increases), Optimization (comparing items, finding best-in-slot)

### 6.2 Equipment Slots

15 slots, matching classic MMORPG layout:

```typescript
enum GearSlot {
  Head = "head",
  Neck = "neck",
  Shoulders = "shoulders",
  Back = "back",           // Cloak
  Chest = "chest",
  Wrists = "wrists",
  Hands = "hands",
  Waist = "waist",
  Legs = "legs",
  Feet = "feet",
  Ring1 = "ring1",
  Ring2 = "ring2",
  Trinket1 = "trinket1",
  Trinket2 = "trinket2",
  MainHand = "main_hand",  // Weapon (can be 2H)
  OffHand = "off_hand",    // Shield, off-hand weapon, or held item (empty if 2H equipped)
}
```

**Note on weapons:** `MainHand` and `OffHand` are separate slots. A 2H weapon fills both (OffHand becomes locked). Dual-wield classes (Shadow) fill both with 1H weapons. Shield-users (Sentinel in Defender spec) use 1H + Shield.

### 6.3 Item Quality Tiers

```typescript
enum ItemQuality {
  Common = "common",         // Gray name. Vendor trash or starter gear.
  Uncommon = "uncommon",     // Green name. First real upgrades.
  Rare = "rare",             // Blue name. Meaningful upgrades, quest rewards.
  Epic = "epic",             // Purple name. Best leveling drops, dungeon loot.
  Legendary = "legendary",   // Orange name. Phase 2+ only. Not generated in Phase 1.
}
```

**Quality Stat Multipliers (applied to base stat budget):**

| Quality | Stat Multiplier | Drop Chance (from monsters) | Phase 1 Available |
|---------|----------------|---------------------------|-------------------|
| Common | 1.0x | 45% | Yes |
| Uncommon | 1.3x | 35% | Yes |
| Rare | 1.7x | 15% | Yes |
| Epic | 2.2x | 5% | Yes (level 40+ only) |
| Legendary | 3.0x | 0% (drops from bosses only) | No |

### 6.4 Item Level (iLevel) System

iLevel is the primary indicator of item power. Every item has an iLevel that determines its stat budget.

```typescript
interface ItemDefinition {
  id: string;
  name: string;
  slot: GearSlot;
  quality: ItemQuality;
  iLevel: number;
  requiredLevel: number;        // Player must be this level to equip
  armorType?: ArmorType;        // For armor pieces
  weaponType?: WeaponType;      // For weapons
  primaryStats: Partial<PrimaryStats>;
  secondaryStats: Partial<SecondaryStats>;
  weaponDamage?: { min: number; max: number };  // For weapons only
  weaponSpeed?: number;                          // For weapons only (in seconds)
  durability: { current: number; max: number };
  sellValue: number;             // Gold value when vendored
  flavorText?: string;
}
```

**iLevel during leveling:** An item's iLevel is approximately equal to the level of the monster/quest that dropped it.

```
iLevel = monsterLevel + qualityBonus
where qualityBonus = { common: 0, uncommon: 1, rare: 2, epic: 4 }
```

**Required Level:**
```
requiredLevel = max(1, iLevel - 3)
```

### 6.5 Stat Budget System

Each iLevel grants a stat "budget" that is distributed across the item's stats. Higher iLevel = more total stats.

**Base Stat Budget Formula:**
```
totalStatBudget(iLevel) = floor(iLevel * 1.5 + iLevel^1.2 * 0.3)
```

| iLevel | Raw Budget | After Common 1.0x | After Uncommon 1.3x | After Rare 1.7x | After Epic 2.2x |
|--------|------------|-------------------|---------------------|-----------------|-----------------|
| 1 | 2 | 2 | 3 | 3 | 4 |
| 10 | 20 | 20 | 26 | 34 | 44 |
| 20 | 42 | 42 | 55 | 71 | 92 |
| 30 | 67 | 67 | 87 | 114 | 147 |
| 40 | 95 | 95 | 124 | 162 | 209 |
| 50 | 126 | 126 | 164 | 214 | 277 |
| 60 | 160 | 160 | 208 | 272 | 352 |

**Budget Distribution by Slot:**

Different slots receive different proportions of the budget:

| Slot Type | Budget Weight | Description |
|-----------|--------------|-------------|
| Chest, Legs | 1.0 (full) | Primary armor slots, most stats |
| Head, Shoulders | 0.85 | Secondary armor, substantial stats |
| Hands, Feet, Waist | 0.7 | Tertiary armor, moderate stats |
| Wrists, Back | 0.55 | Minor armor, fewer stats |
| Neck, Ring | 0.5 | Jewelry, secondary stat focused |
| Trinket | 0.45 | Special effects in Phase 2, raw stats for now |
| Main Hand (2H) | 1.2 | Weapons are the most impactful slot |
| Main Hand (1H) | 0.75 | Balanced for dual-wield/shield |
| Off Hand (Shield) | 0.6 | Defensive stats, armor |
| Off Hand (Held) | 0.5 | Caster off-hands, spell power focus |

**Stat Allocation Rules:**
1. Each item gets 1-2 primary stats and 0-2 secondary stats
2. Primary stats are chosen based on the item's `classAffinity` (what classes would want this item)
3. The budget is split: 70% to primary stats, 30% to secondary stats
4. Within primary stats, the split is weighted toward the class's highest-priority stat (60/40 if two stats)
5. Secondary stats are chosen randomly from a pool appropriate to the slot (e.g., weapons can roll crit/haste/hit, armor can roll armor/dodge/parry)

**Example:** iLevel 30 Rare Chest Piece for a Blademaster:
- Raw budget: 67
- Quality multiplier: 1.7x = 114 total budget
- Slot weight: 1.0 = 114 points
- Primary split (70%): 80 points -> STR 48 (+48), STA 32 (+32)
- Secondary split (30%): 34 points -> Crit Rating +20, Armor +14

### 6.6 Weapon Damage Scaling

Weapons have a damage range in addition to stats:

```
weaponMinDamage(iLevel, quality) = floor((iLevel * 2 + 5) * qualityMultiplier * speedFactor)
weaponMaxDamage(iLevel, quality) = floor(weaponMinDamage * 1.4)

speedFactor = weaponSpeed / 2.0   // Normalizes so slow weapons hit harder per swing
```

**Weapon Speeds:**

| Weapon Type | Speed (seconds) | Style |
|-------------|----------------|-------|
| Dagger | 1.5 | Fast, dual-wield |
| 1H Sword/Mace/Axe | 2.0 | Standard melee |
| 2H Sword/Mace/Axe | 3.0 | Slow, heavy hits |
| Staff | 2.8 | Caster melee + spell power |
| Bow/Crossbow | 2.5 | Ranged |
| Wand | 1.8 | Caster ranged auto |

### 6.7 Loot System

**Monster Loot Table:**

Each monster kill has a chance to drop an item. The loot system runs after every kill.

```typescript
interface LootTable {
  monsterLevel: number;
  drops: LootDrop[];
}

interface LootDrop {
  dropChance: number;        // Percentage chance (0-100)
  qualityWeights: Record<ItemQuality, number>;  // Relative weights within this drop
  slotPool: GearSlot[];      // Which slots can drop
  iLevelRange: { min: number; max: number };
}
```

**Base Drop Chances:**

```
itemDropChance = 20%           // Any item drops at all
qualityRoll weights:
  Common:    45
  Uncommon:  35
  Rare:      15
  Epic:       5 (only if playerLevel >= 40)
```

**Drop Slot Selection:**
- Weighted toward slots the player has the weakest gear in (smart loot)
- 60% chance to roll a slot the player could use (matching armor type/class)
- 40% chance to roll any slot (can result in vendor trash for wrong armor type)

**Gold Drops:** Every kill drops gold within the monster's gold range. This is independent of item drops.

### 6.8 Inventory System

```typescript
interface Inventory {
  bags: InventoryBag[];
  maxBags: 1;                   // Phase 1: single 28-slot bag
}

interface InventoryBag {
  slots: (ItemInstance | null)[];
  capacity: 28;
}
```

**Auto-Equip Logic:** When an item drops, the system checks if it is an upgrade:

```typescript
function isUpgrade(newItem: ItemInstance, equippedItem: ItemInstance | null): boolean {
  if (!equippedItem) return true;                    // Empty slot = always equip
  if (!canEquip(newItem, character)) return false;   // Wrong class/level/type
  return getItemScore(newItem) > getItemScore(equippedItem);
}

function getItemScore(item: ItemInstance): number {
  // Sum of all primary stats * weight + secondary stats * weight
  // Weights depend on class primary stat priority
  let score = 0;
  for (const [stat, value] of Object.entries(item.primaryStats)) {
    score += value * getStatWeight(character.class, stat);
  }
  for (const [stat, value] of Object.entries(item.secondaryStats)) {
    score += value * getStatWeight(character.class, stat) * 0.5;
  }
  return score;
}
```

**Auto-equip is on by default.** Players can toggle it off in settings. When off, items go directly to inventory and the player manually equips.

**Inventory Full:** When inventory is full and a new item drops:
1. If the new item is an upgrade, it auto-equips and the old item goes to inventory
2. If inventory is still full, the lowest-value Common item is auto-vendored for gold
3. If no Common items exist, the lowest-iLevel item is auto-vendored
4. This behavior can be toggled (option: "Auto-sell when full: ON/OFF")

### 6.9 Item Comparison

The UI must support comparing a new item to the currently equipped item. The comparison shows:

```
[New Item]                    [Equipped Item]
Chainmail Helm of Might       Worn Leather Cap
iLevel 25 (Rare)              iLevel 12 (Common)
+34 STR (+18)                 +16 STR
+22 STA (+10)                 +12 STA
+12 Crit Rating (NEW)         --
```

Green text for upgrades, red text for downgrades, white for new stats.

---

## 7. Talent System

### 7.1 Overview

The talent system provides the deepest form of character customization in Phase 1. Each class has 3 specialization trees with 25 talent nodes each (75 total per class, but only 51 points available, forcing meaningful choices). The visual reference (see `refs/talent_tree_ref.png`) shows the target layout: a vertical tree with branching paths, prerequisites, and a capstone at the bottom.

**Player Motivation:** Mastery (theorycrafting optimal builds), Identity (defining your character's spec), Agency (meaningful choices with real impact)

### 7.2 Talent Tree Structure

```typescript
interface TalentTree {
  id: string;
  name: string;                  // e.g., "Weapon Arts"
  classId: ClassId;
  description: string;
  icon: string;
  nodes: TalentNode[];           // 25 nodes per tree
}

interface TalentNode {
  id: string;
  name: string;
  description: string;           // What it does, with values per rank
  icon: string;
  tier: 1 | 2 | 3 | 4 | 5;     // Position in tree (top to bottom)
  position: { row: number; col: number }; // Grid position for rendering
  maxRank: number;               // 1-5 ranks
  pointsRequired: number;        // Total points in THIS tree to unlock this tier
  prerequisiteNodeId?: string;   // Must have max rank in this node first
  effects: TalentEffect[];       // What each rank grants
}

interface TalentEffect {
  rank: number;
  type: "stat_bonus" | "ability_modifier" | "new_ability" | "proc_chance" | "resource_modifier";
  stat?: string;
  value: number;
  description: string;
}
```

### 7.3 Tier Requirements

| Tier | Points Required in Tree | Typical Node Types |
|------|------------------------|-------------------|
| 1 | 0 | Basic stat boosts (+1-5% per rank), minor passives |
| 2 | 5 | Enhanced passives, small proc effects |
| 3 | 10 | Significant passives, ability modifiers |
| 4 | 15 | Powerful passives, major ability changes |
| 5 | 20 | Capstone talent (1 rank, powerful defining ability) |

**Point Allocation Rules:**
1. Players gain 1 talent point per level from level 10 to 60 (51 points total)
2. Points can be placed in any of the 3 trees for the class
3. To place a point in a Tier N node, the player must have spent at least `tierRequirement[N]` points in that same tree
4. If a node has a `prerequisiteNodeId`, that prerequisite must be at max rank
5. Each node can have 1-5 ranks. Each rank costs 1 point.

### 7.4 Talent Node Categories

**Stat Bonus Nodes (most common):**
```
Example: "Improved Strength" (5 ranks)
  Rank 1: +2% Strength
  Rank 2: +4% Strength
  Rank 3: +6% Strength
  Rank 4: +8% Strength
  Rank 5: +10% Strength
```

**Ability Modifier Nodes:**
```
Example: "Empowered Mortal Strike" (3 ranks)
  Rank 1: Mortal Strike deals 10% more damage
  Rank 2: Mortal Strike deals 20% more damage
  Rank 3: Mortal Strike deals 30% more damage and reduces cooldown by 1s
```

**Proc Chance Nodes:**
```
Example: "Sword Specialization" (5 ranks)
  Rank 1: 1% chance on melee hit to gain an extra attack
  Rank 2: 2% chance ...
  ...
  Rank 5: 5% chance on melee hit to gain an extra attack
```

**New Ability Nodes (typically Tier 3+ or Capstone):**
```
Example: "Bladestorm" (1 rank, Tier 5 Capstone)
  Rank 1: Activate to deal 150% weapon damage to all enemies for 6 seconds. 2 minute cooldown.
```

**Resource Modifier Nodes:**
```
Example: "Focused Rage" (3 ranks)
  Rank 1: Abilities cost 3% less Rage
  Rank 2: Abilities cost 6% less Rage
  Rank 3: Abilities cost 10% less Rage
```

### 7.5 Respec System

Players can reset their talent points for a gold cost:

```
respecCost(level, respecCount) = floor(10 * level * (1 + respecCount * 0.5))
// Max respec cost: floor(10 * 60 * (1 + 10 * 0.5)) = 3600 gold (after 10 respecs)
// First respec at level 60: 600 gold
// respecCount resets on Ascension (Phase 3)
```

**Respec Flow:**
1. Player clicks "Reset Talents"
2. Confirmation dialog shows gold cost
3. If confirmed and player has enough gold: all points refunded, gold deducted
4. Player can immediately re-allocate
5. Combat pauses during talent allocation (no idle gains while talent screen is open and modified)

### 7.6 Example Talent Tree: Blademaster - Weapon Arts

This serves as the template for how all 27 talent trees should be structured.

**Tier 1 (0 points required):**
| Node | Max Rank | Effect per Rank |
|------|----------|----------------|
| Sharpened Blade | 5 | +2% physical damage |
| Toughened Hide | 5 | +2% armor from gear |
| Quick Recovery | 3 | +1 rage generated per combat tick |

**Tier 2 (5 points required):**
| Node | Max Rank | Effect per Rank |
|------|----------|----------------|
| Deep Wounds | 3 | Critical strikes cause a bleed for 40/80/120% weapon damage over 12s |
| Improved Mortal Strike | 3 | Mortal Strike damage +10/20/30% |
| Battle Fury | 2 | +5/10% attack speed after killing a target, lasts 10s |

**Tier 3 (10 points required):**
| Node | Max Rank | Effect per Rank |
|------|----------|----------------|
| Weapon Mastery | 5 | +1% crit chance with melee weapons |
| Taste for Blood | 3 | Rend ticks have 33/66/100% chance to enable Overpower |
| Second Wind | 2 | Below 30% HP: regenerate 2/4% max HP per tick |

**Tier 4 (15 points required):**
| Node | Max Rank | Effect per Rank |
|------|----------|----------------|
| Wrecking Crew | 5 | Critical hits increase damage by 2% for 10s, stacking |
| Endless Rage | 2 | +25/50% rage generation from all sources |
| Trauma | 3 | Attacks reduce target armor by 3/6/10% for 15s |

**Tier 5 (20 points required):**
| Node | Max Rank | Effect per Rank |
|------|----------|----------------|
| Bladestorm (Capstone) | 1 | Activate: Whirl dealing 150% weapon damage per tick for 6s. 2 min CD. Immune to movement effects during. |

**Total nodes in tree:** 25 ranks across 12 nodes. A player going "deep" in this tree would spend ~25 points to reach the capstone, leaving 26 points for the other two trees.

### 7.7 Talent Application in Combat

Talents modify the character's stats and abilities at the time of allocation. When a talent is allocated or removed:

1. Recalculate all derived stats
2. Update ability coefficients/cooldowns if modified by talents
3. Update the combat ability priority list if new abilities are unlocked
4. Persist the new talent state to the save file

**Performance Consideration:** Talent recalculation only happens on point allocation, not per combat tick. The combat engine reads the final computed stats and uses them directly.

---

## 8. Save and Load System

### 8.1 Overview

Save data integrity is non-negotiable for an idle game. Players may accumulate hundreds of hours of progress. The save system must be robust against corruption, support multiple characters, and handle the transition between active and offline play.

### 8.2 Save Architecture

```
[Game Engine] --> serialize --> [JSON] --> gzip compress --> [.sav file on disk]
[.sav file] --> decompress --> [JSON] --> validate --> deserialize --> [Game Engine]
```

**File Location:**
```
Windows: %APPDATA%/idle-mmorpg/saves/
macOS:   ~/Library/Application Support/idle-mmorpg/saves/
Linux:   ~/.local/share/idle-mmorpg/saves/
```

**File Naming:** `slot_{1|2|3}_save.sav` and `slot_{1|2|3}_save.bak` (backup of previous save)

### 8.3 Save Data Schema

```typescript
interface SaveFile {
  meta: SaveMeta;
  character: CharacterSave;
  progression: ProgressionSave;
  inventory: InventorySave;
  talents: TalentSave;
  combatState: CombatStateSave;
  settings: SettingsSave;
}

interface SaveMeta {
  version: string;              // Save format version (semver), e.g., "1.0.0"
  gameVersion: string;          // Application version
  saveSlot: 1 | 2 | 3;
  createdAt: string;            // ISO 8601 timestamp
  lastSavedAt: string;          // ISO 8601 timestamp
  lastPlayedAt: string;         // ISO 8601 timestamp (for offline calculation)
  playTimeSeconds: number;      // Total active play time
  checksum: string;             // SHA-256 of the save data (minus this field) for integrity
}

interface CharacterSave {
  id: string;                   // UUID
  name: string;
  race: Race;
  classId: ClassId;
  level: number;
  currentXP: number;            // XP toward next level
  gold: number;
  baseStats: PrimaryStats;      // Without gear/talents
  currentHP: number;
  currentResource: number;      // Mana/Energy/Rage
  deathCount: number;
  totalKills: number;
  totalQuestsCompleted: number;
  respecCount: number;
}

interface ProgressionSave {
  currentZoneId: string;
  currentQuestIndex: number;     // Which quest in current zone
  currentQuestKills: number;     // Kills toward current quest completion
  zonesCompleted: string[];      // Zone IDs fully completed
  unlockedAbilities: string[];   // Ability IDs learned
  activeAbilityPriority: AbilityPriority[];  // Current combat rotation
}

interface InventorySave {
  equipped: Record<GearSlot, ItemInstance | null>;
  bags: (ItemInstance | null)[][];
}

interface TalentSave {
  allocatedPoints: Record<string, number>;  // nodeId -> rank
  totalPointsSpent: number;
}

interface CombatStateSave {
  currentMonster: {
    definitionId: string;
    currentHP: number;
    activeDebuffs: ActiveEffect[];
  } | null;
  activeDots: ActiveEffect[];
  activeBuffs: ActiveEffect[];
  cooldowns: Record<string, number>;  // abilityId -> ticks remaining
}

interface SettingsSave {
  autoEquip: boolean;
  autoSellCommon: boolean;
  combatLogVisible: boolean;
  offlineNotifications: boolean;
  uiScale: number;
}
```

### 8.4 Auto-Save System

```typescript
interface AutoSaveConfig {
  intervalMs: 60000;              // Save every 60 seconds
  saveOnClose: true;              // Always save when app closes
  saveOnLevelUp: true;            // Save on each level up
  saveOnSignificantEvent: true;   // Save on epic+ loot, zone change, talent allocation
  maxBackups: 3;                  // Keep last 3 backups per slot
}
```

**Save Process:**
1. Serialize current game state to JSON
2. Compute SHA-256 checksum of JSON payload
3. Attach checksum to meta
4. Gzip compress the JSON
5. Write to `slot_N_save.sav.tmp` (temporary file)
6. On successful write, rename `.tmp` to `.sav` (atomic on most filesystems)
7. Move previous `.sav` to `.bak`

**Why temporary file first:** Prevents corruption if the app crashes mid-write.

### 8.5 Load Process

1. Read `slot_N_save.sav`
2. Gzip decompress
3. Parse JSON
4. Validate checksum (if mismatch, try `.bak` file)
5. Validate schema version (run migrations if needed)
6. Deserialize into game state
7. Calculate offline progression (see Section 9)
8. Resume game

### 8.6 Save Migration

```typescript
interface SaveMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (oldSave: unknown) => unknown;
}

// Migrations are applied sequentially: 1.0.0 -> 1.1.0 -> 1.2.0 -> current
const migrations: SaveMigration[] = [
  // Future migrations go here
];
```

### 8.7 Edge Cases

- **Corrupted save and backup:** Display error message with option to start fresh or export raw data
- **App crashes during save:** `.tmp` file exists but `.sav` is intact from previous save. On next load, detect and clean up `.tmp`.
- **Clock manipulation:** Save stores `lastPlayedAt` as ISO timestamp. On load, if `lastPlayedAt` is in the future, clamp offline time to 0 and log a warning. If `lastPlayedAt` is more than 30 days ago, cap offline gains at 24 hours.
- **Version downgrade:** If save version is newer than app version, refuse to load with a clear error message.

---

## 9. Offline Progression

### 9.1 Overview

Offline progression is what makes this an idle game rather than just an automated RPG. When the player closes the app and returns later, the game simulates what happened during their absence. This system must feel rewarding (the whole point of idle games) but also encourage returning (check-in motivation) and not fully replace active play (endgame content gated behind active play in Phase 2).

**Player Motivation:** Anticipation (wondering what you'll come back to), Satisfaction (seeing a big lump of progress), Habit Formation (daily check-in reward)

### 9.2 Offline Time Calculation

```typescript
function calculateOfflineTime(lastPlayedAt: Date, now: Date): OfflineTime {
  const elapsedMs = now.getTime() - lastPlayedAt.getTime();
  const elapsedHours = Math.min(elapsedMs / 3600000, 24); // Cap at 24 hours

  return {
    rawHours: elapsedHours,
    effectiveHours: calculateEffectiveHours(elapsedHours),
    tier: getOfflineTier(elapsedHours),
  };
}
```

### 9.3 Diminishing Returns Formula

The GDD specifies: 100% for first 12h, 75% for 12-18h, 50% for 18-24h. We implement this as a piecewise function:

```typescript
function calculateEffectiveHours(rawHours: number): number {
  if (rawHours <= 0) return 0;

  let effective = 0;

  // Tier 1: First 12 hours at 100%
  const tier1Hours = Math.min(rawHours, 12);
  effective += tier1Hours * 1.0;

  // Tier 2: Hours 12-18 at 75%
  if (rawHours > 12) {
    const tier2Hours = Math.min(rawHours - 12, 6);
    effective += tier2Hours * 0.75;
  }

  // Tier 3: Hours 18-24 at 50%
  if (rawHours > 18) {
    const tier3Hours = Math.min(rawHours - 18, 6);
    effective += tier3Hours * 0.50;
  }

  return effective;
  // Maximum effective hours: 12 + 4.5 + 3 = 19.5 effective hours from 24 raw hours
}
```

### 9.4 Offline Simulation

The offline simulation does NOT run the full combat engine tick-by-tick. Instead, it uses a statistical model to estimate outcomes based on the character's power level and the zone they were in.

```typescript
interface OfflineSimulationInput {
  character: CharacterSave;
  equipped: Record<GearSlot, ItemInstance | null>;
  talents: TalentSave;
  effectiveHours: number;
  currentZone: ZoneDefinition;
}

interface OfflineSimulationResult {
  xpGained: number;
  goldGained: number;
  levelsGained: number;
  monstersKilled: number;
  questsCompleted: number;
  itemsFound: ItemInstance[];     // Capped at Rare quality
  newLevel: number;
  newZoneId: string;             // May have auto-progressed zones
  deaths: number;
}
```

**Simulation Algorithm:**

```typescript
function simulateOffline(input: OfflineSimulationInput): OfflineSimulationResult {
  const effectiveSeconds = input.effectiveHours * 3600;
  const tickInterval = 3.0; // Base tick interval in seconds
  const effectiveTicks = Math.floor(effectiveSeconds / tickInterval);

  // Calculate average kills per tick based on character power vs zone monsters
  const avgMonsterHP = getAverageMonsterHP(input.currentZone, input.character.level);
  const avgPlayerDPS = estimatePlayerDPS(input.character, input.equipped, input.talents);
  const avgTimeToKill = Math.max(1, Math.ceil(avgMonsterHP / (avgPlayerDPS * tickInterval)));
  const killsPerTick = 1 / avgTimeToKill;

  let totalKills = Math.floor(effectiveTicks * killsPerTick);

  // Estimate deaths (reduces effective kills)
  const deathRate = estimateDeathRate(input.character, input.currentZone);
  const deaths = Math.floor(totalKills * deathRate);
  totalKills = Math.floor(totalKills * (1 - deathRate));

  // Calculate XP
  const avgXPPerKill = getAverageMonsterXP(input.currentZone, input.character.level);
  const questBonusMultiplier = 1.7; // Quests provide ~70% bonus on top of grind XP
  let totalXP = Math.floor(totalKills * avgXPPerKill * questBonusMultiplier);

  // Calculate gold
  const avgGoldPerKill = getAverageMonsterGold(input.currentZone);
  const questGoldMultiplier = 1.3;
  let totalGold = Math.floor(totalKills * avgGoldPerKill * questGoldMultiplier);
  totalGold = Math.floor(totalGold * (1 - deaths * 0.10)); // Death penalty

  // Calculate quests completed
  const avgKillsPerQuest = 11; // Average of 8-15
  const questsCompleted = Math.floor(totalKills / avgKillsPerQuest);

  // Simulate leveling
  let currentLevel = input.character.level;
  let currentXP = input.character.currentXP;
  let levelsGained = 0;
  let remainingXP = totalXP;

  while (remainingXP > 0 && currentLevel < 60) {
    const xpNeeded = xpToNextLevel(currentLevel) - currentXP;
    if (remainingXP >= xpNeeded) {
      remainingXP -= xpNeeded;
      currentLevel++;
      currentXP = 0;
      levelsGained++;
    } else {
      currentXP += remainingXP;
      remainingXP = 0;
    }
  }

  // Simulate loot (offline cap: Rare quality max)
  const itemDropChance = 0.20;
  const expectedDrops = Math.floor(totalKills * itemDropChance);
  const items = generateOfflineLoot(expectedDrops, currentLevel, ItemQuality.Rare);

  // Determine zone progression
  const newZoneId = getZoneForLevel(currentLevel);

  return {
    xpGained: totalXP,
    goldGained: totalGold,
    levelsGained,
    monstersKilled: totalKills,
    questsCompleted,
    itemsFound: items,
    newLevel: currentLevel,
    newZoneId,
    deaths,
  };
}
```

### 9.5 Offline Loot Restrictions

To preserve the incentive for active play and future endgame:

| Rule | Value | Rationale |
|------|-------|-----------|
| Maximum item quality from offline | Rare (Blue) | Epic+ requires active play / dungeons |
| Maximum heroic dungeon completions offline | 0 (Phase 1: no dungeons) | Dungeons are Phase 2 |
| Raid progress offline | None | Raids require active engagement |
| Gold penalty for deaths | Applied | Consistent with active play |

### 9.6 Catch-Up Multiplier

When a player returns after being offline, they receive a temporary XP/Gold bonus to make the session feel extra rewarding:

```typescript
function getCatchUpMultiplier(offlineHours: number): CatchUpBonus {
  // Scales with offline time: longer away = bigger welcome back
  const multiplier = Math.min(5.0, 2.0 + (offlineHours / 24) * 3.0);
  const durationMinutes = 30;

  return {
    xpMultiplier: multiplier,
    goldMultiplier: multiplier * 0.5, // Half the XP multiplier for gold
    durationMs: durationMinutes * 60 * 1000,
    decayType: "linear", // Multiplier decays linearly to 1.0 over duration
  };
}
```

**Example:** Player returns after 12 hours offline:
- Catch-up multiplier: 2.0 + (12/24) * 3.0 = 3.5x XP, 1.75x Gold
- Duration: 30 minutes, linearly decaying to 1.0x
- At minute 15: multiplier is 2.25x XP (halfway between 3.5 and 1.0)

### 9.7 Return Summary Screen

When the player opens the app after being offline, before resuming gameplay, they see:

```
Welcome back, [Character Name]!
You were away for [X hours, Y minutes].

While you were gone:
  Monsters Slain: 1,247
  Quests Completed: 12
  XP Gained: 45,230
  Gold Earned: 1,892
  Levels Gained: 3 (Level 27 -> 30)
  Items Found: 8 (2 Rare, 4 Uncommon, 2 Common)
  Deaths: 2

[View Items]  [Continue Adventuring]
```

The summary screen is a required deliverable. It is the primary dopamine moment for idle players.

---

## 10. Electron Application Shell

### 10.1 Overview

The Electron shell provides the desktop application container. Phase 1 establishes the foundational architecture: main process, renderer process, Worker Thread for the game engine, and the IPC communication layer.

### 10.2 Process Architecture

```
┌─────────────────────────────────┐
│          Main Process           │
│  - Window management            │
│  - Save/Load (filesystem)       │
│  - IPC routing                  │
│  - Auto-save timer              │
│  - App lifecycle (close/minimize)│
├─────────────────────────────────┤
│  Worker Thread (Game Engine)    │
│  - Combat simulation            │
│  - XP/Leveling calculations     │
│  - Loot generation              │
│  - Offline simulation           │
│  - All game state               │
├─────────────────────────────────┤
│       Renderer Process          │
│  - React UI                     │
│  - Character screen             │
│  - Combat log                   │
│  - Inventory display            │
│  - Talent tree UI               │
│  - Offline summary              │
└─────────────────────────────────┘
```

### 10.3 IPC Channel Definitions

All communication between processes uses named IPC channels. Messages are typed.

```typescript
// Main <-> Renderer channels
enum MainRendererChannel {
  SAVE_GAME = "save-game",
  LOAD_GAME = "load-game",
  LIST_SAVES = "list-saves",
  DELETE_SAVE = "delete-save",
  GET_APP_VERSION = "get-app-version",
  SHOW_ERROR = "show-error",
}

// Main <-> Worker channels (via MessagePort)
enum MainWorkerChannel {
  START_ENGINE = "start-engine",
  STOP_ENGINE = "stop-engine",
  GET_GAME_STATE = "get-game-state",
  ENGINE_STATE_UPDATE = "engine-state-update",
  CALCULATE_OFFLINE = "calculate-offline",
  OFFLINE_RESULT = "offline-result",
}

// Renderer -> Main -> Worker (routed commands)
enum GameCommandChannel {
  CREATE_CHARACTER = "create-character",
  ALLOCATE_TALENT = "allocate-talent",
  RESET_TALENTS = "reset-talents",
  EQUIP_ITEM = "equip-item",
  UNEQUIP_ITEM = "unequip-item",
  SELL_ITEM = "sell-item",
  TOGGLE_SETTING = "toggle-setting",
  SET_ABILITY_PRIORITY = "set-ability-priority",
}
```

### 10.4 State Update Flow

```
Worker Thread (500ms) --> "engine-state-update" --> Main Process --> forward --> Renderer
Renderer (user action) --> "game-command" --> Main Process --> forward --> Worker Thread
```

The state update payload sent to the renderer is a diff of what changed, not the full game state, to minimize IPC overhead.

```typescript
interface StateUpdate {
  timestamp: number;
  changes: {
    character?: Partial<CharacterSave>;
    combat?: {
      playerHP: number;
      playerResource: number;
      monsterHP: number;
      monsterMaxHP: number;
      monsterName: string;
      recentLog: CombatLogEntry[];  // Last N entries since previous update
    };
    inventory?: {
      changedSlots: { index: number; item: ItemInstance | null }[];
    };
    equipped?: {
      changedSlots: { slot: GearSlot; item: ItemInstance | null }[];
    };
  };
}
```

### 10.5 Window Configuration

```typescript
interface WindowConfig {
  width: 1280;
  height: 800;
  minWidth: 1024;
  minHeight: 720;
  resizable: true;
  frame: true;                  // Native window frame (custom frame in Phase 4)
  title: "Idle MMORPG";
  icon: "assets/icon.png";
  webPreferences: {
    nodeIntegration: false;
    contextIsolation: true;
    preload: "preload.js";
  };
}
```

### 10.6 App Lifecycle

- **On Launch:** Check for save files, show main menu (New Game / Load Game / Settings)
- **On Close (X button):** Auto-save, record `lastPlayedAt`, close
- **On Minimize:** Game engine continues running in Worker Thread (true idle play)
- **On Focus Return:** No special behavior (offline only applies if the app was fully closed)

---

## 11. Data Schemas

### 11.1 Overview

All game content data lives in `data/` as JSON files. These files are the "content database" -- they define what exists in the game world. The engine code reads and validates these files at startup. Balance-tunable values live in `data/balance.json`.

### 11.2 Required Data Files for Phase 1

| File Path | Description | Schema Reference |
|-----------|-------------|-----------------|
| `data/races.json` | All 8 race definitions | Section 2.3 |
| `data/classes.json` | All 9 class definitions | Section 2.4 |
| `data/zones/zones.json` | All 12 zone definitions | Section 5.4 |
| `data/zones/monsters.json` | Monster definitions per zone | Section 4.6 |
| `data/talents/blademaster.json` | Blademaster talent trees | Section 7.6 (template) |
| `data/talents/sentinel.json` | Sentinel talent trees | (follow template) |
| `data/talents/stalker.json` | Stalker talent trees | (follow template) |
| `data/talents/shadow.json` | Shadow talent trees | (follow template) |
| `data/talents/cleric.json` | Cleric talent trees | (follow template) |
| `data/talents/arcanist.json` | Arcanist talent trees | (follow template) |
| `data/talents/summoner.json` | Summoner talent trees | (follow template) |
| `data/talents/channeler.json` | Channeler talent trees | (follow template) |
| `data/talents/shapeshifter.json` | Shapeshifter talent trees | (follow template) |
| `data/abilities/blademaster.json` | Blademaster abilities (all specs) | Section 4.4 |
| `data/abilities/sentinel.json` | Sentinel abilities | (follow pattern) |
| `data/abilities/stalker.json` | Stalker abilities | (follow pattern) |
| `data/abilities/shadow.json` | Shadow abilities | (follow pattern) |
| `data/abilities/cleric.json` | Cleric abilities | (follow pattern) |
| `data/abilities/arcanist.json` | Arcanist abilities | (follow pattern) |
| `data/abilities/summoner.json` | Summoner abilities | (follow pattern) |
| `data/abilities/channeler.json` | Channeler abilities | (follow pattern) |
| `data/abilities/shapeshifter.json` | Shapeshifter abilities | (follow pattern) |
| `data/items/starter_gear.json` | Starting equipment per class | Section 2.6 |
| `data/items/loot_tables.json` | Loot table definitions per zone level | Section 6.7 |
| `data/items/name_parts.json` | Item name generation parts (prefix, base, suffix) | See 11.3 |
| `data/balance.json` | All tunable balance parameters | See 11.4 |

### 11.3 Item Name Generation

Items are procedurally named using a template system:

```typescript
interface ItemNameParts {
  prefixes: {
    common: string[];      // "Worn", "Battered", "Crude"
    uncommon: string[];    // "Sturdy", "Fine", "Polished"
    rare: string[];        // "Masterwork", "Enchanted", "Runed"
    epic: string[];        // "Heroic", "Mythical", "Legendary"
  };
  bases: Record<GearSlot, Record<ArmorType, string[]>>;
  // Example: bases.chest.plate = ["Breastplate", "Cuirass", "Chestguard"]
  suffixes: {
    strength: string[];    // "of Might", "of Strength", "of the Bear"
    agility: string[];     // "of Agility", "of the Monkey", "of Evasion"
    intellect: string[];   // "of Intellect", "of the Eagle", "of Sorcery"
    stamina: string[];     // "of Stamina", "of the Whale", "of Fortitude"
    spirit: string[];      // "of Spirit", "of Wisdom", "of Meditation"
    mixed: string[];       // "of the Champion", "of Power", "of Glory"
  };
}

// Generated name: "[Prefix] [Base] [Suffix]"
// Example: "Enchanted Breastplate of the Bear"
```

### 11.4 Balance Configuration File

`data/balance.json` contains every tunable number in the game. The engine MUST read from this file, never hardcode values.

```typescript
interface BalanceConfig {
  // XP
  xp: {
    formulaBase: 100;           // base multiplier in xpToNextLevel
    formulaExponent: 1.65;      // exponent in xpToNextLevel
    questBonusMultiplier: 2.5;  // XP bonus for completing a quest
    levelDifferenceModifiers: {
      above5: 0;
      above3: 1.2;
      within2: 1.0;
      below5: 0.75;
      below8: 0.25;
      below8plus: 0;
    };
  };

  // Combat
  combat: {
    baseTickIntervalMs: 3000;
    uiUpdateIntervalMs: 500;
    baseMissChancePhysical: 5.0;
    baseMissChanceSpell: 4.0;
    baseCritMultiplier: 1.5;
    baseMonsterDodge: 5.0;
    deathGoldPenalty: 0.10;
    deathDurabilityLoss: 0.10;
    deathRespawnDelay: 5000;     // ms
    ragePerhit: 5;
    ragePerHitTaken: 3;
    rageDecayPerTick: 2;
    energyRegenPerTick: 10;
    energyMax: 100;
    rageMax: 100;
  };

  // Gear
  gear: {
    statBudgetMultiplier: 1.5;
    statBudgetExponent: 1.2;
    statBudgetExponentMultiplier: 0.3;
    qualityMultipliers: {
      common: 1.0;
      uncommon: 1.3;
      rare: 1.7;
      epic: 2.2;
      legendary: 3.0;
    };
    slotWeights: {
      head: 0.85;
      neck: 0.5;
      shoulders: 0.85;
      back: 0.55;
      chest: 1.0;
      wrists: 0.55;
      hands: 0.7;
      waist: 0.7;
      legs: 1.0;
      feet: 0.7;
      ring1: 0.5;
      ring2: 0.5;
      trinket1: 0.45;
      trinket2: 0.45;
      main_hand: 1.2;       // 2H; 0.75 for 1H
      off_hand: 0.6;        // Shield; 0.5 for held
    };
    dropChanceBase: 0.20;
    qualityWeights: {
      common: 45;
      uncommon: 35;
      rare: 15;
      epic: 5;
    };
    epicMinLevel: 40;
    smartLootChance: 0.60;
    primaryStatBudgetRatio: 0.70;
    secondaryStatBudgetRatio: 0.30;
  };

  // Talents
  talents: {
    firstTalentLevel: 10;
    lastTalentLevel: 60;
    tierRequirements: [0, 5, 10, 15, 20];
    respecBaseCost: 10;
    respecCostPerLevel: 10;
    respecCostGrowthPerRespec: 0.5;
  };

  // Offline
  offline: {
    maxHours: 24;
    tier1Hours: 12;
    tier1Rate: 1.0;
    tier2Hours: 6;
    tier2Rate: 0.75;
    tier3Hours: 6;
    tier3Rate: 0.50;
    maxItemQualityOffline: "rare";
    catchUpBaseMultiplier: 2.0;
    catchUpMaxMultiplier: 5.0;
    catchUpScaleFactor: 3.0;
    catchUpDurationMinutes: 30;
  };

  // Monster Scaling
  monsters: {
    hpBase: 40;
    hpPerLevel: 12;
    hpExponent: 1.4;
    hpExponentMultiplier: 3;
    damageBase: 5;
    damagePerLevel: 2.5;
    damageExponent: 1.3;
    damageExponentMultiplier: 0.8;
    armorBase: 20;
    armorPerLevel: 15;
    resistanceBase: 10;
    resistancePerLevel: 8;
    xpBase: 40;
    xpPerLevel: 15;
    xpExponent: 1.6;
    xpExponentMultiplier: 2;
    goldMinBase: 1;
    goldMinPerLevel: 0.5;
    goldMaxBase: 3;
    goldMaxPerLevel: 1.2;
  };

  // Stat Derivation
  stats: {
    attackPowerPerStr: 2;
    attackPowerPerAgi: 1;
    spellPowerPerInt: 1.5;
    critBasePercent: 5.0;
    critPerAgility: 52.0;           // AGI / this = crit%
    critRatingDivisor: 14.0;
    hasteRatingDivisor: 15.7;
    hitRatingDivisor: 15.8;
    expertiseDivisor: 15.8;
    dodgeBasePercent: 3.0;
    dodgePerAgility: 60.0;
    dodgeRatingDivisor: 18.9;
    parryBasePercent: 3.0;
    parryRatingDivisor: 22.1;
    hpPerStamina: 10;
    manaPerIntellect: 8;
    healthRegenPerSpirit: 0.5;
    manaRegenPerSpirit: 1.0;
    manaRegenPerIntellect: 0.25;
    armorPerAgility: 2;
    armorPerStamina: 0.5;
    resistancePerIntellect: 0.5;
    armorReductionConstant: 400;
    armorReductionLevelFactor: 85;
  };

  // Inventory
  inventory: {
    defaultBagSlots: 28;
    maxBags: 1;
  };

  // Save
  save: {
    autoSaveIntervalMs: 60000;
    maxSaveSlots: 3;
    maxBackupsPerSlot: 3;
  };

  // Questing
  quests: {
    killsPerQuestMin: 8;
    killsPerQuestMax: 15;
    questXPMultiplier: 2.5;
    questGearDropChance: 0.30;
  };
}
```

### 11.5 Data Validation

At application startup, the engine must validate all data files against TypeScript interfaces:

1. Load each JSON file
2. Validate against the expected interface (using a runtime validator like Zod or io-ts)
3. Cross-reference IDs (e.g., zone monster references exist in monsters.json)
4. Log warnings for missing data, fail hard on structural errors
5. Compile talent trees and verify point totals, tier requirements, and prerequisite chains

---

## 12. Acceptance Criteria

Each system has specific, testable acceptance criteria. A system is "done" when ALL of its criteria pass.

### 12.1 Electron Shell (AC-ELECTRON)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-E01 | App launches and shows main menu within 5 seconds | Manual + E2E |
| AC-E02 | Worker Thread starts and responds to ping within 1 second of engine start | Unit test |
| AC-E03 | IPC messages route correctly between Renderer, Main, and Worker | Integration test |
| AC-E04 | App saves state on window close (X button) | E2E test |
| AC-E05 | App saves state on minimize then restore (no data loss) | E2E test |
| AC-E06 | State updates reach renderer at 500ms intervals (+/- 100ms) | Performance test |
| AC-E07 | Main menu shows: New Game, Load Game (grayed if no saves), Settings | E2E test |

### 12.2 Character Creation (AC-CHAR)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-C01 | All 8 races are selectable with correct stat bonuses displayed | Unit + E2E |
| AC-C02 | All 9 classes are selectable with correct descriptions and roles | Unit + E2E |
| AC-C03 | Stat preview updates live when race/class selection changes | E2E |
| AC-C04 | Name validation rejects empty, too short (<2), too long (>16), invalid chars | Unit test |
| AC-C05 | Character is created with correct starting stats (class base + race bonus) | Unit test |
| AC-C06 | Character receives correct starting equipment for their class | Unit test |
| AC-C07 | Character is saved to selected slot and appears in Load Game list | Integration test |
| AC-C08 | All race/class combinations produce valid characters (72 combos) | Parametric unit test |

### 12.3 Combat Engine (AC-COMBAT)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-CB01 | Combat runs automatically without player input | Integration test |
| AC-CB02 | Abilities are selected according to priority list and conditions | Unit test |
| AC-CB03 | Physical damage formula matches spec (Section 4.5) within 1% | Unit test |
| AC-CB04 | Spell damage formula matches spec (Section 4.5) within 1% | Unit test |
| AC-CB05 | Healing formula matches spec (Section 4.5) within 1% | Unit test |
| AC-CB06 | Critical strikes occur at expected rate (+/- 2% over 1000 samples) | Statistical unit test |
| AC-CB07 | Miss/dodge/parry mechanics function per spec | Unit test |
| AC-CB08 | Mana regeneration matches formula (spirit-based) | Unit test |
| AC-CB09 | Energy regeneration = 10 per tick, capped at 100 | Unit test |
| AC-CB10 | Rage generation from damage dealt/taken, decay out of combat | Unit test |
| AC-CB11 | Monster death triggers XP, gold, and loot roll | Integration test |
| AC-CB12 | Player death applies 10% gold penalty and 10% durability loss | Unit test |
| AC-CB13 | Player respawns after 5 seconds at full HP/resource | Integration test |
| AC-CB14 | Combat log produces correct entries for all event types | Unit test |
| AC-CB15 | A level-appropriate monster dies in 3-5 ticks (9-15 seconds) | Balance test |
| AC-CB16 | Haste reduces effective tick interval correctly | Unit test |
| AC-CB17 | DoTs tick per combat tick, can crit independently | Unit test |

### 12.4 Leveling and XP (AC-XP)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-XP01 | XP curve formula produces correct values for all 59 levels | Unit test (table-driven) |
| AC-XP02 | Quests auto-generate and auto-complete when kill counter reaches threshold | Integration test |
| AC-XP03 | Quest completion awards bonus XP (2.5x multiplier) | Unit test |
| AC-XP04 | Level difference XP modifiers apply correctly | Unit test |
| AC-XP05 | Character auto-advances to next zone when overleveled | Integration test |
| AC-XP06 | Level-up restores HP/mana to full | Unit test |
| AC-XP07 | Level-up grants talent point at levels 10-60 | Unit test |
| AC-XP08 | Abilities unlock at correct levels per class | Unit test |
| AC-XP09 | Simulated time 1-30 is approximately 8-10 hours | Balance simulation test |
| AC-XP10 | Simulated time 1-60 is approximately 25-40 hours | Balance simulation test |
| AC-XP11 | Valeborn racial (+10% quest XP) applies correctly | Unit test |

### 12.5 Gear System (AC-GEAR)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-G01 | Items generate with correct stat budgets for their iLevel and quality | Unit test |
| AC-G02 | All 15 equipment slots accept appropriate items | Unit test |
| AC-G03 | 2H weapons lock the off-hand slot | Unit test |
| AC-G04 | Class armor restrictions enforced (e.g., Arcanist can only equip Cloth) | Unit test |
| AC-G05 | Required level prevents equipping items above player level | Unit test |
| AC-G06 | Auto-equip correctly identifies upgrades using stat weight scoring | Unit test |
| AC-G07 | Inventory holds 28 items in a single bag | Unit test |
| AC-G08 | Full inventory auto-vendors lowest-value item | Unit test |
| AC-G09 | Item comparison shows stat differences (green/red/white) | E2E test |
| AC-G10 | Item quality affects stat multiplier correctly | Unit test (parametric) |
| AC-G11 | Weapon damage scales with iLevel and quality | Unit test |
| AC-G12 | Item names generate correctly from name parts | Unit test |
| AC-G13 | Equipped gear stats are reflected in character's derived stats | Integration test |
| AC-G14 | Epic items only drop from level 40+ monsters | Unit test |
| AC-G15 | Smart loot (60% usable items) works correctly | Statistical unit test |

### 12.6 Talent System (AC-TALENT)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-T01 | Talent points are available at levels 10-60 (51 total) | Unit test |
| AC-T02 | Tier gating enforced: tier N requires N*5 points in tree (0/5/10/15/20) | Unit test |
| AC-T03 | Prerequisite nodes must be at max rank before dependent nodes unlock | Unit test |
| AC-T04 | Each node respects its max rank (1-5) | Unit test |
| AC-T05 | Respec costs the correct gold amount (formula from Section 7.5) | Unit test |
| AC-T06 | Respec refunds all points and allows reallocation | Integration test |
| AC-T07 | Stat bonus talents modify character stats correctly | Unit test |
| AC-T08 | Ability modifier talents change ability damage/cooldown correctly | Unit test |
| AC-T09 | New ability talents add the ability to the priority list | Integration test |
| AC-T10 | All 27 talent trees (9 classes x 3 specs) have valid data | Validation test |
| AC-T11 | A player cannot spend more than 51 total talent points | Unit test |
| AC-T12 | Talent state persists correctly in save file | Integration test |

### 12.7 Save/Load System (AC-SAVE)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-S01 | Save file is valid gzip-compressed JSON | Unit test |
| AC-S02 | Checksum validation detects corrupted saves | Unit test |
| AC-S03 | Corrupted save falls back to .bak file | Integration test |
| AC-S04 | Auto-save fires every 60 seconds | Integration test |
| AC-S05 | Save on level-up triggers correctly | Integration test |
| AC-S06 | Save file writes atomically (temp file then rename) | Unit test |
| AC-S07 | Load correctly restores all game state (character, inventory, talents, progression) | Integration test |
| AC-S08 | 3 save slots function independently | E2E test |
| AC-S09 | Delete save removes .sav and .bak files | Unit test |
| AC-S10 | Save format version is stored and checked on load | Unit test |
| AC-S11 | Clock manipulation is detected and handled (future timestamp clamped) | Unit test |
| AC-S12 | Save file size is under 500KB for a max-level character with full inventory | Unit test |

### 12.8 Offline Progression (AC-OFFLINE)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-O01 | Offline time calculated correctly from lastPlayedAt to now | Unit test |
| AC-O02 | Diminishing returns: 12h full, 12-18h at 75%, 18-24h at 50% | Unit test |
| AC-O03 | Offline time capped at 24 hours | Unit test |
| AC-O04 | Offline XP/gold/kills are proportional to effective hours | Unit test |
| AC-O05 | Offline loot capped at Rare quality | Unit test |
| AC-O06 | Offline leveling correctly handles multiple level-ups | Unit test |
| AC-O07 | Offline zone progression advances to correct zone | Unit test |
| AC-O08 | Return summary screen displays all offline gains | E2E test |
| AC-O09 | Catch-up multiplier applies and decays linearly over 30 minutes | Unit test |
| AC-O10 | 24h offline for a level 20 character produces reasonable gains (8-12 levels) | Balance test |
| AC-O11 | 1h offline for a level 50 character produces less than 1 level | Balance test |

### 12.9 Data Integrity (AC-DATA)

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-D01 | All data files parse without errors | Validation test |
| AC-D02 | All cross-references between data files resolve (zone -> monsters, class -> abilities) | Validation test |
| AC-D03 | Balance.json contains all expected keys with valid numeric values | Schema validation test |
| AC-D04 | Talent tree point totals are correct (each tree has exactly 25 nodes worth of ranks) | Validation test |
| AC-D05 | Talent tier requirements form a valid DAG (no circular prerequisites) | Validation test |
| AC-D06 | All 12 zones have valid level ranges that cover 1-60 without gaps | Validation test |
| AC-D07 | Monster scaling produces sane values at levels 1, 30, and 60 | Unit test |
| AC-D08 | Item stat budgets produce sane values at iLevel 1, 30, and 60 | Unit test |

---

## Appendix A: TypeScript Interface Index

All interfaces referenced in this spec must be defined in `src/shared/types/`. The following files should be created:

| File | Interfaces |
|------|-----------|
| `src/shared/types/character.ts` | Race, ClassId, Role, ResourceType, RaceDefinition, ClassDefinition, BaseStats, PrimaryStats, SecondaryStats, CharacterState |
| `src/shared/types/combat.ts` | CombatConfig, CombatLogEntry, MonsterDefinition, MonsterAbility, AbilityPriority, AbilityCondition, ActiveEffect |
| `src/shared/types/gear.ts` | GearSlot, ItemQuality, ArmorType, WeaponType, ItemDefinition, ItemInstance, LootTable, LootDrop, Inventory, InventoryBag |
| `src/shared/types/talents.ts` | TalentTree, TalentNode, TalentEffect, TalentAllocation |
| `src/shared/types/progression.ts` | ZoneDefinition, QuestSimulation, XPModifiers |
| `src/shared/types/save.ts` | SaveFile, SaveMeta, CharacterSave, ProgressionSave, InventorySave, TalentSave, CombatStateSave, SettingsSave, SaveMigration |
| `src/shared/types/offline.ts` | OfflineTime, OfflineSimulationInput, OfflineSimulationResult, CatchUpBonus |
| `src/shared/types/ipc.ts` | MainRendererChannel, MainWorkerChannel, GameCommandChannel, StateUpdate |
| `src/shared/types/balance.ts` | BalanceConfig (mirrors data/balance.json structure) |

## Appendix B: Formula Quick Reference

| Formula | Expression |
|---------|-----------|
| XP to next level | `floor(100 * level + 50 * level^1.65)` |
| Monster HP | `40 + (level * 12) + (level^1.4 * 3)` |
| Monster Damage | `5 + (level * 2.5) + (level^1.3 * 0.8)` |
| Monster XP | `40 + (level * 15) + (level^1.6 * 2)` |
| Stat budget | `floor(iLevel * 1.5 + iLevel^1.2 * 0.3)` |
| Armor reduction | `armor / (armor + 400 + 85 * attackerLevel)` |
| Crit % | `5.0 + (AGI / 52) + (critRating / 14)` |
| Attack power | `(STR * 2) + (AGI * 1) + gearAP` |
| Spell power | `(INT * 1.5) + gearSP` |
| Max HP | `(STA * 10) + classBaseHP + gearHP` |
| Max mana | `(INT * 8) + classBaseMana + gearMana` |
| Effective tick | `3000ms / (1 + haste% / 100)` |
| Respec cost | `floor(10 * level * (1 + respecCount * 0.5))` |
| Offline effective hours | `min(12, h)*1.0 + min(6, max(0, h-12))*0.75 + min(6, max(0, h-18))*0.50` |
| Catch-up multiplier | `min(5.0, 2.0 + (offlineHours/24) * 3.0)` |
| Weapon min damage | `floor((iLevel * 2 + 5) * qualityMult * (weaponSpeed / 2.0))` |
| Weapon max damage | `floor(weaponMinDamage * 1.4)` |

## Appendix C: Dependency Graph

```
Character Creation
      |
      v
  Stat System  <----  Gear System
      |                    |
      v                    v
  Combat Engine  <----- Talents
      |
      v
  XP / Leveling
      |
      v
  Zone Progression
      |
      v
  Offline Simulation
      |
      v
  Save / Load
```

Build order recommendation (respects dependencies):
1. Shared types and constants (`src/shared/`)
2. Balance config loader (`data/balance.json` + parser)
3. Stat system (primary + derived calculations)
4. Character creation (race + class + starting gear)
5. Monster definitions and scaling formulas
6. Combat engine (tick loop, ability priority, damage formulas)
7. XP and leveling (curve, quest simulation, zone progression)
8. Gear system (item generation, equip logic, inventory)
9. Talent system (tree structure, allocation, combat integration)
10. Save/Load system (serialize, compress, validate)
11. Offline simulation (statistical model, return summary)
12. Electron shell integration (IPC wiring, auto-save, window lifecycle)

---

**End of Phase 1 Specification**

*This document is the canonical reference for all Phase 1 implementation. Any discrepancies between this spec and the GDD should be resolved by consulting the GDD (`refs/IdleMMORPGDesign.pdf`) as the source of truth for game design intent, and this spec as the source of truth for implementation details.*
