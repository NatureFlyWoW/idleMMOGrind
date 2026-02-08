# Phase 1 Implementation Plan — Combat Engine (Tasks 7-8)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Next

---

## Task 7 -- Character Creation (Race + Class + Starting Gear)

**Worktree:** `feat/combat-engine`
**Branch:** `feat/combat-engine`
**Depends on:** Tasks 2-6

### Step 7.1 -- Create races.json data file

**File: `data/races.json`**

```json
[
  {
    "id": "valeborn",
    "name": "Valeborn",
    "description": "Adaptable descendants of wandering explorers. Balanced stats make them suitable for any class.",
    "statBonuses": { "str": 2, "agi": 2, "int": 2, "spi": 2, "sta": 2 },
    "racialAbility": {
      "id": "versatile-learner",
      "name": "Versatile Learner",
      "description": "+10% Quest XP",
      "effectType": "xp_percent",
      "value": 0.10
    },
    "recommendedClasses": ["blademaster", "sentinel", "stalker", "channeler", "shapeshifter"]
  },
  {
    "id": "stoneguard",
    "name": "Stoneguard",
    "description": "Mountain-dwelling warriors carved from living stone. Built for frontline combat.",
    "statBonuses": { "str": 5, "agi": 0, "int": 0, "spi": 0, "sta": 5 },
    "racialAbility": {
      "id": "iron-skin",
      "name": "Iron Skin",
      "description": "+5% Armor value",
      "effectType": "stat_percent",
      "stat": "armor",
      "value": 0.05
    },
    "recommendedClasses": ["blademaster", "sentinel"]
  },
  {
    "id": "sylvani",
    "name": "Sylvani",
    "description": "Forest-born scholars attuned to ley lines. Excel in magic and agility.",
    "statBonuses": { "str": 0, "agi": 5, "int": 5, "spi": 0, "sta": 0 },
    "racialAbility": {
      "id": "arcane-affinity",
      "name": "Arcane Affinity",
      "description": "+5% Spell Power",
      "effectType": "stat_percent",
      "stat": "spell-power",
      "value": 0.05
    },
    "recommendedClasses": ["stalker", "arcanist", "channeler", "shapeshifter"]
  },
  {
    "id": "bloodborn",
    "name": "Bloodborn",
    "description": "War-bred berserkers with crimson veins. Pure physical damage dealers.",
    "statBonuses": { "str": 7, "agi": 0, "int": 0, "spi": 0, "sta": 3 },
    "racialAbility": {
      "id": "blood-fury",
      "name": "Blood Fury",
      "description": "+10% Physical Damage",
      "effectType": "damage_percent",
      "stat": "physical",
      "value": 0.10
    },
    "recommendedClasses": ["blademaster", "sentinel", "shadow"]
  },
  {
    "id": "hollowed",
    "name": "Hollowed",
    "description": "Undead spirits bound by ancient pacts. Immune to fear and charm effects.",
    "statBonuses": { "str": 0, "agi": 0, "int": 5, "spi": 3, "sta": 0 },
    "racialAbility": {
      "id": "spectral-ward",
      "name": "Spectral Ward",
      "description": "Immune to Fear/Charm effects",
      "effectType": "immunity",
      "value": 1
    },
    "recommendedClasses": ["cleric", "arcanist", "summoner"]
  },
  {
    "id": "tinkersoul",
    "name": "Tinkersoul",
    "description": "Gnome-like inventors powered by arcane batteries. Supreme casters.",
    "statBonuses": { "str": 0, "agi": 0, "int": 7, "spi": 3, "sta": 0 },
    "racialAbility": {
      "id": "mana-capacitor",
      "name": "Mana Capacitor",
      "description": "+5% Maximum Mana",
      "effectType": "resource_percent",
      "stat": "mana",
      "value": 0.05
    },
    "recommendedClasses": ["arcanist", "summoner", "cleric"]
  },
  {
    "id": "wildkin",
    "name": "Wildkin",
    "description": "Beast-touched nomads from untamed wilds. Fast and resilient.",
    "statBonuses": { "str": 0, "agi": 5, "int": 0, "spi": 0, "sta": 5 },
    "racialAbility": {
      "id": "feral-instinct",
      "name": "Feral Instinct",
      "description": "+3% Attack Speed",
      "effectType": "stat_percent",
      "stat": "haste",
      "value": 0.03
    },
    "recommendedClasses": ["stalker", "shadow", "shapeshifter"]
  },
  {
    "id": "earthborn",
    "name": "Earthborn",
    "description": "Stone-skinned giants from the deep earth. Unmatched survivability.",
    "statBonuses": { "str": 3, "agi": 0, "int": 0, "spi": 0, "sta": 7 },
    "racialAbility": {
      "id": "living-fortitude",
      "name": "Living Fortitude",
      "description": "+5% Maximum HP",
      "effectType": "resource_percent",
      "stat": "health",
      "value": 0.05
    },
    "recommendedClasses": ["blademaster", "sentinel", "channeler"]
  }
]
```

