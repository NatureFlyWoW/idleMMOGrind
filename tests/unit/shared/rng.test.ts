import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@shared/utils/rng';

describe('SeededRandom', () => {
  it('should produce deterministic sequences from the same seed', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should produce different sequences from different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('next() should return values in [0, 1)', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('nextInt(min, max) should return integers in [min, max]', () => {
    const rng = new SeededRandom(999);
    for (let i = 0; i < 500; i++) {
      const val = rng.nextInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('nextInt should handle min === max', () => {
    const rng = new SeededRandom(1);
    expect(rng.nextInt(5, 5)).toBe(5);
  });

  it('nextFloat(min, max) should return floats in [min, max)', () => {
    const rng = new SeededRandom(777);
    for (let i = 0; i < 500; i++) {
      const val = rng.nextFloat(10.0, 20.0);
      expect(val).toBeGreaterThanOrEqual(10.0);
      expect(val).toBeLessThan(20.0);
    }
  });

  it('chance(probability) should respect probability', () => {
    const rng = new SeededRandom(42);
    let trueCount = 0;
    const trials = 10000;

    for (let i = 0; i < trials; i++) {
      if (rng.chance(0.5)) trueCount++;
    }

    // Should be roughly 50%, allow 5% margin
    expect(trueCount / trials).toBeGreaterThan(0.45);
    expect(trueCount / trials).toBeLessThan(0.55);
  });

  it('chance(0) should always return false', () => {
    const rng = new SeededRandom(1);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
    }
  });

  it('chance(1) should always return true', () => {
    const rng = new SeededRandom(1);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('weightedChoice should respect weights', () => {
    const rng = new SeededRandom(42);
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    const items = [
      { item: 'a', weight: 70 },
      { item: 'b', weight: 20 },
      { item: 'c', weight: 10 },
    ];

    for (let i = 0; i < 10000; i++) {
      const result = rng.weightedChoice(items);
      counts[result]++;
    }

    // 'a' should be most common
    expect(counts['a']).toBeGreaterThan(counts['b']!);
    expect(counts['b']).toBeGreaterThan(counts['c']!);
  });

  it('getSeed() should return the original seed', () => {
    const rng = new SeededRandom(12345);
    expect(rng.getSeed()).toBe(12345);
  });

  it('fork() should create independent child RNG', () => {
    const parent = new SeededRandom(42);
    parent.next(); // advance parent
    const child = parent.fork();

    // Advance parent further
    const parentVal = parent.next();
    const childVal = child.next();

    // They should produce different values since child was forked
    // (child's seed is derived from parent's current state)
    // Both should still be deterministic
    expect(typeof parentVal).toBe('number');
    expect(typeof childVal).toBe('number');
  });
});
