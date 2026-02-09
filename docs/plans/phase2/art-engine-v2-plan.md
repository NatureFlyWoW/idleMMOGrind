# Art Engine V2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Python CLI tool that generates all visual assets for the Idle MMORPG from AI-drafted base templates + procedural generation.

**Architecture:** Standalone Python package at `tools/art-engine-v2/` with a `click`-based CLI. Three pipeline stages: `art ingest` (AI draft cleanup), `art generate` (variant production), `art compose` (UI composition). All output is deterministic — same seeds + params = identical PNGs.

**Tech Stack:** Python 3.11+, Pillow (PIL), NumPy, opensimplex, click

**Design Doc:** `docs/plans/phase2/art-engine-v2-design.md`

**Art Style Reference:** `docs/ui/specs/art-style-guide.md`

---

## Task 1: Project Scaffold + Core Palette System

**Files:**
- Create: `tools/art-engine-v2/pyproject.toml`
- Create: `tools/art-engine-v2/src/__init__.py`
- Create: `tools/art-engine-v2/src/core/__init__.py`
- Create: `tools/art-engine-v2/src/core/palette.py`
- Create: `tools/art-engine-v2/tests/__init__.py`
- Create: `tools/art-engine-v2/tests/test_palette.py`

**Step 1: Create project scaffold with pyproject.toml**

```toml
[project]
name = "art-engine-v2"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "Pillow>=10.0",
    "numpy>=1.24",
    "opensimplex>=0.4",
    "click>=8.1",
]

[project.optional-dependencies]
dev = ["pytest>=7.0", "pytest-cov"]

[project.scripts]
art = "src.cli.__main__:cli"

[tool.pytest.ini_options]
testpaths = ["tests"]
```

Create empty `__init__.py` files for `src/`, `src/core/`, and `tests/`.

**Step 2: Write failing tests for palette system**

```python
# tests/test_palette.py
import numpy as np
from src.core.palette import (
    hex_to_rgb,
    rgb_to_hex,
    generate_ramp,
    nearest_color,
    quantize_image,
    MATERIAL_RAMPS,
    QUALITY_COLORS,
    ZONE_PALETTES,
    UI_COLORS,
)


class TestHexConversion:
    def test_hex_to_rgb(self):
        assert hex_to_rgb("#FF8000") == (255, 128, 0)

    def test_hex_to_rgb_lowercase(self):
        assert hex_to_rgb("#ff8000") == (255, 128, 0)

    def test_hex_to_rgb_no_hash(self):
        assert hex_to_rgb("FF8000") == (255, 128, 0)

    def test_rgb_to_hex(self):
        assert rgb_to_hex((255, 128, 0)) == "#FF8000"

    def test_roundtrip(self):
        original = "#A335EE"
        assert rgb_to_hex(hex_to_rgb(original)) == original


class TestGenerateRamp:
    def test_ramp_length(self):
        ramp = generate_ramp((100, 100, 100), steps=7)
        assert len(ramp) == 7

    def test_ramp_light_to_dark(self):
        ramp = generate_ramp((128, 128, 128), steps=7)
        # First entry should be lightest, last should be darkest
        assert sum(ramp[0]) > sum(ramp[-1])

    def test_ramp_contains_base(self):
        base = (128, 100, 80)
        ramp = generate_ramp(base, steps=7)
        # Middle element should be close to base color
        mid = ramp[3]
        assert abs(mid[0] - base[0]) < 30
        assert abs(mid[1] - base[1]) < 30
        assert abs(mid[2] - base[2]) < 30


class TestNearestColor:
    def test_exact_match(self):
        palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        assert nearest_color((255, 0, 0), palette) == 0

    def test_closest_match(self):
        palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        assert nearest_color((250, 10, 5), palette) == 0  # Closest to red

    def test_blue_match(self):
        palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        assert nearest_color((10, 20, 240), palette) == 2  # Closest to blue


class TestQuantizeImage:
    def test_quantize_reduces_colors(self):
        # 3x3 image with random colors
        img = np.random.randint(0, 256, (3, 3, 4), dtype=np.uint8)
        img[:, :, 3] = 255  # Full alpha
        palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
        result = quantize_image(img, palette)
        # Every pixel should now be one of the palette colors
        for y in range(3):
            for x in range(3):
                rgb = tuple(result[y, x, :3])
                assert rgb in palette

    def test_quantize_preserves_transparency(self):
        img = np.zeros((2, 2, 4), dtype=np.uint8)
        img[0, 0] = [255, 0, 0, 255]  # Opaque red
        img[0, 1] = [0, 255, 0, 0]    # Transparent green
        palette = [(255, 0, 0), (0, 0, 255)]
        result = quantize_image(img, palette)
        assert result[0, 1, 3] == 0  # Transparency preserved


class TestGamePalettes:
    def test_material_ramps_count(self):
        assert len(MATERIAL_RAMPS) == 8  # Iron, Gold, Leather, Cloth, Bone, Crystal, Wood, Stone

    def test_each_ramp_has_7_colors(self):
        for name, ramp in MATERIAL_RAMPS.items():
            assert len(ramp) == 7, f"{name} ramp should have 7 colors"

    def test_quality_colors_count(self):
        assert len(QUALITY_COLORS) == 5  # Common through Legendary

    def test_quality_colors_have_required_fields(self):
        for quality, colors in QUALITY_COLORS.items():
            assert "name" in colors
            assert "border" in colors

    def test_zone_palettes_count(self):
        assert len(ZONE_PALETTES) == 6

    def test_zone_palette_structure(self):
        for zone, palette in ZONE_PALETTES.items():
            assert "primary" in palette
            assert "secondary" in palette
            assert "accent" in palette
```

**Step 3: Run tests — expect FAIL (module not found)**

Run: `cd tools/art-engine-v2 && python -m pytest tests/test_palette.py -v`

**Step 4: Implement palette.py**

