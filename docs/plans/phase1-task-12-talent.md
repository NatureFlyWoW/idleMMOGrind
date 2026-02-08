# Phase 1 Implementation Plan — Talent System (Task 12)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Pending

---

## Task 12 -- Talent System

**Worktree:** `feat/talent-system`
**Branch:** `feat/talent-system`
**Depends on:** Tasks 3, 4

### Step 12.1 -- Write talent manager tests

**File: `tests/unit/engine/talents/talent-manager.test.ts`**

```typescript
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
```

### Step 12.2 -- Implement talent manager

**File: `src/engine/talents/talent-manager.ts`**

```typescript
import type { ITalentTree, ITalentAllocation, ITalentEffect } from '@shared/types/talent';
import type { IBalanceConfig } from '@shared/types/balance';

/**
 * Check if a talent point can be allocated to the given node.
 */
export function canAllocatePoint(
  tree: ITalentTree,
  nodeId: string,
  allocation: ITalentAllocation,
  _config: IBalanceConfig,
): boolean {
  if (allocation.pointsAvailable <= 0) return false;

  const node = tree.nodes.find(n => n.id === nodeId);
  if (!node) return false;

  // Check max rank
  const currentRank = allocation.allocatedPoints[nodeId] ?? 0;
  if (currentRank >= node.maxRank) return false;

  // Check tier requirement (points spent in THIS tree)
  const pointsInTree = getPointsInTree(tree, allocation);
  if (pointsInTree < node.pointsRequired) return false;

  // Check prerequisite
  if (node.prerequisiteNodeId) {
    const prereqNode = tree.nodes.find(n => n.id === node.prerequisiteNodeId);
    if (!prereqNode) return false;
    const prereqRank = allocation.allocatedPoints[node.prerequisiteNodeId] ?? 0;
    if (prereqRank < prereqNode.maxRank) return false;
  }

  return true;
}

/**
 * Count total points spent in a specific tree.
 */
function getPointsInTree(tree: ITalentTree, allocation: ITalentAllocation): number {
  let total = 0;
  for (const node of tree.nodes) {
    total += allocation.allocatedPoints[node.id] ?? 0;
  }
  return total;
}

/**
 * Allocate one talent point to the given node.
 * Caller should check canAllocatePoint first.
 */
export function allocateTalentPoint(
  tree: ITalentTree,
  nodeId: string,
  allocation: ITalentAllocation,
  config: IBalanceConfig,
): ITalentAllocation {
  if (!canAllocatePoint(tree, nodeId, allocation, config)) {
    return allocation;
  }

  const currentRank = allocation.allocatedPoints[nodeId] ?? 0;
  return {
    allocatedPoints: {
      ...allocation.allocatedPoints,
      [nodeId]: currentRank + 1,
    },
    totalPointsSpent: allocation.totalPointsSpent + 1,
    pointsAvailable: allocation.pointsAvailable - 1,
  };
}

/**
 * Reset all talent points.
 */
export function resetTalents(allocation: ITalentAllocation): ITalentAllocation {
  const totalPoints = allocation.totalPointsSpent + allocation.pointsAvailable;
  return {
    allocatedPoints: {},
    totalPointsSpent: 0,
    pointsAvailable: totalPoints,
  };
}

/**
 * Calculate gold cost for a talent respec.
 * cost = floor(baseCost * level * (1 + respecCount * multiplier))
 */
export function getRespecCost(
  level: number,
  respecCount: number,
  config: IBalanceConfig,
): number {
  const { respecBaseCost, respecCostPerLevel, respecCountMultiplier } = config.talents;
  return Math.floor(respecBaseCost * level * respecCostPerLevel * (1 + respecCount * respecCountMultiplier));
}

/**
 * Collect all active talent effects for a given allocation across all trees.
 */
export function getTalentEffects(
  trees: ITalentTree[],
  allocation: ITalentAllocation,
): ITalentEffect[] {
  const effects: ITalentEffect[] = [];
  for (const tree of trees) {
    for (const node of tree.nodes) {
      const rank = allocation.allocatedPoints[node.id] ?? 0;
      if (rank > 0) {
        const effect = node.effects.find(e => e.rank === rank);
        if (effect) {
          effects.push(effect);
        }
      }
    }
  }
  return effects;
}
```

**Run:** `pnpm test -- tests/unit/engine/talents/talent-manager.test.ts` -- should PASS.

**Commit:** `feat(talents): add talent manager with allocation, validation, respec, and effects`

---