**Commit:** `feat(data): add races.json with all 8 race definitions`

### Step 7.2 -- Create classes.json data file

**File: `data/classes.json`**

```json
[
  {
    "id": "blademaster",
    "name": "Blademaster",
    "description": "A master of melee weapons who harnesses rage to unleash devastating attacks.",
    "primaryStats": ["str", "sta"],
    "roles": ["tank", "melee_dps"],
    "resourceType": "rage",
    "armorType": "plate",
    "weaponTypes": ["sword-1h", "sword-2h", "mace-1h", "mace-2h", "axe-1h", "axe-2h"],
    "specs": [
      { "id": "weapon-arts", "name": "Weapon Arts", "description": "Master of blade techniques, focused on sustained DPS.", "role": "melee_dps", "icon": "spec-weapon-arts" },
      { "id": "berserker", "name": "Berserker", "description": "Frenzied warrior dealing massive burst damage.", "role": "melee_dps", "icon": "spec-berserker" },
      { "id": "guardian", "name": "Guardian", "description": "Iron-willed protector who absorbs damage for allies.", "role": "tank", "icon": "spec-guardian" }
    ],
    "baseStats": { "str": 25, "agi": 15, "int": 8, "spi": 10, "sta": 22 },
    "baseHP": 120,
    "baseResource": 100,
    "statGrowth": { "str": 2.5, "agi": 1.0, "int": 0.3, "spi": 0.5, "sta": 2.0 }
  },
  {
    "id": "sentinel",
    "name": "Sentinel",
    "description": "A holy warrior who can protect, heal, or smite with divine power.",
    "primaryStats": ["str", "sta", "spi"],
    "roles": ["tank", "melee_dps", "healer"],
    "resourceType": "mana",
    "armorType": "plate",
    "weaponTypes": ["sword-1h", "mace-1h", "axe-1h", "sword-2h", "mace-2h", "shield"],
    "specs": [
      { "id": "light", "name": "Light", "description": "Channel holy light to mend wounds and protect allies.", "role": "healer", "icon": "spec-light" },
      { "id": "defender", "name": "Defender", "description": "An unbreakable shield wall, built to absorb punishment.", "role": "tank", "icon": "spec-defender" },
      { "id": "vengeance", "name": "Vengeance", "description": "Righteous fury fuels devastating holy strikes.", "role": "melee_dps", "icon": "spec-vengeance" }
    ],
    "baseStats": { "str": 22, "agi": 12, "int": 14, "spi": 16, "sta": 20 },
    "baseHP": 110,
    "baseResource": 200,
    "statGrowth": { "str": 2.0, "agi": 0.8, "int": 1.0, "spi": 1.2, "sta": 1.8 }
  },
  {
    "id": "stalker",
    "name": "Stalker",
    "description": "A cunning hunter who strikes from range with deadly precision.",
    "primaryStats": ["agi", "sta"],
    "roles": ["ranged_dps", "melee_dps"],
    "resourceType": "mana",
    "armorType": "mail",
    "weaponTypes": ["bow", "crossbow", "sword-1h", "axe-1h", "dagger"],
    "specs": [
      { "id": "beast-bond", "name": "Beast Bond", "description": "Fight alongside a bonded beast companion.", "role": "ranged_dps", "icon": "spec-beast-bond" },
      { "id": "precision", "name": "Precision", "description": "Every shot placed with surgical accuracy.", "role": "ranged_dps", "icon": "spec-precision" },
      { "id": "survival", "name": "Survival", "description": "Master of traps and close-quarters combat.", "role": "melee_dps", "icon": "spec-survival" }
    ],
    "baseStats": { "str": 12, "agi": 24, "int": 14, "spi": 12, "sta": 18 },
    "baseHP": 100,
    "baseResource": 200,
    "statGrowth": { "str": 0.8, "agi": 2.5, "int": 1.0, "spi": 0.8, "sta": 1.5 }
  },
  {
    "id": "shadow",
    "name": "Shadow",
    "description": "A deadly assassin who strikes from the darkness with poisoned blades.",
    "primaryStats": ["agi", "sta"],
    "roles": ["melee_dps"],
    "resourceType": "energy",
    "armorType": "leather",
    "weaponTypes": ["dagger", "sword-1h", "mace-1h"],
    "specs": [
      { "id": "venom", "name": "Venom", "description": "Apply deadly poisons that eat away at targets over time.", "role": "melee_dps", "icon": "spec-venom" },
      { "id": "blade-dance", "name": "Blade Dance", "description": "A whirlwind of steel, dealing rapid burst damage.", "role": "melee_dps", "icon": "spec-blade-dance" },
      { "id": "stealth", "name": "Stealth", "description": "Strike from the shadows for devastating opening attacks.", "role": "melee_dps", "icon": "spec-stealth" }
    ],
    "baseStats": { "str": 12, "agi": 26, "int": 8, "spi": 10, "sta": 16 },
    "baseHP": 90,
    "baseResource": 100,
    "statGrowth": { "str": 0.8, "agi": 2.8, "int": 0.3, "spi": 0.5, "sta": 1.2 }
  },
  {
    "id": "cleric",
    "name": "Cleric",
    "description": "A devoted priest who channels divine magic for healing or destruction.",
    "primaryStats": ["int", "spi"],
    "roles": ["healer", "ranged_dps"],
    "resourceType": "mana",
    "armorType": "cloth",
    "weaponTypes": ["staff", "mace-1h", "wand", "offhand-held"],
    "specs": [
      { "id": "order", "name": "Order", "description": "Master healer, keeping allies alive through any trial.", "role": "healer", "icon": "spec-order" },
      { "id": "radiance", "name": "Radiance", "description": "Unleash holy fire to burn enemies with sacred light.", "role": "ranged_dps", "icon": "spec-radiance" },
      { "id": "void", "name": "Void", "description": "Tap into shadow magic for damage over time and mind attacks.", "role": "ranged_dps", "icon": "spec-void" }
    ],
    "baseStats": { "str": 8, "agi": 10, "int": 24, "spi": 22, "sta": 14 },
    "baseHP": 80,
    "baseResource": 300,
    "statGrowth": { "str": 0.3, "agi": 0.5, "int": 2.2, "spi": 2.0, "sta": 1.0 }
  },
  {
    "id": "arcanist",
    "name": "Arcanist",
    "description": "A wielder of pure arcane energy, commanding fire, frost, and raw magic.",
    "primaryStats": ["int", "spi"],
    "roles": ["ranged_dps"],
    "resourceType": "mana",
    "armorType": "cloth",
    "weaponTypes": ["staff", "wand", "sword-1h", "offhand-held"],
    "specs": [
      { "id": "spellweave", "name": "Spellweave", "description": "Master of raw arcane energy, efficient and versatile.", "role": "ranged_dps", "icon": "spec-spellweave" },
      { "id": "pyromancy", "name": "Pyromancy", "description": "Unleash devastating fire spells for massive burst damage.", "role": "ranged_dps", "icon": "spec-pyromancy" },
      { "id": "cryomancy", "name": "Cryomancy", "description": "Freeze and shatter enemies with ice magic.", "role": "ranged_dps", "icon": "spec-cryomancy" }
    ],
    "baseStats": { "str": 6, "agi": 10, "int": 28, "spi": 18, "sta": 12 },
    "baseHP": 70,
    "baseResource": 350,
    "statGrowth": { "str": 0.2, "agi": 0.5, "int": 2.8, "spi": 1.5, "sta": 0.8 }
  },
  {
    "id": "summoner",
    "name": "Summoner",
    "description": "A dark caster who commands demons and curses to destroy enemies.",
    "primaryStats": ["int", "sta"],
    "roles": ["ranged_dps"],
    "resourceType": "mana",
    "armorType": "cloth",
    "weaponTypes": ["staff", "wand", "dagger", "offhand-held"],
    "specs": [
      { "id": "corruption", "name": "Corruption", "description": "Stack curses and dots that consume the enemy from within.", "role": "ranged_dps", "icon": "spec-corruption" },
      { "id": "pact-binding", "name": "Pact Binding", "description": "Empower a summoned demon to fight by your side.", "role": "ranged_dps", "icon": "spec-pact-binding" },
      { "id": "chaos", "name": "Chaos", "description": "Channel raw chaotic energy for devastating burst spells.", "role": "ranged_dps", "icon": "spec-chaos" }
    ],
    "baseStats": { "str": 8, "agi": 10, "int": 26, "spi": 16, "sta": 16 },
    "baseHP": 80,
    "baseResource": 320,
    "statGrowth": { "str": 0.3, "agi": 0.5, "int": 2.5, "spi": 1.2, "sta": 1.2 }
  },
  {
    "id": "channeler",
    "name": "Channeler",
    "description": "A versatile caster wielding the power of storms and spirits.",
    "primaryStats": ["int", "agi", "sta"],
    "roles": ["ranged_dps", "healer", "melee_dps"],
    "resourceType": "mana",
    "armorType": "mail",
    "weaponTypes": ["mace-1h", "axe-1h", "staff", "shield", "offhand-held"],
    "specs": [
      { "id": "storm-calling", "name": "Storm Calling", "description": "Command lightning and thunder to devastate enemies.", "role": "ranged_dps", "icon": "spec-storm-calling" },
      { "id": "spirit-weapon", "name": "Spirit Weapon", "description": "Imbue weapons with elemental energy for melee combat.", "role": "melee_dps", "icon": "spec-spirit-weapon" },
      { "id": "renewal", "name": "Renewal", "description": "Tap into water and earth spirits to restore life.", "role": "healer", "icon": "spec-renewal" }
    ],
    "baseStats": { "str": 14, "agi": 16, "int": 22, "spi": 14, "sta": 18 },
    "baseHP": 100,
    "baseResource": 280,
    "statGrowth": { "str": 1.0, "agi": 1.2, "int": 2.0, "spi": 1.0, "sta": 1.5 }
  },
  {
    "id": "shapeshifter",
    "name": "Shapeshifter",
    "description": "A nature-bound caster who can shift forms to tank, DPS, or heal.",
    "primaryStats": ["int", "agi", "str"],
    "roles": ["tank", "melee_dps", "healer", "ranged_dps"],
    "resourceType": "mana",
    "armorType": "leather",
    "weaponTypes": ["staff", "mace-1h", "dagger", "offhand-held"],
    "specs": [
      { "id": "astral", "name": "Astral", "description": "Harness moonlight and starfire for ranged destruction.", "role": "ranged_dps", "icon": "spec-astral" },
      { "id": "primal", "name": "Primal", "description": "Shift into beast form for savage melee and tanking.", "role": "melee_dps", "icon": "spec-primal" },
      { "id": "grove-warden", "name": "Grove Warden", "description": "Channel nature to heal wounds with regenerative magic.", "role": "healer", "icon": "spec-grove-warden" }
    ],
    "baseStats": { "str": 16, "agi": 18, "int": 20, "spi": 14, "sta": 18 },
    "baseHP": 100,
    "baseResource": 260,
    "statGrowth": { "str": 1.2, "agi": 1.5, "int": 1.8, "spi": 1.0, "sta": 1.5 }
  }
]
```

