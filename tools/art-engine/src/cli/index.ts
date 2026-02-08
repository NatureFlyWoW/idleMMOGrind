#!/usr/bin/env node

/**
 * Art engine CLI — generates pixel art game assets.
 *
 * Usage: pnpm art <command> [options]
 */

import { Command } from 'commander';
import { registerIconsCommand } from './commands/icons.js';

const program = new Command();

program
  .name('art-engine')
  .description('Pixel art generation engine for Idle MMORPG game assets')
  .version('0.1.0');

registerIconsCommand(program);

program.parse();
