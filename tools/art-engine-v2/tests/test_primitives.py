"""Tests for pixel-art drawing primitives."""
from __future__ import annotations
import numpy as np
import pytest
from src.core.primitives import (
    draw_line,
    draw_rect,
    draw_filled_rect,
    draw_ellipse,
    flood_fill,
)


def make_canvas(w: int = 32, h: int = 32) -> np.ndarray:
    """Create blank RGBA canvas."""
    return np.zeros((h, w, 4), dtype=np.uint8)


def test_draw_line_horizontal():
    """Horizontal line sets correct pixels."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    draw_line(canvas, 5, 10, 15, 10, white)

    # Check line pixels are set
    for x in range(5, 16):
        assert tuple(canvas[10, x]) == white

    # Check other pixels are not set
    assert tuple(canvas[9, 10]) == (0, 0, 0, 0)
    assert tuple(canvas[11, 10]) == (0, 0, 0, 0)


def test_draw_line_vertical():
    """Vertical line sets correct pixels."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    draw_line(canvas, 10, 5, 10, 15, white)

    # Check line pixels are set
    for y in range(5, 16):
        assert tuple(canvas[y, 10]) == white

    # Check other pixels are not set
    assert tuple(canvas[10, 9]) == (0, 0, 0, 0)
    assert tuple(canvas[10, 11]) == (0, 0, 0, 0)


def test_draw_line_diagonal():
    """Diagonal line connects endpoints."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    draw_line(canvas, 5, 5, 15, 15, white)

    # Endpoints should be set
    assert tuple(canvas[5, 5]) == white
    assert tuple(canvas[15, 15]) == white

    # Should have pixels along the diagonal
    pixel_count = np.sum(canvas[:, :, 3] == 255)
    assert pixel_count >= 11  # At least the main diagonal


def test_draw_line_bounds_checking():
    """Lines outside canvas bounds don't crash."""
    canvas = make_canvas(16, 16)
    white = (255, 255, 255, 255)

    # Should not raise, just clip
    draw_line(canvas, -5, 8, 20, 8, white)
    draw_line(canvas, 8, -5, 8, 20, white)


def test_draw_rect_outline():
    """Rectangle draws outline only, not filled."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    draw_rect(canvas, 5, 5, 15, 15, white)

    # Corners should be set
    assert tuple(canvas[5, 5]) == white
    assert tuple(canvas[5, 15]) == white
    assert tuple(canvas[15, 5]) == white
    assert tuple(canvas[15, 15]) == white

    # Edges should be set
    assert tuple(canvas[5, 10]) == white  # Top edge
    assert tuple(canvas[15, 10]) == white  # Bottom edge
    assert tuple(canvas[10, 5]) == white  # Left edge
    assert tuple(canvas[10, 15]) == white  # Right edge

    # Interior should be empty
    assert tuple(canvas[10, 10]) == (0, 0, 0, 0)


def test_draw_filled_rect_filled():
    """Filled rectangle fills interior."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    draw_filled_rect(canvas, 5, 5, 15, 15, white)

    # All interior pixels should be set
    for y in range(5, 16):
        for x in range(5, 16):
            assert tuple(canvas[y, x]) == white

    # Outside should be empty
    assert tuple(canvas[4, 10]) == (0, 0, 0, 0)
    assert tuple(canvas[16, 10]) == (0, 0, 0, 0)
    assert tuple(canvas[10, 4]) == (0, 0, 0, 0)
    assert tuple(canvas[10, 16]) == (0, 0, 0, 0)


def test_draw_filled_rect_inverted_coords():
    """Filled rect works with inverted coordinates."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    # x1 < x0, y1 < y0
    draw_filled_rect(canvas, 15, 15, 5, 5, white)

    # Should still fill the same area
    for y in range(5, 16):
        for x in range(5, 16):
            assert tuple(canvas[y, x]) == white


def test_draw_ellipse_sets_pixels():
    """Ellipse draws curved outline."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    draw_ellipse(canvas, 16, 16, 8, 6, white)

    # Should have pixels set (ellipse outline)
    pixel_count = np.sum(canvas[:, :, 3] == 255)
    assert pixel_count > 20  # Ellipse should have many pixels

    # Center should be empty (outline only)
    assert tuple(canvas[16, 16]) == (0, 0, 0, 0)


