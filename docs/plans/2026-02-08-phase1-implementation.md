# Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete Phase 1 of Idle MMORPG: Electron scaffold, shared types, game engine (combat, leveling, gear, talents), save/load, offline progression, and all Phase 1 UI screens.

**Architecture:** Electron 3-process (main, renderer/React, engine/Worker Thread) with MessagePort direct communication. Game logic runs tick-based (4/sec) in Worker Thread. React UI subscribes to state snapshots. All balance values in data/balance.json.

**Tech Stack:** Electron 34+, React 19, TypeScript 5 (strict), Vite 6, Vitest 3, pnpm, CSS Modules, Worker Threads

---

## Task 1 -- Electron Scaffold and Build Pipeline

**Worktree:** `feat/electron-scaffold`
**Branch:** `feat/electron-scaffold`
**Depends on:** Nothing (first task)

### Step 1.1 -- Initialize project with pnpm and install dependencies

**Files:** `package.json`

```bash
cd C:\Users\Caus\Desktop\idleMMOGrind-worktrees\feat-electron-scaffold
pnpm init
```

Then write `package.json`:

```json
{
  "name": "idle-mmorpg",
  "version": "0.1.0",
  "description": "An offline idle/incremental RPG simulating the classic MMORPG experience",
  "main": "dist/main/main.js",
  "type": "commonjs",
  "scripts": {
    "dev": "concurrently \"pnpm dev:renderer\" \"pnpm dev:main\"",
    "dev:renderer": "vite",
    "dev:main": "tsc -p tsconfig.main.json --watch",
    "dev:engine": "tsc -p tsconfig.engine.json --watch",
    "build": "pnpm build:renderer && pnpm build:main && pnpm build:engine",
    "build:renderer": "vite build",
    "build:main": "tsc -p tsconfig.main.json && tsc-alias -p tsconfig.main.json",
    "build:engine": "tsc -p tsconfig.engine.json && tsc-alias -p tsconfig.engine.json",
    "package": "electron-builder --config electron-builder.yml",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:balance": "vitest run tests/balance/",
    "lint": "eslint src/ tests/ --ext .ts,.tsx",
    "typecheck": "tsc --noEmit -p tsconfig.main.json && tsc --noEmit -p tsconfig.renderer.json && tsc --noEmit -p tsconfig.engine.json",
    "start": "electron ."
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "concurrently": "^9.1.0",
    "electron": "^34.0.0",
    "electron-builder": "^25.1.0",
    "eslint": "^9.0.0",
    "tsc-alias": "^1.8.0",
    "typescript": "^5.7.0",
    "vite": "^6.1.0",
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

```bash
pnpm install
```

**Commit:** `feat(scaffold): initialize project with pnpm and core dependencies`

### Step 1.2 -- Create TypeScript configurations

**Files:** `tsconfig.json`, `tsconfig.main.json`, `tsconfig.renderer.json`, `tsconfig.engine.json`

**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@engine/*": ["src/engine/*"],
      "@renderer/*": ["src/renderer/*"],
      "@main/*": ["src/main/*"],
      "@data/*": ["data/*"]
    }
  },
  "exclude": ["node_modules", "dist", "out", "release"]
}
```

**File: `tsconfig.main.json`**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist/main",
    "lib": ["ES2022"]
  },
  "include": ["src/main/**/*", "src/shared/**/*"]
}
```

**File: `tsconfig.renderer.json`**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "dist/renderer",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/renderer/**/*", "src/shared/**/*"]
}
```

**File: `tsconfig.engine.json`**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist/engine",
    "lib": ["ES2022"]
  },
  "include": ["src/engine/**/*", "src/shared/**/*"]
}
```

**Commit:** `feat(scaffold): add TypeScript configurations for main, renderer, and engine`

### Step 1.3 -- Create Vite config for renderer

**Files:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@data': path.resolve(__dirname, 'data'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/renderer/index.html'),
    },
  },
  server: {
    port: 5173,
  },
});
```

**Commit:** `feat(scaffold): add Vite config for renderer process`

### Step 1.4 -- Create Vitest config

**Files:** `vitest.config.ts`, `tests/setup.ts`

**File: `vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/balance/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/shared/**'],
      exclude: ['**/*.d.ts', '**/index.ts'],
    },
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@data': path.resolve(__dirname, 'data'),
    },
  },
});
```

**File: `tests/setup.ts`**
```typescript
// Vitest global test setup
// Add shared test utilities and mocks here
```

**Commit:** `feat(scaffold): add Vitest config and test setup`

### Step 1.5 -- Create Electron Builder config

**Files:** `electron-builder.yml`

```yaml
appId: com.idlemmorpg.app
productName: Idle MMORPG
directories:
  output: release
  buildResources: resources

files:
  - dist/**/*
  - data/**/*
  - "!node_modules/**/*"

extraResources:
  - from: data/
    to: data/
    filter:
      - "**/*"

win:
  target:
    - target: nsis
      arch: [x64]

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  category: public.app-category.games

linux:
  target:
    - target: AppImage
      arch: [x64]
  category: Game

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true

publish: null
```

**Commit:** `feat(scaffold): add electron-builder config`

### Step 1.6 -- Create directory scaffold and placeholder files

**Files:** Create all directories and minimal entry-point files.

**Directories to create:**
```
src/main/
src/main/save/
src/main/ipc/
src/engine/
src/engine/combat/
src/engine/progression/
src/engine/gear/
src/engine/talents/
src/engine/character/
src/engine/offline/
src/engine/state/
src/engine/systems/
src/engine/events/
src/renderer/
src/renderer/components/
src/renderer/components/shared/
src/renderer/components/layout/
src/renderer/components/character-creation/
src/renderer/components/character/
src/renderer/components/inventory/
src/renderer/components/talents/
src/renderer/components/combat/
src/renderer/components/modals/
src/renderer/hooks/
src/renderer/providers/
src/renderer/styles/
src/renderer/styles/global/
src/shared/
src/shared/types/
src/shared/constants/
src/shared/utils/
data/
data/zones/
data/talents/
data/abilities/
data/items/
tests/unit/
tests/unit/shared/
tests/unit/engine/
tests/unit/engine/combat/
tests/unit/engine/progression/
tests/unit/engine/gear/
tests/unit/engine/talents/
tests/unit/engine/character/
tests/unit/engine/offline/
tests/integration/
tests/balance/
resources/
```

**File: `src/renderer/index.html`**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;" />
    <title>Idle MMORPG</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
```

**File: `src/renderer/index.tsx`**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';

const App: React.FC = () => {
  return <div>Idle MMORPG - Loading...</div>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**File: `src/main/main.ts`**
```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    title: 'Idle MMORPG',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
```

**File: `src/main/preload.ts`**
```typescript
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('gameAPI', {
  getVersion: () => '0.1.0',
});
```

**Test:** `pnpm typecheck` should pass. `pnpm test` should pass (no tests yet).

**Commit:** `feat(scaffold): create directory structure and entry point files`

### Step 1.7 -- Verify build pipeline works end-to-end

```bash
pnpm build:main
pnpm build:renderer
pnpm test
```

All three should succeed. Fix any issues.

**Commit:** `feat(scaffold): verify build pipeline passes`

---

## Task 2 -- Shared Types and Constants (Enums)

**Worktree:** `feat/electron-scaffold` (same branch, continues from Task 1)
**Depends on:** Task 1

### Step 2.1 -- Write enum tests first (TDD)

**File: `tests/unit/shared/enums.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  Race,
  CharacterClass,
  Specialization,
  PrimaryStat,
  SecondaryStat,
  ResourceType,
  GearSlot,
  ItemQuality,
  AbilityType,
  QuestType,
  DungeonDifficulty,
  ReputationTier,
} from '@shared/types/enums';

describe('Race enum', () => {
  it('should have exactly 8 races', () => {
    expect(Object.values(Race)).toHaveLength(8);
  });

  it('should contain all expected races', () => {
    expect(Race.Valeborn).toBe('valeborn');
    expect(Race.Stoneguard).toBe('stoneguard');
    expect(Race.Sylvani).toBe('sylvani');
    expect(Race.Bloodborn).toBe('bloodborn');
    expect(Race.Hollowed).toBe('hollowed');
    expect(Race.Tinkersoul).toBe('tinkersoul');
    expect(Race.Wildkin).toBe('wildkin');
    expect(Race.Earthborn).toBe('earthborn');
  });
});

describe('CharacterClass enum', () => {
  it('should have exactly 9 classes', () => {
    expect(Object.values(CharacterClass)).toHaveLength(9);
  });

  it('should contain all expected classes', () => {
    expect(CharacterClass.Blademaster).toBe('blademaster');
    expect(CharacterClass.Sentinel).toBe('sentinel');
    expect(CharacterClass.Stalker).toBe('stalker');
    expect(CharacterClass.Shadow).toBe('shadow');
    expect(CharacterClass.Cleric).toBe('cleric');
    expect(CharacterClass.Arcanist).toBe('arcanist');
    expect(CharacterClass.Summoner).toBe('summoner');
    expect(CharacterClass.Channeler).toBe('channeler');
    expect(CharacterClass.Shapeshifter).toBe('shapeshifter');
  });
});

describe('Specialization enum', () => {
  it('should have exactly 27 specializations (3 per class)', () => {
    expect(Object.values(Specialization)).toHaveLength(27);
  });
});

describe('PrimaryStat enum', () => {
  it('should have exactly 5 primary stats', () => {
    expect(Object.values(PrimaryStat)).toHaveLength(5);
  });

  it('should use abbreviated string values', () => {
    expect(PrimaryStat.Strength).toBe('str');
    expect(PrimaryStat.Agility).toBe('agi');
    expect(PrimaryStat.Intellect).toBe('int');
    expect(PrimaryStat.Spirit).toBe('spi');
    expect(PrimaryStat.Stamina).toBe('sta');
  });
});

describe('SecondaryStat enum', () => {
  it('should have exactly 12 secondary stats', () => {
    expect(Object.values(SecondaryStat)).toHaveLength(12);
  });
});

describe('ResourceType enum', () => {
  it('should have exactly 3 resource types', () => {
    expect(Object.values(ResourceType)).toHaveLength(3);
  });
});

describe('GearSlot enum', () => {
  it('should have exactly 16 gear slots', () => {
    expect(Object.values(GearSlot)).toHaveLength(16);
  });

  it('should include weapon slots', () => {
    expect(GearSlot.MainHand).toBe('main-hand');
    expect(GearSlot.OffHand).toBe('off-hand');
  });
});

describe('ItemQuality enum', () => {
  it('should have exactly 5 quality tiers', () => {
    expect(Object.values(ItemQuality)).toHaveLength(5);
  });

  it('should be ordered from common to legendary', () => {
    const values = Object.values(ItemQuality);
    expect(values[0]).toBe('common');
    expect(values[4]).toBe('legendary');
  });
});
```

**Run:** `pnpm test -- tests/unit/shared/enums.test.ts` -- should FAIL (module not found).

### Step 2.2 -- Implement all enums

**File: `src/shared/types/enums.ts`**

```typescript
// ---- Races ----
export enum Race {
  Valeborn = 'valeborn',
  Stoneguard = 'stoneguard',
  Sylvani = 'sylvani',
  Bloodborn = 'bloodborn',
  Hollowed = 'hollowed',
  Tinkersoul = 'tinkersoul',
  Wildkin = 'wildkin',
  Earthborn = 'earthborn',
}

// ---- Classes ----
export enum CharacterClass {
  Blademaster = 'blademaster',
  Sentinel = 'sentinel',
  Stalker = 'stalker',
  Shadow = 'shadow',
  Cleric = 'cleric',
  Arcanist = 'arcanist',
  Summoner = 'summoner',
  Channeler = 'channeler',
  Shapeshifter = 'shapeshifter',
}

// ---- Specializations (3 per class = 27 total) ----
export enum Specialization {
  // Blademaster
  WeaponArts = 'weapon-arts',
  Berserker = 'berserker',
  Guardian = 'guardian',
  // Sentinel
  Light = 'light',
  Defender = 'defender',
  Vengeance = 'vengeance',
  // Stalker
  BeastBond = 'beast-bond',
  Precision = 'precision',
  Survival = 'survival',
  // Shadow
  Venom = 'venom',
  BladeDance = 'blade-dance',
  Stealth = 'stealth',
  // Cleric
  Order = 'order',
  Radiance = 'radiance',
  Void = 'void',
  // Arcanist
  Spellweave = 'spellweave',
  Pyromancy = 'pyromancy',
  Cryomancy = 'cryomancy',
  // Summoner
  Corruption = 'corruption',
  PactBinding = 'pact-binding',
  Chaos = 'chaos',
  // Channeler
  StormCalling = 'storm-calling',
  SpiritWeapon = 'spirit-weapon',
  Renewal = 'renewal',
  // Shapeshifter
  Astral = 'astral',
  Primal = 'primal',
  GroveWarden = 'grove-warden',
}

// ---- Primary Stats ----
export enum PrimaryStat {
  Strength = 'str',
  Agility = 'agi',
  Intellect = 'int',
  Spirit = 'spi',
  Stamina = 'sta',
}

// ---- Secondary Stats ----
export enum SecondaryStat {
  CritChance = 'crit-chance',
  CritDamage = 'crit-damage',
  Haste = 'haste',
  Armor = 'armor',
  Resistance = 'resistance',
  HitRating = 'hit-rating',
  Expertise = 'expertise',
  SpellPenetration = 'spell-penetration',
  AttackPower = 'attack-power',
  SpellPower = 'spell-power',
  HealthRegen = 'health-regen',
  ManaRegen = 'mana-regen',
}

// ---- Resource Types ----
export enum ResourceType {
  Mana = 'mana',
  Energy = 'energy',
  Rage = 'rage',
}

// ---- Gear Slots ----
export enum GearSlot {
  Head = 'head',
  Shoulders = 'shoulders',
  Chest = 'chest',
  Wrists = 'wrists',
  Hands = 'hands',
  Waist = 'waist',
  Legs = 'legs',
  Feet = 'feet',
  Neck = 'neck',
  Back = 'back',
  Ring1 = 'ring1',
  Ring2 = 'ring2',
  Trinket1 = 'trinket1',
  Trinket2 = 'trinket2',
  MainHand = 'main-hand',
  OffHand = 'off-hand',
}

// ---- Item Quality ----
export enum ItemQuality {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
}

// ---- Armor Types ----
export enum ArmorType {
  Cloth = 'cloth',
  Leather = 'leather',
  Mail = 'mail',
  Plate = 'plate',
}

// ---- Weapon Types ----
export enum WeaponType {
  Sword1H = 'sword-1h',
  Sword2H = 'sword-2h',
  Mace1H = 'mace-1h',
  Mace2H = 'mace-2h',
  Axe1H = 'axe-1h',
  Axe2H = 'axe-2h',
  Dagger = 'dagger',
  Staff = 'staff',
  Bow = 'bow',
  Crossbow = 'crossbow',
  Wand = 'wand',
  Shield = 'shield',
  OffhandHeld = 'offhand-held',
}

// ---- Ability Types ----
export enum AbilityType {
  DirectDamage = 'direct-damage',
  DamageOverTime = 'dot',
  AreaOfEffect = 'aoe',
  HealOverTime = 'hot',
  DirectHeal = 'direct-heal',
  Buff = 'buff',
  Debuff = 'debuff',
  CrowdControl = 'cc',
}

// ---- Damage Types ----
export enum DamageType {
  Physical = 'physical',
  Spell = 'spell',
  Healing = 'healing',
}

// ---- Quest Types ----
export enum QuestType {
  Kill = 'kill',
  Collection = 'collection',
  Dungeon = 'dungeon',
  Elite = 'elite',
  Attunement = 'attunement',
}

// ---- Dungeon Difficulty ----
export enum DungeonDifficulty {
  Normal = 'normal',
  Heroic = 'heroic',
}

// ---- Reputation Tier ----
export enum ReputationTier {
  Neutral = 'neutral',
  Friendly = 'friendly',
  Honored = 'honored',
  Revered = 'revered',
  Exalted = 'exalted',
}

// ---- Role ----
export enum Role {
  Tank = 'tank',
  MeleeDPS = 'melee_dps',
  RangedDPS = 'ranged_dps',
  Healer = 'healer',
}

// ---- Combat Log Entry Type ----
export enum CombatLogType {
  DamageDealt = 'damage_dealt',
  DamageTaken = 'damage_taken',
  Heal = 'heal',
  AbilityUsed = 'ability_used',
  BuffApplied = 'buff_applied',
  BuffExpired = 'buff_expired',
  DebuffApplied = 'debuff_applied',
  DebuffExpired = 'debuff_expired',
  MonsterKilled = 'monster_killed',
  PlayerDeath = 'player_death',
  XpGained = 'xp_gained',
  GoldGained = 'gold_gained',
  LootDropped = 'loot_dropped',
  LevelUp = 'level_up',
  Miss = 'miss',
  Dodge = 'dodge',
  Parry = 'parry',
  Crit = 'crit',
}

// ---- Monster Type ----
export enum MonsterType {
  Normal = 'normal',
  Elite = 'elite',
  Boss = 'boss',
}
```

**Run:** `pnpm test -- tests/unit/shared/enums.test.ts` -- should PASS.

**Commit:** `feat(types): add all shared enum definitions`

### Step 2.3 -- Write and implement IPC type enums

**File: `src/shared/types/ipc.ts`**

```typescript
/** Channels invoked FROM renderer TO main (request/response) */
export enum MainInvokeChannel {
  SAVE_GAME = 'save:save-game',
  LOAD_GAME = 'save:load-game',
  EXPORT_SAVE = 'save:export',
  IMPORT_SAVE = 'save:import',
  LIST_SAVES = 'save:list',
  DELETE_SAVE = 'save:delete',
  APP_GET_VERSION = 'app:get-version',
  APP_GET_PLATFORM = 'app:get-platform',
  APP_GET_USER_DATA_PATH = 'app:get-user-data-path',
}

/** Channels sent FROM main TO renderer (push) */
export enum MainSendChannel {
  SAVE_AUTO_STARTED = 'save:auto-started',
  SAVE_AUTO_COMPLETE = 'save:auto-complete',
  SAVE_AUTO_FAILED = 'save:auto-failed',
  APP_BEFORE_QUIT = 'app:before-quit',
}

/** Messages FROM renderer TO engine worker */
export enum EngineCommandType {
  INIT = 'engine:init',
  PAUSE = 'engine:pause',
  RESUME = 'engine:resume',
  SHUTDOWN = 'engine:shutdown',
  SET_TICK_RATE = 'engine:set-tick-rate',
  CREATE_CHARACTER = 'char:create',
  DELETE_CHARACTER = 'char:delete',
  SELECT_CHARACTER = 'char:select',
  EQUIP_ITEM = 'char:equip-item',
  UNEQUIP_ITEM = 'char:unequip-item',
  ALLOCATE_TALENT = 'char:allocate-talent',
  RESET_TALENTS = 'char:reset-talents',
  SET_ABILITY_PRIORITY = 'char:set-ability-priority',
  SELL_ITEM = 'char:sell-item',
  TRAIN_ABILITY = 'char:train-ability',
  SELECT_ZONE = 'prog:select-zone',
  LOAD_STATE = 'engine:load-state',
  GET_SAVE_PAYLOAD = 'engine:get-save-payload',
  CALCULATE_OFFLINE = 'engine:calculate-offline',
}

/** Messages FROM engine worker TO renderer */
export enum EngineEventType {
  STATE_SNAPSHOT = 'state:snapshot',
  COMBAT_LOG_ENTRY = 'event:combat-log',
  LEVEL_UP = 'event:level-up',
  LOOT_DROPPED = 'event:loot-dropped',
  QUEST_COMPLETE = 'event:quest-complete',
  QUEST_PROGRESS = 'event:quest-progress',
  ZONE_CHANGED = 'event:zone-changed',
  ABILITY_UNLOCKED = 'event:ability-unlocked',
  ENGINE_READY = 'engine:ready',
  ENGINE_ERROR = 'engine:error',
  SAVE_PAYLOAD_READY = 'engine:save-payload-ready',
  OFFLINE_RESULT = 'engine:offline-result',
}

/** Message envelope: renderer -> engine */
export interface EngineCommand<T = unknown> {
  id: string;
  type: EngineCommandType;
  payload: T;
  timestamp: number;
}

/** Message envelope: engine -> renderer */
export interface EngineEvent<T = unknown> {
  id: string;
  type: EngineEventType;
  payload: T;
  timestamp: number;
  tickNumber: number;
}
```

**Commit:** `feat(types): add IPC channel and message envelope types`

### Step 2.4 -- Create shared type index barrel

**File: `src/shared/types/index.ts`**

```typescript
export * from './enums';
export * from './ipc';
```

**Commit:** `feat(types): add shared types barrel export`

---

## Task 3 -- Shared Types: Character, Item, Combat, Talent, World Interfaces

**Worktree:** `feat/shared-types`
**Branch:** `feat/shared-types`
**Depends on:** Task 2 (enums)

### Step 3.1 -- Character type interfaces

**File: `src/shared/types/character.ts`**

```typescript
import {
  Race, CharacterClass, Specialization, PrimaryStat,
  ResourceType, ArmorType, WeaponType, Role,
} from './enums';

/** Per-level stat growth rates for a class */
export interface IStatGrowthRates {
  [PrimaryStat.Strength]: number;
  [PrimaryStat.Agility]: number;
  [PrimaryStat.Intellect]: number;
  [PrimaryStat.Spirit]: number;
  [PrimaryStat.Stamina]: number;
}

/** Primary stat block (5 stats) */
export interface IPrimaryStatBlock {
  [PrimaryStat.Strength]: number;
  [PrimaryStat.Agility]: number;
  [PrimaryStat.Intellect]: number;
  [PrimaryStat.Spirit]: number;
  [PrimaryStat.Stamina]: number;
}

/** Racial ability definition */
export interface IRacialAbility {
  id: string;
  name: string;
  description: string;
  effectType: 'stat_percent' | 'xp_percent' | 'immunity' | 'resource_percent';
  stat?: string;
  value: number;
}

/** Race definition (loaded from data/races.json) */
export interface IRaceDefinition {
  id: Race;
  name: string;
  description: string;
  statBonuses: IPrimaryStatBlock;
  racialAbility: IRacialAbility;
  recommendedClasses: CharacterClass[];
}

/** Spec definition within a class */
export interface ISpecDefinition {
  id: Specialization;
  name: string;
  description: string;
  role: Role;
  icon: string;
}

/** Class definition (loaded from data/classes.json) */
export interface IClassDefinition {
  id: CharacterClass;
  name: string;
  description: string;
  primaryStats: PrimaryStat[];
  roles: Role[];
  resourceType: ResourceType;
  armorType: ArmorType;
  weaponTypes: WeaponType[];
  specs: [ISpecDefinition, ISpecDefinition, ISpecDefinition];
  baseStats: IPrimaryStatBlock;
  baseHP: number;
  baseResource: number;
  statGrowth: IStatGrowthRates;
}

/** Parameters for creating a new character */
export interface ICharacterCreationParams {
  name: string;
  race: Race;
  classId: CharacterClass;
}
```

**Commit:** `feat(types): add character type interfaces`

### Step 3.2 -- Item type interfaces

**File: `src/shared/types/item.ts`**

```typescript
import {
  GearSlot, ItemQuality, ArmorType, WeaponType, PrimaryStat,
} from './enums';

/** Stat range for item generation */
export interface IStatRange {
  min: number;
  max: number;
}

/** A concrete item instance in a player's inventory/equipment */
export interface IItem {
  id: string;
  templateId: string;
  name: string;
  slot: GearSlot;
  quality: ItemQuality;
  iLevel: number;
  requiredLevel: number;
  armorType?: ArmorType;
  weaponType?: WeaponType;
  primaryStats: Partial<Record<PrimaryStat, number>>;
  secondaryStats: Record<string, number>;
  weaponDamage?: { min: number; max: number };
  weaponSpeed?: number;
  armor?: number;
  durability: { current: number; max: number };
  sellValue: number;
  flavorText?: string;
}

/** Template used for item generation (loot tables reference these) */
export interface IItemTemplate {
  id: string;
  name: string;
  slot: GearSlot;
  armorType?: ArmorType;
  weaponType?: WeaponType;
  classAffinity?: string[];
  weaponSpeed?: number;
  flavorText?: string;
}

/** A loot drop definition in a loot table */
export interface ILootDrop {
  dropChance: number;
  qualityWeights: Record<ItemQuality, number>;
  slotPool: GearSlot[];
  iLevelRange: { min: number; max: number };
}

/** Loot table for a monster or chest */
export interface ILootTable {
  id: string;
  monsterLevel: number;
  drops: ILootDrop[];
}

/** Set bonus (Phase 2+, but interface defined now) */
export interface ISetBonus {
  setId: string;
  setName: string;
  requiredPieces: number;
  bonusStats: Partial<Record<PrimaryStat, number>>;
  bonusDescription: string;
}

/** Unique equip effect (Phase 2+) */
export interface IUniqueEffect {
  id: string;
  name: string;
  description: string;
  procChance?: number;
  cooldownMs?: number;
}

/** Slot budget weight for item generation */
export const SLOT_BUDGET_WEIGHT: Record<GearSlot, number> = {
  [GearSlot.Chest]: 1.0,
  [GearSlot.Legs]: 1.0,
  [GearSlot.Head]: 0.85,
  [GearSlot.Shoulders]: 0.85,
  [GearSlot.Hands]: 0.7,
  [GearSlot.Feet]: 0.7,
  [GearSlot.Waist]: 0.7,
  [GearSlot.Wrists]: 0.55,
  [GearSlot.Back]: 0.55,
  [GearSlot.Neck]: 0.5,
  [GearSlot.Ring1]: 0.5,
  [GearSlot.Ring2]: 0.5,
  [GearSlot.Trinket1]: 0.45,
  [GearSlot.Trinket2]: 0.45,
  [GearSlot.MainHand]: 1.2,
  [GearSlot.OffHand]: 0.6,
};

/** Quality stat multiplier */
export const QUALITY_STAT_MULTIPLIER: Record<ItemQuality, number> = {
  [ItemQuality.Common]: 1.0,
  [ItemQuality.Uncommon]: 1.3,
  [ItemQuality.Rare]: 1.7,
  [ItemQuality.Epic]: 2.2,
  [ItemQuality.Legendary]: 3.0,
};
```

**Commit:** `feat(types): add item type interfaces and constants`

### Step 3.3 -- Combat type interfaces

**File: `src/shared/types/combat.ts`**

```typescript
import { DamageType, ResourceType } from './enums';

/** Result of a single damage/heal calculation */
export interface IDamageResult {
  amount: number;
  type: DamageType;
  isCrit: boolean;
}

/** An active DoT/HoT effect on a combatant */
export interface IActiveDoT {
  id: string;
  sourceAbilityId: string;
  damagePerTick: number;
  ticksRemaining: number;
  totalTicks: number;
  damageType: DamageType;
  canCrit: boolean;
}

/** An active buff/debuff */
export interface IActiveBuff {
  id: string;
  name: string;
  sourceAbilityId: string;
  ticksRemaining: number;
  totalTicks: number;
  stacks: number;
  maxStacks: number;
  effects: IBuffEffect[];
}

/** A single effect from a buff */
export interface IBuffEffect {
  type: 'stat_flat' | 'stat_percent' | 'damage_percent' | 'healing_percent' | 'haste_percent';
  stat?: string;
  value: number;
}

