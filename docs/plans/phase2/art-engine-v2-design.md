# Art Engine V2 — Python Rebuild Design

**Status:** Design (pending approval)
**Replaces:** `tools/art-engine/` (TypeScript, Phase A only)
**Location:** `tools/art-engine-v2/`
**Purpose:** Generate all visual assets for the Idle MMORPG from AI-drafted base templates + procedural generation

---

## 1. Why Rebuild

The current TypeScript engine can produce 48x48 weapon icons with flat material shading. The game requires:

- 256x512 character sprites with 3-4 tone volumetric shading (64-128 colors)
- Full UI compositions: tooltips, character sheets, talent trees, spell books
- Ornate 9-slice panel frames, atmospheric noise-based backgrounds
- Bitmap text rendering with exact color-coded stat blocks
- Layer compositing (body + 10 equipment overlay layers)
- ~3,500 total assets from ~200 AI-drafted base templates

Node canvas lacks numpy-style array operations, fast noise generation, and robust text rendering. Python with Pillow + NumPy is the standard stack for this work.

## 2. Pipeline Overview

```
AI Drafting (one-time, ~200 images)
  → art ingest: background removal, palette quantization, dither normalization, region detection
    → Cleaned templates in data/templates/

art generate: material × quality × seed variant production
  → Icons, sprite overlays, armor pieces, boss tints

art compose: full UI composition from structured data
  → Tooltips, stat panels, talent backgrounds, character screens
```

**Core principle preserved:** Commit seeds + manifests, not PNGs. Same input = identical output.

## 3. Tech Stack

| Need | Library | License |
|------|---------|---------|
| Image manipulation | Pillow (PIL) | MIT |
| Fast array math | NumPy | BSD |
| Tileable noise | opensimplex | MIT |
| CLI framework | click | BSD |
| Seeded RNG | Python stdlib random | — |
| Bitmap fonts | Pillow ImageFont (.ttf) | — |

No native compilation required. `pip install pillow numpy opensimplex click`.

## 4. Project Structure

```
tools/art-engine-v2/
├── pyproject.toml
├── src/
│   ├── core/
│   │   ├── palette.py          # Color ramps, quantization, nearest-match
│   │   ├── dither.py           # Bayer ordered dithering (2x2, 4x4, 8x8)
│   │   ├── noise.py            # Simplex tileable noise wrappers
│   │   ├── seed.py             # Seeded RNG wrapper (Python random)
│   │   ├── primitives.py       # Bresenham lines, rects, ellipses, flood fill
│   │   └── compositor.py       # Layer alpha compositing, blending modes
│   ├── ingest/
│   │   ├── template_processor.py  # AI draft → cleaned template
│   │   ├── region_extractor.py    # Auto-detect material regions by color clustering
│   │   └── background_remover.py  # Dark bg → transparent alpha
│   ├── generators/
│   │   ├── icons.py            # Icon variant generation
│   │   ├── sprites.py          # Body + equipment overlay composition
│   │   ├── ui_chrome.py        # 9-slice frames, buttons, progress bars
│   │   ├── backgrounds.py      # Noise-based zone backgrounds, panel textures
│   │   └── tooltips.py         # Tooltip rendering from structured item data
│   ├── layout/
│   │   ├── engine.py           # JSON layout → composed screen
│   │   ├── text.py             # Bitmap font rendering, stat blocks, color coding
│   │   └── schemas.py          # Layout definition types
│   ├── palettes/
│   │   └── game_palettes.py    # Quality tiers, material ramps, zone palettes
│   ├── cli/
│   │   ├── __main__.py         # Entry point
│   │   ├── ingest.py           # `art ingest` command
│   │   ├── generate.py         # `art generate` command
│   │   └── compose.py          # `art compose` command
│   └── data/
│       ├── fonts/              # Cinzel, Inter, JetBrains Mono .ttf
│       ├── templates/          # Processed AI drafts
│       └── manifests/          # JSON batch generation recipes
├── drafts/                     # Raw AI input images
├── output/                     # Generated assets (gitignored)
└── tests/
```

## 5. CLI Commands

### `art ingest` — Process AI Drafts

```bash
art ingest --input drafts/weapon_staff_fire.png \
           --type weapon --name staff_fire \
           --palette iron,crystal --regions auto

art ingest --input-dir drafts/armor_overlays/ \
           --type armor_overlay --palette auto
```

Steps: load PNG → remove dark background → quantize to game palette (128 colors max) → apply Bayer dithering → auto-detect material regions by color clustering → save template + region map JSON.

### `art generate` — Produce Variants

