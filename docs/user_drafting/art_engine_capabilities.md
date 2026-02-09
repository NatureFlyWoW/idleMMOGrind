# Art Engine — Capabilities Reference

A TypeScript CLI tool (`tools/art-engine/`) for programmatic pixel art generation. Development-only utility — not shipped with the game.

**Run:** `pnpm art icons [options]` from project root

---

## Core Systems

| System | What It Does |
|--------|-------------|
| **Pixel Grid** | RGBA byte array with per-pixel API. Arbitrary dimensions. Bounds-safe. Exports to PNG via Node Canvas. |
| **Seeded RNG** | xorshift128+ algorithm. Same seed = identical output every time. Picks, shuffles, bools, ranges. |
| **Palette** | Euclidean nearest-color matching. Generates N-step light→dark ramps from base colors. Hex parsing. |
| **Primitives** | Bresenham lines, filled/outline rects, midpoint ellipses, BFS flood fill. All integer coords, no anti-aliasing. |
| **Dithering** | Ordered dithering via 2×2, 4×4, or 8×8 Bayer matrices. Configurable spread. Preserves transparency. |
| **Export** | Single PNG or sprite sheet (multi-grid, auto-arranged in columns). Auto-creates output directories. |

## Icon Generation Pipeline

```
Template → Seeded Lighting Jitter → Per-Region Material Shading → Outline → Quality Glow → PNG
```

1. **Templates** define a silhouette (boolean mask), named regions (blade, hilt, guard…), default materials, and a lighting angle.
2. **Shading** maps each region's material to a 7-color ramp (expanded from 3 base colors), then applies directional + ambient lighting modulated by pixel depth and dither jitter.
3. **Outline** draws a 2px dark border around all solid pixels.
4. **Quality glow** adds edge-detected radial glow per rarity tier (see below).

### Current Templates (3)

All 48×48px: **Longsword** (4 regions), **Axe** (2 regions), **Dagger** (3 regions)

### Quality Tiers

| Tier | Border Glow | Radius | Intensity |
|------|------------|--------|-----------|
| Common | None | 0 | 0 |
| Uncommon | Green `#1EFF00` | 1px | 0.2 |
| Rare | Blue `#4A9FFF` | 1px | 0.4 |
| Epic | Purple `#C77DFF` | 2px | 0.6 |
| Legendary | Orange `#FFB347` | 2px | 0.9 |

## Game Palettes

- **8 Material ramps** (Iron, Gold, Leather, Cloth, Bone, Crystal, Wood, Stone) — 3 base colors each, expanded to 7 via interpolation.
- **6 Zone palettes** (Starting Regions, Wildwood, Mistmoors, Skyreach, Blighted Wastes, Ascendant Territories) — 6 colors each for zone-specific theming.

## CLI Usage

```bash
# Single icon
pnpm art icons --category=weapon --type=longsword --quality=epic --seed=42

# Batch: 10 variants at one quality
pnpm art icons --category=weapon --type=axe --quality=legendary --seeds=100-109

# Multi-quality batch (3 seeds × 3 qualities = 9 PNGs)
pnpm art icons --category=weapon --type=dagger --quality=rare,epic,legendary --seeds=50-52

# All five qualities for one seed
pnpm art icons --category=weapon --type=longsword --quality=all --seed=7

# List available templates
pnpm art icons --category=weapon --list
```

**Output naming:** `{category}-{type}-{quality}-{seed}.png` → e.g. `weapon-longsword-epic-042.png`

**Default output dir:** `tools/art-engine/output/` (gitignored)

## Key Design Principle

**Commit seeds, not PNGs.** All randomness is seeded — identical parameters always produce pixel-identical results. Store generation manifests in version control; regenerate assets on demand.

## What's Implemented vs. Planned

| Status | Capability |
|--------|-----------|
| Done | Core pixel grid, palette, primitives, dither, seeded RNG, PNG export |
| Done | Icon pipeline: templates, material shading, quality glow, CLI batch generation |
| Done | 3 weapon templates (longsword, axe, dagger) |
| Planned | Texture generation (simplex noise, tileable patterns) |
| Planned | UI chrome (9-slice borders, buttons, progress bars) |
| Planned | Expanded icon library (60+ templates: armor, consumables, abilities, currency, professions) |
| Planned | Sprite compositor (race/gender body templates + equipment overlays) |
| Planned | Elemental overlays (fire, ice, shadow, holy, nature) |
| Planned | JSON-driven batch manifest system |

## Output Specs

- **Size:** 48×48 default (configurable)
- **Format:** PNG, transparent background
- **Color depth:** 8-bit RGBA
- **Anti-aliasing:** None — pure pixel art with hard edges
