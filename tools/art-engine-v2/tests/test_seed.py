"""Tests for SeededRNG deterministic random number generation."""
from __future__ import annotations
import pytest
from src.core.seed import SeededRNG


def test_deterministic():
    """Same seed produces identical sequences."""
    rng1 = SeededRNG(42)
    rng2 = SeededRNG(42)

    # Test random()
    seq1 = [rng1.random() for _ in range(10)]
    seq2 = [rng2.random() for _ in range(10)]
    assert seq1 == seq2

    # Test randint()
    rng1 = SeededRNG(42)
    rng2 = SeededRNG(42)
    seq1 = [rng1.randint(1, 100) for _ in range(10)]
    seq2 = [rng2.randint(1, 100) for _ in range(10)]
    assert seq1 == seq2


def test_different_seeds_differ():
    """Different seeds produce different sequences."""
    rng1 = SeededRNG(42)
    rng2 = SeededRNG(99)

    seq1 = [rng1.random() for _ in range(10)]
    seq2 = [rng2.random() for _ in range(10)]
    assert seq1 != seq2


def test_int_range():
    """randint stays within specified bounds."""
    rng = SeededRNG(42)
    for _ in range(100):
        val = rng.randint(10, 20)
        assert 10 <= val <= 20


def test_choice():
    """choice always picks from provided items."""
    rng = SeededRNG(42)
    items = ["a", "b", "c"]
    for _ in range(50):
        choice = rng.choice(items)
        assert choice in items


def test_shuffle():
    """shuffle reorders list in place deterministically."""
    rng1 = SeededRNG(42)
    rng2 = SeededRNG(42)

    list1 = list(range(10))
    list2 = list(range(10))

    rng1.shuffle(list1)
    rng2.shuffle(list2)

    # Same seed produces same shuffle
    assert list1 == list2
    # But it's not the original order
    assert list1 != list(range(10))


def test_jitter():
    """jitter stays within ±pct range."""
    rng = SeededRNG(42)
    base = 100.0
    pct = 0.1

    for _ in range(100):
        val = rng.jitter(base, pct)
        assert 90.0 <= val <= 110.0


def test_jitter_deterministic():
    """jitter produces same results with same seed."""
    rng1 = SeededRNG(42)
    rng2 = SeededRNG(42)

    vals1 = [rng1.jitter(100, 0.1) for _ in range(10)]
    vals2 = [rng2.jitter(100, 0.1) for _ in range(10)]

    assert vals1 == vals2