**Commit:** `feat(data): add classes.json with all 9 class definitions`

### Step 7.3 -- Write character factory tests and implementation

**Test file: `tests/unit/engine/character/character-factory.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { createCharacter } from '@engine/character/character-factory';
import { Race, CharacterClass, PrimaryStat, GearSlot } from '@shared/types/enums';

describe('createCharacter', () => {
  it('should create a level 1 character with correct name, race, and class', () => {
    const char = createCharacter({ name: 'Testchar', race: Race.Bloodborn, classId: CharacterClass.Blademaster });
    expect(char.name).toBe('Testchar');
    expect(char.race).toBe(Race.Bloodborn);
    expect(char.classId).toBe(CharacterClass.Blademaster);
    expect(char.level).toBe(1);
    expect(char.currentXP).toBe(0);
  });

  it('should compute starting stats = class base + race bonus', () => {
    // Bloodborn Blademaster: STR 25+7=32, AGI 15+0=15, INT 8+0=8, SPI 10+0=10, STA 22+3=25
    const char = createCharacter({ name: 'Test', race: Race.Bloodborn, classId: CharacterClass.Blademaster });
    expect(char.primaryStats[PrimaryStat.Strength]).toBe(32);
    expect(char.primaryStats[PrimaryStat.Agility]).toBe(15);
    expect(char.primaryStats[PrimaryStat.Intellect]).toBe(8);
    expect(char.primaryStats[PrimaryStat.Spirit]).toBe(10);
    expect(char.primaryStats[PrimaryStat.Stamina]).toBe(25);
  });

  it('should assign starting equipment for the class', () => {
    const char = createCharacter({ name: 'Test', race: Race.Valeborn, classId: CharacterClass.Blademaster });
    expect(char.equipment[GearSlot.MainHand]).not.toBeNull();
    expect(char.equipment[GearSlot.Chest]).not.toBeNull();
    expect(char.equipment[GearSlot.Head]).not.toBeNull();
  });

  it('should have a unique UUID', () => {
    const c1 = createCharacter({ name: 'A', race: Race.Valeborn, classId: CharacterClass.Cleric });
    const c2 = createCharacter({ name: 'B', race: Race.Valeborn, classId: CharacterClass.Cleric });
    expect(c1.id).not.toBe(c2.id);
  });

  it('should start with gold = 0', () => {
    const char = createCharacter({ name: 'Test', race: Race.Valeborn, classId: CharacterClass.Arcanist });
    expect(char.gold).toBe(0);
  });

  it('should start in zone_01', () => {
    const char = createCharacter({ name: 'Test', race: Race.Valeborn, classId: CharacterClass.Shadow });
    expect(char.currentZoneId).toBe('zone_01');
  });
});
```

