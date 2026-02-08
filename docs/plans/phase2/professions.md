# Phase 2 Design Brief -- Profession System

## Overview

Professions give players a parallel progression track alongside combat leveling. They serve three purposes: (1) provide a deterministic gear acquisition path alongside RNG drops, (2) create a material economy that ties zone content to crafting output, and (3) add depth to the idle loop by giving the engine something productive to do with downtime between combat encounters.

## Player Motivation

- **Progression** -- Profession skill 1-300 is its own leveling curve with recipe unlocks
- **Deterministic gearing** -- Craft specific items instead of hoping for drops
- **Alt synergy** -- Different profession pairs on alts create a self-sufficient account
- **Collection** -- Rare recipes from reputation vendors and world drops

## How Professions Work Idle-Style

### Gathering (Passive)

Gathering professions produce materials automatically while the character is in a zone:
- Materials gathered scale with zone level and profession skill
- Gathering rate: 1 material per ~30 seconds of game time (tunable in balance.json)
- Higher profession skill unlocks higher-tier materials in the same zone
- Gathering occurs alongside combat -- no exclusive "gathering mode" needed

### Crafting (Active Decision, Idle Execution)

Crafting requires player input to select a recipe, then executes automatically:
- Player selects recipe from known recipes
- If materials are available, crafting begins
- Craft time: 5-30 seconds per item (scales with recipe complexity)
- Queue system: player can queue up to 10 crafts
- Output goes to inventory (auto-equipped if upgrade + auto-equip enabled)

### Skill Progression

- Skill range: 1-300
- Recipes have a skill color system (like WoW):
  - **Orange** (100% skill-up): Recipe is at the edge of your ability
  - **Yellow** (75% skill-up): Moderate challenge
  - **Green** (25% skill-up): Easy for your skill level
  - **Gray** (0% skill-up): Trivial, no skill gain

Skill brackets divide the 300 points into 6 tiers matching zone level ranges:

| Bracket | Skill Range | Zone Equivalent | Trainer Required |
|---------|-------------|-----------------|-----------------|
| Apprentice | 1-50 | Levels 1-10 | Starting trainer |
| Journeyman | 51-100 | Levels 11-20 | Level 10 trainer |
| Expert | 101-150 | Levels 21-30 | Level 20 trainer |
| Artisan | 151-200 | Levels 31-40 | Level 30 trainer |
| Master | 201-250 | Levels 41-50 | Level 40 trainer |
| Grandmaster | 251-300 | Levels 51-60 | Level 50 trainer |

Training costs gold and requires the character to be at the appropriate level.

## Profession Definitions

### Gathering Professions (3)

| ID | Name | Output | Pairs With | Gathering Source |
|----|------|--------|-----------|-----------------|
| prof_mining | Mining | Ore, Stone, Gems | Blacksmithing, Engineering | Zone mineral nodes (all zones) |
| prof_herbalism | Herbalism | Herbs, Reagents | Alchemy | Zone herb nodes (all zones) |
| prof_skinning | Skinning | Leather, Hides, Scales | Leatherworking | Beast-type monster kills |

Note: Skinning is unique -- it triggers on beast-type monster kills rather than passive node gathering. This means it synergizes with combat grinding.

### Crafting Professions (6)

| ID | Name | Creates | Primary Stat Focus |
|----|------|---------|-------------------|
| prof_blacksmithing | Blacksmithing | Plate armor, melee weapons | STR, STA |
| prof_leatherworking | Leatherworking | Leather + mail armor | AGI, STA |
| prof_tailoring | Tailoring | Cloth armor | INT, SPI |
| prof_alchemy | Alchemy | Potions, elixirs, flasks | Consumable buffs |
| prof_enchanting | Enchanting | Gear enchantments | Stat bonuses on existing gear |
| prof_engineering | Engineering | Gadgets, bombs, trinkets | Unique effects |

### Secondary Professions (3)

All characters learn all three (no slot limit):

