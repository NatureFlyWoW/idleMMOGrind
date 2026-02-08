import {
  Race, CharacterClass, Specialization, PrimaryStat,
  ResourceType, ArmorType, WeaponType, Role,
} from './enums';

/** Per-level stat growth rates for a class */
export interface IStatGrowthRates {
  [PrimaryStat.Strength]: number;
  [PrimaryStat.Agility]: number;
  [PrimaryStat.Intellect]: number;
  [PrimaryStat.Spirit]: number;
  [PrimaryStat.Stamina]: number;
}

/** Primary stat block (5 stats) */
export interface IPrimaryStatBlock {
  [PrimaryStat.Strength]: number;
  [PrimaryStat.Agility]: number;
  [PrimaryStat.Intellect]: number;
  [PrimaryStat.Spirit]: number;
  [PrimaryStat.Stamina]: number;
}

/** Racial ability definition */
export interface IRacialAbility {
  id: string;
  name: string;
  description: string;
  effectType: 'stat_percent' | 'xp_percent' | 'immunity' | 'resource_percent' | 'damage_percent';
  stat?: string;
  value: number;
}

/** Race definition (loaded from data/races.json) */
export interface IRaceDefinition {
  id: Race;
  name: string;
  description: string;
  statBonuses: IPrimaryStatBlock;
  racialAbility: IRacialAbility;
  recommendedClasses: CharacterClass[];
}

/** Spec definition within a class */
export interface ISpecDefinition {
  id: Specialization;
  name: string;
  description: string;
  role: Role;
  icon: string;
}

/** Class definition (loaded from data/classes.json) */
export interface IClassDefinition {
  id: CharacterClass;
  name: string;
  description: string;
  primaryStats: PrimaryStat[];
  roles: Role[];
  resourceType: ResourceType;
  armorType: ArmorType;
  weaponTypes: WeaponType[];
  specs: [ISpecDefinition, ISpecDefinition, ISpecDefinition];
  baseStats: IPrimaryStatBlock;
  baseHP: number;
  baseResource: number;
  statGrowth: IStatGrowthRates;
}

/** Parameters for creating a new character */
export interface ICharacterCreationParams {
  name: string;
  race: Race;
  classId: CharacterClass;
}
