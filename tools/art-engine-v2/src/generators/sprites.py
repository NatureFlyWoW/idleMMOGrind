"""Character sprite compositor — layers body + equipment overlays."""
from __future__ import annotations

from pathlib import Path
import numpy as np
from PIL import Image

from src.core.compositor import alpha_composite, alpha_composite_at
from src.core.palette import quantize_image, MATERIAL_RAMPS
from src.core.seed import SeededRNG
from src.core.primitives import draw_ellipse

# Equipment layer order from art-style-guide.md section 2.2
LAYER_ORDER: list[str] = [
    "body",       # Base body (race + gender) — 256x512
    "pants",      # Pants / Leg armor
    "boots",      # Boots
    "chest",      # Chest armor
    "belt",       # Belt / Waist
    "shoulders",  # Shoulder armor
    "gloves",     # Gloves / Bracers
    "helm",       # Helm (toggleable)
    "weapon",     # Weapon (main hand, off hand)
    "back",       # Back / Cloak
]

# Default canvas size for character sprites
SPRITE_WIDTH = 256
SPRITE_HEIGHT = 512


def compose_sprite(
    layer_dir: Path,
    layers: dict[str, str],
    seed: int | None = None,
    max_colors: int = 128,
    add_shadow: bool = True,
) -> np.ndarray:
    """Compose a character sprite from layered equipment overlays.

    Args:
        layer_dir: Directory containing layer PNG files
        layers: Dict mapping layer name to filename (e.g., {"body": "human_male.png", "chest": "plate_iron.png"})
        seed: Optional seed for any RNG-based variations
        max_colors: Maximum palette colors for final quantization
        add_shadow: Whether to add a floor shadow ellipse

    Returns:
        RGBA uint8 array (512, 256, 4) — the composited sprite
    """
    layer_dir = Path(layer_dir)
    canvas = np.zeros((SPRITE_HEIGHT, SPRITE_WIDTH, 4), dtype=np.uint8)

    # Composite layers in order
    for layer_name in LAYER_ORDER:
        if layer_name not in layers:
            continue

        filename = layers[layer_name]
        layer_path = layer_dir / filename

        if not layer_path.exists():
            continue

        layer_img = np.array(Image.open(layer_path).convert("RGBA"))

        # Resize if needed to match canvas
        if layer_img.shape[:2] != (SPRITE_HEIGHT, SPRITE_WIDTH):
            pil_img = Image.fromarray(layer_img).resize(
                (SPRITE_WIDTH, SPRITE_HEIGHT), Image.Resampling.NEAREST
            )
            layer_img = np.array(pil_img)

        canvas = alpha_composite(canvas, layer_img)

    # Add floor shadow if requested
    if add_shadow and np.any(canvas[:, :, 3] > 0):
        shadow = np.zeros_like(canvas)
        # Shadow ellipse at bottom center
        cx = SPRITE_WIDTH // 2
        cy = SPRITE_HEIGHT - 20
        rx = 40
        ry = 8
        shadow_color = (0, 0, 0, 76)  # 30% opacity
        draw_ellipse(shadow, cx, cy, rx, ry, shadow_color)
        # Fill the shadow ellipse
        _fill_ellipse(shadow, cx, cy, rx, ry, shadow_color)
        # Shadow goes behind the character
        canvas = alpha_composite(shadow, canvas)

    # Final palette quantization
    if max_colors > 0:
        # Build palette from existing colors
        opaque = canvas[:, :, 3] > 0
        if np.any(opaque):
            colors = canvas[opaque][:, :3]
            unique = np.unique(colors.reshape(-1, 3), axis=0)
            if len(unique) > max_colors:
                step = max(1, len(unique) // max_colors)
                palette = [tuple(c) for c in unique[::step][:max_colors]]
            else:
                palette = [tuple(c) for c in unique]
            canvas = quantize_image(canvas, palette)

    return canvas


def _fill_ellipse(
    canvas: np.ndarray, cx: int, cy: int, rx: int, ry: int, color: tuple[int, int, int, int]
) -> None:
    """Fill an ellipse (scan-line approach for shadow)."""
    h, w = canvas.shape[:2]
    for y in range(max(0, cy - ry), min(h, cy + ry + 1)):
        dy = y - cy
        if ry == 0:
            continue
        # x range from ellipse equation
        x_span = rx * ((1 - (dy * dy) / (ry * ry)) ** 0.5) if abs(dy) <= ry else 0
        x_start = max(0, int(cx - x_span))
        x_end = min(w, int(cx + x_span) + 1)
        for x in range(x_start, x_end):
            if canvas[y, x, 3] == 0:  # Only fill transparent pixels
                canvas[y, x] = color


def compose_sprite_with_materials(
    layer_dir: Path,
    layers: dict[str, str],
    materials: dict[str, str] | None = None,
    seed: int = 42,
    max_colors: int = 128,
) -> np.ndarray:
    """Compose sprite with optional material swapping on overlays.

    Args:
        layer_dir: Directory containing layer PNG files
        layers: Layer name → filename mapping
        materials: Optional layer name → material name mapping for palette swap
        seed: RNG seed for variation
        max_colors: Final palette limit

    Returns:
        RGBA uint8 array
    """
    # For now, delegate to basic compose_sprite
    # Material swapping will be enhanced when integrated with the ingest pipeline's region data
    return compose_sprite(layer_dir, layers, seed=seed, max_colors=max_colors)
