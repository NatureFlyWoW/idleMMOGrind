import { describe, it, expect } from 'vitest';
import {
  MonsterSubtype, ZoneEventType,
} from '@shared/types/enums';
import type {
  IMonsterTemplateV2, IQuestChain, IEliteArea, IRareSpawn, IZoneEvent,
} from '@shared/types/zone-expansion';

describe('Zone Expansion Types', () => {
  it('MonsterSubtype enum has all 6 values', () => {
    expect(Object.values(MonsterSubtype)).toHaveLength(6);
  });

  it('ZoneEventType enum has all 5 values', () => {
    expect(Object.values(ZoneEventType)).toHaveLength(5);
  });

  it('IQuestChain structure compiles correctly', () => {
    const chain: IQuestChain = {
      id: 'qc_test',
      zoneId: 'zone_01',
      name: 'Test Chain',
      description: 'A test',
      quests: [{
        id: 'q_01',
        name: 'Kill Wolves',
        description: 'Kill 10 wolves',
        type: 'kill' as any,
        objectives: [{ type: 'kill', targetId: 'wolf', count: 10 }],
        xpReward: 100,
        goldReward: 50,
        nextQuestId: null,
      }],
      completionReward: { xpBonus: 500, goldBonus: 100, reputationBonus: 250 },
    };
    expect(chain.quests).toHaveLength(1);
  });
});