def test_draw_ellipse_circle():
    """Ellipse with equal radii draws a circle."""
    canvas = make_canvas()
    white = (255, 255, 255, 255)

    draw_ellipse(canvas, 16, 16, 8, 8, white)

    pixel_count = np.sum(canvas[:, :, 3] == 255)
    assert pixel_count > 20


def test_draw_ellipse_bounds_checking():
    """Ellipse outside canvas bounds doesn't crash."""
    canvas = make_canvas(16, 16)
    white = (255, 255, 255, 255)

    # Should not raise
    draw_ellipse(canvas, 8, 8, 20, 20, white)


def test_flood_fill_fills_region():
    """Flood fill fills enclosed region."""
    canvas = make_canvas(16, 16)
    white = (255, 255, 255, 255)
    red = (255, 0, 0, 255)

    # Draw a rectangle border
    draw_rect(canvas, 4, 4, 12, 12, white)

    # Fill interior
    flood_fill(canvas, 8, 8, red)

    # Interior should be red
    for y in range(5, 12):
        for x in range(5, 12):
            assert tuple(canvas[y, x]) == red

    # Border should still be white
    assert tuple(canvas[4, 8]) == white
    assert tuple(canvas[12, 8]) == white


def test_flood_fill_respects_boundaries():
    """Flood fill doesn't cross color boundaries."""
    canvas = make_canvas(16, 16)
    white = (255, 255, 255, 255)
    red = (255, 0, 0, 255)

    # Vertical line dividing canvas
    draw_line(canvas, 8, 0, 8, 15, white)

    # Fill left side
    flood_fill(canvas, 4, 8, red)

    # Left side should be red
    assert tuple(canvas[8, 4]) == red

    # Right side should be empty
    assert tuple(canvas[8, 12]) == (0, 0, 0, 0)

    # Dividing line should be white
    assert tuple(canvas[8, 8]) == white


def test_flood_fill_out_of_bounds():
    """Flood fill with out-of-bounds start does nothing."""
    canvas = make_canvas(16, 16)
    red = (255, 0, 0, 255)

    # Should not crash
    flood_fill(canvas, -1, 8, red)
    flood_fill(canvas, 8, -1, red)
    flood_fill(canvas, 20, 8, red)
    flood_fill(canvas, 8, 20, red)

    # Canvas should be empty
    assert np.all(canvas == 0)


def test_flood_fill_same_color():
    """Flood fill with same color as target does nothing."""
    canvas = make_canvas(16, 16)
    # Canvas starts as all black (0,0,0,0)

    # Fill with same color - should not infinite loop
    flood_fill(canvas, 8, 8, (0, 0, 0, 0))

    # Should remain empty
    assert np.all(canvas == 0)


def test_flood_fill_single_pixel():
    """Flood fill can fill a single pixel region."""
    canvas = make_canvas(16, 16)
    white = (255, 255, 255, 255)
    red = (255, 0, 0, 255)

    # Set a single white pixel
    canvas[8, 8] = white

    # Fill from that pixel
    flood_fill(canvas, 8, 8, red)

    # That pixel should now be red
    assert tuple(canvas[8, 8]) == red

    # But we're on a black background, so it should fill the whole canvas!
    # Actually, we're filling from a white pixel on a black canvas,
    # so only that white pixel should become red.

    # Let's fix the test - fill the black background instead
    canvas = make_canvas(16, 16)
    canvas[8, 8] = white  # One white pixel

    # Fill black background with red
    flood_fill(canvas, 0, 0, red)

    # Background should be red
    assert tuple(canvas[0, 0]) == red
    # White pixel should remain white
    assert tuple(canvas[8, 8]) == white
