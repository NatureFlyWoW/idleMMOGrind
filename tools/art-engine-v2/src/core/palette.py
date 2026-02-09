"""Color palette utilities for pixel art generation.

Provides color conversion, ramp generation, quantization, and game-specific
palette constants for materials, quality tiers, zones, and UI elements.
"""

import numpy as np


def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    """Convert hex color string to RGB tuple.

    Args:
        hex_str: Hex color string like "#FF8000" or "FF8000"

    Returns:
        RGB tuple with values 0-255

    Examples:
        >>> hex_to_rgb("#FF8000")
        (255, 128, 0)
        >>> hex_to_rgb("ff8000")
        (255, 128, 0)
    """
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i : i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    """Convert RGB tuple to hex color string.

    Args:
        rgb: RGB tuple with values 0-255

    Returns:
        Hex color string with leading # (uppercase)

    Examples:
        >>> rgb_to_hex((255, 128, 0))
        '#FF8000'
    """
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def generate_ramp(base: tuple[int, int, int], steps: int = 7) -> list[tuple[int, int, int]]:
    """Generate a light-to-dark color ramp centered on base color.

    Creates a color gradient by blending the base color toward white (for lighter
    shades) and toward black (for darker shades). The base color appears
    approximately in the middle of the ramp.

    Args:
        base: Base RGB color tuple
        steps: Total number of colors in ramp (must be odd for symmetric centering)

    Returns:
        List of RGB tuples from lightest to darkest

    Examples:
        >>> ramp = generate_ramp((255, 128, 0), 7)
        >>> len(ramp)
        7
        >>> ramp[0]  # Lightest (toward white)
        (255, 204, 153)
        >>> ramp[6]  # Darkest (toward black)
        (76, 38, 0)
    """
    colors = []
    center = steps // 2

    for i in range(steps):
        if i < center:
            # Lighter shades: blend toward white with 60% influence
            factor = (center - i) / center * 0.6
            r = int(base[0] + (255 - base[0]) * factor)
            g = int(base[1] + (255 - base[1]) * factor)
            b = int(base[2] + (255 - base[2]) * factor)
        elif i > center:
            # Darker shades: blend toward black with 70% influence
            factor = (i - center) / (steps - center - 1) * 0.7
            r = int(base[0] * (1 - factor))
            g = int(base[1] * (1 - factor))
            b = int(base[2] * (1 - factor))
        else:
            # Center: use base color
            r, g, b = base

        colors.append((r, g, b))

    return colors


def nearest_color(color: tuple[int, int, int], palette: list[tuple[int, int, int]]) -> int:
    """Find the index of the nearest color in palette using Euclidean distance.

    Args:
        color: Target RGB color
        palette: List of RGB colors to search

    Returns:
        Index of nearest color in palette

    Examples:
        >>> palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        >>> nearest_color((250, 10, 10), palette)
        0
        >>> nearest_color((10, 250, 10), palette)
        1
    """
    min_distance = float("inf")
    nearest_idx = 0

    for i, palette_color in enumerate(palette):
        # Euclidean distance in RGB space (cast to int to prevent overflow)
        distance = sum((int(c1) - int(c2)) ** 2 for c1, c2 in zip(color, palette_color))

        if distance < min_distance:
            min_distance = distance
            nearest_idx = i

    return nearest_idx


def quantize_image(img: np.ndarray, palette: list[tuple[int, int, int]]) -> np.ndarray:
    """Quantize RGBA image to a specific color palette.

    Maps each non-transparent pixel to the nearest color in the palette.
    Fully transparent pixels (alpha=0) are preserved as transparent.

    Args:
        img: RGBA numpy array with shape (H, W, 4) and dtype uint8
        palette: List of RGB tuples to quantize to

    Returns:
        Quantized RGBA numpy array with same shape as input

    Examples:
        >>> img = np.zeros((10, 10, 4), dtype=np.uint8)
        >>> img[:, :, :3] = [128, 128, 128]  # Gray
        >>> img[:, :, 3] = 255  # Opaque
        >>> palette = [(0, 0, 0), (255, 255, 255)]
        >>> result = quantize_image(img, palette)
        >>> result.shape
        (10, 10, 4)
    """
    height, width = img.shape[:2]
    result = img.copy()

    # Process only non-transparent pixels
    for y in range(height):
        for x in range(width):
            if img[y, x, 3] > 0:  # Non-transparent
                color = tuple(img[y, x, :3])
                nearest_idx = nearest_color(color, palette)
                result[y, x, :3] = palette[nearest_idx]

    return result


# Material base colors for equipment rendering
_MATERIAL_BASES = {
    "iron": (140, 140, 150),
    "gold": (212, 175, 55),
    "leather": (139, 90, 43),
    "cloth": (120, 80, 140),
    "bone": (220, 210, 190),
    "crystal": (100, 180, 220),
    "wood": (110, 80, 50),
    "stone": (130, 125, 120),
}

# Pre-generated 7-step ramps for each material
MATERIAL_RAMPS = {name: generate_ramp(base, 7) for name, base in _MATERIAL_BASES.items()}

# Quality tier colors for item rendering and UI
QUALITY_COLORS = {
    "common": {"name": "#9D9D9D", "border": "#4A4A4A", "glow": None},
    "uncommon": {"name": "#1EFF00", "border": "#0D7A00", "glow": "#1EFF0033"},
    "rare": {"name": "#0070DD", "border": "#003D7A", "glow": "#0070DD33"},
    "epic": {"name": "#A335EE", "border": "#5C1D87", "glow": "#A335EE33"},
    "legendary": {"name": "#FF8000", "border": "#8A4500", "glow": "#FF800044"},
}

# Zone-specific color palettes for environment rendering
ZONE_PALETTES = {
    "starting_regions": {"primary": "#2A3A22", "secondary": "#1A2A14", "accent": "#88CC44"},
    "wildwood": {"primary": "#223A22", "secondary": "#1A2A1A", "accent": "#44CC88"},
    "mistmoors": {"primary": "#222A3A", "secondary": "#1A1A2A", "accent": "#4488CC"},
    "skyreach": {"primary": "#2A2A3A", "secondary": "#1A1A2A", "accent": "#8888CC"},
    "blighted_wastes": {"primary": "#3A2A22", "secondary": "#2A1A14", "accent": "#CC8844"},
    "ascendant": {"primary": "#2A1A3A", "secondary": "#1A0A2A", "accent": "#CC44CC"},
}

# UI element colors for interface rendering
UI_COLORS = {
    "panel_bg": "#1A1A1F",
    "panel_bg_alt": "#12121A",
    "frame_outer": "#8B7340",
    "frame_inner": "#5C4D2E",
    "frame_highlight": "#C9A84C",
    "frame_shadow": "#3A2E1A",
    "separator": "#3D3529",
    "text_primary": "#E8D5B0",
    "text_secondary": "#A89878",
    "stat_positive": "#1EFF00",
    "stat_negative": "#FF3333",
    "text_gold": "#FFD700",
}
