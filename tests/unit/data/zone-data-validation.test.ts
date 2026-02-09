import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MonsterSubtype, ZoneEventType } from '@shared/types/enums';
import type { IMonsterTemplateV2, IQuestChain, IRareSpawn, IEliteArea, IZoneEvent } from '@shared/types/zone-expansion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATA_ROOT = path.resolve(__dirname, '../../../data/zones');
const VALID_ZONE_IDS = Array.from({ length: 12 }, (_, i) => `zone_${String(i + 1).padStart(2, '0')}`);

const VALID_MONSTER_SUBTYPES = Object.values(MonsterSubtype) as string[];
const VALID_EVENT_TYPES = Object.values(ZoneEventType) as string[];

// Zones 1 and 2 have no elite areas
const ELITE_ZONE_IDS = VALID_ZONE_IDS.filter((id) => id !== 'zone_01' && id !== 'zone_02');

function loadJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function loadAllZoneFiles<T>(subdir: string, zoneIds: string[]): { zoneId: string; data: T[] }[] {
  const results: { zoneId: string; data: T[] }[] = [];
  for (const zoneId of zoneIds) {
    const filePath = path.join(DATA_ROOT, subdir, `${zoneId}.json`);
    if (fs.existsSync(filePath)) {
      const data = loadJsonFile<T[]>(filePath);
      results.push({ zoneId, data });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Load all data upfront
// ---------------------------------------------------------------------------

const allQuestChains = loadAllZoneFiles<IQuestChain>('quests', VALID_ZONE_IDS);
const allMonsters = loadAllZoneFiles<IMonsterTemplateV2>('monsters', VALID_ZONE_IDS);
const allRareSpawns = loadAllZoneFiles<IRareSpawn>('rares', VALID_ZONE_IDS);

const allEliteAreas: { zoneId: string; data: IEliteArea }[] = [];
for (const zoneId of ELITE_ZONE_IDS) {
  const filePath = path.join(DATA_ROOT, 'elites', `${zoneId}.json`);
  if (fs.existsSync(filePath)) {
    const data = loadJsonFile<IEliteArea>(filePath);
    allEliteAreas.push({ zoneId, data });
  }
}

const eventsData = loadJsonFile<IZoneEvent[]>(path.join(DATA_ROOT, 'events.json'));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Zone Data Validation', () => {
  describe('Quest Chain Files', () => {
    it('should have quest data for all 12 zones', () => {
      expect(allQuestChains.length).toBe(12);
    });

    it('should reference valid zone IDs in all quest chains', () => {
      for (const { data: chains } of allQuestChains) {
        for (const chain of chains) {
          expect(VALID_ZONE_IDS).toContain(chain.zoneId);
        }
      }
    });

    it('should have no duplicate chain IDs across all zone files', () => {
      const allChainIds: string[] = [];
      for (const { data: chains } of allQuestChains) {
        for (const chain of chains) {
          allChainIds.push(chain.id);
        }
      }
      const uniqueIds = new Set(allChainIds);
      expect(uniqueIds.size).toBe(allChainIds.length);
    });

    it('should have no duplicate quest IDs across all zone files', () => {
      const allQuestIds: string[] = [];
      for (const { data: chains } of allQuestChains) {
        for (const chain of chains) {
          for (const quest of chain.quests) {
            allQuestIds.push(quest.id);
          }
        }
      }
      const uniqueIds = new Set(allQuestIds);
      expect(uniqueIds.size).toBe(allQuestIds.length);
    });

    it('should have at least 1 quest per chain', () => {
      for (const { data: chains } of allQuestChains) {
        for (const chain of chains) {
          expect(chain.quests.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('should have valid objective types in all quests', () => {
      const validObjectiveTypes = ['kill', 'collect', 'dungeon_clear', 'escort', 'explore'];
      for (const { data: chains } of allQuestChains) {
        for (const chain of chains) {
          for (const quest of chain.quests) {
            for (const obj of quest.objectives) {
              expect(validObjectiveTypes).toContain(obj.type);
            }
          }
        }
      }
    });
  });

  describe('Monster Files', () => {
    it('should have monster data for all 12 zones', () => {
      expect(allMonsters.length).toBe(12);
    });

    it('should have valid MonsterSubtype enum values for all monsters', () => {
      for (const { data: monsters } of allMonsters) {
        for (const monster of monsters) {
          expect(VALID_MONSTER_SUBTYPES).toContain(monster.subtype);
        }
      }
    });

    it('should have no duplicate monster IDs across all zone files', () => {
      const allMonsterIds: string[] = [];
      for (const { data: monsters } of allMonsters) {
        for (const monster of monsters) {
          allMonsterIds.push(monster.id);
        }
      }
      const uniqueIds = new Set(allMonsterIds);
      expect(uniqueIds.size).toBe(allMonsterIds.length);
    });

    it('should have positive health, damage, and level for all monsters', () => {
      for (const { data: monsters } of allMonsters) {
        for (const monster of monsters) {
          expect(monster.health).toBeGreaterThan(0);
          expect(monster.damage).toBeGreaterThan(0);
          expect(monster.level).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Rare Spawn Files', () => {
    it('should have rare spawn data for all 12 zones', () => {
      expect(allRareSpawns.length).toBe(12);
    });

    it('should reference valid zone IDs in all rare spawns', () => {
      for (const { data: rares } of allRareSpawns) {
        for (const rare of rares) {
          expect(VALID_ZONE_IDS).toContain(rare.zoneId);
        }
      }
    });

    it('should have no duplicate rare IDs across all zone files', () => {
      const allRareIds: string[] = [];
      for (const { data: rares } of allRareSpawns) {
        for (const rare of rares) {
          allRareIds.push(rare.id);
        }
      }
      const uniqueIds = new Set(allRareIds);
      expect(uniqueIds.size).toBe(allRareIds.length);
    });

    it('should have spawnChance between 0 (exclusive) and 1 (inclusive)', () => {
      for (const { data: rares } of allRareSpawns) {
        for (const rare of rares) {
          expect(rare.spawnChance).toBeGreaterThan(0);
          expect(rare.spawnChance).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should have positive hp and damage multipliers', () => {
      for (const { data: rares } of allRareSpawns) {
        for (const rare of rares) {
          expect(rare.hpMultiplier).toBeGreaterThan(0);
          expect(rare.damageMultiplier).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Elite Area Files', () => {
    it('should have elite area data for zones 3-12 (10 files)', () => {
      expect(allEliteAreas.length).toBe(10);
    });

    it('should reference valid zone IDs in all elite areas', () => {
      for (const { data: elite } of allEliteAreas) {
        expect(VALID_ZONE_IDS).toContain(elite.zoneId);
      }
    });

    it('should have no duplicate elite area IDs', () => {
      const ids = allEliteAreas.map((e) => e.data.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have positive multipliers for all elite areas', () => {
      for (const { data: elite } of allEliteAreas) {
        expect(elite.hpMultiplier).toBeGreaterThan(0);
        expect(elite.damageMultiplier).toBeGreaterThan(0);
        expect(elite.xpMultiplier).toBeGreaterThan(0);
        expect(elite.reputationMultiplier).toBeGreaterThan(0);
      }
    });
  });

  describe('Events File', () => {
    it('should load events data', () => {
      expect(eventsData.length).toBeGreaterThan(0);
    });

    it('should reference valid zone IDs in all events', () => {
      for (const event of eventsData) {
        expect(VALID_ZONE_IDS).toContain(event.zoneId);
      }
    });

    it('should use valid ZoneEventType values in all events', () => {
      for (const event of eventsData) {
        expect(VALID_EVENT_TYPES).toContain(event.type);
      }
    });

    it('should have no duplicate event IDs', () => {
      const ids = eventsData.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have positive durationMs and cooldownMs for all events', () => {
      for (const event of eventsData) {
        expect(event.durationMs).toBeGreaterThan(0);
        expect(event.cooldownMs).toBeGreaterThan(0);
      }
    });

    it('should have at least one effect defined per event', () => {
      for (const event of eventsData) {
        const effectKeys = Object.keys(event.effects);
        expect(effectKeys.length).toBeGreaterThan(0);
      }
    });

    it('should follow the evt_z{num}_{type} naming convention', () => {
      const pattern = /^evt_z\d{2}_[a-z_]+$/;
      for (const event of eventsData) {
        expect(event.id).toMatch(pattern);
      }
    });
  });
});
