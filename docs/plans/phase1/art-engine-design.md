# Art Asset Pipeline — Design Document

**Date:** February 8, 2026
**Status:** Approved Design
**Scope:** Development utility for generating pixel art game assets
**Branch (when implemented):** `tools/art-engine`

---

## 1. Purpose

A TypeScript-based pixel art generation engine that produces game-spec assets (icons, textures, UI chrome, character sprites) programmatically. This is a **development tool**, not shipped game code. It accelerates asset production by generating pixel-perfect output that matches the project's art style guide.

### Why Algorithmic Generation Works Here

The Idle MMORPG uses pixel art at small resolutions:
- Item icons: 48x48 (2,304 pixels)
- Ability icons: 40x40 (1,600 pixels)
- Buff icons: 24x24 (576 pixels)

At these scales, "art" is a data problem: which of N pixels get which of M colors, following specific rules (material shading, dithering patterns, palette constraints). Algorithms can solve this reliably and reproducibly.

### What It Produces

| Asset Type | Size | Generation Method |
|---|---|---|
| Item icons | 48x48, 64x64 | Silhouette template + material shader + quality tier effects |
| Ability icons | 40x40 | Effect templates (fire, ice, shadow, holy) + intensity parameters |
| Buff/debuff icons | 24x24 | Symbolic shapes + color coding |
| Currency icons | 16x16 | Iconic shape templates |
| UI textures | 256x256 tileable | Noise-based material generation |
| UI chrome | 9-slice | Border patterns + decorative element rules |
| Buttons | variable | Material base + state variants |
| Progress bars | variable | Template + theme coloring |
| Character sprites | 256x512 | Layered composition (base body + equipment overlays) |
| Enemy sprites | variable | Body type + accessories + colorization |

---

## 2. Architecture

### 2.1 Project Location

```
tools/art-engine/          # Standalone package, not part of game src/
├── src/
│   ├── core/              # Foundational pixel manipulation
│   ├── textures/          # Procedural texture generation
│   ├── icons/             # Icon generation system
│   ├── ui-chrome/         # UI element generation
│   ├── sprites/           # Character/enemy sprite composition
│   ├── palettes/          # Color palette definitions
│   └── cli/               # Command-line interface
├── data/
│   ├── palettes/          # Palette data files
│   └── templates/         # Silhouette template data
├── output/                # Generated assets (gitignored)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### 2.2 Dependencies

| Package | Purpose |
|---|---|
| `canvas` | Node.js Canvas API for pixel manipulation and PNG export |
| `commander` | CLI argument parsing |
| `typescript` | Language |
| `vitest` | Testing |

Minimal dependency footprint. The `canvas` package provides the full HTML5 Canvas API in Node.js, including `ImageData` for pixel-level access.

### 2.3 Design Principles

1. **Seeded RNG everywhere.** Same seed = same output. Commit seeds and parameters, not PNGs. This gives version control over generated assets.
2. **Palette-first.** Every generation starts by selecting a palette. The art style guide defines master palettes; the engine enforces them.
3. **Template + parameters.** Templates define shapes, parameters define colors/materials/quality. Combinatorial variety from a small template library.
4. **No anti-aliasing.** All output uses hard pixel boundaries. CSS `image-rendering: pixelated` on the game side. This matches the art style guide's pixel art requirements.
5. **Composable pipeline.** Each module's output can feed into the next. A texture can be used as fill for an icon template. An icon can be embedded in a UI chrome element.

---

## 3. Module Design

### 3.1 Core Module (`src/core/`)

The foundation everything else builds on.

#### `pixel-grid.ts`
Wraps Canvas `ImageData` with a clean API:

```typescript
interface PixelGrid {
  width: number;
  height: number;
  setPixel(x: number, y: number, color: RGBA): void;
  getPixel(x: number, y: number): RGBA;
  fill(color: RGBA): void;
  clear(): void;
  clone(): PixelGrid;
  toImageData(): ImageData;
  toPNG(): Buffer;
}

interface RGBA {
  r: number; // 0-255
  g: number;
  b: number;
  a: number;
}
```

#### `palette.ts`
Palette management with art-style-guide-compliant color sets:

```typescript
interface Palette {
  name: string;
  colors: RGBA[];
  // Given any color, find the nearest palette color
  nearest(color: RGBA): RGBA;
  // Color ramps for shading (light → dark for a given hue)
  ramp(baseColor: RGBA, steps: number): RGBA[];
}