```bash
art generate icons --template staff_fire \
                   --materials iron,gold,crystal \
                   --qualities common,rare,epic,legendary \
                   --seeds 100-109

art generate sprite --body human_male \
                    --helm crown_gold --chest plate_iron \
                    --weapon staff_fire --quality epic --seed 42

art generate --manifest manifests/all_weapons.json
```

### `art compose` — Render Compositions

```bash
art compose tooltip --item-data data/items/staff_of_starfire.json
art compose background --zone mistmoors --size 400x800 --seed 42
art compose screen --layout layouts/character_screen.json
```

## 6. Manifest Format

Manifests are the deterministic recipes stored in git:

```json
{
  "type": "icons",
  "template": "staff_fire",
  "materials": ["iron", "gold", "crystal", "bone"],
  "qualities": ["common", "uncommon", "rare", "epic", "legendary"],
  "seeds": [100, 101, 102],
  "output_size": [48, 48],
  "output_dir": "output/icons/weapons/"
}
```

Output naming: `{type}-{template}-{material}-{quality}-{seed:03d}.png`

## 7. Key System Designs

### 7.1 Ingest: Region Extraction

After palette quantization, each template pixel maps to a game palette color. K-means clustering on spatial + color features groups pixels into material regions:

1. Convert template to palette-constrained image
2. For each pixel, create feature vector: (x_norm, y_norm, r, g, b)
3. K-means cluster with k=number_of_expected_regions (from CLI or auto-detect)
4. Map each cluster to nearest material type by dominant color
5. Export region map as JSON: `{ "iron": [[x,y], ...], "leather": [[x,y], ...] }`

### 7.2 Material Palette Swapping

Given a template with detected regions and a target material:

1. Load source material ramp (e.g., iron: 7 colors light→dark)
2. Load target material ramp (e.g., gold: 7 colors light→dark)
3. For each pixel in the region, find its index in the source ramp
4. Replace with the same index in the target ramp
5. Apply seed-based dither jitter (±0.5 index shift)

### 7.3 Quality Tier Glow

Same algorithm as current TS engine, ported to NumPy for speed:

1. Detect edge pixels (solid pixels adjacent to alpha=0)
2. For each edge pixel, radiate outward to glow_radius
3. Glow alpha = glow_intensity × (1 - distance / (radius + 1))
4. Blend glow_color at calculated alpha onto transparent pixels

### 7.4 Tooltip Renderer

Replicates the layout from reference drafts with real text:

```
Input: item_data JSON (name, quality, slot, stats, effects, flavor, icon_template)
Output: tooltip PNG (320px wide, dynamic height)

Steps:
1. Calculate content height from text metrics
2. Draw panel background (#1A1A1F)
3. Draw ornate frame (9-slice)
4. Render item name in quality color (Cinzel, --text-lg)
5. Render slot type, bind type (Inter, --text-sm, secondary color)
6. Draw separator (#3D3529)
7. Render primary stats in green (#1EFF00)
8. Render secondary stats in white
9. Render effects (gold header + white body)
10. Render flavor text (italic, secondary color)
11. Composite 64x64 item icon in top-right
12. Apply quality glow around icon
```

Color values sourced from art-style-guide.md section 3 and section 7.

### 7.5 Sprite Compositor

Layer order (from art-style-guide.md section 2.2):

```
1. Base body (race + gender)         256x512
2. Pants / Leg armor                 overlay
3. Boots                             overlay
4. Chest armor                       overlay
5. Belt / Waist                      overlay
6. Shoulder armor                    overlay
7. Gloves / Bracers                  overlay
8. Helm (toggleable)                 overlay
9. Weapon (main hand, off hand)      overlay
10. Back / Cloak                     overlay
```

Each overlay alpha-composites onto the accumulating image. Final pass: palette quantize to 128 colors, add floor shadow ellipse.

### 7.6 Background Generator

Zone-themed atmospheric backgrounds using layered noise:

1. Generate large-scale simplex noise (zone primary color)
2. Generate small-scale detail noise (zone secondary color)
3. Blend with zone-specific weights
4. Apply Bayer 8x8 dithering
5. Quantize to 6-color zone palette
6. Optional vignette darkening at edges

Zone palettes from art-style-guide.md section 3.5.

## 8. Asset Count Estimates

