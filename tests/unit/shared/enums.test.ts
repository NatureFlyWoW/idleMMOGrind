import { describe, it, expect } from 'vitest';
import {
  Race,
  CharacterClass,
  Specialization,
  PrimaryStat,
  SecondaryStat,
  ResourceType,
  GearSlot,
  ItemQuality,
  AbilityType,
  QuestType,
  DungeonDifficulty,
  ReputationTier,
  ArmorType,
  WeaponType,
  DamageType,
  Role,
  CombatLogType,
  MonsterType,
} from '@shared/types/enums';

// ---- Race ----

describe('Race enum', () => {
  it('should have exactly 8 races', () => {
    expect(Object.values(Race)).toHaveLength(8);
  });

  it('should contain all expected races', () => {
    expect(Race.Valeborn).toBe('valeborn');
    expect(Race.Stoneguard).toBe('stoneguard');
    expect(Race.Sylvani).toBe('sylvani');
    expect(Race.Bloodborn).toBe('bloodborn');
    expect(Race.Hollowed).toBe('hollowed');
    expect(Race.Tinkersoul).toBe('tinkersoul');
    expect(Race.Wildkin).toBe('wildkin');
    expect(Race.Earthborn).toBe('earthborn');
  });
});

// ---- CharacterClass ----

describe('CharacterClass enum', () => {
  it('should have exactly 9 classes', () => {
    expect(Object.values(CharacterClass)).toHaveLength(9);
  });

  it('should contain all expected classes', () => {
    expect(CharacterClass.Blademaster).toBe('blademaster');
    expect(CharacterClass.Sentinel).toBe('sentinel');
    expect(CharacterClass.Stalker).toBe('stalker');
    expect(CharacterClass.Shadow).toBe('shadow');
    expect(CharacterClass.Cleric).toBe('cleric');
    expect(CharacterClass.Arcanist).toBe('arcanist');
    expect(CharacterClass.Summoner).toBe('summoner');
    expect(CharacterClass.Channeler).toBe('channeler');
    expect(CharacterClass.Shapeshifter).toBe('shapeshifter');
  });
});

// ---- Specialization ----

describe('Specialization enum', () => {
  it('should have exactly 27 specializations (3 per class)', () => {
    expect(Object.values(Specialization)).toHaveLength(27);
  });

  it('should contain Blademaster specs', () => {
    expect(Specialization.WeaponArts).toBe('weapon-arts');
    expect(Specialization.Berserker).toBe('berserker');
    expect(Specialization.Guardian).toBe('guardian');
  });

  it('should contain Sentinel specs', () => {
    expect(Specialization.Light).toBe('light');
    expect(Specialization.Defender).toBe('defender');
    expect(Specialization.Vengeance).toBe('vengeance');
  });

  it('should contain Stalker specs', () => {
    expect(Specialization.BeastBond).toBe('beast-bond');
    expect(Specialization.Precision).toBe('precision');
    expect(Specialization.Survival).toBe('survival');
  });

  it('should contain Shadow specs', () => {
    expect(Specialization.Venom).toBe('venom');
    expect(Specialization.BladeDance).toBe('blade-dance');
    expect(Specialization.Stealth).toBe('stealth');
  });

  it('should contain Cleric specs', () => {
    expect(Specialization.Order).toBe('order');
    expect(Specialization.Radiance).toBe('radiance');
    expect(Specialization.Void).toBe('void');
  });

  it('should contain Arcanist specs', () => {
    expect(Specialization.Spellweave).toBe('spellweave');
    expect(Specialization.Pyromancy).toBe('pyromancy');
    expect(Specialization.Cryomancy).toBe('cryomancy');
  });

  it('should contain Summoner specs', () => {
    expect(Specialization.Corruption).toBe('corruption');
    expect(Specialization.PactBinding).toBe('pact-binding');
    expect(Specialization.Chaos).toBe('chaos');
  });

  it('should contain Channeler specs', () => {
    expect(Specialization.StormCalling).toBe('storm-calling');
    expect(Specialization.SpiritWeapon).toBe('spirit-weapon');
    expect(Specialization.Renewal).toBe('renewal');
  });

  it('should contain Shapeshifter specs', () => {
    expect(Specialization.Astral).toBe('astral');
    expect(Specialization.Primal).toBe('primal');
    expect(Specialization.GroveWarden).toBe('grove-warden');
  });
});

// ---- PrimaryStat ----

describe('PrimaryStat enum', () => {
  it('should have exactly 5 primary stats', () => {
    expect(Object.values(PrimaryStat)).toHaveLength(5);
  });

  it('should use abbreviated string values', () => {
    expect(PrimaryStat.Strength).toBe('str');
    expect(PrimaryStat.Agility).toBe('agi');
    expect(PrimaryStat.Intellect).toBe('int');
    expect(PrimaryStat.Spirit).toBe('spi');
    expect(PrimaryStat.Stamina).toBe('sta');
  });
});

// ---- SecondaryStat ----

