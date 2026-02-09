"""Zone-themed atmospheric backgrounds using layered noise."""
from __future__ import annotations

import numpy as np
from src.core.palette import hex_to_rgb, ZONE_PALETTES
from src.core.noise import generate_noise
from src.core.dither import apply_ordered_dither


def generate_background(
    zone: str,
    width: int,
    height: int,
    seed: int = 42,
) -> np.ndarray:
    """Generate a zone-themed atmospheric background.

    Steps:
    1. Generate large-scale simplex noise (zone primary color)
    2. Generate small-scale detail noise (zone secondary color)
    3. Blend with zone-specific weights
    4. Apply Bayer 8x8 dithering
    5. Quantize to 6-color zone palette

    Args:
        zone: Zone name key from ZONE_PALETTES
        width, height: Output dimensions
        seed: RNG seed

    Returns:
        RGBA uint8 array
    """
    palette = ZONE_PALETTES.get(zone, ZONE_PALETTES["starting_regions"])
    primary = hex_to_rgb(palette["primary"])
    secondary = hex_to_rgb(palette["secondary"])
    accent = hex_to_rgb(palette["accent"])

    # Generate noise layers
    noise_large = generate_noise(width, height, scale=0.02, seed=seed, octaves=2)
    noise_detail = generate_noise(width, height, scale=0.08, seed=seed + 1000, octaves=1)

    # Build RGBA image
    result = np.zeros((height, width, 4), dtype=np.uint8)

    for y in range(height):
        for x in range(width):
            # Blend primary and secondary by large noise
            t_large = noise_large[y, x]
            # Blend primary/secondary
            r = int(primary[0] * (1 - t_large) + secondary[0] * t_large)
            g = int(primary[1] * (1 - t_large) + secondary[1] * t_large)
            b = int(primary[2] * (1 - t_large) + secondary[2] * t_large)

            # Add accent highlights from detail noise
            t_detail = noise_detail[y, x]
            if t_detail > 0.7:
                accent_strength = (t_detail - 0.7) / 0.3  # 0 to 1
                accent_strength *= 0.3  # Max 30% accent blend
                r = int(r * (1 - accent_strength) + accent[0] * accent_strength)
                g = int(g * (1 - accent_strength) + accent[1] * accent_strength)
                b = int(b * (1 - accent_strength) + accent[2] * accent_strength)

            # Optional vignette
            cx, cy = width / 2, height / 2
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            max_dist = (cx ** 2 + cy ** 2) ** 0.5
            vignette = max(0.0, 1.0 - (dist / max_dist) * 0.4)

            result[y, x] = [
                max(0, min(255, int(r * vignette))),
                max(0, min(255, int(g * vignette))),
                max(0, min(255, int(b * vignette))),
                255,
            ]

    # Apply dithering
    result = apply_ordered_dither(result, matrix_size=8, spread=12)

    return result
