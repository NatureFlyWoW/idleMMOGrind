import { describe, it, expect } from 'vitest';
import {
  createCharacter,
  getRaceDefinition,
  getClassDefinition,
} from '@engine/character/character-factory';
import type { ICharacterState } from '@engine/character/character-factory';
import {
  Race,
  CharacterClass,
  PrimaryStat,
  GearSlot,
  ItemQuality,
  ResourceType,
  ArmorType,
  WeaponType,
} from '@shared/types/enums';

// ---------------------------------------------------------------------------
// getRaceDefinition / getClassDefinition
// ---------------------------------------------------------------------------

describe('getRaceDefinition', () => {
  it('should return the correct race for a valid id', () => {
    const race = getRaceDefinition(Race.Bloodborn);
    expect(race.id).toBe(Race.Bloodborn);
    expect(race.name).toBe('Bloodborn');
  });

  it('should throw for an invalid race id', () => {
    expect(() => getRaceDefinition('nonexistent' as Race)).toThrow('Unknown race');
  });
});

describe('getClassDefinition', () => {
  it('should return the correct class for a valid id', () => {
    const cls = getClassDefinition(CharacterClass.Blademaster);
    expect(cls.id).toBe(CharacterClass.Blademaster);
    expect(cls.name).toBe('Blademaster');
  });

  it('should throw for an invalid class id', () => {
    expect(() => getClassDefinition('nonexistent' as CharacterClass)).toThrow('Unknown class');
  });
});

// ---------------------------------------------------------------------------
// createCharacter
// ---------------------------------------------------------------------------

