# Phase 2.5 -- Art Generation & Prototype Review (Tasks Art1-Art4)

> Part of the [Phase 2 Implementation Plan](plan-index.md) | **Status:** Pending
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Phase 2.5 sits between Phase 2 and Phase 3.** All Phase 2 engine and UI work is complete. This phase generates visual assets with the art engine, wires them into the working game, and conducts a playtest review before Phase 3 meta-progression work begins.

**Art engine location:** `tools/art-engine/`
**Art engine capabilities:** Pixel grid rendering, palette system, icon generation (templates + quality tiers + shading), PNG export, CLI-driven batch generation.

---

## Task Art1 -- Item Icon Generation Sprint

**Goal:** Generate pixel art icons for all item types across quality tiers.

### Step Art1.1 -- Define icon generation manifest

**File:** `tools/art-engine/manifests/item-icons.json`

Manifest listing all icons to generate:
- **Gear icons:** 16 gear slots x 5 quality tiers = 80 icons
- **Weapon icons:** 13 weapon types x 5 quality tiers = 65 icons
- **Material icons:** ~60 materials (6 tiers x 3 gathering types + extras)
- **Consumable icons:** ~20 (potions, elixirs, flasks, food, bandages)
- **Currency icons:** 3 (gold, justice points, valor points)
- **Misc icons:** enchantment scrolls, tier tokens, quest items

Total: ~230 icons

### Step Art1.2 -- Extend art engine templates

Add new icon templates to `tools/art-engine/src/icons/templates.ts` for:
- Material categories (ore, herb, leather, cloth, gems, reagents)
- Consumable categories (potion bottle, elixir vial, flask, food plate, bandage)
- Currency coins/tokens
- Enchantment scroll

### Step Art1.3 -- Batch generate icons

Run CLI: `pnpm art-engine icons --manifest manifests/item-icons.json --output assets/icons/`

### Step Art1.4 -- Verify output and commit

Verify icon quality, check dimensions (32x32 base, 64x64 retina), confirm palette consistency.

Commit: `art(icons): generate item, material, consumable, and currency icons`

---

## Task Art2 -- Monster Portraits & Zone Art

**Goal:** Generate monster portrait thumbnails and zone banner artwork.

### Step Art2.1 -- Add portrait generation to art engine

**File:** `tools/art-engine/src/portraits/generate.ts`

New module for generating monster portrait thumbnails (48x48 or 64x64). Uses existing pixel grid and palette systems. Templates for monster subtypes:
- Beast: animal silhouettes (wolf, bear, spider, drake)
- Humanoid: armored figure silhouettes (bandit, orc, knight)
- Elemental: amorphous energy shapes (fire, ice, void)
- Undead: skeletal/ghostly silhouettes
- Construct: geometric/mechanical shapes
- Dragonkin: dragon head profiles

### Step Art2.2 -- Generate monster portraits

Manifest: `tools/art-engine/manifests/monster-portraits.json`
~70 unique monsters from zone data files.

Run: `pnpm art-engine portraits --manifest manifests/monster-portraits.json --output assets/portraits/`

### Step Art2.3 -- Add zone banner generation

**File:** `tools/art-engine/src/zones/generate.ts`

Generate zone banner images (320x64 or similar) with palette-matched backgrounds for each zone theme. 12 zones x 1 banner each.

### Step Art2.4 -- Generate zone banners

Run: `pnpm art-engine zones --manifest manifests/zone-banners.json --output assets/zones/`

### Step Art2.5 -- Commit

Commit: `art(portraits): generate monster portraits and zone banner artwork`

---

## Task Art3 -- UI Chrome & Faction Emblems

**Goal:** Generate UI decorative elements and faction identity art.

### Step Art3.1 -- Generate UI chrome elements

Elements needed:
- Panel borders / frame corners (dark MMORPG aesthetic)
- Button states (normal, hover, pressed, disabled)
- Tab backgrounds
- Tooltip frames
- Progress bar fill textures
- Quality tier border colors (Common gray, Uncommon green, Rare blue, Epic purple, Legendary orange)
- Inventory slot backgrounds

### Step Art3.2 -- Generate faction emblems

14 faction emblems (64x64 each). One per faction using zone-appropriate color palettes and symbolic motifs (shield for military, leaf for nature, skull for undead hunters, etc.).

### Step Art3.3 -- Generate dungeon/raid banner icons

14 content icons: 10 dungeon + 4 raid, each with a thematic thumbnail.

### Step Art3.4 -- Commit

Commit: `art(ui): generate UI chrome, faction emblems, and content icons`

---

## Task Art4 -- Asset Integration & Prototype Playtest

**Goal:** Wire all generated assets into the React UI and conduct a full prototype review.

### Step Art4.1 -- Create asset manifest/loader

**File:** `src/renderer/assets/asset-manifest.ts`

Type-safe asset loader that maps game IDs to asset file paths:
- `getItemIcon(slot, quality)` -> path
- `getMonsterPortrait(monsterId)` -> path
- `getZoneBanner(zoneId)` -> path
- `getFactionEmblem(factionId)` -> path

### Step Art4.2 -- Wire icons into inventory/gear UI

Modify `src/renderer/components/inventory/` and equipment display:
- Item icons in inventory grid cells
- Quality-tier border colors on item icons
- Weapon type icons in equipment slots

### Step Art4.3 -- Wire portraits into combat/dungeon UI

- Monster portrait in combat display
- Boss portraits in dungeon browser and run results
- Zone banner in zone header area

### Step Art4.4 -- Wire UI chrome

- Replace placeholder panel borders with generated frames
- Apply quality-tier border textures
- Add faction emblems to reputation panel

### Step Art4.5 -- Build and run prototype

Run: `pnpm dev` (Electron dev mode)

### Step Art4.6 -- Playtest review checklist

Conduct hands-on review and document findings:

**Game Loop:**
- [ ] Does leveling 1-60 feel paced well?
- [ ] Is combat engaging or just a stat check?
- [ ] Does gear progression create anticipation?
- [ ] Do quest chains add narrative interest?

**Dungeon/Raid Content:**
- [ ] Does per-boss success feel meaningful?
- [ ] Is dungeon difficulty appropriately tuned?
- [ ] Do lockouts create healthy return cadence?

**Professions:**
- [ ] Does gathering feel like passive progress?
- [ ] Is crafting queue satisfying?
- [ ] Does crafted gear serve as effective catch-up?

**Reputation:**
- [ ] Do factions provide clear goals?
- [ ] Are vendor rewards worth pursuing?
- [ ] Do daily quests feel fresh or repetitive?

**Visual Quality:**
- [ ] Do pixel art icons read well at UI scale?
- [ ] Does monster art communicate threat level?
- [ ] Does UI chrome match the dark MMORPG aesthetic?
- [ ] Is quality tier color-coding clear?

**Performance:**
- [ ] Worker thread handling load well?
- [ ] UI responsive during dungeon runs?
- [ ] Save file size reasonable with all new data?

### Step Art4.7 -- Document findings

**File:** `docs/plans/phase2_5-playtest-findings.md`

Capture all issues, balance concerns, and improvement ideas for Phase 3 consideration.

### Step Art4.8 -- Commit

Commit: `feat(art): integrate all assets into UI and document playtest findings`