```python
# src/core/palette.py
"""Color ramps, quantization, nearest-match, and game palette definitions."""

from __future__ import annotations

import numpy as np


def hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    """Convert hex color string to RGB tuple."""
    h = hex_str.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    """Convert RGB tuple to hex color string."""
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def generate_ramp(
    base: tuple[int, int, int], steps: int = 7
) -> list[tuple[int, int, int]]:
    """Generate a light-to-dark color ramp centered on the base color.

    Returns `steps` colors from lightest to darkest, with the base
    color approximately in the middle.
    """
    ramp = []
    mid = steps // 2
    for i in range(steps):
        t = (i - mid) / max(mid, 1)  # -1.0 to +1.0
        if t < 0:
            # Lighten: blend toward white
            factor = -t * 0.6
            r = int(base[0] + (255 - base[0]) * factor)
            g = int(base[1] + (255 - base[1]) * factor)
            b = int(base[2] + (255 - base[2]) * factor)
        else:
            # Darken: blend toward black
            factor = 1.0 - t * 0.7
            r = int(base[0] * factor)
            g = int(base[1] * factor)
            b = int(base[2] * factor)
        ramp.append((max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b))))
    return ramp


def nearest_color(
    color: tuple[int, int, int], palette: list[tuple[int, int, int]]
) -> int:
    """Return the index of the nearest palette color (Euclidean distance)."""
    min_dist = float("inf")
    best = 0
    for i, pc in enumerate(palette):
        d = (color[0] - pc[0]) ** 2 + (color[1] - pc[1]) ** 2 + (color[2] - pc[2]) ** 2
        if d < min_dist:
            min_dist = d
            best = i
    return best


def quantize_image(
    img: np.ndarray, palette: list[tuple[int, int, int]]
) -> np.ndarray:
    """Quantize an RGBA image array to the given palette, preserving alpha."""
    result = img.copy()
    h, w = img.shape[:2]
    for y in range(h):
        for x in range(w):
            if img[y, x, 3] == 0:
                continue  # Skip transparent pixels
            rgb = tuple(img[y, x, :3])
            idx = nearest_color(rgb, palette)
            result[y, x, :3] = palette[idx]
    return result


# ---------------------------------------------------------------------------
# Game Palette Definitions (from art-style-guide.md)
# ---------------------------------------------------------------------------

# 8 material ramps: 3 base colors each, expanded to 7 via generate_ramp
_MATERIAL_BASES: dict[str, tuple[int, int, int]] = {
    "iron": (140, 140, 150),
    "gold": (212, 175, 55),
    "leather": (139, 90, 43),
    "cloth": (120, 80, 140),
    "bone": (220, 210, 190),
    "crystal": (100, 180, 220),
    "wood": (110, 80, 50),
    "stone": (130, 125, 120),
}

MATERIAL_RAMPS: dict[str, list[tuple[int, int, int]]] = {
    name: generate_ramp(base, 7) for name, base in _MATERIAL_BASES.items()
}

QUALITY_COLORS: dict[str, dict[str, str]] = {
    "common": {"name": "#9D9D9D", "border": "#4A4A4A", "glow": None},
    "uncommon": {"name": "#1EFF00", "border": "#0D7A00", "glow": "#1EFF0033"},
    "rare": {"name": "#0070DD", "border": "#003D7A", "glow": "#0070DD33"},
    "epic": {"name": "#A335EE", "border": "#5C1D87", "glow": "#A335EE33"},
    "legendary": {"name": "#FF8000", "border": "#8A4500", "glow": "#FF800044"},
}

ZONE_PALETTES: dict[str, dict[str, str]] = {
    "starting_regions": {"primary": "#2A3A22", "secondary": "#1A2A14", "accent": "#88CC44"},
    "wildwood": {"primary": "#223A22", "secondary": "#1A2A1A", "accent": "#44CC88"},
    "mistmoors": {"primary": "#222A3A", "secondary": "#1A1A2A", "accent": "#4488CC"},
    "skyreach": {"primary": "#2A2A3A", "secondary": "#1A1A2A", "accent": "#8888CC"},
    "blighted_wastes": {"primary": "#3A2A22", "secondary": "#2A1A14", "accent": "#CC8844"},
    "ascendant": {"primary": "#2A1A3A", "secondary": "#1A0A2A", "accent": "#CC44CC"},
}

UI_COLORS: dict[str, str] = {
    "panel_bg": "#1A1A1F",
    "panel_bg_alt": "#12121A",
    "frame_outer": "#8B7340",
    "frame_inner": "#5C4D2E",
    "frame_highlight": "#C9A84C",
    "frame_shadow": "#3A2E1A",
    "separator": "#3D3529",
    "text_primary": "#E8D5B0",
    "text_secondary": "#A89878",
    "stat_positive": "#1EFF00",
    "stat_negative": "#FF3333",
    "text_gold": "#FFD700",
}
```

**Step 5: Install dependencies and run tests**

Run: `cd tools/art-engine-v2 && pip install -e ".[dev]" && python -m pytest tests/test_palette.py -v`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add tools/art-engine-v2/
git commit -m "feat(art-v2): project scaffold + palette system with game color definitions"
```

---

## Task 2: Seeded RNG + Dithering + Primitives

**Files:**
- Create: `tools/art-engine-v2/src/core/seed.py`
- Create: `tools/art-engine-v2/src/core/dither.py`
- Create: `tools/art-engine-v2/src/core/primitives.py`
- Create: `tools/art-engine-v2/tests/test_seed.py`
- Create: `tools/art-engine-v2/tests/test_dither.py`
- Create: `tools/art-engine-v2/tests/test_primitives.py`

**Step 1: Write failing tests**

```python
# tests/test_seed.py
from src.core.seed import SeededRNG


class TestSeededRNG:
    def test_deterministic(self):
        rng1 = SeededRNG(42)
        rng2 = SeededRNG(42)
        assert [rng1.random() for _ in range(10)] == [rng2.random() for _ in range(10)]

    def test_different_seeds_differ(self):
        rng1 = SeededRNG(42)
        rng2 = SeededRNG(99)
        assert [rng1.random() for _ in range(10)] != [rng2.random() for _ in range(10)]

    def test_int_range(self):
        rng = SeededRNG(42)
        for _ in range(100):
            v = rng.randint(5, 15)
            assert 5 <= v <= 15

    def test_choice(self):
        rng = SeededRNG(42)
        items = ["a", "b", "c"]
        for _ in range(20):
            assert rng.choice(items) in items

    def test_jitter(self):
        rng = SeededRNG(42)
        base = 100.0
        for _ in range(50):
            v = rng.jitter(base, 0.1)
            assert 90.0 <= v <= 110.0
```

```python
# tests/test_dither.py
import numpy as np
from src.core.dither import bayer_matrix, apply_ordered_dither


class TestBayerMatrix:
    def test_2x2_shape(self):
        m = bayer_matrix(2)
        assert m.shape == (2, 2)

    def test_4x4_shape(self):
        m = bayer_matrix(4)
        assert m.shape == (4, 4)

    def test_8x8_shape(self):
        m = bayer_matrix(8)
        assert m.shape == (8, 8)

    def test_values_normalized(self):
        m = bayer_matrix(4)
        assert np.all(m >= -0.5)
        assert np.all(m <= 0.5)


class TestApplyOrderedDither:
    def test_output_shape_matches_input(self):
        img = np.random.randint(0, 256, (16, 16, 4), dtype=np.uint8)
        result = apply_ordered_dither(img, matrix_size=4, spread=16)
        assert result.shape == img.shape

    def test_preserves_alpha(self):
        img = np.zeros((4, 4, 4), dtype=np.uint8)
        img[:, :, 3] = 128
        result = apply_ordered_dither(img, matrix_size=2, spread=8)
        np.testing.assert_array_equal(result[:, :, 3], img[:, :, 3])
```

```python
# tests/test_primitives.py
import numpy as np
from src.core.primitives import (
    draw_line,
    draw_rect,
    draw_filled_rect,
    draw_ellipse,
    flood_fill,
)


class TestDrawLine:
    def test_horizontal_line(self):
        canvas = np.zeros((10, 10, 4), dtype=np.uint8)
        color = (255, 0, 0, 255)
        draw_line(canvas, 0, 5, 9, 5, color)
        for x in range(10):
            assert tuple(canvas[5, x]) == color

    def test_vertical_line(self):
        canvas = np.zeros((10, 10, 4), dtype=np.uint8)
        color = (0, 255, 0, 255)
        draw_line(canvas, 5, 0, 5, 9, color)
        for y in range(10):
            assert tuple(canvas[y, 5]) == color