// Pre-defined palettes from art style guide
const GAME_PALETTE: Palette;           // Master 256-color game palette
const ZONE_PALETTES: Record<Zone, Palette>;
const MATERIAL_PALETTES: Record<Material, Palette>;
const QUALITY_PALETTES: Record<QualityTier, Palette>;
```

#### `dither.ts`
Pixel art dithering algorithms:

```typescript
// Ordered dithering (Bayer matrix) — clean, predictable patterns
function orderedDither(grid: PixelGrid, palette: Palette, matrixSize: 2 | 4 | 8): PixelGrid;

// Pattern dithering — checkerboard, diagonal, custom patterns
function patternDither(grid: PixelGrid, palette: Palette, pattern: DitherPattern): PixelGrid;

// Constrain existing image to palette (nearest-color quantization)
function quantize(grid: PixelGrid, palette: Palette): PixelGrid;
```

#### `primitives.ts`
Pixel-level shape drawing (Bresenham's line, midpoint ellipse, polygon fill):

```typescript
function drawLine(grid: PixelGrid, x0: number, y0: number, x1: number, y1: number, color: RGBA): void;
function drawRect(grid: PixelGrid, x: number, y: number, w: number, h: number, color: RGBA, filled?: boolean): void;
function drawEllipse(grid: PixelGrid, cx: number, cy: number, rx: number, ry: number, color: RGBA, filled?: boolean): void;
function drawPolygon(grid: PixelGrid, points: [number, number][], color: RGBA, filled?: boolean): void;
function floodFill(grid: PixelGrid, x: number, y: number, color: RGBA): void;
```

#### `seed.ts`
Seeded pseudo-random number generator (xorshift128+ or similar):

```typescript
interface SeededRNG {
  next(): number;           // 0-1 float
  nextInt(min: number, max: number): number;
  nextBool(probability?: number): boolean;
  pick<T>(array: T[]): T;
  shuffle<T>(array: T[]): T[];
}

function createRNG(seed: number): SeededRNG;
```

#### `export.ts`
Output utilities:

```typescript
function exportPNG(grid: PixelGrid, path: string): Promise<void>;
function exportSpriteSheet(grids: PixelGrid[], columns: number, path: string): Promise<void>;
function exportWithMetadata(grid: PixelGrid, metadata: AssetMetadata, path: string): Promise<void>;
```

### 3.2 Texture Module (`src/textures/`)

#### `noise.ts`
Noise functions for organic texture generation:

```typescript
// Simplex noise (better than Perlin for pixel art — fewer directional artifacts)
function simplex2D(x: number, y: number, seed: number): number; // -1 to 1
function fractalNoise(x: number, y: number, octaves: number, seed: number): number;
function turbulence(x: number, y: number, octaves: number, seed: number): number;
```

#### `materials.ts`
Material-specific texture generators:

```typescript
interface MaterialConfig {
  palette: Palette;
  noiseScale: number;
  noiseOctaves: number;
  ditherPattern: DitherPattern;
  grain: number;        // 0-1, surface roughness
  specular: number;     // 0-1, reflectivity (metal = high, cloth = low)
}

// Pre-configured materials from art style guide
const MATERIALS: Record<MaterialType, MaterialConfig> = {
  parchment: { /* warm ivory, low noise, fine grain, no specular */ },
  leather:   { /* warm brown, medium noise, medium grain, low specular */ },
  stone:     { /* cool gray, high noise, coarse grain, low specular */ },
  metal:     { /* blue-gray, low noise, fine grain, high specular */ },
  wood:      { /* warm brown, directional noise (grain lines), medium grain */ },
  crystal:   { /* saturated hue, geometric noise, high specular, inner glow */ },
  cloth:     { /* matte, woven pattern noise, soft transitions */ },
  bone:      { /* off-white, porous noise, low specular */ },
};