/** Ability rank (abilities scale with rank/level) */
export interface IAbilityRank {
  rank: number;
  requiredLevel: number;
  resourceCost: number;
  baseDamage?: number;
  baseHealing?: number;
  coefficient: number;
  cooldownMs: number;
  duration?: number;
  tickCount?: number;
}

/** Full ability definition */
export interface IAbilityDefinition {
  id: string;
  name: string;
  classId: string;
  type: string;
  damageType: DamageType;
  resourceType: ResourceType;
  description: string;
  ranks: IAbilityRank[];
  isAutoAttack?: boolean;
}

/** Snapshot of combat state sent to the renderer */
export interface ICombatSnapshot {
  inCombat: boolean;
  playerHP: number;
  playerMaxHP: number;
  playerResource: number;
  playerMaxResource: number;
  resourceType: ResourceType;
  targetName: string | null;
  targetHP: number;
  targetMaxHP: number;
  targetLevel: number;
  dps: number;
  activeBuffs: IActiveBuff[];
  activeDoTs: IActiveDoT[];
}

/** A single combat log entry */
export interface ICombatLogEntry {
  timestamp: number;
  type: string;
  source: string;
  target: string;
  value?: number;
  abilityName?: string;
  itemName?: string;
  isCritical?: boolean;
}
```

**Commit:** `feat(types): add combat type interfaces`

### Step 3.4 -- Talent type interfaces

**File: `src/shared/types/talent.ts`**

```typescript
import { CharacterClass, Specialization } from './enums';

/** A single talent effect for one rank */
export interface ITalentEffect {
  rank: number;
  type: 'stat_bonus' | 'stat_percent' | 'ability_modifier' | 'new_ability'
      | 'proc_chance' | 'resource_modifier' | 'damage_percent' | 'cooldown_reduction';
  stat?: string;
  abilityId?: string;
  value: number;
  description: string;
}

/** A node in the talent tree */
export interface ITalentNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 1 | 2 | 3 | 4 | 5;
  position: { row: number; col: number };
  maxRank: number;
  pointsRequired: number;
  prerequisiteNodeId?: string;
  effects: ITalentEffect[];
}

/** A full talent tree (one spec) */
export interface ITalentTree {
  id: string;
  specId: Specialization;
  name: string;
  classId: CharacterClass;
  description: string;
  icon: string;
  nodes: ITalentNode[];
}

/** Player's current talent allocation */
export interface ITalentAllocation {
  /** nodeId -> current rank */
  allocatedPoints: Record<string, number>;
  totalPointsSpent: number;
  pointsAvailable: number;
}

/** Talent snapshot sent to renderer */
export interface ITalentSnapshot {
  trees: ITalentTree[];
  allocation: ITalentAllocation;
  respecCost: number;
}
```

**Commit:** `feat(types): add talent type interfaces`

### Step 3.5 -- World type interfaces (zones, monsters, quests)

**File: `src/shared/types/world.ts`**

```typescript
import { MonsterType, QuestType, GearSlot } from './enums';

/** Gold range for monster drops */
export interface IGoldRange {
  min: number;
  max: number;
}

/** Monster definition */
export interface IMonsterTemplate {
  id: string;
  name: string;
  level: number;
  type: MonsterType;
  health: number;
  damage: number;
  armor: number;
  resistance: number;
  attackSpeed: number;
  lootTableId: string;
  xpReward: number;
  goldReward: IGoldRange;
}

/** Zone definition */
export interface IZoneDefinition {
  id: string;
  name: string;
  description: string;
  levelRange: { min: number; max: number };
  monsterIds: string[];
  questCount: number;
  nextZoneId: string | null;
  theme: string;
}

/** Quest definition */
export interface IQuestDefinition {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  type: QuestType;
  requiredKills: number;
  xpReward: number;
  goldReward: number;
  gearRewardChance: number;
  gearRewardSlots?: GearSlot[];
}

/** Active quest state */
export interface IActiveQuest {
  questId: string;
  currentKills: number;
  requiredKills: number;
  completed: boolean;
}
```

**Commit:** `feat(types): add world type interfaces (zones, monsters, quests)`

### Step 3.6 -- State snapshot and save interfaces

**File: `src/shared/types/state.ts`**

```typescript
import { Race, CharacterClass, ResourceType, GearSlot } from './enums';
import { IPrimaryStatBlock } from './character';
import { IItem } from './item';
import { ICombatSnapshot, ICombatLogEntry, IActiveBuff, IActiveDoT } from './combat';
import { ITalentSnapshot } from './talent';
import { IActiveQuest } from './world';

/** Character snapshot for the renderer */
export interface ICharacterSnapshot {
  id: string;
  name: string;
  race: Race;
  classId: CharacterClass;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  gold: number;
  resourceType: ResourceType;
  totalKills: number;
  totalQuestsCompleted: number;
  deathCount: number;
  playTimeSeconds: number;
}

/** Computed stats after all modifiers */
export interface IComputedStats {
  primaryStats: IPrimaryStatBlock;
  attackPower: number;
  spellPower: number;
  criticalStrike: number;
  haste: number;
  armor: number;
  resistance: number;
  hitRating: number;
  dodge: number;
  parry: number;
  maxHealth: number;
  maxMana: number;
  healthRegen: number;
  manaRegen: number;
}

/** Full game state snapshot sent from engine to renderer */
export interface IGameStateSnapshot {
  character: ICharacterSnapshot | null;
  computedStats: IComputedStats | null;
  combat: ICombatSnapshot;
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  talents: ITalentSnapshot | null;
  activeQuest: IActiveQuest | null;
  currentZoneId: string | null;
  currentZoneName: string | null;
  recentCombatLog: ICombatLogEntry[];
  timestamp: number;
}
```

**File: `src/shared/types/save.ts`**

```typescript
import { Race, CharacterClass, GearSlot } from './enums';
import { IPrimaryStatBlock } from './character';
import { IItem } from './item';
import { IActiveQuest } from './world';
import { IActiveBuff, IActiveDoT } from './combat';

/** Save file metadata */
export interface ISaveMeta {
  version: string;
  gameVersion: string;
  saveSlot: 1 | 2 | 3;
  createdAt: string;
  lastSavedAt: string;
  lastPlayedAt: string;
  playTimeSeconds: number;
  checksum: string;
}

/** Character data in a save */
export interface ISaveCharacter {
  id: string;
  name: string;
  race: Race;
  classId: CharacterClass;
  level: number;
  currentXP: number;
  gold: number;
  currentHP: number;
  currentResource: number;
  deathCount: number;
  totalKills: number;
  totalQuestsCompleted: number;
  respecCount: number;
}

/** Progression data in a save */
export interface ISaveProgression {
  currentZoneId: string;
  currentQuestIndex: number;
  currentQuestKills: number;
  zonesCompleted: string[];
  unlockedAbilities: string[];
  activeAbilityPriority: string[];
}

/** Talent data in a save */
export interface ISaveTalents {
  allocatedPoints: Record<string, number>;
  totalPointsSpent: number;
}

/** Combat state data in a save */
export interface ISaveCombatState {
  currentMonster: {
    definitionId: string;
    currentHP: number;
  } | null;
  activeBuffs: IActiveBuff[];
  activeDoTs: IActiveDoT[];
  cooldowns: Record<string, number>;
}

/** Settings data in a save */
export interface ISaveSettings {
  autoEquip: boolean;
  autoSellCommon: boolean;
  combatLogVisible: boolean;
  uiScale: number;
}

/** The complete save file structure */
export interface ISaveData {
  meta: ISaveMeta;
  character: ISaveCharacter;
  progression: ISaveProgression;
  inventory: {
    equipped: Partial<Record<GearSlot, IItem | null>>;
    bags: (IItem | null)[];
  };
  talents: ISaveTalents;
  combatState: ISaveCombatState;
  settings: ISaveSettings;
}
```

**Commit:** `feat(types): add game state snapshot and save data interfaces`

### Step 3.7 -- Update barrel export and run typecheck

**File: `src/shared/types/index.ts`** (update)

```typescript
export * from './enums';
export * from './ipc';
export * from './character';
export * from './item';
export * from './combat';
export * from './talent';
export * from './world';
export * from './state';
export * from './save';
```

**Run:** `pnpm typecheck` -- should pass.
**Run:** `pnpm test` -- should pass.

**Commit:** `feat(types): complete shared types barrel and verify typecheck`

---

## Task 4 -- Balance Config and Data Loading

**Worktree:** `feat/shared-types` (continues)
**Depends on:** Task 3

### Step 4.1 -- Write balance config interface

**File: `src/shared/types/balance.ts`**

```typescript
import { ItemQuality } from './enums';

export interface IBalanceConfig {
  xp: {
    /** Coefficients for xpToNextLevel = floor(a * level + b * level^c) */
    linearCoeff: number;
    powerCoeff: number;
    powerExponent: number;
    /** Level difference XP modifiers */
    levelDiffMods: {
      tooHigh: number;
      above3: number;
      normal: number;
      below5: number;
      below8: number;
      gray: number;
    };
    /** Thresholds for level diff categories (relative to player level) */
    levelDiffThresholds: {
      tooHighAbove: number;
      bonusAbove: number;
      normalAbove: number;
      reducedAbove: number;
      greatlyReducedAbove: number;
    };
  };

  combat: {
    baseTickIntervalMs: number;
    uiUpdateIntervalMs: number;
    baseCritMultiplier: number;
    baseMissChancePhysical: number;
    baseMissChanceSpell: number;
    baseMonsterDodge: number;
    deathGoldPenalty: number;
    deathDurabilityLoss: number;
    deathRespawnDelayMs: number;
    energyPerTick: number;
    energyCap: number;
    ragePerHitDealt: number;
    ragePerHitTaken: number;
    rageCap: number;
    rageDecayPerTick: number;
  };

  stats: {
    healthPerStamina: number;
    manaPerIntellect: number;
    attackPowerPerStrength: number;
    attackPowerPerAgility: number;
    spellPowerPerIntellect: number;
    agiPerCritPercent: number;
    critRatingPerPercent: number;
    hasteRatingPerPercent: number;
    hitRatingPerPercent: number;
    dodgeRatingPerPercent: number;
    parryRatingPerPercent: number;
    armorPerAgility: number;
    armorPerStamina: number;
    resistPerIntellect: number;
    baseDodgePercent: number;
    baseParryPercent: number;
    baseCritPercent: number;
    healthRegenPerSpirit: number;
    manaRegenPerSpirit: number;
    manaRegenPerIntellect: number;
    outOfCombatHealthRegenMult: number;
    outOfCombatManaRegenMult: number;
  };

  monsters: {
    /** HP = a + (level * b) + (level^c * d) */
    hpBase: number;
    hpLinear: number;
    hpPowerExponent: number;
    hpPowerCoeff: number;
    damageBase: number;
    damageLinear: number;
    damagePowerExponent: number;
    damagePowerCoeff: number;
    armorBase: number;
    armorLinear: number;
    resistBase: number;
    resistLinear: number;
    xpBase: number;
    xpLinear: number;
    xpPowerExponent: number;
    xpPowerCoeff: number;
    goldMinBase: number;
    goldMinLinear: number;
    goldMaxBase: number;
    goldMaxLinear: number;
  };

  gear: {
    /** statBudget = floor(iLevel * a + iLevel^b * c) */
    budgetLinearCoeff: number;
    budgetPowerExponent: number;
    budgetPowerCoeff: number;
    qualityStatMultiplier: Record<ItemQuality, number>;
    primaryStatSplit: number;
    secondaryStatSplit: number;
    dropChanceBase: number;
    qualityWeights: Record<ItemQuality, number>;
    epicMinLevel: number;
    weaponMinDmgFormula: {
      levelCoeff: number;
      levelBase: number;
    };
    weaponMaxDmgMultiplier: number;
    weaponSpeeds: Record<string, number>;
  };

  offline: {
    maxOfflineSeconds: number;
    tier1Hours: number;
    tier1Efficiency: number;
    tier2Hours: number;
    tier2Efficiency: number;
    tier3Efficiency: number;
    catchUpMinMultiplier: number;
    catchUpMaxMultiplier: number;
    catchUpScaleHours: number;
    maxDropQualityOffline: ItemQuality;
    questBonusMultiplier: number;
  };

  quests: {
    killsPerQuestMin: number;
    killsPerQuestMax: number;
    xpMultiplier: number;
    gearRewardChance: number;
  };

  talents: {
    firstTalentLevel: number;
    lastTalentLevel: number;
    totalPoints: number;
    tierRequirements: number[];
    respecBaseCost: number;
    respecCostPerLevel: number;
    respecCountMultiplier: number;
  };
}
```

**Commit:** `feat(types): add balance config interface`

### Step 4.2 -- Create balance.json data file with all values

**File: `data/balance.json`**

```json
{
  "xp": {
    "linearCoeff": 100,
    "powerCoeff": 50,
    "powerExponent": 1.65,
    "levelDiffMods": {
      "tooHigh": 0,
      "above3": 1.2,
      "normal": 1.0,
      "below5": 0.75,
      "below8": 0.25,
      "gray": 0
    },
    "levelDiffThresholds": {
      "tooHighAbove": 5,
      "bonusAbove": 3,
      "normalAbove": -2,
      "reducedAbove": -5,
      "greatlyReducedAbove": -8
    }
  },
  "combat": {
    "baseTickIntervalMs": 250,
    "uiUpdateIntervalMs": 500,
    "baseCritMultiplier": 0.5,
    "baseMissChancePhysical": 0.05,
    "baseMissChanceSpell": 0.04,
    "baseMonsterDodge": 0.05,
    "deathGoldPenalty": 0.10,
    "deathDurabilityLoss": 0.10,
    "deathRespawnDelayMs": 5000,
    "energyPerTick": 10,
    "energyCap": 100,
    "ragePerHitDealt": 5,
    "ragePerHitTaken": 3,
    "rageCap": 100,
    "rageDecayPerTick": 2
  },
  "stats": {
    "healthPerStamina": 10,
    "manaPerIntellect": 8,
    "attackPowerPerStrength": 2,
    "attackPowerPerAgility": 1,
    "spellPowerPerIntellect": 1.5,
    "agiPerCritPercent": 52,
    "critRatingPerPercent": 14,
    "hasteRatingPerPercent": 15.7,
    "hitRatingPerPercent": 15.8,
    "dodgeRatingPerPercent": 18.9,
    "parryRatingPerPercent": 22.1,
    "armorPerAgility": 2,
    "armorPerStamina": 0.5,
    "resistPerIntellect": 0.5,
    "baseDodgePercent": 3.0,
    "baseParryPercent": 3.0,
    "baseCritPercent": 5.0,
    "healthRegenPerSpirit": 0.5,
    "manaRegenPerSpirit": 1.0,
    "manaRegenPerIntellect": 0.25,
    "outOfCombatHealthRegenMult": 5,
    "outOfCombatManaRegenMult": 3
  },
  "monsters": {
    "hpBase": 40,
    "hpLinear": 12,
    "hpPowerExponent": 1.4,
    "hpPowerCoeff": 3,
    "damageBase": 5,
    "damageLinear": 2.5,
    "damagePowerExponent": 1.3,
    "damagePowerCoeff": 0.8,
    "armorBase": 20,
    "armorLinear": 15,
    "resistBase": 10,
    "resistLinear": 8,
    "xpBase": 40,
    "xpLinear": 15,
    "xpPowerExponent": 1.6,
    "xpPowerCoeff": 2,
    "goldMinBase": 1,
    "goldMinLinear": 0.5,
    "goldMaxBase": 3,
    "goldMaxLinear": 1.2
  },
  "gear": {
    "budgetLinearCoeff": 1.5,
    "budgetPowerExponent": 1.2,
    "budgetPowerCoeff": 0.3,
    "qualityStatMultiplier": {
      "common": 1.0,
      "uncommon": 1.3,
      "rare": 1.7,
      "epic": 2.2,
      "legendary": 3.0
    },
    "primaryStatSplit": 0.7,
    "secondaryStatSplit": 0.3,
    "dropChanceBase": 0.20,
    "qualityWeights": {
      "common": 45,
      "uncommon": 35,
      "rare": 15,
      "epic": 5,
      "legendary": 0
    },
    "epicMinLevel": 40,
    "weaponMinDmgFormula": {
      "levelCoeff": 2,
      "levelBase": 5
    },
    "weaponMaxDmgMultiplier": 1.4,
    "weaponSpeeds": {
      "dagger": 1.5,
      "sword-1h": 2.0,
      "mace-1h": 2.0,
      "axe-1h": 2.0,
      "sword-2h": 3.0,
      "mace-2h": 3.0,
      "axe-2h": 3.0,
      "staff": 2.8,
      "bow": 2.5,
      "crossbow": 2.5,
      "wand": 1.8
    }
  },
  "offline": {
    "maxOfflineSeconds": 86400,
    "tier1Hours": 12,
    "tier1Efficiency": 1.0,
    "tier2Hours": 18,
    "tier2Efficiency": 0.75,
    "tier3Efficiency": 0.50,
    "catchUpMinMultiplier": 2.0,
    "catchUpMaxMultiplier": 5.0,
    "catchUpScaleHours": 24,
    "maxDropQualityOffline": "rare",
    "questBonusMultiplier": 1.7
  },
  "quests": {
    "killsPerQuestMin": 8,
    "killsPerQuestMax": 15,
    "xpMultiplier": 2.5,
    "gearRewardChance": 0.30
  },
  "talents": {
    "firstTalentLevel": 10,
    "lastTalentLevel": 60,
    "totalPoints": 51,
    "tierRequirements": [0, 5, 10, 15, 20],
    "respecBaseCost": 10,
    "respecCostPerLevel": 1,
    "respecCountMultiplier": 0.5
  }
}
```

**Commit:** `feat(data): add balance.json with all tunable game parameters`

### Step 4.3 -- Write balance config loader with test

**Test file: `tests/unit/shared/balance-loader.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

describe('loadBalanceConfig', () => {
  it('should load and return balance config from data/balance.json', () => {
    const config = loadBalanceConfig();
    expect(config).toBeDefined();
    expect(config.xp.linearCoeff).toBe(100);
    expect(config.xp.powerExponent).toBe(1.65);
    expect(config.combat.baseTickIntervalMs).toBe(250);
    expect(config.stats.healthPerStamina).toBe(10);
    expect(config.monsters.hpBase).toBe(40);
    expect(config.gear.budgetLinearCoeff).toBe(1.5);
    expect(config.offline.maxOfflineSeconds).toBe(86400);
    expect(config.talents.totalPoints).toBe(51);
  });

  it('should have correct quality multipliers', () => {
    const config = loadBalanceConfig();
    expect(config.gear.qualityStatMultiplier.common).toBe(1.0);
    expect(config.gear.qualityStatMultiplier.uncommon).toBe(1.3);
    expect(config.gear.qualityStatMultiplier.rare).toBe(1.7);
    expect(config.gear.qualityStatMultiplier.epic).toBe(2.2);
    expect(config.gear.qualityStatMultiplier.legendary).toBe(3.0);
  });

  it('should have 5 tier requirements for talents', () => {
    const config = loadBalanceConfig();
    expect(config.talents.tierRequirements).toHaveLength(5);
    expect(config.talents.tierRequirements).toEqual([0, 5, 10, 15, 20]);
  });
});
```

**Implementation file: `src/shared/utils/balance-loader.ts`**

```typescript
import balanceData from '@data/balance.json';
import type { IBalanceConfig } from '@shared/types/balance';

let cachedConfig: IBalanceConfig | null = null;

export function loadBalanceConfig(): IBalanceConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = balanceData as IBalanceConfig;
  return cachedConfig;
}

export function resetBalanceConfigCache(): void {
  cachedConfig = null;
}
```

**Run:** `pnpm test -- tests/unit/shared/balance-loader.test.ts` -- should PASS.

**Commit:** `feat(data): add balance config loader with caching and tests`

### Step 4.4 -- Update shared types barrel

**File: `src/shared/types/index.ts`** (update)

```typescript
export * from './enums';
export * from './ipc';
export * from './character';
export * from './item';
export * from './combat';
export * from './talent';
export * from './world';
export * from './state';
export * from './save';
export * from './balance';
```

**Commit:** `feat(types): add balance types to barrel export`

---

## Task 5 -- Seeded RNG Utility

**Worktree:** `feat/shared-types` (continues)
**Depends on:** Task 3

### Step 5.1 -- Write RNG tests first

**File: `tests/unit/shared/rng.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@shared/utils/rng';

