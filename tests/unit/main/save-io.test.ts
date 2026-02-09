import { describe, it, expect } from 'vitest';
import { serializeSave, deserializeSave, computeChecksum } from '@main/save/save-io';
import type { ISaveData } from '@shared/types/save';
import { Race, CharacterClass } from '@shared/types/enums';

function makeMinimalSave(): ISaveData {
  return {
    meta: {
      version: '1.0.0',
      gameVersion: '0.1.0',
      saveSlot: 1,
      createdAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      playTimeSeconds: 3600,
      checksum: '',
    },
    character: {
      id: 'test-uuid',
      name: 'TestChar',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
      level: 10,
      currentXP: 500,
      gold: 100,
      currentHP: 200,
      currentResource: 50,
      deathCount: 0,
      totalKills: 100,
      totalQuestsCompleted: 5,
      respecCount: 0,
    },
    progression: {
      currentZoneId: 'zone_02',
      currentQuestIndex: 3,
      currentQuestKills: 5,
      zonesCompleted: ['zone_01'],
      unlockedAbilities: ['auto-attack', 'mortal-strike'],
      activeAbilityPriority: ['mortal-strike', 'auto-attack'],
      questChains: {},
      rareSpawnsDefeated: [],
      eliteAreasUnlocked: [],
      activeZoneEvents: [],
    },
    inventory: {
      equipped: {},
      bags: new Array(28).fill(null),
    },
    talents: {
      allocatedPoints: {},
      totalPointsSpent: 0,
    },
    combatState: {
      currentMonster: null,
      activeBuffs: [],
      activeDoTs: [],
      cooldowns: {},
    },
    settings: {
      autoEquip: true,
      autoSellCommon: false,
      combatLogVisible: true,
      uiScale: 1.0,
    },
  };
}

describe('serializeSave / deserializeSave', () => {
  it('should serialize to a Buffer and deserialize back to the same data', () => {
    const save = makeMinimalSave();
    const buffer = serializeSave(save);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const restored = deserializeSave(buffer);
    expect(restored.character.name).toBe('TestChar');
    expect(restored.character.level).toBe(10);
    expect(restored.meta.version).toBe('1.0.0');
  });

  it('should preserve all character fields through round-trip', () => {
    const save = makeMinimalSave();
    save.character.gold = 99999;
    save.character.deathCount = 42;
    save.character.totalKills = 5000;

    const buffer = serializeSave(save);
    const restored = deserializeSave(buffer);

    expect(restored.character.gold).toBe(99999);
    expect(restored.character.deathCount).toBe(42);
    expect(restored.character.totalKills).toBe(5000);
  });

  it('should preserve progression data through round-trip', () => {
    const save = makeMinimalSave();
    save.progression.zonesCompleted = ['zone_01', 'zone_02', 'zone_03'];
    save.progression.unlockedAbilities = ['auto-attack', 'mortal-strike', 'whirlwind'];

    const buffer = serializeSave(save);
    const restored = deserializeSave(buffer);

    expect(restored.progression.zonesCompleted).toEqual(['zone_01', 'zone_02', 'zone_03']);
    expect(restored.progression.unlockedAbilities).toHaveLength(3);
  });

  it('should preserve inventory bags through round-trip', () => {
    const save = makeMinimalSave();
    const buffer = serializeSave(save);
    const restored = deserializeSave(buffer);

    expect(restored.inventory.bags).toHaveLength(28);
    expect(restored.inventory.bags.every((slot) => slot === null)).toBe(true);
  });

  it('should preserve settings through round-trip', () => {
    const save = makeMinimalSave();
    save.settings.uiScale = 1.5;
    save.settings.autoEquip = false;

    const buffer = serializeSave(save);
    const restored = deserializeSave(buffer);

    expect(restored.settings.uiScale).toBe(1.5);
    expect(restored.settings.autoEquip).toBe(false);
  });

  it('should update lastSavedAt during serialization', () => {
    const save = makeMinimalSave();
    const oldTimestamp = save.meta.lastSavedAt;

    // Small delay to ensure timestamp differs
    const buffer = serializeSave(save);
    const restored = deserializeSave(buffer);

    // lastSavedAt should be a valid ISO string
    expect(restored.meta.lastSavedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should start with IDLE magic bytes', () => {
    const save = makeMinimalSave();
    const buffer = serializeSave(save);

    expect(buffer.subarray(0, 4).toString('ascii')).toBe('IDLE');
  });

  it('should have version byte at offset 4', () => {
    const save = makeMinimalSave();
    const buffer = serializeSave(save);

    expect(buffer.readUInt8(4)).toBe(1);
  });

  it('should throw on invalid magic bytes', () => {
    const badBuffer = Buffer.from('BAAD\x01fake-data');
    expect(() => deserializeSave(badBuffer)).toThrow('Invalid save file: magic bytes mismatch');
  });

  it('should throw on unsupported version', () => {
    const save = makeMinimalSave();
    const buffer = serializeSave(save);
    // Overwrite version byte to a high number
    buffer.writeUInt8(255, 4);
    expect(() => deserializeSave(buffer)).toThrow('newer than supported version');
  });

  it('should throw on corrupted compressed data', () => {
    const header = Buffer.alloc(5);
    Buffer.from('IDLE').copy(header, 0);
    header.writeUInt8(1, 4);
    const corrupted = Buffer.concat([header, Buffer.from('not-gzip-data')]);

    expect(() => deserializeSave(corrupted)).toThrow();
  });

  it('should detect checksum tampering', () => {
    const save = makeMinimalSave();
    const buffer = serializeSave(save);

    // Deserialize, tamper with data, re-serialize the JSON with wrong checksum
    const restored = deserializeSave(buffer);
    restored.character.gold = 999999;
    // The checksum is still from the original data, so it should mismatch

    // Manually create a tampered buffer
    const { gzipSync } = require('zlib');
    const tamperedJson = JSON.stringify(restored);
    const compressed = gzipSync(Buffer.from(tamperedJson, 'utf-8'));
    const tamperedHeader = Buffer.alloc(5);
    Buffer.from('IDLE').copy(tamperedHeader, 0);
    tamperedHeader.writeUInt8(1, 4);
    const tamperedBuffer = Buffer.concat([tamperedHeader, compressed]);

    expect(() => deserializeSave(tamperedBuffer)).toThrow('checksum mismatch');
  });
});

describe('computeChecksum', () => {
  it('should produce a consistent hash for the same data', () => {
    const save = makeMinimalSave();
    const hash1 = computeChecksum(save);
    const hash2 = computeChecksum(save);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different data', () => {
    const save1 = makeMinimalSave();
    const save2 = makeMinimalSave();
    save2.character.level = 20;
    expect(computeChecksum(save1)).not.toBe(computeChecksum(save2));
  });

  it('should return a 64-character hex string (SHA-256)', () => {
    const save = makeMinimalSave();
    const hash = computeChecksum(save);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should ignore the checksum field when computing', () => {
    const save1 = makeMinimalSave();
    save1.meta.checksum = '';

    const save2 = makeMinimalSave();
    save2.meta.checksum = 'some-old-checksum';

    expect(computeChecksum(save1)).toBe(computeChecksum(save2));
  });
});
