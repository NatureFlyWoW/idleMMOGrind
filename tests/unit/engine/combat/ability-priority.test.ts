import { describe, it, expect } from 'vitest';
import { selectNextAbility } from '@engine/combat/ability-priority';
import type { IAbilityPriorityEntry } from '@engine/combat/ability-priority';
import { ResourceType } from '@shared/types/enums';

describe('selectNextAbility', () => {
  const basePriority: IAbilityPriorityEntry[] = [
    {
      abilityId: 'execute',
      enabled: true,
      conditions: [{ type: 'target_health_below', percent: 20 }],
    },
    {
      abilityId: 'mortal-strike',
      enabled: true,
      conditions: [{ type: 'always' }],
    },
    {
      abilityId: 'heroic-strike',
      enabled: true,
      conditions: [{ type: 'resource_above', resource: ResourceType.Rage, percent: 60 }],
    },
  ];

  it('should select execute when target HP is below 20%', () => {
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 10, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('execute');
  });

  it('should skip execute and select mortal-strike when target HP is above 20%', () => {
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('mortal-strike');
  });

  it('should skip abilities on cooldown', () => {
    const cooldowns = new Map<string, number>();
    cooldowns.set('mortal-strike', 3);
    const result = selectNextAbility(
      basePriority,
      { currentResource: 80, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      cooldowns,
    );
    expect(result).toBe('heroic-strike');
  });

  it('should return null when no abilities are usable', () => {
    const cooldowns = new Map<string, number>();
    cooldowns.set('execute', 1);
    cooldowns.set('mortal-strike', 1);
    cooldowns.set('heroic-strike', 1);
    const result = selectNextAbility(
      basePriority,
      { currentResource: 10, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      cooldowns,
    );
    expect(result).toBeNull();
  });

  it('should skip disabled abilities', () => {
    const priorities: IAbilityPriorityEntry[] = [
      { abilityId: 'disabled-ability', enabled: false, conditions: [{ type: 'always' }] },
      { abilityId: 'active-ability', enabled: true, conditions: [{ type: 'always' }] },
    ];
    const result = selectNextAbility(
      priorities,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 50, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('active-ability');
  });
});
