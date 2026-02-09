"""Simplex noise generation using opensimplex library."""
from __future__ import annotations
import numpy as np
from opensimplex import OpenSimplex


def generate_noise(
    width: int, height: int, scale: float = 0.05, seed: int = 0, octaves: int = 1
) -> np.ndarray:
    """Generate 2D simplex noise field.

    Args:
        width, height: Output dimensions
        scale: Noise frequency (smaller = smoother)
        seed: Random seed for reproducibility
        octaves: Number of noise layers (fractal brownian motion)

    Returns:
        2D float array (height, width) normalized to [0.0, 1.0]
    """
    gen = OpenSimplex(seed=seed)
    result = np.zeros((height, width), dtype=np.float64)

    for octave in range(octaves):
        freq = scale * (2 ** octave)
        amp = 0.5 ** octave
        for y in range(height):
            for x in range(width):
                result[y, x] += gen.noise2(x * freq, y * freq) * amp

    # Normalize to [0, 1]
    rmin, rmax = result.min(), result.max()
    if rmax > rmin:
        result = (result - rmin) / (rmax - rmin)
    else:
        result[:] = 0.5

    return result


def generate_tileable_noise(
    width: int, height: int, scale: float = 0.05, seed: int = 0
) -> np.ndarray:
    """Generate seamlessly tileable 2D noise using 4D cylinder mapping.

    Maps 2D coordinates onto a 4D torus using sin/cos to ensure
    left↔right and top↔bottom edges match perfectly.

    Returns:
        2D float array (height, width) normalized to [0.0, 1.0]
    """
    gen = OpenSimplex(seed=seed)
    result = np.zeros((height, width), dtype=np.float64)

    import math
    # Use fixed radius for the torus to ensure proper tiling
    # The radius should be based on the scale parameter
    radius = 1.0 / (2.0 * math.pi * scale)

    for y in range(height):
        for x in range(width):
            # Map to torus in 4D space
            nx = x / width
            ny = y / height
            s = nx * 2 * math.pi
            t = ny * 2 * math.pi

            x4 = radius * math.cos(s)
            y4 = radius * math.sin(s)
            z4 = radius * math.cos(t)
            w4 = radius * math.sin(t)

            result[y, x] = gen.noise4(x4, y4, z4, w4)

    # Normalize to [0, 1]
    rmin, rmax = result.min(), result.max()
    if rmax > rmin:
        result = (result - rmin) / (rmax - rmin)
    else:
        result[:] = 0.5

    return result
