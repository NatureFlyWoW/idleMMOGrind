"""Text rendering using Pillow fonts — supports heading, body, and mono fonts."""
from __future__ import annotations

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from src.core.palette import hex_to_rgb

# Font directory
_FONT_DIR = Path(__file__).parent.parent / "data" / "fonts"

# Font name mapping to TTF files
_FONT_FILES: dict[str, str] = {
    "display": "CinzelDecorative-Bold.ttf",
    "heading": "Cinzel-SemiBold.ttf",
    "body": "Inter-Regular.ttf",
    "body_bold": "Inter-SemiBold.ttf",
    "mono": "JetBrainsMono-Regular.ttf",
}


class TextRenderer:
    """Renders text to RGBA numpy arrays using TTF fonts with fallback."""

    def __init__(self, font_dir: Path | None = None):
        self._font_dir = font_dir or _FONT_DIR
        self._font_cache: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}

    def _get_font(self, font_name: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
        """Load font from cache or disk, falling back to default if not found."""
        key = (font_name, size)
        if key not in self._font_cache:
            ttf_file = _FONT_FILES.get(font_name, _FONT_FILES["body"])
            font_path = self._font_dir / ttf_file
            try:
                self._font_cache[key] = ImageFont.truetype(str(font_path), size)
            except (OSError, IOError):
                # Fallback to Pillow default
                try:
                    self._font_cache[key] = ImageFont.load_default(size)
                except TypeError:
                    # Older Pillow versions don't accept size param
                    self._font_cache[key] = ImageFont.load_default()
        return self._font_cache[key]

    def measure_text(
        self, text: str, font_name: str = "body", size: int = 14
    ) -> tuple[int, int]:
        """Measure text dimensions without rendering.

        Returns:
            (width, height) tuple in pixels
        """
        font = self._get_font(font_name, size)
        # Use a temporary draw context for measurement
        tmp = Image.new("RGBA", (1, 1))
        draw = ImageDraw.Draw(tmp)
        bbox = draw.textbbox((0, 0), text, font=font)
        return bbox[2] - bbox[0], bbox[3] - bbox[1]

    def render_text(
        self,
        text: str,
        font_name: str = "body",
        size: int = 14,
        color: str = "#FFFFFF",
    ) -> np.ndarray:
        """Render text to an RGBA numpy array with transparent background.

        Args:
            text: String to render
            font_name: One of "display", "heading", "body", "body_bold", "mono"
            size: Font size in pixels
            color: Hex color string

        Returns:
            RGBA uint8 numpy array sized to fit the text
        """
        font = self._get_font(font_name, size)
        rgb = hex_to_rgb(color)

        # Measure
        w, h = self.measure_text(text, font_name, size)
        # Add small padding to prevent clipping
        w = max(w + 4, 1)
        h = max(h + 4, 1)

        # Render
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.text((0, 0), text, fill=(*rgb, 255), font=font)

        return np.array(img)

    def render_stat_block(
        self,
        lines: list[tuple[str, str]],
        font_name: str = "body",
        size: int = 14,
        line_spacing: int = 4,
    ) -> np.ndarray:
        """Render multiple color-coded lines stacked vertically.

        Args:
            lines: List of (text, hex_color) tuples
            font_name: Font to use for all lines
            size: Font size
            line_spacing: Pixels between lines

        Returns:
            RGBA numpy array containing all lines stacked
        """
        if not lines:
            return np.zeros((1, 1, 4), dtype=np.uint8)

        # Render each line
        rendered = []
        max_width = 0
        total_height = 0
        for text, color in lines:
            line_img = self.render_text(text, font_name, size, color)
            rendered.append(line_img)
            max_width = max(max_width, line_img.shape[1])
            total_height += line_img.shape[0]

        total_height += line_spacing * (len(rendered) - 1)

        # Composite onto single canvas
        result = np.zeros((total_height, max_width, 4), dtype=np.uint8)
        y_offset = 0
        for line_img in rendered:
            lh, lw = line_img.shape[:2]
            result[y_offset:y_offset + lh, :lw] = line_img
            y_offset += lh + line_spacing

        return result