describe('SeededRandom', () => {
  it('should produce deterministic sequences from the same seed', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should produce different sequences from different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('next() should return values in [0, 1)', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('nextInt(min, max) should return integers in [min, max]', () => {
    const rng = new SeededRandom(999);
    for (let i = 0; i < 500; i++) {
      const val = rng.nextInt(1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('nextInt should handle min === max', () => {
    const rng = new SeededRandom(1);
    expect(rng.nextInt(5, 5)).toBe(5);
  });

  it('nextFloat(min, max) should return floats in [min, max)', () => {
    const rng = new SeededRandom(777);
    for (let i = 0; i < 500; i++) {
      const val = rng.nextFloat(10.0, 20.0);
      expect(val).toBeGreaterThanOrEqual(10.0);
      expect(val).toBeLessThan(20.0);
    }
  });

  it('chance(probability) should respect probability', () => {
    const rng = new SeededRandom(42);
    let trueCount = 0;
    const trials = 10000;

    for (let i = 0; i < trials; i++) {
      if (rng.chance(0.5)) trueCount++;
    }

    // Should be roughly 50%, allow 5% margin
    expect(trueCount / trials).toBeGreaterThan(0.45);
    expect(trueCount / trials).toBeLessThan(0.55);
  });

  it('chance(0) should always return false', () => {
    const rng = new SeededRandom(1);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
    }
  });

  it('chance(1) should always return true', () => {
    const rng = new SeededRandom(1);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('weightedChoice should respect weights', () => {
    const rng = new SeededRandom(42);
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    const items = [
      { item: 'a', weight: 70 },
      { item: 'b', weight: 20 },
      { item: 'c', weight: 10 },
    ];

    for (let i = 0; i < 10000; i++) {
      const result = rng.weightedChoice(items);
      counts[result]++;
    }

    // 'a' should be most common
    expect(counts['a']).toBeGreaterThan(counts['b']);
    expect(counts['b']).toBeGreaterThan(counts['c']);
  });

  it('getSeed() should return the original seed', () => {
    const rng = new SeededRandom(12345);
    expect(rng.getSeed()).toBe(12345);
  });

  it('fork() should create independent child RNG', () => {
    const parent = new SeededRandom(42);
    parent.next(); // advance parent
    const child = parent.fork();

    // Advance parent further
    const parentVal = parent.next();
    const childVal = child.next();

    // They should produce different values since child was forked
    // (child's seed is derived from parent's current state)
    // Both should still be deterministic
    expect(typeof parentVal).toBe('number');
    expect(typeof childVal).toBe('number');
  });
});
```

### Step 5.2 -- Implement SeededRandom (Mulberry32)

**File: `src/shared/utils/rng.ts`**

```typescript
/**
 * Mulberry32 seeded PRNG.
 * Fast, small state, good distribution for game purposes.
 * Produces deterministic sequences from a given seed.
 */
export class SeededRandom {
  private state: number;
  private readonly initialSeed: number;

  constructor(seed: number) {
    this.initialSeed = seed;
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number {
    if (min === max) return min;
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a float in [min, max) */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Returns true with the given probability [0, 1] */
  chance(probability: number): boolean {
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return this.next() < probability;
  }

  /** Picks from weighted items. Each item has { item: T, weight: number }. */
  weightedChoice<T>(items: ReadonlyArray<{ item: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = this.next() * totalWeight;

    for (const entry of items) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }

    // Fallback to last item (floating point edge case)
    return items[items.length - 1]!.item;
  }

  /** Creates an independent child RNG derived from current state */
  fork(): SeededRandom {
    return new SeededRandom(Math.floor(this.next() * 2147483647));
  }

  /** Returns the original seed */
  getSeed(): number {
    return this.initialSeed;
  }
}
```

**Run:** `pnpm test -- tests/unit/shared/rng.test.ts` -- should PASS.

**Commit:** `feat(utils): add seeded RNG utility (Mulberry32) with tests`

---

## Task 6 -- Stat System (Primary + Derived Calculations)

**Worktree:** `feat/shared-types` (continues)
**Depends on:** Tasks 3, 4

### Step 6.1 -- Write stat calculation tests

**File: `tests/unit/engine/character/stat-calculator.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculatePrimaryStats,
  calculateDerivedStats,
  calculateArmorReduction,
  calculateResistReduction,
  xpToNextLevel,
  calculateMonsterHP,
  calculateMonsterDamage,
  calculateMonsterXP,
  calculateStatBudget,
  calculateWeaponMinDamage,
  calculateWeaponMaxDamage,
} from '@engine/character/stat-calculator';
import { PrimaryStat, ItemQuality } from '@shared/types/enums';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('xpToNextLevel', () => {
  it('should calculate level 1 XP correctly: floor(100*1 + 50*1^1.65) = 150', () => {
    expect(xpToNextLevel(1, config)).toBe(150);
  });

  it('should calculate level 10 XP correctly', () => {
    // floor(100*10 + 50*10^1.65) = floor(1000 + 50*44.668) = floor(1000 + 2233.4) = 3233
    const result = xpToNextLevel(10, config);
    expect(result).toBeGreaterThan(3200);
    expect(result).toBeLessThan(3300);
  });

  it('should calculate level 30 XP correctly', () => {
    // floor(100*30 + 50*30^1.65) = floor(3000 + 50*342.6) ~= 20131
    const result = xpToNextLevel(30, config);
    expect(result).toBeGreaterThan(20000);
    expect(result).toBeLessThan(20300);
  });

  it('should return 0 for level 60 (max level)', () => {
    expect(xpToNextLevel(60, config)).toBe(0);
  });
});

describe('calculateMonsterHP', () => {
  it('should calculate level 1 monster HP: 40 + 12 + 3*1 = 55', () => {
    const hp = calculateMonsterHP(1, config);
    expect(hp).toBe(55);
  });

  it('should calculate level 30 monster HP around 723', () => {
    const hp = calculateMonsterHP(30, config);
    expect(hp).toBeGreaterThan(700);
    expect(hp).toBeLessThan(750);
  });
});

describe('calculateMonsterDamage', () => {
  it('should calculate level 1 monster damage', () => {
    const dmg = calculateMonsterDamage(1, config);
    expect(dmg).toBeGreaterThan(7);
    expect(dmg).toBeLessThan(10);
  });
});

describe('calculateMonsterXP', () => {
  it('should calculate level 1 monster XP: 40 + 15 + 2*1 = 57', () => {
    const xp = calculateMonsterXP(1, config);
    expect(xp).toBe(57);
  });

  it('should calculate level 30 monster XP around 935', () => {
    const xp = calculateMonsterXP(30, config);
    expect(xp).toBeGreaterThan(900);
    expect(xp).toBeLessThan(970);
  });
});

describe('calculateStatBudget', () => {
  it('should calculate iLevel 1 budget: floor(1*1.5 + 1^1.2*0.3) = floor(1.8) = 1', () => {
    const budget = calculateStatBudget(1, config);
    expect(budget).toBeGreaterThanOrEqual(1);
    expect(budget).toBeLessThanOrEqual(2);
  });

  it('should calculate iLevel 30 budget around 67', () => {
    const budget = calculateStatBudget(30, config);
    expect(budget).toBeGreaterThan(60);
    expect(budget).toBeLessThan(75);
  });

  it('should calculate iLevel 60 budget around 160', () => {
    const budget = calculateStatBudget(60, config);
    expect(budget).toBeGreaterThan(150);
    expect(budget).toBeLessThan(170);
  });
});

describe('calculateArmorReduction', () => {
  it('should calculate armor reduction correctly', () => {
    // 3000 / (3000 + 400 + 85*60) = 3000 / 8500 = 0.353
    const reduction = calculateArmorReduction(3000, 60, config);
    expect(reduction).toBeCloseTo(0.353, 2);
  });

  it('should return 0 for 0 armor', () => {
    expect(calculateArmorReduction(0, 60, config)).toBe(0);
  });
});

describe('calculateDerivedStats', () => {
  it('should calculate attack power from strength and agility', () => {
    const primary: Record<PrimaryStat, number> = {
      [PrimaryStat.Strength]: 100,
      [PrimaryStat.Agility]: 50,
      [PrimaryStat.Intellect]: 10,
      [PrimaryStat.Spirit]: 10,
      [PrimaryStat.Stamina]: 80,
    };
    const derived = calculateDerivedStats(primary, { baseHP: 120, baseMana: 200 }, {}, config);
    // AP = STR*2 + AGI*1 = 200 + 50 = 250
    expect(derived.attackPower).toBe(250);
  });

  it('should calculate max health from stamina', () => {
    const primary: Record<PrimaryStat, number> = {
      [PrimaryStat.Strength]: 10,
      [PrimaryStat.Agility]: 10,
      [PrimaryStat.Intellect]: 10,
      [PrimaryStat.Spirit]: 10,
      [PrimaryStat.Stamina]: 100,
    };
    const derived = calculateDerivedStats(primary, { baseHP: 120, baseMana: 200 }, {}, config);
    // HP = STA*10 + baseHP = 1000 + 120 = 1120
    expect(derived.maxHealth).toBe(1120);
  });

  it('should calculate crit chance from agility', () => {
    const primary: Record<PrimaryStat, number> = {
      [PrimaryStat.Strength]: 10,
      [PrimaryStat.Agility]: 104,
      [PrimaryStat.Intellect]: 10,
      [PrimaryStat.Spirit]: 10,
      [PrimaryStat.Stamina]: 10,
    };
    const derived = calculateDerivedStats(primary, { baseHP: 100, baseMana: 200 }, {}, config);
    // crit = 5.0 + (104/52) + 0 = 5.0 + 2.0 = 7.0%
    expect(derived.criticalStrike).toBeCloseTo(7.0, 1);
  });
});
```

### Step 6.2 -- Implement stat calculator

**File: `src/engine/character/stat-calculator.ts`**

```typescript
import type { IBalanceConfig } from '@shared/types/balance';
import { PrimaryStat } from '@shared/types/enums';

/**
 * XP required to advance from `level` to `level+1`.
 * Formula: floor(linearCoeff * level + powerCoeff * level^powerExponent)
 */
export function xpToNextLevel(level: number, config: IBalanceConfig): number {
  if (level >= 60) return 0;
  const { linearCoeff, powerCoeff, powerExponent } = config.xp;
  return Math.floor(linearCoeff * level + powerCoeff * Math.pow(level, powerExponent));
}

/**
 * Monster HP at a given level.
 * Formula: floor(hpBase + level * hpLinear + level^hpPowerExponent * hpPowerCoeff)
 */
export function calculateMonsterHP(level: number, config: IBalanceConfig): number {
  const { hpBase, hpLinear, hpPowerExponent, hpPowerCoeff } = config.monsters;
  return Math.floor(hpBase + level * hpLinear + Math.pow(level, hpPowerExponent) * hpPowerCoeff);
}

/**
 * Monster damage per hit at a given level.
 */
export function calculateMonsterDamage(level: number, config: IBalanceConfig): number {
  const { damageBase, damageLinear, damagePowerExponent, damagePowerCoeff } = config.monsters;
  return Math.floor(damageBase + level * damageLinear + Math.pow(level, damagePowerExponent) * damagePowerCoeff);
}

/**
 * Monster XP reward at a given level.
 */
export function calculateMonsterXP(level: number, config: IBalanceConfig): number {
  const { xpBase, xpLinear, xpPowerExponent, xpPowerCoeff } = config.monsters;
  return Math.floor(xpBase + level * xpLinear + Math.pow(level, xpPowerExponent) * xpPowerCoeff);
}

/**
 * Item stat budget at a given iLevel.
 * Formula: floor(iLevel * budgetLinearCoeff + iLevel^budgetPowerExponent * budgetPowerCoeff)
 */
export function calculateStatBudget(iLevel: number, config: IBalanceConfig): number {
  const { budgetLinearCoeff, budgetPowerExponent, budgetPowerCoeff } = config.gear;
  return Math.floor(iLevel * budgetLinearCoeff + Math.pow(iLevel, budgetPowerExponent) * budgetPowerCoeff);
}

/**
 * Weapon minimum damage.
 * Formula: floor((iLevel * levelCoeff + levelBase) * qualityMult * (weaponSpeed / 2.0))
 */
export function calculateWeaponMinDamage(
  iLevel: number,
  qualityMultiplier: number,
  weaponSpeed: number,
  config: IBalanceConfig,
): number {
  const { levelCoeff, levelBase } = config.gear.weaponMinDmgFormula;
  return Math.floor((iLevel * levelCoeff + levelBase) * qualityMultiplier * (weaponSpeed / 2.0));
}

/**
 * Weapon maximum damage.
 */
export function calculateWeaponMaxDamage(
  iLevel: number,
  qualityMultiplier: number,
  weaponSpeed: number,
  config: IBalanceConfig,
): number {
  const minDmg = calculateWeaponMinDamage(iLevel, qualityMultiplier, weaponSpeed, config);
  return Math.floor(minDmg * config.gear.weaponMaxDmgMultiplier);
}

/**
 * Physical armor damage reduction percentage (0 to 1).
 * Formula: armor / (armor + 400 + 85 * attackerLevel)
 */
export function calculateArmorReduction(
  armor: number,
  attackerLevel: number,
  _config: IBalanceConfig,
): number {
  if (armor <= 0) return 0;
  return armor / (armor + 400 + 85 * attackerLevel);
}

/**
 * Spell resistance damage reduction percentage (0 to 1).
 */
export function calculateResistReduction(
  resistance: number,
  attackerLevel: number,
  _config: IBalanceConfig,
): number {
  if (resistance <= 0) return 0;
  return resistance / (resistance + 400 + 85 * attackerLevel);
}

/** Gear bonus stats for derived calculation */
export interface IGearBonuses {
  attackPower?: number;
  spellPower?: number;
  critRating?: number;
  hasteRating?: number;
  hitRating?: number;
  armor?: number;
  resistance?: number;
  dodgeRating?: number;
  parryRating?: number;
  health?: number;
  mana?: number;
  healthRegen?: number;
  manaRegen?: number;
}

/** Base class values needed for derived stats */
export interface IClassBases {
  baseHP: number;
  baseMana: number;
}

/** Derived stat results */
export interface IDerivedStats {
  attackPower: number;
  spellPower: number;
  criticalStrike: number;
  haste: number;
  armor: number;
  resistance: number;
  hitRating: number;
  dodge: number;
  parry: number;
  maxHealth: number;
  maxMana: number;
  healthRegen: number;
  manaRegen: number;
}

/**
 * Calculate all derived/secondary stats from primary stats, class bases, and gear bonuses.
 */
export function calculateDerivedStats(
  primary: Record<PrimaryStat, number>,
  classBases: IClassBases,
  gear: IGearBonuses,
  config: IBalanceConfig,
): IDerivedStats {
  const str = primary[PrimaryStat.Strength];
  const agi = primary[PrimaryStat.Agility];
  const int = primary[PrimaryStat.Intellect];
  const spi = primary[PrimaryStat.Spirit];
  const sta = primary[PrimaryStat.Stamina];

  const s = config.stats;

  return {
    attackPower: str * s.attackPowerPerStrength + agi * s.attackPowerPerAgility + (gear.attackPower ?? 0),
    spellPower: int * s.spellPowerPerIntellect + (gear.spellPower ?? 0),
    criticalStrike: s.baseCritPercent + (agi / s.agiPerCritPercent) + ((gear.critRating ?? 0) / s.critRatingPerPercent),
    haste: (gear.hasteRating ?? 0) / s.hasteRatingPerPercent,
    armor: (gear.armor ?? 0) + agi * s.armorPerAgility + sta * s.armorPerStamina,
    resistance: (gear.resistance ?? 0) + int * s.resistPerIntellect,
    hitRating: (gear.hitRating ?? 0) / s.hitRatingPerPercent,
    dodge: s.baseDodgePercent + (agi / 60.0) + ((gear.dodgeRating ?? 0) / s.dodgeRatingPerPercent),
    parry: s.baseParryPercent + ((gear.parryRating ?? 0) / s.parryRatingPerPercent),
    maxHealth: sta * s.healthPerStamina + classBases.baseHP + (gear.health ?? 0),
    maxMana: int * s.manaPerIntellect + classBases.baseMana + (gear.mana ?? 0),
    healthRegen: spi * s.healthRegenPerSpirit + (gear.healthRegen ?? 0),
    manaRegen: spi * s.manaRegenPerSpirit + int * s.manaRegenPerIntellect + (gear.manaRegen ?? 0),
  };
}

/**
 * Calculate primary stats at a given level.
 * stat(level) = classBaseStat + racialBonus + (growthRate * (level - 1))
 */
export function calculatePrimaryStats(
  classBase: Record<PrimaryStat, number>,
  raceBonus: Record<PrimaryStat, number>,
  growthRates: Record<PrimaryStat, number>,
  level: number,
): Record<PrimaryStat, number> {
  const result = {} as Record<PrimaryStat, number>;
  for (const stat of Object.values(PrimaryStat)) {
    result[stat] = Math.floor(
      classBase[stat] + raceBonus[stat] + growthRates[stat] * (level - 1),
    );
  }
  return result;
}

/**
 * XP level-difference modifier.
 * Returns multiplier based on how monster level compares to player level.
 */
export function getLevelDiffXpModifier(
  playerLevel: number,
  monsterLevel: number,
  config: IBalanceConfig,
): number {
  const diff = monsterLevel - playerLevel;
  const t = config.xp.levelDiffThresholds;
  const m = config.xp.levelDiffMods;

  if (diff >= t.tooHighAbove) return m.tooHigh;
  if (diff >= t.bonusAbove) return m.above3;
  if (diff >= t.normalAbove) return m.normal;
  if (diff >= t.reducedAbove) return m.below5;
  if (diff >= t.greatlyReducedAbove) return m.below8;
  return m.gray;
}
```

**Run:** `pnpm test -- tests/unit/engine/character/stat-calculator.test.ts` -- should PASS.

**Commit:** `feat(engine): add stat calculator with XP curves, monster scaling, and derived stats`

---

## Task 7 -- Character Creation (Race + Class + Starting Gear)

**Worktree:** `feat/combat-engine`
**Branch:** `feat/combat-engine`
**Depends on:** Tasks 2-6

### Step 7.1 -- Create races.json data file

**File: `data/races.json`**

```json
[
  {
    "id": "valeborn",
    "name": "Valeborn",
    "description": "Adaptable descendants of wandering explorers. Balanced stats make them suitable for any class.",
    "statBonuses": { "str": 2, "agi": 2, "int": 2, "spi": 2, "sta": 2 },
    "racialAbility": {
      "id": "versatile-learner",
      "name": "Versatile Learner",
      "description": "+10% Quest XP",
      "effectType": "xp_percent",
      "value": 0.10
    },
    "recommendedClasses": ["blademaster", "sentinel", "stalker", "channeler", "shapeshifter"]
  },
  {
    "id": "stoneguard",
    "name": "Stoneguard",
    "description": "Mountain-dwelling warriors carved from living stone. Built for frontline combat.",
    "statBonuses": { "str": 5, "agi": 0, "int": 0, "spi": 0, "sta": 5 },
    "racialAbility": {
      "id": "iron-skin",
      "name": "Iron Skin",
      "description": "+5% Armor value",
      "effectType": "stat_percent",
      "stat": "armor",
      "value": 0.05
    },
    "recommendedClasses": ["blademaster", "sentinel"]
  },
  {
    "id": "sylvani",
    "name": "Sylvani",
    "description": "Forest-born scholars attuned to ley lines. Excel in magic and agility.",
    "statBonuses": { "str": 0, "agi": 5, "int": 5, "spi": 0, "sta": 0 },
    "racialAbility": {
      "id": "arcane-affinity",
      "name": "Arcane Affinity",
      "description": "+5% Spell Power",
      "effectType": "stat_percent",
      "stat": "spell-power",
      "value": 0.05
    },
    "recommendedClasses": ["stalker", "arcanist", "channeler", "shapeshifter"]
  },
  {
    "id": "bloodborn",
    "name": "Bloodborn",
    "description": "War-bred berserkers with crimson veins. Pure physical damage dealers.",
    "statBonuses": { "str": 7, "agi": 0, "int": 0, "spi": 0, "sta": 3 },
    "racialAbility": {
      "id": "blood-fury",
      "name": "Blood Fury",
      "description": "+10% Physical Damage",
      "effectType": "damage_percent",
      "stat": "physical",
      "value": 0.10
    },
    "recommendedClasses": ["blademaster", "sentinel", "shadow"]
  },
  {
    "id": "hollowed",
    "name": "Hollowed",
    "description": "Undead spirits bound by ancient pacts. Immune to fear and charm effects.",
    "statBonuses": { "str": 0, "agi": 0, "int": 5, "spi": 3, "sta": 0 },
    "racialAbility": {
      "id": "spectral-ward",
      "name": "Spectral Ward",
      "description": "Immune to Fear/Charm effects",
      "effectType": "immunity",
      "value": 1
    },
    "recommendedClasses": ["cleric", "arcanist", "summoner"]
  },
  {
    "id": "tinkersoul",
    "name": "Tinkersoul",
    "description": "Gnome-like inventors powered by arcane batteries. Supreme casters.",
    "statBonuses": { "str": 0, "agi": 0, "int": 7, "spi": 3, "sta": 0 },
    "racialAbility": {
      "id": "mana-capacitor",
      "name": "Mana Capacitor",
      "description": "+5% Maximum Mana",
      "effectType": "resource_percent",
      "stat": "mana",
      "value": 0.05
    },
    "recommendedClasses": ["arcanist", "summoner", "cleric"]
  },
  {
    "id": "wildkin",
    "name": "Wildkin",
    "description": "Beast-touched nomads from untamed wilds. Fast and resilient.",
    "statBonuses": { "str": 0, "agi": 5, "int": 0, "spi": 0, "sta": 5 },
    "racialAbility": {
      "id": "feral-instinct",
      "name": "Feral Instinct",
      "description": "+3% Attack Speed",
      "effectType": "stat_percent",
      "stat": "haste",
      "value": 0.03
    },
    "recommendedClasses": ["stalker", "shadow", "shapeshifter"]
  },
  {
    "id": "earthborn",
    "name": "Earthborn",
    "description": "Stone-skinned giants from the deep earth. Unmatched survivability.",
    "statBonuses": { "str": 3, "agi": 0, "int": 0, "spi": 0, "sta": 7 },
    "racialAbility": {
      "id": "living-fortitude",
      "name": "Living Fortitude",
      "description": "+5% Maximum HP",
      "effectType": "resource_percent",
      "stat": "health",
      "value": 0.05
    },
    "recommendedClasses": ["blademaster", "sentinel", "channeler"]
  }
]
```

**Commit:** `feat(data): add races.json with all 8 race definitions`

### Step 7.2 -- Create classes.json data file

**File: `data/classes.json`**

```json
[
  {
    "id": "blademaster",
    "name": "Blademaster",
    "description": "A master of melee weapons who harnesses rage to unleash devastating attacks.",
    "primaryStats": ["str", "sta"],
    "roles": ["tank", "melee_dps"],
    "resourceType": "rage",
    "armorType": "plate",
    "weaponTypes": ["sword-1h", "sword-2h", "mace-1h", "mace-2h", "axe-1h", "axe-2h"],
    "specs": [
      { "id": "weapon-arts", "name": "Weapon Arts", "description": "Master of blade techniques, focused on sustained DPS.", "role": "melee_dps", "icon": "spec-weapon-arts" },
      { "id": "berserker", "name": "Berserker", "description": "Frenzied warrior dealing massive burst damage.", "role": "melee_dps", "icon": "spec-berserker" },
      { "id": "guardian", "name": "Guardian", "description": "Iron-willed protector who absorbs damage for allies.", "role": "tank", "icon": "spec-guardian" }
    ],
    "baseStats": { "str": 25, "agi": 15, "int": 8, "spi": 10, "sta": 22 },
    "baseHP": 120,
    "baseResource": 100,
    "statGrowth": { "str": 2.5, "agi": 1.0, "int": 0.3, "spi": 0.5, "sta": 2.0 }
  },
  {
    "id": "sentinel",
    "name": "Sentinel",
    "description": "A holy warrior who can protect, heal, or smite with divine power.",
    "primaryStats": ["str", "sta", "spi"],
    "roles": ["tank", "melee_dps", "healer"],
    "resourceType": "mana",
    "armorType": "plate",
    "weaponTypes": ["sword-1h", "mace-1h", "axe-1h", "sword-2h", "mace-2h", "shield"],
    "specs": [
      { "id": "light", "name": "Light", "description": "Channel holy light to mend wounds and protect allies.", "role": "healer", "icon": "spec-light" },
      { "id": "defender", "name": "Defender", "description": "An unbreakable shield wall, built to absorb punishment.", "role": "tank", "icon": "spec-defender" },
      { "id": "vengeance", "name": "Vengeance", "description": "Righteous fury fuels devastating holy strikes.", "role": "melee_dps", "icon": "spec-vengeance" }
    ],
    "baseStats": { "str": 22, "agi": 12, "int": 14, "spi": 16, "sta": 20 },
    "baseHP": 110,
    "baseResource": 200,
    "statGrowth": { "str": 2.0, "agi": 0.8, "int": 1.0, "spi": 1.2, "sta": 1.8 }
  },
  {
    "id": "stalker",
    "name": "Stalker",
    "description": "A cunning hunter who strikes from range with deadly precision.",
    "primaryStats": ["agi", "sta"],
    "roles": ["ranged_dps", "melee_dps"],
    "resourceType": "mana",
    "armorType": "mail",
    "weaponTypes": ["bow", "crossbow", "sword-1h", "axe-1h", "dagger"],
    "specs": [
      { "id": "beast-bond", "name": "Beast Bond", "description": "Fight alongside a bonded beast companion.", "role": "ranged_dps", "icon": "spec-beast-bond" },
      { "id": "precision", "name": "Precision", "description": "Every shot placed with surgical accuracy.", "role": "ranged_dps", "icon": "spec-precision" },
      { "id": "survival", "name": "Survival", "description": "Master of traps and close-quarters combat.", "role": "melee_dps", "icon": "spec-survival" }
    ],
    "baseStats": { "str": 12, "agi": 24, "int": 14, "spi": 12, "sta": 18 },
    "baseHP": 100,
    "baseResource": 200,
    "statGrowth": { "str": 0.8, "agi": 2.5, "int": 1.0, "spi": 0.8, "sta": 1.5 }
  },
  {
    "id": "shadow",
    "name": "Shadow",
    "description": "A deadly assassin who strikes from the darkness with poisoned blades.",
    "primaryStats": ["agi", "sta"],
    "roles": ["melee_dps"],
    "resourceType": "energy",
    "armorType": "leather",
    "weaponTypes": ["dagger", "sword-1h", "mace-1h"],
    "specs": [
      { "id": "venom", "name": "Venom", "description": "Apply deadly poisons that eat away at targets over time.", "role": "melee_dps", "icon": "spec-venom" },
      { "id": "blade-dance", "name": "Blade Dance", "description": "A whirlwind of steel, dealing rapid burst damage.", "role": "melee_dps", "icon": "spec-blade-dance" },
      { "id": "stealth", "name": "Stealth", "description": "Strike from the shadows for devastating opening attacks.", "role": "melee_dps", "icon": "spec-stealth" }
    ],
    "baseStats": { "str": 12, "agi": 26, "int": 8, "spi": 10, "sta": 16 },
    "baseHP": 90,
    "baseResource": 100,
    "statGrowth": { "str": 0.8, "agi": 2.8, "int": 0.3, "spi": 0.5, "sta": 1.2 }
  },
  {
    "id": "cleric",
    "name": "Cleric",
    "description": "A devoted priest who channels divine magic for healing or destruction.",
    "primaryStats": ["int", "spi"],
    "roles": ["healer", "ranged_dps"],
    "resourceType": "mana",
    "armorType": "cloth",
    "weaponTypes": ["staff", "mace-1h", "wand", "offhand-held"],
    "specs": [
      { "id": "order", "name": "Order", "description": "Master healer, keeping allies alive through any trial.", "role": "healer", "icon": "spec-order" },
      { "id": "radiance", "name": "Radiance", "description": "Unleash holy fire to burn enemies with sacred light.", "role": "ranged_dps", "icon": "spec-radiance" },
      { "id": "void", "name": "Void", "description": "Tap into shadow magic for damage over time and mind attacks.", "role": "ranged_dps", "icon": "spec-void" }
    ],
    "baseStats": { "str": 8, "agi": 10, "int": 24, "spi": 22, "sta": 14 },
    "baseHP": 80,
    "baseResource": 300,
    "statGrowth": { "str": 0.3, "agi": 0.5, "int": 2.2, "spi": 2.0, "sta": 1.0 }
  },
  {
    "id": "arcanist",
    "name": "Arcanist",
    "description": "A wielder of pure arcane energy, commanding fire, frost, and raw magic.",
    "primaryStats": ["int", "spi"],
    "roles": ["ranged_dps"],
    "resourceType": "mana",
    "armorType": "cloth",
    "weaponTypes": ["staff", "wand", "sword-1h", "offhand-held"],
    "specs": [
      { "id": "spellweave", "name": "Spellweave", "description": "Master of raw arcane energy, efficient and versatile.", "role": "ranged_dps", "icon": "spec-spellweave" },
      { "id": "pyromancy", "name": "Pyromancy", "description": "Unleash devastating fire spells for massive burst damage.", "role": "ranged_dps", "icon": "spec-pyromancy" },
      { "id": "cryomancy", "name": "Cryomancy", "description": "Freeze and shatter enemies with ice magic.", "role": "ranged_dps", "icon": "spec-cryomancy" }
    ],
    "baseStats": { "str": 6, "agi": 10, "int": 28, "spi": 18, "sta": 12 },
    "baseHP": 70,
    "baseResource": 350,
    "statGrowth": { "str": 0.2, "agi": 0.5, "int": 2.8, "spi": 1.5, "sta": 0.8 }
  },
  {
    "id": "summoner",
    "name": "Summoner",
    "description": "A dark caster who commands demons and curses to destroy enemies.",
    "primaryStats": ["int", "sta"],
    "roles": ["ranged_dps"],
    "resourceType": "mana",
    "armorType": "cloth",
    "weaponTypes": ["staff", "wand", "dagger", "offhand-held"],
    "specs": [
      { "id": "corruption", "name": "Corruption", "description": "Stack curses and dots that consume the enemy from within.", "role": "ranged_dps", "icon": "spec-corruption" },
      { "id": "pact-binding", "name": "Pact Binding", "description": "Empower a summoned demon to fight by your side.", "role": "ranged_dps", "icon": "spec-pact-binding" },
      { "id": "chaos", "name": "Chaos", "description": "Channel raw chaotic energy for devastating burst spells.", "role": "ranged_dps", "icon": "spec-chaos" }
    ],
    "baseStats": { "str": 8, "agi": 10, "int": 26, "spi": 16, "sta": 16 },
    "baseHP": 80,
    "baseResource": 320,
    "statGrowth": { "str": 0.3, "agi": 0.5, "int": 2.5, "spi": 1.2, "sta": 1.2 }
  },
  {
    "id": "channeler",
    "name": "Channeler",
    "description": "A versatile caster wielding the power of storms and spirits.",
    "primaryStats": ["int", "agi", "sta"],
    "roles": ["ranged_dps", "healer", "melee_dps"],
    "resourceType": "mana",
    "armorType": "mail",
    "weaponTypes": ["mace-1h", "axe-1h", "staff", "shield", "offhand-held"],
    "specs": [
      { "id": "storm-calling", "name": "Storm Calling", "description": "Command lightning and thunder to devastate enemies.", "role": "ranged_dps", "icon": "spec-storm-calling" },
      { "id": "spirit-weapon", "name": "Spirit Weapon", "description": "Imbue weapons with elemental energy for melee combat.", "role": "melee_dps", "icon": "spec-spirit-weapon" },
      { "id": "renewal", "name": "Renewal", "description": "Tap into water and earth spirits to restore life.", "role": "healer", "icon": "spec-renewal" }
    ],
    "baseStats": { "str": 14, "agi": 16, "int": 22, "spi": 14, "sta": 18 },
    "baseHP": 100,
    "baseResource": 280,
    "statGrowth": { "str": 1.0, "agi": 1.2, "int": 2.0, "spi": 1.0, "sta": 1.5 }
  },
  {
    "id": "shapeshifter",
    "name": "Shapeshifter",
    "description": "A nature-bound caster who can shift forms to tank, DPS, or heal.",
    "primaryStats": ["int", "agi", "str"],
    "roles": ["tank", "melee_dps", "healer", "ranged_dps"],
    "resourceType": "mana",
    "armorType": "leather",
    "weaponTypes": ["staff", "mace-1h", "dagger", "offhand-held"],
    "specs": [
      { "id": "astral", "name": "Astral", "description": "Harness moonlight and starfire for ranged destruction.", "role": "ranged_dps", "icon": "spec-astral" },
      { "id": "primal", "name": "Primal", "description": "Shift into beast form for savage melee and tanking.", "role": "melee_dps", "icon": "spec-primal" },
      { "id": "grove-warden", "name": "Grove Warden", "description": "Channel nature to heal wounds with regenerative magic.", "role": "healer", "icon": "spec-grove-warden" }
    ],
    "baseStats": { "str": 16, "agi": 18, "int": 20, "spi": 14, "sta": 18 },
    "baseHP": 100,
    "baseResource": 260,
    "statGrowth": { "str": 1.2, "agi": 1.5, "int": 1.8, "spi": 1.0, "sta": 1.5 }
  }
]
```

**Commit:** `feat(data): add classes.json with all 9 class definitions`

### Step 7.3 -- Write character factory tests and implementation

**Test file: `tests/unit/engine/character/character-factory.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { createCharacter } from '@engine/character/character-factory';
import { Race, CharacterClass, PrimaryStat, GearSlot } from '@shared/types/enums';

describe('createCharacter', () => {
  it('should create a level 1 character with correct name, race, and class', () => {
    const char = createCharacter({ name: 'Testchar', race: Race.Bloodborn, classId: CharacterClass.Blademaster });
    expect(char.name).toBe('Testchar');
    expect(char.race).toBe(Race.Bloodborn);
    expect(char.classId).toBe(CharacterClass.Blademaster);
    expect(char.level).toBe(1);
    expect(char.currentXP).toBe(0);
  });

  it('should compute starting stats = class base + race bonus', () => {
    // Bloodborn Blademaster: STR 25+7=32, AGI 15+0=15, INT 8+0=8, SPI 10+0=10, STA 22+3=25
    const char = createCharacter({ name: 'Test', race: Race.Bloodborn, classId: CharacterClass.Blademaster });
    expect(char.primaryStats[PrimaryStat.Strength]).toBe(32);
    expect(char.primaryStats[PrimaryStat.Agility]).toBe(15);
    expect(char.primaryStats[PrimaryStat.Intellect]).toBe(8);
    expect(char.primaryStats[PrimaryStat.Spirit]).toBe(10);
    expect(char.primaryStats[PrimaryStat.Stamina]).toBe(25);
  });

  it('should assign starting equipment for the class', () => {
    const char = createCharacter({ name: 'Test', race: Race.Valeborn, classId: CharacterClass.Blademaster });
    expect(char.equipment[GearSlot.MainHand]).not.toBeNull();
    expect(char.equipment[GearSlot.Chest]).not.toBeNull();
    expect(char.equipment[GearSlot.Head]).not.toBeNull();
  });

  it('should have a unique UUID', () => {
    const c1 = createCharacter({ name: 'A', race: Race.Valeborn, classId: CharacterClass.Cleric });
    const c2 = createCharacter({ name: 'B', race: Race.Valeborn, classId: CharacterClass.Cleric });
    expect(c1.id).not.toBe(c2.id);
  });

  it('should start with gold = 0', () => {
    const char = createCharacter({ name: 'Test', race: Race.Valeborn, classId: CharacterClass.Arcanist });
    expect(char.gold).toBe(0);
  });

  it('should start in zone_01', () => {
    const char = createCharacter({ name: 'Test', race: Race.Valeborn, classId: CharacterClass.Shadow });
    expect(char.currentZoneId).toBe('zone_01');
  });
});
```

**Implementation file: `src/engine/character/character-factory.ts`**

```typescript
import { v4 as uuidv4 } from 'crypto';
import { Race, CharacterClass, PrimaryStat, GearSlot, ItemQuality, ResourceType } from '@shared/types/enums';
import type { ICharacterCreationParams, IPrimaryStatBlock, IClassDefinition, IRaceDefinition } from '@shared/types/character';
import type { IItem } from '@shared/types/item';
import racesData from '@data/races.json';
import classesData from '@data/classes.json';

/** Internal character state (engine-owned) */
export interface ICharacterState {
  id: string;
  name: string;
  race: Race;
  classId: CharacterClass;
  level: number;
  currentXP: number;
  gold: number;
  primaryStats: IPrimaryStatBlock;
  currentHP: number;
  maxHP: number;
  currentResource: number;
  maxResource: number;
  resourceType: ResourceType;
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  currentZoneId: string;
  deathCount: number;
  totalKills: number;
  totalQuestsCompleted: number;
  respecCount: number;
  playTimeSeconds: number;
}

export function getRaceDefinition(race: Race): IRaceDefinition {
  const def = (racesData as IRaceDefinition[]).find(r => r.id === race);
  if (!def) throw new Error(`Unknown race: ${race}`);
  return def;
}

export function getClassDefinition(classId: CharacterClass): IClassDefinition {
  const def = (classesData as unknown as IClassDefinition[]).find(c => c.id === classId);
  if (!def) throw new Error(`Unknown class: ${classId}`);
  return def;
}

function createStarterItem(
  name: string,
  slot: GearSlot,
  primaryStat: PrimaryStat,
): IItem {
  return {
    id: crypto.randomUUID(),
    templateId: `starter-${slot}`,
    name,
    slot,
    quality: ItemQuality.Common,
    iLevel: 1,
    requiredLevel: 1,
    primaryStats: { [primaryStat]: 1, [PrimaryStat.Stamina]: 1 },
    secondaryStats: {},
    durability: { current: 100, max: 100 },
    sellValue: 1,
  };
}

function getStarterGear(classDef: IClassDefinition): Partial<Record<GearSlot, IItem>> {
  const mainStat = classDef.primaryStats[0] as PrimaryStat;
  const armorPrefix = classDef.armorType === 'plate' ? 'Battered Plate'
    : classDef.armorType === 'mail' ? 'Worn Mail'
    : classDef.armorType === 'leather' ? 'Worn Leather'
    : 'Threadbare Cloth';

  const gear: Partial<Record<GearSlot, IItem>> = {
    [GearSlot.Head]: createStarterItem(`${armorPrefix} Helm`, GearSlot.Head, mainStat),
    [GearSlot.Chest]: createStarterItem(`${armorPrefix} Chestpiece`, GearSlot.Chest, mainStat),
    [GearSlot.Legs]: createStarterItem(`${armorPrefix} Leggings`, GearSlot.Legs, mainStat),
    [GearSlot.Feet]: createStarterItem(`${armorPrefix} Boots`, GearSlot.Feet, mainStat),
    [GearSlot.Hands]: createStarterItem(`${armorPrefix} Gloves`, GearSlot.Hands, mainStat),
  };

  // Add weapon based on class
  const weaponType = classDef.weaponTypes[0]!;
  const is2H = weaponType.includes('2h') || weaponType === 'staff' || weaponType === 'bow' || weaponType === 'crossbow';

  const weapon: IItem = {
    id: crypto.randomUUID(),
    templateId: `starter-weapon`,
    name: `Worn ${classDef.name} Weapon`,
    slot: GearSlot.MainHand,
    quality: ItemQuality.Common,
    iLevel: 1,
    requiredLevel: 1,
    weaponType,
    primaryStats: { [mainStat]: 1 },
    secondaryStats: {},
    weaponDamage: { min: is2H ? 5 : 3, max: is2H ? 8 : 5 },
    weaponSpeed: is2H ? 3.0 : 2.0,
    durability: { current: 100, max: 100 },
    sellValue: 1,
  };

  gear[GearSlot.MainHand] = weapon;

  return gear;
}

export function createCharacter(params: ICharacterCreationParams): ICharacterState {
  const raceDef = getRaceDefinition(params.race);
  const classDef = getClassDefinition(params.classId);

  const primaryStats: IPrimaryStatBlock = {
    [PrimaryStat.Strength]: classDef.baseStats[PrimaryStat.Strength] + raceDef.statBonuses[PrimaryStat.Strength],
    [PrimaryStat.Agility]: classDef.baseStats[PrimaryStat.Agility] + raceDef.statBonuses[PrimaryStat.Agility],
    [PrimaryStat.Intellect]: classDef.baseStats[PrimaryStat.Intellect] + raceDef.statBonuses[PrimaryStat.Intellect],
    [PrimaryStat.Spirit]: classDef.baseStats[PrimaryStat.Spirit] + raceDef.statBonuses[PrimaryStat.Spirit],
    [PrimaryStat.Stamina]: classDef.baseStats[PrimaryStat.Stamina] + raceDef.statBonuses[PrimaryStat.Stamina],
  };

  const maxHP = primaryStats[PrimaryStat.Stamina] * 10 + classDef.baseHP;

  return {
    id: crypto.randomUUID(),
    name: params.name,
    race: params.race,
    classId: params.classId,
    level: 1,
    currentXP: 0,
    gold: 0,
    primaryStats,
    currentHP: maxHP,
    maxHP,
    currentResource: classDef.resourceType === ResourceType.Rage ? 0 : classDef.baseResource,
    maxResource: classDef.resourceType === ResourceType.Rage ? 100 : classDef.baseResource,
    resourceType: classDef.resourceType as ResourceType,
    equipment: getStarterGear(classDef),
    inventory: new Array(28).fill(null),
    currentZoneId: 'zone_01',
    deathCount: 0,
    totalKills: 0,
    totalQuestsCompleted: 0,
    respecCount: 0,
    playTimeSeconds: 0,
  };
}
```

Note: For `crypto.randomUUID()`, this is available in Node.js 19+ natively. If running in an older Node, install `uuid` package instead and use `import { v4 as uuidv4 } from 'uuid'`.

**Run:** `pnpm test -- tests/unit/engine/character/character-factory.test.ts` -- should PASS.

**Commit:** `feat(engine): add character factory with starting stats and gear`

---

## Task 8 -- Combat Engine (Damage Formulas + Ability Priority)

**Worktree:** `feat/combat-engine` (continues)
**Depends on:** Tasks 5, 6, 7

### Step 8.1 -- Write combat formula tests

**File: `tests/unit/engine/combat/formulas.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculatePhysicalDamage,
  calculateSpellDamage,
  calculateHealing,
} from '@engine/combat/formulas';
import { SeededRandom } from '@shared/utils/rng';
import { DamageType } from '@shared/types/enums';

describe('calculatePhysicalDamage', () => {
  it('should deal damage when hit lands', () => {
    const rng = new SeededRandom(42);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 50,
      weaponDamageMax: 100,
      attackPower: 200,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0.2,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThan(0);
    expect(result.type).toBe(DamageType.Physical);
  });

  it('should return miss when hit check fails', () => {
    const rng = new SeededRandom(42);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 50,
      weaponDamageMax: 100,
      attackPower: 200,
      weaponSpeed: 2.0,
      abilityCoefficient: 1.0,
      abilityFlatBonus: 0,
      critChance: 0,
      critMultiplier: 0.5,
      armorReduction: 0,
      hitChance: 0,
      rng,
    });
    expect(result.amount).toBe(0);
    expect(result.type).toBe(DamageType.Physical);
    expect(result.isCrit).toBe(false);
  });

  it('should apply armor reduction', () => {
    const rng = new SeededRandom(99);
    const noArmor = calculatePhysicalDamage({
      weaponDamageMin: 100, weaponDamageMax: 100,
      attackPower: 100, weaponSpeed: 2.0,
      abilityCoefficient: 1.0, abilityFlatBonus: 0,
      critChance: 0, critMultiplier: 0.5,
      armorReduction: 0, hitChance: 1.0, rng,
    });
    const rng2 = new SeededRandom(99);
    const withArmor = calculatePhysicalDamage({
      weaponDamageMin: 100, weaponDamageMax: 100,
      attackPower: 100, weaponSpeed: 2.0,
      abilityCoefficient: 1.0, abilityFlatBonus: 0,
      critChance: 0, critMultiplier: 0.5,
      armorReduction: 0.3, hitChance: 1.0, rng: rng2,
    });
    expect(withArmor.amount).toBeLessThan(noArmor.amount);
  });

  it('should never deal less than 1 damage on a hit', () => {
    const rng = new SeededRandom(1);
    const result = calculatePhysicalDamage({
      weaponDamageMin: 1, weaponDamageMax: 1,
      attackPower: 0, weaponSpeed: 2.0,
      abilityCoefficient: 1.0, abilityFlatBonus: 0,
      critChance: 0, critMultiplier: 0.5,
      armorReduction: 0.99, hitChance: 1.0, rng,
    });
    expect(result.amount).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateSpellDamage', () => {
  it('should deal spell damage when hit lands', () => {
    const rng = new SeededRandom(42);
    const result = calculateSpellDamage({
      baseDamage: 100,
      spellPower: 150,
      spellCoefficient: 0.8,
      critChance: 0,
      critMultiplier: 0.5,
      resistReduction: 0.1,
      hitChance: 1.0,
      rng,
    });
    expect(result.amount).toBeGreaterThan(0);
    expect(result.type).toBe(DamageType.Spell);
  });
});

describe('calculateHealing', () => {
  it('should produce positive healing', () => {
    const rng = new SeededRandom(42);
    const result = calculateHealing({
      baseHeal: 200,
      spellPower: 100,
      healCoefficient: 0.5,
      critChance: 0,
      critMultiplier: 0.5,
      rng,
    });
    expect(result.amount).toBeGreaterThan(200);
    expect(result.type).toBe(DamageType.Healing);
  });
});
```

### Step 8.2 -- Implement combat formulas

**File: `src/engine/combat/formulas.ts`**

```typescript
import { DamageType } from '@shared/types/enums';
import type { IDamageResult } from '@shared/types/combat';
import type { SeededRandom } from '@shared/utils/rng';

export interface IPhysicalDamageParams {
  weaponDamageMin: number;
  weaponDamageMax: number;
  attackPower: number;
  weaponSpeed: number;
  abilityCoefficient: number;
  abilityFlatBonus: number;
  critChance: number;
  critMultiplier: number;
  armorReduction: number;
  hitChance: number;
  rng: SeededRandom;
}

/**
 * Calculate physical damage.
 * baseDamage = weaponDmg + (AP / 14) * weaponSpeed
 * abilityDamage = baseDamage * coefficient + flatBonus
 * Apply crit, armor reduction.
 */
export function calculatePhysicalDamage(params: IPhysicalDamageParams): IDamageResult {
  const { rng } = params;

  // Hit check
  if (!rng.chance(params.hitChance)) {
    return { amount: 0, type: DamageType.Physical, isCrit: false };
  }

  // Roll weapon damage
  const weaponDmg = rng.nextInt(params.weaponDamageMin, params.weaponDamageMax);
  const baseDamage = weaponDmg + (params.attackPower / 14) * params.weaponSpeed;
  let abilityDamage = baseDamage * params.abilityCoefficient + params.abilityFlatBonus;

  // Crit check
  const isCrit = rng.chance(params.critChance);
  if (isCrit) {
    abilityDamage *= (1 + params.critMultiplier);
  }

  // Armor reduction
  abilityDamage *= (1 - params.armorReduction);

  return {
    amount: Math.max(1, Math.round(abilityDamage)),
    type: DamageType.Physical,
    isCrit,
  };
}

export interface ISpellDamageParams {
  baseDamage: number;
  spellPower: number;
  spellCoefficient: number;
  critChance: number;
  critMultiplier: number;
  resistReduction: number;
  hitChance: number;
  rng: SeededRandom;
}

/**
 * Calculate spell damage.
 * damage = baseDamage + (spellPower * coefficient)
 * Apply crit, resistance reduction.
 */
export function calculateSpellDamage(params: ISpellDamageParams): IDamageResult {
  const { rng } = params;

  if (!rng.chance(params.hitChance)) {
    return { amount: 0, type: DamageType.Spell, isCrit: false };
  }

  let damage = params.baseDamage + params.spellPower * params.spellCoefficient;

  const isCrit = rng.chance(params.critChance);
  if (isCrit) {
    damage *= (1 + params.critMultiplier);
  }

  damage *= (1 - params.resistReduction);

  return {
    amount: Math.max(1, Math.round(damage)),
    type: DamageType.Spell,
    isCrit,
  };
}

export interface IHealingParams {
  baseHeal: number;
  spellPower: number;
  healCoefficient: number;
  critChance: number;
  critMultiplier: number;
  rng: SeededRandom;
}

/**
 * Calculate healing.
 * heal = baseHeal + (spellPower * coefficient)
 * Apply crit. No miss check on heals.
 */
export function calculateHealing(params: IHealingParams): IDamageResult {
  const { rng } = params;

  let healing = params.baseHeal + params.spellPower * params.healCoefficient;

  const isCrit = rng.chance(params.critChance);
  if (isCrit) {
    healing *= (1 + params.critMultiplier);
  }

  return {
    amount: Math.max(1, Math.round(healing)),
    type: DamageType.Healing,
    isCrit,
  };
}
```

**Run:** `pnpm test -- tests/unit/engine/combat/formulas.test.ts` -- should PASS.

**Commit:** `feat(combat): add damage and healing formula implementations with tests`

### Step 8.3 -- Write and implement ability priority system

**Test file: `tests/unit/engine/combat/ability-priority.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { selectNextAbility } from '@engine/combat/ability-priority';
import type { IAbilityPriorityEntry } from '@engine/combat/ability-priority';
import { ResourceType } from '@shared/types/enums';

describe('selectNextAbility', () => {
  const basePriority: IAbilityPriorityEntry[] = [
    {
      abilityId: 'execute',
      enabled: true,
      conditions: [{ type: 'target_health_below', percent: 20 }],
    },
    {
      abilityId: 'mortal-strike',
      enabled: true,
      conditions: [{ type: 'always' }],
    },
    {
      abilityId: 'heroic-strike',
      enabled: true,
      conditions: [{ type: 'resource_above', resource: ResourceType.Rage, percent: 60 }],
    },
  ];

  it('should select execute when target HP is below 20%', () => {
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 10, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('execute');
  });

  it('should skip execute and select mortal-strike when target HP is above 20%', () => {
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('mortal-strike');
  });

  it('should skip abilities on cooldown', () => {
    const cooldowns = new Map<string, number>();
    cooldowns.set('mortal-strike', 3);
    const result = selectNextAbility(
      basePriority,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      cooldowns,
    );
    expect(result).toBe('heroic-strike');
  });

  it('should return null when no abilities are usable', () => {
    const cooldowns = new Map<string, number>();
    cooldowns.set('execute', 1);
    cooldowns.set('mortal-strike', 1);
    cooldowns.set('heroic-strike', 1);
    const result = selectNextAbility(
      basePriority,
      { currentResource: 10, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 80, maxHP: 100 },
      cooldowns,
    );
    expect(result).toBeNull();
  });

  it('should skip disabled abilities', () => {
    const priorities: IAbilityPriorityEntry[] = [
      { abilityId: 'disabled-ability', enabled: false, conditions: [{ type: 'always' }] },
      { abilityId: 'active-ability', enabled: true, conditions: [{ type: 'always' }] },
    ];
    const result = selectNextAbility(
      priorities,
      { currentResource: 50, maxResource: 100, currentHP: 500, maxHP: 500 },
      { currentHP: 50, maxHP: 100 },
      new Map(),
    );
    expect(result).toBe('active-ability');
  });
});
```

**Implementation file: `src/engine/combat/ability-priority.ts`**

```typescript
import { ResourceType } from '@shared/types/enums';

export type AbilityCondition =
  | { type: 'resource_above'; resource: ResourceType; percent: number }
  | { type: 'resource_below'; resource: ResourceType; percent: number }
  | { type: 'target_health_below'; percent: number }
  | { type: 'target_health_above'; percent: number }
  | { type: 'buff_missing'; buffId: string }
  | { type: 'debuff_missing_on_target'; debuffId: string }
  | { type: 'cooldown_ready' }
  | { type: 'always' };

export interface IAbilityPriorityEntry {
  abilityId: string;
  enabled: boolean;
  conditions: AbilityCondition[];
}

interface ICombatantState {
  currentResource: number;
  maxResource: number;
  currentHP: number;
  maxHP: number;
}

interface ITargetState {
  currentHP: number;
  maxHP: number;
}

function meetsCondition(
  condition: AbilityCondition,
  character: ICombatantState,
  target: ITargetState,
): boolean {
  switch (condition.type) {
    case 'always':
      return true;
    case 'target_health_below':
      return (target.currentHP / target.maxHP) * 100 < condition.percent;
    case 'target_health_above':
      return (target.currentHP / target.maxHP) * 100 > condition.percent;
    case 'resource_above':
      return (character.currentResource / character.maxResource) * 100 > condition.percent;
    case 'resource_below':
      return (character.currentResource / character.maxResource) * 100 < condition.percent;
    case 'buff_missing':
      return true; // Simplified for Phase 1 -- buff tracking handled by combat system
    case 'debuff_missing_on_target':
      return true; // Simplified for Phase 1
    case 'cooldown_ready':
      return true; // Cooldown check is done externally before this
    default:
      return false;
  }
}

/**
 * Evaluate the ability priority list and return the first usable ability ID,
 * or null if no abilities can be used.
 */
export function selectNextAbility(
  priorities: IAbilityPriorityEntry[],
  character: ICombatantState,
  target: ITargetState,
  cooldowns: Map<string, number>,
): string | null {
  for (const entry of priorities) {
    if (!entry.enabled) continue;
    if (cooldowns.has(entry.abilityId) && (cooldowns.get(entry.abilityId) ?? 0) > 0) continue;
    if (entry.conditions.every(c => meetsCondition(c, character, target))) {
      return entry.abilityId;
    }
  }
  return null;
}
```

**Run:** `pnpm test -- tests/unit/engine/combat/ability-priority.test.ts` -- should PASS.

**Commit:** `feat(combat): add ability priority system with condition evaluation`

### Step 8.4 -- Write EventBus and GameSystem interface

**File: `src/engine/events/event-bus.ts`**

```typescript
import type { EngineEventType } from '@shared/types/ipc';

export interface IGameEvent<T = unknown> {
  type: EngineEventType;
  payload: T;
}

export class EventBus {
  private queue: IGameEvent[] = [];

  emit<T>(type: EngineEventType, payload: T): void {
    this.queue.push({ type, payload });
  }

  drain(): IGameEvent[] {
    const events = this.queue;
    this.queue = [];
    return events;
  }

  get pending(): number {
    return this.queue.length;
  }
}
```

**File: `src/engine/systems/game-system.ts`**

```typescript
export interface IGameSystem {
  update(state: unknown, deltaMs: number): void;
}
```

**Commit:** `feat(engine): add EventBus and GameSystem interface`

---

## Task 9 -- XP and Leveling System

**Worktree:** `feat/character-system`
**Branch:** `feat/character-system`
**Depends on:** Tasks 6, 7, 8

### Step 9.1 -- Write XP system tests

**File: `tests/unit/engine/progression/xp-system.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { awardXP, canGainXPFromMonster } from '@engine/progression/xp-system';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('canGainXPFromMonster', () => {
  it('should return false if monster is 5+ levels above player', () => {
    expect(canGainXPFromMonster(10, 15, config)).toBe(false);
  });

  it('should return true for same-level monster', () => {
    expect(canGainXPFromMonster(10, 10, config)).toBe(true);
  });

  it('should return false for gray monsters (8+ levels below)', () => {
    expect(canGainXPFromMonster(20, 11, config)).toBe(false);
  });

  it('should return true for monsters slightly below', () => {
    expect(canGainXPFromMonster(20, 18, config)).toBe(true);
  });
});

describe('awardXP', () => {
  it('should level up when XP exceeds threshold', () => {
    const result = awardXP({
      currentLevel: 1,
      currentXP: 100,
      xpGained: 100,
      config,
    });
    // XP to level 2 = 150. With 100 current + 100 gained = 200, should level to 2 with 50 remainder
    expect(result.newLevel).toBe(2);
    expect(result.remainingXP).toBe(50);
    expect(result.levelsGained).toBe(1);
  });

  it('should handle multiple level-ups from large XP gains', () => {
    const result = awardXP({
      currentLevel: 1,
      currentXP: 0,
      xpGained: 50000,
      config,
    });
    expect(result.newLevel).toBeGreaterThan(5);
    expect(result.levelsGained).toBeGreaterThan(4);
  });

  it('should not exceed level 60', () => {
    const result = awardXP({
      currentLevel: 59,
      currentXP: 60000,
      xpGained: 100000,
      config,
    });
    expect(result.newLevel).toBe(60);
  });

  it('should not gain XP at level 60', () => {
    const result = awardXP({
      currentLevel: 60,
      currentXP: 0,
      xpGained: 1000,
      config,
    });
    expect(result.newLevel).toBe(60);
    expect(result.levelsGained).toBe(0);
    expect(result.remainingXP).toBe(0);
  });
});
```

### Step 9.2 -- Implement XP system

**File: `src/engine/progression/xp-system.ts`**

```typescript
import type { IBalanceConfig } from '@shared/types/balance';
import { xpToNextLevel, getLevelDiffXpModifier } from '@engine/character/stat-calculator';

const MAX_LEVEL = 60;

export function canGainXPFromMonster(
  playerLevel: number,
  monsterLevel: number,
  config: IBalanceConfig,
): boolean {
  const modifier = getLevelDiffXpModifier(playerLevel, monsterLevel, config);
  return modifier > 0;
}

export function getXPFromMonsterKill(
  playerLevel: number,
  monsterLevel: number,
  baseMonsterXP: number,
  config: IBalanceConfig,
): number {
  const modifier = getLevelDiffXpModifier(playerLevel, monsterLevel, config);
  return Math.floor(baseMonsterXP * modifier);
}

export interface IAwardXPParams {
  currentLevel: number;
  currentXP: number;
  xpGained: number;
  config: IBalanceConfig;
}

export interface IAwardXPResult {
  newLevel: number;
  remainingXP: number;
  levelsGained: number;
  totalXPAbsorbed: number;
}

/**
 * Award XP and handle level-ups. Returns new level and remaining XP.
 */
export function awardXP(params: IAwardXPParams): IAwardXPResult {
  let { currentLevel, currentXP } = params;
  const { xpGained, config } = params;
  const startLevel = currentLevel;

  if (currentLevel >= MAX_LEVEL) {
    return { newLevel: MAX_LEVEL, remainingXP: 0, levelsGained: 0, totalXPAbsorbed: 0 };
  }

  let xpPool = currentXP + xpGained;
  let totalAbsorbed = xpGained;

  while (currentLevel < MAX_LEVEL) {
    const needed = xpToNextLevel(currentLevel, config);
    if (needed <= 0) break;
    if (xpPool < needed) break;

    xpPool -= needed;
    currentLevel++;
  }

  // Clamp at max level
  if (currentLevel >= MAX_LEVEL) {
    xpPool = 0;
  }

  return {
    newLevel: currentLevel,
    remainingXP: xpPool,
    levelsGained: currentLevel - startLevel,
    totalXPAbsorbed: totalAbsorbed,
  };
}
```

**Run:** `pnpm test -- tests/unit/engine/progression/xp-system.test.ts` -- should PASS.

**Commit:** `feat(progression): add XP system with level-up logic and level difference modifiers`

### Step 9.3 -- Create zones data file

**File: `data/zones/zones.json`**

```json
[
  { "id": "zone_01", "name": "Sunstone Valley", "description": "A peaceful starting valley with gentle hills and farmsteads.", "levelRange": { "min": 1, "max": 5 }, "monsterIds": ["wolf", "boar", "bandit", "spider"], "questCount": 10, "nextZoneId": "zone_02", "theme": "starting" },
  { "id": "zone_02", "name": "Thornwick Hamlet", "description": "A farming community under threat from undead and giant spiders.", "levelRange": { "min": 5, "max": 10 }, "monsterIds": ["giant-spider", "undead-farmer", "scarecrow", "plague-rat", "cultist"], "questCount": 12, "nextZoneId": "zone_03", "theme": "starting" },
  { "id": "zone_03", "name": "Wildwood Thicket", "description": "A dense ancient forest teeming with corrupted wildlife.", "levelRange": { "min": 11, "max": 15 }, "monsterIds": ["treant", "wild-bear", "corrupted-druid", "forest-sprite", "thorn-elemental"], "questCount": 15, "nextZoneId": "zone_04", "theme": "wildwood" },
  { "id": "zone_04", "name": "Silvergrass Meadows", "description": "Rolling plains roamed by centaurs and harpies.", "levelRange": { "min": 15, "max": 20 }, "monsterIds": ["centaur-warrior", "harpy", "rogue-elemental", "plains-lion", "dust-devil"], "questCount": 15, "nextZoneId": "zone_05", "theme": "wildwood" },
  { "id": "zone_05", "name": "Mistmoor Bog", "description": "A treacherous swamp filled with poisonous creatures.", "levelRange": { "min": 21, "max": 25 }, "monsterIds": ["lizardfolk", "bog-wraith", "toxic-ooze", "swamp-horror", "marsh-crawler"], "questCount": 18, "nextZoneId": "zone_06", "theme": "mistmoors" },
  { "id": "zone_06", "name": "Embercrag Caverns", "description": "Deep underground caverns lit by rivers of molten rock.", "levelRange": { "min": 25, "max": 30 }, "monsterIds": ["fire-elemental", "dwarven-ghost", "cave-spider", "magma-wurm", "ember-golem"], "questCount": 18, "nextZoneId": "zone_07", "theme": "mistmoors" },
  { "id": "zone_07", "name": "Skyreach Summits", "description": "Snow-capped peaks with fierce mountain predators.", "levelRange": { "min": 31, "max": 35 }, "monsterIds": ["griffon", "wind-elemental", "yeti", "mountain-goat", "frost-wyrm", "avalanche-golem"], "questCount": 18, "nextZoneId": "zone_08", "theme": "skyreach" },
  { "id": "zone_08", "name": "Ironhold Fortress", "description": "A war-torn fortress under siege by orc raiders.", "levelRange": { "min": 35, "max": 40 }, "monsterIds": ["orc-raider", "siege-engine", "orc-warlord", "battle-troll", "war-shaman", "orc-berserker"], "questCount": 20, "nextZoneId": "zone_09", "theme": "skyreach" },
  { "id": "zone_09", "name": "Blighted Wastes", "description": "A cursed wasteland where the undead armies march endlessly.", "levelRange": { "min": 41, "max": 45 }, "monsterIds": ["skeleton-knight", "plague-beast", "death-knight", "bone-dragon", "ghoul-pack", "necromancer"], "questCount": 20, "nextZoneId": "zone_10", "theme": "blighted" },
  { "id": "zone_10", "name": "Ashfall Plateau", "description": "A volcanic plateau dominated by dragonkin and fire giants.", "levelRange": { "min": 45, "max": 50 }, "monsterIds": ["dragonkin", "fire-giant", "lava-lurker", "obsidian-golem", "phoenix-spawn", "magma-lord"], "questCount": 20, "nextZoneId": "zone_11", "theme": "blighted" },
  { "id": "zone_11", "name": "Twilight Reaches", "description": "An ethereal realm where reality frays at the edges.", "levelRange": { "min": 51, "max": 55 }, "monsterIds": ["shadow-stalker", "corrupted-angel", "void-tender", "twilight-sentinel", "phase-beast", "reality-shredder"], "questCount": 22, "nextZoneId": "zone_12", "theme": "ascendant" },
  { "id": "zone_12", "name": "Ascendant Spire", "description": "The final challenge: ancient constructs guard the path to power.", "levelRange": { "min": 55, "max": 60 }, "monsterIds": ["ancient-construct", "void-lord", "spire-guardian", "arcane-colossus", "ascendant-wraith", "entropy-weaver"], "questCount": 22, "nextZoneId": null, "theme": "ascendant" }
]
```

**Commit:** `feat(data): add zones.json with all 12 leveling zone definitions`

---

## Task 10 -- Gear System (Item Generation, Equip Logic, Inventory)

**Worktree:** `feat/gear-system`
**Branch:** `feat/gear-system`
**Depends on:** Tasks 3, 4, 6

### Step 10.1 -- Write item generator tests

**File: `tests/unit/engine/gear/item-generator.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { generateItem } from '@engine/gear/item-generator';
import { GearSlot, ItemQuality, PrimaryStat } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('generateItem', () => {
  it('should generate an item with correct iLevel and quality', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    expect(item.iLevel).toBe(30);
    expect(item.quality).toBe(ItemQuality.Rare);
    expect(item.slot).toBe(GearSlot.Chest);
  });

  it('should assign primary stats based on class affinity', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    const totalPrimary = Object.values(item.primaryStats).reduce((a, b) => a + (b ?? 0), 0);
    expect(totalPrimary).toBeGreaterThan(0);
  });

  it('should generate weapons with damage range', () => {
    const rng = new SeededRandom(42);
    const weapon = generateItem({
      iLevel: 30,
      quality: ItemQuality.Uncommon,
      slot: GearSlot.MainHand,
      classPrimaryStats: [PrimaryStat.Strength],
      weaponSpeed: 2.0,
      rng,
      config,
    });
    expect(weapon.weaponDamage).toBeDefined();
    expect(weapon.weaponDamage!.min).toBeGreaterThan(0);
    expect(weapon.weaponDamage!.max).toBeGreaterThan(weapon.weaponDamage!.min);
  });

  it('should calculate required level as max(1, iLevel - 3)', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 30,
      quality: ItemQuality.Common,
      slot: GearSlot.Head,
      classPrimaryStats: [PrimaryStat.Intellect],
      rng,
      config,
    });
    expect(item.requiredLevel).toBe(27);
  });

  it('should not drop below required level 1', () => {
    const rng = new SeededRandom(42);
    const item = generateItem({
      iLevel: 1,
      quality: ItemQuality.Common,
      slot: GearSlot.Head,
      classPrimaryStats: [PrimaryStat.Intellect],
      rng,
      config,
    });
    expect(item.requiredLevel).toBe(1);
  });

  it('should scale stat budget with quality multiplier', () => {
    const rng1 = new SeededRandom(42);
    const common = generateItem({
      iLevel: 30, quality: ItemQuality.Common, slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength], rng: rng1, config,
    });
    const rng2 = new SeededRandom(42);
    const epic = generateItem({
      iLevel: 30, quality: ItemQuality.Epic, slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength], rng: rng2, config,
    });
    const commonTotal = Object.values(common.primaryStats).reduce((a, b) => a + (b ?? 0), 0)
      + Object.values(common.secondaryStats).reduce((a, b) => a + b, 0);
    const epicTotal = Object.values(epic.primaryStats).reduce((a, b) => a + (b ?? 0), 0)
      + Object.values(epic.secondaryStats).reduce((a, b) => a + b, 0);
    expect(epicTotal).toBeGreaterThan(commonTotal);
  });
});
```

### Step 10.2 -- Implement item generator

**File: `src/engine/gear/item-generator.ts`**

```typescript
import { GearSlot, ItemQuality, PrimaryStat, SecondaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';
import { SLOT_BUDGET_WEIGHT, QUALITY_STAT_MULTIPLIER } from '@shared/types/item';
import type { IBalanceConfig } from '@shared/types/balance';
import { calculateStatBudget, calculateWeaponMinDamage, calculateWeaponMaxDamage } from '@engine/character/stat-calculator';
import type { SeededRandom } from '@shared/utils/rng';

const NAME_PREFIXES: Record<ItemQuality, string[]> = {
  [ItemQuality.Common]: ['Worn', 'Simple', 'Plain', 'Crude'],
  [ItemQuality.Uncommon]: ['Sturdy', 'Reinforced', 'Fine', 'Solid'],
  [ItemQuality.Rare]: ['Masterwork', 'Enchanted', 'Superior', 'Tempered'],
  [ItemQuality.Epic]: ['Ancient', 'Legendary', 'Mythic', 'Exalted'],
  [ItemQuality.Legendary]: ['Godforged', 'Eternal', 'Celestial', 'Divine'],
};

const SLOT_NAMES: Record<GearSlot, string> = {
  [GearSlot.Head]: 'Helm',
  [GearSlot.Shoulders]: 'Pauldrons',
  [GearSlot.Chest]: 'Chestpiece',
  [GearSlot.Wrists]: 'Bracers',
  [GearSlot.Hands]: 'Gauntlets',
  [GearSlot.Waist]: 'Belt',
  [GearSlot.Legs]: 'Leggings',
  [GearSlot.Feet]: 'Boots',
  [GearSlot.Neck]: 'Amulet',
  [GearSlot.Back]: 'Cloak',
  [GearSlot.Ring1]: 'Ring',
  [GearSlot.Ring2]: 'Ring',
  [GearSlot.Trinket1]: 'Trinket',
  [GearSlot.Trinket2]: 'Trinket',
  [GearSlot.MainHand]: 'Weapon',
  [GearSlot.OffHand]: 'Shield',
};

const SECONDARY_STAT_POOL = [
  SecondaryStat.CritChance,
  SecondaryStat.Haste,
  SecondaryStat.HitRating,
  SecondaryStat.Armor,
];

export interface IGenerateItemParams {
  iLevel: number;
  quality: ItemQuality;
  slot: GearSlot;
  classPrimaryStats: PrimaryStat[];
  weaponSpeed?: number;
  rng: SeededRandom;
  config: IBalanceConfig;
}

export function generateItem(params: IGenerateItemParams): IItem {
  const { iLevel, quality, slot, classPrimaryStats, rng, config } = params;

  // Calculate total stat budget
  const rawBudget = calculateStatBudget(iLevel, config);
  const qualityMult = QUALITY_STAT_MULTIPLIER[quality];
  const slotWeight = SLOT_BUDGET_WEIGHT[slot];
  const totalBudget = Math.floor(rawBudget * qualityMult * slotWeight);

  // Split budget: 70% primary, 30% secondary
  const primaryBudget = Math.floor(totalBudget * config.gear.primaryStatSplit);
  const secondaryBudget = totalBudget - primaryBudget;

  // Assign primary stats
  const primaryStats: Partial<Record<PrimaryStat, number>> = {};
  if (classPrimaryStats.length >= 2) {
    const mainStat = classPrimaryStats[0]!;
    const offStat = classPrimaryStats[1]!;
    primaryStats[mainStat] = Math.floor(primaryBudget * 0.6);
    primaryStats[offStat] = primaryBudget - Math.floor(primaryBudget * 0.6);
  } else if (classPrimaryStats.length === 1) {
    primaryStats[classPrimaryStats[0]!] = primaryBudget;
  }

  // Assign secondary stats (1-2 random from pool)
  const secondaryStats: Record<string, number> = {};
  const numSecondary = rng.nextInt(1, 2);
  const shuffled = [...SECONDARY_STAT_POOL].sort(() => rng.next() - 0.5);
  for (let i = 0; i < numSecondary && i < shuffled.length; i++) {
    const stat = shuffled[i]!;
    const share = i === 0 ? Math.ceil(secondaryBudget / numSecondary) : secondaryBudget - Math.ceil(secondaryBudget / numSecondary);
    if (share > 0) {
      secondaryStats[stat] = share;
    }
  }

  // Generate name
  const prefixes = NAME_PREFIXES[quality];
  const prefix = prefixes[rng.nextInt(0, prefixes.length - 1)]!;
  const slotName = SLOT_NAMES[slot];
  const name = `${prefix} ${slotName}`;

  // Weapon damage
  let weaponDamage: { min: number; max: number } | undefined;
  let weaponSpeed: number | undefined;
  if (slot === GearSlot.MainHand || slot === GearSlot.OffHand) {
    weaponSpeed = params.weaponSpeed ?? 2.0;
    const minDmg = calculateWeaponMinDamage(iLevel, qualityMult, weaponSpeed, config);
    const maxDmg = calculateWeaponMaxDamage(iLevel, qualityMult, weaponSpeed, config);
    weaponDamage = { min: Math.max(1, minDmg), max: Math.max(2, maxDmg) };
  }

  return {
    id: crypto.randomUUID(),
    templateId: `generated-${slot}-${iLevel}`,
    name,
    slot,
    quality,
    iLevel,
    requiredLevel: Math.max(1, iLevel - 3),
    primaryStats,
    secondaryStats,
    weaponDamage,
    weaponSpeed,
    durability: { current: 100, max: 100 },
    sellValue: Math.floor(iLevel * qualityMult * 2),
  };
}
```

**Run:** `pnpm test -- tests/unit/engine/gear/item-generator.test.ts` -- should PASS.

**Commit:** `feat(gear): add item generator with stat budgets, quality scaling, and weapon damage`

### Step 10.3 -- Write and implement inventory manager

**Test file: `tests/unit/engine/gear/inventory-manager.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { equipItem, unequipItem, isUpgrade, addToInventory } from '@engine/gear/inventory-manager';
import { GearSlot, ItemQuality, PrimaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';

function makeItem(overrides: Partial<IItem> = {}): IItem {
  return {
    id: crypto.randomUUID(),
    templateId: 'test',
    name: 'Test Item',
    slot: GearSlot.Chest,
    quality: ItemQuality.Common,
    iLevel: 10,
    requiredLevel: 7,
    primaryStats: { [PrimaryStat.Strength]: 10 },
    secondaryStats: {},
    durability: { current: 100, max: 100 },
    sellValue: 5,
    ...overrides,
  };
}

describe('isUpgrade', () => {
  it('should return true when slot is empty', () => {
    const newItem = makeItem();
    expect(isUpgrade(newItem, null, [PrimaryStat.Strength])).toBe(true);
  });

  it('should return true when new item has higher iLevel', () => {
    const equipped = makeItem({ iLevel: 10 });
    const newItem = makeItem({ iLevel: 20, primaryStats: { [PrimaryStat.Strength]: 20 } });
    expect(isUpgrade(newItem, equipped, [PrimaryStat.Strength])).toBe(true);
  });

  it('should return false when equipped item is better', () => {
    const equipped = makeItem({ iLevel: 30, primaryStats: { [PrimaryStat.Strength]: 30 } });
    const newItem = makeItem({ iLevel: 10 });
    expect(isUpgrade(newItem, equipped, [PrimaryStat.Strength])).toBe(false);
  });
});

describe('addToInventory', () => {
  it('should add item to first empty slot', () => {
    const inventory: (IItem | null)[] = new Array(28).fill(null);
    const item = makeItem();
    const result = addToInventory(inventory, item);
    expect(result.success).toBe(true);
    expect(result.inventory[0]).toBe(item);
  });

  it('should fail when inventory is full', () => {
    const inventory: (IItem | null)[] = new Array(28).fill(null).map(() => makeItem());
    const item = makeItem();
    const result = addToInventory(inventory, item);
    expect(result.success).toBe(false);
  });
});
```

**Implementation file: `src/engine/gear/inventory-manager.ts`**

```typescript
import { PrimaryStat, GearSlot } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';

const STAT_WEIGHTS: Record<PrimaryStat, Record<PrimaryStat, number>> = {
  [PrimaryStat.Strength]: { [PrimaryStat.Strength]: 1.0, [PrimaryStat.Agility]: 0.3, [PrimaryStat.Intellect]: 0.0, [PrimaryStat.Spirit]: 0.1, [PrimaryStat.Stamina]: 0.5 },
  [PrimaryStat.Agility]: { [PrimaryStat.Strength]: 0.3, [PrimaryStat.Agility]: 1.0, [PrimaryStat.Intellect]: 0.0, [PrimaryStat.Spirit]: 0.1, [PrimaryStat.Stamina]: 0.5 },
  [PrimaryStat.Intellect]: { [PrimaryStat.Strength]: 0.0, [PrimaryStat.Agility]: 0.1, [PrimaryStat.Intellect]: 1.0, [PrimaryStat.Spirit]: 0.6, [PrimaryStat.Stamina]: 0.4 },
  [PrimaryStat.Spirit]: { [PrimaryStat.Strength]: 0.0, [PrimaryStat.Agility]: 0.1, [PrimaryStat.Intellect]: 0.6, [PrimaryStat.Spirit]: 1.0, [PrimaryStat.Stamina]: 0.4 },
  [PrimaryStat.Stamina]: { [PrimaryStat.Strength]: 0.5, [PrimaryStat.Agility]: 0.3, [PrimaryStat.Intellect]: 0.3, [PrimaryStat.Spirit]: 0.3, [PrimaryStat.Stamina]: 1.0 },
};

export function getItemScore(item: IItem, classPrimaryStats: PrimaryStat[]): number {
  let score = 0;
  const mainStat = classPrimaryStats[0] ?? PrimaryStat.Strength;
  const weights = STAT_WEIGHTS[mainStat];

  for (const [stat, value] of Object.entries(item.primaryStats)) {
    const weight = weights[stat as PrimaryStat] ?? 0.1;
    score += (value ?? 0) * weight;
  }

  for (const [, value] of Object.entries(item.secondaryStats)) {
    score += value * 0.5;
  }

  return score;
}

export function isUpgrade(
  newItem: IItem,
  equippedItem: IItem | null,
  classPrimaryStats: PrimaryStat[],
): boolean {
  if (!equippedItem) return true;
  return getItemScore(newItem, classPrimaryStats) > getItemScore(equippedItem, classPrimaryStats);
}

export function equipItem(
  equipment: Partial<Record<GearSlot, IItem | null>>,
  inventory: (IItem | null)[],
  item: IItem,
): { equipment: Partial<Record<GearSlot, IItem | null>>; inventory: (IItem | null)[]; unequipped: IItem | null } {
  const slot = item.slot;
  const currentlyEquipped = equipment[slot] ?? null;

  const newEquipment = { ...equipment, [slot]: item };
  let newInventory = [...inventory];

  // Remove item from inventory
  const idx = newInventory.findIndex(i => i?.id === item.id);
  if (idx >= 0) {
    newInventory[idx] = null;
  }

  // Put old item in inventory if there was one
  if (currentlyEquipped) {
    const emptySlot = newInventory.findIndex(i => i === null);
    if (emptySlot >= 0) {
      newInventory[emptySlot] = currentlyEquipped;
    }
    // If no empty slot, old item is lost (edge case)
  }

  return { equipment: newEquipment, inventory: newInventory, unequipped: currentlyEquipped };
}

export function unequipItem(
  equipment: Partial<Record<GearSlot, IItem | null>>,
  inventory: (IItem | null)[],
  slot: GearSlot,
): { equipment: Partial<Record<GearSlot, IItem | null>>; inventory: (IItem | null)[]; success: boolean } {
  const item = equipment[slot];
  if (!item) return { equipment, inventory, success: false };

  const emptySlot = inventory.findIndex(i => i === null);
  if (emptySlot < 0) return { equipment, inventory, success: false };

  const newEquipment = { ...equipment, [slot]: null };
  const newInventory = [...inventory];
  newInventory[emptySlot] = item;

  return { equipment: newEquipment, inventory: newInventory, success: true };
}

export function addToInventory(
  inventory: (IItem | null)[],
  item: IItem,
): { success: boolean; inventory: (IItem | null)[] } {
  const emptySlot = inventory.findIndex(i => i === null);
  if (emptySlot < 0) return { success: false, inventory };

  const newInventory = [...inventory];
  newInventory[emptySlot] = item;
  return { success: true, inventory: newInventory };
}
```

**Run:** `pnpm test -- tests/unit/engine/gear/inventory-manager.test.ts` -- should PASS.

**Commit:** `feat(gear): add inventory manager with equip, unequip, and upgrade detection`

---

## Task 11 -- Loot System

**Worktree:** `feat/gear-system` (continues)
**Depends on:** Task 10

### Step 11.1 -- Write loot system tests

**File: `tests/unit/engine/gear/loot-system.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { rollLootDrop, rollItemQuality } from '@engine/gear/loot-system';
import { ItemQuality, PrimaryStat, GearSlot } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('rollItemQuality', () => {
  it('should return a valid quality tier', () => {
    const rng = new SeededRandom(42);
    const quality = rollItemQuality(rng, 50, config);
    expect(Object.values(ItemQuality)).toContain(quality);
  });

  it('should not drop Epic quality below level 40', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const quality = rollItemQuality(rng, 30, config);
      expect(quality).not.toBe(ItemQuality.Epic);
    }
  });

  it('should mostly drop Common and Uncommon', () => {
    const rng = new SeededRandom(42);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 5000; i++) {
      const q = rollItemQuality(rng, 50, config);
      counts[q] = (counts[q] ?? 0) + 1;
    }
    expect(counts[ItemQuality.Common]! + counts[ItemQuality.Uncommon]!).toBeGreaterThan(3000);
  });
});

