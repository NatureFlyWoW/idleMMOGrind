import { DamageType, ResourceType } from './enums';

/** Result of a single damage/heal calculation */
export interface IDamageResult {
  amount: number;
  type: DamageType;
  isCrit: boolean;
}

/** An active DoT/HoT effect on a combatant */
export interface IActiveDoT {
  id: string;
  sourceAbilityId: string;
  damagePerTick: number;
  ticksRemaining: number;
  totalTicks: number;
  damageType: DamageType;
  canCrit: boolean;
}

/** An active buff/debuff */
export interface IActiveBuff {
  id: string;
  name: string;
  sourceAbilityId: string;
  ticksRemaining: number;
  totalTicks: number;
  stacks: number;
  maxStacks: number;
  effects: IBuffEffect[];
}

/** A single effect from a buff */
export interface IBuffEffect {
  type: 'stat_flat' | 'stat_percent' | 'damage_percent' | 'healing_percent' | 'haste_percent';
  stat?: string;
  value: number;
}

/** Ability rank (abilities scale with rank/level) */
export interface IAbilityRank {
  rank: number;
  requiredLevel: number;
  resourceCost: number;
  baseDamage?: number;
  baseHealing?: number;
  coefficient: number;
  cooldownMs: number;
  duration?: number;
  tickCount?: number;
}

/** Full ability definition */
export interface IAbilityDefinition {
  id: string;
  name: string;
  classId: string;
  type: string;
  damageType: DamageType;
  resourceType: ResourceType;
  description: string;
  ranks: IAbilityRank[];
  isAutoAttack?: boolean;
}

/** Snapshot of combat state sent to the renderer */
export interface ICombatSnapshot {
  inCombat: boolean;
  playerHP: number;
  playerMaxHP: number;
  playerResource: number;
  playerMaxResource: number;
  resourceType: ResourceType;
  targetName: string | null;
  targetHP: number;
  targetMaxHP: number;
  targetLevel: number;
  dps: number;
  activeBuffs: IActiveBuff[];
  activeDoTs: IActiveDoT[];
}

/** A single combat log entry */
export interface ICombatLogEntry {
  timestamp: number;
  type: string;
  source: string;
  target: string;
  value?: number;
  abilityName?: string;
  itemName?: string;
  isCritical?: boolean;
}