| Category | AI Drafts | Python Output | Ratio |
|----------|-----------|---------------|-------|
| Base bodies | ~6 | 6 templates | 1:1 |
| Armor overlays | ~80 | ~2,000 variants | 1:25 |
| Weapon overlays | ~20 | ~500 variants | 1:25 |
| Icon silhouettes | ~30 | ~750 icons | 1:25 |
| Ability icons | ~40 | ~200 icons | 1:5 |
| Boss portraits | ~14 | ~14 framed | 1:1 |
| UI frame sets | ~2 | unlimited sizes | — |
| Panel textures | 0 | ~6 | procedural |
| Tooltips | 0 | ~230 | from data |
| Backgrounds | 0 | ~12 | procedural |
| Currency/buff icons | ~10 | ~30 | 1:3 |
| **Total** | **~200** | **~3,500+** | **~17:1** |

## 9. Implementation Phases

| Phase | Scope | Depends On |
|-------|-------|------------|
| **V2-A: Core + Ingest + Icons** | Palette, dither, seed, primitives. Ingest pipeline (bg removal, quantize, region extract). Icon variant generator (material × quality × seed). CLI: `art ingest`, `art generate icons`. | Nothing |
| **V2-B: UI Chrome + Text + Tooltips** | 9-slice frame renderer. Bitmap font text system (Cinzel, Inter, JetBrains Mono). Tooltip renderer from item JSON. Panel texture generator (noise-based). CLI: `art compose tooltip`. | V2-A |
| **V2-C: Sprite Compositor** | Body + overlay layer system. Equipment anchor grid. Material swap on overlays. Quality glow on equipped pieces. CLI: `art generate sprite`. | V2-A |
| **V2-D: Layout Engine + Backgrounds** | JSON screen layout definitions. Noise zone backgrounds. Full composition: character sheets, talent trees, spell books. CLI: `art compose screen`, `art compose background`. | V2-B, V2-C |
| **V2-E: Manifest Pipeline** | JSON batch manifests. `art generate --manifest all.json` produces every asset. CI integration. | V2-A through V2-D |

## 10. AI Draft Requirements

For consistent pipeline processing, all AI-drafted images must follow:

1. **Transparent or solid dark (#1A1A1F) background** — enables clean extraction
2. **Pixel art style** — no anti-aliasing, no smooth gradients, hard pixel edges
3. **Target resolution** — bodies at 256x512, icons at 48x48 or 64x64, overlays matching body canvas
4. **Front-facing orthographic** — no perspective, no 3/4 angle (for sprites)
5. **Isolated subjects** — one item/piece per image, no composited scenes
6. **Consistent lighting** — top-left light source (315 degrees)
7. **Material clarity** — metal should read as metal, cloth as cloth, each region visually distinct

## 11. Integration with Game Project

The art engine remains a standalone tool. Integration points:

- **pnpm script:** `"art:v2": "cd tools/art-engine-v2 && python -m src.cli"` in root package.json
- **Output directory:** `tools/art-engine-v2/output/` (gitignored)
- **Asset copy:** Manual or scripted copy from output to `src/renderer/assets/`
- **Manifest commit:** `tools/art-engine-v2/src/data/manifests/*.json` committed to git
- **Template commit:** `tools/art-engine-v2/src/data/templates/` committed to git (processed, not raw drafts)

## 12. Migration from V1

The existing TypeScript engine (`tools/art-engine/`) is preserved during V2 development. Once V2-A is complete and produces equivalent or better icon output, V1 is archived. Concepts ported from V1:

- Seeded RNG (xorshift128+ → Python random with seed)
- Material palette ramps (8 materials, 7 colors each)
- Quality tier glow (5 tiers with radius/intensity)
- Game palettes (quality, material, zone color definitions)
- Bayer matrix dithering (2x2, 4x4, 8x8)
- Deterministic output principle (seeds + params → identical PNG)

## 13. Feasibility Assessment

**Can a self-built Python tool produce assets matching the 20 reference samples?**

| Asset Type | Feasibility | Notes |
|------------|-------------|-------|
| Item icons (48x48) | **Yes** | Current engine already does this; Python version will be better |
| Tooltips / stat panels | **Yes** | Text rendering + layout is Python's strength |
| UI chrome / frames | **Yes** | 9-slice from hand/AI-drafted corner sprites |
| Talent tree backgrounds | **Yes** | Noise generation + palette quantization |
| Panel textures | **Yes** | Tileable noise patterns |
| Armor/weapon overlays | **Yes, from AI bases** | Python handles variants; AI provides artistic base |
| Character sprites | **Yes, from AI bases** | Layer compositing from AI-drafted body + equipment |
| Boss portraits | **Partially** | AI drafts unique art; Python adds framing/tinting |
| Full screen compositions | **Yes** | Layout engine assembles from rendered components |

**Overall verdict: Yes — with the AI-draft → Python-process pipeline, we can produce all required assets at the quality level shown in the reference samples.**
