/**
 * Type definitions for the icon generation system.
 */

import { type MaterialType, type QualityTier } from '../palettes/game-palettes.js';

export type IconCategory = 'weapon' | 'armor' | 'consumable' | 'ability' | 'currency' | 'profession';

export interface IconTemplate {
  name: string;
  category: IconCategory;
  size: { width: number; height: number };
  silhouette: boolean[][];
  regions: ShapeRegion[];
  lightingAngle: number; // degrees, 315 = top-left
}

export interface ShapeRegion {
  name: string;
  pixels: [number, number][];
  material: MaterialType;
  depth: number; // 0-1, for lighting (0 = recessed, 1 = raised)
}

export interface IconGenerationParams {
  category: IconCategory;
  type: string;
  quality: QualityTier;
  seed: number;
  size?: number; // override template size
  element?: ElementType;
  elementIntensity?: number;
  wear?: number; // 0-1
  materialOverrides?: Record<string, MaterialType>;
  outlineWidth?: number;
}

export type ElementType = 'fire' | 'ice' | 'shadow' | 'holy' | 'nature';
