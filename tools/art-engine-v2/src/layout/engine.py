"""JSON layout → composed screen renderer."""
from __future__ import annotations

import json
from pathlib import Path
import numpy as np
from PIL import Image

from src.core.palette import hex_to_rgb
from src.core.primitives import draw_filled_rect, draw_line
from src.core.compositor import alpha_composite_at
from src.layout.text import TextRenderer
from src.generators.ui_chrome import render_panel_frame, render_progress_bar


class LayoutEngine:
    """Renders composed screens from JSON layout definitions."""

    def __init__(self):
        self._text_renderer = TextRenderer()

    def render(self, layout: dict) -> np.ndarray:
        """Render a layout definition to an RGBA image.

        Layout format:
        {
            "width": int,
            "height": int,
            "background": "#hex" or null,
            "elements": [...]
        }

        Element types:
        - rect: {type, x, y, width, height, color}
        - text: {type, x, y, text, font, size, color}
        - image: {type, x, y, path}
        - panel: {type, x, y, width, height, elements: [...]}
        - progress_bar: {type, x, y, width, height, progress, bar_type}
        - separator: {type, x, y, width}
        """
        w = layout["width"]
        h = layout["height"]
        canvas = np.zeros((h, w, 4), dtype=np.uint8)

        # Background color
        bg = layout.get("background")
        if bg:
            rgb = hex_to_rgb(bg)
            draw_filled_rect(canvas, 0, 0, w - 1, h - 1, (*rgb, 255))

        # Render elements
        for elem in layout.get("elements", []):
            self._render_element(canvas, elem, offset_x=0, offset_y=0)

        return canvas

    def _render_element(self, canvas: np.ndarray, elem: dict, offset_x: int, offset_y: int) -> None:
        """Render a single element onto the canvas."""
        etype = elem.get("type", "")
        x = elem.get("x", 0) + offset_x
        y = elem.get("y", 0) + offset_y

        if etype == "rect":
            w = elem.get("width", 10)
            h = elem.get("height", 10)
            color = hex_to_rgb(elem.get("color", "#FFFFFF"))
            draw_filled_rect(canvas, x, y, x + w - 1, y + h - 1, (*color, 255))

        elif etype == "text":
            text = elem.get("text", "")
            font = elem.get("font", "body")
            size = elem.get("size", 14)
            color = elem.get("color", "#FFFFFF")
            text_img = self._text_renderer.render_text(text, font, size, color)
            result = alpha_composite_at(canvas, text_img, x, y)
            canvas[:] = result

        elif etype == "image":
            path = elem.get("path", "")
            if path and Path(path).exists():
                img = np.array(Image.open(path).convert("RGBA"))
                result = alpha_composite_at(canvas, img, x, y)
                canvas[:] = result

        elif etype == "panel":
            w = elem.get("width", 100)
            h = elem.get("height", 100)
            frame = render_panel_frame(w, h)
            result = alpha_composite_at(canvas, frame, x, y)
            canvas[:] = result
            # Render child elements relative to panel position
            for child in elem.get("elements", []):
                self._render_element(canvas, child, offset_x=x, offset_y=y)

        elif etype == "progress_bar":
            w = elem.get("width", 100)
            h = elem.get("height", 16)
            progress = elem.get("progress", 0.5)
            bar_type = elem.get("bar_type", "health")
            bar = render_progress_bar(w, h, progress, bar_type)
            result = alpha_composite_at(canvas, bar, x, y)
            canvas[:] = result

        elif etype == "separator":
            w = elem.get("width", 100)
            color = hex_to_rgb(elem.get("color", "#3D3529"))
            draw_line(canvas, x, y, x + w - 1, y, (*color, 255))

    def render_from_file(self, layout_path: Path) -> np.ndarray:
        """Load layout from JSON file and render."""
        layout = json.loads(Path(layout_path).read_text())
        return self.render(layout)
