"""Remove dark backgrounds from AI-drafted images."""
from __future__ import annotations

import numpy as np


def remove_background(
    img: np.ndarray,
    bg_color: tuple[int, int, int] = (0x1A, 0x1A, 0x1F),
    threshold: int = 30,
) -> np.ndarray:
    """Set pixels matching bg_color (within threshold) to transparent.

    Args:
        img: RGBA uint8 array
        bg_color: Background color to remove (default: #1A1A1F panel bg)
        threshold: Euclidean distance threshold for matching

    Returns:
        RGBA array with matching pixels set to alpha=0
    """
    result = img.copy()
    h, w = img.shape[:2]
    for y in range(h):
        for x in range(w):
            r, g, b = int(img[y, x, 0]), int(img[y, x, 1]), int(img[y, x, 2])
            dist = ((r - bg_color[0]) ** 2 + (g - bg_color[1]) ** 2 + (b - bg_color[2]) ** 2) ** 0.5
            if dist <= threshold:
                result[y, x, 3] = 0
    return result
