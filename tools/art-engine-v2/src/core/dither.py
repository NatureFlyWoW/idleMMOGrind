"""Ordered dithering via Bayer matrices."""
from __future__ import annotations
import numpy as np


def bayer_matrix(size: int) -> np.ndarray:
    """Generate a normalized Bayer matrix of given size (2, 4, or 8).

    Returns values in [-0.5, 0.5] range for threshold offsetting.
    Uses recursive subdivision: B(2n) from B(n).
    """
    if size == 2:
        base = np.array([[0, 2], [3, 1]], dtype=np.float64)
        # Normalize to [-0.5, 0.5): map [0, 3] to [-0.5, 0.5)
        return base / 4.0 - 0.5
    half = size // 2
    smaller = bayer_matrix(half)
    # Denormalize back to get raw indices [0, half*half-1]
    raw_smaller = (smaller + 0.5) * (half * half)
    # Recursive construction
    top_left = 4 * raw_smaller
    top_right = 4 * raw_smaller + 2
    bot_left = 4 * raw_smaller + 3
    bot_right = 4 * raw_smaller + 1
    full = np.block([[top_left, top_right], [bot_left, bot_right]])
    # Normalize to [-0.5, 0.5): map [0, size*size-1] to [-0.5, 0.5)
    return full / (size * size) - 0.5


def apply_ordered_dither(
    img: np.ndarray, matrix_size: int = 4, spread: int = 16
) -> np.ndarray:
    """Apply ordered dithering to an RGBA image.

    Args:
        img: RGBA uint8 numpy array (H, W, 4)
        matrix_size: Bayer matrix size (2, 4, or 8)
        spread: Dither intensity (how much to offset pixel values)

    Returns:
        Dithered RGBA uint8 array (alpha preserved unchanged)
    """
    result = img.copy()
    matrix = bayer_matrix(matrix_size)
    h, w = img.shape[:2]

    for y in range(h):
        for x in range(w):
            if img[y, x, 3] == 0:
                continue
            threshold = matrix[y % matrix_size, x % matrix_size]
            for c in range(3):  # RGB only, not alpha
                val = int(img[y, x, c]) + int(threshold * spread)
                result[y, x, c] = max(0, min(255, val))

    return result