class TestDrawRect:
    def test_outline_rect(self):
        canvas = np.zeros((10, 10, 4), dtype=np.uint8)
        color = (255, 255, 255, 255)
        draw_rect(canvas, 2, 2, 7, 7, color)
        # Top edge
        assert tuple(canvas[2, 4]) == color
        # Inside should be empty
        assert tuple(canvas[4, 4]) == (0, 0, 0, 0)

    def test_filled_rect(self):
        canvas = np.zeros((10, 10, 4), dtype=np.uint8)
        color = (255, 0, 0, 255)
        draw_filled_rect(canvas, 2, 2, 5, 5, color)
        assert tuple(canvas[3, 3]) == color
        # Outside should be empty
        assert tuple(canvas[0, 0]) == (0, 0, 0, 0)


class TestDrawEllipse:
    def test_ellipse_sets_pixels(self):
        canvas = np.zeros((20, 20, 4), dtype=np.uint8)
        color = (255, 255, 0, 255)
        draw_ellipse(canvas, 10, 10, 5, 5, color)
        # At least some pixels should be set
        assert np.any(canvas[:, :, 3] > 0)


class TestFloodFill:
    def test_fills_region(self):
        canvas = np.zeros((10, 10, 4), dtype=np.uint8)
        # Draw a box border
        draw_rect(canvas, 2, 2, 7, 7, (255, 255, 255, 255))
        # Fill inside
        fill_color = (255, 0, 0, 255)
        flood_fill(canvas, 4, 4, fill_color)
        assert tuple(canvas[4, 4]) == fill_color
        # Border should not be filled
        assert tuple(canvas[2, 2]) == (255, 255, 255, 255)
```

**Step 2: Run tests — expect FAIL**

**Step 3: Implement all three modules**

`seed.py`: Wrapper around Python's `random.Random` with `random()`, `randint()`, `choice()`, `shuffle()`, `jitter(base, pct)` methods.

`dither.py`: Bayer matrix generator (recursive subdivision), `apply_ordered_dither(img, matrix_size, spread)` that adds dither offset to RGB channels before quantization.

`primitives.py`: Bresenham line, outline rect, filled rect, midpoint ellipse, BFS flood fill. All operate on RGBA numpy arrays with bounds checking.

**Step 4: Run tests — expect PASS**

**Step 5: Commit**

```bash
git commit -m "feat(art-v2): seeded RNG, Bayer dithering, and drawing primitives"
```

---

## Task 3: Noise Generation + Layer Compositor

**Files:**
- Create: `tools/art-engine-v2/src/core/noise.py`
- Create: `tools/art-engine-v2/src/core/compositor.py`
- Create: `tools/art-engine-v2/tests/test_noise.py`
- Create: `tools/art-engine-v2/tests/test_compositor.py`

**Step 1: Write failing tests**

```python
# tests/test_noise.py
import numpy as np
from src.core.noise import generate_noise, generate_tileable_noise


class TestGenerateNoise:
    def test_output_shape(self):
        result = generate_noise(64, 64, scale=0.05, seed=42)
        assert result.shape == (64, 64)

    def test_deterministic(self):
        a = generate_noise(32, 32, scale=0.05, seed=42)
        b = generate_noise(32, 32, scale=0.05, seed=42)
        np.testing.assert_array_equal(a, b)

    def test_different_seeds(self):
        a = generate_noise(32, 32, scale=0.05, seed=42)
        b = generate_noise(32, 32, scale=0.05, seed=99)
        assert not np.array_equal(a, b)

    def test_values_normalized(self):
        result = generate_noise(64, 64, scale=0.05, seed=42)
        assert np.all(result >= 0.0)
        assert np.all(result <= 1.0)


class TestTileableNoise:
    def test_tileable_edges_match(self):
        result = generate_tileable_noise(64, 64, scale=0.05, seed=42)
        # Left edge should match right edge
        np.testing.assert_allclose(result[:, 0], result[:, -1], atol=0.05)
        # Top should match bottom
        np.testing.assert_allclose(result[0, :], result[-1, :], atol=0.05)
```

```python
# tests/test_compositor.py
import numpy as np
from src.core.compositor import alpha_composite, alpha_composite_at


class TestAlphaComposite:
    def test_opaque_over_opaque(self):
        bg = np.full((4, 4, 4), [0, 0, 255, 255], dtype=np.uint8)
        fg = np.full((4, 4, 4), [255, 0, 0, 255], dtype=np.uint8)
        result = alpha_composite(bg, fg)
        # Fully opaque foreground replaces background
        assert tuple(result[0, 0]) == (255, 0, 0, 255)

    def test_transparent_fg_shows_bg(self):
        bg = np.full((4, 4, 4), [0, 0, 255, 255], dtype=np.uint8)
        fg = np.full((4, 4, 4), [255, 0, 0, 0], dtype=np.uint8)
        result = alpha_composite(bg, fg)
        assert tuple(result[0, 0]) == (0, 0, 255, 255)

    def test_half_alpha_blend(self):
        bg = np.full((4, 4, 4), [0, 0, 0, 255], dtype=np.uint8)
        fg = np.full((4, 4, 4), [255, 255, 255, 128], dtype=np.uint8)
        result = alpha_composite(bg, fg)
        # Should be roughly mid-gray
        r, g, b = result[0, 0, 0], result[0, 0, 1], result[0, 0, 2]
        assert 100 < r < 160
        assert 100 < g < 160
        assert 100 < b < 160


class TestAlphaCompositeAt:
    def test_composites_at_offset(self):
        bg = np.zeros((10, 10, 4), dtype=np.uint8)
        bg[:, :, 3] = 255
        fg = np.full((3, 3, 4), [255, 0, 0, 255], dtype=np.uint8)
        result = alpha_composite_at(bg, fg, x=2, y=2)
        assert tuple(result[2, 2, :3]) == (255, 0, 0)
        assert tuple(result[0, 0, :3]) == (0, 0, 0)

    def test_clips_to_bounds(self):
        bg = np.zeros((5, 5, 4), dtype=np.uint8)
        bg[:, :, 3] = 255
        fg = np.full((4, 4, 4), [255, 0, 0, 255], dtype=np.uint8)
        # Offset so fg hangs off the edge — should not crash
        result = alpha_composite_at(bg, fg, x=3, y=3)
        assert result.shape == (5, 5, 4)
```

**Step 2: Run tests — expect FAIL**

**Step 3: Implement**

`noise.py`: Wraps `opensimplex` to generate 2D noise fields. `generate_noise(w, h, scale, seed, octaves=1)` returns normalized 0-1 float array. `generate_tileable_noise(w, h, scale, seed)` uses 4D cylinder mapping for seamless tiling.

`compositor.py`: `alpha_composite(bg, fg)` — standard Porter-Duff "over" operation on RGBA numpy arrays. `alpha_composite_at(bg, fg, x, y)` — composites fg onto bg at given offset with bounds clipping.

**Step 4: Run tests — expect PASS**

**Step 5: Commit**

```bash
git commit -m "feat(art-v2): noise generation and alpha compositing"
```

---

## Task 4: Ingest Pipeline — Background Removal + Region Extraction

**Files:**
- Create: `tools/art-engine-v2/src/ingest/__init__.py`
- Create: `tools/art-engine-v2/src/ingest/background_remover.py`
- Create: `tools/art-engine-v2/src/ingest/region_extractor.py`
- Create: `tools/art-engine-v2/src/ingest/template_processor.py`
- Create: `tools/art-engine-v2/tests/test_ingest.py`
- Create: `tools/art-engine-v2/tests/fixtures/` (test images)

**Step 1: Write failing tests**

```python
# tests/test_ingest.py
import json
import numpy as np
from pathlib import Path
from PIL import Image
from src.core.palette import MATERIAL_RAMPS
from src.ingest.background_remover import remove_background
from src.ingest.region_extractor import extract_regions
from src.ingest.template_processor import process_template


