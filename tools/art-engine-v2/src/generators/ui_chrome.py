"""UI chrome components — 9-slice frames, panels, buttons, progress bars."""
from __future__ import annotations

import numpy as np
from src.core.palette import hex_to_rgb, UI_COLORS
from src.core.primitives import draw_filled_rect, draw_line
from src.core.compositor import alpha_composite_at
from src.layout.text import TextRenderer
from src.palettes.game_palettes import BAR_COLORS


def render_nine_slice(
    source: np.ndarray,
    target_width: int,
    target_height: int,
    border: int,
) -> np.ndarray:
    """Render a 9-slice scaled image.

    Splits source into 9 regions (4 corners, 4 edges, 1 center).
    Corners are preserved, edges are tiled, center is tiled.

    Args:
        source: RGBA source image
        target_width, target_height: Output dimensions
        border: Border width in pixels (corner size)

    Returns:
        RGBA array at target dimensions
    """
    sh, sw = source.shape[:2]
    result = np.zeros((target_height, target_width, 4), dtype=np.uint8)

    # Corners (preserved exactly)
    # Top-left
    result[:border, :border] = source[:border, :border]
    # Top-right
    result[:border, -border:] = source[:border, -border:]
    # Bottom-left
    result[-border:, :border] = source[-border:, :border]
    # Bottom-right
    result[-border:, -border:] = source[-border:, -border:]

    # Edges (tiled)
    # Top edge
    top_edge = source[:border, border:sw - border]
    edge_w = top_edge.shape[1]
    if edge_w > 0:
        for x in range(border, target_width - border):
            src_x = (x - border) % edge_w
            result[:border, x] = top_edge[:, src_x]

    # Bottom edge
    bot_edge = source[-border:, border:sw - border]
    if edge_w > 0:
        for x in range(border, target_width - border):
            src_x = (x - border) % edge_w
            result[-border:, x] = bot_edge[:, src_x]

    # Left edge
    left_edge = source[border:sh - border, :border]
    edge_h = left_edge.shape[0]
    if edge_h > 0:
        for y in range(border, target_height - border):
            src_y = (y - border) % edge_h
            result[y, :border] = left_edge[src_y]

    # Right edge
    right_edge = source[border:sh - border, -border:]
    if edge_h > 0:
        for y in range(border, target_height - border):
            src_y = (y - border) % edge_h
            result[y, -border:] = right_edge[src_y]

    # Center (tiled)
    center = source[border:sh - border, border:sw - border]
    ch, cw = center.shape[:2]
    if ch > 0 and cw > 0:
        for y in range(border, target_height - border):
            for x in range(border, target_width - border):
                result[y, x] = center[(y - border) % ch, (x - border) % cw]

    return result


def render_panel_frame(width: int, height: int) -> np.ndarray:
    """Render a 4-layer beveled panel frame.

    Layers (from art-style-guide.md section 5.1):
    - Outermost: 1px #3A2E1A (dark shadow)
    - Outer: 2px #8B7340 (gold metallic)
    - Inner: 1px #C9A84C (bright highlight, top-left only)
    - Innermost: 1px #5C4D2E (dark inner bevel)
    - Content: #1A1A1F (panel background)
    """
    result = np.zeros((height, width, 4), dtype=np.uint8)

    # Fill content background
    bg = hex_to_rgb(UI_COLORS["panel_bg"])
    draw_filled_rect(result, 0, 0, width - 1, height - 1, (*bg, 255))

    # Layer 1: Outermost shadow (1px)
    shadow = hex_to_rgb(UI_COLORS["frame_shadow"])
    draw_rect_border(result, 0, 0, width - 1, height - 1, (*shadow, 255))

    # Layer 2: Gold metallic (2px)
    gold = hex_to_rgb(UI_COLORS["frame_outer"])
    draw_rect_border(result, 1, 1, width - 2, height - 2, (*gold, 255))
    draw_rect_border(result, 2, 2, width - 3, height - 3, (*gold, 255))

    # Layer 3: Highlight (1px, top-left edges only)
    highlight = hex_to_rgb(UI_COLORS["frame_highlight"])
    draw_line(result, 3, 3, width - 4, 3, (*highlight, 255))  # Top
    draw_line(result, 3, 3, 3, height - 4, (*highlight, 255))  # Left

    # Layer 4: Inner bevel (1px)
    inner = hex_to_rgb(UI_COLORS["frame_inner"])
    draw_rect_border(result, 4, 4, width - 5, height - 5, (*inner, 255))

    return result


def draw_rect_border(canvas: np.ndarray, x0: int, y0: int, x1: int, y1: int, color: tuple) -> None:
    """Draw rectangle outline using lines."""
    draw_line(canvas, x0, y0, x1, y0, color)  # Top
    draw_line(canvas, x0, y1, x1, y1, color)  # Bottom
    draw_line(canvas, x0, y0, x0, y1, color)  # Left
    draw_line(canvas, x1, y0, x1, y1, color)  # Right


def render_button(width: int, height: int, label: str = "") -> np.ndarray:
    """Render a UI button with optional text label."""
    # Simple beveled button
    result = np.zeros((height, width, 4), dtype=np.uint8)

    # Background
    bg = hex_to_rgb(UI_COLORS["frame_inner"])
    draw_filled_rect(result, 0, 0, width - 1, height - 1, (*bg, 255))

    # Border
    border = hex_to_rgb(UI_COLORS["frame_outer"])
    draw_rect_border(result, 0, 0, width - 1, height - 1, (*border, 255))

    # Highlight top-left
    hl = hex_to_rgb(UI_COLORS["frame_highlight"])
    draw_line(result, 1, 1, width - 2, 1, (*hl, 255))
    draw_line(result, 1, 1, 1, height - 2, (*hl, 255))

    # Add text label if provided
    if label:
        renderer = TextRenderer()
        text_img = renderer.render_text(label, font_name="body", size=12, color=UI_COLORS["text_primary"])
        th, tw = text_img.shape[:2]
        tx = (width - tw) // 2
        ty = (height - th) // 2
        result = alpha_composite_at(result, text_img, tx, ty)

    return result


def render_progress_bar(
    width: int,
    height: int,
    progress: float,
    bar_type: str = "health",
) -> np.ndarray:
    """Render a progress bar.

    Args:
        width, height: Dimensions
        progress: 0.0 to 1.0
        bar_type: One of health, mana, energy, rage, xp, reputation, profession, cast
    """
    result = np.zeros((height, width, 4), dtype=np.uint8)
    colors = BAR_COLORS.get(bar_type, BAR_COLORS["health"])

    # Background
    bg = hex_to_rgb(colors["bg"])
    draw_filled_rect(result, 0, 0, width - 1, height - 1, (*bg, 255))

    # Fill
    fill_width = max(0, int((width - 2) * max(0.0, min(1.0, progress))))
    if fill_width > 0:
        fill = hex_to_rgb(colors["fill"])
        draw_filled_rect(result, 1, 1, fill_width, height - 2, (*fill, 255))

    # Border
    border = hex_to_rgb(colors["border"])
    draw_rect_border(result, 0, 0, width - 1, height - 1, (*border, 255))

    return result
