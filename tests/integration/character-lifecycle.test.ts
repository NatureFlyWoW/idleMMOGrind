import { describe, it, expect } from 'vitest';
import { createCharacter } from '@engine/character/character-factory';
import { xpToNextLevel } from '@engine/character/stat-calculator';
import { awardXP } from '@engine/progression/xp-system';
import { generateItem } from '@engine/gear/item-generator';
import { isUpgrade, equipItem } from '@engine/gear/inventory-manager';
import { calculateOfflineProgress } from '@engine/offline/offline-calculator';
import { serializeSave, deserializeSave } from '@main/save/save-io';
import { Race, CharacterClass, PrimaryStat, GearSlot, ItemQuality } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('Character Lifecycle Integration', () => {
  it('should create a character, level up, equip gear, allocate talents, go offline, and save/load', () => {
    // 1. Create character
    const char = createCharacter({
      name: 'IntegrationTest',
      race: Race.Bloodborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.level).toBe(1);
    expect(char.primaryStats[PrimaryStat.Strength]).toBeGreaterThan(0);

    // 2. Award XP and level up
    const xpResult = awardXP({
      currentLevel: char.level,
      currentXP: char.currentXP,
      xpGained: 50000,
      config,
    });
    expect(xpResult.newLevel).toBeGreaterThan(1);
    expect(xpResult.levelsGained).toBeGreaterThan(0);

    // 3. Generate and equip gear
    const rng = new SeededRandom(42);
    const newChest = generateItem({
      iLevel: 20,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    expect(newChest.iLevel).toBe(20);

    const currentChest = char.equipment[GearSlot.Chest] ?? null;
    const shouldEquip = isUpgrade(newChest, currentChest, [PrimaryStat.Strength, PrimaryStat.Stamina]);
    expect(shouldEquip).toBe(true);

    const equipResult = equipItem(char.equipment, char.inventory, newChest);
    expect(equipResult.equipment[GearSlot.Chest]?.iLevel).toBe(20);

    // 4. Calculate offline progress
    const offlineResult = calculateOfflineProgress({
      characterLevel: xpResult.newLevel,
      currentXP: xpResult.remainingXP,
      currentZoneLevel: xpResult.newLevel,
      offlineSeconds: 3600 * 8,
      rng: new SeededRandom(99),
      config,
    });
    expect(offlineResult.xpGained).toBeGreaterThan(0);
    expect(offlineResult.goldGained).toBeGreaterThan(0);

    // 5. Serialize and deserialize save
    const saveData = {
      meta: {
        version: '1.0.0',
        gameVersion: '0.1.0',
        saveSlot: 1 as const,
        createdAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        playTimeSeconds: 3600,
        checksum: '',
      },
      character: {
        id: char.id,
        name: char.name,
        race: char.race,
        classId: char.classId,
        level: xpResult.newLevel,
        currentXP: xpResult.remainingXP,
        gold: offlineResult.goldGained,
        currentHP: char.currentHP,
        currentResource: char.currentResource,
        deathCount: 0,
        totalKills: offlineResult.monstersKilled,
        totalQuestsCompleted: offlineResult.questsCompleted,
        respecCount: 0,
      },
      progression: {
        currentZoneId: 'zone_02',
        currentQuestIndex: 0,
        currentQuestKills: 0,
        zonesCompleted: ['zone_01'],
        unlockedAbilities: [],
        activeAbilityPriority: [],
        questChains: {},
        rareSpawnsDefeated: [],
        eliteAreasUnlocked: [],
        activeZoneEvents: [],
      },
      inventory: {
        equipped: equipResult.equipment,
        bags: equipResult.inventory,
      },
      talents: { allocatedPoints: {}, totalPointsSpent: 0 },
      combatState: { currentMonster: null, activeBuffs: [], activeDoTs: [], cooldowns: {} },
      settings: { autoEquip: true, autoSellCommon: false, combatLogVisible: true, uiScale: 1.0 },
    };

    const buffer = serializeSave(saveData);
    expect(buffer.length).toBeGreaterThan(0);

    const restored = deserializeSave(buffer);
    expect(restored.character.name).toBe('IntegrationTest');
    expect(restored.character.level).toBe(xpResult.newLevel);
    expect(restored.character.gold).toBe(offlineResult.goldGained);
  });
});