class TestBackgroundRemover:
    def test_dark_bg_removed(self):
        """Pixels matching the dark background color (#1A1A1F) become transparent."""
        img = np.zeros((10, 10, 4), dtype=np.uint8)
        img[:, :] = [0x1A, 0x1A, 0x1F, 255]  # Dark bg
        img[5, 5] = [255, 0, 0, 255]  # Red pixel
        result = remove_background(img, threshold=30)
        assert result[0, 0, 3] == 0  # Background now transparent
        assert result[5, 5, 3] == 255  # Red pixel preserved

    def test_near_black_removed(self):
        """Very dark pixels near the bg color should also be removed."""
        img = np.zeros((5, 5, 4), dtype=np.uint8)
        img[:, :] = [20, 20, 25, 255]  # Slightly different dark
        img[2, 2] = [200, 100, 50, 255]  # Bright pixel
        result = remove_background(img, threshold=30)
        assert result[0, 0, 3] == 0
        assert result[2, 2, 3] == 255


class TestRegionExtractor:
    def test_single_region(self):
        """A single-color object should produce one region."""
        img = np.zeros((10, 10, 4), dtype=np.uint8)
        # Red block in center
        img[3:7, 3:7] = [180, 50, 30, 255]
        regions = extract_regions(img, num_regions=1)
        assert len(regions) == 1
        assert len(regions[0]["pixels"]) > 0

    def test_two_regions(self):
        """Two distinct color areas should split into two regions."""
        img = np.zeros((10, 20, 4), dtype=np.uint8)
        img[2:8, 2:8] = [180, 50, 30, 255]    # Red-ish left
        img[2:8, 12:18] = [30, 50, 180, 255]   # Blue-ish right
        regions = extract_regions(img, num_regions=2)
        assert len(regions) == 2


class TestTemplateProcessor:
    def test_full_pipeline(self, tmp_path):
        """Process a synthetic template through the full ingest pipeline."""
        # Create a test image: dark bg with a colored item
        img = np.full((48, 48, 4), [0x1A, 0x1A, 0x1F, 255], dtype=np.uint8)
        img[10:38, 10:38] = [140, 140, 150, 255]  # Iron-colored center

        input_path = tmp_path / "test_weapon.png"
        Image.fromarray(img).save(input_path)

        output_dir = tmp_path / "templates"
        result = process_template(
            input_path=input_path,
            output_dir=output_dir,
            name="test_weapon",
            asset_type="weapon",
            num_regions=1,
            max_colors=128,
        )

        assert (output_dir / "test_weapon.png").exists()
        assert (output_dir / "test_weapon.json").exists()

        meta = json.loads((output_dir / "test_weapon.json").read_text())
        assert meta["name"] == "test_weapon"
        assert meta["type"] == "weapon"
        assert "regions" in meta
```

**Step 2: Run tests — expect FAIL**

**Step 3: Implement**

`background_remover.py`: `remove_background(img, bg_color=(0x1A, 0x1A, 0x1F), threshold=30)` — calculates Euclidean distance from bg_color for each pixel; sets alpha=0 for pixels within threshold.

`region_extractor.py`: `extract_regions(img, num_regions)` — collects opaque pixels, uses k-means on (x_norm, y_norm, r, g, b) feature vectors, returns list of region dicts with pixel coordinate lists and dominant color.

`template_processor.py`: `process_template(input_path, output_dir, name, asset_type, num_regions, max_colors)` — orchestrates bg removal → palette quantization → dithering → region extraction → saves cleaned PNG + metadata JSON.

**Step 4: Run tests — expect PASS**

**Step 5: Commit**

```bash
git commit -m "feat(art-v2): ingest pipeline — background removal, region extraction, template processor"
```

---

## Task 5: Icon Variant Generator

**Files:**
- Create: `tools/art-engine-v2/src/generators/__init__.py`
- Create: `tools/art-engine-v2/src/generators/icons.py`
- Create: `tools/art-engine-v2/tests/test_icons.py`

**Step 1: Write failing tests**

```python
# tests/test_icons.py
import json
import numpy as np
from pathlib import Path
from PIL import Image
from src.generators.icons import generate_icon, generate_icon_batch
from src.core.palette import QUALITY_COLORS


class TestGenerateIcon:
    def _make_template(self, tmp_path):
        """Create a minimal template + metadata for testing."""
        tpl_dir = tmp_path / "templates"
        tpl_dir.mkdir(parents=True)
        # 48x48 template with center block
        img = np.zeros((48, 48, 4), dtype=np.uint8)
        img[8:40, 8:40] = [140, 140, 150, 255]  # Iron colored
        Image.fromarray(img).save(tpl_dir / "test_sword.png")
        meta = {
            "name": "test_sword",
            "type": "weapon",
            "regions": [{"label": "blade", "pixels": [[x, y] for y in range(8, 40) for x in range(8, 40)]}],
        }
        (tpl_dir / "test_sword.json").write_text(json.dumps(meta))
        return tpl_dir

    def test_generates_png(self, tmp_path):
        tpl_dir = self._make_template(tmp_path)
        out_dir = tmp_path / "output"
        result = generate_icon(
            template_dir=tpl_dir,
            template_name="test_sword",
            material="iron",
            quality="common",
            seed=42,
            output_dir=out_dir,
        )
        assert result.exists()
        assert result.suffix == ".png"

    def test_deterministic_output(self, tmp_path):
        tpl_dir = self._make_template(tmp_path)
        out1 = tmp_path / "out1"
        out2 = tmp_path / "out2"
        r1 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 42, out1)
        r2 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 42, out2)
        img1 = np.array(Image.open(r1))
        img2 = np.array(Image.open(r2))
        np.testing.assert_array_equal(img1, img2)

    def test_different_seeds_differ(self, tmp_path):
        tpl_dir = self._make_template(tmp_path)
        out1 = tmp_path / "out1"
        out2 = tmp_path / "out2"
        r1 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 42, out1)
        r2 = generate_icon(tpl_dir, "test_sword", "iron", "rare", 99, out2)
        img1 = np.array(Image.open(r1))
        img2 = np.array(Image.open(r2))
        assert not np.array_equal(img1, img2)

    def test_quality_glow_applied(self, tmp_path):
        tpl_dir = self._make_template(tmp_path)
        out_common = tmp_path / "out_c"
        out_legend = tmp_path / "out_l"
        rc = generate_icon(tpl_dir, "test_sword", "iron", "common", 42, out_common)
        rl = generate_icon(tpl_dir, "test_sword", "iron", "legendary", 42, out_legend)
        ic = np.array(Image.open(rc))
        il = np.array(Image.open(rl))
        # Legendary should have more non-transparent pixels (glow extends the silhouette)
        assert np.sum(il[:, :, 3] > 0) > np.sum(ic[:, :, 3] > 0)