describe('rollLootDrop', () => {
  it('should sometimes return an item', () => {
    const rng = new SeededRandom(42);
    let drops = 0;
    for (let i = 0; i < 100; i++) {
      const item = rollLootDrop({
        monsterLevel: 20,
        playerLevel: 20,
        classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
        rng,
        config,
      });
      if (item) drops++;
    }
    // With 20% drop chance, expect roughly 15-25 drops out of 100
    expect(drops).toBeGreaterThan(5);
    expect(drops).toBeLessThan(40);
  });

  it('should return null sometimes (no drop)', () => {
    const rng = new SeededRandom(1);
    let nulls = 0;
    for (let i = 0; i < 50; i++) {
      const item = rollLootDrop({
        monsterLevel: 10,
        playerLevel: 10,
        classPrimaryStats: [PrimaryStat.Agility],
        rng,
        config,
      });
      if (!item) nulls++;
    }
    expect(nulls).toBeGreaterThan(0);
  });
});
```

### Step 11.2 -- Implement loot system

**File: `src/engine/gear/loot-system.ts`**

```typescript
import { ItemQuality, GearSlot, PrimaryStat } from '@shared/types/enums';
import type { IItem } from '@shared/types/item';
import type { IBalanceConfig } from '@shared/types/balance';
import { generateItem } from './item-generator';
import type { SeededRandom } from '@shared/utils/rng';

