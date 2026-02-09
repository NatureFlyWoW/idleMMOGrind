// ---- Races ----

export enum Race {
  Valeborn = 'valeborn',
  Stoneguard = 'stoneguard',
  Sylvani = 'sylvani',
  Bloodborn = 'bloodborn',
  Hollowed = 'hollowed',
  Tinkersoul = 'tinkersoul',
  Wildkin = 'wildkin',
  Earthborn = 'earthborn',
}

// ---- Classes ----

export enum CharacterClass {
  Blademaster = 'blademaster',
  Sentinel = 'sentinel',
  Stalker = 'stalker',
  Shadow = 'shadow',
  Cleric = 'cleric',
  Arcanist = 'arcanist',
  Summoner = 'summoner',
  Channeler = 'channeler',
  Shapeshifter = 'shapeshifter',
}

// ---- Specializations (3 per class = 27 total) ----

export enum Specialization {
  // Blademaster
  WeaponArts = 'weapon-arts',
  Berserker = 'berserker',
  Guardian = 'guardian',
  // Sentinel
  Light = 'light',
  Defender = 'defender',
  Vengeance = 'vengeance',
  // Stalker
  BeastBond = 'beast-bond',
  Precision = 'precision',
  Survival = 'survival',
  // Shadow
  Venom = 'venom',
  BladeDance = 'blade-dance',
  Stealth = 'stealth',
  // Cleric
  Order = 'order',
  Radiance = 'radiance',
  Void = 'void',
  // Arcanist
  Spellweave = 'spellweave',
  Pyromancy = 'pyromancy',
  Cryomancy = 'cryomancy',
  // Summoner
  Corruption = 'corruption',
  PactBinding = 'pact-binding',
  Chaos = 'chaos',
  // Channeler
  StormCalling = 'storm-calling',
  SpiritWeapon = 'spirit-weapon',
  Renewal = 'renewal',
  // Shapeshifter
  Astral = 'astral',
  Primal = 'primal',
  GroveWarden = 'grove-warden',
}

// ---- Primary Stats ----

export enum PrimaryStat {
  Strength = 'str',
  Agility = 'agi',
  Intellect = 'int',
  Spirit = 'spi',
  Stamina = 'sta',
}

// ---- Secondary Stats ----

export enum SecondaryStat {
  CritChance = 'crit-chance',
  CritDamage = 'crit-damage',
  Haste = 'haste',
  Armor = 'armor',
  Resistance = 'resistance',
  HitRating = 'hit-rating',
  Expertise = 'expertise',
  SpellPenetration = 'spell-penetration',
  AttackPower = 'attack-power',
  SpellPower = 'spell-power',
  HealthRegen = 'health-regen',
  ManaRegen = 'mana-regen',
}

// ---- Resource Types ----

export enum ResourceType {
  Mana = 'mana',
  Energy = 'energy',
  Rage = 'rage',
}

// ---- Gear Slots ----

export enum GearSlot {
  Head = 'head',
  Shoulders = 'shoulders',
  Chest = 'chest',
  Wrists = 'wrists',
  Hands = 'hands',
  Waist = 'waist',
  Legs = 'legs',
  Feet = 'feet',
  Neck = 'neck',
  Back = 'back',
  Ring1 = 'ring1',
  Ring2 = 'ring2',
  Trinket1 = 'trinket1',
  Trinket2 = 'trinket2',
  MainHand = 'main-hand',
  OffHand = 'off-hand',
}

// ---- Item Quality ----

export enum ItemQuality {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
}

// ---- Armor Types ----

export enum ArmorType {
  Cloth = 'cloth',
  Leather = 'leather',
  Mail = 'mail',
  Plate = 'plate',
}

// ---- Weapon Types ----

export enum WeaponType {
  Sword1H = 'sword-1h',
  Sword2H = 'sword-2h',
  Mace1H = 'mace-1h',
  Mace2H = 'mace-2h',
  Axe1H = 'axe-1h',
  Axe2H = 'axe-2h',
  Dagger = 'dagger',
  Staff = 'staff',
  Bow = 'bow',
  Crossbow = 'crossbow',
  Wand = 'wand',
  Shield = 'shield',
  OffhandHeld = 'offhand-held',
}