class TestGenerateIconBatch:
    def test_batch_generates_multiple(self, tmp_path):
        # Create template
        tpl_dir = tmp_path / "templates"
        tpl_dir.mkdir(parents=True)
        img = np.zeros((48, 48, 4), dtype=np.uint8)
        img[8:40, 8:40] = [140, 140, 150, 255]
        Image.fromarray(img).save(tpl_dir / "test_axe.png")
        meta = {
            "name": "test_axe",
            "type": "weapon",
            "regions": [{"label": "head", "pixels": [[x, y] for y in range(8, 40) for x in range(8, 40)]}],
        }
        (tpl_dir / "test_axe.json").write_text(json.dumps(meta))

        out_dir = tmp_path / "output"
        results = generate_icon_batch(
            template_dir=tpl_dir,
            template_name="test_axe",
            materials=["iron", "gold"],
            qualities=["common", "rare"],
            seeds=[100, 101],
            output_dir=out_dir,
        )
        # 2 materials * 2 qualities * 2 seeds = 8 icons
        assert len(results) == 8
        assert all(p.exists() for p in results)
```

**Step 2: Run tests — expect FAIL**

**Step 3: Implement icons.py**

Pipeline per icon:
1. Load template PNG + metadata JSON
2. For each region, swap material colors using ramp index mapping
3. Apply seed-based dither jitter (±0.5 index shift via SeededRNG)
4. Draw 2px dark outline around solid pixels
5. Apply quality glow: detect edge pixels, radiate outward with glow color/radius/intensity from QUALITY_COLORS
6. Save to `{output_dir}/{type}-{template}-{material}-{quality}-{seed:03d}.png`

`generate_icon_batch()` iterates product of materials × qualities × seeds.

**Step 4: Run tests — expect PASS**

**Step 5: Commit**

```bash
git commit -m "feat(art-v2): icon variant generator with material swapping and quality glow"
```

---

## Task 6: Game Palette Definitions

**Files:**
- Create: `tools/art-engine-v2/src/palettes/__init__.py`
- Create: `tools/art-engine-v2/src/palettes/game_palettes.py`
- Create: `tools/art-engine-v2/tests/test_game_palettes.py`

**Step 1: Write failing tests**

```python
# tests/test_game_palettes.py
from src.palettes.game_palettes import (
    CLASS_COLORS,
    BAR_COLORS,
    BOSS_PALETTES,
    QUALITY_GLOW_PARAMS,
)


class TestClassColors:
    def test_all_nine_classes(self):
        expected = {"blademaster", "sentinel", "stalker", "shadow", "cleric",
                    "arcanist", "summoner", "channeler", "shapeshifter"}
        assert set(CLASS_COLORS.keys()) == expected


class TestBarColors:
    def test_bar_types(self):
        expected = {"health", "mana", "energy", "rage", "xp", "reputation", "profession", "cast"}
        assert set(BAR_COLORS.keys()) == expected

    def test_bar_color_structure(self):
        for bar, colors in BAR_COLORS.items():
            assert "fill" in colors
            assert "bg" in colors
            assert "border" in colors


class TestQualityGlowParams:
    def test_all_qualities(self):
        expected = {"common", "uncommon", "rare", "epic", "legendary"}
        assert set(QUALITY_GLOW_PARAMS.keys()) == expected

    def test_common_has_no_glow(self):
        assert QUALITY_GLOW_PARAMS["common"]["radius"] == 0

    def test_legendary_has_max_glow(self):
        params = QUALITY_GLOW_PARAMS["legendary"]
        assert params["radius"] >= 2
        assert params["intensity"] >= 0.8
```

**Step 2: Implement game_palettes.py**

All color values from art-style-guide.md sections 3.1-3.5, 6.4 (class colors), 3.4 (bar colors). Quality glow params: common (r=0,i=0), uncommon (r=1,i=0.2,#1EFF00), rare (r=1,i=0.4,#0070DD), epic (r=2,i=0.6,#A335EE), legendary (r=2,i=0.9,#FF8000).

**Step 3: Run tests — expect PASS**

**Step 4: Commit**

```bash
git commit -m "feat(art-v2): comprehensive game palette definitions from art style guide"
```

---

## Task 7: CLI Framework — `art ingest` + `art generate icons`

**Files:**
- Create: `tools/art-engine-v2/src/cli/__init__.py`
- Create: `tools/art-engine-v2/src/cli/__main__.py`
- Create: `tools/art-engine-v2/src/cli/ingest.py`
- Create: `tools/art-engine-v2/src/cli/generate.py`
- Create: `tools/art-engine-v2/tests/test_cli.py`

**Step 1: Write failing tests**

```python
# tests/test_cli.py
import json
import numpy as np
from pathlib import Path
from click.testing import CliRunner
from PIL import Image
from src.cli.__main__ import cli


def _make_draft(path: Path) -> Path:
    """Create a synthetic draft PNG for CLI testing."""
    img = np.full((48, 48, 4), [0x1A, 0x1A, 0x1F, 255], dtype=np.uint8)
    img[8:40, 8:40] = [140, 140, 150, 255]  # Iron-colored item
    img_path = path / "test_item.png"
    Image.fromarray(img).save(img_path)
    return img_path


class TestIngestCLI:
    def test_ingest_single(self, tmp_path):
        draft = _make_draft(tmp_path / "drafts")
        (tmp_path / "drafts").mkdir(parents=True, exist_ok=True)
        draft = _make_draft(tmp_path / "drafts")

        runner = CliRunner()
        result = runner.invoke(cli, [
            "ingest",
            "--input", str(draft),
            "--type", "weapon",
            "--name", "test_item",
            "--output", str(tmp_path / "templates"),
        ])
        assert result.exit_code == 0, result.output
        assert (tmp_path / "templates" / "test_item.png").exists()
        assert (tmp_path / "templates" / "test_item.json").exists()


class TestGenerateIconsCLI:
    def _setup_template(self, tmp_path):
        tpl_dir = tmp_path / "templates"
        tpl_dir.mkdir(parents=True)
        img = np.zeros((48, 48, 4), dtype=np.uint8)
        img[8:40, 8:40] = [140, 140, 150, 255]
        Image.fromarray(img).save(tpl_dir / "sword.png")
        meta = {
            "name": "sword",
            "type": "weapon",
            "regions": [{"label": "blade", "pixels": [[x, y] for y in range(8, 40) for x in range(8, 40)]}],
        }
        (tpl_dir / "sword.json").write_text(json.dumps(meta))
        return tpl_dir

    def test_generate_single_icon(self, tmp_path):
        tpl_dir = self._setup_template(tmp_path)
        runner = CliRunner()
        result = runner.invoke(cli, [
            "generate", "icons",
            "--template-dir", str(tpl_dir),
            "--template", "sword",
            "--materials", "iron",
            "--qualities", "rare",
            "--seeds", "42",
            "--output", str(tmp_path / "output"),
        ])
        assert result.exit_code == 0, result.output
        assert any((tmp_path / "output").iterdir())