function generateTexture(width: number, height: number, material: MaterialType, seed: number): PixelGrid;
```

#### `tileable.ts`
Seamless tiling logic (mirrors noise coordinates at edges):

```typescript
function generateTileableTexture(size: number, material: MaterialType, seed: number): PixelGrid;
function verifyTileable(grid: PixelGrid): boolean; // sanity check
```

### 3.3 Icon Module (`src/icons/`)

The most immediately useful module. Generates game-spec icons from templates + parameters.

#### Template System (`templates/`)

Each icon category has silhouette templates — binary masks defining which pixels are "inside" the shape:

```typescript
interface IconTemplate {
  name: string;               // e.g., "longsword", "roundshield", "health-potion"
  category: IconCategory;     // weapon, armor, consumable, ability, currency, profession
  size: { width: number; height: number };
  silhouette: boolean[][];    // true = inside shape, false = outside
  regions: ShapeRegion[];     // named sub-regions for material variation
  lightingAngle: number;      // degrees, default 315 (top-left)
}

interface ShapeRegion {
  name: string;               // e.g., "blade", "hilt", "guard", "pommel"
  pixels: [number, number][]; // which pixels belong to this region
  material: MaterialType;     // default material for this region
  depth: number;              // 0-1, for lighting calculation (raised vs recessed)
}
```

Templates are stored as JSON data in `data/templates/`. Example for a sword:
- **blade** region: metal material, raised depth
- **hilt** region: leather material, neutral depth
- **guard** region: metal material, raised depth
- **pommel** region: metal or gem material, raised depth

#### `shading.ts`
Material-aware shading that produces the pixel art look:

```typescript
interface ShadingParams {
  material: MaterialType;
  palette: Palette;
  lightDirection: number;     // angle in degrees
  ambientLight: number;       // 0-1
  ditherStrength: number;     // 0-1, how much dithering vs flat shading
}

// Apply shading to a region of an icon
function shadeRegion(
  grid: PixelGrid,
  region: ShapeRegion,
  params: ShadingParams,
  rng: SeededRNG
): void;
```

The shading algorithm:
1. Calculate light intensity per pixel based on depth map and light direction
2. Select color from palette ramp based on intensity
3. Apply material-specific dithering pattern
4. Add specular highlights for metallic materials
5. Add surface detail noise for organic materials

#### `effects.ts`
Post-processing effects applied after base shading:

```typescript
// Glow effect around icon edges (for quality tiers)
function applyGlow(grid: PixelGrid, color: RGBA, intensity: number, radius: number): void;

// Enchantment rune overlay
function applyRunes(grid: PixelGrid, runeStyle: RuneStyle, color: RGBA, rng: SeededRNG): void;

// Battle damage (scratches, chips)
function applyWear(grid: PixelGrid, intensity: number, rng: SeededRNG): void;

// Elemental effect overlay (fire wisps, frost crystals, shadow tendrils)
function applyElement(grid: PixelGrid, element: ElementType, intensity: number, rng: SeededRNG): void;
```

#### `quality-tier.ts`
Quality tier visual treatment:

```typescript
interface QualityConfig {
  borderColor: RGBA;
  glowColor: RGBA;
  glowIntensity: number;
  materialUpgrade: boolean;     // epic+ use finer materials
  runeOverlay: boolean;         // rare+ get rune details
  enchantmentGlow: boolean;     // epic+ get inner glow
}

const QUALITY_CONFIGS: Record<QualityTier, QualityConfig> = {
  common:    { borderColor: '#9D9D9D', glowIntensity: 0,   runeOverlay: false, enchantmentGlow: false },
  uncommon:  { borderColor: '#1EFF00', glowIntensity: 0.2, runeOverlay: false, enchantmentGlow: false },
  rare:      { borderColor: '#0070DD', glowIntensity: 0.4, runeOverlay: true,  enchantmentGlow: false },
  epic:      { borderColor: '#A335EE', glowIntensity: 0.6, runeOverlay: true,  enchantmentGlow: true  },
  legendary: { borderColor: '#FF8000', glowIntensity: 0.9, runeOverlay: true,  enchantmentGlow: true  },
};

