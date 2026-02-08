# Phase 1 Implementation Plan — Completed Tasks (1-6)

> **Status:** DONE — All merged to `main`
> Archive of completed tasks. See [phase1-index.md](phase1-index.md) for active tasks.

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