```

**Step 2: Implement CLI**

`__main__.py`: Creates the click group `cli` with `ingest` and `generate` subgroups.

`ingest.py`: `art ingest --input <path> --type <type> --name <name> [--regions <n>] [--max-colors <n>] [--output <dir>]`. Calls `process_template()`.

`generate.py`: `art generate icons --template-dir <dir> --template <name> --materials <csv> --qualities <csv> --seeds <range> [--output <dir>]`. Parses seed ranges ("100-109"), calls `generate_icon_batch()`.

**Step 3: Run tests — expect PASS**

**Step 4: Commit**

```bash
git commit -m "feat(art-v2): CLI framework with art ingest and art generate icons commands"
```

---

## Task 8: Text Rendering System

**Files:**
- Create: `tools/art-engine-v2/src/layout/__init__.py`
- Create: `tools/art-engine-v2/src/layout/text.py`
- Create: `tools/art-engine-v2/src/data/fonts/` (directory — fonts added manually)
- Create: `tools/art-engine-v2/tests/test_text.py`

**Step 1: Write failing tests**

```python
# tests/test_text.py
import numpy as np
from PIL import Image
from src.layout.text import TextRenderer


class TestTextRenderer:
    def test_render_returns_image(self):
        renderer = TextRenderer()
        img = renderer.render_text("Hello", font_name="body", size=14, color="#FFFFFF")
        assert isinstance(img, np.ndarray)
        assert img.shape[2] == 4  # RGBA

    def test_render_has_nonzero_alpha(self):
        renderer = TextRenderer()
        img = renderer.render_text("Test", font_name="body", size=14, color="#FF0000")
        assert np.any(img[:, :, 3] > 0)

    def test_measure_text(self):
        renderer = TextRenderer()
        w, h = renderer.measure_text("Hello", font_name="body", size=14)
        assert w > 0
        assert h > 0

    def test_different_sizes(self):
        renderer = TextRenderer()
        w1, _ = renderer.measure_text("Test", font_name="body", size=12)
        w2, _ = renderer.measure_text("Test", font_name="body", size=24)
        assert w2 > w1

    def test_colored_text(self):
        renderer = TextRenderer()
        img = renderer.render_text("Red", font_name="body", size=14, color="#FF0000")
        # Find a non-transparent pixel and check it's red-ish
        mask = img[:, :, 3] > 128
        if np.any(mask):
            coords = np.argwhere(mask)
            y, x = coords[0]
            assert img[y, x, 0] > 200  # Red channel high

    def test_stat_block_rendering(self):
        renderer = TextRenderer()
        stats = [
            ("+15 Strength", "#1EFF00"),
            ("+8 Stamina", "#1EFF00"),
            ("Item Level 42", "#FFD700"),
        ]
        img = renderer.render_stat_block(stats, font_name="body", size=14)
        assert isinstance(img, np.ndarray)
        assert img.shape[0] > 0  # Has height
```

**Step 2: Implement text.py**

`TextRenderer` class:
- `__init__()`: Loads TTF fonts from `src/data/fonts/`. Falls back to Pillow default if fonts not found. Font map: `heading` → Cinzel, `body` → Inter, `mono` → JetBrains Mono.
- `render_text(text, font_name, size, color)` → RGBA numpy array with rendered text on transparent bg.
- `measure_text(text, font_name, size)` → (width, height) tuple.
- `render_stat_block(lines, font_name, size, line_spacing=4)` → Renders multiple color-coded lines stacked vertically.

Uses Pillow's `ImageFont.truetype()` + `ImageDraw.text()`, renders to PIL Image, converts to numpy.

**Note on fonts:** The `src/data/fonts/` directory is created empty. Real TTF files must be added manually (Cinzel, Inter, JetBrains Mono are all free/open-source). The renderer must fall back gracefully to Pillow defaults when fonts are missing.

**Step 3: Run tests — expect PASS**

**Step 4: Commit**

```bash
git commit -m "feat(art-v2): text rendering system with font loading and stat block support"
```

---

## Task 9: 9-Slice Frame Renderer + UI Chrome Generator

**Files:**
- Create: `tools/art-engine-v2/src/generators/ui_chrome.py`
- Create: `tools/art-engine-v2/src/generators/backgrounds.py`
- Create: `tools/art-engine-v2/tests/test_ui_chrome.py`
- Create: `tools/art-engine-v2/tests/test_backgrounds.py`

**Step 1: Write failing tests**

```python
# tests/test_ui_chrome.py
import numpy as np
from src.generators.ui_chrome import (
    render_nine_slice,
    render_panel_frame,
    render_button,
    render_progress_bar,
)


class TestNineSlice:
    def test_output_size(self):
        # Create a 9-slice source: 12x12 image (4px corners, 4px center)
        source = np.full((12, 12, 4), [100, 100, 100, 255], dtype=np.uint8)
        result = render_nine_slice(source, target_width=100, target_height=60, border=4)
        assert result.shape == (60, 100, 4)

    def test_corners_preserved(self):
        source = np.zeros((12, 12, 4), dtype=np.uint8)
        source[:4, :4] = [255, 0, 0, 255]  # Top-left corner is red
        result = render_nine_slice(source, target_width=50, target_height=50, border=4)
        assert tuple(result[0, 0, :3]) == (255, 0, 0)


class TestPanelFrame:
    def test_renders_at_size(self):
        frame = render_panel_frame(200, 100)
        assert frame.shape == (100, 200, 4)

    def test_has_border_pixels(self):
        frame = render_panel_frame(50, 50)
        # Border should have non-zero RGB (gold tones)
        assert frame[0, 10, 3] > 0


class TestButton:
    def test_renders(self):
        btn = render_button(120, 40, label="Click Me")
        assert btn.shape[0] == 40
        assert btn.shape[1] == 120

class TestProgressBar:
    def test_full_bar(self):
        bar = render_progress_bar(200, 20, progress=1.0, bar_type="health")
        assert bar.shape == (20, 200, 4)

    def test_half_bar(self):
        bar = render_progress_bar(200, 20, progress=0.5, bar_type="xp")
        assert bar.shape == (20, 200, 4)

    def test_empty_bar(self):
        bar = render_progress_bar(200, 20, progress=0.0, bar_type="mana")
        assert bar.shape == (20, 200, 4)
```

```python
# tests/test_backgrounds.py
import numpy as np
from src.generators.backgrounds import generate_background


class TestBackgroundGenerator:
    def test_output_shape(self):
        bg = generate_background("starting_regions", 400, 800, seed=42)
        assert bg.shape == (800, 400, 4)

    def test_deterministic(self):
        bg1 = generate_background("mistmoors", 100, 100, seed=42)
        bg2 = generate_background("mistmoors", 100, 100, seed=42)
        np.testing.assert_array_equal(bg1, bg2)

    def test_different_zones_differ(self):
        bg1 = generate_background("starting_regions", 100, 100, seed=42)
        bg2 = generate_background("blighted_wastes", 100, 100, seed=42)
        assert not np.array_equal(bg1, bg2)
