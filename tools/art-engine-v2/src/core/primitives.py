"""Pixel-art drawing primitives: lines, rectangles, ellipses, flood fill."""
from __future__ import annotations
from collections import deque
import numpy as np

Color = tuple[int, int, int, int]  # RGBA


def _set_pixel(canvas: np.ndarray, x: int, y: int, color: Color) -> None:
    """Set pixel with bounds checking."""
    h, w = canvas.shape[:2]
    if 0 <= x < w and 0 <= y < h:
        canvas[y, x] = color


def draw_line(canvas: np.ndarray, x0: int, y0: int, x1: int, y1: int, color: Color) -> None:
    """Bresenham's line algorithm."""
    # implement full Bresenham with octant handling
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        _set_pixel(canvas, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def draw_rect(canvas: np.ndarray, x0: int, y0: int, x1: int, y1: int, color: Color) -> None:
    """Draw outline rectangle."""
    draw_line(canvas, x0, y0, x1, y0, color)  # Top
    draw_line(canvas, x0, y1, x1, y1, color)  # Bottom
    draw_line(canvas, x0, y0, x0, y1, color)  # Left
    draw_line(canvas, x1, y0, x1, y1, color)  # Right


def draw_filled_rect(canvas: np.ndarray, x0: int, y0: int, x1: int, y1: int, color: Color) -> None:
    """Draw filled rectangle."""
    h, w = canvas.shape[:2]
    for y in range(max(0, min(y0, y1)), min(h, max(y0, y1) + 1)):
        for x in range(max(0, min(x0, x1)), min(w, max(x0, x1) + 1)):
            canvas[y, x] = color


def draw_ellipse(canvas: np.ndarray, cx: int, cy: int, rx: int, ry: int, color: Color) -> None:
    """Midpoint ellipse algorithm."""
    x = 0
    y = ry
    rx2 = rx * rx
    ry2 = ry * ry

    # Region 1
    p1 = ry2 - rx2 * ry + 0.25 * rx2
    dx = 2 * ry2 * x
    dy = 2 * rx2 * y

    while dx < dy:
        _set_pixel(canvas, cx + x, cy + y, color)
        _set_pixel(canvas, cx - x, cy + y, color)
        _set_pixel(canvas, cx + x, cy - y, color)
        _set_pixel(canvas, cx - x, cy - y, color)
        x += 1
        dx += 2 * ry2
        if p1 < 0:
            p1 += dx + ry2
        else:
            y -= 1
            dy -= 2 * rx2
            p1 += dx - dy + ry2

    # Region 2
    p2 = ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2
    while y >= 0:
        _set_pixel(canvas, cx + x, cy + y, color)
        _set_pixel(canvas, cx - x, cy + y, color)
        _set_pixel(canvas, cx + x, cy - y, color)
        _set_pixel(canvas, cx - x, cy - y, color)
        y -= 1
        dy -= 2 * rx2
        if p2 > 0:
            p2 += rx2 - dy
        else:
            x += 1
            dx += 2 * ry2
            p2 += dx - dy + rx2


def flood_fill(canvas: np.ndarray, x: int, y: int, color: Color) -> None:
    """BFS flood fill from (x, y) with given color."""
    h, w = canvas.shape[:2]
    if not (0 <= x < w and 0 <= y < h):
        return
    target = tuple(canvas[y, x])
    fill = tuple(color)
    if target == fill:
        return
    queue = deque([(x, y)])
    visited = set()
    while queue:
        cx, cy = queue.popleft()
        if (cx, cy) in visited:
            continue
        if not (0 <= cx < w and 0 <= cy < h):
            continue
        if tuple(canvas[cy, cx]) != target:
            continue
        visited.add((cx, cy))
        canvas[cy, cx] = color
        queue.extend([(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)])
