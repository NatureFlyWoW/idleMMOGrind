import {
  ProfessionId, ProfessionType, SkillBracket, RecipeDifficulty,
  MaterialTier, GearSlot, ItemQuality, PrimaryStat,
} from './enums';

/** Profession definition */
export interface IProfessionDefinition {
  id: ProfessionId;
  name: string;
  type: ProfessionType;
  description: string;
  skillBrackets: ISkillBracket[];
  pairsWith?: ProfessionId;
}

/** Skill bracket thresholds */
export interface ISkillBracket {
  bracket: SkillBracket;
  skillMin: number;
  skillMax: number;
  requiredLevel: number;
  trainingCost: number;
}

/** Material definition */
export interface IMaterial {
  id: string;
  name: string;
  tier: MaterialTier;
  stackSize: number;
  vendorPrice: number;
  source: 'gathering' | 'monster_drop' | 'dungeon_drop' | 'vendor';
  gatheringProfession?: ProfessionId;
}

/** Recipe definition */
export interface IRecipe {
  id: string;
  professionId: ProfessionId;
  name: string;
  skillRequired: number;
  skillUpChance: { orange: number; yellow: number; green: number; gray: number };
  materials: IRecipeMaterial[];
  craftTimeMs: number;
  output: IRecipeOutput;
}

/** Material requirement for a recipe */
export interface IRecipeMaterial {
  materialId: string;
  quantity: number;
}

/** Recipe output */
export interface IRecipeOutput {
  type: 'item' | 'consumable' | 'enchantment';
  itemTemplateId?: string;
  consumableEffect?: IConsumableEffect;
  enchantEffect?: IEnchantEffect;
  quantity: number;
  iLevel?: number;
  quality?: ItemQuality;
}

/** Consumable buff effect */
export interface IConsumableEffect {
  id: string;
  name: string;
  durationMs: number;
  statBonuses: Partial<Record<PrimaryStat, number>>;
  description: string;
}

/** Enchant effect */
export interface IEnchantEffect {
  id: string;
  name: string;
  slot: GearSlot;
  statBonuses: Partial<Record<PrimaryStat, number>>;
  description: string;
}

/** Player profession state */
export interface IProfessionState {
  professionId: ProfessionId;
  skill: number;
  maxSkill: number;
  knownRecipes: string[];
  currentBracket: SkillBracket;
}

/** Material bank entry */
export interface IMaterialBankEntry {
  materialId: string;
  quantity: number;
}

/** Crafting queue entry */
export interface ICraftingQueueEntry {
  recipeId: string;
  startedAt: number;
  completesAt: number;
}

/** Gathering tick result */
export interface IGatheringResult {
  materialId: string;
  quantity: number;
  skillUp: boolean;
}

/** Crafting result */
export interface ICraftingResult {
  recipeId: string;
  outputItemId?: string;
  consumableEffect?: IConsumableEffect;
  skillUp: boolean;
  newSkill: number;
}