```

**Step 2: Implement**

`ui_chrome.py`:
- `render_nine_slice(source, target_width, target_height, border)` — Splits source into 9 regions, tiles edges, stretches center.
- `render_panel_frame(w, h)` — Programmatic 4-layer bevel: outer shadow (#3A2E1A 1px), gold body (#8B7340 2px), highlight (#C9A84C 1px top-left), inner bevel (#5C4D2E 1px). Panel bg (#1A1A1F) fill.
- `render_button(w, h, label)` — Panel + centered text.
- `render_progress_bar(w, h, progress, bar_type)` — Background track + fill at progress %. Colors from BAR_COLORS.

`backgrounds.py`:
- `generate_background(zone, w, h, seed)` — Layer large-scale + detail simplex noise, quantize to 6-color zone palette, apply Bayer 8x8 dithering, optional vignette.

**Step 3: Run tests — expect PASS**

**Step 4: Commit**

```bash
git commit -m "feat(art-v2): 9-slice frame, UI chrome components, zone background generator"
```

---

## Task 10: Tooltip Renderer

**Files:**
- Create: `tools/art-engine-v2/src/generators/tooltips.py`
- Create: `tools/art-engine-v2/src/layout/schemas.py`
- Create: `tools/art-engine-v2/tests/test_tooltips.py`

**Step 1: Write failing tests**

```python
# tests/test_tooltips.py
import numpy as np
from src.generators.tooltips import render_tooltip


SAMPLE_ITEM = {
    "name": "Staff of Starfire",
    "quality": "epic",
    "slot": "Two-Hand",
    "bind": "Binds when equipped",
    "item_level": 42,
    "primary_stats": ["+15 Intellect", "+10 Stamina"],
    "secondary_stats": ["Equip: Increases spell power by 22"],
    "effects": [],
    "flavor_text": "Forged in the heart of a dying star.",
    "icon_path": None,
}


class TestRenderTooltip:
    def test_returns_image(self):
        img = render_tooltip(SAMPLE_ITEM)
        assert isinstance(img, np.ndarray)
        assert img.shape[2] == 4

    def test_width_is_320(self):
        img = render_tooltip(SAMPLE_ITEM)
        assert img.shape[1] == 320

    def test_height_varies_with_content(self):
        short_item = {**SAMPLE_ITEM, "primary_stats": ["+5 STR"], "secondary_stats": [], "flavor_text": ""}
        long_item = SAMPLE_ITEM
        short_img = render_tooltip(short_item)
        long_img = render_tooltip(long_item)
        assert long_img.shape[0] > short_img.shape[0]

    def test_has_visible_content(self):
        img = render_tooltip(SAMPLE_ITEM)
        assert np.any(img[:, :, 3] > 0)

    def test_quality_name_color(self):
        """Epic items should have purple-tinted name area."""
        img = render_tooltip(SAMPLE_ITEM)
        # Top section should have some purple pixels (from epic quality text)
        top_strip = img[5:25, :, :]
        assert np.any(top_strip[:, :, 3] > 0)
```

**Step 2: Implement**

`schemas.py`: TypedDict definitions for item data, layout config.

`tooltips.py`: `render_tooltip(item_data, width=320)`:
1. Calculate content height from text metrics
2. Draw panel background (#1A1A1F)
3. Draw ornate frame (using `render_panel_frame`)
4. Render item name in quality color (Cinzel, 20px)
5. Render slot type, bind type (Inter, 12px, secondary color)
6. Draw separator line (#3D3529)
7. Render primary stats in green (#1EFF00)
8. Render secondary stats in white
9. Render effects (gold header + white body)
10. Render flavor text (italic, secondary color)
11. Composite 64x64 item icon in top-right (if icon_path provided)
12. Apply quality glow around icon

**Step 3: Run tests — expect PASS**

**Step 4: Commit**

```bash
git commit -m "feat(art-v2): tooltip renderer with quality coloring and stat blocks"
```

---

## Task 11: Sprite Compositor

**Files:**
- Create: `tools/art-engine-v2/src/generators/sprites.py`
- Create: `tools/art-engine-v2/tests/test_sprites.py`

**Step 1: Write failing tests**

```python
# tests/test_sprites.py
import json
import numpy as np
from pathlib import Path
from PIL import Image
from src.generators.sprites import compose_sprite, LAYER_ORDER


class TestLayerOrder:
    def test_correct_count(self):
        assert len(LAYER_ORDER) == 10

    def test_body_is_first(self):
        assert LAYER_ORDER[0] == "body"

    def test_back_is_last(self):
        assert LAYER_ORDER[-1] == "back"


