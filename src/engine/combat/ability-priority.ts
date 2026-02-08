import { ResourceType } from '@shared/types/enums';

export type AbilityCondition =
  | { type: 'resource_above'; resource: ResourceType; percent: number }
  | { type: 'resource_below'; resource: ResourceType; percent: number }
  | { type: 'target_health_below'; percent: number }
  | { type: 'target_health_above'; percent: number }
  | { type: 'buff_missing'; buffId: string }
  | { type: 'debuff_missing_on_target'; debuffId: string }
  | { type: 'cooldown_ready' }
  | { type: 'always' };

export interface IAbilityPriorityEntry {
  abilityId: string;
  enabled: boolean;
  conditions: AbilityCondition[];
}

interface ICombatantState {
  currentResource: number;
  maxResource: number;
  currentHP: number;
  maxHP: number;
}

interface ITargetState {
  currentHP: number;
  maxHP: number;
}

function meetsCondition(
  condition: AbilityCondition,
  character: ICombatantState,
  target: ITargetState,
): boolean {
  switch (condition.type) {
    case 'always':
      return true;
    case 'target_health_below':
      return (target.currentHP / target.maxHP) * 100 < condition.percent;
    case 'target_health_above':
      return (target.currentHP / target.maxHP) * 100 > condition.percent;
    case 'resource_above':
      return (character.currentResource / character.maxResource) * 100 > condition.percent;
    case 'resource_below':
      return (character.currentResource / character.maxResource) * 100 < condition.percent;
    case 'buff_missing':
      return true; // Simplified for Phase 1
    case 'debuff_missing_on_target':
      return true; // Simplified for Phase 1
    case 'cooldown_ready':
      return true; // Cooldown check is done externally
    default:
      return false;
  }
}

/**
 * Evaluate the ability priority list and return the first usable ability ID,
 * or null if no abilities can be used.
 */
export function selectNextAbility(
  priorities: IAbilityPriorityEntry[],
  character: ICombatantState,
  target: ITargetState,
  cooldowns: Map<string, number>,
): string | null {
  for (const entry of priorities) {
    if (!entry.enabled) continue;
    if (cooldowns.has(entry.abilityId) && (cooldowns.get(entry.abilityId) ?? 0) > 0) continue;
    if (entry.conditions.every(c => meetsCondition(c, character, target))) {
      return entry.abilityId;
    }
  }
  return null;
}
