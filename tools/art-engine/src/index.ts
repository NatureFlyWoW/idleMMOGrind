// Core
export { createPixelGrid, rgba, rgbaEqual, TRANSPARENT, BLACK, WHITE } from './core/pixel-grid.js';
export type { PixelGrid, RGBA } from './core/pixel-grid.js';
export { createRNG } from './core/seed.js';
export type { SeededRNG } from './core/seed.js';
export { createPalette, createPaletteFromHex, parseHex, colorDistance } from './core/palette.js';
export type { Palette } from './core/palette.js';
export { drawLine, drawRect, drawEllipse, floodFill } from './core/primitives.js';
export { orderedDither, quantize } from './core/dither.js';
export { exportPNG, exportSpriteSheet } from './core/export.js';

// Palettes
export { QUALITY_COLORS, MATERIAL_RAMPS, ZONE_PALETTES, getMaterialPalette } from './palettes/game-palettes.js';
export type { QualityTier, MaterialType } from './palettes/game-palettes.js';

// Icons
export { generateIcon } from './icons/generate.js';
export { loadTemplate, listTemplates } from './icons/templates.js';
export type { IconGenerationParams, IconTemplate, IconCategory, ElementType } from './icons/types.js';
