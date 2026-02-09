# Idle MMORPG -- Art Style Guide & UI Visual Specification

**Version:** 1.0
**Date:** February 8, 2026
**Author:** UI/UX Design (idle-mmo-ui-designer)
**Status:** Canonical Reference
**Audience:** Frontend Development, Art Production, QA

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Art Style Definition](#2-art-style-definition)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [UI Chrome and Framework](#5-ui-chrome-and-framework)
6. [Icon and Sprite Standards](#6-icon-and-sprite-standards)
7. [Item Tooltip Design](#7-item-tooltip-design)
8. [Character Screen Layout](#8-character-screen-layout)
9. [Talent Tree Visual Design](#9-talent-tree-visual-design)
10. [Component Library Specifications](#10-component-library-specifications)
11. [Screen Wireframes -- Phase 1](#11-screen-wireframes----phase-1)
12. [Animation and Feedback Systems](#12-animation-and-feedback-systems)
13. [Accessibility](#13-accessibility)
14. [Asset Production Pipeline](#14-asset-production-pipeline)

---

## 1. Design Philosophy

### Core Principles

This game's visual identity sits at the intersection of two aesthetics: the dense, ornate UI of 2000s-era MMORPGs (World of Warcraft Classic, EverQuest 2, RIFT) and the high-fidelity pixel art tradition of late SNES / early PS1 era JRPGs. The result should feel like a lost relic from 2006 -- a game that could have shipped alongside WoW's Burning Crusade expansion, but rendered in a handcrafted pixel art style rather than 3D polygons.

**This is NOT a casual idle game.** The visual treatment must communicate seriousness, depth, and authenticity. Players should feel like they are interacting with a "real" MMORPG character sheet, not a simplified mobile game.

### Guiding Tenets

1. **Density over minimalism.** MMORPG interfaces are inherently information-rich. We embrace that density and manage it through visual hierarchy, not by removing data.
2. **Ornate over clean.** UI chrome should feature beveled metal frames, embossed borders, and textured backgrounds. Flat design is explicitly rejected.
3. **Dark over light.** The overall palette is dark and atmospheric. Panels use near-black backgrounds so that colored text (item names, stats, quality indicators) pops with maximum contrast.
4. **Nostalgia as a feature.** Every design choice should evoke the feeling of logging into WoW for the first time in 2005 -- the gold-bordered character panel, the scrolling combat log, the green stat text on a dark tooltip.
5. **Glanceable idle status.** Despite the density, the most critical idle-game information (current level, XP progress, DPS, gold/hr) must be readable in under 2 seconds from any screen.

---

## 2. Art Style Definition

### 2.1 Pixel Art Style

The reference images establish a specific pixel art vocabulary. This is not "retro chiptune" pixel art (8-bit, low-color). This is **high-detail, semi-realistic pixel art** in the tradition of late 90s / early 2000s sprite-based RPGs.

#### Key Characteristics (derived from character_sprite_sample.png through character_sprite_sample4.png)

- **Semi-realistic proportions.** Characters are approximately 7-8 heads tall. No chibi, no exaggerated proportions. Anatomy follows realistic human proportions with fantasy armor exaggeration (oversized shoulder pads, dramatic helms).
- **High pixel density.** Individual sprites use enough pixels to render cloth folds, leather stitching, metal reflections, and facial features. This is not low-res pixel art.
- **Dithering for shading.** Gradients are achieved through pixel-level dithering patterns rather than smooth blending. This is visible in character_sprite_sample.png's muted brown armor tones and cloth draping, and character_sprite_sample4.png's layered metal plate shading.
- **Rich material differentiation.** Metal reads as metal (specular highlights, cyan-shifted reflections on character_sprite_sample2.png's arcane armor). Cloth reads as cloth (soft folds, matte finish on character_sprite_sample.png's red sash). Leather reads as leather (warm brown tones, subtle texture on character_sprite_sample4.png's layered iron plating).
- **Transparent backgrounds for sprites.** All character and item sprites are rendered on transparent backgrounds for compositing onto dark UI panels.

#### Sprite Resolution Targets

| Sprite Type              | Canvas Size        | Displayed Size (1080p) | Notes                                      |
|--------------------------|--------------------|------------------------|--------------------------------------------|
| Character (paper doll)   | 256x512 px         | 256x512 px (1:1)       | Full body, front-facing, idle pose         |
| Character (combat view)  | 128x256 px         | 128x256 px (1:1)       | Reduced detail for combat panel            |
| Boss portrait            | 256x256 px         | 256x256 px (1:1)       | Upper body/face for dungeon browser        |
| Boss (full body)         | 384x512 px         | 384x512 px (1:1)       | For encounter splash screens               |
| Item icon (inventory)    | 48x48 px           | 48x48 px (1:1)         | Must read clearly at this size             |
| Item icon (tooltip)      | 64x64 px           | 64x64 px (1:1)         | Larger version for tooltip header          |
| Ability icon             | 40x40 px           | 40x40 px (1:1)         | Talent tree nodes, action bar              |
| Buff/debuff icon         | 24x24 px           | 24x24 px (1:1)         | Status bar, must be icon-readable          |
| Currency icon            | 16x16 px           | 16x16 px (1:1)         | Inline with text                           |

All sprites are authored at 1x and displayed at 1x. No sub-pixel rendering. No anti-aliasing on sprite edges. Pixel boundaries must remain crisp at all display sizes. Use `image-rendering: pixelated` (CSS) for all sprite elements.

#### Color Depth per Sprite

- Characters and bosses: 64-128 color palette per sprite (including shading variants)
- Item icons: 32-48 colors per icon
- UI icons (buffs, currencies): 16-24 colors per icon

### 2.2 Character Art Direction

Based on character_sprite_sample.png (the dark armored knight) and character_sprite_sample2.png (the blue mage-knight):

- **Armor rendering:** Each armor piece is distinct and separately readable. Shoulder pads, bracers, belt, boots, and chest piece each have clear silhouette boundaries. This is critical because the paper doll must show individual gear slots. character_sprite_sample.png demonstrates this with its distinct muted brown layered armor and purple chest gem, while character_sprite_sample2.png shows glowing cyan shoulder and chest gems as discrete accent pieces.
- **Color palette per character:** Each character sprite uses a dominant accent color (muted browns/blacks with a red sash for the sample1 knight, blue/teal with cyan glowing accents for the sample2 mage-knight) combined with neutral warm tones (browns, golds, tans) for leather and skin.
- **Skin tones:** Rendered with warm undertones. Dithered shading creates the illusion of subsurface scattering. No flat color fills for skin.
- **Idle pose:** Front-facing, slight asymmetry (weight on one leg, one arm slightly raised). This adds personality without requiring animation for the static paper doll.

#### Character Sprite Layering

For the paper doll system, character sprites must be layered:

```
Layer Order (bottom to top):
1. Base body (race + gender)
2. Pants / Leg armor
3. Boots
4. Chest armor
5. Belt / Waist
6. Shoulder armor
7. Gloves / Bracers
8. Helm (toggleable visibility)
9. Weapon (main hand, off hand)
10. Back / Cloak
```

Each layer is a separate sprite sheet. This allows dynamic display of equipped gear on the paper doll. Sprites must align to a shared anchor grid so that layers composite correctly.

### 2.3 Boss and Enemy Design

Based on character_sprite_sample3.png (the dark occult boss):

- **Scale communicates threat.** Boss sprites should be 1.5x to 2x the size of player character sprites. The sample3 boss is menacing and high-detail, filling its frame with aggressive occult energy.
- **Silhouette first.** Every boss must have a unique, instantly recognizable silhouette. The sample3 boss achieves this with its orange glowing runes, green vials, and dark ceremonial bulk.
- **Rich detail density.** Boss sprites warrant the highest pixel density and color count. The sample3 boss uses at least 80-100 distinct colors across its dark/orange/green palette.
- **Atmospheric color palette per boss.** Each boss should have a dominant color identity:
  - Emberforge Depths bosses: Reds, oranges, molten golds
  - Shadowspire Citadel bosses: Blues, purples, silvers
  - Temple of the Forsaken bosses: Greens, teals, bone whites
  - The Eternal Crypt bosses: Dark purples, blacks, sickly yellows

### 2.4 How This Differs from Typical Idle Games

| Typical Idle Game Art         | Our Art Direction                                    |
|-------------------------------|------------------------------------------------------|
| Cartoon / chibi proportions   | Semi-realistic, 7-8 head proportions                 |
| Bright, saturated, flat color | Dark, atmospheric, dithered shading                  |
| Simple vector icons           | Detailed pixel art icons with material rendering      |
| Minimal UI chrome             | Ornate, beveled, textured frames                     |
| White/light backgrounds       | Dark backgrounds (near-black panels)                 |
| Cute, approachable aesthetic  | Serious, grounded fantasy aesthetic                  |
| Small item icons, big buttons | Dense information panels, rich tooltips              |

---

## 3. Color System

### 3.1 Item Quality Colors

These are canonical and must never change. They derive directly from the WoW/EQ2 tradition and are specified in the GDD.

| Quality     | Name Hex   | Border Hex | Glow Hex   | CSS Variable              | Colorblind Shape |
|-------------|------------|------------|------------|---------------------------|------------------|
| Common      | `#9D9D9D`  | `#4A4A4A`  | None       | `--quality-common`        | Circle           |
| Uncommon    | `#1EFF00`  | `#0D7A00`  | `#1EFF0033`| `--quality-uncommon`      | Diamond          |
| Rare        | `#0070DD`  | `#003D7A`  | `#0070DD33`| `--quality-rare`          | Triangle         |
| Epic        | `#A335EE`  | `#5C1D87`  | `#A335EE33`| `--quality-epic`          | Star             |
| Legendary   | `#FF8000`  | `#8A4500`  | `#FF800044`| `--quality-legendary`     | Hexagon          |

**Border Hex** is used for the 2px border around item icons in inventory slots. **Glow Hex** is a low-opacity radial glow applied behind Epic and Legendary item icons to make them visually pop. Common items receive no glow.

**Colorblind Shape** is a small shape indicator (8x8 px) rendered in the bottom-right corner of every item icon. This ensures quality is communicable without color.

### 3.2 UI Chrome Colors

These define the metallic frame elements, backgrounds, and structural UI.

| Element                    | Hex        | CSS Variable             | Description                              |
|----------------------------|------------|--------------------------|------------------------------------------|
| Panel Background           | `#1A1A1F`  | `--panel-bg`             | Near-black with slight blue undertone    |
| Panel Background Alt       | `#12121A`  | `--panel-bg-alt`         | Slightly darker, for nested panels       |
| Frame Border Outer         | `#8B7340`  | `--frame-border-outer`   | Gold/bronze metallic, outer edge         |
| Frame Border Inner         | `#5C4D2E`  | `--frame-border-inner`   | Darker gold, inner bevel                 |
| Frame Border Highlight     | `#C9A84C`  | `--frame-border-highlight`| Bright gold, top/left bevel edge        |
| Frame Border Shadow        | `#3A2E1A`  | `--frame-border-shadow`  | Dark brown, bottom/right bevel edge      |
| Separator Line             | `#3D3529`  | `--separator`            | Subtle gold-brown divider                |
| Scrollbar Track            | `#252530`  | `--scrollbar-track`      | Dark track background                    |
| Scrollbar Thumb            | `#5C4D2E`  | `--scrollbar-thumb`      | Matches frame border inner               |
| Scrollbar Thumb Hover      | `#8B7340`  | `--scrollbar-thumb-hover`| Brightens on hover                       |

#### Panel Background Texture

The panel background is not a flat color. It uses a subtle tileable texture overlaid at 5-8% opacity:

- **Primary panels:** Dark leather/parchment texture (warm noise pattern)
- **Nested panels (stat areas, tooltip body):** Slightly cooler dark texture
- **Modal overlays:** Semi-transparent black (`#000000CC`) backdrop blur

The texture tile should be 128x128 px, seamlessly tileable, and exported as PNG with alpha.

### 3.3 Stat and Text Colors

| Text Role                  | Hex        | CSS Variable             | Usage                                    |
|----------------------------|------------|--------------------------|------------------------------------------|
| Primary Text               | `#E8D5B0`  | `--text-primary`         | Most body text, stat labels              |
| Secondary Text             | `#A89878`  | `--text-secondary`       | Flavor text, less important info         |
| Disabled Text              | `#5A5040`  | `--text-disabled`        | Unavailable options, locked content      |
| Stat Positive              | `#1EFF00`  | `--stat-positive`        | Green, stat increases on gear comparison |
| Stat Negative              | `#FF3333`  | `--stat-negative`        | Red, stat decreases on gear comparison   |
| Stat Neutral               | `#FFFFFF`  | `--stat-neutral`         | White, unchanged stats                   |
| XP Text                    | `#C8A2C8`  | `--text-xp`             | Lilac, XP gain notifications             |
| Gold Text                  | `#FFD700`  | `--text-gold`           | Gold amounts, currency                   |
| Combat Damage (Physical)   | `#FFFFFF`  | `--combat-phys`         | White numbers in combat log              |
| Combat Damage (Spell)      | `#FFFF00`  | `--combat-spell`        | Yellow numbers                           |
| Combat Damage (Critical)   | `#FF4444`  | `--combat-crit`         | Red, larger font for crits               |
| Combat Healing             | `#00FF00`  | `--combat-heal`         | Green heal numbers                       |
| Combat Buff Applied        | `#00CCFF`  | `--combat-buff`         | Cyan, buff/debuff text                   |
| Combat Loot                | Varies     | Inherits quality color   | Colored by item quality                  |
| System Message             | `#FFCC00`  | `--text-system`         | Yellow-gold system notifications         |
| Error Message              | `#FF4444`  | `--text-error`          | Red error text                           |
| Link / Interactive         | `#3399FF`  | `--text-link`           | Blue, clickable elements                 |

### 3.4 Resource Bar Colors

| Resource      | Fill Color  | Background   | Border       | CSS Variable Prefix |
|---------------|-------------|--------------|--------------|---------------------|
| Health        | `#CC2222`   | `#3A0A0A`    | `#661111`    | `--bar-health`      |
| Mana          | `#2255CC`   | `#0A0A3A`    | `#112266`    | `--bar-mana`        |
| Energy        | `#CCCC22`   | `#3A3A0A`    | `#666611`    | `--bar-energy`      |
| Rage          | `#CC2222`   | `#3A0A0A`    | `#661111`    | `--bar-rage`        |
| XP            | `#8844CC`   | `#1A0A2A`    | `#442266`    | `--bar-xp`          |
| Reputation    | `#22AA44`   | `#0A2A12`    | `#115522`    | `--bar-rep`         |
| Profession    | `#CC8822`   | `#2A1A0A`    | `#664411`    | `--bar-prof`        |
| Cast/Channel  | `#CCCC22`   | `#3A3A0A`    | `#666611`    | `--bar-cast`        |

All bars share the same structural design: 2px border, 1px inner shadow (black 50%), fill with subtle horizontal gradient (lighter at top edge for a "glossy" look). Height: 20px for primary bars (health, mana), 12px for secondary bars (XP, reputation), 8px for tertiary bars (buff duration).

### 3.5 Background and Environment Colors

| Zone Theme               | Primary     | Secondary   | Accent      | Usage                   |
|--------------------------|-------------|-------------|-------------|-------------------------|
| Starting Regions         | `#2A3A22`   | `#1A2A14`   | `#88CC44`   | Forest greens            |
| Wildwood & Meadows       | `#223A22`   | `#1A2A1A`   | `#44CC88`   | Lush greens              |
| Mistmoors & Caverns      | `#222A3A`   | `#1A1A2A`   | `#4488CC`   | Misty blues              |
| Skyreach Summits         | `#2A2A3A`   | `#1A1A2A`   | `#8888CC`   | Mountain purples         |
| Blighted Wastes          | `#3A2A22`   | `#2A1A14`   | `#CC8844`   | Corrupted oranges        |
| Ascendant Territories    | `#2A1A3A`   | `#1A0A2A`   | `#CC44CC`   | Arcane purples           |

These tint the combat panel background and zone name header to give each area a distinct atmosphere.

---

## 4. Typography

### 4.1 Font Stack

| Role              | Font Family                        | Fallback                    | Weight  | CSS Variable        |
|-------------------|------------------------------------|-----------------------------|---------|---------------------|
| Display / Title   | "Cinzel Decorative"                | "Cinzel", Georgia, serif    | 700     | `--font-display`    |
| Heading           | "Cinzel"                           | Georgia, "Times New Roman"  | 600     | `--font-heading`    |
| Body              | "Inter"                            | "Segoe UI", Roboto, sans   | 400     | `--font-body`       |
| Body Bold         | "Inter"                            | "Segoe UI", Roboto, sans   | 600     | `--font-body`       |
| Stats / Numbers   | "JetBrains Mono"                   | "Consolas", monospace       | 400     | `--font-mono`       |
| Combat Log        | "JetBrains Mono"                   | "Consolas", monospace       | 400     | `--font-mono`       |
| Tooltip Header    | "Cinzel"                           | Georgia, serif              | 600     | `--font-heading`    |

**Rationale:**
- "Cinzel Decorative" and "Cinzel" are open-source serif fonts with a classical Roman/medieval feel. They evoke the inscription-style lettering seen in WoW's character panel headers (visible in character_screen_sample2.png -- warm browns/reds framing a detailed character portrait with dense ornate header text).
- "Inter" is a clean, highly readable sans-serif optimized for screen display. It ensures stat blocks and body text remain crisp at small sizes.
- "JetBrains Mono" provides tabular (fixed-width) numbers essential for stat column alignment and combat log readability.

### 4.2 Type Scale

All sizes assume base 16px. The scale uses a 1.25 ratio (Major Third).

| Token           | Size (px) | Size (rem) | Line Height | Letter Spacing | Usage                                 |
|-----------------|-----------|------------|-------------|----------------|---------------------------------------|
| `--text-xs`     | 10        | 0.625      | 1.3         | 0.02em         | Buff durations, minor labels          |
| `--text-sm`     | 12        | 0.75       | 1.4         | 0.01em         | Secondary info, tooltip sub-text      |
| `--text-base`   | 14        | 0.875      | 1.5         | 0              | Primary body text, stat values        |
| `--text-md`     | 16        | 1.0        | 1.5         | 0              | Stat labels, navigation tabs          |
| `--text-lg`     | 20        | 1.25       | 1.3         | 0.01em         | Panel headers, section titles         |
| `--text-xl`     | 24        | 1.5        | 1.2         | 0.02em         | Screen titles, character name         |
| `--text-2xl`    | 30        | 1.875      | 1.1         | 0.03em         | Major display (level up splash)       |
| `--text-3xl`    | 40        | 2.5        | 1.0         | 0.04em         | Hero display (game title, Ascension)  |

### 4.3 Number Formatting

All numerical stat displays must use **tabular figures** (font-feature-settings: "tnum"). This ensures columns of numbers align vertically:

```
Spell Power:        172      (right-aligned)
Spell Healing:      172      (right-aligned)
Mana Regen:          11      (right-aligned)
Critical Strike:   7.9%      (right-aligned, % suffix)
Hit Chance:        0.0%      (right-aligned, % suffix)
```

Damage ranges use an en-dash: `555-714` (not a hyphen).

Large numbers use comma separators: `1,140` not `1140`.

Percentages always show one decimal place: `7.9%` not `8%`.

---

## 5. UI Chrome and Framework

### 5.1 Frame Design

Based on character_screen_sample2.png (warm browns/reds/oranges with detailed character portrait and dense UI framing), the UI frame system uses a multi-layered beveled border that simulates hammered bronze / gold metalwork.

#### Standard Panel Frame (4-layer bevel)

```
Outermost:  1px  #3A2E1A  (dark shadow edge)
Outer:      2px  #8B7340  (gold metallic body)
Inner:      1px  #C9A84C  (bright highlight, top-left edge only)
Innermost:  1px  #5C4D2E  (dark inner bevel)
Content:    --panel-bg (#1A1A1F) with texture overlay
```

Total border width: 5px per side. Corner treatment: square corners (no border-radius). This matches the hard-edged metalwork seen in the reference.

For implementation, this is achieved with layered `box-shadow` and `border` properties rather than border images, to keep it resolution-independent:

```css
.panel-frame {
  background: var(--panel-bg);
  border: 2px solid var(--frame-border-outer);
  box-shadow:
    inset 1px 1px 0 0 var(--frame-border-highlight),
    inset -1px -1px 0 0 var(--frame-border-shadow),
    0 0 0 1px var(--frame-border-shadow);
}
```

#### Ornate Panel Frame (for major screens like Character, Inventory)

Major panels use a CSS `border-image` with a 9-slice sprite for ornate corner flourishes. The corner sprites are 32x32 px gold filigree designs. Edge sprites are 32x8 px repeating patterns.

```
Asset: ui-frame-ornate.png (sprite sheet)
  Top-left corner:     32x32 px
  Top-right corner:    32x32 px
  Bottom-left corner:  32x32 px
  Bottom-right corner: 32x32 px
  Top edge:            32x8 px  (tileable)
  Bottom edge:         32x8 px  (tileable)
  Left edge:           8x32 px  (tileable)
  Right edge:          8x32 px  (tileable)
```

### 5.2 Panel Types

| Panel Type        | Background         | Border Style    | Usage                                          |
|-------------------|--------------------|-----------------|-------------------------------------------------|
| Primary Panel     | `--panel-bg`       | Ornate frame    | Major screens (Character, Inventory, Talents)   |
| Secondary Panel   | `--panel-bg-alt`   | Standard frame  | Sub-panels within primary (stat blocks, lists)  |
| Inset Panel       | `#0D0D12`          | 1px `#3D3529`   | Sunken areas (equipment slots, input fields)    |
| Floating Panel    | `--panel-bg`       | Standard frame  | Tooltips, dropdowns, context menus              |
| Modal Panel       | `--panel-bg`       | Ornate frame    | Dialogs, confirmations, offline summary         |
| Toast Panel       | `#2A2520`          | 1px `#8B7340`   | Notifications, achievement popups               |

### 5.3 Window Layout System

The game uses a **fixed sidebar + content area** layout.

```
+------------------------------------------------------------------+
|  [Title Bar - Electron custom]                            [_][X] |
+----------+-------------------------------------------------------+
|          |                                                       |
|  NAV     |  CONTENT AREA                                         |
|  SIDEBAR |  (swaps based on active tab)                          |
|          |                                                       |
|  [Icon]  |  +---------------------------------------------------+|
|  [Icon]  |  |  MAIN PANEL                                       ||
|  [Icon]  |  |                                                   ||
|  [Icon]  |  |                                                   ||
|  [Icon]  |  |                                                   ||
|  [Icon]  |  |                                                   ||
|  [Icon]  |  +---------------------------------------------------+|
|          |                                                       |
|          |  +-------------------------+-------------------------+|
|          |  |  SECONDARY PANEL A      |  SECONDARY PANEL B      ||
|          |  |  (e.g., stats)          |  (e.g., combat log)     ||
|          |  +-------------------------+-------------------------+|
+----------+-------------------------------------------------------+
|  [Status Bar: Level | Zone | Gold | DPS | Time Playing]          |
+------------------------------------------------------------------+
```

#### Measurements (at 1920x1080)

| Element            | Width        | Height       | Notes                                  |
|--------------------|--------------|--------------|----------------------------------------|
| Title Bar          | 100%         | 32px         | Custom Electron title bar              |
| Nav Sidebar        | 64px         | 100% - 32px  | Icon-only navigation, expandable to 200px with labels |
| Content Area       | 100% - 64px  | 100% - 72px  | Remaining space                        |
| Status Bar         | 100%         | 40px         | Fixed bottom, always visible           |
| Panel Padding      | --           | --           | 16px internal padding                  |
| Panel Gap          | --           | --           | 8px between adjacent panels            |

#### Measurements (at 1280x720 minimum)

At minimum resolution, the sidebar collapses to 48px (smaller icons), panel padding reduces to 12px, and font sizes step down one tier (base becomes 12px instead of 14px). The layout otherwise remains structurally identical.

### 5.4 Navigation Sidebar

The sidebar contains icon buttons for each major screen. Design follows the tab metaphor from character_screen_sample2.png (warm gritty heroic frame with bottom navigation tabs for Character, Reputation, Skills, and related sub-screens).

```
Sidebar Icon States:
- Default:   48x48 icon area, #A89878 tinted icon, no background
- Hover:     Icon brightens to #E8D5B0, subtle background glow (#8B734020)
- Active:    Icon full white (#FFFFFF), left border 3px #C9A84C, background #2A2520
- Disabled:  Icon at 30% opacity, no interaction
```

Navigation items (top to bottom):
1. Hub / Home (sword-and-shield icon)
2. Character (helmet icon)
3. Inventory (bag icon)
4. Talents (tree icon)
5. Quests (scroll icon)
6. Dungeons (door/gate icon)
7. Professions (anvil icon)
8. Achievements (trophy icon)
9. Settings (gear icon, bottom-pinned)

### 5.5 Status Bar

The bottom status bar provides at-a-glance idle game metrics. It uses the `--panel-bg-alt` background with a top border of `--separator`.

```
+------------------------------------------------------------------+
| Lv 42 Pyromancy Arcanist | Mistmoors | 1,247 Gold | 312 DPS | 2h 14m |
+------------------------------------------------------------------+
```

Each segment is separated by a vertical `--separator` divider (1px). The level/class segment uses `--text-primary`, zone uses zone-tinted accent color, gold uses `--text-gold`, DPS uses `--text-primary`, and time uses `--text-secondary`.

---

## 6. Icon and Sprite Standards

### 6.1 Item Icons

Every item in the game is represented by a 48x48 pixel art icon. Icons are displayed inside a 52x52 slot (48px icon + 2px quality-colored border on each side).

#### Icon Construction Rules

1. **Subject centered** in the 48x48 canvas with 2px padding on all sides (effective draw area: 44x44).
2. **Slight 3/4 perspective** (top-down angle, as if items are lying on a table tilted toward the viewer).
3. **Consistent lighting** from top-left. Highlights on top-left edges, shadows on bottom-right.
4. **Dark background fill** inside the icon canvas: `#1A1A1F` (matches panel background). This prevents transparent gaps when composited.
5. **Material-accurate rendering.** Metal must have specular highlights. Cloth must have soft folds. Gems must have transparent refraction hints.
6. **Slot-type silhouette differentiation:**
   - Weapons: Diagonal orientation (sword angled from bottom-left to top-right)
   - Armor: Front-facing flat view of the piece
   - Jewelry: Centered, smaller subject with more background visible
   - Trinkets: Unique, mysterious objects (skulls, orbs, gears)
   - Potions: Vertical flask silhouette

#### Inventory Slot Design

```
+--+--------------------------------------------------+--+
|  |                                                    |  |  <- 2px quality border
+--+                                                    +--+
|  |                                                    |  |
|  |                 48x48 Item Icon                     |  |
|  |                                                    |  |
|  |                                            [shape] |  |  <- 8x8 colorblind indicator
+--+                                                    +--+
|  |                                                    |  |
+--+--------------------------------------------------+--+
   [stack count bottom-right if stackable]
```

Empty slots display a dimmed silhouette (20% opacity white) of the expected slot type (helm shape for head slot, ring shape for ring slot, etc.).

### 6.2 Ability Icons

Ability icons are 40x40 px with a 1px dark border (`#1A1A1F`) and a 1px class-colored inner border.

| Class          | Accent Color | Hex        |
|----------------|--------------|------------|
| Blademaster    | Steel Red    | `#CC3333`  |
| Sentinel       | Holy Gold    | `#FFCC44`  |
| Stalker        | Forest Green | `#44AA44`  |
| Shadow         | Deep Purple  | `#7733AA`  |
| Cleric         | Silver White | `#CCCCDD`  |
| Arcanist       | Arcane Blue  | `#3366CC`  |
| Summoner       | Fel Green    | `#44CC44`  |
| Channeler      | Storm Cyan   | `#33AACC`  |
| Shapeshifter   | Amber        | `#CC8833`  |

#### Talent Node Icon States (from talent_tree_sample.png)

The talent tree reference shows square icons with dark backgrounds and the following states:

```
Unavailable (locked):
  - Icon: Desaturated, 40% opacity
  - Border: 1px #3D3529 (dark)
  - Counter: "0/X" in --text-disabled
  - Background: #0D0D12

Available (can allocate, 0 points):
  - Icon: Full color
  - Border: 1px #8B7340 (gold)
  - Counter: "0/X" in --text-primary
  - Background: #1A1A1F

Partially Invested:
  - Icon: Full color with subtle inner glow
  - Border: 2px #C9A84C (bright gold)
  - Counter: "Y/X" in --stat-positive (green)
  - Background: #1A1A1F

Maxed Out:
  - Icon: Full color, golden glow overlay
  - Border: 2px #FFD700 (pure gold) with outer glow
  - Counter: "X/X" in --text-gold
  - Background: #2A2520 (slightly lighter)

Capstone (tier 5):
  - Icon: 48x48 (larger than standard 40x40)
  - Border: 3px animated gold shimmer
  - Unique ornate frame sprite (not CSS border)
```

### 6.3 Buff and Debuff Icons

24x24 px icons with a 1px colored border:

- **Beneficial (buff):** `#2255CC` blue border
- **Harmful (debuff):** `#CC2222` red border
- **Neutral/Utility:** `#A89878` tan border

Duration is shown as a small number (10px font, `--font-mono`) centered below or overlaid on the bottom of the icon.

### 6.4 Currency Icons

16x16 px inline icons:

| Currency        | Icon Description              | Primary Color |
|-----------------|-------------------------------|---------------|
| Gold            | Round coin, embossed "G"      | `#FFD700`     |
| Silver          | Round coin, embossed "S"      | `#C0C0C0`     |
| Copper          | Round coin, embossed "C"      | `#B87333`     |
| Justice Points  | Blue crystal, hexagonal       | `#0070DD`     |
| Valor Points    | Red crystal, angular          | `#CC2222`     |

---

## 7. Item Tooltip Design

Based on item_tooltip_sample.png (dark background, warm beige/orange text, arcane flavor text in a WoW-style tooltip) and legendary_weapon_tooltip.png (dark panel, high-contrast white/green text, epic verbose style).

### 7.1 Tooltip Structure

The tooltip is a floating panel with the standard frame border. Width is fixed at 320px. Height is dynamic based on content.

```
+-- TOOLTIP (320px wide) -----------------------------------+
|                                                            |
|  [Slot Type]                                    [X close]  |  <- Header bar
|                                                            |
|  [Item Name -- colored by quality]        [64x64 icon]     |  <- Title row
|                                                            |
|  [QUALITY LABEL, FLAGS]                                    |  <- e.g., "EPIC"
|  [Bind type]                                               |  <- "Soulbound" / "Bind on Equip"
|                                                            |
|  [Adornment/gem slots -- small icons]                      |  <- If applicable
|                                                            |
|  ---- separator line ----                                  |
|                                                            |
|  [Primary Stats]                                           |  <- Green text: +STR, +AGI, etc.
|  [Secondary Stats]                                         |  <- White text: Crit, Haste, etc.
|                                                            |
|  ---- separator line ----                                  |
|                                                            |
|  [Slot: Head]          [Level: 75]                         |  <- Slot and iLevel
|  [Item Level: 75]                                          |  <- iLevel prominent
|                                                            |
|  ---- separator line ----                                  |
|                                                            |
|  [Set Bonus:]                                              |  <- If set item
|  [  (2) Set: Bonus description    -- gray if not active]   |
|  [  (4) Set: Bonus description    -- white if active]      |
|                                                            |
|  ---- separator line ----                                  |
|                                                            |
|  [Effects:]                                                |  <- Gold header
|  [  - Effect description text]                             |  <- White text
|  [    - Sub-effect]                                        |  <- Indented
|                                                            |
|  ---- separator line ----                                  |
|                                                            |
|  [Source: Shadowspire Citadel - Boss 3]                    |  <- Secondary text color
|                                                            |
+------------------------------------------------------------+
```

### 7.2 Tooltip Color Coding

| Tooltip Element          | Color                  | Font                    | Size      |
|--------------------------|------------------------|-------------------------|-----------|
| Header bar background    | `#0D0D12`              | --                      | --        |
| Slot type label          | `--text-secondary`     | `--font-body`           | `--text-sm`  |
| Item name                | Quality color (see 3.1)| `--font-heading`        | `--text-lg`  |
| Quality/flags label      | `#FFD700` (gold)       | `--font-body` uppercase | `--text-sm`  |
| Bind type                | `--text-secondary`     | `--font-body`           | `--text-sm`  |
| Primary stats (+STR etc) | `#1EFF00` (green)      | `--font-body`           | `--text-base`|
| Secondary stats          | `#FFFFFF` (white)      | `--font-body`           | `--text-base`|
| Slot / Level labels      | `--text-secondary`     | `--font-body`           | `--text-sm`  |
| Slot / Level values      | `--text-primary`       | `--font-body`           | `--text-sm`  |
| iLevel value             | `#FFD700` if high      | `--font-mono`           | `--text-sm`  |
| Set bonus header         | `#FFD700` (gold)       | `--font-heading`        | `--text-base`|
| Set bonus (inactive)     | `#5A5040` (gray)       | `--font-body`           | `--text-sm`  |
| Set bonus (active)       | `#FFFFFF` (white)      | `--font-body`           | `--text-sm`  |
| Effects header           | `#FFD700` (gold)       | `--font-heading`        | `--text-base`|
| Effect description       | `#FFFFFF` (white)      | `--font-body`           | `--text-sm`  |
| Source text              | `--text-secondary`     | `--font-body` italic    | `--text-xs`  |
| Separator line           | `--separator`          | --                      | 1px       |

### 7.3 Comparison Tooltip

When hovering an item while another item is equipped in the same slot, a second tooltip appears to the left showing the currently equipped item. Between them (or overlaid on the new item tooltip), stat differences are shown:

```
Stat Increase:   +12 STR   (green text, green up-arrow icon)
Stat Decrease:   -5 AGI    (red text, red down-arrow icon)
Stat Unchanged:  22 STA    (gray text, no arrow)
```

Arrow icons are 10x10 px inline sprites. The comparison values appear in a "Comparison" section appended to the bottom of the new item's tooltip, separated by a dashed line.

### 7.4 Tooltip Positioning

- **Default:** Tooltip appears to the right of the cursor, 8px offset.
- **Edge collision:** If the tooltip would extend beyond the viewport, flip to the left side of the cursor.
- **Comparison tooltip:** Always appears to the left of the primary tooltip, 4px gap.
- **Animation:** Fade in over 100ms. No slide or bounce.
- **Delay:** 200ms hover delay before tooltip appears (prevents flicker when mousing across inventory grid).

---

## 8. Character Screen Layout

Based on character_screen_sample2.png (warm browns/reds/oranges, detailed character portrait, dense UI framing in a gritty heroic WoW-style character panel).

### 8.1 Overall Layout

The character screen fills the main content area. It is divided into three vertical zones:

```
+----------+---------------------------+----------+
|          |                           |          |
|  LEFT    |       CENTER              |  RIGHT   |
|  SLOTS   |       PAPER DOLL          |  SLOTS   |
|          |                           |          |
|  Head    |                           |  Neck    |
|  Shoulder|    [256x512 Character     |  Back    |
|  Chest   |     Sprite -- layered     |  Ring 1  |
|  Wrist   |     with equipped gear]   |  Ring 2  |
|  Hands   |                           |  Trinket1|
|  Waist   |                           |  Trinket2|
|  Legs    |                           |  Main H  |
|  Feet    |                           |  Off H   |
|          |                           |          |
+----------+---------------------------+----------+
|                                                  |
|  +---------------------+  +--------------------+ |
|  |  STAT PANEL LEFT    |  |  STAT PANEL RIGHT  | |
|  |  (Spell Stats)      |  |  (Melee Stats)     | |
|  +---------------------+  +--------------------+ |
|                                                  |
|  +----------------------------------------------+|
|  |  BOTTOM TABS: Character | Reputation | Skills ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

### 8.2 Equipment Slot Design

Each equipment slot is a 52x52 inset panel (matching the inventory slot design from section 6.1). The slot contains:

- The 48x48 item icon (if equipped)
- Quality-colored 2px border
- A dimmed slot-type silhouette icon if empty
- Hover: Brightens border to full quality color, shows tooltip
- Click: Opens item options (unequip, compare, transmog)

**Left column slots (armor):** Head, Shoulders, Chest, Wrists, Hands, Waist, Legs, Feet
**Right column slots (accessories + weapons):** Neck, Back, Ring 1, Ring 2, Trinket 1, Trinket 2, Main Hand, Off Hand

Slots are arranged vertically with 8px gap between each. The left column aligns to the left edge of the paper doll area. The right column aligns to the right edge.

### 8.3 Paper Doll Area

Center area: 280x520 px (slightly wider than the sprite to allow for weapon/cloak overhang).

- Background: `#0D0D12` (deepest black) with a subtle radial gradient lighten at center (to spotlight the character).
- The character sprite composites all equipped gear layers.
- A faint floor shadow ellipse beneath the character's feet grounds the figure.
- Small character name + level text centered above the paper doll:
  - Name: `--font-heading`, `--text-xl`, quality-colored by highest equipped item quality
  - Subtitle: `--font-body`, `--text-sm`, `--text-secondary`
  - Example: **"Vex Nighthollow"** / *Level 60 Pyromancy Arcanist*
  - Title (if earned): *"Raider of Bifrost"* in `--text-gold`, italic

### 8.4 Stat Panel

Below the paper doll + slot area, a two-column stat panel mirrors the WoW reference (character_screen_sample2.png shows dense stat blocks flanking the character portrait, with "Spell" and "Melee" column organization).

**Left Column -- Spell Stats:**
```
Spell Power:         850
Spell Healing:       620
Mana Regen:           45
Critical Strike:   25.0%
Hit Chance:         8.0%
Spell Penetration:    22
```

**Right Column -- Melee/Physical Stats:**
```
Damage:          555-714
Attack Power:      1,140
Attack Speed:       3.63
Critical Strike:  26.3%
Hit Chance:        6.0%
Expertise:           12
```

Each column has a section header ("Spell" / "Melee") with small expand/collapse arrows (character_screen_sample2.png shows gold arrow icons next to the section headers). Stat labels are left-aligned in `--text-primary`, values are right-aligned in `--font-mono`, `--text-primary`. Green-highlighted values (like the "1140" Attack Power in the reference) indicate a recent upgrade or buff.

**Additional expandable sections:**
- Defense (Armor, Dodge, Parry, Block, Resistances)
- General (Gear Score, Average iLevel, Health, Mana/Resource)

### 8.5 Bottom Tabs

Sub-tabs within the character screen (matching character_screen_sample2.png's bottom navigation tabs for Character, Reputation, Skills, and related sub-screens):

Our implementation:
- **Character** (stat view -- default)
- **Reputation** (faction standings)
- **Professions** (profession skill levels)
- **Achievements** (summary with point count)

Tab design: Horizontal strip at the bottom of the panel. Active tab has `--panel-bg` background, inactive tabs have `--panel-bg-alt` background with `--text-secondary` text. Active tab text is `--text-primary`. Gold underline (2px `--frame-border-outer`) on active tab.

### 8.6 Adapting for Idle Game Context

The character screen in an idle game has additional requirements beyond a traditional MMORPG:

1. **Idle DPS display:** A prominent "Estimated DPS: 1,035" readout in the stat panel header. This is the single most important number for an idle game player.
2. **Auto-equip toggle:** A button in the header area that toggles automatic gear upgrades on/off. When enabled, a small icon indicates auto-equip is active.
3. **Time-to-next-level:** Shown near the XP bar: "Next level in ~47 minutes".
4. **Gear Score prominently displayed:** A large number (e.g., "iLvl 73") displayed next to the character name, since gear score is the primary endgame progress metric.
5. **Buff bar:** A horizontal row of buff/debuff icons (24x24) displayed between the paper doll and the stat panel, showing active class buffs, potion effects, and zone bonuses.

---

## 9. Talent Tree Visual Design

Based on talent_tree_sample.png (hot oranges/browns/yellows with a lava background, aggressive combat-focused vertical tree with atmospheric background).

### 9.1 Overall Layout

The talent screen shows 3 specialization trees side by side. Each tree occupies approximately 1/3 of the content area width. Above the trees, a tab bar allows switching between specs or viewing all three simultaneously.

```
+------------------------------------------------------------------+
|  [Spec Tab 1]  [Spec Tab 2]  [Spec Tab 3]  |  Points: 31/51     |
|                                              |  [Respec: 50g]     |
+------------------------------------------------------------------+
|                |                |                                  |
|  SPEC TREE 1   |  SPEC TREE 2   |  SPEC TREE 3                   |
|  (scrollable)  |  (scrollable)  |  (scrollable)                  |
|                |                |                                  |
|  [Tier 1]      |  [Tier 1]      |  [Tier 1]                      |
|  [icons]       |  [icons]       |  [icons]                       |
|    |           |    |           |    |                            |
|  [Tier 2]      |  [Tier 2]      |  [Tier 2]                      |
|  [icons]       |  [icons]       |  [icons]                       |
|    |           |    |           |    |                            |
|  [Tier 3]      |  [Tier 3]      |  [Tier 3]                      |
|  ...           |  ...           |  ...                            |
|                |                |                                  |
+------------------------------------------------------------------+
```

### 9.2 Node Design

Each talent node is a **48x48 square** (40x40 icon + 4px border on each side) with a point counter beneath it.

Node anatomy:
```
+------+
|      |
| ICON |  <- 40x40 ability icon
|      |
+------+
 [0/5]    <- Point allocation counter, 12px, centered below
```

#### Node States (derived from talent_tree_sample.png analysis)

The reference image shows several distinct visual states:

**1. Locked (prerequisites not met):**
- Icon rendered at 40% brightness (apply CSS `brightness(0.4)`)
- Border: 1px `#2A2520`
- Background fill: `#0D0D12`
- Counter text: `--text-disabled` (#5A5040)
- Entire node has `opacity: 0.6`

**2. Available (can invest, 0 points spent):**
- Icon at full color/brightness
- Border: 1px `#8B7340`
- Background fill: `#1A1A1F`
- Counter text: `--text-primary` (#E8D5B0)
- On hover: Border brightens to `#C9A84C`, subtle gold pulse animation

**3. Partially Invested (some points, not maxed):**
- Icon at full color with warm overlay tint (+5% brightness)
- Border: 2px `#C9A84C`
- Background fill: `#1A1A1F`
- Counter text: `--stat-positive` (#1EFF00) -- green to indicate active investment
- Subtle inner glow (box-shadow: inset 0 0 8px `#C9A84C33`)

**4. Maxed (all points invested):**
- Icon at full color with golden glow overlay
- Border: 2px `#FFD700`
- Background fill: `#2A2520`
- Counter text: `--text-gold` (#FFD700)
- Outer glow: box-shadow 0 0 12px `#FFD70044`
- The top nodes in talent_tree_sample.png show this state with warm orange/yellow tinted backgrounds (the lit-up nodes against the lava backdrop)

**5. Capstone (Tier 5 -- ultimate talent):**
- Icon enlarged to 48x48 (displayed in a 56x56 frame)
- Ornate frame sprite instead of CSS border (unique golden filigree)
- When maxed: Animated shimmer effect on the frame (CSS animation, gold gradient sweep)
- Visually distinct from all other nodes to communicate importance

### 9.3 Connection Lines

Lines connect prerequisite nodes to their dependent nodes. Based on talent_tree_sample.png, connections are **orthogonal** (horizontal and vertical segments, no diagonals) with rounded elbows.

```
Line Styles:
- Inactive (locked):     1px dashed, #3D3529
- Available (can reach):  2px solid, #8B7340
- Invested (path taken):  2px solid, #C9A84C with subtle glow
- Fully maxed path:       2px solid, #FFD700 with glow
```

Connection rendering:
- Lines are drawn using HTML5 Canvas or SVG overlaid on the tree grid
- Lines route from the bottom-center of the parent node to the top-center of the child node
- When a node has multiple children, the line splits with a horizontal bar connecting the children

### 9.4 Tree Background

The talent_tree_sample.png shows a rich atmospheric background behind the nodes -- hot oranges and browns with lava-like cracks and ember accents. Additional references talent_tree_sample2.png (cool greens/teals, forest backdrop) and talent_tree_sample3.png (cool dark greens/blues, cyan highlights, starlit mystical) demonstrate per-spec atmospheric variation. Each specialization tree should have a **unique atmospheric background** that reflects its theme:

| Spec Theme    | Background Palette                        | Texture Notes                          |
|---------------|-------------------------------------------|----------------------------------------|
| Fire/Offense  | Deep reds, ember oranges, dark charcoal   | Lava-like cracks, ember particles      |
| Ice/Control   | Deep blues, frost whites, dark navy       | Crystalline patterns, mist             |
| Nature/Heal   | Deep greens, teal, dark forest            | Organic vines, leaf patterns           |
| Shadow/Dark   | Deep purples, blacks, sickly greens       | Smoky wisps, spectral shapes           |
| Holy/Light    | Warm golds, whites, dark amber            | Light rays, divine geometry            |
| Physical/War  | Steel grays, blood reds, dark iron        | Chain mail texture, weapon silhouettes |

Background is rendered as a 512x1024 pre-painted pixel art image, scrolling vertically with the tree. Nodes are composited on top. The background should be dark enough (average luminance under 15%) that the bright node icons remain the visual focus.

### 9.5 Talent Tooltip

Hovering a talent node shows a tooltip (using the standard tooltip frame) with:

```
+-- TALENT TOOLTIP (280px) -----+
|                                |
|  [Talent Name]                 |  <- --font-heading, --text-lg, white
|  Rank [Y/X]                   |  <- --text-secondary
|  [Tier Z talent]               |  <- --text-secondary
|                                |
|  ---- separator ----           |
|                                |
|  Current rank effect:          |  <- --text-secondary label
|  [Description of current rank] |  <- --text-primary
|                                |
|  Next rank effect:             |  <- --text-secondary label
|  [Description of next rank]    |  <- --stat-positive (green)
|                                |
|  ---- separator ----           |
|                                |
|  Requires: 10 points in        |  <- --text-secondary
|  [Tree Name]                   |
|                                |
+--------------------------------+
```

### 9.6 Point Investment Interaction

- **Left click** on an available node: Invest 1 point (if points available)
- **Right click** on an invested node: Remove 1 point (if no dependent talents would be invalidated)
- **Visual feedback:** Brief gold pulse animation on point investment. Counter number ticks up with a small scale-bounce (transform: scale(1.3) over 150ms, then back to 1.0)
- **Audio cue:** Subtle "clink" sound on invest, softer "whoosh" on remove

---

## 10. Component Library Specifications

### 10.1 Buttons

#### Primary Button (Gold)
```
Default:
  Background: linear-gradient(180deg, #8B7340 0%, #5C4D2E 100%)
  Border: 1px solid #C9A84C (top/left), 1px solid #3A2E1A (bottom/right)
  Text: #E8D5B0, --font-heading, --text-md, uppercase, letter-spacing: 0.05em
  Padding: 8px 24px
  Height: 40px
  Min-width: 120px

Hover:
  Background: linear-gradient(180deg, #A08550 0%, #6D5C38 100%)
  Text: #FFFFFF
  Cursor: pointer
  box-shadow: 0 0 8px #C9A84C44

Active (pressed):
  Background: linear-gradient(180deg, #5C4D2E 0%, #8B7340 100%)  <- inverted gradient
  Border: 1px solid #3A2E1A (top/left), 1px solid #C9A84C (bottom/right)
  Transform: translateY(1px)

Disabled:
  Background: #2A2520
  Border: 1px solid #3D3529
  Text: #5A5040
  Cursor: not-allowed
  Opacity: 0.7
```

#### Secondary Button (Dark)
```
Default:
  Background: #1A1A1F
  Border: 1px solid #5C4D2E
  Text: #A89878, --font-body, --text-base
  Padding: 6px 16px
  Height: 36px

Hover:
  Border: 1px solid #8B7340
  Text: #E8D5B0

Active:
  Background: #12121A
  Transform: translateY(1px)

Disabled:
  Same structure as primary disabled
```

#### Danger Button (Red)
```
Same structure as Primary but with red tones:
  Background gradient: #8B3333 to #5C1E1E
  Border highlight: #CC4444
  Hover glow: #CC444444
  Used for: Destroy item, Respec confirmation, Delete character
```

#### Icon Button (Sidebar, toolbar)
```
Default:
  Background: transparent
  Border: none
  Icon color: #A89878
  Size: 40x40px (icon 24x24 centered)

Hover:
  Background: #2A252033
  Icon color: #E8D5B0

Active:
  Background: #2A2520
  Icon color: #FFFFFF
  Left border: 3px solid #C9A84C (for sidebar variant)
```

### 10.2 Progress Bars

All progress bars share a common structural design.

#### XP Bar (Primary, always visible in header or status bar)

```
Container:
  Height: 20px
  Background: #1A0A2A (dark purple)
  Border: 1px solid #442266
  Border-radius: 0 (sharp corners -- MMORPG style)

Fill:
  Background: linear-gradient(180deg, #9955DD 0%, #6633AA 50%, #8844CC 100%)
  The top edge is slightly brighter for a glossy/convex effect
  Transition: width 500ms ease-out (smooth fill animation)

Label (overlaid on bar, centered):
  Text: "Level 42 - 67,230 / 125,000 XP"
  Font: --font-mono, --text-xs
  Color: #FFFFFF with 1px text-shadow #000000
  Always visible regardless of fill level

Rested XP indicator (if applicable):
  A lighter purple section extending beyond the current fill
  Color: #AA77EE at 50% opacity
```

#### Health Bar
```
Height: 20px (character panel), 8px (enemy/dungeon display)
Background: #3A0A0A
Fill: linear-gradient(180deg, #DD3333 0%, #AA1111 50%, #CC2222 100%)
Border: 1px solid #661111
Label: "12,450 / 15,000" centered in white with black shadow
```

#### Mana Bar
```
Height: 16px (slightly shorter than health -- visual hierarchy)
Background: #0A0A3A
Fill: linear-gradient(180deg, #3366DD 0%, #1144AA 50%, #2255CC 100%)
Border: 1px solid #112266
Label: "8,200 / 10,000" centered
```

#### Success Rate Bar (Dungeon browser)
```
Height: 24px
Background: #1A1A1F
Fill: Color varies by success chance:
  90-99%: Green gradient (#22AA44 to #116622)
  70-89%: Yellow gradient (#AAAA22 to #666611)
  60-69%: Orange gradient (#CC8822 to #664411)
  <60%:   Red gradient (#CC2222 to #661111)
Border: 1px solid matching darker tone
Label: "87% Success" centered, white text
```

### 10.3 Combat Log

The combat log is a scrolling text panel that shows real-time combat events. Based on classic MMORPG chat window design.

```
Container:
  Background: #0D0D12 with 90% opacity (slightly transparent)
  Border: Standard panel frame
  Height: 200-300px (resizable by dragging top edge)
  Width: 100% of its parent panel
  Padding: 8px

Text:
  Font: --font-mono, --text-sm (12px)
  Line-height: 1.6 (generous spacing for readability)
  Each line is a separate entry

Color coding per event type:
  Physical damage dealt:     #FFFFFF  "You hit Ogre Warchief for 342."
  Spell damage dealt:        #FFFF00  "Your Flamebolt hits Ogre Warchief for 1,247."
  Critical hit:              #FF4444  "Your Flamebolt crits Ogre Warchief for 2,831!"
  Damage received:           #FF8888  "Ogre Warchief hits you for 156."
  Healing received:          #00FF00  "Your Renewal heals you for 450."
  Buff applied:              #00CCFF  "You gain Empowering Word."
  Buff expired:              #808080  "Empowering Word fades."
  Loot (common):             #9D9D9D  "You receive [Cracked Mace]."
  Loot (uncommon):           #1EFF00  "You receive [Jade Pendant of the Bear]."
  Loot (rare):               #0070DD  "You receive [Duskfang Blade]!"
  Loot (epic):               #A335EE  "You receive [Shadowreaver's Edge]!"
  Loot (legendary):          #FF8000  "You receive [The Eternal Flame]!!"
  XP gain:                   #C8A2C8  "You gain 1,250 experience."
  Gold gain:                 #FFD700  "You receive 2g 45s 12c."
  System message:            #FFCC00  "You have entered Mistmoor Caverns."
  Quest progress:            #FFCC00  "Objective updated: Ogres slain (3/10)."

Item names in brackets are clickable (show tooltip on hover).
Loot lines for rare+ quality have a subtle text glow matching the quality color.

Scrollbar: Themed (see 5.1 scrollbar colors).
Auto-scroll: Enabled by default, pauses if user scrolls up, resumes on scroll-to-bottom.
Max lines retained: 500 (older lines culled for performance).
```

### 10.4 Navigation Tabs

Horizontal tab bar used within panels (e.g., Character screen sub-tabs, Inventory bag tabs).

```
Tab Bar Container:
  Background: #12121A
  Border-bottom: 2px solid #3D3529
  Height: 36px

Individual Tab:
  Default:
    Background: transparent
    Text: --text-secondary (#A89878), --font-body, --text-base
    Padding: 8px 20px
    Border-bottom: 2px solid transparent

  Hover:
    Text: --text-primary (#E8D5B0)
    Background: #1A1A1F22

  Active:
    Text: --text-primary (#E8D5B0)
    Border-bottom: 2px solid #C9A84C
    Background: #1A1A1F

  Disabled:
    Text: --text-disabled (#5A5040)
    Cursor: not-allowed
```

### 10.5 Modals and Dialogs

Used for confirmations (respec, sell item, Ascension), offline progress summary, and settings.

```
Backdrop:
  Background: #000000CC (80% opacity black)
  Backdrop-filter: blur(4px)
  Fade-in: 200ms

Modal Container:
  Width: 480px (small), 640px (medium), 800px (large)
  Max-height: 80vh
  Background: --panel-bg
  Border: Ornate frame (border-image sprite)
  box-shadow: 0 8px 32px #00000088
  Position: Centered (both axes)
  Animation: Scale from 0.95 to 1.0 + fade in, 200ms ease-out

Modal Header:
  Background: #12121A
  Padding: 16px 20px
  Border-bottom: 1px solid --separator
  Title: --font-heading, --text-lg, --text-primary
  Close button: 24x24 icon button, top-right corner

Modal Body:
  Padding: 20px
  Overflow-y: auto (if content exceeds max-height)

Modal Footer:
  Padding: 12px 20px
  Border-top: 1px solid --separator
  Button alignment: Right-aligned
  Button order: [Secondary / Cancel] [Primary / Confirm]
  Button gap: 12px
```

### 10.6 Toast Notifications

Slide-in notifications for achievement unlocks, level ups, and system messages.

```
Container:
  Position: Fixed, top-right corner, 16px from edges
  Width: 360px
  Background: #2A2520
  Border: 1px solid #8B7340
  Border-left: 4px solid (varies by type):
    Achievement: #FFD700 (gold)
    Level Up: #C8A2C8 (lilac)
    Loot: Quality color
    System: #FFCC00
    Error: #FF4444
  Padding: 12px 16px
  box-shadow: 0 4px 16px #00000066

Animation:
  Enter: Slide in from right, 300ms ease-out
  Duration: 5 seconds visible (configurable)
  Exit: Fade out, 300ms ease-in

Content:
  Icon: 32x32, left-aligned
  Title: --font-heading, --text-base, --text-primary
  Body: --font-body, --text-sm, --text-secondary
  Close button: 16x16, top-right

Stacking: Up to 3 visible simultaneously, newest on top, older shift down
```

### 10.7 Input Fields

Used in character creation (name input), search bars, and settings.

```
Default:
  Height: 36px
  Background: #0D0D12
  Border: 1px solid #3D3529
  Border-radius: 0
  Padding: 8px 12px
  Text: --font-body, --text-base, --text-primary
  Placeholder: --text-disabled

Focus:
  Border: 1px solid #8B7340
  box-shadow: 0 0 0 1px #8B734044
  Outline: none

Error:
  Border: 1px solid #CC2222
  box-shadow: 0 0 0 1px #CC222244
```

### 10.8 Dropdown / Select

```
Trigger (closed):
  Same visual treatment as Input Field
  Right-aligned chevron icon (12x12, --text-secondary)

Dropdown Panel (open):
  Background: --panel-bg
  Border: Standard panel frame
  box-shadow: 0 4px 16px #00000066
  Max-height: 240px, overflow-y: auto
  Z-index: 1000 (above tooltips)

Option:
  Default: Padding 8px 12px, --text-primary
  Hover: Background #2A2520, text --text-primary
  Selected: Background #2A2520, left border 2px #C9A84C, text --text-gold
```

---

## 11. Screen Wireframes -- Phase 1

### 11.1 Character Creation Screen

```
+==================================================================+
|                                                                    |
|              I D L E   M M O R P G                                 |
|              [ornate title treatment]                               |
|                                                                    |
+============================+=======================================+
|                            |                                       |
|   RACE SELECTION           |        CHARACTER PREVIEW               |
|                            |                                       |
|   [Grid of 8 race          |    +---------------------------+      |
|    portraits, 64x64 each,  |    |                           |      |
|    2 rows x 4 cols]        |    |   [256x512 character      |      |
|                            |    |    sprite preview,         |      |
|   Selected: [Valeborn]     |    |    updates live as         |      |
|   "+2 All Stats"           |    |    race/class changes]     |      |
|   "Ambition: +10% Quest XP"|    |                           |      |
|                            |    +---------------------------+      |
|----------------------------+                                       |
|                            |    Name: [________________]           |
|   CLASS SELECTION          |                                       |
|                            |    Starting Stats:                     |
|   [List of 9 classes,      |    STR: 12  [+][-]                    |
|    each with icon + name   |    AGI: 10  [+][-]                    |
|    + spec summary]         |    INT: 15  [+][-]   Points: 7/10    |
|                            |    SPI: 13  [+][-]                    |
|   Selected: [Arcanist]     |    STA: 11  [+][-]                    |
|   "INT, SPI"               |                                       |
|   "Spellweave | Pyromancy  |    Spec Preview:                      |
|    | Cryomancy"            |    [Spellweave] [Pyromancy] [Cryo]    |
|                            |    (choose at level 10)                |
+----------------------------+                                       |
|                            |    [  ENTER THE REALM  ]              |
|   [< Back]                 |    (Primary gold button)               |
|                            |                                       |
+============================+=======================================+
```

**Design Notes:**
- Full-screen layout, no sidebar navigation (creation is a pre-game flow)
- Race portraits use 64x64 pixel art headshots, arranged in a 2x4 grid, with the selected race highlighted with a gold border and enlarged to 96x96 above the grid
- Class list is a scrollable vertical list with 40x40 class icons, selected class highlighted with gold left border
- Character preview updates in real-time as selections change
- Stat allocation uses small +/- buttons with a remaining points counter
- "Enter the Realm" button is the largest UI element on screen, gold primary button, centered below the preview
- The background should be a dark atmospheric scene matching the selected race's starting zone

### 11.2 Main Hub Screen

This is the primary gameplay screen where players spend most of their time. It must communicate the idle game state at a glance.

```
+--+================================================================+
|N |                                                                  |
|A |  +--ZONE HEADER-------------------------------------------+     |
|V |  | [Zone Icon] Mistmoor Caverns  |  Lv 25-30  |  Quest 3/5|    |
|  |  +-------------------------------------------------------------+|
|S |                                                                  |
|I |  +--CHARACTER PANEL (left)--+  +--ACTIVITY PANEL (right)------+|
|D |  |                          |  |                               ||
|E |  | [128x256 char sprite]    |  |  Current Activity:            ||
|B |  |                          |  |  "Defeating Mistmoor Wraith"  ||
|A |  | Lv 27 Arcanist           |  |                               ||
|R |  | ====XP Bar========------ |  |  [Enemy portrait 64x64]       ||
|  |  | 67,230 / 125,000         |  |  Mistmoor Wraith  Lv 27      ||
|  |  |                          |  |  [===Health Bar====------]    ||
|  |  | [==Health Bar=========-] |  |                               ||
|  |  | [==Mana Bar===========-] |  |  DPS: 312.4    |  Kill: 4s   ||
|  |  |                          |  |  Gold/hr: 45g  |  XP/hr: 12K ||
|  |  | Buffs: [b1][b2][b3]     |  |                               ||
|  |  |                          |  +-------------------------------+|
|  |  | Gear Score: iLvl 34      |                                   |
|  |  +---------------------------+  +--COMBAT LOG-----------------+|
|  |                                 |  [scrolling combat text]     ||
|  |  +--QUEST TRACKER-----------+  |  You hit Wraith for 342.     ||
|  |  | [*] Cleanse the Moors    |  |  Your Flamebolt crits for    ||
|  |  |     Wraiths: 7/10        |  |  1,247!                      ||
|  |  | [ ] Collect Ectoplasm    |  |  You receive [Misty Ring].   ||
|  |  |     Ectoplasm: 3/5       |  |  You gain 450 XP.            ||
|  |  | [ ] Speak to Warden      |  |                               ||
|  |  +---------------------------+  +-------------------------------+|
|  |                                                                  |
+--+=================================================================+
|  Level 27 Pyromancy Arcanist | Mistmoor Caverns | 234g | 312 DPS   |
+=================================================================== +
```

**Design Notes:**
- The Hub is the default screen and the one players see most. It must prioritize:
  1. Current activity status (what is my character doing right now?)
  2. Progress metrics (XP bar, level, time-to-next-level)
  3. Idle efficiency stats (DPS, Gold/hr, XP/hr)
  4. Quest progress
  5. Combat log (for engagement/entertainment)
- Character Panel (left): Compact character view with bars and quick stats
- Activity Panel (right-top): Shows the current enemy being fought, with a portrait and health bar. When in a dungeon, this shows the dungeon progress (boss 2/3, current boss health)
- Combat Log (right-bottom): Scrolling colored text, the "heartbeat" of the game that makes it feel alive
- Quest Tracker (left-bottom): Active quest objectives with checkmarks and progress
- The zone header tints with the zone's accent color (see section 3.5)
- All panels are resizable by dragging dividers (stored in user preferences)

### 11.3 Character/Equipment Screen

See section 8 for the full specification. The wireframe:

```
+--+================================================================+
|N |                                                                  |
|A |  +--CHARACTER HEADER-----------------------------------------+  |
|V |  | Vex Nighthollow                    iLvl 73    [Auto-Equip]|  |
|  |  | Level 60 Pyromancy Arcanist                                |  |
|S |  | "Raider of Bifrost"                                        |  |
|I |  +------------------------------------------------------------+  |
|D |                                                                  |
|E |  +--EQUIP--+  +--PAPER DOLL--------+  +--EQUIP--------------+  |
|B |  | [Head]  |  |                      |  |  [Neck]   [MH Wpn] |  |
|A |  | [Shldr] |  |                      |  |  [Back]   [OH Wpn] |  |
|R |  | [Chest] |  |  [Character Sprite]  |  |  [Ring1]           |  |
|  |  | [Wrist] |  |  [256x512, layered]  |  |  [Ring2]           |  |
|  |  | [Hands] |  |                      |  |  [Trnk1]           |  |
|  |  | [Waist] |  |                      |  |  [Trnk2]           |  |
|  |  | [Legs]  |  |                      |  |                     |  |
|  |  | [Feet]  |  |                      |  |                     |  |
|  |  +---------+  +----------------------+  +---------------------+  |
|  |                                                                  |
|  |  +--BUFFS: [b1][b2][b3][b4][b5]---------------------------------+
|  |                                                                  |
|  |  +--SPELL STATS-----------+  +--MELEE STATS-----------------+  |
|  |  | Spell Power:       850 |  | Damage:          555-714     |  |
|  |  | Spell Healing:     620 |  | Attack Power:      1,140     |  |
|  |  | Mana Regen:         45 |  | Attack Speed:       3.63     |  |
|  |  | Critical Strike: 25.0% |  | Critical Strike:   26.3%     |  |
|  |  | Hit Chance:       8.0% |  | Hit Chance:         6.0%     |  |
|  |  | [v More...]            |  | [v More...]                  |  |
|  |  +------------------------+  +------------------------------+  |
|  |                                                                  |
|  |  [Character] [Reputation] [Professions] [Achievements]          |
+--+================================================================+
|  Level 60 Pyromancy Arcanist | Ascendant Terr. | 12,450g | 1,035 DPS|
+================================================================== +
```

### 11.4 Inventory Screen

```
+--+================================================================+
|N |                                                                  |
|A |  +--INVENTORY HEADER-----------------------------------------+  |
|V |  | Inventory          Gold: 12,450g 23s 44c    [Sort] [Sell] |  |
|  |  | Bag Space: 47 / 80      JP: 2,100    VP: 450              |  |
|S |  +------------------------------------------------------------+  |
|I |                                                                  |
|D |  +--BAG TABS-----+                                              |
|E |  | [All] [Bag1] [Bag2] [Bag3] [Bag4]                           |
|B |  +----------------+                                              |
|A |                                                                  |
|R |  +--INVENTORY GRID (8 columns x 10 rows)----------------------+  |
|  |  |                                                              |  |
|  |  | [52][52][52][52][52][52][52][52]  <- 52x52 slots, 4px gap   |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  | [52][52][52][52][52][52][52][52]                             |  |
|  |  |                                                              |  |
|  |  +--------------------------------------------------------------+  |
|  |                                                                  |
|  |  +--ITEM DETAIL (shown when item selected)--------------------+  |
|  |  | [Full tooltip display of selected item]                     |  |
|  |  | [Equip] [Sell] [Destroy]  <- context buttons                |  |
|  |  +-------------------------------------------------------------+  |
|  |                                                                  |
|  |  [Inventory] [Transmog Collection] [Currency]                   |
+--+================================================================+
```

**Design Notes:**
- 8-column grid at 1920x1080 (reduces to 6 columns at 1280x720)
- Slots are 52x52 (48px icon + 2px quality border)
- Gap between slots: 4px
- Items are drag-and-droppable (drag to equip, drag to trash icon to destroy)
- Sort button auto-organizes by: Quality (desc) > Type > iLevel (desc)
- Sell button opens a vendor trash confirmation: "Sell all Common items? (12 items, estimated 3g 45s)"
- Quality-colored borders on items. Empty slots show `#2A2520` background with no border
- Stack count shown bottom-right of stackable items (materials, potions): white text with black outline, --font-mono, --text-xs
- Selected item (clicked) gets a pulsing gold border and shows full detail in the bottom panel
- Right-click on any item shows tooltip immediately (no selection needed)

### 11.5 Talent Tree Screen

```
+--+================================================================+
|N |                                                                  |
|A |  +--TALENT HEADER--------------------------------------------+  |
|V |  | Talents    Points Available: 20  |  Total Spent: 31/51     |  |
|  |  |            [Respec: 50g]                                    |  |
|S |  +------------------------------------------------------------+  |
|I |                                                                  |
|D |  +--SPEC TABS-------------------------------------------------+  |
|E |  | [Spellweave (12)] | [Pyromancy (19)] | [Cryomancy (0)]     |  |
|B |  +------------------------------------------------------------+  |
|A |                                                                  |
|R |  +--TREE VIEW (scrollable vertically)-------------------------+  |
|  |  |                                                              |  |
|  |  |  [atmospheric background image per spec]                     |  |
|  |  |                                                              |  |
|  |  |  TIER 1 (0 pts required) ---- "Basic Enhancements" ----     |  |
|  |  |                                                              |  |
|  |  |     [Node]  [Node]  [Node]                                   |  |
|  |  |      5/5     3/3     0/2                                     |  |
|  |  |       |       |                                              |  |
|  |  |       +---+---+                                              |  |
|  |  |           |                                                  |  |
|  |  |  TIER 2 (5 pts required) ---- "Power Growth" ----------     |  |
|  |  |                                                              |  |
|  |  |     [Node]  [Node]                                           |  |
|  |  |      5/5     3/3                                             |  |
|  |  |       |       |                                              |  |
|  |  |  TIER 3 (10 pts required) ---- "Significant Modifiers" -    |  |
|  |  |                                                              |  |
|  |  |          [Node]  [Node]  [Node]                              |  |
|  |  |           3/3     0/3     0/2                                |  |
|  |  |            |                                                 |  |
|  |  |  TIER 4 (15 pts required) ---- "Build-Defining" --------    |  |
|  |  |                                                              |  |
|  |  |     [Node]  [Node]                                           |  |
|  |  |      0/1     0/3                                             |  |
|  |  |                                                              |  |
|  |  |  TIER 5 (20 pts required) ---- "CAPSTONE" --------------    |  |
|  |  |                                                              |  |
|  |  |          [CAPSTONE NODE]                                     |  |
|  |  |               0/1                                            |  |
|  |  |                                                              |  |
|  |  +--------------------------------------------------------------+  |
|  |                                                                  |
|  |  +--TALENT SUMMARY-------------------------------------------+  |
|  |  | DPS Impact: +23.4%  |  Healing: +0%  |  Survivability: +5% |  |
|  |  +------------------------------------------------------------+  |
+--+================================================================+
```

**Design Notes:**
- See section 9 for full visual design of nodes, connections, and backgrounds
- Spec tabs show the spec name and current point investment count
- Active spec tab is visually emphasized (gold border, brighter text)
- Tier requirement labels are rendered as horizontal rules with centered text
- The tree scrolls vertically if it exceeds the viewport
- A "Talent Summary" bar at the bottom shows the aggregate DPS/healing/survivability impact of current talent allocation -- important for idle game optimization
- On hover over any node, the talent tooltip appears (section 9.5)
- A "Recommended Build" button offers a preset allocation for players who prefer not to theorycraft

### 11.6 Offline Progress Summary Screen

This is the "welcome back" modal that appears when the player returns after being away. It is the single most important moment of satisfaction in an idle game.

```
+================================================================+
|                                                                  |
|        +----- OFFLINE PROGRESS SUMMARY -----+                   |
|        |                                      |                  |
|        |  Welcome back, Vex!                  |                  |
|        |  You were away for 8h 23m            |                  |
|        |                                      |                  |
|        |  +--LEVEL PROGRESS---------------+   |                  |
|        |  | Level 41 -> Level 43! (+2)     |   |                  |
|        |  | [===XP Bar================---] |   |                  |
|        |  | 89,200 / 200,000               |   |                  |
|        |  +--------------------------------+   |                  |
|        |                                      |                  |
|        |  +--STATS EARNED-----------------+   |                  |
|        |  | XP Earned:      +247,800       |   |                  |
|        |  | Gold Earned:    +523g 14s      |   |                  |
|        |  | Enemies Slain:  1,247          |   |                  |
|        |  | Quests Done:    3              |   |                  |
|        |  | Efficiency:     92%            |   |                  |
|        |  +--------------------------------+   |                  |
|        |                                      |                  |
|        |  +--ITEMS ACQUIRED---------------+   |                  |
|        |  | [icon] Jade Helm of the Bear   |   |                  |
|        |  |        Uncommon - Head         |   |                  |
|        |  | [icon] Mistweave Robe          |   |                  |
|        |  |        Rare - Chest  [NEW!]    |   |                  |
|        |  | [icon] Iron Ore x24            |   |                  |
|        |  | [icon] Potion of Speed x3      |   |                  |
|        |  | ... (scrollable if many items) |   |                  |
|        |  +--------------------------------+   |                  |
|        |                                      |                  |
|        |  +--QUESTS COMPLETED-------------+   |                  |
|        |  | [v] Cleanse the Moors          |   |                  |
|        |  | [v] Gather Mistbloom Herbs     |   |                  |
|        |  | [v] Warden's Errand            |   |                  |
|        |  +--------------------------------+   |                  |
|        |                                      |                  |
|        |  [ CLAIM ALL ]   [ REVIEW ITEMS ]    |                  |
|        |                                      |                  |
|        +--------------------------------------+                  |
|                                                                  |
+================================================================+
```

**Design Notes:**
- This is a centered modal (640px wide) over a dimmed backdrop
- Uses the ornate frame border for maximum visual impact
- The "Welcome back" header uses `--font-display` (Cinzel Decorative) at `--text-2xl`
- Duration display is prominent
- Level-up celebration: If the player gained levels, the level section gets a golden glow animation and the number change animates (count-up from old level to new level)
- Stats section: Numbers animate counting up from 0 to their final values over 1-2 seconds (idle game best practice for satisfying reveals)
- Items section: Items cascade in from the top, one by one, with a 100ms delay between each. Each item slides in and lands with a subtle bounce. Quality-colored names. Items marked "[NEW!]" in gold if they are upgrades over currently equipped gear
- "Claim All" is the primary gold button. "Review Items" is a secondary button that opens the inventory with new items highlighted
- If an Ascension was completed offline (unlikely but possible), this screen gets a special golden treatment with particle effects

---

## 12. Animation and Feedback Systems

### 12.1 Animation Timing Standards

| Duration  | Easing              | Usage                                    |
|-----------|---------------------|------------------------------------------|
| 100ms     | ease-out            | Button hover, icon brightness change     |
| 150ms     | ease-out            | Tooltip fade-in, small state changes     |
| 200ms     | ease-out            | Modal appear, panel slide                |
| 300ms     | ease-in-out         | Toast notification slide, tab switch     |
| 500ms     | ease-out            | Progress bar fill, XP gain animation     |
| 1000ms    | linear              | Shimmer/glow loops, ambient effects      |
| 2000ms    | ease-in-out         | Level-up burst, achievement banner       |

### 12.2 Key Feedback Moments

#### Level Up
1. XP bar fills to 100% (500ms ease-out)
2. Golden burst particle effect radiates from the XP bar (CSS radial gradient animation, 800ms)
3. Level number text scales up to 150% and flashes gold (300ms, then settles at 100%)
4. Toast notification: "Level 43!" with golden left border
5. XP bar resets and begins filling for next level
6. If talent point earned: Additional notification "Talent point available!"

#### Item Drop (in combat log)
1. Item name text appears in combat log with quality color
2. For Rare and above: The text line has a brief glow pulse (quality color at 30% opacity behind the text, fades over 500ms)
3. For Epic: Glow pulse is stronger (50% opacity), and a toast notification also appears
4. For Legendary: Full-screen golden flash (100ms at 10% opacity), sustained glow in combat log, toast notification with special golden frame, and a distinct sound cue

#### Gear Equip
1. Item icon animates from inventory slot to equipment slot (200ms translate + scale)
2. Old item icon animates from equipment slot to inventory (200ms translate)
3. Stat panel values that changed flash briefly:
   - Increased stats: Flash green for 500ms, then settle to white
   - Decreased stats: Flash red for 500ms, then settle to white
4. Gear Score number ticks up/down to new value (count animation, 300ms)

#### Achievement Unlock
1. A banner slides in from the top-center of the screen
2. Banner design: Gold ornate frame, achievement icon on the left, name + description on the right
3. Display duration: 4 seconds
4. Exit: Slide up and fade out
5. Achievement point count in the sidebar icon updates with a brief golden flash

#### Critical Hit (combat log)
1. Damage number text is displayed at 120% size (compared to normal hits)
2. Text color: `--combat-crit` (#FF4444)
3. A subtle screen shake: translateX(2px) oscillating for 100ms (optional, can be disabled in settings)
4. Exclamation mark appended to the log line

### 12.3 Ambient Animations

These run continuously and provide visual life to the interface:

- **XP bar shimmer:** A subtle bright highlight sweeps left-to-right across the XP bar fill every 3 seconds (CSS background-position animation on a gradient overlay)
- **Quality glow pulse:** Epic and Legendary items in the inventory have a slow, breathing glow effect (box-shadow opacity oscillates between 20% and 40% over 2 seconds)
- **Combat log scroll:** New lines fade in from 0% to 100% opacity over 200ms as they appear
- **Active buff timer:** Buff duration numbers tick down in real-time (update every second)
- **Idle indicator:** When no combat is active (between zones, waiting), a pulsing ellipsis animation on the activity text: "Traveling..." with dots cycling

---

## 13. Accessibility

### 13.1 Colorblind Support

**Mode 1: Deuteranopia (Red-Green) -- Most Common**
- Item quality indicators use shapes in addition to color (section 3.1)
- Stat positive/negative use UP ARROW / DOWN ARROW icons in addition to green/red
- Health and Mana bars are differentiated by pattern (health has subtle diagonal hatch, mana is solid)
- Combat log damage types are differentiated by prefix: "[Phys]", "[Spell]", "[Crit]", "[Heal]"

**Mode 2: Protanopia**
- Same shape-based system as Deuteranopia
- Quality colors shift to higher-contrast alternatives:
  - Uncommon: `#FFD700` (gold) instead of green
  - Rare: `#3399FF` (brighter blue)
  - Epic: `#CC66FF` (lighter purple)

**Mode 3: Tritanopia (Blue-Yellow)**
- Rare quality shifts to `#00CCCC` (cyan)
- Gold text shifts to `#FFAA00` (amber)
- Mana bar shifts to `#CC33CC` (magenta)

All colorblind modes are selectable in Settings. The selected mode applies CSS custom property overrides globally.

### 13.2 Text Readability

- Minimum body text size: 12px (never smaller for any gameplay-relevant text)
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (WCAG AA)
- All text on dark backgrounds meets or exceeds these ratios:
  - `--text-primary` (#E8D5B0) on `--panel-bg` (#1A1A1F) = contrast ratio ~11:1
  - `--text-secondary` (#A89878) on `--panel-bg` (#1A1A1F) = contrast ratio ~5.5:1
  - `--text-disabled` (#5A5040) on `--panel-bg` (#1A1A1F) = contrast ratio ~2.5:1 (intentionally low -- disabled state)
- Text shadow (1px black) on all text overlaid on variable backgrounds (progress bars, sprites)
- Font scaling option in settings: 90%, 100%, 110%, 120% (applies rem-based scaling to all text)

### 13.3 Keyboard Navigation

- All interactive elements are focusable via Tab key
- Focus indicator: 2px `#3399FF` outline with 2px offset (visible on dark backgrounds)
- Equipment slots navigable via arrow keys when focused
- Talent tree navigable via arrow keys (moves between connected nodes)
- Escape key closes modals, tooltips, and context menus
- Enter key activates focused buttons and invests talent points
- Shortcut keys:
  - `C` - Character screen
  - `I` - Inventory
  - `T` - Talents
  - `Q` - Quest journal
  - `D` - Dungeon browser
  - `P` - Professions
  - `A` - Achievements
  - `Esc` - Return to Hub / Close modal

### 13.4 Screen Reader Support

- All icons have descriptive `aria-label` attributes
- Equipment slots announce: "Head slot: [Item Name], [Quality], Item Level [N]"
- Combat log entries are announced via `aria-live="polite"` region
- Level-up and achievement notifications use `aria-live="assertive"`
- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

---

## 14. Asset Production Pipeline

### 14.1 Required Asset List (Phase 1)

#### UI Chrome Assets
| Asset                        | Format | Size        | Count | Priority |
|------------------------------|--------|-------------|-------|----------|
| Ornate frame 9-slice         | PNG    | 128x128     | 1     | P0       |
| Standard frame (CSS only)    | --     | --          | --    | P0       |
| Panel background texture     | PNG    | 128x128     | 2     | P0       |
| Scrollbar sprites            | PNG    | 16x64       | 1     | P1       |
| Button texture (gold)        | PNG    | 128x48      | 1     | P1       |

#### Character Sprites
| Asset                        | Format | Size        | Count | Priority |
|------------------------------|--------|-------------|-------|----------|
| Base body (per race+gender)  | PNG    | 256x512     | 16    | P0       |
| Gear layer (per slot+quality)| PNG    | 256x512     | ~200  | P1       |
| Combat view (per race)       | PNG    | 128x256     | 16    | P1       |

#### Icon Assets
| Asset                        | Format | Size        | Count | Priority |
|------------------------------|--------|-------------|-------|----------|
| Navigation sidebar icons     | SVG    | 24x24       | 9     | P0       |
| Equipment slot silhouettes   | PNG    | 48x48       | 15    | P0       |
| Item icons (Phase 1 items)   | PNG    | 48x48       | ~150  | P0       |
| Ability icons (all classes)  | PNG    | 40x40       | ~100  | P1       |
| Buff/debuff icons            | PNG    | 24x24       | ~40   | P1       |
| Currency icons               | PNG    | 16x16       | 5     | P0       |
| Colorblind shape indicators  | SVG    | 8x8         | 5     | P0       |
| Stat arrow icons (up/down)   | SVG    | 10x10       | 2     | P0       |

#### Talent Tree Assets
| Asset                        | Format | Size        | Count | Priority |
|------------------------------|--------|-------------|-------|----------|
| Tree background (per spec)   | PNG    | 512x1024    | 27    | P2       |
| Capstone node frame          | PNG    | 56x56       | 1     | P1       |
| Placeholder backgrounds      | PNG    | 512x1024    | 3     | P0       |

#### Boss/Enemy Sprites
| Asset                        | Format | Size        | Count | Priority |
|------------------------------|--------|-------------|-------|----------|
| Zone enemy portraits         | PNG    | 64x64       | ~30   | P1       |
| Dungeon boss portraits       | PNG    | 256x256     | ~30   | P2       |
| Boss full body (raids)       | PNG    | 384x512     | ~10   | P2       |

### 14.2 Naming Conventions

```
Sprites:
  char_{race}_{gender}_base.png           (e.g., char_valeborn_male_base.png)
  char_gear_{slot}_{quality}_{id}.png     (e.g., char_gear_chest_epic_042.png)
  enemy_{zone}_{name}.png                 (e.g., enemy_mistmoor_wraith.png)
  boss_{dungeon}_{name}_portrait.png      (e.g., boss_shadowspire_golem_portrait.png)
  boss_{dungeon}_{name}_full.png          (e.g., boss_shadowspire_golem_full.png)

Icons:
  icon_item_{type}_{id}.png               (e.g., icon_item_sword_015.png)
  icon_ability_{class}_{name}.png         (e.g., icon_ability_arcanist_flamebolt.png)
  icon_buff_{name}.png                    (e.g., icon_buff_empowering_word.png)
  icon_nav_{screen}.svg                   (e.g., icon_nav_inventory.svg)
  icon_currency_{type}.png                (e.g., icon_currency_gold.png)

UI:
  ui_frame_ornate.png
  ui_frame_capstone.png
  ui_texture_panel_dark.png
  ui_texture_panel_warm.png
  ui_scrollbar.png

Talent Backgrounds:
  talent_bg_{class}_{spec}.png            (e.g., talent_bg_arcanist_pyromancy.png)
```

### 14.3 Sprite Sheet Strategy

For icons that appear in quantity (item icons, ability icons), pack them into sprite sheets to reduce HTTP requests and improve rendering performance:

- **Item icon sheet:** 48x48 icons packed into 768x768 sheets (16x16 grid = 256 icons per sheet)
- **Ability icon sheet:** 40x40 icons packed into 640x640 sheets (16x16 grid = 256 icons per sheet)
- **Buff icon sheet:** 24x24 icons packed into 384x384 sheets (16x16 grid = 256 icons per sheet)

CSS sprite positioning or a JSON atlas file maps icon IDs to sheet coordinates.

### 14.4 Placeholder Strategy (for development before art is complete)

Until pixel art assets are produced, use colored rectangles with text labels:

- Item icons: Colored square matching quality color, white text label of item type ("Sword", "Helm")
- Character sprites: Gray silhouette outline on transparent background
- Ability icons: Class-colored square with abbreviated ability name
- Backgrounds: Solid color fills matching zone palette (section 3.5)
- Boss portraits: Red-bordered square with "BOSS" text

All placeholder assets must use the exact same dimensions and naming conventions as final assets to enable seamless replacement.

---

## Appendix A: CSS Custom Properties Master List

```css
:root {
  /* Item Quality */
  --quality-common: #9D9D9D;
  --quality-uncommon: #1EFF00;
  --quality-rare: #0070DD;
  --quality-epic: #A335EE;
  --quality-legendary: #FF8000;

  /* UI Chrome */
  --panel-bg: #1A1A1F;
  --panel-bg-alt: #12121A;
  --panel-bg-inset: #0D0D12;
  --frame-border-outer: #8B7340;
  --frame-border-inner: #5C4D2E;
  --frame-border-highlight: #C9A84C;
  --frame-border-shadow: #3A2E1A;
  --separator: #3D3529;
  --scrollbar-track: #252530;
  --scrollbar-thumb: #5C4D2E;
  --scrollbar-thumb-hover: #8B7340;

  /* Text */
  --text-primary: #E8D5B0;
  --text-secondary: #A89878;
  --text-disabled: #5A5040;
  --text-gold: #FFD700;
  --text-xp: #C8A2C8;
  --text-system: #FFCC00;
  --text-error: #FF4444;
  --text-link: #3399FF;

  /* Stats */
  --stat-positive: #1EFF00;
  --stat-negative: #FF3333;
  --stat-neutral: #FFFFFF;

  /* Combat Log */
  --combat-phys: #FFFFFF;
  --combat-spell: #FFFF00;
  --combat-crit: #FF4444;
  --combat-heal: #00FF00;
  --combat-buff: #00CCFF;

  /* Resource Bars */
  --bar-health-fill: #CC2222;
  --bar-health-bg: #3A0A0A;
  --bar-health-border: #661111;
  --bar-mana-fill: #2255CC;
  --bar-mana-bg: #0A0A3A;
  --bar-mana-border: #112266;
  --bar-energy-fill: #CCCC22;
  --bar-energy-bg: #3A3A0A;
  --bar-energy-border: #666611;
  --bar-rage-fill: #CC2222;
  --bar-rage-bg: #3A0A0A;
  --bar-rage-border: #661111;
  --bar-xp-fill: #8844CC;
  --bar-xp-bg: #1A0A2A;
  --bar-xp-border: #442266;

  /* Typography */
  --font-display: "Cinzel Decorative", "Cinzel", Georgia, serif;
  --font-heading: "Cinzel", Georgia, "Times New Roman", serif;
  --font-body: "Inter", "Segoe UI", Roboto, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", Consolas, "Courier New", monospace;

  /* Type Scale */
  --text-xs: 0.625rem;   /* 10px */
  --text-sm: 0.75rem;    /* 12px */
  --text-base: 0.875rem; /* 14px */
  --text-md: 1rem;       /* 16px */
  --text-lg: 1.25rem;    /* 20px */
  --text-xl: 1.5rem;     /* 24px */
  --text-2xl: 1.875rem;  /* 30px */
  --text-3xl: 2.5rem;    /* 40px */

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;

  /* Borders */
  --radius-none: 0;  /* Default -- MMORPG style uses sharp corners */
  --radius-sm: 2px;  /* Only for very specific elements like toast notifications */

  /* Z-Index Layers */
  --z-base: 0;
  --z-panel: 10;
  --z-dropdown: 100;
  --z-tooltip: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-toast: 500;

  /* Transitions */
  --transition-fast: 100ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-in-out;
  --transition-bar: 500ms ease-out;
}
```

---

## Appendix B: Reference Image Analysis Summary

| Reference File             | Key Takeaways for Our Design                                    |
|----------------------------|------------------------------------------------------------------|
| `character_sprite_sample.png`  | Dark armored knight, muted browns/blacks, red sash, purple gem. Semi-realistic proportions, dithered shading, material diversity, grim ceremonial aesthetic |
| `character_sprite_sample2.png` | Blue/teal mage-knight, cyan glowing shoulders and chest gem. Regal arcane aesthetic, rich material differentiation, specular metal highlights |
| `character_sprite_sample3.png` | Dark occult boss sprite, orange glowing runes, green vials. Menacing, high-detail, imposing scale, unique silhouette, rich color palette for boss-level sprites |
| `character_sprite_sample4.png` | Dark iron knight with red plume, layered metal armor. Stoic disciplined aesthetic, excellent armor plate shading, dithered metal rendering |
| `character_screen_sample.png`  | Dark gray-brown UI frame, muted character, icon slots, stat blocks. Old-school RPG character panel layout |
| `character_screen_sample2.png` | Warm browns/reds/oranges, detailed character portrait, dense UI framing. Gritty heroic, gold/brown ornate border, equipment slots flanking character, two-column stat layout, bottom tabs |
| `character_screen_sample3.png` | Warm golds/browns, snow particle effect. Adventurous whimsical character screen variant |
| `character_screen_sample4.png` | Muted reds/browns/grays, 16-bit style. Gritty old-school RPG character panel with retro pixel density |
| `character_screen_sample5.png` | Dark brown/bronze frame, dense icon ring, gothic fantasy hardcore RPG. Equipment slot ring layout reference |
| `item_tooltip_sample.png`      | Dark background, warm beige/orange text, arcane flavor text. WoW-style tooltip with quality-colored name, stat hierarchy, slot/level metadata |
| `legendary_weapon_tooltip.png` | Dark panel, high-contrast white/green text, epic verbose style. Confirms tooltip structure consistency, icon placement, effect descriptions |
| `dagger_tooltip_sample.png`    | Deep navy panel, white/cyan text, green stats. Technical tooltip variant with clean stat layout |
| `trinket_tooltip_sample.png`   | Dark blue-gray, white main text, green effect text. Accessory tooltip reference with effect-heavy layout |
| `trinket_tooltip_sample2.png`  | Dark panel, white/blue/green text, colored item icon. Confirms tooltip icon placement in top-right, quality flags |
| `spell_book_sample.png`        | Warm parchment, rich colored spell icons, brown frame. Cozy magical ability/spell UI reference |
| `spell_book_sample2.png`       | Parchment with cooler accents, staff illustration, aged page edges. Alternative spell UI with aged parchment texture |
| `talent_tree_sample.png`       | Hot oranges/browns/yellows, lava background. Aggressive combat-focused vertical tree, atmospheric painted background, square nodes, investment counters, orthogonal connections |
| `talent_tree_sample2.png`      | Cool greens/teals, forest backdrop. Calm exploratory talent tree, demonstrates per-spec atmospheric variation |
| `talent_tree_sample3.png`      | Cool dark greens/blues, cyan highlights, starlit mystical. Additional per-spec background variant reference |
| `quest_log_sample.png`         | Dark UI frame, yellow headers, cyan/white text. Functional archaic quest log with dense text layout |

---

## Appendix C: Design Decision Log

| Decision                              | Rationale                                                     | Date       |
|---------------------------------------|---------------------------------------------------------------|------------|
| Sharp corners (no border-radius)      | Matches WoW/EQ2 era UI aesthetic; softened corners feel modern and break the illusion | 2026-02-08 |
| 14px base font (not 16px)             | Information density is a priority; 14px is readable and allows more data on screen | 2026-02-08 |
| Dithered pixel art over smooth sprites| Ref images use dithering; it is the defining visual characteristic of this art style | 2026-02-08 |
| No border-image for standard panels   | CSS box-shadow bevel is more performant and resolution-independent; border-image reserved for ornate/major frames | 2026-02-08 |
| Fixed 320px tooltip width             | Prevents tooltips from being too narrow (unreadable) or too wide (obscuring content); matches EQ2 tooltip proportions | 2026-02-08 |
| Count-up animation on offline summary | Idle game best practice -- revealing numbers gradually creates anticipation and satisfaction | 2026-02-08 |
| Monospace font for stats/combat       | Tabular number alignment is mandatory for stat comparison readability | 2026-02-08 |
| Cinzel for headers                    | Best available open-source medieval serif; alternatives evaluated: Trajan (not free), MedievalSharp (too decorative for readability) | 2026-02-08 |

---

*End of Art Style Guide. This document is maintained by @idle-mmo-ui-designer and should be consulted before any visual implementation work begins. Changes require review and version increment.*
