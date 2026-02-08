import { describe, it, expect } from 'vitest';
import { createRNG } from '../../../../tools/art-engine/src/core/seed.js';

describe('SeededRNG', () => {
  describe('createRNG', () => {
    it('creates an RNG from a numeric seed', () => {
      const rng = createRNG(42);
      expect(rng).toBeDefined();
      expect(typeof rng.next).toBe('function');
    });
  });

  describe('next', () => {
    it('returns a float between 0 (inclusive) and 1 (exclusive)', () => {
      const rng = createRNG(42);
      for (let i = 0; i < 100; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('produces the same sequence for the same seed', () => {
      const rng1 = createRNG(42);
      const rng2 = createRNG(42);
      const seq1 = Array.from({ length: 20 }, () => rng1.next());
      const seq2 = Array.from({ length: 20 }, () => rng2.next());
      expect(seq1).toEqual(seq2);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = createRNG(42);
      const rng2 = createRNG(99);
      const seq1 = Array.from({ length: 10 }, () => rng1.next());
      const seq2 = Array.from({ length: 10 }, () => rng2.next());
      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('nextInt', () => {
    it('returns integers within the specified range (inclusive)', () => {
      const rng = createRNG(42);
      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(5, 10);
        expect(val).toBeGreaterThanOrEqual(5);
        expect(val).toBeLessThanOrEqual(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('returns min when min equals max', () => {
      const rng = createRNG(42);
      expect(rng.nextInt(7, 7)).toBe(7);
    });
  });

  describe('nextBool', () => {
    it('returns boolean values', () => {
      const rng = createRNG(42);
      for (let i = 0; i < 20; i++) {
        expect(typeof rng.nextBool()).toBe('boolean');
      }
    });

    it('with probability 0 always returns false', () => {
      const rng = createRNG(42);
      for (let i = 0; i < 20; i++) {
        expect(rng.nextBool(0)).toBe(false);
      }
    });

    it('with probability 1 always returns true', () => {
      const rng = createRNG(42);
      for (let i = 0; i < 20; i++) {
        expect(rng.nextBool(1)).toBe(true);
      }
    });
  });

  describe('pick', () => {
    it('returns an element from the array', () => {
      const rng = createRNG(42);
      const items = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 20; i++) {
        expect(items).toContain(rng.pick(items));
      }
    });
  });

  describe('shuffle', () => {
    it('returns an array with the same elements', () => {
      const rng = createRNG(42);
      const items = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...items]);
      expect(shuffled).toHaveLength(items.length);
      expect(shuffled.sort()).toEqual(items.sort());
    });

    it('produces the same shuffle for the same seed', () => {
      const rng1 = createRNG(42);
      const rng2 = createRNG(42);
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(rng1.shuffle([...items])).toEqual(rng2.shuffle([...items]));
    });
  });

  describe('nextFloat', () => {
    it('returns a float within the specified range', () => {
      const rng = createRNG(42);
      for (let i = 0; i < 100; i++) {
        const val = rng.nextFloat(2.0, 5.0);
        expect(val).toBeGreaterThanOrEqual(2.0);
        expect(val).toBeLessThan(5.0);
      }
    });
  });
});