// ---- Ability Types ----

export enum AbilityType {
  DirectDamage = 'direct-damage',
  DamageOverTime = 'dot',
  AreaOfEffect = 'aoe',
  HealOverTime = 'hot',
  DirectHeal = 'direct-heal',
  Buff = 'buff',
  Debuff = 'debuff',
  CrowdControl = 'cc',
}

// ---- Damage Types ----

export enum DamageType {
  Physical = 'physical',
  Spell = 'spell',
  Healing = 'healing',
}

// ---- Quest Types ----

export enum QuestType {
  Kill = 'kill',
  Collection = 'collection',
  Dungeon = 'dungeon',
  Elite = 'elite',
  Attunement = 'attunement',
  Escort = 'escort',
  Exploration = 'exploration',
}

// ---- Dungeon Difficulty ----

export enum DungeonDifficulty {
  Normal = 'normal',
  Heroic = 'heroic',
}

// ---- Reputation Tier ----

export enum ReputationTier {
  Neutral = 'neutral',
  Friendly = 'friendly',
  Honored = 'honored',
  Revered = 'revered',
  Exalted = 'exalted',
}

// ---- Role ----

export enum Role {
  Tank = 'tank',
  MeleeDPS = 'melee_dps',
  RangedDPS = 'ranged_dps',
  Healer = 'healer',
}

// ---- Combat Log Entry Type ----

export enum CombatLogType {
  DamageDealt = 'damage_dealt',
  DamageTaken = 'damage_taken',
  Heal = 'heal',
  AbilityUsed = 'ability_used',
  BuffApplied = 'buff_applied',
  BuffExpired = 'buff_expired',
  DebuffApplied = 'debuff_applied',
  DebuffExpired = 'debuff_expired',
  MonsterKilled = 'monster_killed',
  PlayerDeath = 'player_death',
  XpGained = 'xp_gained',
  GoldGained = 'gold_gained',
  LootDropped = 'loot_dropped',
  LevelUp = 'level_up',
  Miss = 'miss',
  Dodge = 'dodge',
  Parry = 'parry',
  Crit = 'crit',
}

// ---- Monster Type ----

export enum MonsterType {
  Normal = 'normal',
  Elite = 'elite',
  Boss = 'boss',
}

// ---- Monster Subtypes (determines material drops) ----

export enum MonsterSubtype {
  Beast = 'beast',
  Humanoid = 'humanoid',
  Elemental = 'elemental',
  Undead = 'undead',
  Construct = 'construct',
  Dragonkin = 'dragonkin',
}

// ---- Zone Event Types ----

export enum ZoneEventType {
  MonsterSurge = 'monster_surge',
  GatheringBounty = 'gathering_bounty',
  EliteInvasion = 'elite_invasion',
  RareHunt = 'rare_hunt',
  FactionRally = 'faction_rally',
}

// ---- Profession IDs ----

export enum ProfessionId {
  // Gathering
  Mining = 'mining',
  Herbalism = 'herbalism',
  Skinning = 'skinning',
  // Crafting
  Blacksmithing = 'blacksmithing',
  Leatherworking = 'leatherworking',
  Tailoring = 'tailoring',
  Alchemy = 'alchemy',
  Enchanting = 'enchanting',
  Engineering = 'engineering',
  // Secondary
  Cooking = 'cooking',
  FirstAid = 'first_aid',
  Fishing = 'fishing',
}

// ---- Profession Type ----

export enum ProfessionType {
  Gathering = 'gathering',
  Crafting = 'crafting',
  Secondary = 'secondary',
}

// ---- Skill Bracket ----

export enum SkillBracket {
  Apprentice = 'apprentice',
  Journeyman = 'journeyman',
  Expert = 'expert',
  Artisan = 'artisan',
  Master = 'master',
  Grandmaster = 'grandmaster',
}

// ---- Recipe Difficulty Color ----

export enum RecipeDifficulty {
  Orange = 'orange',
  Yellow = 'yellow',
  Green = 'green',
  Gray = 'gray',
}

// ---- Material Tier ----

export enum MaterialTier {
  T1 = 1,
  T2 = 2,
  T3 = 3,
  T4 = 4,
  T5 = 5,
  T6 = 6,
}
