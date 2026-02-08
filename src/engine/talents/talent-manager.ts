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
 * cost = floor(baseCost * level * costPerLevel * (1 + respecCount * multiplier))
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