**Implementation file: `src/engine/character/character-factory.ts`**

```typescript
import { v4 as uuidv4 } from 'crypto';
import { Race, CharacterClass, PrimaryStat, GearSlot, ItemQuality, ResourceType } from '@shared/types/enums';
import type { ICharacterCreationParams, IPrimaryStatBlock, IClassDefinition, IRaceDefinition } from '@shared/types/character';
import type { IItem } from '@shared/types/item';
import racesData from '@data/races.json';
import classesData from '@data/classes.json';

/** Internal character state (engine-owned) */
export interface ICharacterState {
  id: string;
  name: string;
  race: Race;
  classId: CharacterClass;
  level: number;
  currentXP: number;
  gold: number;
  primaryStats: IPrimaryStatBlock;
  currentHP: number;
  maxHP: number;
  currentResource: number;
  maxResource: number;
  resourceType: ResourceType;
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  currentZoneId: string;
  deathCount: number;
  totalKills: number;
  totalQuestsCompleted: number;
  respecCount: number;
  playTimeSeconds: number;
}

export function getRaceDefinition(race: Race): IRaceDefinition {
  const def = (racesData as IRaceDefinition[]).find(r => r.id === race);
  if (!def) throw new Error(`Unknown race: ${race}`);
  return def;
}

export function getClassDefinition(classId: CharacterClass): IClassDefinition {
  const def = (classesData as unknown as IClassDefinition[]).find(c => c.id === classId);
  if (!def) throw new Error(`Unknown class: ${classId}`);
  return def;
}

function createStarterItem(
  name: string,
  slot: GearSlot,
  primaryStat: PrimaryStat,
): IItem {
  return {
    id: crypto.randomUUID(),
    templateId: `starter-${slot}`,
    name,
    slot,
    quality: ItemQuality.Common,
    iLevel: 1,
    requiredLevel: 1,
    primaryStats: { [primaryStat]: 1, [PrimaryStat.Stamina]: 1 },
    secondaryStats: {},
    durability: { current: 100, max: 100 },
    sellValue: 1,
  };
}

function getStarterGear(classDef: IClassDefinition): Partial<Record<GearSlot, IItem>> {
  const mainStat = classDef.primaryStats[0] as PrimaryStat;
  const armorPrefix = classDef.armorType === 'plate' ? 'Battered Plate'
    : classDef.armorType === 'mail' ? 'Worn Mail'
    : classDef.armorType === 'leather' ? 'Worn Leather'
    : 'Threadbare Cloth';

  const gear: Partial<Record<GearSlot, IItem>> = {
    [GearSlot.Head]: createStarterItem(`${armorPrefix} Helm`, GearSlot.Head, mainStat),
    [GearSlot.Chest]: createStarterItem(`${armorPrefix} Chestpiece`, GearSlot.Chest, mainStat),
    [GearSlot.Legs]: createStarterItem(`${armorPrefix} Leggings`, GearSlot.Legs, mainStat),
    [GearSlot.Feet]: createStarterItem(`${armorPrefix} Boots`, GearSlot.Feet, mainStat),
    [GearSlot.Hands]: createStarterItem(`${armorPrefix} Gloves`, GearSlot.Hands, mainStat),
  };

  // Add weapon based on class
  const weaponType = classDef.weaponTypes[0]!;
  const is2H = weaponType.includes('2h') || weaponType === 'staff' || weaponType === 'bow' || weaponType === 'crossbow';

  const weapon: IItem = {
    id: crypto.randomUUID(),
    templateId: `starter-weapon`,
    name: `Worn ${classDef.name} Weapon`,
    slot: GearSlot.MainHand,
    quality: ItemQuality.Common,
    iLevel: 1,
    requiredLevel: 1,
    weaponType,
    primaryStats: { [mainStat]: 1 },
    secondaryStats: {},
    weaponDamage: { min: is2H ? 5 : 3, max: is2H ? 8 : 5 },
    weaponSpeed: is2H ? 3.0 : 2.0,
    durability: { current: 100, max: 100 },
    sellValue: 1,
  };

  gear[GearSlot.MainHand] = weapon;

  return gear;
}

export function createCharacter(params: ICharacterCreationParams): ICharacterState {
  const raceDef = getRaceDefinition(params.race);
  const classDef = getClassDefinition(params.classId);

  const primaryStats: IPrimaryStatBlock = {
    [PrimaryStat.Strength]: classDef.baseStats[PrimaryStat.Strength] + raceDef.statBonuses[PrimaryStat.Strength],
    [PrimaryStat.Agility]: classDef.baseStats[PrimaryStat.Agility] + raceDef.statBonuses[PrimaryStat.Agility],
    [PrimaryStat.Intellect]: classDef.baseStats[PrimaryStat.Intellect] + raceDef.statBonuses[PrimaryStat.Intellect],
    [PrimaryStat.Spirit]: classDef.baseStats[PrimaryStat.Spirit] + raceDef.statBonuses[PrimaryStat.Spirit],
    [PrimaryStat.Stamina]: classDef.baseStats[PrimaryStat.Stamina] + raceDef.statBonuses[PrimaryStat.Stamina],
  };

  const maxHP = primaryStats[PrimaryStat.Stamina] * 10 + classDef.baseHP;

  return {
    id: crypto.randomUUID(),
    name: params.name,
    race: params.race,
    classId: params.classId,
    level: 1,
    currentXP: 0,
    gold: 0,
    primaryStats,
    currentHP: maxHP,
    maxHP,
    currentResource: classDef.resourceType === ResourceType.Rage ? 0 : classDef.baseResource,
    maxResource: classDef.resourceType === ResourceType.Rage ? 100 : classDef.baseResource,
    resourceType: classDef.resourceType as ResourceType,
    equipment: getStarterGear(classDef),
    inventory: new Array(28).fill(null),
    currentZoneId: 'zone_01',
    deathCount: 0,
    totalKills: 0,
    totalQuestsCompleted: 0,
    respecCount: 0,
    playTimeSeconds: 0,
  };
}
```

