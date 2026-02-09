"""Tests for Bayer ordered dithering."""
from __future__ import annotations
import numpy as np
import pytest
from src.core.dither import bayer_matrix, apply_ordered_dither


def test_bayer_matrix_size_2():
    """Bayer matrix size 2 has correct shape."""
    matrix = bayer_matrix(2)
    assert matrix.shape == (2, 2)


def test_bayer_matrix_size_4():
    """Bayer matrix size 4 has correct shape."""
    matrix = bayer_matrix(4)
    assert matrix.shape == (4, 4)


def test_bayer_matrix_size_8():
    """Bayer matrix size 8 has correct shape."""
    matrix = bayer_matrix(8)
    assert matrix.shape == (8, 8)


def test_bayer_matrix_normalized():
    """Bayer matrix values are in [-0.5, 0.5] range."""
    for size in [2, 4, 8]:
        matrix = bayer_matrix(size)
        assert matrix.min() >= -0.5
        assert matrix.max() <= 0.5


def test_bayer_matrix_unique_values():
    """Bayer matrix contains unique threshold values."""
    matrix = bayer_matrix(4)
    unique = np.unique(matrix)
    # Should have size*size unique values
    assert len(unique) == 16


def test_apply_ordered_dither_shape():
    """Dithered output matches input shape."""
    img = np.zeros((16, 16, 4), dtype=np.uint8)
    img[:, :, 3] = 255  # Opaque

    result = apply_ordered_dither(img, matrix_size=4, spread=16)
    assert result.shape == img.shape


def test_apply_ordered_dither_preserves_alpha():
    """Alpha channel is preserved unchanged."""
    img = np.full((16, 16, 4), 128, dtype=np.uint8)
    # Set varying alpha values
    for y in range(16):
        img[y, :, 3] = y * 16

    result = apply_ordered_dither(img, matrix_size=4, spread=16)

    # Alpha should be exactly the same
    assert np.array_equal(result[:, :, 3], img[:, :, 3])


def test_apply_ordered_dither_transparent_pixels_unchanged():
    """Transparent pixels are not dithered."""
    img = np.full((16, 16, 4), 128, dtype=np.uint8)
    img[8:, :, 3] = 0  # Bottom half transparent

    result = apply_ordered_dither(img, matrix_size=4, spread=16)

    # Transparent pixels should remain exactly the same
    assert np.array_equal(result[8:, :, :], img[8:, :, :])


def test_apply_ordered_dither_modifies_rgb():
    """RGB channels are modified by dithering."""
    img = np.full((16, 16, 4), 128, dtype=np.uint8)
    img[:, :, 3] = 255  # Opaque

    result = apply_ordered_dither(img, matrix_size=4, spread=16)

    # RGB should change (dithering adds variation)
    # At least some pixels should differ
    rgb_changed = not np.array_equal(result[:, :, :3], img[:, :, :3])
    assert rgb_changed


def test_apply_ordered_dither_clamping():
    """Dithering clamps values to [0, 255] range."""
    # White image - dithering might try to push over 255
    img = np.full((8, 8, 4), 255, dtype=np.uint8)
    result = apply_ordered_dither(img, matrix_size=4, spread=32)

    assert result[:, :, :3].min() >= 0
    assert result[:, :, :3].max() <= 255


def test_apply_ordered_dither_deterministic():
    """Same input and parameters produce identical output."""
    img = np.full((16, 16, 4), 128, dtype=np.uint8)
    img[:, :, 3] = 255

    result1 = apply_ordered_dither(img, matrix_size=4, spread=16)
    result2 = apply_ordered_dither(img, matrix_size=4, spread=16)

    assert np.array_equal(result1, result2)
