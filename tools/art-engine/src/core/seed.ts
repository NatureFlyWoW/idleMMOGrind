/**
 * Seeded pseudo-random number generator using xorshift128+.
 *
 * Provides reproducible random sequences: same seed = identical output.
 * This is critical for the art engine — we commit seeds, not generated PNGs.
 */

export interface SeededRNG {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number;
  /** Returns a float in [min, max) */
  nextFloat(min: number, max: number): number;
  /** Returns true with given probability (default 0.5) */
  nextBool(probability?: number): boolean;
  /** Returns a random element from the array */
  pick<T>(array: readonly T[]): T;
  /** Returns a shuffled copy of the array (Fisher-Yates) */
  shuffle<T>(array: T[]): T[];
}

/**
 * Create a seeded RNG using xorshift128+ algorithm.
 * Same seed always produces the same sequence.
 */
export function createRNG(seed: number): SeededRNG {
  // Initialize state from seed using splitmix64-style seed expansion
  let s0 = splitmix64(seed);
  let s1 = splitmix64(s0);

  function xorshift128plus(): number {
    let x = s0;
    const y = s1;
    s0 = y;
    x ^= x << 23;
    x ^= x >> 17;
    x ^= y;
    x ^= y >> 26;
    s1 = x;
    return (s0 + s1) >>> 0;
  }

  const rng: SeededRNG = {
    next(): number {
      return xorshift128plus() / 4294967296; // 2^32
    },

    nextInt(min: number, max: number): number {
      if (min === max) return min;
      return min + Math.floor(rng.next() * (max - min + 1));
    },

    nextFloat(min: number, max: number): number {
      return min + rng.next() * (max - min);
    },

    nextBool(probability = 0.5): boolean {
      return rng.next() < probability;
    },

    pick<T>(array: readonly T[]): T {
      return array[rng.nextInt(0, array.length - 1)]!;
    },

    shuffle<T>(array: T[]): T[] {
      // Fisher-Yates shuffle
      for (let i = array.length - 1; i > 0; i--) {
        const j = rng.nextInt(0, i);
        [array[i], array[j]] = [array[j]!, array[i]!];
      }
      return array;
    },
  };

  return rng;
}

/** Splitmix64-inspired seed expansion (32-bit version) */
function splitmix64(seed: number): number {
  seed = (seed + 0x9e3779b9) | 0;
  seed = Math.imul(seed ^ (seed >>> 16), 0x85ebca6b);
  seed = Math.imul(seed ^ (seed >>> 13), 0xc2b2ae35);
  return (seed ^ (seed >>> 16)) >>> 0;
}