describe('SecondaryStat enum', () => {
  it('should have exactly 12 secondary stats', () => {
    expect(Object.values(SecondaryStat)).toHaveLength(12);
  });

  it('should contain combat rating stats', () => {
    expect(SecondaryStat.CritChance).toBe('crit-chance');
    expect(SecondaryStat.CritDamage).toBe('crit-damage');
    expect(SecondaryStat.Haste).toBe('haste');
    expect(SecondaryStat.HitRating).toBe('hit-rating');
    expect(SecondaryStat.Expertise).toBe('expertise');
    expect(SecondaryStat.SpellPenetration).toBe('spell-penetration');
  });

  it('should contain defensive stats', () => {
    expect(SecondaryStat.Armor).toBe('armor');
    expect(SecondaryStat.Resistance).toBe('resistance');
  });

  it('should contain power and regen stats', () => {
    expect(SecondaryStat.AttackPower).toBe('attack-power');
    expect(SecondaryStat.SpellPower).toBe('spell-power');
    expect(SecondaryStat.HealthRegen).toBe('health-regen');
    expect(SecondaryStat.ManaRegen).toBe('mana-regen');
  });
});

// ---- ResourceType ----

describe('ResourceType enum', () => {
  it('should have exactly 3 resource types', () => {
    expect(Object.values(ResourceType)).toHaveLength(3);
  });

  it('should contain all resource types', () => {
    expect(ResourceType.Mana).toBe('mana');
    expect(ResourceType.Energy).toBe('energy');
    expect(ResourceType.Rage).toBe('rage');
  });
});

// ---- GearSlot ----

describe('GearSlot enum', () => {
  it('should have exactly 16 gear slots', () => {
    expect(Object.values(GearSlot)).toHaveLength(16);
  });

  it('should include all 8 armor slots', () => {
    expect(GearSlot.Head).toBe('head');
    expect(GearSlot.Shoulders).toBe('shoulders');
    expect(GearSlot.Chest).toBe('chest');
    expect(GearSlot.Wrists).toBe('wrists');
    expect(GearSlot.Hands).toBe('hands');
    expect(GearSlot.Waist).toBe('waist');
    expect(GearSlot.Legs).toBe('legs');
    expect(GearSlot.Feet).toBe('feet');
  });

  it('should include jewelry and cloak slots', () => {
    expect(GearSlot.Neck).toBe('neck');
    expect(GearSlot.Back).toBe('back');
    expect(GearSlot.Ring1).toBe('ring1');
    expect(GearSlot.Ring2).toBe('ring2');
    expect(GearSlot.Trinket1).toBe('trinket1');
    expect(GearSlot.Trinket2).toBe('trinket2');
  });

  it('should include weapon slots', () => {
    expect(GearSlot.MainHand).toBe('main-hand');
    expect(GearSlot.OffHand).toBe('off-hand');
  });
});

// ---- ItemQuality ----

describe('ItemQuality enum', () => {
  it('should have exactly 5 quality tiers', () => {
    expect(Object.values(ItemQuality)).toHaveLength(5);
  });

  it('should be ordered from common to legendary', () => {
    const values = Object.values(ItemQuality);
    expect(values[0]).toBe('common');
    expect(values[1]).toBe('uncommon');
    expect(values[2]).toBe('rare');
    expect(values[3]).toBe('epic');
    expect(values[4]).toBe('legendary');
  });

  it('should have correct string values', () => {
    expect(ItemQuality.Common).toBe('common');
    expect(ItemQuality.Uncommon).toBe('uncommon');
    expect(ItemQuality.Rare).toBe('rare');
    expect(ItemQuality.Epic).toBe('epic');
    expect(ItemQuality.Legendary).toBe('legendary');
  });
});

// ---- ArmorType ----

describe('ArmorType enum', () => {
  it('should have exactly 4 armor types', () => {
    expect(Object.values(ArmorType)).toHaveLength(4);
  });

  it('should contain all armor types', () => {
    expect(ArmorType.Cloth).toBe('cloth');
    expect(ArmorType.Leather).toBe('leather');
    expect(ArmorType.Mail).toBe('mail');
    expect(ArmorType.Plate).toBe('plate');
  });
});

// ---- WeaponType ----

describe('WeaponType enum', () => {
  it('should have exactly 13 weapon types', () => {
    expect(Object.values(WeaponType)).toHaveLength(13);
  });

  it('should contain melee weapon types', () => {
    expect(WeaponType.Sword1H).toBe('sword-1h');
    expect(WeaponType.Sword2H).toBe('sword-2h');
    expect(WeaponType.Mace1H).toBe('mace-1h');
    expect(WeaponType.Mace2H).toBe('mace-2h');
    expect(WeaponType.Axe1H).toBe('axe-1h');
    expect(WeaponType.Axe2H).toBe('axe-2h');
    expect(WeaponType.Dagger).toBe('dagger');
    expect(WeaponType.Staff).toBe('staff');
  });

  it('should contain ranged weapon types', () => {
    expect(WeaponType.Bow).toBe('bow');
    expect(WeaponType.Crossbow).toBe('crossbow');
    expect(WeaponType.Wand).toBe('wand');
  });

  it('should contain off-hand types', () => {
    expect(WeaponType.Shield).toBe('shield');
    expect(WeaponType.OffhandHeld).toBe('offhand-held');
  });
});

