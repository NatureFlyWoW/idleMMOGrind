import { describe, it, expect } from 'vitest';
import {
  canAllocatePoint,
  allocateTalentPoint,
  resetTalents,
  getRespecCost,
  getTalentEffects,
} from '@engine/talents/talent-manager';
import { loadBalanceConfig } from '@shared/utils/balance-loader';
import type { ITalentTree, ITalentNode, ITalentAllocation } from '@shared/types/talent';

const config = loadBalanceConfig();

function makeTier1Node(id: string, maxRank: number = 5): ITalentNode {
  return {
    id,
    name: `Test Node ${id}`,
    description: 'Test',
    icon: 'test',
    tier: 1,
    position: { row: 0, col: 0 },
    maxRank,
    pointsRequired: 0,
    effects: Array.from({ length: maxRank }, (_, i) => ({
      rank: i + 1,
      type: 'stat_bonus' as const,
      stat: 'str',
      value: 2 * (i + 1),
      description: `+${2 * (i + 1)}% Strength`,
    })),
  };
}

function makeTier2Node(id: string, maxRank: number = 3): ITalentNode {
  return {
    ...makeTier1Node(id, maxRank),
    tier: 2,
    pointsRequired: 5,
  };
}

function makeTree(): ITalentTree {
  return {
    id: 'test-tree',
    specId: 'weapon-arts' as any,
    name: 'Test Tree',
    classId: 'blademaster' as any,
    description: 'Test tree',
    icon: 'test',
    nodes: [
      makeTier1Node('node-t1-a', 5),
      makeTier1Node('node-t1-b', 5),
      makeTier2Node('node-t2-a', 3),
    ],
  };
}

describe('canAllocatePoint', () => {
  const tree = makeTree();
  const emptyAllocation: ITalentAllocation = {
    allocatedPoints: {},
    totalPointsSpent: 0,
    pointsAvailable: 10,
  };

  it('should allow allocating to a tier 1 node with available points', () => {
    expect(canAllocatePoint(tree, 'node-t1-a', emptyAllocation, config)).toBe(true);
  });

  it('should not allow allocating if no points available', () => {
    const noPoints: ITalentAllocation = { ...emptyAllocation, pointsAvailable: 0 };
    expect(canAllocatePoint(tree, 'node-t1-a', noPoints, config)).toBe(false);
  });

  it('should not allow exceeding max rank', () => {
    const maxed: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 5 },
      totalPointsSpent: 5,
      pointsAvailable: 5,
    };
    expect(canAllocatePoint(tree, 'node-t1-a', maxed, config)).toBe(false);
  });

  it('should not allow tier 2 without 5 points in tree', () => {
    const fewPoints: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 3 },
      totalPointsSpent: 3,
      pointsAvailable: 7,
    };
    expect(canAllocatePoint(tree, 'node-t2-a', fewPoints, config)).toBe(false);
  });

  it('should allow tier 2 with 5+ points in tree', () => {
    const enoughPoints: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 5 },
      totalPointsSpent: 5,
      pointsAvailable: 5,
    };
    expect(canAllocatePoint(tree, 'node-t2-a', enoughPoints, config)).toBe(true);
  });
});

describe('allocateTalentPoint', () => {
  const tree = makeTree();

  it('should increment the node rank and decrement available points', () => {
    const allocation: ITalentAllocation = {
      allocatedPoints: {},
      totalPointsSpent: 0,
      pointsAvailable: 10,
    };
    const result = allocateTalentPoint(tree, 'node-t1-a', allocation, config);
    expect(result.allocatedPoints['node-t1-a']).toBe(1);
    expect(result.pointsAvailable).toBe(9);
    expect(result.totalPointsSpent).toBe(1);
  });
});

describe('resetTalents', () => {
  it('should clear all allocations and restore points', () => {
    const allocation: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 5, 'node-t2-a': 3 },
      totalPointsSpent: 8,
      pointsAvailable: 2,
    };
    const result = resetTalents(allocation);
    expect(result.allocatedPoints).toEqual({});
    expect(result.totalPointsSpent).toBe(0);
    expect(result.pointsAvailable).toBe(10);
  });
});

describe('getRespecCost', () => {
  it('should calculate first respec at level 60 as 600 gold', () => {
    const cost = getRespecCost(60, 0, config);
    expect(cost).toBe(600);
  });

  it('should increase cost with respec count', () => {
    const cost0 = getRespecCost(60, 0, config);
    const cost1 = getRespecCost(60, 1, config);
    expect(cost1).toBeGreaterThan(cost0);
  });
});