const EQUIPPABLE_SLOTS: GearSlot[] = [
  GearSlot.Head, GearSlot.Shoulders, GearSlot.Chest, GearSlot.Wrists,
  GearSlot.Hands, GearSlot.Waist, GearSlot.Legs, GearSlot.Feet,
  GearSlot.Neck, GearSlot.Back, GearSlot.Ring1, GearSlot.Ring2,
  GearSlot.Trinket1, GearSlot.Trinket2, GearSlot.MainHand, GearSlot.OffHand,
];

export function rollItemQuality(
  rng: SeededRandom,
  playerLevel: number,
  config: IBalanceConfig,
): ItemQuality {
  const weights = { ...config.gear.qualityWeights };

  // No Epic below configured level, no Legendary in Phase 1
  if (playerLevel < config.gear.epicMinLevel) {
    weights[ItemQuality.Epic] = 0;
  }
  weights[ItemQuality.Legendary] = 0;

  const entries = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .map(([q, w]) => ({ item: q as ItemQuality, weight: w }));

  return rng.weightedChoice(entries);
}

export interface IRollLootDropParams {
  monsterLevel: number;
  playerLevel: number;
  classPrimaryStats: PrimaryStat[];
  rng: SeededRandom;
  config: IBalanceConfig;
}

export function rollLootDrop(params: IRollLootDropParams): IItem | null {
  const { monsterLevel, playerLevel, classPrimaryStats, rng, config } = params;

  // Check if item drops at all
  if (!rng.chance(config.gear.dropChanceBase)) {
    return null;
  }

  const quality = rollItemQuality(rng, playerLevel, config);
  const slot = EQUIPPABLE_SLOTS[rng.nextInt(0, EQUIPPABLE_SLOTS.length - 1)]!;

  const qualityBonus: Record<ItemQuality, number> = {
    [ItemQuality.Common]: 0,
    [ItemQuality.Uncommon]: 1,
    [ItemQuality.Rare]: 2,
    [ItemQuality.Epic]: 4,
    [ItemQuality.Legendary]: 6,
  };

  const iLevel = monsterLevel + qualityBonus[quality];

  return generateItem({
    iLevel,
    quality,
    slot,
    classPrimaryStats,
    rng,
    config,
  });
}
```

**Run:** `pnpm test -- tests/unit/engine/gear/loot-system.test.ts` -- should PASS.

**Commit:** `feat(gear): add loot system with quality rolling and drop chance`

---

## Task 12 -- Talent System

**Worktree:** `feat/talent-system`
**Branch:** `feat/talent-system`
**Depends on:** Tasks 3, 4

### Step 12.1 -- Write talent manager tests

**File: `tests/unit/engine/talents/talent-manager.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  canAllocatePoint,
  allocateTalentPoint,
  resetTalents,
  getRespecCost,
  getTalentEffects,
} from '@engine/talents/talent-manager';
import { loadBalanceConfig } from '@shared/utils/balance-loader';
import type { ITalentTree, ITalentNode, ITalentAllocation } from '@shared/types/talent';

const config = loadBalanceConfig();

function makeTier1Node(id: string, maxRank: number = 5): ITalentNode {
  return {
    id,
    name: `Test Node ${id}`,
    description: 'Test',
    icon: 'test',
    tier: 1,
    position: { row: 0, col: 0 },
    maxRank,
    pointsRequired: 0,
    effects: Array.from({ length: maxRank }, (_, i) => ({
      rank: i + 1,
      type: 'stat_bonus' as const,
      stat: 'str',
      value: 2 * (i + 1),
      description: `+${2 * (i + 1)}% Strength`,
    })),
  };
}

function makeTier2Node(id: string, maxRank: number = 3): ITalentNode {
  return {
    ...makeTier1Node(id, maxRank),
    tier: 2,
    pointsRequired: 5,
  };
}

function makeTree(): ITalentTree {
  return {
    id: 'test-tree',
    specId: 'weapon-arts' as any,
    name: 'Test Tree',
    classId: 'blademaster' as any,
    description: 'Test tree',
    icon: 'test',
    nodes: [
      makeTier1Node('node-t1-a', 5),
      makeTier1Node('node-t1-b', 5),
      makeTier2Node('node-t2-a', 3),
    ],
  };
}

describe('canAllocatePoint', () => {
  const tree = makeTree();
  const emptyAllocation: ITalentAllocation = {
    allocatedPoints: {},
    totalPointsSpent: 0,
    pointsAvailable: 10,
  };

  it('should allow allocating to a tier 1 node with available points', () => {
    expect(canAllocatePoint(tree, 'node-t1-a', emptyAllocation, config)).toBe(true);
  });

  it('should not allow allocating if no points available', () => {
    const noPoints: ITalentAllocation = { ...emptyAllocation, pointsAvailable: 0 };
    expect(canAllocatePoint(tree, 'node-t1-a', noPoints, config)).toBe(false);
  });

  it('should not allow exceeding max rank', () => {
    const maxed: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 5 },
      totalPointsSpent: 5,
      pointsAvailable: 5,
    };
    expect(canAllocatePoint(tree, 'node-t1-a', maxed, config)).toBe(false);
  });

  it('should not allow tier 2 without 5 points in tree', () => {
    const fewPoints: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 3 },
      totalPointsSpent: 3,
      pointsAvailable: 7,
    };
    expect(canAllocatePoint(tree, 'node-t2-a', fewPoints, config)).toBe(false);
  });

  it('should allow tier 2 with 5+ points in tree', () => {
    const enoughPoints: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 5 },
      totalPointsSpent: 5,
      pointsAvailable: 5,
    };
    expect(canAllocatePoint(tree, 'node-t2-a', enoughPoints, config)).toBe(true);
  });
});

describe('allocateTalentPoint', () => {
  const tree = makeTree();

  it('should increment the node rank and decrement available points', () => {
    const allocation: ITalentAllocation = {
      allocatedPoints: {},
      totalPointsSpent: 0,
      pointsAvailable: 10,
    };
    const result = allocateTalentPoint(tree, 'node-t1-a', allocation, config);
    expect(result.allocatedPoints['node-t1-a']).toBe(1);
    expect(result.pointsAvailable).toBe(9);
    expect(result.totalPointsSpent).toBe(1);
  });
});

describe('resetTalents', () => {
  it('should clear all allocations and restore points', () => {
    const allocation: ITalentAllocation = {
      allocatedPoints: { 'node-t1-a': 5, 'node-t2-a': 3 },
      totalPointsSpent: 8,
      pointsAvailable: 2,
    };
    const result = resetTalents(allocation);
    expect(result.allocatedPoints).toEqual({});
    expect(result.totalPointsSpent).toBe(0);
    expect(result.pointsAvailable).toBe(10);
  });
});

describe('getRespecCost', () => {
  it('should calculate first respec at level 60 as 600 gold', () => {
    const cost = getRespecCost(60, 0, config);
    expect(cost).toBe(600);
  });

  it('should increase cost with respec count', () => {
    const cost0 = getRespecCost(60, 0, config);
    const cost1 = getRespecCost(60, 1, config);
    expect(cost1).toBeGreaterThan(cost0);
  });
});
```

### Step 12.2 -- Implement talent manager

**File: `src/engine/talents/talent-manager.ts`**

```typescript
import type { ITalentTree, ITalentAllocation, ITalentEffect } from '@shared/types/talent';
import type { IBalanceConfig } from '@shared/types/balance';

/**
 * Check if a talent point can be allocated to the given node.
 */