function applyQualityTier(grid: PixelGrid, quality: QualityTier, rng: SeededRNG): void;
```

#### Full Icon Generation Pipeline

```typescript
function generateIcon(params: IconGenerationParams): PixelGrid {
  // 1. Load silhouette template
  const template = loadTemplate(params.category, params.type);

  // 2. Create pixel grid at target size
  const grid = createPixelGrid(template.size.width, template.size.height);

  // 3. Create seeded RNG
  const rng = createRNG(params.seed);

  // 4. Shade each region with appropriate material
  for (const region of template.regions) {
    const material = params.materialOverrides?.[region.name] ?? region.material;
    const palette = getMaterialPalette(material, params.colorScheme);
    shadeRegion(grid, region, { material, palette, ... }, rng);
  }

  // 5. Apply quality tier effects
  applyQualityTier(grid, params.quality, rng);

  // 6. Apply optional effects (element, wear, enchantment)
  if (params.element) applyElement(grid, params.element, params.elementIntensity, rng);
  if (params.wear > 0) applyWear(grid, params.wear, rng);

  // 7. Draw outline (2px for 48x48, 1px for 24x24)
  drawOutline(grid, params.outlineWidth ?? 2);

  return grid;
}
```

### 3.4 UI Chrome Module (`src/ui-chrome/`)

#### `borders.ts`
9-slice ornate border generation:

```typescript
interface BorderConfig {
  theme: UITheme;           // 'bronze', 'iron', 'gold', 'crystal'
  cornerSize: number;       // pixel size of corner decorations
  edgePattern: EdgePattern;  // repeating pattern for edges
  innerBevel: number;       // inner shadow depth
}

// Generate a 9-slice border set
function generateBorder(config: BorderConfig, seed: number): NineSliceSet;

interface NineSliceSet {
  topLeft: PixelGrid;
  top: PixelGrid;       // tileable
  topRight: PixelGrid;
  left: PixelGrid;      // tileable
  center: PixelGrid;    // tileable (background)
  right: PixelGrid;     // tileable
  bottomLeft: PixelGrid;
  bottom: PixelGrid;    // tileable
  bottomRight: PixelGrid;
}
```

#### `buttons.ts`
Fantasy-themed button generation:

```typescript
interface ButtonConfig {
  width: number;
  height: number;
  theme: UITheme;
  material: MaterialType;  // 'stone', 'wood', 'metal'
}

interface ButtonStateSet {
  normal: PixelGrid;
  hover: PixelGrid;
  pressed: PixelGrid;
  disabled: PixelGrid;
}

function generateButton(config: ButtonConfig, seed: number): ButtonStateSet;
```

#### `bars.ts`
Progress/health/XP bar generation:

```typescript
interface BarConfig {
  width: number;
  height: number;
  fillColor: RGBA;
  backgroundColor: RGBA;
  borderTheme: UITheme;
  shimmer: boolean;      // animated shimmer effect (generates multiple frames)
}

function generateBar(config: BarConfig, seed: number): PixelGrid;
function generateBarFrames(config: BarConfig, frameCount: number, seed: number): PixelGrid[]; // for shimmer animation
```

### 3.5 Sprite Compositor (`src/sprites/`)

The most ambitious module. Builds character and enemy sprites by layering parts.

#### Approach: Template Composition, Not Generation

Character sprites at 256x512 are too complex for pure algorithmic generation. Instead:
1. **Base body templates** are pre-authored pixel art (8 races x 2 genders = 16 bases)
2. **Equipment overlays** are also pre-authored per gear slot and armor type
3. The engine **composites** them: selecting the right base + overlaying equipment pieces + applying colorization

This means the sprite compositor needs a library of authored parts, but the combination logic is algorithmic:

```typescript
interface SpriteComposition {
  race: Race;
  gender: Gender;
  equipment: Partial<Record<GearSlot, EquipmentPiece>>;
  skinTone: number;        // index into race skin tone palette
  hairStyle: number;       // index into available styles
  hairColor: number;       // index into hair color palette
}

interface EquipmentPiece {
  template: string;        // e.g., "plate-chest-t1"
  colorScheme: string;     // e.g., "iron", "gold", "shadow"
  quality: QualityTier;    // affects glow/enchantment overlay
}

function compositeCharacter(composition: SpriteComposition): PixelGrid;
```

The compositor:
1. Loads the base body for the specified race/gender
2. Applies skin tone colorization
3. Applies hair style and color
4. Layers equipment pieces in draw order (boots → legs → chest → hands → head → weapon)
5. Applies quality effects (glow on epic+ gear)
6. Applies final outline pass

#### Enemy/Monster Sprites

Enemies use a similar composition approach but with different base bodies (skeleton, wolf, dragon, etc.) and accessory overlays (armor pieces, weapons, elemental effects):

```typescript
interface EnemyComposition {
  bodyType: EnemyBodyType;     // 'humanoid', 'beast', 'undead', 'elemental', 'dragon'
  bodyVariant: number;         // variations within body type
  colorScheme: string;         // zone-appropriate palette
  accessories: string[];       // armor pieces, weapons, magical effects
  size: EnemySize;             // 'normal', 'elite', 'boss'
  nameplate: NameplateStyle;   // 'normal' (tan), 'elite' (silver), 'boss' (gold)
}
```

### 3.6 Palette Definitions (`src/palettes/`)

All palettes derive from the art style guide. Stored as TypeScript constants:

```typescript
// Master game palette — union of all sub-palettes, max 256 colors
export const GAME_PALETTE: Palette;

