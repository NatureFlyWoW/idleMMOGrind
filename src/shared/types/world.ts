import { MonsterType, QuestType, GearSlot } from './enums';

/** Gold range for monster drops */
export interface IGoldRange {
  min: number;
  max: number;
}

/** Monster definition */
export interface IMonsterTemplate {
  id: string;
  name: string;
  level: number;
  type: MonsterType;
  health: number;
  damage: number;
  armor: number;
  resistance: number;
  attackSpeed: number;
  lootTableId: string;
  xpReward: number;
  goldReward: IGoldRange;
}

/** Zone definition */
export interface IZoneDefinition {
  id: string;
  name: string;
  description: string;
  levelRange: { min: number; max: number };
  monsterIds: string[];
  questCount: number;
  nextZoneId: string | null;
  theme: string;
}

/** Quest definition */
export interface IQuestDefinition {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  type: QuestType;
  requiredKills: number;
  xpReward: number;
  goldReward: number;
  gearRewardChance: number;
  gearRewardSlots?: GearSlot[];
}

/** Active quest state */
export interface IActiveQuest {
  questId: string;
  currentKills: number;
  requiredKills: number;
  completed: boolean;
}
