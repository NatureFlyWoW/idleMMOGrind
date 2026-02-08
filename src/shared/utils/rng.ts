/**
 * Mulberry32 seeded PRNG.
 * Fast, small state, good distribution for game purposes.
 * Produces deterministic sequences from a given seed.
 */
export class SeededRandom {
  private state: number;
  private readonly initialSeed: number;

  constructor(seed: number) {
    this.initialSeed = seed;
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number {
    if (min === max) return min;
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a float in [min, max) */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Returns true with the given probability [0, 1] */
  chance(probability: number): boolean {
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return this.next() < probability;
  }

  /** Picks from weighted items. Each item has { item: T, weight: number }. */
  weightedChoice<T>(items: ReadonlyArray<{ item: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.next() * totalWeight;

    for (const entry of items) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }

    // Fallback to last item (floating point edge case)
    return items[items.length - 1]!.item;
  }

  /** Creates an independent child RNG derived from current state */
  fork(): SeededRandom {
    return new SeededRandom(Math.floor(this.next() * 2147483647));
  }

  /** Returns the original seed */
  getSeed(): number {
    return this.initialSeed;
  }
}