// Item quality colors
export const QUALITY_COLORS = {
  common:    { primary: '#9D9D9D', glow: '#9D9D9D' },
  uncommon:  { primary: '#1EFF00', glow: '#1EFF00' },
  rare:      { primary: '#0070DD', glow: '#4A9FFF' },
  epic:      { primary: '#A335EE', glow: '#C77DFF' },
  legendary: { primary: '#FF8000', glow: '#FFB347' },
} as const;

// Zone signature palettes
export const ZONE_PALETTES = {
  startingRegions:       createPalette(['#7CB342', '#FDD835', '#87CEEB', ...]),
  wildwood:              createPalette(['#2E7D32', '#5D4037', '#8D6E63', ...]),
  mistmoors:             createPalette(['#5C6BC0', '#7E57C2', '#455A64', ...]),
  skyreach:              createPalette(['#42A5F5', '#ECEFF1', '#607D8B', ...]),
  blightedWastes:        createPalette(['#9CCC65', '#8E24AA', '#3E2723', ...]),
  ascendantTerritories:  createPalette(['#FFD54F', '#9C27B0', '#F5F5F5', ...]),
} as const;

// Material color ramps (light → mid → dark for each material)
export const MATERIAL_RAMPS = {
  iron:    ['#C0C0C0', '#708090', '#2F4F4F'],
  gold:    ['#FFFACD', '#FFD700', '#B8860B'],
  leather: ['#D2691E', '#8B4513', '#654321'],
  cloth:   ['#FFF8DC', '#F5DEB3', '#D2B48C'],
  bone:    ['#FFFFF0', '#FFF8E7', '#D2C6A5'],
  crystal: ['#E1BEE7', '#AB47BC', '#6A1B9A'],
} as const;
```

---

## 4. CLI Interface

### 4.1 Command Structure

```
pnpm art <command> [options]
```

| Command | Description |
|---|---|
| `icons` | Generate item/ability/buff/currency/profession icons |
| `texture` | Generate tileable material textures |
| `ui-chrome` | Generate UI borders, buttons, bars |
| `sprite` | Composite character or enemy sprites |
| `batch` | Run batch generation from manifest file |
| `palette` | Preview/export palette data |
| `template` | List/preview available templates |

### 4.2 Examples

```bash
# Generate 10 epic sword icons, seeds 100-109
pnpm art icons --category=weapon --type=longsword --quality=epic --seeds=100-109

# Generate a fire-enchanted rare staff
pnpm art icons --category=weapon --type=staff --quality=rare --element=fire --seed=42

# Generate parchment texture, 256x256, tileable
pnpm art texture --material=parchment --size=256 --tileable --seed=1

# Generate full bronze UI chrome set
pnpm art ui-chrome --theme=bronze --output=src/renderer/assets/ui/chrome/

# Composite a character sprite
pnpm art sprite --race=stoneguard --gender=male --chest=plate-t1 --legs=plate-t1 --seed=7

# Batch generate from manifest
pnpm art batch --manifest=tools/art-engine/manifests/phase1-icons.json

# Preview material palettes
pnpm art palette --type=materials --preview
```

### 4.3 Batch Manifests

JSON files that describe a set of assets to generate:

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
    },
    {
      "id": "health-potion-001",
      "command": "icons",
      "params": {
        "category": "consumable",
        "type": "health-potion",
        "quality": "common",
        "seed": 200
      }
    }
  ]
}
```

### 4.4 Output Naming Convention

```
{category}-{type}-{quality}-{seed}.png
```

Examples:
- `weapon-longsword-epic-105.png`
- `armor-helmet-rare-042.png`
- `ability-fireball-common-001.png`
- `texture-parchment-256-tileable-001.png`

