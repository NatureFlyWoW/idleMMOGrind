"""Deterministic seeded RNG wrapper around Python's random module."""
from __future__ import annotations
import random


class SeededRNG:
    """Seeded random number generator. Same seed = identical sequence."""

    def __init__(self, seed: int):
        self._rng = random.Random(seed)

    def random(self) -> float:
        """Return float in [0.0, 1.0)."""
        return self._rng.random()

    def randint(self, a: int, b: int) -> int:
        """Return integer in [a, b] inclusive."""
        return self._rng.randint(a, b)

    def choice(self, seq):
        """Pick a random element from non-empty sequence."""
        return self._rng.choice(seq)

    def shuffle(self, lst: list) -> None:
        """Shuffle list in place."""
        self._rng.shuffle(lst)

    def jitter(self, base: float, pct: float) -> float:
        """Return base ± pct%. E.g., jitter(100, 0.1) returns 90-110."""
        offset = base * pct
        return base + self._rng.uniform(-offset, offset)