Note: For `crypto.randomUUID()`, this is available in Node.js 19+ natively. If running in an older Node, install `uuid` package instead and use `import { v4 as uuidv4 } from 'uuid'`.

**Run:** `pnpm test -- tests/unit/engine/character/character-factory.test.ts` -- should PASS.

**Commit:** `feat(engine): add character factory with starting stats and gear`

---

## Task 8 -- Combat Engine (Damage Formulas + Ability Priority)

**Worktree:** `feat/combat-engine` (continues)
**Depends on:** Tasks 5, 6, 7

### Step 8.1 -- Write combat formula tests

**File: `tests/unit/engine/combat/formulas.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculatePhysicalDamage,
  calculateSpellDamage,
  calculateHealing,
} from '@engine/combat/formulas';
import { SeededRandom } from '@shared/utils/rng';
import { DamageType } from '@shared/types/enums';

describe('calculatePhysicalDamage', () => {
  it('should deal damage when hit lands', () => {
    const rng = new SeededRandom(42);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 50,
      weaponDamageMax: 100,
      attackPower: 200,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0.2,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThan(0);
    expect(result.type).toBe(DamageType.Physical);
  });

  it('should return miss when hit check fails', () => {
    const rng = new SeededRandom(42);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 50,
      weaponDamageMax: 100,
      attackPower: 200,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 0,
      rng,
    });
    expect(result.amount).toBe(0);
    expect(result.type).toBe(DamageType.Physical);
    expect(result.isCrit).toBe(false);
  });

  it('should apply armor reduction', () => {
    const rng = new SeededRandom(99);
    const noArmor = calculatePhysicalDamage({
      weaponDamageMin: 100, weaponDamageMax: 100,
      attackPower: 100, weaponSpeed: 2.0,
      abilityCoefficient: 1.0, abilityFlatBonus: 0,
      critChance: 0, critMultiplier: 0.5,
      armorReduction: 0, hitChance: 1.0, rng,
    });
    const rng2 = new SeededRandom(99);
    const withArmor = calculatePhysicalDamage({
      weaponDamageMin: 100, weaponDamageMax: 100,
      attackPower: 100, weaponSpeed: 2.0,
      abilityCoefficient: 1.0, abilityFlatBonus: 0,
      critChance: 0, critMultiplier: 0.5,
      armorReduction: 0.3, hitChance: 1.0, rng: rng2,
    });
    expect(withArmor.amount).toBeLessThan(noArmor.amount);
  });

  it('should never deal less than 1 damage on a hit', () => {
    const rng = new SeededRandom(1);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 1, weaponDamageMax: 1,
      attackPower: 0, weaponSpeed: 2.0,
      abilityCoefficient: 1.0, abilityFlatBonus: 0,
      critChance: 0, critMultiplier: 0.5,
      armorReduction: 0.99, hitChance: 1.0, rng,
    });
    expect(result.amount).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateSpellDamage', () => {
  it('should deal spell damage when hit lands', () => {
    const rng = new SeededRandom(42);
    const result = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 150,
      spellCoefficient: 0.8,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0.1,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThan(0);
    expect(result.type).toBe(DamageType.Spell);
  });
});

describe('calculateHealing', () => {
  it('should produce positive healing', () => {
    const rng = new SeededRandom(42);
    const result = calculateHealing({
      baseHeal: 200,
      spellPower: 100,
      healCoefficient: 0.5,
      critChance: 0,
      critMultiplier: 0.5,
      rng,
    });
    expect(result.amount).toBeGreaterThan(200);
    expect(result.type).toBe(DamageType.Healing);
  });
});
```

