/**
 * CLI command for generating icons.
 */

import { type Command } from 'commander';
import * as path from 'path';
import { generateIcon } from '../../icons/generate.js';
import { listTemplates } from '../../icons/templates.js';
import { exportPNG } from '../../core/export.js';
import { type IconCategory, type IconGenerationParams } from '../../icons/types.js';
import { type QualityTier } from '../../palettes/game-palettes.js';

export function registerIconsCommand(program: Command): void {
  program
    .command('icons')
    .description('Generate item/ability/buff/currency/profession icons')
    .requiredOption('--category <type>', 'Icon category: weapon, armor, consumable, ability, currency, profession')
    .requiredOption('--type <name>', 'Specific template name (e.g., longsword, axe, dagger)')
    .option('--quality <tier>', 'Quality tier: common, uncommon, rare, epic, legendary', 'common')
    .option('--seed <number>', 'Seed for reproducible output', '42')
    .option('--seeds <range>', 'Seed range for batch (e.g., 100-109)')
    .option('--output <dir>', 'Output directory', 'tools/art-engine/output')
    .option('--list', 'List available templates for the given category')
    .action(async (opts) => {
      if (opts.list) {
        const templates = listTemplates(opts.category as IconCategory);
        console.log(`Available ${opts.category} templates:`);
        for (const t of templates) {
          console.log(`  - ${t}`);
        }
        return;
      }

      const seeds = parseSeedRange(opts.seed, opts.seeds);
      const qualities = parseQualities(opts.quality);

      let generated = 0;
      for (const quality of qualities) {
        for (const seed of seeds) {
          const params: IconGenerationParams = {
            category: opts.category as IconCategory,
            type: opts.type,
            quality,
            seed,
          };

          const grid = generateIcon(params);
          const filename = `${opts.category}-${opts.type}-${quality}-${String(seed).padStart(3, '0')}.png`;
          const outPath = path.resolve(opts.output, filename);
          await exportPNG(grid, outPath);
          console.log(`  Generated: ${filename}`);
          generated++;
        }
      }
      console.log(`\nGenerated ${generated} icon(s) in ${path.resolve(opts.output)}`);
    });
}

function parseSeedRange(seed: string, seedsRange?: string): number[] {
  if (seedsRange) {
    const [start, end] = seedsRange.split('-').map(Number);
    if (start === undefined || end === undefined || isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid seed range: ${seedsRange}. Use format: 100-109`);
    }
    const seeds: number[] = [];
    for (let s = start; s <= end; s++) {
      seeds.push(s);
    }
    return seeds;
  }
  return [parseInt(seed, 10)];
}

function parseQualities(quality: string): QualityTier[] {
  const all: QualityTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  if (quality === 'all') return all;
  const parts = quality.split(',') as QualityTier[];
  for (const p of parts) {
    if (!all.includes(p)) {
      throw new Error(`Invalid quality tier: ${p}. Valid: ${all.join(', ')}`);
    }
  }
  return parts;
}