---

## 5. Implementation Phases

### Phase A: Foundation (Core + Icons)
**Priority: High — needed before Phase 1 UI work (Tasks 17-23)**

1. Core module (pixel-grid, palette, dither, primitives, export, seed)
2. Palette definitions from art style guide
3. Icon template system (5-10 weapon templates, 5 armor templates, 3 consumable templates)
4. Icon shading and quality tier effects
5. CLI with `icons` and `palette` commands
6. Tests for core algorithms (dithering, palette quantization, shading)

**Deliverable:** Can generate item icons at 48x48 and 64x64 for all quality tiers.

### Phase B: Textures + UI Chrome
**Priority: Medium — needed for UI theming**

1. Noise module (simplex, fractal, turbulence)
2. Material texture generators (parchment, leather, stone, metal, wood)
3. Tileable texture output
4. 9-slice border generation
5. Button state generation
6. Progress bar generation
7. CLI with `texture` and `ui-chrome` commands

**Deliverable:** Can generate all UI background textures and chrome elements.

### Phase C: Expanded Icon Library
**Priority: Medium — more templates for variety**

1. Ability icon templates (fire, ice, shadow, holy, nature, physical)
2. Currency icon templates (gold, justice, valor)
3. Profession icon templates (all 12 professions)
4. Buff/debuff icon templates
5. Batch manifest system

**Deliverable:** Full icon coverage for Phase 1 game content.

### Phase D: Sprite Compositor
**Priority: Lower — needed for character/dungeon screens**

1. Base body template format and loader
2. Equipment overlay format and loader
3. Composite rendering pipeline
4. Colorization system (skin tones, hair, equipment recoloring)
5. Enemy composition system
6. CLI with `sprite` command

**Note:** This phase requires pre-authored base body and equipment pixel art templates. The engine composites them; it doesn't generate them from scratch. Template authoring is a separate effort.

---

## 6. Integration with Claude Tooling

### Skill: `idle-mmo-art-generator`

A Claude skill (`.claude/skills/idle-mmo-art-generator/SKILL.md`) that:
- Knows the art engine CLI and parameter space
- Generates batch manifests for asset requests
- Invokes the CLI to produce assets
- Falls back to Claude image generation for concept art / references when algorithmic generation is insufficient (e.g., boss splash art)
- Translates design intent from the art style guide into engine parameters

### Agent Enhancement: `idle-mmo-ui-designer`

The UI designer agent gets a new section about:
- The art engine exists and what it can produce
- How to write asset specifications in design docs that map to engine parameters
- When to specify "art-engine generated" vs "hand-authored" assets

### Agent: `idle-mmo-frontend-dev`

No changes needed. The frontend dev consumes assets regardless of how they were generated. Generated PNGs go in `src/renderer/assets/` and are used identically to hand-authored assets.

---

## 7. Testing Strategy

### Core Module Tests
- Palette quantization produces correct nearest colors
- Dithering algorithms produce expected pixel patterns for known inputs
- Primitives draw correctly (line endpoints, filled vs outline shapes)
- Seeded RNG produces identical sequences for same seed
- PNG export produces valid files at correct dimensions

### Icon Module Tests
- Template loading and validation
- Shading produces non-uniform output (not flat fills)
- Quality tier effects are visually distinct (border colors match spec)
- Same seed + params = identical output (reproducibility)
- Output dimensions match spec (48x48, 64x64, etc.)

### Texture Module Tests
- Noise functions produce values in expected range
- Tileable textures have matching edges (pixel comparison)
- Material configs produce distinct visual output

### Integration Tests
- CLI commands produce expected output files
- Batch manifests generate all specified assets
- Output file naming follows convention

---

## 8. Open Questions

1. **Template authoring workflow:** How are silhouette templates created? Options:
   - Hand-draw in a pixel art tool (Aseprite), export as JSON
   - Define programmatically in code (coordinates)
   - Hybrid: rough shape in code, refined by hand

2. **Sprite base body authoring:** The compositor needs pre-authored base bodies (8 races x 2 genders). These need to be pixel art authored externally. When and how?

3. **Asset versioning:** Do we version generated assets (commit PNGs) or only version seeds/manifests (regenerate on demand)?

4. **Animation frames:** Some assets may need multiple frames (shimmer on XP bar, idle animation on sprites). How many frames, what format?
