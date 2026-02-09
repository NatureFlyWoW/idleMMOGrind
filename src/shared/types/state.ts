import { Race, CharacterClass, ResourceType, GearSlot } from './enums';
import { IPrimaryStatBlock } from './character';
import { IItem } from './item';
import { ICombatSnapshot, ICombatLogEntry, IActiveBuff, IActiveDoT } from './combat';
import { ITalentSnapshot } from './talent';
import { IActiveQuest } from './world';
import { IProfessionState, IMaterialBankEntry, ICraftingQueueEntry } from './profession';

/** Character snapshot for the renderer */
export interface ICharacterSnapshot {
  id: string;
  name: string;
  race: Race;
  classId: CharacterClass;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  gold: number;
  resourceType: ResourceType;
  totalKills: number;
  totalQuestsCompleted: number;
  deathCount: number;
  playTimeSeconds: number;
}

/** Computed stats after all modifiers */
export interface IComputedStats {
  primaryStats: IPrimaryStatBlock;
  attackPower: number;
  spellPower: number;
  criticalStrike: number;
  haste: number;
  armor: number;
  resistance: number;
  hitRating: number;
  dodge: number;
  parry: number;
  maxHealth: number;
  maxMana: number;
  healthRegen: number;
  manaRegen: number;
}

/** Profession state snapshot for the renderer */
export interface IProfessionSnapshot {
  primary: [IProfessionState | null, IProfessionState | null];
  secondary: IProfessionState[];
  materialBank: IMaterialBankEntry[];
  craftingQueues: Record<string, readonly ICraftingQueueEntry[]>;
}

/** Full game state snapshot sent from engine to renderer */
export interface IGameStateSnapshot {
  character: ICharacterSnapshot | null;
  computedStats: IComputedStats | null;
  combat: ICombatSnapshot;
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  talents: ITalentSnapshot | null;
  activeQuest: IActiveQuest | null;
  currentZoneId: string | null;
  currentZoneName: string | null;
  recentCombatLog: ICombatLogEntry[];
  professions: IProfessionSnapshot | null;
  timestamp: number;
}
