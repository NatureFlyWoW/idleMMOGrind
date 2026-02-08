import { Race, CharacterClass, GearSlot } from './enums';
import { IPrimaryStatBlock } from './character';
import { IItem } from './item';
import { IActiveQuest } from './world';
import { IActiveBuff, IActiveDoT } from './combat';

/** Save file metadata */
export interface ISaveMeta {
  version: string;
  gameVersion: string;
  saveSlot: 1 | 2 | 3;
  createdAt: string;
  lastSavedAt: string;
  lastPlayedAt: string;
  playTimeSeconds: number;
  checksum: string;
}

/** Character data in a save */
export interface ISaveCharacter {
  id: string;
  name: string;
  race: Race;
  classId: CharacterClass;
  level: number;
  currentXP: number;
  gold: number;
  currentHP: number;
  currentResource: number;
  deathCount: number;
  totalKills: number;
  totalQuestsCompleted: number;
  respecCount: number;
}

/** Progression data in a save */
export interface ISaveProgression {
  currentZoneId: string;
  currentQuestIndex: number;
  currentQuestKills: number;
  zonesCompleted: string[];
  unlockedAbilities: string[];
  activeAbilityPriority: string[];
}

/** Talent data in a save */
export interface ISaveTalents {
  allocatedPoints: Record<string, number>;
  totalPointsSpent: number;
}

/** Combat state data in a save */
export interface ISaveCombatState {
  currentMonster: {
    definitionId: string;
    currentHP: number;
  } | null;
  activeBuffs: IActiveBuff[];
  activeDoTs: IActiveDoT[];
  cooldowns: Record<string, number>;
}

/** Settings data in a save */
export interface ISaveSettings {
  autoEquip: boolean;
  autoSellCommon: boolean;
  combatLogVisible: boolean;
  uiScale: number;
}

/** The complete save file structure */
export interface ISaveData {
  meta: ISaveMeta;
  character: ISaveCharacter;
  progression: ISaveProgression;
  inventory: {
    equipped: Partial<Record<GearSlot, IItem | null>>;
    bags: (IItem | null)[];
  };
  talents: ISaveTalents;
  combatState: ISaveCombatState;
  settings: ISaveSettings;
}
