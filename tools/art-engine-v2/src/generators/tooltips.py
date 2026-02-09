"""Tooltip renderer — generates item tooltip PNGs from structured data."""
from __future__ import annotations

from pathlib import Path
import numpy as np
from PIL import Image

from src.core.palette import hex_to_rgb, UI_COLORS, QUALITY_COLORS
from src.core.primitives import draw_filled_rect, draw_line
from src.core.compositor import alpha_composite_at
from src.layout.text import TextRenderer
from src.generators.ui_chrome import render_panel_frame


# Tooltip layout constants
TOOLTIP_WIDTH = 320
PADDING = 12
SEPARATOR_HEIGHT = 1
SECTION_GAP = 6
LINE_SPACING = 4


def render_tooltip(item: dict, width: int = TOOLTIP_WIDTH) -> np.ndarray:
    """Render a complete item tooltip from item data.

    Layout (from art-style-guide.md section 7):
    1. Item name in quality color (Cinzel heading, 20px)
    2. Slot type and bind type (body, 12px, secondary)
    3. Separator line
    4. Item Level (if present)
    5. Primary stats in green (#1EFF00)
    6. Secondary stats in white
    7. Effects (gold header + white body)
    8. Set bonuses
    9. Flavor text (secondary, italic)
    10. Source text (secondary, small)

    Returns:
        RGBA numpy array (dynamic height, 320px wide)
    """
    renderer = TextRenderer()
    content_width = width - 2 * PADDING

    # Pre-render all sections to calculate total height
    sections: list[tuple[np.ndarray, int]] = []  # (image, extra_gap)

    # 1. Item name
    quality = item.get("quality", "common")
    name_color = QUALITY_COLORS.get(quality, QUALITY_COLORS["common"])["name"]
    name_img = renderer.render_text(item.get("name", "Unknown"), "heading", 20, name_color)
    sections.append((name_img, 2))

    # 2. Slot + Bind
    slot = item.get("slot", "")
    bind = item.get("bind", "")
    if slot:
        slot_img = renderer.render_text(slot, "body", 12, UI_COLORS["text_secondary"])
        sections.append((slot_img, 0))
    if bind:
        bind_img = renderer.render_text(bind, "body", 12, UI_COLORS["text_secondary"])
        sections.append((bind_img, 0))

    # 3. Separator
    sep = np.zeros((SEPARATOR_HEIGHT, content_width, 4), dtype=np.uint8)
    sep_color = hex_to_rgb(UI_COLORS["separator"])
    sep[:, :] = [*sep_color, 255]
    sections.append((sep, SECTION_GAP))

    # 4. Item level
    item_level = item.get("item_level")
    if item_level is not None:
        ilevel_img = renderer.render_text(f"Item Level {item_level}", "body", 12, UI_COLORS["text_gold"])
        sections.append((ilevel_img, 2))

    # 5. Primary stats
    for stat in item.get("primary_stats", []):
        stat_img = renderer.render_text(stat, "body", 14, "#1EFF00")
        sections.append((stat_img, 0))

    # 6. Secondary stats
    for stat in item.get("secondary_stats", []):
        stat_img = renderer.render_text(stat, "body", 14, "#FFFFFF")
        sections.append((stat_img, 0))

    # 7. Effects
    for effect in item.get("effects", []):
        eff_name = effect.get("name", "")
        eff_desc = effect.get("description", "")
        if eff_name:
            eff_header = renderer.render_text(eff_name, "heading", 14, UI_COLORS["text_gold"])
            sections.append((eff_header, 2))
        if eff_desc:
            eff_body = renderer.render_text(eff_desc, "body", 12, "#FFFFFF")
            sections.append((eff_body, 0))

    # 8. Set bonuses
    for bonus in item.get("set_bonuses", []):
        pieces = bonus.get("pieces", 0)
        text = bonus.get("bonus", "")
        active = bonus.get("active", False)
        color = "#FFFFFF" if active else "#5A5040"
        bonus_text = f"({pieces}) Set: {text}"
        bonus_img = renderer.render_text(bonus_text, "body", 12, color)
        sections.append((bonus_img, 0))

    # 9. Flavor text
    flavor = item.get("flavor_text", "")
    if flavor:
        # Add separator before flavor
        sections.append((sep.copy(), SECTION_GAP))
        flavor_img = renderer.render_text(f'"{flavor}"', "body", 12, UI_COLORS["text_secondary"])
        sections.append((flavor_img, 0))

    # 10. Source text
    source = item.get("source", "")
    if source:
        source_img = renderer.render_text(source, "body", 10, UI_COLORS["text_secondary"])
        sections.append((source_img, 0))

    # Calculate total height
    total_height = PADDING * 2  # Top and bottom padding
    for img, gap in sections:
        total_height += img.shape[0] + LINE_SPACING + gap

    # Add panel frame border width (5px per side)
    frame_border = 5
    total_height += frame_border * 2
    full_width = width + frame_border * 2

    # Render frame
    frame = render_panel_frame(full_width, total_height)

    # Composite sections onto frame
    y = frame_border + PADDING
    for img, gap in sections:
        y += gap
        x = frame_border + PADDING
        # Clip image width to content area
        iw = min(img.shape[1], content_width)
        clipped = img[:, :iw]
        frame = alpha_composite_at(frame, clipped, x, y)
        y += img.shape[0] + LINE_SPACING

    return frame


def render_tooltip_from_file(item_json_path: Path, width: int = TOOLTIP_WIDTH) -> np.ndarray:
    """Load item data from JSON file and render tooltip."""
    import json
    item = json.loads(Path(item_json_path).read_text())
    return render_tooltip(item, width)