### Step 8.2 -- Implement combat formulas

**File: `src/engine/combat/formulas.ts`**

```typescript
import { DamageType } from '@shared/types/enums';
import type { IDamageResult } from '@shared/types/combat';
import type { SeededRandom } from '@shared/utils/rng';

export interface IPhysicalDamageParams {
  weaponDamageMin: number;
  weaponDamageMax: number;
  attackPower: number;
  weaponSpeed: number;
  abilityCoefficient: number;
  abilityFlatBonus: number;
  critChance: number;
  critMultiplier: number;
  armorReduction: number;
  hitChance: number;
  rng: SeededRandom;
}

/**
 * Calculate physical damage.
 * baseDamage = weaponDmg + (AP / 14) * weaponSpeed
 * abilityDamage = baseDamage * coefficient + flatBonus
 * Apply crit, armor reduction.
 */
export function calculatePhysicalDamage(params: IPhysicalDamageParams): IDamageResult {
  const { rng } = params;

  // Hit check
  if (!rng.chance(params.hitChance)) {
    return { amount: 0, type: DamageType.Physical, isCrit: false };
  }

  // Roll weapon damage
  const weaponDmg = rng.nextInt(params.weaponDamageMin, params.weaponDamageMax);
  const baseDamage = weaponDmg + (params.attackPower / 14) * params.weaponSpeed;
  let abilityDamage = baseDamage * params.abilityCoefficient + params.abilityFlatBonus;

  // Crit check
  const isCrit = rng.chance(params.critChance);
  if (isCrit) {
    abilityDamage *= (1 + params.critMultiplier);
  }

  // Armor reduction
  abilityDamage *= (1 - params.armorReduction);

  return {
    amount: Math.max(1, Math.round(abilityDamage)),
    type: DamageType.Physical,
    isCrit,
  };
}

export interface ISpellDamageParams {
  baseDamage: number;
  spellPower: number;
  spellCoefficient: number;
  critChance: number;
  critMultiplier: number;
  resistReduction: number;
  hitChance: number;
  rng: SeededRandom;
}

/**
 * Calculate spell damage.
 * damage = baseDamage + (spellPower * coefficient)
 * Apply crit, resistance reduction.
 */
export function calculateSpellDamage(params: ISpellDamageParams): IDamageResult {
  const { rng } = params;

  if (!rng.chance(params.hitChance)) {
    return { amount: 0, type: DamageType.Spell, isCrit: false };
  }

  let damage = params.baseDamage + params.spellPower * params.spellCoefficient;

  const isCrit = rng.chance(params.critChance);
  if (isCrit) {
    damage *= (1 + params.critMultiplier);
  }

  damage *= (1 - params.resistReduction);

  return {
    amount: Math.max(1, Math.round(damage)),
    type: DamageType.Spell,
    isCrit,
  };
}

export interface IHealingParams {
  baseHeal: number;
  spellPower: number;
  healCoefficient: number;
  critChance: number;
  critMultiplier: number;
  rng: SeededRandom;
}

/**
 * Calculate healing.
 * heal = baseHeal + (spellPower * coefficient)
 * Apply crit. No miss check on heals.
 */
export function calculateHealing(params: IHealingParams): IDamageResult {
  const { rng } = params;

  let healing = params.baseHeal + params.spellPower * params.healCoefficient;

  const isCrit = rng.chance(params.critChance);
  if (isCrit) {
    healing *= (1 + params.critMultiplier);
  }

  return {
    amount: Math.max(1, Math.round(healing)),
    type: DamageType.Healing,
    isCrit,
  };
}
```

