"""Tests for alpha compositing."""
import numpy as np
import pytest
from src.core.compositor import alpha_composite, alpha_composite_at


def test_alpha_composite_opaque_replaces():
    """Test opaque foreground completely replaces background."""
    # Create solid red background
    bg = np.zeros((10, 10, 4), dtype=np.uint8)
    bg[:, :] = [255, 0, 0, 255]  # Red, fully opaque

    # Create solid blue foreground
    fg = np.zeros((10, 10, 4), dtype=np.uint8)
    fg[:, :] = [0, 0, 255, 255]  # Blue, fully opaque

    result = alpha_composite(bg, fg)

    # Result should be entirely blue
    np.testing.assert_array_equal(result[:, :, 0], 0)    # R
    np.testing.assert_array_equal(result[:, :, 1], 0)    # G
    np.testing.assert_array_equal(result[:, :, 2], 255)  # B
    np.testing.assert_array_equal(result[:, :, 3], 255)  # A


def test_alpha_composite_transparent_shows_bg():
    """Test fully transparent foreground shows background."""
    # Create solid red background
    bg = np.zeros((10, 10, 4), dtype=np.uint8)
    bg[:, :] = [255, 0, 0, 255]  # Red, fully opaque

    # Create transparent blue foreground
    fg = np.zeros((10, 10, 4), dtype=np.uint8)
    fg[:, :] = [0, 0, 255, 0]  # Blue, fully transparent

    result = alpha_composite(bg, fg)

    # Result should be entirely red (background)
    np.testing.assert_array_equal(result[:, :, 0], 255)  # R
    np.testing.assert_array_equal(result[:, :, 1], 0)    # G
    np.testing.assert_array_equal(result[:, :, 2], 0)    # B
    np.testing.assert_array_equal(result[:, :, 3], 255)  # A


def test_alpha_composite_half_alpha_blend():
    """Test half-alpha blend produces mid-values."""
    # Create solid red background
    bg = np.zeros((10, 10, 4), dtype=np.uint8)
    bg[:, :] = [200, 0, 0, 255]  # Red, fully opaque

    # Create half-transparent blue foreground
    fg = np.zeros((10, 10, 4), dtype=np.uint8)
    fg[:, :] = [0, 0, 200, 128]  # Blue, 50% transparent

    result = alpha_composite(bg, fg)

    # Result should be a blend
    # With 50% alpha, we expect roughly halfway between red and blue
    # Red channel should be less than 200, Blue should be less than 200
    assert result[0, 0, 0] < 200  # Some red remains
    assert result[0, 0, 0] > 0
    assert result[0, 0, 2] < 200  # Some blue mixed in
    assert result[0, 0, 2] > 0
    assert result[0, 0, 3] == 255  # Alpha should be fully opaque


def test_alpha_composite_shape_mismatch():
    """Test that shape mismatch raises assertion error."""
    bg = np.zeros((10, 10, 4), dtype=np.uint8)
    fg = np.zeros((5, 5, 4), dtype=np.uint8)

    with pytest.raises(AssertionError):
        alpha_composite(bg, fg)


def test_alpha_composite_at_center():
    """Test alpha_composite_at places foreground at offset."""
    # Create 20x20 black background
    bg = np.zeros((20, 20, 4), dtype=np.uint8)
    bg[:, :, 3] = 255  # Opaque black

    # Create 5x5 white foreground
    fg = np.ones((5, 5, 4), dtype=np.uint8) * 255  # Opaque white

    # Place at position (5, 5)
    result = alpha_composite_at(bg, fg, x=5, y=5)

    # Check that white square appears at correct position
    assert np.all(result[5:10, 5:10, :3] == 255)  # White region
    # Check corners are still black
    assert np.all(result[0:5, 0:5, :3] == 0)  # Top-left corner
    assert np.all(result[15:20, 15:20, :3] == 0)  # Bottom-right corner


def test_alpha_composite_at_negative_offset():
    """Test alpha_composite_at with negative offset clips correctly."""
    # Create 20x20 black background
    bg = np.zeros((20, 20, 4), dtype=np.uint8)
    bg[:, :, 3] = 255  # Opaque black

    # Create 10x10 white foreground
    fg = np.ones((10, 10, 4), dtype=np.uint8) * 255  # Opaque white

    # Place at position (-5, -5) - partially off-screen
    result = alpha_composite_at(bg, fg, x=-5, y=-5)

    # Only the bottom-right 5x5 portion of fg should be visible at top-left
    assert np.all(result[0:5, 0:5, :3] == 255)  # Top-left should be white
    # Rest should remain black
    assert np.all(result[10:20, 10:20, :3] == 0)


def test_alpha_composite_at_out_of_bounds():
    """Test alpha_composite_at with completely out-of-bounds offset."""
    # Create 20x20 black background
    bg = np.zeros((20, 20, 4), dtype=np.uint8)
    bg[:, :, 3] = 255  # Opaque black

    # Create 5x5 white foreground
    fg = np.ones((5, 5, 4), dtype=np.uint8) * 255  # Opaque white

    # Place completely off-screen
    result = alpha_composite_at(bg, fg, x=100, y=100)

    # Background should be unchanged
    np.testing.assert_array_equal(result, bg)


def test_alpha_composite_at_does_not_modify_original():
    """Test alpha_composite_at doesn't modify original bg array."""
    bg = np.zeros((10, 10, 4), dtype=np.uint8)
    bg[:, :, 3] = 255
    bg_copy = bg.copy()

    fg = np.ones((5, 5, 4), dtype=np.uint8) * 255

    result = alpha_composite_at(bg, fg, x=2, y=2)

    # Original bg should be unchanged
    np.testing.assert_array_equal(bg, bg_copy)
    # Result should be different
    assert not np.array_equal(result, bg)


def test_alpha_composite_preserves_alpha():
    """Test that compositing preserves correct alpha values."""
    # Semi-transparent background
    bg = np.zeros((10, 10, 4), dtype=np.uint8)
    bg[:, :] = [100, 100, 100, 128]  # Gray, 50% alpha

    # Semi-transparent foreground
    fg = np.zeros((10, 10, 4), dtype=np.uint8)
    fg[:, :] = [200, 200, 200, 128]  # Light gray, 50% alpha

    result = alpha_composite(bg, fg)

    # Output alpha should be higher than either input
    # Using Porter-Duff: out_a = fg_a + bg_a * (1 - fg_a)
    # 0.5 + 0.5 * 0.5 = 0.75 = 191.25 ≈ 191
    assert result[0, 0, 3] > 128
    assert result[0, 0, 3] <= 255
