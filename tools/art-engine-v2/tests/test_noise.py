"""Tests for noise generation."""
import numpy as np
import pytest
from src.core.noise import generate_noise, generate_tileable_noise


def test_generate_noise_shape():
    """Test output shape matches requested dimensions."""
    noise = generate_noise(width=100, height=80)
    # Note: returned shape is (height, width) since it's a numpy array
    assert noise.shape == (80, 100)


def test_generate_noise_deterministic():
    """Test same seed produces same output."""
    noise1 = generate_noise(width=50, height=50, scale=0.1, seed=42, octaves=2)
    noise2 = generate_noise(width=50, height=50, scale=0.1, seed=42, octaves=2)
    np.testing.assert_array_equal(noise1, noise2)


def test_generate_noise_different_seeds():
    """Test different seeds produce different output."""
    noise1 = generate_noise(width=50, height=50, scale=0.1, seed=1)
    noise2 = generate_noise(width=50, height=50, scale=0.1, seed=2)
    assert not np.array_equal(noise1, noise2)


def test_generate_noise_normalized():
    """Test values normalized to [0.0, 1.0]."""
    noise = generate_noise(width=100, height=100, scale=0.05, seed=123, octaves=3)
    assert noise.min() >= 0.0
    assert noise.max() <= 1.0
    # Check that we actually have some variation
    assert noise.std() > 0.01


def test_tileable_noise_shape():
    """Test tileable noise output shape."""
    noise = generate_tileable_noise(width=64, height=64, scale=0.05, seed=10)
    assert noise.shape == (64, 64)


def test_tileable_noise_deterministic():
    """Test tileable noise is deterministic with same seed."""
    noise1 = generate_tileable_noise(width=32, height=32, scale=0.1, seed=99)
    noise2 = generate_tileable_noise(width=32, height=32, scale=0.1, seed=99)
    np.testing.assert_array_equal(noise1, noise2)


def test_tileable_noise_normalized():
    """Test tileable noise values normalized to [0.0, 1.0]."""
    noise = generate_tileable_noise(width=128, height=128, scale=0.03, seed=7)
    assert noise.min() >= 0.0
    assert noise.max() <= 1.0


def test_tileable_noise_edges_match():
    """Test tileable noise left≈right and top≈bottom edges.

    Note: The last pixel (width-1 or height-1) is not identical to the first pixel (0)
    because they are discrete samples of a continuous torus. However, they should be
    reasonably close for visual tiling purposes.
    """
    noise = generate_tileable_noise(width=64, height=64, scale=0.05, seed=42)

    # Test left edge ≈ right edge
    # Tolerance of 0.3 allows for discrete sampling artifacts while ensuring
    # edges are close enough for visual tiling
    left_edge = noise[:, 0]
    right_edge = noise[:, -1]

    # Calculate average difference as a sanity check
    avg_diff = np.mean(np.abs(left_edge - right_edge))
    assert avg_diff < 0.15, f"Average edge difference {avg_diff:.3f} too large"

    # Check max difference
    max_diff = np.max(np.abs(left_edge - right_edge))
    assert max_diff < 0.35, f"Max edge difference {max_diff:.3f} too large"

    # Test top edge ≈ bottom edge
    top_edge = noise[0, :]
    bottom_edge = noise[-1, :]

    avg_diff = np.mean(np.abs(top_edge - bottom_edge))
    assert avg_diff < 0.15, f"Average edge difference {avg_diff:.3f} too large"

    max_diff = np.max(np.abs(top_edge - bottom_edge))
    assert max_diff < 0.35, f"Max edge difference {max_diff:.3f} too large"


def test_generate_noise_octaves():
    """Test noise generation with multiple octaves produces different results."""
    noise1 = generate_noise(width=50, height=50, scale=0.1, seed=42, octaves=1)
    noise3 = generate_noise(width=50, height=50, scale=0.1, seed=42, octaves=3)
    # More octaves should produce different patterns
    assert not np.array_equal(noise1, noise3)


def test_generate_noise_scale_effect():
    """Test different scale values produce different patterns."""
    noise1 = generate_noise(width=50, height=50, scale=0.01, seed=42)
    noise2 = generate_noise(width=50, height=50, scale=0.1, seed=42)
    assert not np.array_equal(noise1, noise2)