export function canAllocatePoint(
  tree: ITalentTree,
  nodeId: string,
  allocation: ITalentAllocation,
  _config: IBalanceConfig,
): boolean {
  if (allocation.pointsAvailable <= 0) return false;

  const node = tree.nodes.find(n => n.id === nodeId);
  if (!node) return false;

  // Check max rank
  const currentRank = allocation.allocatedPoints[nodeId] ?? 0;
  if (currentRank >= node.maxRank) return false;

  // Check tier requirement (points spent in THIS tree)
  const pointsInTree = getPointsInTree(tree, allocation);
  if (pointsInTree < node.pointsRequired) return false;

  // Check prerequisite
  if (node.prerequisiteNodeId) {
    const prereqNode = tree.nodes.find(n => n.id === node.prerequisiteNodeId);
    if (!prereqNode) return false;
    const prereqRank = allocation.allocatedPoints[node.prerequisiteNodeId] ?? 0;
    if (prereqRank < prereqNode.maxRank) return false;
  }

  return true;
}

/**
 * Count total points spent in a specific tree.
 */
function getPointsInTree(tree: ITalentTree, allocation: ITalentAllocation): number {
  let total = 0;
  for (const node of tree.nodes) {
    total += allocation.allocatedPoints[node.id] ?? 0;
  }
  return total;
}

/**
 * Allocate one talent point to the given node.
 * Caller should check canAllocatePoint first.
 */
export function allocateTalentPoint(
  tree: ITalentTree,
  nodeId: string,
  allocation: ITalentAllocation,
  config: IBalanceConfig,
): ITalentAllocation {
  if (!canAllocatePoint(tree, nodeId, allocation, config)) {
    return allocation;
  }

  const currentRank = allocation.allocatedPoints[nodeId] ?? 0;
  return {
    allocatedPoints: {
      ...allocation.allocatedPoints,
      [nodeId]: currentRank + 1,
    },
    totalPointsSpent: allocation.totalPointsSpent + 1,
    pointsAvailable: allocation.pointsAvailable - 1,
  };
}

/**
 * Reset all talent points.
 */
export function resetTalents(allocation: ITalentAllocation): ITalentAllocation {
  const totalPoints = allocation.totalPointsSpent + allocation.pointsAvailable;
  return {
    allocatedPoints: {},
    totalPointsSpent: 0,
    pointsAvailable: totalPoints,
  };
}

/**
 * Calculate gold cost for a talent respec.
 * cost = floor(baseCost * level * (1 + respecCount * multiplier))
 */
export function getRespecCost(
  level: number,
  respecCount: number,
  config: IBalanceConfig,
): number {
  const { respecBaseCost, respecCostPerLevel, respecCountMultiplier } = config.talents;
  return Math.floor(respecBaseCost * level * respecCostPerLevel * (1 + respecCount * respecCountMultiplier));
}

/**
 * Collect all active talent effects for a given allocation across all trees.
 */
export function getTalentEffects(
  trees: ITalentTree[],
  allocation: ITalentAllocation,
): ITalentEffect[] {
  const effects: ITalentEffect[] = [];
  for (const tree of trees) {
    for (const node of tree.nodes) {
      const rank = allocation.allocatedPoints[node.id] ?? 0;
      if (rank > 0) {
        const effect = node.effects.find(e => e.rank === rank);
        if (effect) {
          effects.push(effect);
        }
      }
    }
  }
  return effects;
}
```

**Run:** `pnpm test -- tests/unit/engine/talents/talent-manager.test.ts` -- should PASS.

**Commit:** `feat(talents): add talent manager with allocation, validation, respec, and effects`

---

## Task 13 -- Save/Load System

**Worktree:** `feat/save-system`
**Branch:** `feat/save-system`
**Depends on:** Tasks 3, 7

### Step 13.1 -- Write save serialization tests

**File: `tests/unit/main/save-io.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { serializeSave, deserializeSave, computeChecksum } from '@main/save/save-io';
import type { ISaveData, ISaveMeta } from '@shared/types/save';
import { Race, CharacterClass, GearSlot } from '@shared/types/enums';

function makeMinimalSave(): ISaveData {
  return {
    meta: {
      version: '1.0.0',
      gameVersion: '0.1.0',
      saveSlot: 1,
      createdAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      playTimeSeconds: 3600,
      checksum: '',
    },
    character: {
      id: 'test-uuid',
      name: 'TestChar',
      race: Race.Valeborn,
      classId: CharacterClass.Blademaster,
      level: 10,
      currentXP: 500,
      gold: 100,
      currentHP: 200,
      currentResource: 50,
      deathCount: 0,
      totalKills: 100,
      totalQuestsCompleted: 5,
      respecCount: 0,
    },
    progression: {
      currentZoneId: 'zone_02',
      currentQuestIndex: 3,
      currentQuestKills: 5,
      zonesCompleted: ['zone_01'],
      unlockedAbilities: ['auto-attack', 'mortal-strike'],
      activeAbilityPriority: ['mortal-strike', 'auto-attack'],
    },
    inventory: {
      equipped: {},
      bags: new Array(28).fill(null),
    },
    talents: {
      allocatedPoints: {},
      totalPointsSpent: 0,
    },
    combatState: {
      currentMonster: null,
      activeBuffs: [],
      activeDoTs: [],
      cooldowns: {},
    },
    settings: {
      autoEquip: true,
      autoSellCommon: false,
      combatLogVisible: true,
      uiScale: 1.0,
    },
  };
}

describe('serializeSave / deserializeSave', () => {
  it('should serialize to a Buffer and deserialize back to the same data', () => {
    const save = makeMinimalSave();
    const buffer = serializeSave(save);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const restored = deserializeSave(buffer);
    expect(restored.character.name).toBe('TestChar');
    expect(restored.character.level).toBe(10);
    expect(restored.meta.version).toBe('1.0.0');
  });
});

describe('computeChecksum', () => {
  it('should produce a consistent hash for the same data', () => {
    const save = makeMinimalSave();
    const hash1 = computeChecksum(save);
    const hash2 = computeChecksum(save);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different data', () => {
    const save1 = makeMinimalSave();
    const save2 = makeMinimalSave();
    save2.character.level = 20;
    expect(computeChecksum(save1)).not.toBe(computeChecksum(save2));
  });
});
```

### Step 13.2 -- Implement save-io (serialize, compress, checksum)

**File: `src/main/save/save-io.ts`**

```typescript
import { gzipSync, gunzipSync } from 'zlib';
import { createHash } from 'crypto';
import type { ISaveData } from '@shared/types/save';

const MAGIC_BYTES = Buffer.from('IDLE');
const SAVE_VERSION = 1;

/**
 * Compute a SHA-256 checksum of the save data (excluding the checksum field itself).
 */
export function computeChecksum(save: ISaveData): string {
  const copy = { ...save, meta: { ...save.meta, checksum: '' } };
  const json = JSON.stringify(copy);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Serialize save data to a gzipped Buffer with magic bytes header.
 * Format: [4 bytes IDLE magic] [1 byte version] [gzipped JSON]
 */
export function serializeSave(save: ISaveData): Buffer {
  const checksum = computeChecksum(save);
  const saveWithChecksum: ISaveData = {
    ...save,
    meta: { ...save.meta, checksum, lastSavedAt: new Date().toISOString() },
  };

  const json = JSON.stringify(saveWithChecksum);
  const compressed = gzipSync(Buffer.from(json, 'utf-8'));

  const header = Buffer.alloc(5);
  MAGIC_BYTES.copy(header, 0);
  header.writeUInt8(SAVE_VERSION, 4);

  return Buffer.concat([header, compressed]);
}

/**
 * Deserialize a save buffer back to ISaveData.
 * Validates magic bytes and decompresses.
 */
export function deserializeSave(buffer: Buffer): ISaveData {
  // Validate magic bytes
  const magic = buffer.subarray(0, 4);
  if (!magic.equals(MAGIC_BYTES)) {
    throw new Error('Invalid save file: magic bytes mismatch');
  }

  const version = buffer.readUInt8(4);
  if (version > SAVE_VERSION) {
    throw new Error(`Save version ${version} is newer than supported version ${SAVE_VERSION}`);
  }

  const compressed = buffer.subarray(5);
  const json = gunzipSync(compressed).toString('utf-8');
  const save = JSON.parse(json) as ISaveData;

  // Validate checksum
  const expectedChecksum = computeChecksum(save);
  if (save.meta.checksum && save.meta.checksum !== expectedChecksum) {
    throw new Error('Save file checksum mismatch -- data may be corrupted');
  }

  return save;
}

/**
 * Validate save schema version and run migrations if needed.
 */
export function validateSaveVersion(save: ISaveData): ISaveData {
  // Future: apply migrations here
  return save;
}
```

**Run:** `pnpm test -- tests/unit/main/save-io.test.ts` -- should PASS.

**Commit:** `feat(save): add save serialization with gzip compression and SHA-256 checksum`

### Step 13.3 -- Write and implement backup rotation

**File: `src/main/save/backup-rotation.ts`**

```typescript
import fs from 'fs';
import path from 'path';

/**
 * Rotate save backups. Keeps up to maxBackups copies.
 * Before writing a new save, the current .sav becomes .bak1, .bak1 becomes .bak2, etc.
 */
export function rotateSaveBackups(savePath: string, maxBackups: number = 3): void {
  // Delete oldest backup
  const oldest = `${savePath}.bak${maxBackups}`;
  if (fs.existsSync(oldest)) {
    fs.unlinkSync(oldest);
  }

  // Shift backups down: .bak2 -> .bak3, .bak1 -> .bak2, etc.
  for (let i = maxBackups - 1; i >= 1; i--) {
    const from = `${savePath}.bak${i}`;
    const to = `${savePath}.bak${i + 1}`;
    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    }
  }

  // Move current save to .bak1
  if (fs.existsSync(savePath)) {
    fs.renameSync(savePath, `${savePath}.bak1`);
  }
}

/**
 * Write save atomically: write to .tmp, then rename.
 */
export function atomicWriteSave(savePath: string, data: Buffer): void {
  const tmpPath = `${savePath}.tmp`;
  fs.writeFileSync(tmpPath, data);
  // If a previous save exists, rotate it
  rotateSaveBackups(savePath);
  fs.renameSync(tmpPath, savePath);
}

/**
 * Get the save file path for a given slot.
 */
export function getSavePath(userDataPath: string, slot: 1 | 2 | 3): string {
  const dir = path.join(userDataPath, 'saves');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, `slot_${slot}_save.sav`);
}
```

**Commit:** `feat(save): add backup rotation and atomic write for save files`

---

## Task 14 -- Offline Progression

**Worktree:** `feat/save-system` (continues)
**Depends on:** Tasks 6, 9

### Step 14.1 -- Write diminishing returns tests

**File: `tests/unit/engine/offline/diminishing-returns.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { applyDiminishingReturns } from '@engine/offline/diminishing-returns';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('applyDiminishingReturns', () => {
  it('should return 0 for 0 offline seconds', () => {
    const result = applyDiminishingReturns(0, config);
    expect(result.simulatedSeconds).toBe(0);
  });

  it('should return full time for first 12 hours', () => {
    const twelveHours = 12 * 3600;
    const result = applyDiminishingReturns(twelveHours, config);
    expect(result.simulatedSeconds).toBe(twelveHours);
    expect(result.multiplier).toBeCloseTo(1.0, 2);
  });

  it('should apply 75% efficiency for hours 12-18', () => {
    const fifteenHours = 15 * 3600;
    const result = applyDiminishingReturns(fifteenHours, config);
    // 12h * 1.0 + 3h * 0.75 = 43200 + 8100 = 51300
    expect(result.simulatedSeconds).toBe(51300);
  });

  it('should apply 50% efficiency for hours 18-24', () => {
    const twentyFourHours = 24 * 3600;
    const result = applyDiminishingReturns(twentyFourHours, config);
    // 12*3600*1.0 + 6*3600*0.75 + 6*3600*0.50
    // = 43200 + 16200 + 10800 = 70200
    expect(result.simulatedSeconds).toBe(70200);
  });

  it('should cap at 24 hours even if more time passed', () => {
    const fortyEightHours = 48 * 3600;
    const result = applyDiminishingReturns(fortyEightHours, config);
    // Same as 24 hours
    expect(result.simulatedSeconds).toBe(70200);
  });

  it('should report correct efficiency multiplier', () => {
    const twentyFourHours = 24 * 3600;
    const result = applyDiminishingReturns(twentyFourHours, config);
    // 70200 / 86400 = 0.8125
    expect(result.multiplier).toBeCloseTo(0.8125, 3);
  });
});
```

### Step 14.2 -- Implement diminishing returns

**File: `src/engine/offline/diminishing-returns.ts`**

```typescript
import type { IBalanceConfig } from '@shared/types/balance';

export interface IDiminishingResult {
  simulatedSeconds: number;
  multiplier: number;
}

/**
 * Apply diminishing returns to offline time.
 * 0-12h: 100%, 12-18h: 75%, 18-24h: 50%, 24h+ capped.
 */
export function applyDiminishingReturns(
  rawSeconds: number,
  config: IBalanceConfig,
): IDiminishingResult {
  if (rawSeconds <= 0) {
    return { simulatedSeconds: 0, multiplier: 1 };
  }

  const HOUR = 3600;
  const capped = Math.min(rawSeconds, config.offline.maxOfflineSeconds);

  let simulated = 0;
  let remaining = capped;

  // Tier 1: 0-12h at 100%
  const tier1Max = config.offline.tier1Hours * HOUR;
  const tier1 = Math.min(remaining, tier1Max);
  simulated += tier1 * config.offline.tier1Efficiency;
  remaining -= tier1;

  // Tier 2: 12-18h at 75%
  const tier2Max = (config.offline.tier2Hours - config.offline.tier1Hours) * HOUR;
  const tier2 = Math.min(remaining, tier2Max);
  simulated += tier2 * config.offline.tier2Efficiency;
  remaining -= tier2;

  // Tier 3: 18-24h at 50%
  const tier3 = remaining;
  simulated += tier3 * config.offline.tier3Efficiency;

  const multiplier = capped > 0 ? simulated / capped : 1;

  return { simulatedSeconds: Math.floor(simulated), multiplier };
}
```

**Run:** `pnpm test -- tests/unit/engine/offline/diminishing-returns.test.ts` -- should PASS.

**Commit:** `feat(offline): add diminishing returns calculator with tiered efficiency`

### Step 14.3 -- Write and implement offline progress calculator

**File: `tests/unit/engine/offline/offline-calculator.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateOfflineProgress } from '@engine/offline/offline-calculator';
import { loadBalanceConfig } from '@shared/utils/balance-loader';
import { SeededRandom } from '@shared/utils/rng';

const config = loadBalanceConfig();

describe('calculateOfflineProgress', () => {
  it('should return zero gains for 0 seconds offline', () => {
    const result = calculateOfflineProgress({
      characterLevel: 10,
      currentXP: 0,
      currentZoneLevel: 10,
      offlineSeconds: 0,
      rng: new SeededRandom(42),
      config,
    });
    expect(result.xpGained).toBe(0);
    expect(result.goldGained).toBe(0);
    expect(result.levelsGained).toBe(0);
  });

  it('should gain XP and gold for 1 hour offline', () => {
    const result = calculateOfflineProgress({
      characterLevel: 10,
      currentXP: 0,
      currentZoneLevel: 10,
      offlineSeconds: 3600,
      rng: new SeededRandom(42),
      config,
    });
    expect(result.xpGained).toBeGreaterThan(0);
    expect(result.goldGained).toBeGreaterThan(0);
    expect(result.monstersKilled).toBeGreaterThan(0);
  });

  it('should be deterministic with same seed', () => {
    const params = {
      characterLevel: 20,
      currentXP: 5000,
      currentZoneLevel: 20,
      offlineSeconds: 7200,
      config,
    };
    const r1 = calculateOfflineProgress({ ...params, rng: new SeededRandom(42) });
    const r2 = calculateOfflineProgress({ ...params, rng: new SeededRandom(42) });
    expect(r1.xpGained).toBe(r2.xpGained);
    expect(r1.goldGained).toBe(r2.goldGained);
  });

  it('should not exceed level 60', () => {
    const result = calculateOfflineProgress({
      characterLevel: 59,
      currentXP: 60000,
      currentZoneLevel: 59,
      offlineSeconds: 86400,
      rng: new SeededRandom(42),
      config,
    });
    expect(result.newLevel).toBeLessThanOrEqual(60);
  });
});
```

**Implementation file: `src/engine/offline/offline-calculator.ts`**

```typescript
import type { IBalanceConfig } from '@shared/types/balance';
import type { SeededRandom } from '@shared/utils/rng';
import { applyDiminishingReturns } from './diminishing-returns';
import {
  calculateMonsterHP, calculateMonsterDamage, calculateMonsterXP,
  xpToNextLevel,
} from '@engine/character/stat-calculator';
import { awardXP } from '@engine/progression/xp-system';

export interface IOfflineCalcParams {
  characterLevel: number;
  currentXP: number;
  currentZoneLevel: number;
  offlineSeconds: number;
  rng: SeededRandom;
  config: IBalanceConfig;
}

export interface IOfflineResult {
  xpGained: number;
  goldGained: number;
  levelsGained: number;
  monstersKilled: number;
  questsCompleted: number;
  newLevel: number;
  newXP: number;
  simulatedSeconds: number;
  rawOfflineSeconds: number;
  catchUpMultiplier: number;
}

/**
 * Calculate offline progress using statistical estimation.
 * Does NOT simulate every tick -- estimates kills/hour based on character level vs zone.
 */
export function calculateOfflineProgress(params: IOfflineCalcParams): IOfflineResult {
  const { characterLevel, currentXP, currentZoneLevel, offlineSeconds, rng, config } = params;

  if (offlineSeconds <= 0) {
    return {
      xpGained: 0, goldGained: 0, levelsGained: 0,
      monstersKilled: 0, questsCompleted: 0,
      newLevel: characterLevel, newXP: currentXP,
      simulatedSeconds: 0, rawOfflineSeconds: 0,
      catchUpMultiplier: 1,
    };
  }

  // Step 1: Diminishing returns
  const dr = applyDiminishingReturns(offlineSeconds, config);
  const effectiveSeconds = dr.simulatedSeconds;

  // Step 2: Estimate kills
  // Assume ~4 ticks/sec, 3-5 ticks per kill -> ~1 kill per 1-1.25 seconds of game time
  // But combat tick = 250ms, monster dies in 3-5 ticks = 750ms-1250ms
  const avgTicksPerKill = 4;
  const tickIntervalSec = config.combat.baseTickIntervalMs / 1000;
  const killsPerSecond = 1 / (avgTicksPerKill * tickIntervalSec);
  const totalKills = Math.floor(effectiveSeconds * killsPerSecond);

  // Step 3: Calculate XP
  const monsterXP = calculateMonsterXP(currentZoneLevel, config);
  const questMultiplier = config.offline.questBonusMultiplier;
  const totalXP = Math.floor(totalKills * monsterXP * questMultiplier);

  // Step 4: Calculate gold
  const goldMin = Math.floor(config.monsters.goldMinBase + currentZoneLevel * config.monsters.goldMinLinear);
  const goldMax = Math.floor(config.monsters.goldMaxBase + currentZoneLevel * config.monsters.goldMaxLinear);
  const avgGold = (goldMin + goldMax) / 2;
  const totalGold = Math.floor(totalKills * avgGold * 1.3); // 1.3 for quest gold bonus

  // Step 5: Calculate quest completions
  const avgKillsPerQuest = (config.quests.killsPerQuestMin + config.quests.killsPerQuestMax) / 2;
  const questsCompleted = Math.floor(totalKills / avgKillsPerQuest);

  // Step 6: Leveling
  const xpResult = awardXP({
    currentLevel: characterLevel,
    currentXP,
    xpGained: totalXP,
    config,
  });

  // Step 7: Catch-up multiplier
  const offlineHours = offlineSeconds / 3600;
  const catchUpMultiplier = Math.min(
    config.offline.catchUpMaxMultiplier,
    config.offline.catchUpMinMultiplier + (offlineHours / config.offline.catchUpScaleHours) *
      (config.offline.catchUpMaxMultiplier - config.offline.catchUpMinMultiplier),
  );

  return {
    xpGained: totalXP,
    goldGained: totalGold,
    levelsGained: xpResult.levelsGained,
    monstersKilled: totalKills,
    questsCompleted,
    newLevel: xpResult.newLevel,
    newXP: xpResult.remainingXP,
    simulatedSeconds: effectiveSeconds,
    rawOfflineSeconds: offlineSeconds,
    catchUpMultiplier: Math.round(catchUpMultiplier * 10) / 10,
  };
}
```

**Run:** `pnpm test -- tests/unit/engine/offline/offline-calculator.test.ts` -- should PASS.

**Commit:** `feat(offline): add offline progress calculator with kill estimation and leveling`

---

## Task 15 -- Game Loop and Engine Worker Entry

**Worktree:** `feat/save-system` (continues or new branch)
**Depends on:** Tasks 8, 9, 10, 11, 12

### Step 15.1 -- Implement GameLoop class

**File: `src/engine/game-loop.ts`**

```typescript
import type { IGameSystem } from './systems/game-system';
import { EventBus } from './events/event-bus';
import { EngineEventType } from '@shared/types/ipc';
import type { EngineEvent } from '@shared/types/ipc';

export interface IGameLoopConfig {
  tickIntervalMs: number;
  maxBatchTicks: number;
}

export const DEFAULT_LOOP_CONFIG: IGameLoopConfig = {
  tickIntervalMs: 250,
  maxBatchTicks: 100,
};

export class GameLoop {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private tickNumber: number = 0;
  private paused: boolean = true;
  private config: IGameLoopConfig;
  private systems: IGameSystem[];
  private eventBus: EventBus;
  private onSnapshot: ((tickNumber: number) => void) | null = null;

  constructor(config: IGameLoopConfig = DEFAULT_LOOP_CONFIG) {
    this.config = config;
    this.eventBus = new EventBus();
    this.systems = [];
  }

