"""Layer alpha compositing and blending operations."""
from __future__ import annotations
import numpy as np


def alpha_composite(bg: np.ndarray, fg: np.ndarray) -> np.ndarray:
    """Porter-Duff 'over' compositing of fg onto bg.

    Both arrays must be RGBA uint8 with identical shapes.
    """
    assert bg.shape == fg.shape, f"Shape mismatch: {bg.shape} vs {fg.shape}"

    # Convert to float for math
    bg_f = bg.astype(np.float64) / 255.0
    fg_f = fg.astype(np.float64) / 255.0

    bg_a = bg_f[:, :, 3:4]
    fg_a = fg_f[:, :, 3:4]

    out_a = fg_a + bg_a * (1.0 - fg_a)

    # Avoid division by zero
    safe_a = np.where(out_a > 0, out_a, 1.0)
    out_rgb = (fg_f[:, :, :3] * fg_a + bg_f[:, :, :3] * bg_a * (1.0 - fg_a)) / safe_a

    result = np.zeros_like(bg)
    result[:, :, :3] = np.clip(out_rgb * 255.0, 0, 255).astype(np.uint8)
    result[:, :, 3] = np.clip(out_a[:, :, 0] * 255.0, 0, 255).astype(np.uint8)

    return result


def alpha_composite_at(
    bg: np.ndarray, fg: np.ndarray, x: int, y: int
) -> np.ndarray:
    """Composite fg onto bg at offset (x, y) with bounds clipping.

    If fg extends beyond bg edges, it is clipped. Does not modify bg in place.
    """
    result = bg.copy()
    bg_h, bg_w = bg.shape[:2]
    fg_h, fg_w = fg.shape[:2]

    # Calculate source and destination regions with clipping
    src_x = max(0, -x)
    src_y = max(0, -y)
    dst_x = max(0, x)
    dst_y = max(0, y)

    copy_w = min(fg_w - src_x, bg_w - dst_x)
    copy_h = min(fg_h - src_y, bg_h - dst_y)

    if copy_w <= 0 or copy_h <= 0:
        return result

    # Extract regions
    bg_region = result[dst_y:dst_y + copy_h, dst_x:dst_x + copy_w]
    fg_region = fg[src_y:src_y + copy_h, src_x:src_x + copy_w]

    # Composite the overlapping region
    result[dst_y:dst_y + copy_h, dst_x:dst_x + copy_w] = alpha_composite(bg_region, fg_region)

    return result
