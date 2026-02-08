import { CharacterClass, Specialization } from './enums';

/** A single talent effect for one rank */
export interface ITalentEffect {
  rank: number;
  type: 'stat_bonus' | 'stat_percent' | 'ability_modifier' | 'new_ability'
      | 'proc_chance' | 'resource_modifier' | 'damage_percent' | 'cooldown_reduction';
  stat?: string;
  abilityId?: string;
  value: number;
  description: string;
}

/** A node in the talent tree */
export interface ITalentNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 1 | 2 | 3 | 4 | 5;
  position: { row: number; col: number };
  maxRank: number;
  pointsRequired: number;
  prerequisiteNodeId?: string;
  effects: ITalentEffect[];
}

/** A full talent tree (one spec) */
export interface ITalentTree {
  id: string;
  specId: Specialization;
  name: string;
  classId: CharacterClass;
  description: string;
  icon: string;
  nodes: ITalentNode[];
}

/** Player's current talent allocation */
export interface ITalentAllocation {
  /** nodeId -> current rank */
  allocatedPoints: Record<string, number>;
  totalPointsSpent: number;
  pointsAvailable: number;
}

/** Talent snapshot sent to renderer */
export interface ITalentSnapshot {
  trees: ITalentTree[];
  allocation: ITalentAllocation;
  respecCost: number;
}