**Run:** `pnpm test -- tests/unit/engine/combat/formulas.test.ts` -- should PASS.

**Commit:** `feat(combat): add damage and healing formula implementations with tests`

### Step 8.3 -- Write and implement ability priority system

**Test file: `tests/unit/engine/combat/ability-priority.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { selectNextAbility } from '@engine/combat/ability-priority';
import type { IAbilityPriorityEntry } from '@engine/combat/ability-priority';
import { ResourceType } from '@shared/types/enums';

describe('selectNextAbility', () => {
  const basePriority: IAbilityPriorityEntry[] = [
    {
      abilityId: 'execute',
      enabled: true,
      conditions: [{ type: 'target_health_below', percent: 20 }],
    },
    {
      abilityId: 'mortal-strike',
      enabled: true,
      conditions: [{ type: 'always' }],
    },
    {
      abilityId: 'heroic-strike',
      enabled: true,
      conditions: [{ type: 'resource_above', resource: ResourceType.Rage, percent: 60 }],
    },
  ];

  it('should select execute when target HP is below 20%', () => {
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 10, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('execute');
  });

  it('should skip execute and select mortal-strike when target HP is above 20%', () => {
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('mortal-strike');
  });

  it('should skip abilities on cooldown', () => {
    const cooldowns = new Map<string, number>();
    cooldowns.set('mortal-strike', 3);
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      cooldowns,
    );
    expect(result).toBe('heroic-strike');
  });

  it('should return null when no abilities are usable', () => {
    const cooldowns = new Map<string, number>();
    cooldowns.set('execute', 1);
    cooldowns.set('mortal-strike', 1);
    cooldowns.set('heroic-strike', 1);
    const result = selectNextAbility(
      basePriority,
      { currentResource: 10, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      cooldowns,
    );
    expect(result).toBeNull();
  });

  it('should skip disabled abilities', () => {
    const priorities: IAbilityPriorityEntry[] = [
      { abilityId: 'disabled-ability', enabled: false, conditions: [{ type: 'always' }] },
      { abilityId: 'active-ability', enabled: true, conditions: [{ type: 'always' }] },
    ];
    const result = selectNextAbility(
      priorities,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 50, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('active-ability');
  });
});
```