| ID | Name | Creates | Idle Integration |
|----|------|---------|-----------------|
| prof_cooking | Cooking | Food buffs (well-fed bonus) | Uses meat from beast kills + vendor ingredients |
| prof_firstaid | First Aid | Bandages (heal between fights) | Uses cloth from humanoid kills |
| prof_fishing | Fishing | Fish (cooking ingredients), rare catches | Idle activity in water-adjacent zones |

## Material System

### Material Tiers

Materials come in 6 tiers matching profession skill brackets:

| Tier | Skill Range | Example (Mining) | Example (Herbalism) | Example (Skinning) |
|------|-------------|-----------------|--------------------|--------------------|
| T1 | 1-50 | Copper Ore | Peacebloom | Light Leather |
| T2 | 51-100 | Tin Ore | Briarthorn | Medium Leather |
| T3 | 101-150 | Iron Ore | Fadeleaf | Heavy Leather |
| T4 | 151-200 | Mithril Ore | Goldthorn | Thick Leather |
| T5 | 201-250 | Thorium Ore | Dreamfoil | Rugged Leather |
| T6 | 251-300 | Arcanite Ore | Black Lotus | Pristine Leather |

### Material Storage

**OPEN: Should materials use inventory bag space, or have a separate material bank?**

Proposed: Separate material bank with 100 slots. Materials stack to 200. This prevents profession materials from competing with gear for bag space, which would be frustrating in an idle game where the player is not constantly managing inventory.

### Material Sources

- **Gathering professions** -- Primary source, passive generation
- **Monster drops** -- Cloth from humanoids, meat from beasts, reagents from elementals
- **Dungeon bosses** -- Rare crafting materials (used in high-end recipes)
- **Vendor purchase** -- Basic reagents and vendor materials (thread, flux, vials)

## Recipe System

### Recipe Acquisition

| Source | Recipe Quality | Example |
|--------|--------------|---------|
| Trainer | Common recipes at skill thresholds | Copper Breastplate (skill 1) |
| World drop | Uncommon recipes from zone monsters | Green Leather Vest pattern |
| Dungeon drop | Rare recipes from dungeon bosses | Plans: Enchanted Thorium Breastplate |
| Reputation vendor | Rare/Epic recipes at Honored/Revered | Formula: Enchant Weapon - Crusader |
| Quest reward | Specific recipes from profession quest chains | Recipe: Flask of the Titans |

### Recipe Structure

```
recipe: {
  id: string,
  professionId: string,
  name: string,
  skillRequired: number,
  skillCategory: "orange" | "yellow" | "green" | "gray",  // computed at runtime
  materials: [{ materialId: string, quantity: number }],
  craftTimeMs: number,
  output: {
    type: "item" | "consumable" | "enchantment",
    itemTemplateId?: string,   // for gear
    consumableEffect?: {...},  // for potions/food
    enchantEffect?: {...},     // for enchanting
    quantity: number
  }
}
```

### Recipe Progression

Each profession has ~50-60 recipes spread across 300 skill points:
- T1 (1-50): 8-10 recipes -- basic items, learning the system
- T2 (51-100): 8-10 recipes -- first useful gear for alts
- T3 (101-150): 8-10 recipes -- competitive with quest rewards
- T4 (151-200): 8-10 recipes -- competitive with dungeon drops
- T5 (201-250): 8-10 recipes -- endgame-viable
- T6 (251-300): 6-8 recipes -- best crafted gear, requires dungeon materials

## Crafted Gear Balance (Open Question #5 in index.md)

**Proposed approach: Crafted gear as reliable catch-up, not best-in-slot.**

| Source | Quality | iLevel Range | Notes |
|--------|---------|-------------|-------|
| Quest rewards | Common-Uncommon | level-appropriate | Guaranteed through questing |
| Crafted gear | Uncommon-Rare | level-appropriate to +2 | Deterministic, slightly better than quests |
| Dungeon drops | Rare | level +3 to +5 | RNG but higher ceiling |
| Heroic dungeon | Rare-Epic | 60-70 | Best pre-raid |
| High-end crafted (300 skill) | Rare-Epic | 60-65 | Fills slots before heroic farming |
| Raid drops | Epic-Legendary | 71-90 | Best in slot |

