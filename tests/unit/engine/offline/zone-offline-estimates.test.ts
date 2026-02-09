import { describe, it, expect } from 'vitest';
import {
  estimateQuestChainProgress,
  estimateZoneEventXpMultiplier,
  estimateRareSpawnProbability,
} from '@engine/offline/offline-calculator';
import type { IZoneEvent } from '@shared/types/zone-expansion';
import { ZoneEventType } from '@shared/types/enums';

describe('estimateQuestChainProgress', () => {
  it('should return 0 for 0 seconds offline', () => {
    expect(estimateQuestChainProgress(0, 1.0, 5)).toBe(0);
  });

  it('should return 0 for 0 kills per second', () => {
    expect(estimateQuestChainProgress(3600, 0, 5)).toBe(0);
  });

  it('should return 0 for 0 kills per quest', () => {
    expect(estimateQuestChainProgress(3600, 1.0, 0)).toBe(0);
  });

  it('should return 0 for negative offline seconds', () => {
    expect(estimateQuestChainProgress(-100, 1.0, 5)).toBe(0);
  });

  it('should estimate quest completions based on kill rate', () => {
    // 1 kill/sec, 10 kills/quest, 100 seconds = 10 quests possible, capped at chain size 5
    const result = estimateQuestChainProgress(100, 1.0, 10, 5);
    expect(result).toBe(5);
  });

  it('should not exceed the number of quests in the chain', () => {
    // 1 kill/sec, 5 kills/quest, 3600 seconds = 720 quests possible, capped at 8
    const result = estimateQuestChainProgress(3600, 1.0, 5, 8);
    expect(result).toBe(8);
  });

  it('should handle fractional results by flooring', () => {
    // 1 kill/sec, 7 kills/quest, 10 seconds = 1.43 quests -> 1
    const result = estimateQuestChainProgress(10, 1.0, 7, 10);
    expect(result).toBe(1);
  });

  it('should use default chain size of 5', () => {
    // 1 kill/sec, 1 kill/quest, 100 seconds = 100 quests possible, capped at default 5
    const result = estimateQuestChainProgress(100, 1.0, 1);
    expect(result).toBe(5);
  });
});

describe('estimateZoneEventXpMultiplier', () => {
  const makeEvent = (xpMult: number, durationMs: number, cooldownMs: number): IZoneEvent => ({
    id: 'test_event',
    zoneId: 'zone_01',
    type: ZoneEventType.MonsterSurge,
    durationMs,
    cooldownMs,
    effects: { xpMultiplier: xpMult },
  });

  it('should return 1.0 for empty event array', () => {
    expect(estimateZoneEventXpMultiplier([], 0.15)).toBe(1.0);
  });

  it('should return 1.0 for 0 base chance', () => {
    const events = [makeEvent(1.5, 600000, 1800000)];
    expect(estimateZoneEventXpMultiplier(events, 0)).toBe(1.0);
  });

  it('should return > 1.0 for events with xpMultiplier > 1.0', () => {
    const events = [makeEvent(1.5, 600000, 1800000)];
    const result = estimateZoneEventXpMultiplier(events, 0.15);
    expect(result).toBeGreaterThan(1.0);
  });

  it('should ignore events without xpMultiplier effect', () => {
    const event: IZoneEvent = {
      id: 'test',
      zoneId: 'zone_01',
      type: ZoneEventType.GatheringBounty,
      durationMs: 600000,
      cooldownMs: 1800000,
      effects: { gatheringMultiplier: 2.0 },
    };
    expect(estimateZoneEventXpMultiplier([event], 0.15)).toBe(1.0);
  });

  it('should ignore events with xpMultiplier <= 1.0', () => {
    const events = [makeEvent(1.0, 600000, 1800000)];
    expect(estimateZoneEventXpMultiplier(events, 0.15)).toBe(1.0);
  });

  it('should accumulate bonuses from multiple events', () => {
    const events = [
      makeEvent(1.5, 600000, 1800000),
      makeEvent(2.0, 600000, 2400000),
    ];
    const result = estimateZoneEventXpMultiplier(events, 0.15);
    // Both events contribute, so bonus should be larger than a single event
    const singleResult = estimateZoneEventXpMultiplier([events[0]!], 0.15);
    expect(result).toBeGreaterThan(singleResult);
  });

  it('should produce deterministic results', () => {
    const events = [makeEvent(1.5, 600000, 1800000)];
    const r1 = estimateZoneEventXpMultiplier(events, 0.15);
    const r2 = estimateZoneEventXpMultiplier(events, 0.15);
    expect(r1).toBe(r2);
  });
});

describe('estimateRareSpawnProbability', () => {
  it('should return 0 for 0 spawn chance', () => {
    expect(estimateRareSpawnProbability(0, 1000)).toBe(0);
  });

  it('should return 0 for 0 kills', () => {
    expect(estimateRareSpawnProbability(0.03, 0)).toBe(0);
  });

  it('should return 0 for negative spawn chance', () => {
    expect(estimateRareSpawnProbability(-0.1, 100)).toBe(0);
  });

  it('should return 0 for negative kills', () => {
    expect(estimateRareSpawnProbability(0.03, -10)).toBe(0);
  });

  it('should return 1 for spawn chance >= 1', () => {
    expect(estimateRareSpawnProbability(1.0, 5)).toBe(1);
    expect(estimateRareSpawnProbability(1.5, 5)).toBe(1);
  });

  it('should approach 1 for many kills with non-zero chance', () => {
    // 3% chance per kill, 1000 kills
    const result = estimateRareSpawnProbability(0.03, 1000);
    expect(result).toBeGreaterThan(0.99);
  });

  it('should return a reasonable probability for typical values', () => {
    // 3% chance per kill, 100 kills
    // P = 1 - (0.97)^100 ~ 0.9524
    const result = estimateRareSpawnProbability(0.03, 100);
    expect(result).toBeCloseTo(0.9524, 2);
  });

  it('should increase with more kills', () => {
    const prob50 = estimateRareSpawnProbability(0.03, 50);
    const prob100 = estimateRareSpawnProbability(0.03, 100);
    expect(prob100).toBeGreaterThan(prob50);
  });

  it('should be between 0 and 1 for valid inputs', () => {
    const result = estimateRareSpawnProbability(0.05, 20);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });
});
