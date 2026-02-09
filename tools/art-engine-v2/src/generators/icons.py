"""Icon variant generator — material × quality × seed production."""
from __future__ import annotations

import json
from pathlib import Path
import numpy as np
from PIL import Image

from src.core.palette import MATERIAL_RAMPS, nearest_color, hex_to_rgb
from src.core.seed import SeededRNG
from src.core.dither import apply_ordered_dither
from src.palettes.game_palettes import QUALITY_GLOW_PARAMS


def _swap_material(
    img: np.ndarray,
    region_pixels: list[list[int]],
    source_ramp: list[tuple[int, int, int]],
    target_ramp: list[tuple[int, int, int]],
    rng: SeededRNG,
) -> np.ndarray:
    """Swap material colors in a region from source to target ramp."""
    result = img.copy()
    for coord in region_pixels:
        x, y = coord[0], coord[1]
        if y >= img.shape[0] or x >= img.shape[1]:
            continue
        if img[y, x, 3] == 0:
            continue
        pixel_rgb = tuple(img[y, x, :3])
        src_idx = nearest_color(pixel_rgb, source_ramp)
        # Add seed-based jitter: ±0.5 index shift
        jitter = rng.jitter(0.0, 1.0)  # -1.0 to +1.0
        target_idx = max(0, min(len(target_ramp) - 1, int(src_idx + jitter * 0.5)))
        result[y, x, :3] = target_ramp[target_idx]
    return result


def _add_outline(img: np.ndarray, color: tuple[int, int, int, int] = (20, 20, 25, 255), width: int = 2) -> np.ndarray:
    """Add dark outline around solid pixels."""
    result = img.copy()
    h, w = img.shape[:2]
    # Find edge pixels: solid pixels adjacent to transparent
    outline_pixels = set()
    for y in range(h):
        for x in range(w):
            if img[y, x, 3] > 0:
                for dy in range(-width, width + 1):
                    for dx in range(-width, width + 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and img[ny, nx, 3] == 0:
                            outline_pixels.add((nx, ny))
    for x, y in outline_pixels:
        result[y, x] = color
    return result


def _apply_quality_glow(img: np.ndarray, quality: str) -> np.ndarray:
    """Apply quality-tier glow around the icon edges."""
    params = QUALITY_GLOW_PARAMS.get(quality, QUALITY_GLOW_PARAMS["common"])
    radius = params["radius"]
    intensity = params["intensity"]
    glow_color_hex = params["color"]

    if radius == 0 or intensity == 0 or glow_color_hex is None:
        return img

    glow_rgb = hex_to_rgb(glow_color_hex)
    result = img.copy()
    h, w = img.shape[:2]

    # Find edge pixels (solid pixels adjacent to transparent)
    edges = set()
    for y in range(h):
        for x in range(w):
            if img[y, x, 3] > 0:
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and img[ny, nx, 3] == 0:
                        edges.add((x, y))
                        break

    # Radiate glow outward from edges
    for ex, ey in edges:
        for dy in range(-radius - 1, radius + 2):
            for dx in range(-radius - 1, radius + 2):
                ny, nx = ey + dy, ex + dx
                if not (0 <= ny < h and 0 <= nx < w):
                    continue
                if result[ny, nx, 3] > 0:
                    continue  # Don't glow over solid pixels
                dist = (dx * dx + dy * dy) ** 0.5
                if dist > radius + 1:
                    continue
                alpha = intensity * (1.0 - dist / (radius + 1))
                alpha = max(0.0, min(1.0, alpha))
                glow_alpha = int(alpha * 255)
                # Blend with existing pixel (take max alpha for overlapping glows)
                if glow_alpha > result[ny, nx, 3]:
                    result[ny, nx] = [glow_rgb[0], glow_rgb[1], glow_rgb[2], glow_alpha]

    return result


def generate_icon(
    template_dir: Path,
    template_name: str,
    material: str,
    quality: str,
    seed: int,
    output_dir: Path,
) -> Path:
    """Generate a single icon variant.

    Args:
        template_dir: Directory containing template PNGs and JSON metadata
        template_name: Name of the template (without extension)
        material: Material name (iron, gold, leather, etc.)
        quality: Quality tier (common, uncommon, rare, epic, legendary)
        seed: RNG seed for deterministic variation
        output_dir: Where to save the output PNG

    Returns:
        Path to the generated PNG file
    """
    template_dir = Path(template_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load template
    img = np.array(Image.open(template_dir / f"{template_name}.png").convert("RGBA"))
    meta_path = template_dir / f"{template_name}.json"
    meta = json.loads(meta_path.read_text())

    rng = SeededRNG(seed)

    # Material swap for each region
    target_ramp = MATERIAL_RAMPS.get(material, MATERIAL_RAMPS["iron"])
    for region in meta.get("regions", []):
        # Detect source ramp from region's dominant color
        dom_color = tuple(region.get("dominant_color", [140, 140, 150])[:3])
        # Find closest material ramp
        best_material = "iron"
        best_dist = float("inf")
        for mat_name, ramp in MATERIAL_RAMPS.items():
            mid_color = ramp[3]  # Middle of ramp
            d = sum((a - b) ** 2 for a, b in zip(dom_color, mid_color))
            if d < best_dist:
                best_dist = d
                best_material = mat_name
        source_ramp = MATERIAL_RAMPS[best_material]
        img = _swap_material(img, region["pixels"], source_ramp, target_ramp, rng)

    # Apply dithering with seed-based spread variation
    spread = rng.randint(6, 12)
    img = apply_ordered_dither(img, matrix_size=4, spread=spread)

    # Add outline
    img = _add_outline(img)

    # Apply quality glow
    img = _apply_quality_glow(img, quality)

    # Save
    # Get type from metadata for naming
    asset_type = meta.get("type", "item")
    filename = f"{asset_type}-{template_name}-{material}-{quality}-{seed:03d}.png"
    output_path = output_dir / filename
    Image.fromarray(img).save(output_path)

    return output_path


def generate_icon_batch(
    template_dir: Path,
    template_name: str,
    materials: list[str],
    qualities: list[str],
    seeds: list[int],
    output_dir: Path,
) -> list[Path]:
    """Generate a batch of icon variants (materials × qualities × seeds).

    Returns:
        List of paths to generated PNG files
    """
    results = []
    for material in materials:
        for quality in qualities:
            for seed in seeds:
                path = generate_icon(
                    template_dir=template_dir,
                    template_name=template_name,
                    material=material,
                    quality=quality,
                    seed=seed,
                    output_dir=output_dir,
                )
                results.append(path)
    return results
