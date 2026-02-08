---
name: idle-mmo-art-generator
description: Generates pixel art game assets (icons, textures, UI chrome, sprites) for the Idle MMORPG project using the art engine CLI tool. Use when creating game art assets, generating icon batches, producing UI textures, or compositing character sprites. Can also use Claude image generation for concept art and references.
---

# Idle MMORPG Art Asset Generator

Generate pixel art game assets for the Idle MMORPG project using the `tools/art-engine/` CLI tool and Claude's image generation capabilities.

## When to Use This Skill

- Generating icon sets for items, abilities, buffs, currencies, professions
- Producing tileable material textures (parchment, leather, stone, metal)
- Creating UI chrome elements (borders, buttons, progress bars)
- Compositing character or enemy sprites from template parts
- Creating concept art or reference images for assets that can't be algorithmically generated
- Building batch manifests for large asset generation runs

## Art Style Reference

All generated assets must conform to `docs/ui/specs/art-style-guide.md`. Key constraints:

- **Pixel art, no anti-aliasing.** Hard pixel edges, `image-rendering: pixelated`.
- **Limited palettes.** Item icons: 32-48 colors. UI icons: 16-24 colors.
- **Dithered shading.** Gradients via pixel dithering patterns, not smooth blends.
- **2000s MMORPG aesthetic.** WoW Classic / EQ2 era — ornate, dense, dark backgrounds.
- **Quality tier colors:** Common (#9D9D9D), Uncommon (#1EFF00), Rare (#0070DD), Epic (#A335EE), Legendary (#FF8000).

## Art Engine CLI Reference

The art engine lives at `tools/art-engine/` and is invoked via `pnpm art`.

### Icon Generation

```bash
pnpm art icons [options]
```

| Option | Type | Description |
|---|---|---|
| `--category` | string | `weapon`, `armor`, `consumable`, `ability`, `currency`, `profession` |
| `--type` | string | Specific type within category (e.g., `longsword`, `helmet`, `health-potion`) |
| `--quality` | string | `common`, `uncommon`, `rare`, `epic`, `legendary` |
| `--element` | string | Optional: `fire`, `ice`, `shadow`, `holy`, `nature` |
| `--seed` | number | Seed for reproducible output |
| `--seeds` | range | Seed range for batch (e.g., `100-109`) |
| `--size` | string | `48` (default), `64`, or `40` (abilities) |
| `--output` | path | Output directory |

**Examples:**
```bash
# 10 epic swords
pnpm art icons --category=weapon --type=longsword --quality=epic --seeds=100-109

# Fire-enchanted rare staff
pnpm art icons --category=weapon --type=staff --quality=rare --element=fire --seed=42

# All quality tiers for a mace
pnpm art icons --category=weapon --type=mace --quality=common,uncommon,rare,epic,legendary --seed=50
```

### Texture Generation

```bash
pnpm art texture [options]
```

| Option | Type | Description |
|---|---|---|
| `--material` | string | `parchment`, `leather`, `stone`, `metal`, `wood`, `crystal`, `cloth`, `bone` |
| `--size` | number | Texture size in pixels (default: 256) |
| `--tileable` | flag | Generate seamless tileable texture |
| `--seed` | number | Seed for reproducible output |
| `--output` | path | Output directory |

### UI Chrome Generation

```bash
pnpm art ui-chrome [options]
```

| Option | Type | Description |
|---|---|---|
| `--theme` | string | `bronze`, `iron`, `gold`, `crystal`, `shadow` |
| `--component` | string | `border`, `button`, `bar`, `all` |
| `--seed` | number | Seed |
| `--output` | path | Output directory |

### Sprite Composition

```bash
pnpm art sprite [options]
```

| Option | Type | Description |
|---|---|---|
| `--race` | string | Character race |
| `--gender` | string | `male`, `female` |
| `--chest` | string | Chest equipment template ID |
| `--legs` | string | Leg equipment template ID |
| `--head` | string | Head equipment template ID |
| ... | | Other gear slots |
| `--skin-tone` | number | Skin tone palette index |
| `--hair-style` | number | Hair style index |
| `--hair-color` | number | Hair color palette index |
| `--seed` | number | Seed |

### Batch Generation

```bash
pnpm art batch --manifest=<path-to-manifest.json>
```

Manifest format:
```json
{
  "name": "Phase 1 Item Icons",
  "outputDir": "src/renderer/assets/icons/items/",
  "assets": [
    {
      "id": "sword-common-001",
      "command": "icons",
      "params": {
        "category": "weapon",
        "type": "longsword",
        "quality": "common",
        "seed": 100
      }
    }
  ]
}
```

### Utility Commands

```bash
# Preview all material palettes
pnpm art palette --type=materials --preview

# List available icon templates
pnpm art template --list --category=weapon

# Preview a specific template silhouette
pnpm art template --preview --name=longsword
```

## Workflow

### 1. Determine Asset Needs

Before generating, understand what's needed:
- Check the design spec or UI wireframe for asset requirements
- Identify asset type, size, quality tier, and any thematic requirements (zone, element)
- Check if existing generated assets can be reused (same seed = same output)

### 2. Generate Assets

For small batches (1-5 assets), use direct CLI commands.
For larger batches (6+), create a manifest file and use `pnpm art batch`.

### 3. Review Output

Generated assets land in the specified `--output` directory or `tools/art-engine/output/` by default. Review them visually:
- Do they match the intended category/type?
- Is the quality tier treatment correct (border colors, glow levels)?
- Do they read clearly at display size?

If not satisfied, adjust parameters (different seed, material override, element) and regenerate.

### 4. Deploy to Game

Move approved assets to their final location in `src/renderer/assets/`:
- Icons → `src/renderer/assets/icons/{category}/`
- Textures → `src/renderer/assets/ui/textures/`
- UI Chrome → `src/renderer/assets/ui/chrome/`
- Sprites → `src/renderer/assets/sprites/`

### 5. Record Seeds

Document the seeds and parameters used for each asset in the batch manifest. Store manifests in `tools/art-engine/manifests/` for reproducibility.

## When to Use Claude Image Generation Instead

The art engine handles algorithmic/template-based assets. For these cases, use Claude's native image generation:

- **Concept art:** Exploring visual ideas before committing to engine parameters
- **Boss splash art:** Unique, complex compositions that exceed template capabilities
- **Reference images:** "Show me what a Stoneguard Blademaster should look like" before building sprite templates
- **Marketing/promotional art:** Assets that need more artistic flair than algorithmic output provides
- **Edge cases:** Any asset that doesn't fit existing templates and would take longer to template than to hand-create

## Integration Notes

- **@idle-mmo-ui-designer** specifies assets in design docs; this skill produces them
- **@idle-mmo-frontend-dev** consumes generated PNGs from `src/renderer/assets/`
- **@idle-mmo-gdev** defines data that drives asset selection (item types, quality tiers, zones)
- Generated assets use `image-rendering: pixelated` in CSS — no smoothing