class TestCompositeSprite:
    def _make_layer(self, tmp_path, name, color):
        d = tmp_path / "layers"
        d.mkdir(parents=True, exist_ok=True)
        img = np.zeros((512, 256, 4), dtype=np.uint8)
        # Draw a small block in the center
        img[200:300, 100:156] = [*color, 255]
        Image.fromarray(img).save(d / f"{name}.png")
        return d

    def test_body_only(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        result = compose_sprite(
            layer_dir=layer_dir,
            layers={"body": "body.png"},
        )
        assert result.shape == (512, 256, 4)
        assert np.any(result[:, :, 3] > 0)

    def test_body_plus_armor(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        # Add chest overlay
        chest = np.zeros((512, 256, 4), dtype=np.uint8)
        chest[220:280, 105:151] = [140, 140, 150, 255]
        Image.fromarray(chest).save(layer_dir / "chest.png")

        result = compose_sprite(
            layer_dir=layer_dir,
            layers={"body": "body.png", "chest": "chest.png"},
        )
        # Chest should composite on top of body
        assert result.shape == (512, 256, 4)

    def test_deterministic(self, tmp_path):
        layer_dir = self._make_layer(tmp_path, "body", (180, 140, 100))
        r1 = compose_sprite(layer_dir, {"body": "body.png"}, seed=42)
        r2 = compose_sprite(layer_dir, {"body": "body.png"}, seed=42)
        np.testing.assert_array_equal(r1, r2)
```

**Step 2: Implement sprites.py**

```python
LAYER_ORDER = ["body", "pants", "boots", "chest", "belt", "shoulders", "gloves", "helm", "weapon", "back"]
```

`compose_sprite(layer_dir, layers, seed=None, max_colors=128)`:
1. Start with transparent 256x512 canvas
2. For each layer in LAYER_ORDER, if present in layers dict:
   - Load PNG from layer_dir
   - Optional: material swap if material param provided
   - Alpha composite onto canvas
3. Final pass: palette quantize to max_colors
4. Add floor shadow ellipse (dark, 30% alpha, below feet)
5. Return RGBA numpy array

**Step 3: Run tests — expect PASS**

**Step 4: Commit**

```bash
git commit -m "feat(art-v2): sprite compositor with layered equipment overlays"
```

---

## Task 12: Layout Engine + Compose CLI

**Files:**
- Create: `tools/art-engine-v2/src/layout/engine.py`
- Create: `tools/art-engine-v2/src/cli/compose.py`
- Create: `tools/art-engine-v2/tests/test_layout.py`
- Create: `tools/art-engine-v2/tests/test_cli_compose.py`

**Step 1: Write failing tests**

```python
# tests/test_layout.py
import json
import numpy as np
from pathlib import Path
from src.layout.engine import LayoutEngine


class TestLayoutEngine:
    def test_simple_layout(self, tmp_path):
        layout = {
            "width": 200,
            "height": 100,
            "background": "#1A1A1F",
            "elements": [
                {"type": "rect", "x": 10, "y": 10, "width": 50, "height": 30, "color": "#FF0000"},
                {"type": "text", "x": 70, "y": 10, "text": "Hello", "font": "body", "size": 14, "color": "#FFFFFF"},
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (100, 200, 4)

    def test_nested_panel(self, tmp_path):
        layout = {
            "width": 300,
            "height": 200,
            "background": "#1A1A1F",
            "elements": [
                {
                    "type": "panel",
                    "x": 10,
                    "y": 10,
                    "width": 280,
                    "height": 180,
                    "elements": [
                        {"type": "text", "x": 10, "y": 10, "text": "Nested", "font": "body", "size": 14, "color": "#E8D5B0"},
                    ],
                }
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert result.shape == (200, 300, 4)

    def test_image_element(self, tmp_path):
        # Create a small test image
        from PIL import Image
        test_img = np.full((32, 32, 4), [255, 0, 0, 255], dtype=np.uint8)
        img_path = tmp_path / "test.png"
        Image.fromarray(test_img).save(img_path)

        layout = {
            "width": 100,
            "height": 100,
            "background": "#000000",
            "elements": [
                {"type": "image", "x": 10, "y": 10, "path": str(img_path)},
            ],
        }
        engine = LayoutEngine()
        result = engine.render(layout)
        assert tuple(result[10, 10, :3]) == (255, 0, 0)
```

```python
# tests/test_cli_compose.py
from click.testing import CliRunner
from src.cli.__main__ import cli


class TestComposeCLI:
    def test_compose_background(self, tmp_path):
        runner = CliRunner()
        result = runner.invoke(cli, [
            "compose", "background",
            "--zone", "mistmoors",
            "--width", "100",
            "--height", "100",
            "--seed", "42",
            "--output", str(tmp_path / "bg.png"),
        ])
        assert result.exit_code == 0, result.output
        assert (tmp_path / "bg.png").exists()
```

**Step 2: Implement**

`engine.py`: `LayoutEngine.render(layout_dict)` — Recursive renderer. Supports element types: `rect`, `filled_rect`, `text`, `image`, `panel` (framed container), `progress_bar`, `separator`. Each element has x, y positioning relative to parent.

`compose.py`: CLI commands:
- `art compose tooltip --item-data <json-file> [--output <path>]`
- `art compose background --zone <name> --width <px> --height <px> --seed <n> [--output <path>]`
- `art compose screen --layout <json-file> [--output <path>]`

**Step 3: Run tests — expect PASS**

**Step 4: Commit**

```bash
git commit -m "feat(art-v2): layout engine and art compose CLI commands"
```

---

## Task 13: Manifest Pipeline + `art generate --manifest` + Integration

**Files:**
- Create: `tools/art-engine-v2/src/data/manifests/` (directory)
- Modify: `tools/art-engine-v2/src/cli/generate.py` (add --manifest support)
- Modify: `tools/art-engine-v2/src/generators/icons.py` (manifest loading)
- Create: `tools/art-engine-v2/tests/test_manifest.py`
- Modify: root `package.json` (add `art:v2` script)

**Step 1: Write failing tests**

```python
# tests/test_manifest.py
import json
import numpy as np
from pathlib import Path
from PIL import Image
from click.testing import CliRunner
from src.cli.__main__ import cli


def _make_manifest_setup(tmp_path):
    """Create template + manifest for testing."""
    tpl_dir = tmp_path / "templates"
    tpl_dir.mkdir(parents=True)
    img = np.zeros((48, 48, 4), dtype=np.uint8)
    img[8:40, 8:40] = [140, 140, 150, 255]
    Image.fromarray(img).save(tpl_dir / "dagger.png")
    meta = {
        "name": "dagger",
        "type": "weapon",
        "regions": [{"label": "blade", "pixels": [[x, y] for y in range(8, 40) for x in range(8, 40)]}],
    }
    (tpl_dir / "dagger.json").write_text(json.dumps(meta))

    manifest_dir = tmp_path / "manifests"
    manifest_dir.mkdir(parents=True)
    manifest = {
        "type": "icons",
        "template": "dagger",
        "materials": ["iron", "gold"],
        "qualities": ["common", "epic"],
        "seeds": [100, 101],
        "output_size": [48, 48],
        "output_dir": str(tmp_path / "output" / "icons"),
    }
    manifest_path = manifest_dir / "test_batch.json"
    manifest_path.write_text(json.dumps(manifest))
    return tpl_dir, manifest_path


class TestManifestGeneration:
    def test_manifest_generates_all(self, tmp_path):
        tpl_dir, manifest_path = _make_manifest_setup(tmp_path)
        runner = CliRunner()
        result = runner.invoke(cli, [
            "generate", "--manifest", str(manifest_path),
            "--template-dir", str(tpl_dir),
        ])
        assert result.exit_code == 0, result.output
        output_dir = tmp_path / "output" / "icons"
        pngs = list(output_dir.glob("*.png"))
        # 2 materials * 2 qualities * 2 seeds = 8 icons
        assert len(pngs) == 8
```

**Step 2: Implement manifest support**

Add `--manifest <path>` option to `art generate` command. When provided, reads the JSON manifest and dispatches to the appropriate generator (icons, sprites, etc.) with all specified parameters.

Update root `package.json`:
```json
"art:v2": "cd tools/art-engine-v2 && python -m src.cli"
```

**Step 3: Run tests — expect PASS**

**Step 4: Run full test suite**

Run: `cd tools/art-engine-v2 && python -m pytest tests/ -v --tb=short`
Expected: All tests PASS

**Step 5: Commit**

```bash
git commit -m "feat(art-v2): manifest pipeline, generate --manifest command, and project integration"
```

---

## Summary

| Task | Phase | Component | Est. Test Count |
|------|-------|-----------|----------------|
| 1 | V2-A | Palette system + scaffold | ~15 |
| 2 | V2-A | Seed, dither, primitives | ~15 |
| 3 | V2-A | Noise + compositor | ~12 |
| 4 | V2-A | Ingest pipeline | ~6 |
| 5 | V2-A | Icon generator | ~6 |
| 6 | V2-A | Game palettes | ~8 |
| 7 | V2-A | CLI (ingest + generate) | ~3 |
| 8 | V2-B | Text rendering | ~6 |
| 9 | V2-B/D | UI chrome + backgrounds | ~10 |
| 10 | V2-B | Tooltip renderer | ~5 |
| 11 | V2-C | Sprite compositor | ~5 |
| 12 | V2-D | Layout engine + compose CLI | ~5 |
| 13 | V2-E | Manifest pipeline | ~2 |
| **Total** | | | **~98** |

## Parallelization Notes

Tasks 1-3 are independent core modules and can be implemented in parallel.
Task 4 depends on Tasks 1-2 (palette + dither).
Task 5 depends on Tasks 1-4.
Tasks 8-9 depend on Tasks 1-3.
Task 10 depends on Tasks 8-9.
Task 11 depends on Tasks 1-3.
Task 12 depends on Tasks 8-9.
Task 13 depends on all previous tasks.

Maximum parallelism: Tasks 1, 2, 3 simultaneously → Tasks 4, 6, 8 → Tasks 5, 9 → Tasks 7, 10, 11 → Task 12 → Task 13.