  registerSystem(system: IGameSystem): void {
    this.systems.push(system);
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  setSnapshotCallback(cb: (tickNumber: number) => void): void {
    this.onSnapshot = cb;
  }

  start(): void {
    if (this.intervalHandle) return;
    this.paused = false;
    this.intervalHandle = setInterval(() => {
      this.tick();
    }, this.config.tickIntervalMs);
  }

  pause(): void {
    this.paused = true;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  isRunning(): boolean {
    return !this.paused;
  }

  getTickNumber(): number {
    return this.tickNumber;
  }

  private tick(): void {
    if (this.paused) return;
    this.tickNumber++;

    // Each system updates in sequence
    for (const system of this.systems) {
      system.update({}, this.config.tickIntervalMs);
    }

    // Drain events (for port sending)
    const events = this.eventBus.drain();

    // State snapshot every 4th tick (1/sec at 4 ticks/sec)
    if (this.tickNumber % 4 === 0 && this.onSnapshot) {
      this.onSnapshot(this.tickNumber);
    }
  }

  destroy(): void {
    this.pause();
    this.systems = [];
  }
}
```

**Commit:** `feat(engine): add GameLoop class with tick-based system processing`

### Step 15.2 -- Create engine worker entry point

**File: `src/engine/worker-entry.ts`**

```typescript
import { parentPort } from 'worker_threads';
import { GameLoop, DEFAULT_LOOP_CONFIG } from './game-loop';
import { EngineCommandType, EngineEventType } from '@shared/types/ipc';
import type { EngineCommand, EngineEvent } from '@shared/types/ipc';

let gameLoop: GameLoop | null = null;
let enginePort: MessagePort | null = null;

// Listen for the MessagePort from the main process
parentPort?.on('message', (msg: { type: string; port?: MessagePort }) => {
  if (msg.type === 'port' && msg.port) {
    enginePort = msg.port;
    setupEnginePort(enginePort);
  }
});

function setupEnginePort(port: MessagePort): void {
  gameLoop = new GameLoop(DEFAULT_LOOP_CONFIG);

  port.on('message', (command: EngineCommand) => {
    handleCommand(command, port);
  });

  // Notify renderer that engine is ready
  port.postMessage({
    id: crypto.randomUUID(),
    type: EngineEventType.ENGINE_READY,
    payload: {},
    timestamp: Date.now(),
    tickNumber: 0,
  } satisfies EngineEvent);
}

function handleCommand(command: EngineCommand, port: MessagePort): void {
  switch (command.type) {
    case EngineCommandType.INIT:
      gameLoop?.start();
      break;
    case EngineCommandType.PAUSE:
      gameLoop?.pause();
      break;
    case EngineCommandType.RESUME:
      gameLoop?.start();
      break;
    case EngineCommandType.SHUTDOWN:
      gameLoop?.destroy();
      process.exit(0);
      break;
    default:
      // Additional commands handled as features are added
      break;
  }
}
```

**Commit:** `feat(engine): add worker entry point with MessagePort communication`

---

## Task 16 -- Electron Shell Integration (IPC Wiring, Auto-Save, Window Lifecycle)

**Worktree:** main (merge all prior branches first)
**Depends on:** Tasks 1, 13, 15

### Step 16.1 -- Implement preload script with contextBridge

**File: `src/main/preload.ts`** (replace existing)

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { MainInvokeChannel, MainSendChannel } from '@shared/types/ipc';

export interface IGameAPI {
  invoke: (channel: MainInvokeChannel, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
  getVersion: () => Promise<string>;
  setEnginePort: (callback: (port: MessagePort) => void) => void;
}

contextBridge.exposeInMainWorld('gameAPI', {
  invoke: (channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  once: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => callback(...args));
  },

  getVersion: () => ipcRenderer.invoke('app:get-version'),

  setEnginePort: (callback: (port: MessagePort) => void) => {
    ipcRenderer.on('engine:port', (event) => {
      const [port] = event.ports;
      if (port) {
        callback(port);
      }
    });
  },
} satisfies IGameAPI);
```

**Commit:** `feat(main): implement preload script with contextBridge API`

### Step 16.2 -- Implement IPC handlers

**File: `src/main/ipc/ipc-handlers.ts`**

```typescript
import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import { MainInvokeChannel } from '@shared/types/ipc';
import { serializeSave, deserializeSave } from '../save/save-io';
import { atomicWriteSave, getSavePath } from '../save/backup-rotation';
import fs from 'fs';

export function registerIpcHandlers(): void {
  ipcMain.handle(MainInvokeChannel.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(MainInvokeChannel.APP_GET_PLATFORM, () => {
    return process.platform;
  });

  ipcMain.handle(MainInvokeChannel.APP_GET_USER_DATA_PATH, () => {
    return app.getPath('userData');
  });

  ipcMain.handle(MainInvokeChannel.SAVE_GAME, (_event, { slot, saveData }: { slot: 1 | 2 | 3; saveData: unknown }) => {
    try {
      const buffer = serializeSave(saveData as any);
      const savePath = getSavePath(app.getPath('userData'), slot);
      atomicWriteSave(savePath, buffer);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(MainInvokeChannel.LOAD_GAME, (_event, { slot }: { slot: 1 | 2 | 3 }) => {
    try {
      const savePath = getSavePath(app.getPath('userData'), slot);
      if (!fs.existsSync(savePath)) {
        return { success: false, error: 'No save file found' };
      }
      const buffer = fs.readFileSync(savePath);
      const saveData = deserializeSave(buffer);
      return { success: true, data: saveData };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(MainInvokeChannel.LIST_SAVES, () => {
    const userData = app.getPath('userData');
    const saves: Array<{ slot: number; exists: boolean; lastSaved?: string }> = [];
    for (const slot of [1, 2, 3] as const) {
      const savePath = getSavePath(userData, slot);
      if (fs.existsSync(savePath)) {
        try {
          const buffer = fs.readFileSync(savePath);
          const save = deserializeSave(buffer);
          saves.push({ slot, exists: true, lastSaved: save.meta.lastSavedAt });
        } catch {
          saves.push({ slot, exists: true, lastSaved: undefined });
        }
      } else {
        saves.push({ slot, exists: false });
      }
    }
    return saves;
  });

  ipcMain.handle(MainInvokeChannel.DELETE_SAVE, (_event, { slot }: { slot: 1 | 2 | 3 }) => {
    const savePath = getSavePath(app.getPath('userData'), slot);
    if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
    // Also delete backups
    for (let i = 1; i <= 3; i++) {
      const bakPath = `${savePath}.bak${i}`;
      if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath);
    }
    return { success: true };
  });

  ipcMain.handle(MainInvokeChannel.EXPORT_SAVE, async (_event, { slot }: { slot: 1 | 2 | 3 }) => {
    const savePath = getSavePath(app.getPath('userData'), slot);
    if (!fs.existsSync(savePath)) return { success: false, error: 'No save file' };

    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { success: false, error: 'No window' };

    const result = await dialog.showSaveDialog(win, {
      defaultPath: `idle-mmorpg-slot${slot}.sav`,
      filters: [{ name: 'Save Files', extensions: ['sav'] }],
    });

    if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' };

    fs.copyFileSync(savePath, result.filePath);
    return { success: true, path: result.filePath };
  });
}
```

**Commit:** `feat(main): implement IPC handlers for save/load/export`

### Step 16.3 -- Implement auto-save manager

**File: `src/main/save/auto-save.ts`**

```typescript
import { BrowserWindow } from 'electron';
import { MainSendChannel } from '@shared/types/ipc';

export class AutoSaveManager {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number;
  private saveCallback: (() => Promise<void>) | null = null;

  constructor(intervalMs: number = 60000) {
    this.intervalMs = intervalMs;
  }

  setSaveCallback(cb: () => Promise<void>): void {
    this.saveCallback = cb;
  }

  start(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(async () => {
      await this.performAutoSave();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async performAutoSave(): Promise<void> {
    if (!this.saveCallback) return;

    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.send(MainSendChannel.SAVE_AUTO_STARTED);
    }

    try {
      await this.saveCallback();
      if (win) {
        win.webContents.send(MainSendChannel.SAVE_AUTO_COMPLETE);
      }
    } catch (err) {
      if (win) {
        win.webContents.send(MainSendChannel.SAVE_AUTO_FAILED, String(err));
      }
    }
  }
}
```

**Commit:** `feat(main): add auto-save manager with configurable interval`

### Step 16.4 -- Update main.ts with full lifecycle

**File: `src/main/main.ts`** (replace)

```typescript
import { app, BrowserWindow } from 'electron';
import { Worker } from 'worker_threads';
import { MessageChannelMain } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/ipc-handlers';
import { AutoSaveManager } from './save/auto-save';

let mainWindow: BrowserWindow | null = null;
let engineWorker: Worker | null = null;
const autoSaveManager = new AutoSaveManager(60000);

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    title: 'Idle MMORPG',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function spawnEngineWorker(): void {
  if (!mainWindow) return;

  engineWorker = new Worker(
    path.join(__dirname, '../engine/worker-entry.js'),
  );

  const { port1, port2 } = new MessageChannelMain();

  // Send port1 to renderer
  mainWindow.webContents.postMessage('engine:port', null, [port1]);

  // Send port2 to worker
  engineWorker.postMessage({ type: 'port', port: port2 }, [port2 as unknown as Transferable]);

  engineWorker.on('error', (err) => {
    console.error('Engine worker error:', err);
  });

  engineWorker.on('exit', (code) => {
    console.log('Engine worker exited with code:', code);
    engineWorker = null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  mainWindow?.webContents.on('did-finish-load', () => {
    spawnEngineWorker();
    autoSaveManager.start();
  });
});

app.on('window-all-closed', () => {
  autoSaveManager.stop();
  engineWorker?.terminate();
  app.quit();
});

app.on('before-quit', async () => {
  // Final save before quitting
  await autoSaveManager.performAutoSave();
});
```

**Commit:** `feat(main): wire Electron shell with worker thread, IPC, and auto-save`

---

## Task 17 -- UI: Shared Components (Panels, Buttons, Bars, Tooltips)

**Worktree:** `feat/phase1-ui`
**Branch:** `feat/phase1-ui`
**Depends on:** Task 16

### Step 17.1 -- Create CSS theme variables

**File: `src/renderer/styles/global/theme.css`**

```css
:root {
  /* Panel backgrounds */
  --panel-bg: #1A1A1F;
  --panel-bg-alt: #12121A;

  /* Frame borders (gold/bronze) */
  --frame-border-outer: #8B7340;
  --frame-border-inner: #5C4D2E;
  --frame-border-highlight: #C9A84C;
  --frame-border-shadow: #3A2E1A;
  --separator: #3D3529;

  /* Item quality colors */
  --quality-common: #9D9D9D;
  --quality-uncommon: #1EFF00;
  --quality-rare: #0070DD;
  --quality-epic: #A335EE;
  --quality-legendary: #FF8000;

  /* Text colors */
  --text-primary: #E8D5B0;
  --text-secondary: #A89878;
  --text-disabled: #5A5040;
  --stat-positive: #1EFF00;
  --stat-negative: #FF3333;
  --stat-neutral: #FFFFFF;
  --text-xp: #C8A2C8;
  --text-gold: #FFD700;
  --text-system: #FFCC00;
  --text-error: #FF4444;
  --text-link: #3399FF;

  /* Combat colors */
  --combat-phys: #FFFFFF;
  --combat-spell: #FFFF00;
  --combat-crit: #FF4444;
  --combat-heal: #00FF00;
  --combat-buff: #00CCFF;

  /* Resource bar colors */
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

  /* Scrollbar */
  --scrollbar-track: #252530;
  --scrollbar-thumb: #5C4D2E;
  --scrollbar-thumb-hover: #8B7340;

  /* Typography */
  --font-display: 'Cinzel Decorative', 'Cinzel', Georgia, serif;
  --font-heading: 'Cinzel', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, monospace;

  /* Type scale */
  --text-xs: 0.625rem;
  --text-sm: 0.75rem;
  --text-base: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 1.875rem;
  --text-3xl: 2.5rem;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

**File: `src/renderer/styles/global/reset.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  background-color: #0D0D12;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img {
  image-rendering: pixelated;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 0;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
```

**Commit:** `feat(ui): add CSS theme variables and global reset styles`

### Step 17.2 -- Create Panel shared component

**File: `src/renderer/components/shared/Panel.tsx`**

```typescript
import React from 'react';
import styles from './Panel.module.css';

interface PanelProps {
  variant?: 'primary' | 'secondary' | 'inset';
  className?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ variant = 'primary', className = '', children }) => {
  return (
    <div className={`${styles.panel} ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
};
```

**File: `src/renderer/components/shared/Panel.module.css`**

```css
.panel {
  position: relative;
  padding: var(--spacing-md);
}

.primary {
  background: var(--panel-bg);
  border: 2px solid var(--frame-border-outer);
  box-shadow:
    inset 1px 1px 0 0 var(--frame-border-highlight),
    inset -1px -1px 0 0 var(--frame-border-shadow),
    0 0 0 1px var(--frame-border-shadow);
}

.secondary {
  background: var(--panel-bg-alt);
  border: 1px solid var(--frame-border-inner);
}

.inset {
  background: #0D0D12;
  border: 1px solid var(--separator);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}
```

**Commit:** `feat(ui): add Panel shared component with primary/secondary/inset variants`

### Step 17.3 -- Create Button, ProgressBar, and Tooltip components

**File: `src/renderer/components/shared/Button.tsx`**

```typescript
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  onClick,
  children,
  className = '',
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**File: `src/renderer/components/shared/Button.module.css`**

```css
.button {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  padding: 8px 20px;
  border: 2px solid var(--frame-border-outer);
  cursor: pointer;
  transition: all 0.15s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(180deg, #5C4D2E 0%, #3A2E1A 100%);
  color: var(--text-primary);
  box-shadow: inset 0 1px 0 var(--frame-border-highlight);
}

.primary:hover:not(:disabled) {
  background: linear-gradient(180deg, #8B7340 0%, #5C4D2E 100%);
}

.secondary {
  background: var(--panel-bg);
  color: var(--text-secondary);
  border-color: var(--frame-border-inner);
}

.secondary:hover:not(:disabled) {
  background: var(--panel-bg-alt);
  color: var(--text-primary);
}

.danger {
  background: linear-gradient(180deg, #6B1A1A 0%, #3A0A0A 100%);
  color: #FF6666;
  border-color: #661111;
}
```

**File: `src/renderer/components/shared/ProgressBar.tsx`**

```typescript
import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  current: number;
  max: number;
  variant?: 'health' | 'mana' | 'energy' | 'rage' | 'xp';
  showText?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  variant = 'health',
  showText = true,
  label,
  className = '',
}) => {
  const percent = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className={`${styles.barContainer} ${styles[variant]} ${className}`}>
      <div className={styles.barFill} style={{ width: `${percent}%` }} />
      {showText && (
        <span className={styles.barText}>
          {label ?? `${Math.floor(current)} / ${Math.floor(max)}`}
        </span>
      )}
    </div>
  );
};
```

**File: `src/renderer/components/shared/ProgressBar.module.css`**

```css
.barContainer {
  position: relative;
  height: 20px;
  border: 2px solid;
  overflow: hidden;
}

.barFill {
  height: 100%;
  transition: width 0.3s ease;
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%);
}

.barText {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  white-space: nowrap;
}

.health { border-color: var(--bar-health-border); background: var(--bar-health-bg); }
.health .barFill { background-color: var(--bar-health-fill); }

.mana { border-color: var(--bar-mana-border); background: var(--bar-mana-bg); }
.mana .barFill { background-color: var(--bar-mana-fill); }

.energy { border-color: var(--bar-energy-border); background: var(--bar-energy-bg); }
.energy .barFill { background-color: var(--bar-energy-fill); }

.rage { border-color: var(--bar-rage-border); background: var(--bar-rage-bg); }
.rage .barFill { background-color: var(--bar-rage-fill); }

.xp { border-color: var(--bar-xp-border); background: var(--bar-xp-bg); }
.xp .barFill { background-color: var(--bar-xp-fill); }
```

**Commit:** `feat(ui): add Button, ProgressBar shared components`

---

## Task 18 -- UI: Character Creation Screen

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 17

### Step 18.1 -- Implement CharacterCreationScreen

**File: `src/renderer/components/character-creation/CharacterCreationScreen.tsx`**

```typescript
import React, { useState, useMemo } from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './CharacterCreationScreen.module.css';
import type { Race, CharacterClass } from '@shared/types/enums';

// Import static data for display
import racesData from '@data/races.json';
import classesData from '@data/classes.json';

interface Props {
  onComplete: (params: { name: string; race: string; classId: string }) => void;
}

export const CharacterCreationScreen: React.FC<Props> = ({ onComplete }) => {
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedRaceData = useMemo(
    () => racesData.find((r: any) => r.id === selectedRace),
    [selectedRace],
  );

  const selectedClassData = useMemo(
    () => classesData.find((c: any) => c.id === selectedClass),
    [selectedClass],
  );

  const isNameValid = characterName.trim().length >= 2
    && characterName.trim().length <= 16
    && /^[A-Za-z][A-Za-z'-]*$/.test(characterName.trim());

  const canCreate = selectedRace && selectedClass && isNameValid;

  const handleCreate = () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    onComplete({
      name: characterName.trim(),
      race: selectedRace!,
      classId: selectedClass!,
    });
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Create Your Hero</h1>

      <div className={styles.content}>
        <Panel className={styles.racePanel}>
          <h2 className={styles.sectionTitle}>Choose Race</h2>
          <div className={styles.optionGrid}>
            {racesData.map((race: any) => (
              <button
                key={race.id}
                className={`${styles.optionCard} ${selectedRace === race.id ? styles.selected : ''}`}
                onClick={() => setSelectedRace(race.id)}
              >
                <span className={styles.optionName}>{race.name}</span>
                <span className={styles.optionDesc}>{race.racialAbility.name}</span>
              </button>
            ))}
          </div>
          {selectedRaceData && (
            <div className={styles.detailBox}>
              <p className={styles.lore}>{selectedRaceData.description}</p>
              <p className={styles.statLine}>
                STR +{selectedRaceData.statBonuses.str}{' '}
                AGI +{selectedRaceData.statBonuses.agi}{' '}
                INT +{selectedRaceData.statBonuses.int}{' '}
                SPI +{selectedRaceData.statBonuses.spi}{' '}
                STA +{selectedRaceData.statBonuses.sta}
              </p>
              <p className={styles.racial}>{selectedRaceData.racialAbility.description}</p>
            </div>
          )}
        </Panel>

        <Panel className={styles.classPanel}>
          <h2 className={styles.sectionTitle}>Choose Class</h2>
          <div className={styles.optionGrid}>
            {classesData.map((cls: any) => (
              <button
                key={cls.id}
                className={`${styles.optionCard} ${selectedClass === cls.id ? styles.selected : ''}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                <span className={styles.optionName}>{cls.name}</span>
                <span className={styles.optionDesc}>{cls.armorType} | {cls.resourceType}</span>
              </button>
            ))}
          </div>
          {selectedClassData && (
            <div className={styles.detailBox}>
              <p className={styles.lore}>{selectedClassData.description}</p>
              <p className={styles.statLine}>
                Roles: {selectedClassData.roles.join(', ')}
              </p>
              <div className={styles.specList}>
                {selectedClassData.specs.map((spec: any) => (
                  <div key={spec.id} className={styles.specItem}>
                    <strong>{spec.name}</strong>: {spec.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel className={styles.namePanel}>
          <h2 className={styles.sectionTitle}>Name Your Character</h2>
          <input
            className={styles.nameInput}
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Enter name (2-16 characters)"
            maxLength={16}
          />
          {characterName.length > 0 && !isNameValid && (
            <p className={styles.nameError}>
              Name must be 2-16 letters, starting with a letter. Hyphens and apostrophes allowed.
            </p>
          )}
        </Panel>
      </div>

      <div className={styles.footer}>
        <Button
          variant="primary"
          disabled={!canCreate || isCreating}
          onClick={handleCreate}
        >
          {isCreating ? 'Creating...' : 'Start Adventure'}
        </Button>
      </div>
    </div>
  );
};
```

**File: `src/renderer/components/character-creation/CharacterCreationScreen.module.css`**

```css
.screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: var(--spacing-lg);
  background: var(--panel-bg-alt);
}

.title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  text-align: center;
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-lg);
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr auto;
  gap: var(--spacing-md);
  flex: 1;
  overflow-y: auto;
}

.racePanel { grid-column: 1; grid-row: 1; }
.classPanel { grid-column: 2; grid-row: 1; }
.namePanel { grid-column: 1 / -1; grid-row: 2; }

.sectionTitle {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
}

.optionGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.optionCard {
  background: var(--panel-bg-alt);
  border: 1px solid var(--frame-border-inner);
  padding: var(--spacing-sm);
  cursor: pointer;
  text-align: center;
  color: var(--text-primary);
  font-family: var(--font-body);
  transition: all 0.15s;
}

.optionCard:hover {
  border-color: var(--frame-border-outer);
  background: var(--panel-bg);
}

.optionCard.selected {
  border-color: var(--frame-border-highlight);
  background: rgba(201, 168, 76, 0.1);
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.3);
}

.optionName {
  display: block;
  font-weight: 600;
  font-size: var(--text-base);
}

.optionDesc {
  display: block;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.detailBox {
  background: var(--panel-bg-alt);
  border: 1px solid var(--separator);
  padding: var(--spacing-sm);
}

.lore { color: var(--text-secondary); font-style: italic; margin-bottom: var(--spacing-xs); }
.statLine { font-family: var(--font-mono); color: var(--stat-positive); margin-bottom: var(--spacing-xs); }
.racial { color: var(--text-xp); }

.specList { display: flex; flex-direction: column; gap: 4px; margin-top: var(--spacing-xs); }
.specItem { font-size: var(--text-sm); color: var(--text-secondary); }

.nameInput {
  width: 100%;
  padding: 10px 14px;
  background: #0D0D12;
  border: 1px solid var(--frame-border-inner);
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  outline: none;
}

.nameInput:focus {
  border-color: var(--frame-border-highlight);
}

.nameError {
  color: var(--text-error);
  font-size: var(--text-sm);
  margin-top: var(--spacing-xs);
}

.footer {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-md);
}
```

**Commit:** `feat(ui): add CharacterCreationScreen with race, class, and name selection`

---

## Task 19 -- UI: Main Hub Layout (Sidebar, Tabs, Status Bar)

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 17

### Step 19.1 -- Implement MainGameScreen layout

**File: `src/renderer/components/layout/MainGameScreen.tsx`**

```typescript
import React, { useState } from 'react';
import { Panel } from '../shared/Panel';
import styles from './MainGameScreen.module.css';

export type NavigationTab = 'overview' | 'character' | 'inventory' | 'talents' | 'quests' | 'settings';

const NAV_ITEMS: Array<{ id: NavigationTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'O' },
  { id: 'character', label: 'Character', icon: 'C' },
  { id: 'inventory', label: 'Inventory', icon: 'I' },
  { id: 'talents', label: 'Talents', icon: 'T' },
  { id: 'quests', label: 'Quests', icon: 'Q' },
  { id: 'settings', label: 'Settings', icon: 'S' },
];

export const MainGameScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navButton} ${activeTab === item.id ? styles.active : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>

      <main className={styles.contentArea}>
        <Panel className={styles.mainPanel}>
          {activeTab === 'overview' && <div>Overview Tab - Combat log, character summary, quest tracker</div>}
          {activeTab === 'character' && <div>Character Tab - Paper doll, stats</div>}
          {activeTab === 'inventory' && <div>Inventory Tab - Bag grid, items</div>}
          {activeTab === 'talents' && <div>Talents Tab - 3 talent trees</div>}
          {activeTab === 'quests' && <div>Quests Tab - Quest journal</div>}
          {activeTab === 'settings' && <div>Settings Tab - Save management</div>}
        </Panel>
      </main>

      <footer className={styles.statusBar}>
        <span className={styles.statusItem}>Level 1</span>
        <span className={styles.statusItem}>Zone: Sunstone Valley</span>
        <span className={styles.statusItem}>Gold: 0</span>
        <span className={styles.statusItem}>DPS: 0</span>
      </footer>
    </div>
  );
};
```

**File: `src/renderer/components/layout/MainGameScreen.module.css`**

```css
.layout {
  display: grid;
  grid-template-columns: 64px 1fr;
  grid-template-rows: 1fr 40px;
  height: 100vh;
  background: #0D0D12;
}

.sidebar {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  background: var(--panel-bg);
  border-right: 2px solid var(--frame-border-outer);
  padding: var(--spacing-xs) 0;
  gap: 2px;
}

.navButton {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 56px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  font-family: var(--font-body);
}

.navButton:hover {
  background: rgba(139, 115, 64, 0.15);
  color: var(--text-primary);
}

.navButton.active {
  background: rgba(201, 168, 76, 0.2);
  color: var(--frame-border-highlight);
  border-left: 3px solid var(--frame-border-highlight);
}

.navIcon {
  font-size: var(--text-lg);
  font-weight: 700;
}

.navLabel {
  font-size: var(--text-xs);
  margin-top: 2px;
}

.contentArea {
  grid-column: 2;
  grid-row: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
}

.mainPanel {
  height: 100%;
}

.statusBar {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: 0 var(--spacing-md);
  background: var(--panel-bg);
  border-top: 2px solid var(--frame-border-outer);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.statusItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
```

**Commit:** `feat(ui): add MainGameScreen layout with sidebar navigation and status bar`

---

## Task 20 -- UI: Character Panel (Paper Doll, Stats)

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Tasks 17, 19

### Step 20.1 -- Implement CharacterPanel component

**File: `src/renderer/components/character/CharacterPanel.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { ProgressBar } from '../shared/ProgressBar';
import styles from './CharacterPanel.module.css';
import type { ICharacterSnapshot, IComputedStats } from '@shared/types/state';
import type { ResourceType } from '@shared/types/enums';

interface Props {
  character: ICharacterSnapshot;
  stats: IComputedStats;
}

function getResourceVariant(type: ResourceType): 'mana' | 'energy' | 'rage' {
  switch (type) {
    case 'mana': return 'mana';
    case 'energy': return 'energy';
    case 'rage': return 'rage';
    default: return 'mana';
  }
}

export const CharacterPanel: React.FC<Props> = ({ character, stats }) => {
  return (
    <div className={styles.container}>
      <Panel className={styles.headerPanel}>
        <h2 className={styles.characterName}>{character.name}</h2>
        <p className={styles.subtitle}>
          Level {character.level} {character.race} {character.classId}
        </p>
        <ProgressBar
          current={character.currentXP}
          max={character.xpToNextLevel}
          variant="xp"
          label={`${character.currentXP.toLocaleString()} / ${character.xpToNextLevel.toLocaleString()} XP`}
          className={styles.xpBar}
        />
      </Panel>

      <div className={styles.columns}>
        <Panel variant="secondary" className={styles.paperDoll}>
          <div className={styles.characterPreview}>
            <div className={styles.previewPlaceholder}>
              Paper Doll
            </div>
          </div>
        </Panel>

        <Panel variant="secondary" className={styles.statsPanel}>
          <h3 className={styles.statsTitle}>Primary Stats</h3>
          <div className={styles.statGrid}>
            <StatRow label="Strength" value={stats.primaryStats.str} />
            <StatRow label="Agility" value={stats.primaryStats.agi} />
            <StatRow label="Intellect" value={stats.primaryStats.int} />
            <StatRow label="Spirit" value={stats.primaryStats.spi} />
            <StatRow label="Stamina" value={stats.primaryStats.sta} />
          </div>

          <h3 className={styles.statsTitle}>Secondary Stats</h3>
          <div className={styles.statGrid}>
            <StatRow label="Attack Power" value={stats.attackPower} />
            <StatRow label="Spell Power" value={Math.floor(stats.spellPower)} />
            <StatRow label="Crit Chance" value={`${stats.criticalStrike.toFixed(1)}%`} />
            <StatRow label="Haste" value={`${stats.haste.toFixed(1)}%`} />
            <StatRow label="Hit Rating" value={`${stats.hitRating.toFixed(1)}%`} />
            <StatRow label="Armor" value={Math.floor(stats.armor)} />
            <StatRow label="Dodge" value={`${stats.dodge.toFixed(1)}%`} />
            <StatRow label="Max HP" value={stats.maxHealth.toLocaleString()} />
            <StatRow label="Max Mana" value={stats.maxMana.toLocaleString()} />
          </div>

          <h3 className={styles.statsTitle}>Misc</h3>
          <div className={styles.statGrid}>
            <StatRow label="Gold" value={character.gold.toLocaleString()} />
            <StatRow label="Kills" value={character.totalKills.toLocaleString()} />
            <StatRow label="Deaths" value={character.deathCount} />
            <StatRow label="Quests" value={character.totalQuestsCompleted} />
          </div>
        </Panel>
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className={styles.statRow}>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue}>{value}</span>
  </div>
);
```

**File: `src/renderer/components/character/CharacterPanel.module.css`**

```css
.container { display: flex; flex-direction: column; gap: var(--spacing-sm); height: 100%; }

.headerPanel { text-align: center; }

.characterName {
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  color: var(--frame-border-highlight);
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.xpBar { margin-top: var(--spacing-xs); }

.columns {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-sm);
  flex: 1;
  min-height: 0;
}

.paperDoll { display: flex; align-items: center; justify-content: center; }
.characterPreview { width: 256px; height: 512px; }
.previewPlaceholder {
  width: 100%;
  height: 100%;
  background: #0D0D12;
  border: 1px solid var(--separator);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
  font-family: var(--font-heading);
}

.statsPanel { overflow-y: auto; }

.statsTitle {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.statsTitle:first-child { margin-top: 0; }

.statGrid { display: flex; flex-direction: column; gap: 2px; }

.statRow {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.statLabel {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.statValue {
  font-family: var(--font-mono);
  color: var(--stat-neutral);
  font-size: var(--text-sm);
  font-feature-settings: "tnum";
}
```

**Commit:** `feat(ui): add CharacterPanel with paper doll placeholder and stat display`

---

## Task 21 -- UI: Inventory Screen (Grid, Item Slots, Tooltips)

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Tasks 17, 20

### Step 21.1 -- Implement ItemSlot component

**File: `src/renderer/components/inventory/ItemSlot.tsx`**

```typescript
import React, { useState } from 'react';
import styles from './ItemSlot.module.css';
import type { IItem } from '@shared/types/item';
import type { ItemQuality } from '@shared/types/enums';

interface Props {
  item: IItem | null;
  slotLabel?: string;
  onClick?: (item: IItem) => void;
  onRightClick?: (item: IItem) => void;
}

const QUALITY_CLASS: Record<string, string> = {
  common: 'qualityCommon',
  uncommon: 'qualityUncommon',
  rare: 'qualityRare',
  epic: 'qualityEpic',
  legendary: 'qualityLegendary',
};

export const ItemSlot: React.FC<Props> = ({ item, slotLabel, onClick, onRightClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const qualityClass = item ? (QUALITY_CLASS[item.quality] ?? '') : '';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item && onRightClick) onRightClick(item);
  };

  return (
    <div
      className={`${styles.slot} ${qualityClass ? styles[qualityClass] : ''}`}
      onClick={() => item && onClick?.(item)}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {item ? (
        <div className={styles.itemIcon}>
          <span className={styles.itemInitial}>{item.name[0]}</span>
        </div>
      ) : (
        <span className={styles.emptyLabel}>{slotLabel ?? ''}</span>
      )}

      {showTooltip && item && (
        <div className={styles.tooltip}>
          <ItemTooltip item={item} />
        </div>
      )}
    </div>
  );
};

const ItemTooltip: React.FC<{ item: IItem }> = ({ item }) => {
  return (
    <div className={styles.tooltipContent}>
      <span className={`${styles.tooltipName} ${styles[QUALITY_CLASS[item.quality] ?? ''] ?? ''}`}>
        {item.name}
      </span>
      <span className={styles.tooltipILevel}>Item Level {item.iLevel}</span>
      <span className={styles.tooltipSlot}>{item.slot}</span>
      {item.weaponDamage && (
        <span className={styles.tooltipDamage}>
          {item.weaponDamage.min} - {item.weaponDamage.max} Damage
        </span>
      )}
      {item.weaponSpeed && (
        <span className={styles.tooltipSpeed}>Speed {item.weaponSpeed.toFixed(1)}</span>
      )}
      {Object.entries(item.primaryStats).map(([stat, value]) => (
        <span key={stat} className={styles.tooltipStat}>+{value} {stat.toUpperCase()}</span>
      ))}
      {Object.entries(item.secondaryStats).map(([stat, value]) => (
        <span key={stat} className={styles.tooltipSecondaryStat}>+{value} {stat}</span>
      ))}
      <span className={styles.tooltipReqLevel}>Requires Level {item.requiredLevel}</span>
      <span className={styles.tooltipSellValue}>Sell: {item.sellValue} gold</span>
    </div>
  );
};
```

**File: `src/renderer/components/inventory/ItemSlot.module.css`**

```css
.slot {
  width: 48px;
  height: 48px;
  background: #0D0D12;
  border: 2px solid #3D3529;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.slot:hover { border-color: var(--frame-border-outer); }

.qualityCommon { border-color: #4A4A4A; }
.qualityUncommon { border-color: #0D7A00; }
.qualityRare { border-color: #003D7A; }
.qualityEpic { border-color: #5C1D87; }
.qualityLegendary { border-color: #8A4500; }

.itemIcon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}

.itemInitial {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--text-primary);
}

.emptyLabel {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  text-align: center;
}

.tooltip {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 8px;
  z-index: 100;
  pointer-events: none;
}

.tooltipContent {
  background: var(--panel-bg);
  border: 2px solid var(--frame-border-outer);
  padding: var(--spacing-sm);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.8);
}

.tooltipName { font-family: var(--font-heading); font-size: var(--text-md); }
.tooltipName.qualityCommon { color: var(--quality-common); }
.tooltipName.qualityUncommon { color: var(--quality-uncommon); }
.tooltipName.qualityRare { color: var(--quality-rare); }
.tooltipName.qualityEpic { color: var(--quality-epic); }
.tooltipName.qualityLegendary { color: var(--quality-legendary); }

.tooltipILevel { font-size: var(--text-xs); color: var(--text-gold); }
.tooltipSlot { font-size: var(--text-sm); color: var(--text-secondary); }
.tooltipDamage { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-primary); }
.tooltipSpeed { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-secondary); }
.tooltipStat { font-size: var(--text-sm); color: var(--stat-positive); }
.tooltipSecondaryStat { font-size: var(--text-sm); color: var(--stat-positive); }
.tooltipReqLevel { font-size: var(--text-xs); color: var(--text-secondary); margin-top: 4px; }
.tooltipSellValue { font-size: var(--text-xs); color: var(--text-gold); }
```

### Step 21.2 -- Implement InventoryGrid component

**File: `src/renderer/components/inventory/InventoryGrid.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { ItemSlot } from './ItemSlot';
import styles from './InventoryGrid.module.css';
import type { IItem } from '@shared/types/item';
import type { GearSlot } from '@shared/types/enums';

interface Props {
  equipment: Partial<Record<GearSlot, IItem | null>>;
  inventory: (IItem | null)[];
  onEquipItem?: (item: IItem) => void;
  onUnequipItem?: (slot: GearSlot) => void;
  onSellItem?: (item: IItem) => void;
}

const EQUIPMENT_LAYOUT: Array<{ slot: GearSlot; label: string }> = [
  { slot: 'head' as GearSlot, label: 'Head' },
  { slot: 'neck' as GearSlot, label: 'Neck' },
  { slot: 'shoulders' as GearSlot, label: 'Shoulders' },
  { slot: 'back' as GearSlot, label: 'Back' },
  { slot: 'chest' as GearSlot, label: 'Chest' },
  { slot: 'wrists' as GearSlot, label: 'Wrists' },
  { slot: 'hands' as GearSlot, label: 'Hands' },
  { slot: 'waist' as GearSlot, label: 'Waist' },
  { slot: 'legs' as GearSlot, label: 'Legs' },
  { slot: 'feet' as GearSlot, label: 'Feet' },
  { slot: 'ring1' as GearSlot, label: 'Ring' },
  { slot: 'ring2' as GearSlot, label: 'Ring' },
  { slot: 'trinket1' as GearSlot, label: 'Trinket' },
  { slot: 'trinket2' as GearSlot, label: 'Trinket' },
  { slot: 'main-hand' as GearSlot, label: 'Main Hand' },
  { slot: 'off-hand' as GearSlot, label: 'Off Hand' },
];

export const InventoryGrid: React.FC<Props> = ({
  equipment,
  inventory,
  onEquipItem,
  onUnequipItem,
  onSellItem,
}) => {
  return (
    <div className={styles.container}>
      <Panel variant="secondary" className={styles.equipmentPanel}>
        <h3 className={styles.title}>Equipment</h3>
        <div className={styles.equipGrid}>
          {EQUIPMENT_LAYOUT.map(({ slot, label }) => (
            <ItemSlot
              key={slot}
              item={equipment[slot] ?? null}
              slotLabel={label}
              onRightClick={() => onUnequipItem?.(slot)}
            />
          ))}
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.bagPanel}>
        <h3 className={styles.title}>
          Bag ({inventory.filter(i => i !== null).length} / {inventory.length})
        </h3>
        <div className={styles.bagGrid}>
          {inventory.map((item, idx) => (
            <ItemSlot
              key={idx}
              item={item}
              onClick={(i) => onEquipItem?.(i)}
              onRightClick={(i) => onSellItem?.(i)}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
};
```

**File: `src/renderer/components/inventory/InventoryGrid.module.css`**

```css
.container { display: flex; gap: var(--spacing-md); height: 100%; }

.equipmentPanel { width: 280px; }
.bagPanel { flex: 1; }

.title {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
}

.equipGrid {
  display: grid;
  grid-template-columns: repeat(4, 48px);
  gap: 4px;
  justify-content: center;
}

.bagGrid {
  display: grid;
  grid-template-columns: repeat(7, 48px);
  gap: 4px;
}
```

**Commit:** `feat(ui): add InventoryGrid and ItemSlot components with quality-colored tooltips`

---

## Task 22 -- UI: Combat Log and Overview Tab

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 19

### Step 22.1 -- Implement CombatLog component

**File: `src/renderer/components/combat/CombatLog.tsx`**

```typescript
import React, { useRef, useEffect } from 'react';
import { Panel } from '../shared/Panel';
import styles from './CombatLog.module.css';
import type { ICombatLogEntry } from '@shared/types/combat';

interface Props {
  entries: ICombatLogEntry[];
  maxEntries?: number;
}

const TYPE_COLORS: Record<string, string> = {
  damage_dealt: 'var(--combat-phys)',
  damage_taken: 'var(--stat-negative)',
  heal: 'var(--combat-heal)',
  ability_used: 'var(--combat-buff)',
  monster_killed: 'var(--text-gold)',
  player_death: 'var(--text-error)',
  xp_gained: 'var(--text-xp)',
  gold_gained: 'var(--text-gold)',
  loot_dropped: 'var(--quality-uncommon)',
  level_up: 'var(--text-system)',
  miss: 'var(--text-disabled)',
  dodge: 'var(--text-disabled)',
  crit: 'var(--combat-crit)',
};

function formatLogEntry(entry: ICombatLogEntry): string {
  switch (entry.type) {
    case 'damage_dealt':
      return `${entry.source} hits ${entry.target} for ${entry.value}${entry.isCritical ? ' (CRIT!)' : ''}`;
    case 'damage_taken':
      return `${entry.target} takes ${entry.value} damage from ${entry.source}`;
    case 'heal':
      return `${entry.source} heals ${entry.target} for ${entry.value}${entry.isCritical ? ' (CRIT!)' : ''}`;
    case 'monster_killed':
      return `${entry.target} has been slain!`;
    case 'xp_gained':
      return `+${entry.value} XP`;
    case 'gold_gained':
      return `+${entry.value} gold`;
    case 'loot_dropped':
      return `Loot: ${entry.itemName}`;
    case 'level_up':
      return `LEVEL UP! You are now level ${entry.value}!`;
    case 'miss':
      return `${entry.source}'s attack missed ${entry.target}`;
    case 'player_death':
      return `You have died! (-10% gold)`;
    default:
      return `${entry.source}: ${entry.type}`;
  }
}

export const CombatLog: React.FC<Props> = ({ entries, maxEntries = 100 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const visible = entries.slice(-maxEntries);

  return (
    <Panel variant="inset" className={styles.logContainer}>
      <div className={styles.logScroll} ref={scrollRef}>
        {visible.map((entry, idx) => (
          <div
            key={idx}
            className={styles.logEntry}
            style={{ color: TYPE_COLORS[entry.type] ?? 'var(--text-secondary)' }}
          >
            {formatLogEntry(entry)}
          </div>
        ))}
        {visible.length === 0 && (
          <div className={styles.emptyLog}>Combat log is empty. Start fighting!</div>
        )}
      </div>
    </Panel>
  );
};
```

**File: `src/renderer/components/combat/CombatLog.module.css`**

```css
.logContainer {
  height: 100%;
  padding: var(--spacing-xs);
}

.logScroll {
  height: 100%;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.logEntry {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.emptyLog {
  color: var(--text-disabled);
  font-style: italic;
  text-align: center;
  padding-top: var(--spacing-lg);
}
```

### Step 22.2 -- Implement OverviewTab (combat + summary)

**File: `src/renderer/components/layout/OverviewTab.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { ProgressBar } from '../shared/ProgressBar';
import { CombatLog } from '../combat/CombatLog';
import styles from './OverviewTab.module.css';
import type { IGameStateSnapshot } from '@shared/types/state';

interface Props {
  gameState: IGameStateSnapshot;
}

export const OverviewTab: React.FC<Props> = ({ gameState }) => {
  const { character, combat, activeQuest, currentZoneName, recentCombatLog } = gameState;

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <Panel variant="secondary" className={styles.combatPanel}>
          <h3 className={styles.sectionTitle}>Combat</h3>
          {combat.inCombat && combat.targetName ? (
            <div className={styles.targetInfo}>
              <span className={styles.targetName}>
                {combat.targetName} (Lv. {combat.targetLevel})
              </span>
              <ProgressBar
                current={combat.targetHP}
                max={combat.targetMaxHP}
                variant="health"
              />
            </div>
          ) : (
            <p className={styles.idle}>Seeking target...</p>
          )}
          {character && (
            <div className={styles.playerBars}>
              <ProgressBar current={combat.playerHP} max={combat.playerMaxHP} variant="health" />
              <ProgressBar
                current={combat.playerResource}
                max={combat.playerMaxResource}
                variant={combat.resourceType === 'mana' ? 'mana' : combat.resourceType === 'energy' ? 'energy' : 'rage'}
              />
            </div>
          )}
          <div className={styles.dpsDisplay}>
            DPS: <span className={styles.dpsValue}>{combat.dps.toFixed(1)}</span>
          </div>
        </Panel>

        <Panel variant="secondary" className={styles.questPanel}>
          <h3 className={styles.sectionTitle}>
            Current Zone: {currentZoneName ?? 'Unknown'}
          </h3>
          {activeQuest ? (
            <div className={styles.questInfo}>
              <ProgressBar
                current={activeQuest.currentKills}
                max={activeQuest.requiredKills}
                variant="xp"
                label={`Quest: ${activeQuest.currentKills} / ${activeQuest.requiredKills} kills`}
              />
            </div>
          ) : (
            <p className={styles.idle}>No active quest</p>
          )}
        </Panel>
      </div>

      <div className={styles.logRow}>
        <CombatLog entries={recentCombatLog} />
      </div>
    </div>
  );
};
```

**File: `src/renderer/components/layout/OverviewTab.module.css`**

```css
.container { display: flex; flex-direction: column; height: 100%; gap: var(--spacing-sm); }

.topRow { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); }

.logRow { flex: 1; min-height: 200px; }

.sectionTitle {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
}

.combatPanel, .questPanel { padding: var(--spacing-sm); }

.targetInfo { margin-bottom: var(--spacing-sm); }

.targetName {
  display: block;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--stat-negative);
  margin-bottom: var(--spacing-xs);
}

.playerBars { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-sm); }

.dpsDisplay {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.dpsValue {
  color: var(--text-primary);
  font-weight: 600;
}

.questInfo { margin-top: var(--spacing-xs); }

.idle {
  color: var(--text-disabled);
  font-style: italic;
}
```

**Commit:** `feat(ui): add CombatLog and OverviewTab with combat display and quest tracker`

---

## Task 23 -- UI: Offline Progress Modal and Settings Screen

**Worktree:** `feat/phase1-ui` (continues)
**Depends on:** Task 17

### Step 23.1 -- Implement OfflineProgressModal

**File: `src/renderer/components/modals/OfflineProgressModal.tsx`**

```typescript
import React from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './OfflineProgressModal.module.css';
import type { IOfflineResult } from '@engine/offline/offline-calculator';

interface Props {
  result: IOfflineResult;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export const OfflineProgressModal: React.FC<Props> = ({ result, onClose }) => {
  return (
    <div className={styles.overlay}>
      <Panel className={styles.modal}>
        <h2 className={styles.title}>Welcome Back!</h2>
        <p className={styles.subtitle}>
          You were away for {formatDuration(result.rawOfflineSeconds)}
          {result.simulatedSeconds < result.rawOfflineSeconds && (
            <> (effective: {formatDuration(result.simulatedSeconds)})</>
          )}
        </p>

        <div className={styles.gains}>
          <GainRow icon="*" label="XP Gained" value={result.xpGained.toLocaleString()} color="var(--text-xp)" />
          {result.levelsGained > 0 && (
            <GainRow icon="^" label="Levels Gained" value={`+${result.levelsGained}`} color="var(--text-system)" />
          )}
          <GainRow icon="G" label="Gold Gained" value={result.goldGained.toLocaleString()} color="var(--text-gold)" />
          <GainRow icon="X" label="Monsters Killed" value={result.monstersKilled.toLocaleString()} color="var(--stat-negative)" />
          <GainRow icon="Q" label="Quests Completed" value={result.questsCompleted.toString()} color="var(--quality-uncommon)" />
        </div>

        {result.catchUpMultiplier > 1 && (
          <p className={styles.catchUp}>
            Catch-up bonus active: {result.catchUpMultiplier}x XP for the next 30 minutes!
          </p>
        )}

        <div className={styles.footer}>
          <Button variant="primary" onClick={onClose}>
            Continue Adventure
          </Button>
        </div>
      </Panel>
    </div>
  );
};

const GainRow: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className={styles.gainRow}>
    <span className={styles.gainIcon} style={{ color }}>{icon}</span>
    <span className={styles.gainLabel}>{label}</span>
    <span className={styles.gainValue} style={{ color }}>{value}</span>
  </div>
);
```

**File: `src/renderer/components/modals/OfflineProgressModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 480px;
  max-width: 90vw;
  text-align: center;
}

.title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-lg);
}

.gains {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.gainRow {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--panel-bg-alt);
  border: 1px solid var(--separator);
}

.gainIcon {
  font-size: var(--text-lg);
  width: 24px;
  text-align: center;
}

.gainLabel {
  flex: 1;
  text-align: left;
  color: var(--text-secondary);
}

.gainValue {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 600;
  font-feature-settings: "tnum";
}

.catchUp {
  color: var(--text-system);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-md);
  font-style: italic;
}

.footer {
  display: flex;
  justify-content: center;
}
```

**Commit:** `feat(ui): add OfflineProgressModal with gains summary display`

### Step 23.2 -- Implement SettingsTab

**File: `src/renderer/components/layout/SettingsTab.tsx`**

```typescript
import React, { useState } from 'react';
import { Panel } from '../shared/Panel';
import { Button } from '../shared/Button';
import styles from './SettingsTab.module.css';

interface Props {
  onSave?: (slot: 1 | 2 | 3) => void;
  onLoad?: (slot: 1 | 2 | 3) => void;
  onExport?: (slot: 1 | 2 | 3) => void;
  onDelete?: (slot: 1 | 2 | 3) => void;
}

export const SettingsTab: React.FC<Props> = ({ onSave, onLoad, onExport, onDelete }) => {
  const [autoEquip, setAutoEquip] = useState(true);
  const [autoSellCommon, setAutoSellCommon] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  return (
    <div className={styles.container}>
      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>Save Management</h3>
        <div className={styles.saveSlots}>
          {[1, 2, 3].map((slot) => (
            <div key={slot} className={styles.saveSlot}>
              <span className={styles.slotLabel}>Slot {slot}</span>
              <div className={styles.slotActions}>
                <Button variant="primary" onClick={() => onSave?.(slot as 1 | 2 | 3)}>Save</Button>
                <Button variant="secondary" onClick={() => onLoad?.(slot as 1 | 2 | 3)}>Load</Button>
                <Button variant="secondary" onClick={() => onExport?.(slot as 1 | 2 | 3)}>Export</Button>
                {confirmDelete === slot ? (
                  <>
                    <Button variant="danger" onClick={() => { onDelete?.(slot as 1 | 2 | 3); setConfirmDelete(null); }}>Confirm</Button>
                    <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="danger" onClick={() => setConfirmDelete(slot)}>Delete</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>Game Settings</h3>
        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={autoEquip}
              onChange={(e) => setAutoEquip(e.target.checked)}
            />
            Auto-equip upgrades
          </label>
        </div>
        <div className={styles.settingRow}>
          <label className={styles.settingLabel}>
            <input
              type="checkbox"
              checked={autoSellCommon}
              onChange={(e) => setAutoSellCommon(e.target.checked)}
            />
            Auto-sell Common items when inventory is full
          </label>
        </div>
      </Panel>

      <Panel variant="secondary" className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <p className={styles.aboutText}>Idle MMORPG v0.1.0</p>
        <p className={styles.aboutText}>No energy systems. No pay-to-win. Just idle MMORPG glory.</p>
      </Panel>
    </div>
  );
};
```

**File: `src/renderer/components/layout/SettingsTab.module.css`**

```css
.container { display: flex; flex-direction: column; gap: var(--spacing-md); }

.section { padding: var(--spacing-md); }

.sectionTitle {
  font-family: var(--font-heading);
  font-size: var(--text-md);
  color: var(--frame-border-highlight);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--separator);
  padding-bottom: var(--spacing-xs);
}

.saveSlots { display: flex; flex-direction: column; gap: var(--spacing-sm); }

.saveSlot {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--panel-bg);
  border: 1px solid var(--separator);
}

.slotLabel {
  font-family: var(--font-heading);
  font-size: var(--text-base);
  color: var(--text-primary);
  min-width: 60px;
}

.slotActions { display: flex; gap: var(--spacing-xs); }

.settingRow { margin-bottom: var(--spacing-xs); }

.settingLabel {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.aboutText { color: var(--text-secondary); font-size: var(--text-sm); }
```

**Commit:** `feat(ui): add SettingsTab with save slot management and game options`

---

## Task 24 -- Integration Testing and Balance Simulation

**Worktree:** main (all branches merged)
**Depends on:** All previous tasks

### Step 24.1 -- Write cross-system integration test

**File: `tests/integration/character-lifecycle.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { createCharacter } from '@engine/character/character-factory';
import { calculateDerivedStats, calculatePrimaryStats, xpToNextLevel } from '@engine/character/stat-calculator';
import { awardXP } from '@engine/progression/xp-system';
import { generateItem } from '@engine/gear/item-generator';
import { isUpgrade, equipItem } from '@engine/gear/inventory-manager';
import { allocateTalentPoint, canAllocatePoint } from '@engine/talents/talent-manager';
import { calculateOfflineProgress } from '@engine/offline/offline-calculator';
import { serializeSave, deserializeSave } from '@main/save/save-io';
import { Race, CharacterClass, PrimaryStat, GearSlot, ItemQuality } from '@shared/types/enums';
import { SeededRandom } from '@shared/utils/rng';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('Character Lifecycle Integration', () => {
  it('should create a character, level up, equip gear, allocate talents, go offline, and save/load', () => {
    // 1. Create character
    const char = createCharacter({
      name: 'IntegrationTest',
      race: Race.Bloodborn,
      classId: CharacterClass.Blademaster,
    });
    expect(char.level).toBe(1);
    expect(char.primaryStats[PrimaryStat.Strength]).toBe(32); // 25 + 7

    // 2. Award XP and level up
    const xpResult = awardXP({
      currentLevel: char.level,
      currentXP: char.currentXP,
      xpGained: 50000,
      config,
    });
    expect(xpResult.newLevel).toBeGreaterThan(1);
    expect(xpResult.levelsGained).toBeGreaterThan(0);

    // 3. Generate and equip gear
    const rng = new SeededRandom(42);
    const newChest = generateItem({
      iLevel: 20,
      quality: ItemQuality.Rare,
      slot: GearSlot.Chest,
      classPrimaryStats: [PrimaryStat.Strength, PrimaryStat.Stamina],
      rng,
      config,
    });
    expect(newChest.iLevel).toBe(20);

    const currentChest = char.equipment[GearSlot.Chest] ?? null;
    const shouldEquip = isUpgrade(newChest, currentChest, [PrimaryStat.Strength, PrimaryStat.Stamina]);
    expect(shouldEquip).toBe(true);

    const equipResult = equipItem(char.equipment, char.inventory, newChest);
    expect(equipResult.equipment[GearSlot.Chest]?.iLevel).toBe(20);

    // 4. Calculate offline progress
    const offlineResult = calculateOfflineProgress({
      characterLevel: xpResult.newLevel,
      currentXP: xpResult.remainingXP,
      currentZoneLevel: xpResult.newLevel,
      offlineSeconds: 3600 * 8, // 8 hours offline
      rng: new SeededRandom(99),
      config,
    });
    expect(offlineResult.xpGained).toBeGreaterThan(0);
    expect(offlineResult.goldGained).toBeGreaterThan(0);

    // 5. Serialize and deserialize save
    const saveData = {
      meta: {
        version: '1.0.0',
        gameVersion: '0.1.0',
        saveSlot: 1 as const,
        createdAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        playTimeSeconds: 3600,
        checksum: '',
      },
      character: {
        id: char.id,
        name: char.name,
        race: char.race,
        classId: char.classId,
        level: xpResult.newLevel,
        currentXP: xpResult.remainingXP,
        gold: offlineResult.goldGained,
        currentHP: char.currentHP,
        currentResource: char.currentResource,
        deathCount: 0,
        totalKills: offlineResult.monstersKilled,
        totalQuestsCompleted: offlineResult.questsCompleted,
        respecCount: 0,
      },
      progression: {
        currentZoneId: 'zone_02',
        currentQuestIndex: 0,
        currentQuestKills: 0,
        zonesCompleted: ['zone_01'],
        unlockedAbilities: [],
        activeAbilityPriority: [],
      },
      inventory: {
        equipped: equipResult.equipment,
        bags: equipResult.inventory,
      },
      talents: { allocatedPoints: {}, totalPointsSpent: 0 },
      combatState: { currentMonster: null, activeBuffs: [], activeDoTs: [], cooldowns: {} },
      settings: { autoEquip: true, autoSellCommon: false, combatLogVisible: true, uiScale: 1.0 },
    };

    const buffer = serializeSave(saveData);
    expect(buffer.length).toBeGreaterThan(0);

    const restored = deserializeSave(buffer);
    expect(restored.character.name).toBe('IntegrationTest');
    expect(restored.character.level).toBe(xpResult.newLevel);
    expect(restored.character.gold).toBe(offlineResult.goldGained);
  });
});
```

**Run:** `pnpm test -- tests/integration/character-lifecycle.test.ts` -- should PASS.

**Commit:** `test(integration): add full character lifecycle integration test`

### Step 24.2 -- Write balance simulation test

**File: `tests/balance/leveling-pacing.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { xpToNextLevel, calculateMonsterXP } from '@engine/character/stat-calculator';
import { loadBalanceConfig } from '@shared/utils/balance-loader';

const config = loadBalanceConfig();

describe('Leveling Pacing Simulation', () => {
  it('should reach level 60 within 25-45 hours of active play time', () => {
    let totalSeconds = 0;
    const TICKS_PER_SECOND = 4;
    const TICKS_PER_KILL = 4; // avg 4 ticks to kill a monster
    const QUEST_XP_MULTIPLIER = 1.7; // quest bonus

    for (let level = 1; level < 60; level++) {
      const xpNeeded = xpToNextLevel(level, config);
      const monsterXP = calculateMonsterXP(level, config);
      const effectiveXPPerKill = monsterXP * QUEST_XP_MULTIPLIER;
      const killsNeeded = Math.ceil(xpNeeded / effectiveXPPerKill);
      const ticksNeeded = killsNeeded * TICKS_PER_KILL;
      const secondsNeeded = ticksNeeded / TICKS_PER_SECOND;
      totalSeconds += secondsNeeded;
    }

    const totalHours = totalSeconds / 3600;

    // Target: 25-40 hours active play
    expect(totalHours).toBeGreaterThan(15);
    expect(totalHours).toBeLessThan(50);
  });

  it('should have XP curve where early levels feel fast', () => {
    // Level 1-10 should take less than 1 hour
    let earlyXP = 0;
    for (let level = 1; level <= 10; level++) {
      earlyXP += xpToNextLevel(level, config);
    }

    const avgMonsterXP = calculateMonsterXP(5, config); // avg level 5 monster
    const killsNeeded = Math.ceil(earlyXP / (avgMonsterXP * 1.7));
    const ticksNeeded = killsNeeded * 4;
    const minutes = ticksNeeded / 4 / 60;

    expect(minutes).toBeLessThan(90); // First 10 levels in under 90 minutes
  });

  it('should have XP curve where late levels feel earned', () => {
    // Level 50-60 should take meaningful time
    let lateXP = 0;
    for (let level = 50; level < 60; level++) {
      lateXP += xpToNextLevel(level, config);
    }

    const avgMonsterXP = calculateMonsterXP(55, config);
    const killsNeeded = Math.ceil(lateXP / (avgMonsterXP * 1.7));
    const ticksNeeded = killsNeeded * 4;
    const hours = ticksNeeded / 4 / 3600;

    expect(hours).toBeGreaterThan(3); // Last 10 levels take at least 3 hours
  });
});
```

**Run:** `pnpm test -- tests/balance/leveling-pacing.test.ts` -- should PASS.

**Commit:** `test(balance): add leveling pacing simulation tests`

### Step 24.3 -- Run full test suite

```bash
pnpm test
```

All tests across unit, integration, and balance directories should pass.

**Commit:** `chore: verify full test suite passes for Phase 1`

---

## Summary: Task-to-Branch Mapping

| Task | Branch | Key Deliverables |
|------|--------|-----------------|
| 1-2 | `feat/electron-scaffold` | Project scaffold, package.json, tsconfig, Vite, Vitest, enums, IPC types |
| 3-6 | `feat/shared-types` | All shared interfaces, balance.json, balance loader, RNG, stat calculator |
| 7-8 | `feat/combat-engine` | races.json, classes.json, character factory, combat formulas, ability priority, EventBus |
| 9 | `feat/character-system` | XP system, zones.json |
| 10-11 | `feat/gear-system` | Item generator, loot system, inventory manager |
| 12 | `feat/talent-system` | Talent manager with allocation, respec, effects |
| 13-15 | `feat/save-system` | Save/load with gzip+checksum, backup rotation, offline calculator, game loop, worker entry |
| 16 | main (after merges) | Preload script, IPC handlers, auto-save, Electron main.ts lifecycle |
| 17-23 | `feat/phase1-ui` | Theme CSS, Panel, Button, ProgressBar, CharacterCreation, MainHub, CharacterPanel, Inventory, CombatLog, OverviewTab, OfflineModal, Settings |
| 24 | main (after merges) | Integration test, balance simulation, full suite verification |

## Merge Order

1. Merge `feat/electron-scaffold` into `main`
2. Merge `feat/shared-types` into `main`
3. Merge `feat/combat-engine` into `main`
4. Merge `feat/character-system` into `main`
5. Merge `feat/gear-system` into `main`
6. Merge `feat/talent-system` into `main`
7. Merge `feat/save-system` into `main`
8. Complete Task 16 on `main`
9. Merge `feat/phase1-ui` into `main`
10. Complete Task 24 on `main`

Each merge should include running `pnpm test` and `pnpm typecheck` to verify no regressions.