**Implementation file: `src/engine/combat/ability-priority.ts`**

```typescript
import { ResourceType } from '@shared/types/enums';

export type AbilityCondition =
  | { type: 'resource_above'; resource: ResourceType; percent: number }
  | { type: 'resource_below'; resource: ResourceType; percent: number }
  | { type: 'target_health_below'; percent: number }
  | { type: 'target_health_above'; percent: number }
  | { type: 'buff_missing'; buffId: string }
  | { type: 'debuff_missing_on_target'; debuffId: string }
  | { type: 'cooldown_ready' }
  | { type: 'always' };

export interface IAbilityPriorityEntry {
  abilityId: string;
  enabled: boolean;
  conditions: AbilityCondition[];
}

interface ICombatantState {
  currentResource: number;
  maxResource: number;
  currentHP: number;
  maxHP: number;
}

interface ITargetState {
  currentHP: number;
  maxHP: number;
}

function meetsCondition(
  condition: AbilityCondition,
  character: ICombatantState,
  target: ITargetState,
): boolean {
  switch (condition.type) {
    case 'always':
      return true;
    case 'target_health_below':
      return (target.currentHP / target.maxHP) * 100 < condition.percent;
    case 'target_health_above':
      return (target.currentHP / target.maxHP) * 100 > condition.percent;
    case 'resource_above':
      return (character.currentResource / character.maxResource) * 100 > condition.percent;
    case 'resource_below':
      return (character.currentResource / character.maxResource) * 100 < condition.percent;
    case 'buff_missing':
      return true; // Simplified for Phase 1 -- buff tracking handled by combat system
    case 'debuff_missing_on_target':
      return true; // Simplified for Phase 1
    case 'cooldown_ready':
      return true; // Cooldown check is done externally before this
    default:
      return false;
  }
}

/**
 * Evaluate the ability priority list and return the first usable ability ID,
 * or null if no abilities can be used.
 */
export function selectNextAbility(
  priorities: IAbilityPriorityEntry[],
  character: ICombatantState,
  target: ITargetState,
  cooldowns: Map<string, number>,
): string | null {
  for (const entry of priorities) {
    if (!entry.enabled) continue;
    if (cooldowns.has(entry.abilityId) && (cooldowns.get(entry.abilityId) ?? 0) > 0) continue;
    if (entry.conditions.every(c => meetsCondition(c, character, target))) {
      return entry.abilityId;
    }
  }
  return null;
}
```

**Run:** `pnpm test -- tests/unit/engine/combat/ability-priority.test.ts` -- should PASS.

**Commit:** `feat(combat): add ability priority system with condition evaluation`

### Step 8.4 -- Write EventBus and GameSystem interface

**File: `src/engine/events/event-bus.ts`**

```typescript
import type { EngineEventType } from '@shared/types/ipc';

export interface IGameEvent<T = unknown> {
  type: EngineEventType;
  payload: T;
}

export class EventBus {
  private queue: IGameEvent[] = [];

  emit<T>(type: EngineEventType, payload: T): void {
    this.queue.push({ type, payload });
  }

  drain(): IGameEvent[] {
    const events = this.queue;
    this.queue = [];
    return events;
  }

  get pending(): number {
    return this.queue.length;
  }
}
```

**File: `src/engine/systems/game-system.ts`**

```typescript
export interface IGameSystem {
  update(state: unknown, deltaMs: number): void;
}
```

**Commit:** `feat(engine): add EventBus and GameSystem interface`

---

