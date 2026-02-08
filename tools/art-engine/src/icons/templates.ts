/**
 * Icon template loading and management.
 *
 * Templates define the silhouette shape and material regions for each icon type.
 * Templates can be loaded from JSON data files or defined programmatically.
 */

import { type IconTemplate, type IconCategory, type ShapeRegion } from './types.js';
import { type MaterialType } from '../palettes/game-palettes.js';

// Programmatically defined templates for Phase A
// JSON file loading can be added later for user-authored templates

const TEMPLATES: Record<string, Record<string, IconTemplate>> = {
  weapon: {},
};

/**
 * Create a 48x48 longsword silhouette template programmatically.
 * The sword is oriented diagonally (bottom-left to top-right) for visual interest.
 */
function createLongswordTemplate(): IconTemplate {
  const W = 48;
  const H = 48;
  const silhouette: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false) as boolean[]);
  const bladePixels: [number, number][] = [];
  const hiltPixels: [number, number][] = [];
  const guardPixels: [number, number][] = [];
  const pommelPixels: [number, number][] = [];

  // Blade: a diagonal band from top-right area down to center
  for (let i = 0; i < 28; i++) {
    const cx = 35 - Math.floor(i * 0.65);
    const cy = 5 + i;
    for (let dx = -2; dx <= 2; dx++) {
      const x = cx + dx;
      const y = cy;
      if (x >= 0 && x < W && y >= 0 && y < H) {
        silhouette[y]![x] = true;
        bladePixels.push([x, y]);
      }
    }
  }

  // Guard: horizontal bar at the blade/hilt junction
  const guardY = 32;
  for (let x = 13; x <= 27; x++) {
    for (let dy = 0; dy < 3; dy++) {
      const y = guardY + dy;
      if (y < H) {
        silhouette[y]![x] = true;
        guardPixels.push([x, y]);
      }
    }
  }

  // Hilt: short segment below guard
  for (let i = 0; i < 8; i++) {
    const cx = 18 - Math.floor(i * 0.4);
    const cy = 35 + i;
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx;
      const y = cy;
      if (x >= 0 && x < W && y >= 0 && y < H) {
        silhouette[y]![x] = true;
        hiltPixels.push([x, y]);
      }
    }
  }

  // Pommel: small circle at the bottom of hilt
  const pommelCx = 15;
  const pommelCy = 43;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy <= 5) {
        const x = pommelCx + dx;
        const y = pommelCy + dy;
        if (x >= 0 && x < W && y >= 0 && y < H) {
          silhouette[y]![x] = true;
          pommelPixels.push([x, y]);
        }
      }
    }
  }

  return {
    name: 'longsword',
    category: 'weapon',
    size: { width: W, height: H },
    silhouette,
    regions: [
      { name: 'blade', pixels: bladePixels, material: 'iron' as MaterialType, depth: 0.8 },
      { name: 'guard', pixels: guardPixels, material: 'gold' as MaterialType, depth: 0.6 },
      { name: 'hilt', pixels: hiltPixels, material: 'leather' as MaterialType, depth: 0.4 },
      { name: 'pommel', pixels: pommelPixels, material: 'gold' as MaterialType, depth: 0.7 },
    ],
    lightingAngle: 315,
  };
}

function createAxeTemplate(): IconTemplate {
  const W = 48;
  const H = 48;
  const silhouette: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false) as boolean[]);
  const headPixels: [number, number][] = [];
  const handlePixels: [number, number][] = [];

  // Axe head: broad crescent shape in upper-right area
  for (let y = 6; y < 26; y++) {
    const width = Math.round(8 + 6 * Math.sin(((y - 6) / 20) * Math.PI));
    const startX = 28 - Math.floor(width / 2);
    for (let x = startX; x < startX + width; x++) {
      if (x >= 0 && x < W && y >= 0 && y < H) {
        silhouette[y]![x] = true;
        headPixels.push([x, y]);
      }
    }
  }

  // Handle: long straight shaft
  for (let y = 20; y < 45; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = 20 + dx;
      if (x >= 0 && x < W && y < H) {
        silhouette[y]![x] = true;
        handlePixels.push([x, y]);
      }
    }
  }

  return {
    name: 'axe',
    category: 'weapon',
    size: { width: W, height: H },
    silhouette,
    regions: [
      { name: 'blade', pixels: headPixels, material: 'iron' as MaterialType, depth: 0.9 },
      { name: 'hilt', pixels: handlePixels, material: 'wood' as MaterialType, depth: 0.3 },
    ],
    lightingAngle: 315,
  };
}

function createDaggerTemplate(): IconTemplate {
  const W = 48;
  const H = 48;
  const silhouette: boolean[][] = Array.from({ length: H }, () => Array(W).fill(false) as boolean[]);
  const bladePixels: [number, number][] = [];
  const hiltPixels: [number, number][] = [];
  const guardPixels: [number, number][] = [];

  // Dagger blade: narrow, diagonal
  for (let i = 0; i < 22; i++) {
    const cx = 32 - Math.floor(i * 0.55);
    const cy = 6 + i;
    for (let dx = -1; dx <= 1; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < W && cy < H) {
        silhouette[cy]![x] = true;
        bladePixels.push([x, cy]);
      }
    }
  }

  // Guard
  const gy = 28;
  for (let x = 15; x <= 25; x++) {
    for (let dy = 0; dy < 2; dy++) {
      if (gy + dy < H) {
        silhouette[gy + dy]![x] = true;
        guardPixels.push([x, gy + dy]);
      }
    }
  }

  // Hilt
  for (let i = 0; i < 10; i++) {
    const cx = 19 - Math.floor(i * 0.3);
    const cy = 30 + i;
    for (let dx = -1; dx <= 0; dx++) {
      const x = cx + dx;
      if (x >= 0 && x < W && cy < H) {
        silhouette[cy]![x] = true;
        hiltPixels.push([x, cy]);
      }
    }
  }

  return {
    name: 'dagger',
    category: 'weapon',
    size: { width: W, height: H },
    silhouette,
    regions: [
      { name: 'blade', pixels: bladePixels, material: 'iron' as MaterialType, depth: 0.8 },
      { name: 'guard', pixels: guardPixels, material: 'gold' as MaterialType, depth: 0.6 },
      { name: 'hilt', pixels: hiltPixels, material: 'leather' as MaterialType, depth: 0.3 },
    ],
    lightingAngle: 315,
  };
}

// Register all templates
TEMPLATES['weapon']!['longsword'] = createLongswordTemplate();
TEMPLATES['weapon']!['axe'] = createAxeTemplate();
TEMPLATES['weapon']!['dagger'] = createDaggerTemplate();

/** List available template names for a category */
export function listTemplates(category: IconCategory): string[] {
  return Object.keys(TEMPLATES[category] ?? {});
}

/** Load a template by category and name. Throws if not found. */
export function loadTemplate(category: IconCategory, name: string): IconTemplate {
  const categoryTemplates = TEMPLATES[category];
  if (!categoryTemplates) {
    throw new Error(`Unknown icon category: ${category}`);
  }
  const template = categoryTemplates[name];
  if (!template) {
    throw new Error(`Unknown ${category} template: ${name}. Available: ${Object.keys(categoryTemplates).join(', ')}`);
  }
  return template;
}
