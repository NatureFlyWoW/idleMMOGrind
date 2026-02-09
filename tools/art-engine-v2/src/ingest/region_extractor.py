"""Auto-detect material regions by color/spatial clustering."""
from __future__ import annotations

import numpy as np


def extract_regions(
    img: np.ndarray,
    num_regions: int = 1,
    max_iterations: int = 20,
) -> list[dict]:
    """Extract material regions from an RGBA image using k-means.

    Groups opaque pixels by (x_norm, y_norm, r, g, b) feature vectors.

    Args:
        img: RGBA uint8 array (background should already be transparent)
        num_regions: Expected number of distinct material regions
        max_iterations: K-means iteration limit

    Returns:
        List of region dicts, each with:
        - "label": auto-assigned region name ("region_0", "region_1", ...)
        - "pixels": list of [x, y] coordinates
        - "dominant_color": (r, g, b) tuple of the region's mean color
    """
    h, w = img.shape[:2]

    # Collect opaque pixels with their features
    pixels = []
    coords = []
    for y in range(h):
        for x in range(w):
            if img[y, x, 3] > 0:
                # Feature: normalized position + color
                pixels.append([
                    x / max(w - 1, 1),
                    y / max(h - 1, 1),
                    img[y, x, 0] / 255.0,
                    img[y, x, 1] / 255.0,
                    img[y, x, 2] / 255.0,
                ])
                coords.append([x, y])

    if not pixels:
        return []

    features = np.array(pixels, dtype=np.float64)
    coord_arr = np.array(coords)

    if num_regions == 1:
        mean_color = np.mean(features[:, 2:5], axis=0) * 255
        return [{
            "label": "region_0",
            "pixels": coord_arr.tolist(),
            "dominant_color": tuple(int(c) for c in mean_color),
        }]

    # K-means clustering
    rng = np.random.RandomState(42)
    indices = rng.choice(len(features), size=min(num_regions, len(features)), replace=False)
    centroids = features[indices].copy()

    labels = np.zeros(len(features), dtype=int)

    for _ in range(max_iterations):
        # Assign
        dists = np.array([
            np.sum((features - c) ** 2, axis=1) for c in centroids
        ])
        new_labels = np.argmin(dists, axis=0)

        if np.array_equal(labels, new_labels):
            break
        labels = new_labels

        # Update centroids
        for k in range(num_regions):
            mask = labels == k
            if np.any(mask):
                centroids[k] = features[mask].mean(axis=0)

    # Build regions
    regions = []
    for k in range(num_regions):
        mask = labels == k
        if not np.any(mask):
            continue
        region_coords = coord_arr[mask]
        region_colors = features[mask, 2:5] * 255
        mean_color = tuple(int(c) for c in region_colors.mean(axis=0))
        regions.append({
            "label": f"region_{k}",
            "pixels": region_coords.tolist(),
            "dominant_color": mean_color,
        })

    return regions