describe('createCharacter', () => {
  it('should create a level 1 character with correct name, race, and class', () => {
    const char = createCharacter({
      name: 'Testchar',
      race: Race.Bloodborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.name).toBe('Testchar');
    expect(char.race).toBe(Race.Bloodborn);
    expect(char.classId).toBe(CharacterClass.Blademaster);
    expect(char.level).toBe(1);
    expect(char.currentXP).toBe(0);
  });

  it('should compute starting stats = class base + race bonus', () => {
    // Bloodborn Blademaster:
    //   Class base: STR 25, AGI 15, INT 8, SPI 10, STA 22
    //   Race bonus: STR 7,  AGI 0,  INT 0, SPI 0,  STA 3
    //   Result:     STR 32, AGI 15, INT 8, SPI 10, STA 25
    const char = createCharacter({
      name: 'Test',
      race: Race.Bloodborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.primaryStats[PrimaryStat.Strength]).toBe(32);
    expect(char.primaryStats[PrimaryStat.Agility]).toBe(15);
    expect(char.primaryStats[PrimaryStat.Intellect]).toBe(8);
    expect(char.primaryStats[PrimaryStat.Spirit]).toBe(10);
    expect(char.primaryStats[PrimaryStat.Stamina]).toBe(25);
  });

  it('should assign starting equipment for the class', () => {
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.equipment[GearSlot.MainHand]).not.toBeNull();
    expect(char.equipment[GearSlot.Chest]).not.toBeNull();
    expect(char.equipment[GearSlot.Head]).not.toBeNull();
    expect(char.equipment[GearSlot.Legs]).not.toBeNull();
    expect(char.equipment[GearSlot.Feet]).not.toBeNull();
    expect(char.equipment[GearSlot.Hands]).not.toBeNull();
  });

  it('should have a unique UUID', () => {
    const c1 = createCharacter({
      name: 'A',
      race: Race.Valeborn,
      classId: CharacterClass.Cleric,
    });
    const c2 = createCharacter({
      name: 'B',
      race: Race.Valeborn,
      classId: CharacterClass.Cleric,
    });
    expect(c1.id).not.toBe(c2.id);
  });

  it('should start with gold = 0', () => {
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Arcanist,
    });
    expect(char.gold).toBe(0);
  });

  it('should start in zone_01', () => {
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Shadow,
    });
    expect(char.currentZoneId).toBe('zone_01');
  });

  // ---------------------------------------------------------------------------
  // HP calculation
  // ---------------------------------------------------------------------------

  it('should compute maxHP = stamina * 10 + baseHP', () => {
    // Bloodborn Blademaster: STA = 25, baseHP = 120 => maxHP = 370
    const char = createCharacter({
      name: 'Test',
      race: Race.Bloodborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.maxHP).toBe(370);
    expect(char.currentHP).toBe(char.maxHP);
  });

  it('should compute HP correctly for a cloth caster', () => {
    // Tinkersoul Arcanist:
    //   Class base STA 12 + Race bonus STA 0 = 12
    //   baseHP = 70  => maxHP = 12*10 + 70 = 190
    const char = createCharacter({
      name: 'Test',
      race: Race.Tinkersoul,
      classId: CharacterClass.Arcanist,
    });
    expect(char.maxHP).toBe(190);
  });

  // ---------------------------------------------------------------------------
  // Resource handling
  // ---------------------------------------------------------------------------

  it('should set rage classes to 0 current, 100 max', () => {
    // Blademaster uses Rage
    const char = createCharacter({
      name: 'Test',
      race: Race.Bloodborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.resourceType).toBe(ResourceType.Rage);
    expect(char.currentResource).toBe(0);
    expect(char.maxResource).toBe(100);
  });

  it('should set mana classes to full current = max', () => {
    // Cleric uses Mana, baseResource = 300
    const char = createCharacter({
      name: 'Test',
      race: Race.Hollowed,
      classId: CharacterClass.Cleric,
    });
    expect(char.resourceType).toBe(ResourceType.Mana);
    expect(char.currentResource).toBe(300);
    expect(char.maxResource).toBe(300);
  });

  it('should set energy classes to full current = max', () => {
    // Shadow uses Energy, baseResource = 100
    const char = createCharacter({
      name: 'Test',
      race: Race.Wildkin,
      classId: CharacterClass.Shadow,
    });
    expect(char.resourceType).toBe(ResourceType.Energy);
    expect(char.currentResource).toBe(100);
    expect(char.maxResource).toBe(100);
  });

  // ---------------------------------------------------------------------------
  // Starter equipment details
  // ---------------------------------------------------------------------------

  it('should give 5 armor pieces + 1 weapon (6 equipped items total)', () => {
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Sentinel,
    });
    const equipped = Object.values(char.equipment).filter((item) => item != null);
    expect(equipped).toHaveLength(6);
  });

  it('should create armor pieces with correct type for the class', () => {
    // Blademaster wears plate
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
    });
    const chest = char.equipment[GearSlot.Chest];
    expect(chest).not.toBeNull();
    expect(chest!.armorType).toBe(ArmorType.Plate);
    expect(chest!.quality).toBe(ItemQuality.Common);
    expect(chest!.iLevel).toBe(1);
  });

  it('should create armor with +1 main stat and +1 stamina', () => {
    // Blademaster main stat = STR
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
    });
    const helm = char.equipment[GearSlot.Head];
    expect(helm).not.toBeNull();
    expect(helm!.primaryStats[PrimaryStat.Strength]).toBe(1);
    expect(helm!.primaryStats[PrimaryStat.Stamina]).toBe(1);
  });

  it('should give starter weapon matching the first class weaponType', () => {
    // Blademaster first weapon type = sword-1h
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
    });
    const weapon = char.equipment[GearSlot.MainHand];
    expect(weapon).not.toBeNull();
    expect(weapon!.weaponType).toBe(WeaponType.Sword1H);
    expect(weapon!.slot).toBe(GearSlot.MainHand);
  });

  it('should give 1H weapons damage 3-5, speed 2.0', () => {
    // Blademaster first weapon = sword-1h (1H)
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
    });
    const weapon = char.equipment[GearSlot.MainHand];
    expect(weapon).not.toBeNull();
    expect(weapon!.weaponDamage).toEqual({ min: 3, max: 5 });
    expect(weapon!.weaponSpeed).toBe(2.0);
  });

  it('should give 2H weapons damage 5-8, speed 3.0', () => {
    // Stalker first weapon = bow (2H)
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Stalker,
    });
    const weapon = char.equipment[GearSlot.MainHand];
    expect(weapon).not.toBeNull();
    expect(weapon!.weaponType).toBe(WeaponType.Bow);
    expect(weapon!.weaponDamage).toEqual({ min: 5, max: 8 });
    expect(weapon!.weaponSpeed).toBe(3.0);
  });

  it('should give staff-wielding classes a 2H weapon', () => {
    // Cleric first weapon = staff (2H)
    const char = createCharacter({
      name: 'Test',
      race: Race.Hollowed,
      classId: CharacterClass.Cleric,
    });
    const weapon = char.equipment[GearSlot.MainHand];
    expect(weapon).not.toBeNull();
    expect(weapon!.weaponType).toBe(WeaponType.Staff);
    expect(weapon!.weaponDamage).toEqual({ min: 5, max: 8 });
    expect(weapon!.weaponSpeed).toBe(3.0);
  });

  // ---------------------------------------------------------------------------
  // Inventory & counters
  // ---------------------------------------------------------------------------

  it('should start with an empty inventory of 28 slots', () => {
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.inventory).toHaveLength(28);
    expect(char.inventory.every((slot) => slot === null)).toBe(true);
  });

  it('should initialise all counters to zero', () => {
    const char = createCharacter({
      name: 'Test',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.deathCount).toBe(0);
    expect(char.totalKills).toBe(0);
    expect(char.totalQuestsCompleted).toBe(0);
    expect(char.respecCount).toBe(0);
    expect(char.playTimeSeconds).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Every race + class combination produces valid output
  // ---------------------------------------------------------------------------

  it('should produce valid characters for every race/class combination', () => {
    const allRaces = Object.values(Race);
    const allClasses = Object.values(CharacterClass);

    for (const race of allRaces) {
      for (const classId of allClasses) {
        const char = createCharacter({ name: `${race}-${classId}`, race, classId });

        // Basic shape checks
        expect(char.level).toBe(1);
        expect(char.maxHP).toBeGreaterThan(0);
        expect(char.equipment[GearSlot.MainHand]).not.toBeNull();
        expect(char.equipment[GearSlot.Chest]).not.toBeNull();

        // Stats should all be positive
        for (const stat of Object.values(PrimaryStat)) {
          expect(char.primaryStats[stat]).toBeGreaterThan(0);
        }
      }
    }
  });
});
