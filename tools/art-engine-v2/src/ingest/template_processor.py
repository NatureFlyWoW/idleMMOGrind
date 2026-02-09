"""Full ingest pipeline: AI draft → cleaned template + metadata."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

from src.core.dither import apply_ordered_dither
from src.core.palette import quantize_image
from src.ingest.background_remover import remove_background
from src.ingest.region_extractor import extract_regions


def process_template(
    input_path: Path,
    output_dir: Path,
    name: str,
    asset_type: str,
    num_regions: int = 1,
    max_colors: int = 128,
    bg_threshold: int = 30,
) -> dict:
    """Process an AI draft through the full ingest pipeline.

    Steps:
    1. Load PNG
    2. Remove dark background
    3. Build a game palette from the image's dominant colors
    4. Apply ordered dithering
    5. Quantize to palette
    6. Extract material regions
    7. Save cleaned PNG + metadata JSON

    Returns:
        Metadata dict (also saved to JSON)
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load
    img = np.array(Image.open(input_path).convert("RGBA"))

    # Remove background
    img = remove_background(img, threshold=bg_threshold)

    # Build palette from opaque pixels
    opaque_mask = img[:, :, 3] > 0
    if np.any(opaque_mask):
        opaque_pixels = img[opaque_mask][:, :3]
        # Simple palette: pick unique-ish colors, limit to max_colors
        # Use k-means-like reduction on colors
        unique_colors = np.unique(opaque_pixels.reshape(-1, 3), axis=0)
        if len(unique_colors) > max_colors:
            # Subsample deterministically
            step = len(unique_colors) // max_colors
            palette = [tuple(c) for c in unique_colors[::step][:max_colors]]
        else:
            palette = [tuple(c) for c in unique_colors]
    else:
        palette = [(0, 0, 0)]

    # Apply dithering
    img = apply_ordered_dither(img, matrix_size=4, spread=8)

    # Quantize
    img = quantize_image(img, palette)

    # Extract regions
    regions = extract_regions(img, num_regions=num_regions)

    # Save cleaned PNG
    Image.fromarray(img).save(output_dir / f"{name}.png")

    # Build and save metadata
    metadata = {
        "name": name,
        "type": asset_type,
        "width": img.shape[1],
        "height": img.shape[0],
        "palette_size": len(palette),
        "regions": [
            {
                "label": r["label"],
                "pixels": r["pixels"],
                "dominant_color": list(r["dominant_color"]),
            }
            for r in regions
        ],
    }

    (output_dir / f"{name}.json").write_text(json.dumps(metadata, indent=2))

    return metadata