This makes professions valuable for: filling weak slots, gearing alts quickly, and providing consumable buffs (alchemy/cooking) that are always relevant.

## Profession-Specific Mechanics

### Enchanting

Enchanting is unique: it does not create items, it modifies existing gear.
- **Disenchant**: Destroy an Uncommon+ item to get enchanting materials
- **Enchant**: Apply a permanent stat bonus to an equipped item
- Each gear slot can have 1 enchant
- Enchants persist through gear changes (applied to the slot, not the item? Or the item?)

**OPEN: Enchant on item or on slot? Item-based is more traditional but means re-enchanting on every gear upgrade. Slot-based is more idle-friendly.**

### Engineering

Engineering creates unique items not available elsewhere:
- Bombs: Single-use AoE damage items (useful in dungeons)
- Gadgets: Trinket-slot items with unique proc effects
- Tools: Quality-of-life items (repair bot, mailbox, etc.)

### Alchemy

Alchemy creates consumable buffs:
- **Potions**: Instant effect, 1-use (healing, mana, damage boost)
- **Elixirs**: 30-minute buff, 1 battle elixir + 1 guardian elixir active
- **Flasks**: 60-minute buff, replaces both elixir slots, more powerful

Consumable buffs are significant for dungeon/raid success rates (+5-15% effective power).

## New Engine Systems

### Profession Manager

Core engine module:
- Tracks profession skill levels and known recipes
- Manages material inventory (separate from gear inventory)
- Processes gathering ticks (integrated with game loop)
- Executes crafting queue
- Emits events: `material_gathered`, `recipe_learned`, `item_crafted`, `skill_up`

### Gathering Integration

Gathering hooks into the existing game loop:
- Every N combat ticks, if character has a gathering profession, roll for material
- Material type determined by zone and profession skill
- Yield modified by gathering profession skill (higher skill = chance at bonus materials)

### Crafting Queue

Simple FIFO queue:
- Player adds recipes to queue (max 10)
- Engine processes one craft per craft-time interval
- On completion: output to inventory, skill-up check, advance queue

## Data Files

| File | Contents |
|------|----------|
| `data/professions/definitions.json` | 12 profession definitions (id, name, type, skill brackets) |
| `data/professions/recipes/*.json` | Per-profession recipe files (50-60 recipes each) |
| `data/materials.json` | All material definitions (id, name, tier, stackSize, vendorPrice) |

## Save File Additions

```typescript
// Added to ISaveData
professions: {
  primary: [
    { professionId: string, skill: number, knownRecipes: string[] },
    { professionId: string, skill: number, knownRecipes: string[] }
  ],
  secondary: [
    { professionId: string, skill: number, knownRecipes: string[] },
    { professionId: string, skill: number, knownRecipes: string[] },
    { professionId: string, skill: number, knownRecipes: string[] }
  ],
  materialBank: { materialId: string, quantity: number }[],
  craftingQueue: { recipeId: string, startedAt: number }[]
}
```

## Balance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Skill 1-300 total time | 15-20 hours | Should roughly track leveling pace |
| Material gathering rate | 1 per 30s base, up to 1 per 15s at max skill | Steady trickle, not overwhelming |
| Craft time per item | 5-30s | Fast enough to feel productive |
| Recipes per tier | 8-10 | Enough variety without overwhelming |
| Material bank slots | 100 | Generous enough to not feel punishing |
| Crafted gear iLevel vs drop | -2 to 0 iLevel vs equivalent dungeon drops | Useful but not mandatory |

## Future Considerations

- **Specializations** within professions (e.g., Armorsmith vs Weaponsmith for Blacksmithing)
- **Discovery system** for hidden recipes through experimentation
- **Work orders** from NPCs providing bonus rewards for specific crafts
- **Profession-specific gathering tools** that improve yields
- **Cross-character profession synergy** UI in Phase 3 (alt system)