// ---- AbilityType ----

describe('AbilityType enum', () => {
  it('should have exactly 8 ability types', () => {
    expect(Object.values(AbilityType)).toHaveLength(8);
  });

  it('should contain all ability types', () => {
    expect(AbilityType.DirectDamage).toBe('direct-damage');
    expect(AbilityType.DamageOverTime).toBe('dot');
    expect(AbilityType.AreaOfEffect).toBe('aoe');
    expect(AbilityType.HealOverTime).toBe('hot');
    expect(AbilityType.DirectHeal).toBe('direct-heal');
    expect(AbilityType.Buff).toBe('buff');
    expect(AbilityType.Debuff).toBe('debuff');
    expect(AbilityType.CrowdControl).toBe('cc');
  });
});

// ---- DamageType ----

describe('DamageType enum', () => {
  it('should have exactly 3 damage types', () => {
    expect(Object.values(DamageType)).toHaveLength(3);
  });

  it('should contain all damage types', () => {
    expect(DamageType.Physical).toBe('physical');
    expect(DamageType.Spell).toBe('spell');
    expect(DamageType.Healing).toBe('healing');
  });
});

// ---- QuestType ----

describe('QuestType enum', () => {
  it('should have exactly 5 quest types', () => {
    expect(Object.values(QuestType)).toHaveLength(5);
  });

  it('should contain all quest types', () => {
    expect(QuestType.Kill).toBe('kill');
    expect(QuestType.Collection).toBe('collection');
    expect(QuestType.Dungeon).toBe('dungeon');
    expect(QuestType.Elite).toBe('elite');
    expect(QuestType.Attunement).toBe('attunement');
  });
});

// ---- DungeonDifficulty ----

describe('DungeonDifficulty enum', () => {
  it('should have exactly 2 difficulties', () => {
    expect(Object.values(DungeonDifficulty)).toHaveLength(2);
  });

  it('should contain normal and heroic', () => {
    expect(DungeonDifficulty.Normal).toBe('normal');
    expect(DungeonDifficulty.Heroic).toBe('heroic');
  });
});

// ---- ReputationTier ----

describe('ReputationTier enum', () => {
  it('should have exactly 5 reputation tiers', () => {
    expect(Object.values(ReputationTier)).toHaveLength(5);
  });

  it('should be ordered from neutral to exalted', () => {
    const values = Object.values(ReputationTier);
    expect(values[0]).toBe('neutral');
    expect(values[1]).toBe('friendly');
    expect(values[2]).toBe('honored');
    expect(values[3]).toBe('revered');
    expect(values[4]).toBe('exalted');
  });
});

// ---- Role ----

describe('Role enum', () => {
  it('should have exactly 4 roles', () => {
    expect(Object.values(Role)).toHaveLength(4);
  });

  it('should contain all roles', () => {
    expect(Role.Tank).toBe('tank');
    expect(Role.MeleeDPS).toBe('melee_dps');
    expect(Role.RangedDPS).toBe('ranged_dps');
    expect(Role.Healer).toBe('healer');
  });
});

// ---- CombatLogType ----

describe('CombatLogType enum', () => {
  it('should have exactly 18 combat log entry types', () => {
    expect(Object.values(CombatLogType)).toHaveLength(18);
  });

  it('should contain damage-related log types', () => {
    expect(CombatLogType.DamageDealt).toBe('damage_dealt');
    expect(CombatLogType.DamageTaken).toBe('damage_taken');
    expect(CombatLogType.Heal).toBe('heal');
  });

  it('should contain ability and buff log types', () => {
    expect(CombatLogType.AbilityUsed).toBe('ability_used');
    expect(CombatLogType.BuffApplied).toBe('buff_applied');
    expect(CombatLogType.BuffExpired).toBe('buff_expired');
    expect(CombatLogType.DebuffApplied).toBe('debuff_applied');
    expect(CombatLogType.DebuffExpired).toBe('debuff_expired');
  });

  it('should contain combat outcome log types', () => {
    expect(CombatLogType.Miss).toBe('miss');
    expect(CombatLogType.Dodge).toBe('dodge');
    expect(CombatLogType.Parry).toBe('parry');
    expect(CombatLogType.Crit).toBe('crit');
  });

  it('should contain progression log types', () => {
    expect(CombatLogType.MonsterKilled).toBe('monster_killed');
    expect(CombatLogType.PlayerDeath).toBe('player_death');
    expect(CombatLogType.XpGained).toBe('xp_gained');
    expect(CombatLogType.GoldGained).toBe('gold_gained');
    expect(CombatLogType.LootDropped).toBe('loot_dropped');
    expect(CombatLogType.LevelUp).toBe('level_up');
  });
});

// ---- MonsterType ----

describe('MonsterType enum', () => {
  it('should have exactly 3 monster types', () => {
    expect(Object.values(MonsterType)).toHaveLength(3);
  });

  it('should contain all monster types', () => {
    expect(MonsterType.Normal).toBe('normal');
    expect(MonsterType.Elite).toBe('elite');
    expect(MonsterType.Boss).toBe('boss');
  });
});
