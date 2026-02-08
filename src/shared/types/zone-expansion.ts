import {
  MonsterType, MonsterSubtype, QuestType, GearSlot, ItemQuality,
  ZoneEventType,
} from './enums';

/** Extended monster template with subtype and abilities */
export interface IMonsterTemplateV2 {
  id: string;
  name: string;
  level: number;
  type: MonsterType;
  subtype: MonsterSubtype;
  health: number;
  damage: number;
  armor: number;
  resistance: number;
  attackSpeed: number;
  lootTableId: string;
  xpReward: number;
  goldReward: { min: number; max: number };
  abilities: string[];
  materialDrops: IMaterialDrop[];
}

/** Material drop from a monster */
export interface IMaterialDrop {
  materialId: string;
  chance: number;
  quantity: { min: number; max: number };
  requiresProfession?: string;
}

/** A single quest within a chain */
export interface IChainQuest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  objectives: IQuestObjective[];
  xpReward: number;
  goldReward: number;
  reputationReward?: { factionId: string; amount: number };
  gearReward?: { slot: GearSlot; qualityMin: ItemQuality };
  nextQuestId: string | null;
}

/** Quest objective */
export interface IQuestObjective {
  type: 'kill' | 'collect' | 'dungeon_clear' | 'escort' | 'explore';
  targetId: string;
  count: number;
}

/** Quest chain definition */
export interface IQuestChain {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  quests: IChainQuest[];
  completionReward: {
    xpBonus: number;
    goldBonus: number;
    reputationBonus: number;
    unlocks?: string;
  };
}

/** Quest chain progress state */
export interface IQuestChainProgress {
  chainId: string;
  currentQuestIndex: number;
  currentObjectiveProgress: Record<string, number>;
  completed: boolean;
}

/** Elite area definition */
export interface IEliteArea {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  levelBoost: number;
  hpMultiplier: number;
  damageMultiplier: number;
  xpMultiplier: number;
  reputationMultiplier: number;
  lootQualityBoost: number;
  monsterIds: string[];
}

/** Rare spawn definition */
export interface IRareSpawn {
  id: string;
  zoneId: string;
  name: string;
  level: number;
  hpMultiplier: number;
  damageMultiplier: number;
  spawnChance: number;
  guaranteedDropQuality: ItemQuality;
  guaranteedDropSlot?: GearSlot;
  xpMultiplier: number;
  reputationReward: number;
}

/** Zone event definition */
export interface IZoneEvent {
  id: string;
  zoneId: string;
  type: ZoneEventType;
  durationMs: number;
  cooldownMs: number;
  effects: IZoneEventEffects;
}

/** Effects applied during a zone event */
export interface IZoneEventEffects {
  xpMultiplier?: number;
  gatheringMultiplier?: number;
  reputationMultiplier?: number;
  rareSpawnChanceOverride?: number;
  monsterLevelBoost?: number;
  monsterSpawnRateMultiplier?: number;
}

/** Active zone event state */
export interface IActiveZoneEvent {
  eventId: string;
  zoneId: string;
  type: ZoneEventType;
  startedAt: number;
  expiresAt: number;
  effects: IZoneEventEffects;
}
