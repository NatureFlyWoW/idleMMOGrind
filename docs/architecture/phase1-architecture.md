# Phase 1 Technical Architecture Document

**Version:** 1.0
**Date:** February 8, 2026
**Author:** @idle-mmo-gdev
**Scope:** Phase 1 (Months 1-4) -- Electron scaffold, character creation, combat system, leveling 1-60, gear system, talent trees, save system

---

## Table of Contents

1. [Electron Architecture](#1-electron-architecture)
2. [Project Setup](#2-project-setup)
3. [Game Engine Architecture](#3-game-engine-architecture)
4. [Data Layer](#4-data-layer)
5. [Save System Architecture](#5-save-system-architecture)
6. [State Management](#6-state-management)
7. [Key TypeScript Interfaces](#7-key-typescript-interfaces)
8. [Performance Considerations](#8-performance-considerations)
9. [Testing Strategy](#9-testing-strategy)
10. [Dependency Choices](#10-dependency-choices)

---

## 1. Electron Architecture

### 1.1 Process Model

The application uses Electron's multi-process architecture with three distinct execution contexts:

```
+-------------------+       IPC (contextBridge)       +--------------------+
|   Main Process    | <-----------------------------> |  Renderer Process  |
|   (Node.js)       |                                 |  (Chromium/React)  |
+-------------------+                                 +--------------------+
        |                                                      |
        |  spawn + MessagePort                                 |
        |                                                      |
+-------------------+                                          |
|  Engine Worker    | -- MessagePort (transferred) ----------->+
|  (Worker Thread)  |
+-------------------+
```

**Main Process** -- the Electron host process running full Node.js. Responsibilities:

- Application lifecycle (window creation, tray icon, quit handling)
- Save/load file I/O (read/write to disk using streams)
- Auto-save scheduler (5-minute interval timer)
- Auto-updater (Electron updater module)
- Native OS integration (notifications, file dialogs for manual export)
- Spawning and managing the Engine Worker thread
- Relaying messages between renderer and engine when needed

**Renderer Process** -- the Chromium browser window running the React UI. Responsibilities:

- All visual rendering (React component tree, HTML5 Canvas for sprites)
- User interaction handling (clicks, keyboard, drag-and-drop)
- Displaying game state snapshots received from the engine
- Sending player actions (equip item, allocate talent, start dungeon) to the engine
- Sound/music playback via Web Audio API
- No game logic computation -- the renderer is a pure presentation layer

**Engine Worker** -- a Node.js Worker Thread running the game simulation. Responsibilities:

- Game loop tick processing (combat, progression, quest completion)
- All damage/healing formula calculations
- Loot generation and item stat rolling
- Offline progression simulation (time-compressed batch calculation)
- XP curve evaluation and level-up processing
- Talent effect application and stat recalculation
- Zone/quest state machine transitions

### 1.2 IPC Channel Design

All IPC uses structured message envelopes. The main process acts as a message broker for save operations, while the engine worker communicates directly with the renderer via a transferred MessagePort for low-latency game state updates.

#### 1.2.1 Main <-> Renderer Channels (Electron IPC)

These channels are exposed through `contextBridge` in the preload script:

```typescript
// src/shared/types/ipc.ts

/** Channels invoked FROM renderer TO main (request/response pattern) */
export enum MainInvokeChannel {
  // Save System
  SAVE_GAME = 'save:save-game',
  LOAD_GAME = 'save:load-game',
  EXPORT_SAVE = 'save:export',
  IMPORT_SAVE = 'save:import',
  LIST_SAVES = 'save:list',
  DELETE_SAVE = 'save:delete',

  // Application
  APP_GET_VERSION = 'app:get-version',
  APP_GET_PLATFORM = 'app:get-platform',
  APP_GET_USER_DATA_PATH = 'app:get-user-data-path',
}

/** Channels sent FROM main TO renderer (push notifications) */
export enum MainSendChannel {
  // Save System
  SAVE_AUTO_STARTED = 'save:auto-started',
  SAVE_AUTO_COMPLETE = 'save:auto-complete',
  SAVE_AUTO_FAILED = 'save:auto-failed',

  // Application
  APP_UPDATE_AVAILABLE = 'app:update-available',
  APP_UPDATE_DOWNLOADED = 'app:update-downloaded',
  APP_BEFORE_QUIT = 'app:before-quit',
}
```

#### 1.2.2 Renderer <-> Engine Worker Channels (MessagePort)

The main process creates the Worker and transfers a MessagePort to the renderer via IPC. From that point, the renderer and engine communicate directly without main process involvement. This eliminates a hop for the highest-frequency messages (game state snapshots at every tick).

```typescript
// src/shared/types/ipc.ts

/** Messages sent FROM renderer TO engine worker */
export enum EngineCommandType {
  // Lifecycle
  INIT = 'engine:init',
  PAUSE = 'engine:pause',
  RESUME = 'engine:resume',
  SHUTDOWN = 'engine:shutdown',
  SET_TICK_RATE = 'engine:set-tick-rate',

  // Character Creation
  CREATE_CHARACTER = 'char:create',
  DELETE_CHARACTER = 'char:delete',
  SELECT_CHARACTER = 'char:select',

  // Character Actions
  EQUIP_ITEM = 'char:equip-item',
  UNEQUIP_ITEM = 'char:unequip-item',
  ALLOCATE_TALENT = 'char:allocate-talent',
  RESET_TALENTS = 'char:reset-talents',
  SET_ABILITY_PRIORITY = 'char:set-ability-priority',
  SELL_ITEM = 'char:sell-item',
  BUY_ITEM = 'char:buy-item',
  TRAIN_ABILITY = 'char:train-ability',

  // Progression
  SELECT_ZONE = 'prog:select-zone',
  ACCEPT_QUEST = 'prog:accept-quest',
  ABANDON_QUEST = 'prog:abandon-quest',
  START_DUNGEON = 'prog:start-dungeon',

  // Save/Load integration
  LOAD_STATE = 'engine:load-state',
  GET_SAVE_PAYLOAD = 'engine:get-save-payload',

  // Offline
  CALCULATE_OFFLINE = 'engine:calculate-offline',
}

/** Messages sent FROM engine worker TO renderer */
export enum EngineEventType {
  // State Updates (every tick)
  STATE_SNAPSHOT = 'state:snapshot',

  // Discrete Events (on occurrence)
  COMBAT_LOG_ENTRY = 'event:combat-log',
  LEVEL_UP = 'event:level-up',
  LOOT_DROPPED = 'event:loot-dropped',
  QUEST_COMPLETE = 'event:quest-complete',
  QUEST_PROGRESS = 'event:quest-progress',
  ACHIEVEMENT_EARNED = 'event:achievement',
  ZONE_CHANGED = 'event:zone-changed',
  DUNGEON_RESULT = 'event:dungeon-result',
  ABILITY_UNLOCKED = 'event:ability-unlocked',

  // Engine Lifecycle
  ENGINE_READY = 'engine:ready',
  ENGINE_ERROR = 'engine:error',
  SAVE_PAYLOAD_READY = 'engine:save-payload-ready',
  OFFLINE_RESULT = 'engine:offline-result',
}
```

#### 1.2.3 Message Envelope Format

```typescript
// src/shared/types/ipc.ts

export interface EngineCommand<T = unknown> {
  id: string;            // UUID for request/response correlation
  type: EngineCommandType;
  payload: T;
  timestamp: number;     // Date.now()
}

export interface EngineEvent<T = unknown> {
  id: string;
  type: EngineEventType;
  payload: T;
  timestamp: number;
  tickNumber: number;    // Which game tick produced this event
}
```

#### 1.2.4 MessagePort Bootstrap Sequence

```
1. Main process creates Worker Thread (src/engine/worker-entry.ts)
2. Main process creates a MessageChannel, getting portA and portB
3. Main sends portA to renderer via IPC (ipcRenderer receives it)
4. Main sends portB to worker via worker.postMessage with transfer
5. Renderer stores portA, sets up onmessage handler
6. Worker stores portB, sets up onmessage handler
7. Renderer sends INIT command through portA
8. Worker responds with ENGINE_READY event through portB
9. Direct renderer <-> worker communication is established
```

```typescript
// src/main/ipc/engine-bridge.ts (simplified)

import { Worker } from 'worker_threads';
import { MessageChannelMain } from 'electron';

export function bootstrapEngine(mainWindow: BrowserWindow): Worker {
  const worker = new Worker(
    path.join(__dirname, '../engine/worker-entry.js')
  );

  const { port1, port2 } = new MessageChannelMain();

  // Send port1 to renderer
  mainWindow.webContents.postMessage('engine:port', null, [port1]);

  // Send port2 to worker
  worker.postMessage({ type: 'port', port: port2 }, [port2]);

  return worker;
}
```

### 1.3 Process Responsibility Matrix

| Responsibility | Main | Renderer | Engine Worker |
|---|---|---|---|
| Window management | Yes | -- | -- |
| File system I/O (save/load) | Yes | -- | -- |
| Auto-save timer | Yes | -- | -- |
| React rendering | -- | Yes | -- |
| User input handling | -- | Yes | -- |
| Sound playback | -- | Yes | -- |
| Game loop tick | -- | -- | Yes |
| Combat calculation | -- | -- | Yes |
| Loot generation | -- | -- | Yes |
| XP/leveling math | -- | -- | Yes |
| Stat recalculation | -- | -- | Yes |
| Offline simulation | -- | -- | Yes |
| Quest state machine | -- | -- | Yes |

---

## 2. Project Setup

### 2.1 Package Structure

The project uses pnpm as its package manager. It is a single-package repository (not a monorepo workspace) because the Electron main, renderer, and engine code are tightly coupled and share types extensively.

```
idle-mmorpg/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json              # Base config
├── tsconfig.main.json         # Main process config
├── tsconfig.renderer.json     # Renderer (React) config
├── tsconfig.engine.json       # Engine worker config
├── electron-builder.yml       # Electron Builder config
├── vite.config.ts             # Vite for renderer bundling
├── vitest.config.ts           # Test configuration
├── .eslintrc.cjs
├── .prettierrc
├── data/                      # Game data JSON files
├── src/
│   ├── main/                  # Electron main process
│   ├── engine/                # Game engine (worker thread)
│   ├── renderer/              # React application
│   └── shared/                # Shared types, constants, utils
├── tests/
│   ├── unit/
│   ├── integration/
│   └── balance/
└── resources/                 # Electron app icons, installer assets
```

### 2.2 TypeScript Configuration

Base `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
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
  "exclude": ["node_modules", "dist", "out"]
}
```

`tsconfig.main.json`:

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

`tsconfig.renderer.json`:

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

`tsconfig.engine.json`:

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

### 2.3 Path Aliases

Vite resolves aliases for the renderer bundle. For the main process and engine worker (compiled via `tsc`), we use `tsconfig-paths` or `tsc-alias` as a post-compile step to rewrite paths to relative imports.

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@data': path.resolve(__dirname, 'data'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: 'src/renderer/index.html',
    },
  },
});
```

### 2.4 Electron Builder Configuration

```yaml
# electron-builder.yml
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
  icon: resources/icon.ico

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: resources/icon.icns
  category: public.app-category.games

linux:
  target:
    - target: AppImage
      arch: [x64]
  icon: resources/icon.png
  category: Game

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true

publish: null
```

### 2.5 Vitest Configuration

```typescript
// vitest.config.ts
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
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
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

### 2.6 Key Scripts (package.json)

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:main\" \"pnpm dev:renderer\"",
    "dev:main": "tsc -p tsconfig.main.json --watch & tsc -p tsconfig.engine.json --watch & electron .",
    "dev:renderer": "vite dev",
    "build": "pnpm build:shared && pnpm build:engine && pnpm build:main && pnpm build:renderer",
    "build:main": "tsc -p tsconfig.main.json && tsc-alias -p tsconfig.main.json",
    "build:engine": "tsc -p tsconfig.engine.json && tsc-alias -p tsconfig.engine.json",
    "build:renderer": "vite build",
    "build:shared": "tsc -p tsconfig.json --emitDeclarationOnly",
    "package": "electron-builder --config electron-builder.yml",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:balance": "vitest run tests/balance/",
    "lint": "eslint src/ tests/ --ext .ts,.tsx",
    "typecheck": "tsc --noEmit -p tsconfig.main.json && tsc --noEmit -p tsconfig.renderer.json && tsc --noEmit -p tsconfig.engine.json"
  }
}
```

---

## 3. Game Engine Architecture

### 3.1 Game Loop Design

The engine runs in a Worker Thread and processes the game simulation in discrete ticks. The tick rate is configurable but defaults to 4 ticks per second during active play. This rate provides smooth-feeling combat log updates without wasting CPU on unnecessary granularity for an idle game.

```typescript
// src/engine/game-loop.ts

export interface GameLoopConfig {
  /** Milliseconds between ticks. Default 250ms (4 ticks/sec). */
  tickIntervalMs: number;
  /** Maximum ticks to process in a single batch (prevents runaway). */
  maxBatchTicks: number;
}

export const DEFAULT_LOOP_CONFIG: GameLoopConfig = {
  tickIntervalMs: 250,
  maxBatchTicks: 100,
};
```

The loop uses `setInterval` within the worker thread. Each tick:

1. Advances the simulation clock by `tickIntervalMs` of game time.
2. Processes combat (auto-attacks, ability rotations, DoT/HoT ticks).
3. Evaluates quest progress conditions.
4. Checks for level-ups and triggers associated logic.
5. Emits discrete game events (loot drops, level-ups, quest completions).
6. Produces an immutable state snapshot for the renderer.

```typescript
// src/engine/game-loop.ts

export class GameLoop {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private tickNumber: number = 0;
  private paused: boolean = true;
  private config: GameLoopConfig;
  private state: GameState;
  private systems: GameSystem[];
  private eventBus: EventBus;
  private port: MessagePort;

  constructor(
    port: MessagePort,
    config: GameLoopConfig = DEFAULT_LOOP_CONFIG,
  ) {
    this.config = config;
    this.port = port;
    this.state = createInitialGameState();
    this.eventBus = new EventBus();
    this.systems = [
      new CombatSystem(this.eventBus),
      new ProgressionSystem(this.eventBus),
      new QuestSystem(this.eventBus),
      new LootSystem(this.eventBus),
    ];
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

  private tick(): void {
    if (this.paused) return;
    this.tickNumber++;

    // Each system mutates state in sequence
    for (const system of this.systems) {
      system.update(this.state, this.config.tickIntervalMs);
    }

    // Flush queued events to renderer
    const events = this.eventBus.drain();
    for (const event of events) {
      this.port.postMessage({
        id: crypto.randomUUID(),
        type: event.type,
        payload: event.payload,
        timestamp: Date.now(),
        tickNumber: this.tickNumber,
      } satisfies EngineEvent);
    }

    // Send state snapshot (throttled -- every 4th tick = 1/sec)
    if (this.tickNumber % 4 === 0) {
      this.port.postMessage({
        id: crypto.randomUUID(),
        type: EngineEventType.STATE_SNAPSHOT,
        payload: this.getSnapshot(),
        timestamp: Date.now(),
        tickNumber: this.tickNumber,
      } satisfies EngineEvent);
    }
  }

  private getSnapshot(): GameStateSnapshot {
    return createSnapshot(this.state);
  }
}
```

**Tick Rate Rationale:**

| Scenario | Tick Rate | Reason |
|---|---|---|
| Active play | 4/sec (250ms) | Smooth combat log, responsive UI |
| Background/minimized | 1/sec (1000ms) | Reduce CPU when not visible |
| Offline calculation | N/A (batch) | Time-compressed, no real-time ticks |

### 3.2 System Architecture (ECS-Lite)

The engine uses a simplified Entity-Component-System pattern. Rather than a full ECS framework, the game state is a single mutable object owned by the game loop, and each system operates on relevant slices of that state. This is appropriate because we have a small, fixed set of entity types (one active character, one combat encounter, one quest log) rather than thousands of entities.

```typescript
// src/engine/systems/game-system.ts

export interface GameSystem {
  /** Process one tick of game time. deltaMs is the tick interval. */
  update(state: GameState, deltaMs: number): void;
}
```

Systems execute in a fixed order each tick:

```
1. CombatSystem    -- Process auto-attacks, ability casts, DoT/HoT ticks, enemy AI
2. ProgressionSystem -- Check XP thresholds, apply level-ups, update stat totals
3. QuestSystem     -- Evaluate kill counts, collection progress, completion triggers
4. LootSystem      -- Process pending loot rolls, generate items, manage inventory
```

### 3.3 Event System

The event bus is an internal queue within the engine worker. Systems push events onto the bus during their `update()` call. After all systems have run for a tick, the game loop drains the bus and sends events to the renderer.

```typescript
// src/engine/events/event-bus.ts

export interface GameEvent<T = unknown> {
  type: EngineEventType;
  payload: T;
}

export class EventBus {
  private queue: GameEvent[] = [];

  emit<T>(type: EngineEventType, payload: T): void {
    this.queue.push({ type, payload });
  }

  drain(): GameEvent[] {
    const events = this.queue;
    this.queue = [];
    return events;
  }

  get pending(): number {
    return this.queue.length;
  }
}
```

### 3.4 Combat Simulation

Combat runs continuously while the character is in a zone. The combat system maintains a `CombatEncounter` that tracks the current enemy, all active effects (DoTs, HoTs, buffs, debuffs), and resource pools.

#### 3.4.1 Per-Tick Combat Processing

```typescript
// src/engine/combat/combat-system.ts (conceptual flow)

export class CombatSystem implements GameSystem {
  update(state: GameState, deltaMs: number): void {
    const combat = state.combat;
    if (!combat.inCombat) {
      this.findNewTarget(state);
      return;
    }

    const deltaSeconds = deltaMs / 1000;

    // 1. Resource regeneration
    this.regenerateResources(state.character, deltaSeconds);

    // 2. Process player auto-attack
    this.processAutoAttack(state, deltaSeconds);

    // 3. Process ability rotation (priority-based)
    this.processAbilityRotation(state, deltaSeconds);

    // 4. Process DoT/HoT ticks
    this.processPeriodicEffects(state, deltaSeconds);

    // 5. Process enemy actions
    this.processEnemyActions(state, deltaSeconds);

    // 6. Check for death (player or enemy)
    this.checkDeathConditions(state);
  }
}
```

#### 3.4.2 Damage Formula Implementation

```typescript
// src/engine/combat/formulas.ts

import type { StatBlock, DamageResult } from '@shared/types/combat';

export function calculatePhysicalDamage(
  weaponDamageMin: number,
  weaponDamageMax: number,
  strengthModifier: number,
  critChance: number,
  critMultiplier: number,
  enemyArmorReduction: number,
  hitChance: number,
  rng: SeededRandom,
): DamageResult {
  // Roll hit check
  if (rng.next() > hitChance) {
    return { amount: 0, type: 'miss', isCrit: false };
  }

  // Roll base weapon damage
  const baseWeaponDmg = rng.nextInRange(weaponDamageMin, weaponDamageMax);
  let damage = baseWeaponDmg + strengthModifier;

  // Roll crit
  const isCrit = rng.next() < critChance;
  if (isCrit) {
    damage *= (1 + critMultiplier);
  }

  // Apply armor reduction
  damage *= (1 - enemyArmorReduction);

  return {
    amount: Math.max(1, Math.round(damage)),
    type: 'physical',
    isCrit,
  };
}

export function calculateSpellDamage(
  baseSpellDamage: number,
  intellectModifier: number,
  critChance: number,
  critMultiplier: number,
  enemyResistance: number,
  spellPenetration: number,
  hitChance: number,
  rng: SeededRandom,
): DamageResult {
  if (rng.next() > hitChance) {
    return { amount: 0, type: 'miss', isCrit: false };
  }

  let damage = baseSpellDamage + intellectModifier;

  const isCrit = rng.next() < critChance;
  if (isCrit) {
    damage *= (1 + critMultiplier);
  }

  const effectiveResistance = Math.max(0, enemyResistance - spellPenetration);
  damage *= (1 - effectiveResistance);

  return {
    amount: Math.max(1, Math.round(damage)),
    type: 'spell',
    isCrit,
  };
}

export function calculateHealing(
  baseHeal: number,
  intellectModifier: number,
  critChance: number,
  critMultiplier: number,
  rng: SeededRandom,
): DamageResult {
  let healing = baseHeal + intellectModifier;

  const isCrit = rng.next() < critChance;
  if (isCrit) {
    healing *= (1 + critMultiplier);
  }

  return {
    amount: Math.max(1, Math.round(healing)),
    type: 'healing',
    isCrit,
  };
}
```

#### 3.4.3 Ability Priority System

Players configure a priority list for their abilities. The combat system evaluates the list top-to-bottom each tick, casting the first ability whose conditions are met:

```typescript
// src/engine/combat/ability-priority.ts

export interface AbilityPriorityEntry {
  abilityId: string;
  enabled: boolean;
  conditions: AbilityCondition[];
}

export type AbilityCondition =
  | { type: 'resource_above'; resource: ResourceType; percent: number }
  | { type: 'resource_below'; resource: ResourceType; percent: number }
  | { type: 'target_health_below'; percent: number }
  | { type: 'target_health_above'; percent: number }
  | { type: 'buff_missing'; buffId: string }
  | { type: 'debuff_missing_on_target'; debuffId: string }
  | { type: 'cooldown_ready' }
  | { type: 'always' };

export function selectNextAbility(
  priorities: AbilityPriorityEntry[],
  character: CharacterState,
  target: EnemyState,
  cooldowns: Map<string, number>,
): string | null {
  for (const entry of priorities) {
    if (!entry.enabled) continue;
    if (cooldowns.has(entry.abilityId)) continue;
    if (meetsAllConditions(entry.conditions, character, target)) {
      return entry.abilityId;
    }
  }
  return null; // Fall through to auto-attack only
}
```

### 3.5 Offline Progression Calculation

When the player returns after being away, the engine calculates offline progress in a single batch rather than simulating every tick. This uses statistical modeling to compress hours of play into a sub-2-second calculation.

```typescript
// src/engine/offline/offline-calculator.ts

export interface OfflineResult {
  /** Actual game-seconds simulated after diminishing returns. */
  simulatedSeconds: number;
  /** Raw seconds the player was offline. */
  rawOfflineSeconds: number;
  /** Efficiency multiplier applied (diminishing returns). */
  efficiencyMultiplier: number;
  /** Catch-up bonus multiplier to apply for the next active session. */
  catchUpMultiplier: number;

  xpGained: number;
  levelsGained: number;
  goldGained: number;
  questsCompleted: QuestCompletionSummary[];
  lootAcquired: IItem[];
  itemsAutoSold: number;
  goldFromAutoSell: number;
}

export function calculateOfflineProgress(
  state: GameState,
  offlineSeconds: number,
  balanceConfig: BalanceConfig,
  rng: SeededRandom,
): OfflineResult {
  // Step 1: Apply diminishing returns to get effective time
  const effective = applyDiminishingReturns(offlineSeconds, balanceConfig);

  // Step 2: Calculate XP earned (based on zone, level, monsters-per-hour)
  const xpPerSecond = estimateXpPerSecond(state.character, state.currentZone);
  const xpGained = Math.floor(xpPerSecond * effective.simulatedSeconds);

  // Step 3: Calculate gold earned
  const goldPerSecond = estimateGoldPerSecond(state.character, state.currentZone);
  const goldGained = Math.floor(goldPerSecond * effective.simulatedSeconds);

  // Step 4: Simulate quest completions
  const questResults = simulateQuestProgress(
    state.quests.active,
    effective.simulatedSeconds,
    state.currentZone,
  );

  // Step 5: Generate loot drops (statistical sample, not per-kill)
  const lootResults = generateOfflineLoot(
    state.character.level,
    state.currentZone,
    effective.simulatedSeconds,
    balanceConfig,
    rng,
  );

  // Step 6: Handle inventory overflow
  const inventoryResult = processInventoryOverflow(
    state.inventory,
    lootResults.items,
  );

  // Step 7: Calculate catch-up multiplier
  const catchUpMultiplier = calculateCatchUpMultiplier(
    offlineSeconds,
    balanceConfig,
  );

  return {
    simulatedSeconds: effective.simulatedSeconds,
    rawOfflineSeconds: offlineSeconds,
    efficiencyMultiplier: effective.multiplier,
    catchUpMultiplier,
    xpGained,
    levelsGained: calculateLevelsFromXp(
      state.character.level,
      state.character.currentXp,
      xpGained,
      balanceConfig.xpCurve,
    ),
    goldGained: goldGained + inventoryResult.goldFromAutoSell,
    questsCompleted: questResults,
    lootAcquired: inventoryResult.keptItems,
    itemsAutoSold: inventoryResult.soldCount,
    goldFromAutoSell: inventoryResult.goldFromAutoSell,
  };
}
```

#### 3.5.1 Diminishing Returns Formula

```typescript
// src/engine/offline/diminishing-returns.ts

export interface DiminishingResult {
  simulatedSeconds: number;
  multiplier: number;
}

/**
 * Offline efficiency schedule:
 *   0-12h:  100% efficiency
 *   12-18h: 75% efficiency
 *   18-24h: 50% efficiency
 *   24h+:   capped at 24h total
 */
export function applyDiminishingReturns(
  rawSeconds: number,
  config: BalanceConfig,
): DiminishingResult {
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

---

## 4. Data Layer

### 4.1 Enum Definitions

All fixed-set identifiers are defined as TypeScript `enum` or `const` union types in `src/shared/types/enums.ts`:

```typescript
// src/shared/types/enums.ts

// ─── Races ──────────────────────────────────────────
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

// ─── Classes ────────────────────────────────────────
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

// ─── Specializations ────────────────────────────────
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

// ─── Primary Stats ──────────────────────────────────
export enum PrimaryStat {
  Strength = 'str',
  Agility = 'agi',
  Intellect = 'int',
  Spirit = 'spi',
  Stamina = 'sta',
}

// ─── Secondary Stats ────────────────────────────────
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

// ─── Resource Types ─────────────────────────────────
export enum ResourceType {
  Mana = 'mana',
  Energy = 'energy',
  Rage = 'rage',
}

// ─── Gear Slots ─────────────────────────────────────
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

// ─── Item Quality ───────────────────────────────────
export enum ItemQuality {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
}

// ─── Ability Types ──────────────────────────────────
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

// ─── Quest Types ────────────────────────────────────
export enum QuestType {
  Kill = 'kill',
  Collection = 'collection',
  Dungeon = 'dungeon',
  Elite = 'elite',
  Attunement = 'attunement',
}

// ─── Dungeon Difficulty ─────────────────────────────
export enum DungeonDifficulty {
  Normal = 'normal',
  Heroic = 'heroic',
}

// ─── Reputation Tier ────────────────────────────────
export enum ReputationTier {
  Neutral = 'neutral',
  Friendly = 'friendly',
  Honored = 'honored',
  Revered = 'revered',
  Exalted = 'exalted',
}
```

### 4.2 JSON Data File Schemas

Game content is stored in `data/` as JSON files. Each file corresponds to a TypeScript interface. These files are loaded once at engine initialization and cached in memory.

```
data/
├── balance.json              # All tunable numeric parameters
├── races.json                # 8 race definitions
├── classes.json              # 9 class definitions with specs
├── zones/
│   ├── starting-regions.json
│   ├── wildwood-meadows.json
│   ├── mistmoors-caverns.json
│   ├── skyreach-summits.json
│   ├── blighted-wastes.json
│   └── ascendant-territories.json
├── talents/
│   ├── blademaster.json      # 3 trees per file
│   ├── sentinel.json
│   ├── stalker.json
│   ├── shadow.json
│   ├── cleric.json
│   ├── arcanist.json
│   ├── summoner.json
│   ├── channeler.json
│   └── shapeshifter.json
├── abilities/
│   ├── blademaster.json
│   ├── ...                   # One per class
│   └── shapeshifter.json
├── items/
│   ├── weapons.json
│   ├── armor-plate.json
│   ├── armor-leather.json
│   ├── armor-cloth.json
│   ├── jewelry.json
│   ├── trinkets.json
│   └── loot-tables.json
├── dungeons/
│   ├── normal-dungeons.json
│   └── heroic-dungeons.json
├── quests/
│   ├── zone-01-starting.json
│   ├── ...                   # One per zone
│   └── attunement-chains.json
└── factions/
    └── factions.json
```

### 4.3 Balance Constants File Structure

`data/balance.json` contains every tunable numeric parameter. Systems read from this object at runtime; changing values here changes game behavior without code changes.

```typescript
// src/shared/types/balance.ts -- the shape of data/balance.json

export interface BalanceConfig {
  /** XP required per level. Index 0 = level 1->2, index 58 = level 59->60 */
  xpCurve: number[];

  /** Gold reward multiplier per level range */
  goldCurve: {
    perKillBase: number;
    perKillLevelScale: number;
    questRewardBase: number;
    questRewardLevelScale: number;
  };

  /** Combat tuning */
  combat: {
    autoAttackIntervalMs: number;
    globalCooldownMs: number;
    baseCritMultiplier: number;
    baseHitChance: number;
    armorReductionCap: number;
    resistanceReductionCap: number;
    /** Stat points per 1% crit */
    agiPerCritPercent: number;
    /** Stat points per 1% haste */
    hasteRatingPerPercent: number;
    /** Stat points per 1% hit */
    hitRatingPerPercent: number;
    /** HP per point of STA */
    healthPerStamina: number;
    /** Mana per point of INT */
    manaPerIntellect: number;
    /** Mana regen per point of SPI (per 5 sec) */
    manaRegenPerSpirit: number;
    /** Attack power per point of STR */
    attackPowerPerStrength: number;
    /** Spell power per point of INT */
    spellPowerPerIntellect: number;
  };

  /** Offline progression tuning */
  offline: {
    maxOfflineSeconds: number;        // 86400 (24h)
    tier1Hours: number;               // 12
    tier1Efficiency: number;          // 1.0
    tier2Hours: number;               // 18
    tier2Efficiency: number;          // 0.75
    tier3Efficiency: number;          // 0.50
    catchUpMinMultiplier: number;     // 2.0
    catchUpMaxMultiplier: number;     // 5.0
    catchUpScaleHours: number;        // 24
    maxHeroicDungeonsOffline: number; // 1
    maxDropQualityOffline: ItemQuality; // 'rare'
  };

  /** Gear generation */
  gear: {
    /** Stat budget per item level */
    statBudgetPerILevel: number;
    /** Multiplier on stat budget by quality tier */
    qualityStatMultiplier: Record<ItemQuality, number>;
    /** iLevel ranges by content tier */
    iLevelRanges: {
      questReward: { min: number; max: number };
      normalDungeon: { min: number; max: number };
      heroicDungeon: { min: number; max: number };
      raid10: { min: number; max: number };
      raid25: { min: number; max: number };
    };
  };

  /** Leveling pacing targets */
  pacing: {
    targetHoursLevel1to10: number;    // ~2h
    targetHoursLevel10to30: number;   // ~6h
    targetHoursLevel30to50: number;   // ~10h
    targetHoursLevel50to60: number;   // ~7h
    targetHoursToFirstAscension: number; // 25-40h
  };

  /** Talent system */
  talents: {
    firstTalentLevel: number;          // 10
    lastTalentLevel: number;           // 60
    totalTalentPoints: number;         // 51
    respecBaseCostGold: number;
    respecCostMultiplier: number;       // Increases per respec
    respecCostCap: number;
  };

  /** Loot drop rates (0-1 probability) */
  dropRates: {
    monsterDropChance: number;
    uncommonChance: number;
    rareChance: number;
    epicChance: number;
    legendaryChance: number;
    bossGuaranteedDrop: boolean;
  };
}
```

---

## 5. Save System Architecture

### 5.1 Save File Format

Save files are JSON objects compressed with gzip. The uncompressed JSON is human-readable for debugging. Each save contains a version field for forward-compatible migrations.

```typescript
// src/shared/types/save.ts

export interface ISaveData {
  /** Schema version for migration. Increment on breaking changes. */
  version: number;

  /** ISO 8601 timestamp of when this save was written. */
  savedAt: string;

  /** Total playtime in seconds (active + offline). */
  totalPlaytimeSeconds: number;

  /** Timestamp of last active session end (for offline calculation). */
  lastActiveTimestamp: number;

  /** The active character slot index. */
  activeCharacterIndex: number;

  /** All character data. Multiple characters for alt support. */
  characters: ISaveCharacter[];

  /** Account-wide progression. */
  account: ISaveAccountData;
}

export interface ISaveCharacter {
  id: string;
  name: string;
  race: Race;
  class: CharacterClass;
  level: number;
  currentXp: number;
  bonusStatAllocation: Record<PrimaryStat, number>; // The 10 starting points

  /** Computed stats are NOT saved -- recalculated on load from gear+talents+base. */

  /** Equipped gear by slot. */
  equipment: Partial<Record<GearSlot, IItemSaveRef>>;

  /** Bag inventory. Array of item references. */
  inventory: (IItemSaveRef | null)[];

  /** Talent point allocations. Map of talentNodeId -> points spent. */
  talents: Record<string, number>;

  /** Ability ranks purchased. Map of abilityId -> rank. */
  abilityRanks: Record<string, number>;

  /** Ability priority list for combat. */
  abilityPriority: AbilityPriorityEntry[];

  /** Current zone ID. */
  currentZoneId: string;

  /** Active quests with progress. */
  activeQuests: ISaveQuestProgress[];

  /** Completed quest IDs. */
  completedQuestIds: string[];

  /** Gold on this character (copper units). */
  gold: number;

  /** Justice Points. */
  justicePoints: number;

  /** Valor Points. */
  valorPoints: number;

  /** Weekly valor earned (resets weekly). */
  valorEarnedThisWeek: number;

  /** Profession skill levels. */
  professions: Record<string, number>;

  /** Learned recipe IDs. */
  learnedRecipes: string[];

  /** Faction reputation values. */
  reputation: Record<string, number>;

  /** Dungeon lockout state. */
  dungeonLockouts: ISaveDungeonLockout[];

  /** Raid lockout state. */
  raidLockouts: ISaveRaidLockout[];

  /** Number of talent respecs performed (for cost scaling). */
  respecCount: number;
}

/** Lightweight item reference stored in save files. */
export interface IItemSaveRef {
  /** Unique instance ID (generated items are unique instances). */
  instanceId: string;
  /** Template item ID (references data/items/*.json). */
  templateId: string;
  /** Rolled stats for this specific instance (random variance). */
  rolledStats: Partial<Record<PrimaryStat | SecondaryStat, number>>;
  /** Item level of this instance. */
  itemLevel: number;
  /** Quality of this instance. */
  quality: ItemQuality;
}

export interface ISaveQuestProgress {
  questId: string;
  objectives: Record<string, number>; // objectiveId -> current count
}

export interface ISaveDungeonLockout {
  dungeonId: string;
  difficulty: DungeonDifficulty;
  completedAt: string; // ISO timestamp
  resetAt: string;     // ISO timestamp (daily reset)
}

export interface ISaveRaidLockout {
  raidId: string;
  bossesKilled: string[]; // Boss IDs killed this lockout
  resetAt: string;        // ISO timestamp (weekly reset)
}

export interface ISaveAccountData {
  /** Number of times any character has ascended. */
  ascensionCount: number;

  /** Paragon talent allocations. Map of paragonNodeId -> points. */
  paragonTalents: Record<string, number>;

  /** Completed attunement quest chain IDs (account-wide). */
  completedAttunements: string[];

  /** Collected achievement IDs. */
  achievements: string[];

  /** Collected mount IDs. */
  mounts: string[];

  /** Collected pet IDs. */
  pets: string[];

  /** Collected transmog appearance IDs. */
  transmogAppearances: string[];

  /** Total achievement points. */
  achievementPoints: number;
}
```

### 5.2 Compression Strategy

```typescript
// src/main/save/save-io.ts

import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';
import * as fs from 'fs/promises';
import * as path from 'path';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const SAVE_MAGIC = Buffer.from('IDLEMMO\0'); // 8 bytes file signature

export async function writeSave(
  filePath: string,
  data: ISaveData,
): Promise<void> {
  const json = JSON.stringify(data);
  const compressed = await gzipAsync(Buffer.from(json, 'utf-8'), { level: 6 });

  // Write atomically: write to .tmp, then rename
  const tmpPath = filePath + '.tmp';
  const output = Buffer.concat([SAVE_MAGIC, compressed]);
  await fs.writeFile(tmpPath, output);
  await fs.rename(tmpPath, filePath);
}

export async function readSave(filePath: string): Promise<ISaveData> {
  const raw = await fs.readFile(filePath);

  // Verify magic bytes
  const magic = raw.subarray(0, 8);
  if (!magic.equals(SAVE_MAGIC)) {
    throw new SaveCorruptionError('Invalid save file signature');
  }

  const compressed = raw.subarray(8);
  const json = (await gunzipAsync(compressed)).toString('utf-8');
  return JSON.parse(json) as ISaveData;
}
```

### 5.3 Auto-Save Implementation

The main process manages auto-save on a 5-minute interval. The flow:

1. Main process timer fires every 5 minutes.
2. Main sends `APP_BEFORE_QUIT`-like signal to renderer (via `SAVE_AUTO_STARTED`).
3. Renderer sends `GET_SAVE_PAYLOAD` command to engine worker.
4. Engine worker serializes current state into `ISaveData`, sends `SAVE_PAYLOAD_READY` back.
5. Renderer forwards the save payload to main process via `SAVE_GAME` invoke.
6. Main process writes to disk (atomic write with `.tmp` rename).
7. Main sends `SAVE_AUTO_COMPLETE` or `SAVE_AUTO_FAILED` to renderer.

```typescript
// src/main/save/auto-save.ts

export class AutoSaveManager {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs = 5 * 60 * 1000; // 5 minutes
  private saving = false;

  constructor(
    private mainWindow: BrowserWindow,
    private savePath: string,
  ) {}

  start(): void {
    this.intervalHandle = setInterval(() => {
      this.triggerAutoSave();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async triggerAutoSave(): Promise<void> {
    if (this.saving) return; // Prevent overlapping saves
    this.saving = true;

    try {
      this.mainWindow.webContents.send(MainSendChannel.SAVE_AUTO_STARTED);

      // The renderer will request state from engine and invoke SAVE_GAME.
      // This method is just the timer; actual write happens in the
      // ipcMain.handle(SAVE_GAME) handler.
    } finally {
      this.saving = false;
    }
  }
}
```

### 5.4 Save Versioning and Migration

Each save has a `version` field (integer, starting at 1). When the game loads a save, it checks the version and applies sequential migration functions to bring it up to the current version.

```typescript
// src/main/save/migrations.ts

export const CURRENT_SAVE_VERSION = 1;

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

/** Registry of migrations. Key is the version being migrated FROM. */
const migrations: Record<number, MigrationFn> = {
  // Example: version 1 -> 2 adds a new field
  // 1: (data) => {
  //   data.characters.forEach(c => c.newField = defaultValue);
  //   data.version = 2;
  //   return data;
  // },
};

export function migrateSave(data: Record<string, unknown>): ISaveData {
  let current = (data.version as number) ?? 1;

  while (current < CURRENT_SAVE_VERSION) {
    const migrate = migrations[current];
    if (!migrate) {
      throw new SaveMigrationError(
        `No migration path from version ${current}`
      );
    }
    data = migrate(data);
    current++;
  }

  return data as unknown as ISaveData;
}
```

### 5.5 Backup Rotation

The save system maintains a rolling set of backups:

```
saves/
├── character-name.sav          # Current save
├── character-name.sav.bak1     # Previous save (1 auto-save ago)
├── character-name.sav.bak2     # 2 auto-saves ago
└── character-name.sav.bak3     # 3 auto-saves ago
```

Before each write, the existing file is rotated:

```typescript
// src/main/save/backup-rotation.ts

const MAX_BACKUPS = 3;

export async function rotateSaveBackups(savePath: string): Promise<void> {
  // Shift existing backups: bak3 deleted, bak2->bak3, bak1->bak2, current->bak1
  for (let i = MAX_BACKUPS; i >= 1; i--) {
    const src = i === 1 ? savePath : `${savePath}.bak${i - 1}`;
    const dst = `${savePath}.bak${i}`;
    try {
      await fs.rename(src, dst);
    } catch {
      // File may not exist yet, that is fine
    }
  }
}
```

---

## 6. State Management

### 6.1 State Flow Overview

```
                        Engine Worker                      Renderer
                   ┌─────────────────────┐          ┌──────────────────┐
                   │                     │          │                  │
  Game Data JSON──>│  GameState (mutable) │─snapshot─>│ React State      │
                   │  owned by GameLoop   │  (via    │ (useGameState)   │
                   │                     │  port)   │                  │
                   │  CombatSystem       │          │ Components       │
                   │  ProgressionSystem  │<─command─│ dispatch actions │
                   │  QuestSystem        │  (via    │                  │
                   │  LootSystem         │  port)   │                  │
                   └─────────────────────┘          └──────────────────┘
```

### 6.2 What State Lives Where

| State | Location | Rationale |
|---|---|---|
| Full mutable game state | Engine Worker | Single source of truth for all game logic |
| Immutable state snapshot | Renderer (React) | Read-only projection for display; replaced each update |
| Save file bytes | Main process | Only main has file system write access |
| UI-only state (modal open, tooltip, scroll position) | Renderer (React local state) | No game logic relevance |
| Auto-save timer | Main process | Must survive renderer reload |
| Window state (size, position) | Main process (electron-store) | OS-level concern |

### 6.3 State Snapshot Shape

The engine produces a subset of its internal state as an immutable snapshot. This snapshot is structured for efficient rendering -- it contains only the data the UI needs, pre-computed where possible.

```typescript
// src/shared/types/state.ts

export interface GameStateSnapshot {
  /** Character summary for the header bar and paper doll. */
  character: CharacterSnapshot;

  /** Current combat state. */
  combat: CombatSnapshot;

  /** Quest log state. */
  quests: QuestSnapshot;

  /** Inventory and equipment for the inventory/character screens. */
  inventory: InventorySnapshot;

  /** Zone information for the world/zone selector. */
  currentZone: ZoneSnapshot;

  /** Currency balances. */
  currencies: CurrencySnapshot;

  /** Dungeon/raid availability. */
  dungeons: DungeonSnapshot;

  /** Engine metadata. */
  meta: {
    tickNumber: number;
    gameTimeElapsed: number;
    isPaused: boolean;
  };
}

export interface CharacterSnapshot {
  name: string;
  race: Race;
  class: CharacterClass;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  xpPercent: number;

  /** Final computed stats (base + gear + talents + buffs). */
  stats: ComputedStats;

  /** Health and resource bars. */
  health: { current: number; max: number };
  resource: { current: number; max: number; type: ResourceType };

  /** Active buffs with remaining duration. */
  activeBuffs: ActiveBuffSnapshot[];

  /** Talent points: spent and available. */
  talentPointsSpent: number;
  talentPointsAvailable: number;

  /** Average item level of equipped gear. */
  averageItemLevel: number;
}

export interface ComputedStats {
  primary: Record<PrimaryStat, number>;
  secondary: Record<SecondaryStat, number>;
  derivedDps: number;
  derivedHps: number;
}

export interface CombatSnapshot {
  inCombat: boolean;
  currentEnemy: EnemySnapshot | null;
  recentLog: CombatLogEntry[];  // Last 50 entries for display
  dpsAverage: number;
  sessionKills: number;
  sessionXpPerHour: number;
  sessionGoldPerHour: number;
}

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'damage' | 'healing' | 'miss' | 'crit' | 'loot' | 'xp' | 'system';
}

export interface InventorySnapshot {
  equipped: Partial<Record<GearSlot, IItemSnapshot>>;
  bags: (IItemSnapshot | null)[];
  bagSlotCount: number;
  usedSlots: number;
}

export interface IItemSnapshot {
  instanceId: string;
  templateId: string;
  name: string;
  quality: ItemQuality;
  itemLevel: number;
  slot: GearSlot;
  stats: Partial<Record<PrimaryStat | SecondaryStat, number>>;
  setId: string | null;
  icon: string;     // Asset path for the icon sprite
  /** Pre-computed comparison vs currently equipped (positive = upgrade). */
  comparisonDelta: Partial<Record<PrimaryStat | SecondaryStat, number>> | null;
}
```

### 6.4 UI Action Flow

When the player performs an action in the UI (for example, equipping an item), the flow is:

```
1. Player drags item to gear slot (React DnD handler fires)
2. React dispatches: port.postMessage({ type: EQUIP_ITEM, payload: { instanceId, slot } })
3. Engine worker receives command
4. Engine validates: Is item in inventory? Does it match the slot? Level requirement met?
5. Engine mutates GameState: remove from inventory, place in equipment, recalculate stats
6. Engine emits events if relevant (stat change, set bonus activated)
7. On next snapshot tick, renderer receives updated state reflecting the equip
8. React re-renders the character screen and inventory
```

All mutations happen in the engine worker. The renderer never directly modifies game state. This ensures a single source of truth and makes save/load deterministic.

### 6.5 React State Management

The renderer uses React Context + `useReducer` for game state, not an external state library. The state is simple in structure (it is just the latest snapshot from the engine) so Redux or Zustand would add unnecessary complexity.

```typescript
// src/renderer/hooks/useGameEngine.ts

export interface GameEngineContext {
  /** Latest snapshot from the engine. */
  snapshot: GameStateSnapshot | null;
  /** Whether the engine is connected and running. */
  connected: boolean;
  /** Recent discrete events for toast notifications etc. */
  recentEvents: EngineEvent[];
  /** Send a command to the engine. */
  sendCommand: <T>(type: EngineCommandType, payload: T) => void;
}

export function useGameEngine(): GameEngineContext {
  // Implementation uses MessagePort stored in a ref,
  // updates snapshot state on each STATE_SNAPSHOT message,
  // and queues discrete events into a bounded ring buffer.
}
```

---

## 7. Key TypeScript Interfaces

### 7.1 Character Interfaces

```typescript
// src/shared/types/character.ts

export interface IRaceDefinition {
  id: Race;
  name: string;
  description: string;
  statBonuses: Partial<Record<PrimaryStat, number>>;
  racialAbility: {
    id: string;
    name: string;
    description: string;
    effect: IRacialEffect;
  };
  availableClasses: CharacterClass[];
  startingZoneId: string;
  lore: string;
}

export type IRacialEffect =
  | { type: 'stat_percent_bonus'; stat: PrimaryStat | SecondaryStat; percent: number }
  | { type: 'xp_bonus'; percent: number }
  | { type: 'damage_reduction'; percent: number }
  | { type: 'damage_bonus'; damageType: 'physical' | 'spell'; percent: number }
  | { type: 'resource_bonus'; resource: ResourceType; percent: number }
  | { type: 'health_bonus'; percent: number }
  | { type: 'status_immunity' }
  | { type: 'attack_speed_bonus'; percent: number };

export interface IClassDefinition {
  id: CharacterClass;
  name: string;
  description: string;
  primaryStats: PrimaryStat[];
  resourceType: ResourceType;
  armorProficiency: ArmorType[];
  weaponProficiency: WeaponType[];
  specializations: [Specialization, Specialization, Specialization];
  baseStats: Record<PrimaryStat, number>;
  statGrowthPerLevel: Record<PrimaryStat, number>;
}

export enum ArmorType {
  Cloth = 'cloth',
  Leather = 'leather',
  Mail = 'mail',
  Plate = 'plate',
}

export enum WeaponType {
  Sword = 'sword',
  Axe = 'axe',
  Mace = 'mace',
  Dagger = 'dagger',
  Staff = 'staff',
  Bow = 'bow',
  Wand = 'wand',
  Shield = 'shield',
  Fist = 'fist',
  Polearm = 'polearm',
  TwoHandSword = 'two-hand-sword',
  TwoHandAxe = 'two-hand-axe',
  TwoHandMace = 'two-hand-mace',
}

export interface ICharacterCreationParams {
  name: string;
  race: Race;
  class: CharacterClass;
  bonusStatAllocation: Record<PrimaryStat, number>; // Must sum to 10
}
```

### 7.2 Item Interfaces

```typescript
// src/shared/types/item.ts

export interface IItemTemplate {
  id: string;
  name: string;
  slot: GearSlot;
  quality: ItemQuality;
  /** Base item level. Actual instances may vary slightly. */
  baseItemLevel: number;
  /** Required character level to equip. */
  requiredLevel: number;
  /** Required class, or null for any. */
  requiredClass: CharacterClass | null;
  /** Armor type (for armor slot items). */
  armorType: ArmorType | null;
  /** Weapon type (for weapon slot items). */
  weaponType: WeaponType | null;
  /** Weapon damage range (for weapons only). */
  weaponDamage: { min: number; max: number } | null;
  /** Weapon speed in seconds (for weapons only). */
  weaponSpeed: number | null;
  /** Base stat ranges. Actual values rolled within these ranges. */
  statRanges: IStatRange[];
  /** Set membership. */
  setId: string | null;
  /** Unique equip effect (trinkets, legendary). */
  uniqueEffect: IUniqueEffect | null;
  /** Icon asset identifier. */
  icon: string;
  /** Flavor text. */
  flavorText: string;
  /** Vendor sell price in copper. */
  vendorPrice: number;
}

export interface IStatRange {
  stat: PrimaryStat | SecondaryStat;
  min: number;
  max: number;
}

export interface IItem {
  instanceId: string;
  templateId: string;
  name: string;
  slot: GearSlot;
  quality: ItemQuality;
  itemLevel: number;
  requiredLevel: number;
  requiredClass: CharacterClass | null;
  armorType: ArmorType | null;
  weaponType: WeaponType | null;
  weaponDamage: { min: number; max: number } | null;
  weaponSpeed: number | null;
  stats: Partial<Record<PrimaryStat | SecondaryStat, number>>;
  setId: string | null;
  uniqueEffect: IUniqueEffect | null;
  icon: string;
  vendorPrice: number;
}

export interface ISetBonus {
  setId: string;
  setName: string;
  pieces: string[]; // Item template IDs in the set
  bonuses: ISetBonusTier[];
}

export interface ISetBonusTier {
  requiredPieces: number; // 2, 4, or 6
  effects: IUniqueEffect[];
  description: string;
}

export type IUniqueEffect =
  | { type: 'stat_bonus'; stat: PrimaryStat | SecondaryStat; value: number }
  | { type: 'damage_proc'; chance: number; damage: number; damageType: 'physical' | 'spell' }
  | { type: 'healing_proc'; chance: number; healAmount: number }
  | { type: 'resource_restore'; chance: number; resource: ResourceType; amount: number }
  | { type: 'cooldown_reduction'; abilityId: string; reductionMs: number }
  | { type: 'dot_on_hit'; chance: number; dotDamage: number; durationMs: number }
  | { type: 'absorb_shield'; chance: number; absorbAmount: number; durationMs: number };
```

### 7.3 Talent Interfaces

```typescript
// src/shared/types/talent.ts

export interface ITalentTree {
  id: string;
  classId: CharacterClass;
  specialization: Specialization;
  name: string;
  icon: string;
  description: string;
  nodes: ITalentNode[];
}

export interface ITalentNode {
  id: string;
  treeId: string;
  name: string;
  icon: string;
  description: string;
  /** Grid position within the tree (row 0 = top, col for horizontal). */
  row: number;
  col: number;
  /** Tier (1-5). Determines the points-spent-in-tree prerequisite. */
  tier: number;
  /** Maximum points investable (1-5 typically). */
  maxPoints: number;
  /** Points required in this tree before this node is accessible. */
  requiredTreePoints: number;
  /** Other node IDs that must be maxed before this node unlocks. */
  prerequisiteNodeIds: string[];
  /** Effect applied per point invested. */
  effectPerPoint: ITalentEffect;
  /** Description template with {value} placeholder for scaling. */
  descriptionTemplate: string;
}

export type ITalentEffect =
  | { type: 'stat_bonus'; stat: PrimaryStat | SecondaryStat; valuePerPoint: number }
  | { type: 'stat_percent'; stat: PrimaryStat | SecondaryStat; percentPerPoint: number }
  | { type: 'ability_damage_bonus'; abilityId: string; percentPerPoint: number }
  | { type: 'crit_damage_bonus'; percentPerPoint: number }
  | { type: 'dot_on_crit'; dotDamagePercent: number; durationMs: number }
  | { type: 'resource_cost_reduction'; percentPerPoint: number }
  | { type: 'cooldown_reduction'; abilityId: string; msPerPoint: number }
  | { type: 'unlock_ability'; abilityId: string } // For tier-5 capstones
  | { type: 'proc_chance'; procId: string; chancePerPoint: number }
  | { type: 'damage_reduction'; percentPerPoint: number }
  | { type: 'healing_bonus'; percentPerPoint: number }
  | { type: 'mana_efficiency'; percentPerPoint: number };
```

### 7.4 Game State Interface (Internal Engine State)

```typescript
// src/engine/state/game-state.ts (NOT in shared -- internal to engine)

export interface GameState {
  character: CharacterState;
  combat: CombatState;
  quests: QuestState;
  inventory: InventoryState;
  currentZone: ZoneState;
  currencies: CurrencyState;
  dungeons: DungeonState;
  rng: SeededRandom;
  config: BalanceConfig;
  tickNumber: number;
  gameTimeMs: number;
}

export interface CharacterState {
  id: string;
  name: string;
  race: Race;
  class: CharacterClass;
  level: number;
  currentXp: number;
  baseStats: Record<PrimaryStat, number>;
  bonusStatAllocation: Record<PrimaryStat, number>;
  computedStats: ComputedStats;
  health: { current: number; max: number };
  resource: { current: number; max: number; type: ResourceType };
  equipment: Partial<Record<GearSlot, IItem>>;
  talents: Record<string, number>;  // nodeId -> points
  abilityRanks: Record<string, number>;
  abilityPriority: AbilityPriorityEntry[];
  activeBuffs: ActiveBuff[];
  respecCount: number;
}

export interface CombatState {
  inCombat: boolean;
  currentEnemy: EnemyInstance | null;
  autoAttackTimer: number;        // ms until next auto-attack
  globalCooldownTimer: number;    // ms remaining on GCD
  abilityCooldowns: Map<string, number>; // abilityId -> ms remaining
  activeDoTs: ActiveDoT[];
  activeHoTs: ActiveHoT[];
  combatLog: CombatLogEntry[];    // Ring buffer, max 200 entries
  sessionStats: {
    totalDamageDealt: number;
    totalHealingDone: number;
    totalDamageTaken: number;
    killCount: number;
    sessionStartTime: number;
  };
}

export interface EnemyInstance {
  templateId: string;
  name: string;
  level: number;
  health: { current: number; max: number };
  stats: Record<PrimaryStat, number>;
  armor: number;
  resistance: number;
  abilities: string[];
  lootTableId: string;
  xpReward: number;
  goldReward: number;
  isElite: boolean;
  isRare: boolean;
}
```

### 7.5 Combat Interfaces

```typescript
// src/shared/types/combat.ts

export interface ICombatResult {
  victory: boolean;
  xpGained: number;
  goldGained: number;
  lootDropped: IItem[];
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  durationMs: number;
  killCount: number;
}

export interface DamageResult {
  amount: number;
  type: 'physical' | 'spell' | 'healing' | 'miss';
  isCrit: boolean;
}

export interface ActiveDoT {
  id: string;
  sourceAbilityId: string;
  damagePerTick: number;
  tickIntervalMs: number;
  remainingMs: number;
  nextTickMs: number;
  damageType: 'physical' | 'spell';
}

export interface ActiveHoT {
  id: string;
  sourceAbilityId: string;
  healPerTick: number;
  tickIntervalMs: number;
  remainingMs: number;
  nextTickMs: number;
}

export interface ActiveBuff {
  id: string;
  name: string;
  icon: string;
  effects: IUniqueEffect[];
  remainingMs: number;
  durationMs: number;
}

export interface IAbilityDefinition {
  id: string;
  name: string;
  classId: CharacterClass;
  type: AbilityType;
  /** Level at which this ability becomes available. */
  learnedAtLevel: number;
  /** Whether this is a talent-granted ability. */
  talentGranted: boolean;
  /** Ranks available (higher rank = more damage, lower cost). */
  ranks: IAbilityRank[];
  /** Resource type consumed. */
  resourceType: ResourceType;
  /** Base cooldown in ms (0 for no cooldown beyond GCD). */
  baseCooldownMs: number;
  /** Whether this ability triggers the GCD. */
  triggersGcd: boolean;
  /** Cast time in ms (0 for instant). */
  baseCastTimeMs: number;
  icon: string;
  description: string;
}

export interface IAbilityRank {
  rank: number;
  /** Gold cost to train this rank. */
  trainingCost: number;
  /** Required character level for this rank. */
  requiredLevel: number;
  /** Base damage/heal amount for this rank. */
  basePower: number;
  /** Resource cost for this rank. */
  resourceCost: number;
  /** For DoT/HoT: tick interval in ms. */
  tickIntervalMs: number | null;
  /** For DoT/HoT: total duration in ms. */
  durationMs: number | null;
  /** For buffs/debuffs: duration in ms. */
  effectDurationMs: number | null;
}
```

### 7.6 Zone, Quest, and Dungeon Interfaces

```typescript
// src/shared/types/world.ts

export interface IZoneDefinition {
  id: string;
  name: string;
  description: string;
  levelRange: { min: number; max: number };
  /** Monster templates that spawn in this zone. */
  monsters: IMonsterTemplate[];
  /** Quest IDs available in this zone. */
  questIds: string[];
  /** Dungeon IDs accessible from this zone. */
  dungeonIds: string[];
  /** Faction associated with this zone (for rep gains). */
  factionId: string | null;
  /** Background art asset path. */
  backgroundArt: string;
  /** Music track identifier. */
  musicTrack: string;
}

export interface IMonsterTemplate {
  id: string;
  name: string;
  level: number;
  baseHealth: number;
  stats: Partial<Record<PrimaryStat, number>>;
  armor: number;
  resistance: number;
  abilities: string[];
  lootTableId: string;
  baseXpReward: number;
  baseGoldReward: number;
  isElite: boolean;
  isRare: boolean;
  /** Probability weight for spawn selection (higher = more common). */
  spawnWeight: number;
}

export interface IQuestDefinition {
  id: string;
  name: string;
  description: string;
  zoneId: string;
  type: QuestType;
  requiredLevel: number;
  /** Previous quest that must be completed. Null if standalone. */
  prerequisiteQuestId: string | null;
  objectives: IQuestObjective[];
  rewards: IQuestReward;
  /** Estimated time to complete in seconds (for offline simulation). */
  estimatedDurationSeconds: number;
}

export interface IQuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'interact' | 'dungeon_clear';
  targetId: string;     // Monster ID, item ID, or dungeon ID
  requiredCount: number;
}

export interface IQuestReward {
  xp: number;
  gold: number;
  items: IItemRewardChoice[];
  reputation: { factionId: string; amount: number } | null;
}

export interface IItemRewardChoice {
  /** Player picks one item from the list. Auto-mode picks best for spec. */
  options: string[]; // Item template IDs
}

export interface IDungeonDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: DungeonDifficulty;
  requiredLevel: number;
  /** Minimum average iLevel recommended. */
  recommendedILevel: number;
  bosses: IBossDefinition[];
  /** Estimated clear time in seconds. */
  estimatedClearTimeSeconds: number;
  /** Lockout type. */
  lockoutType: 'daily' | 'weekly' | 'none';
  /** Reputation awarded on completion. */
  reputationReward: { factionId: string; amount: number } | null;
  /** Currency awarded on completion. */
  currencyReward: {
    justicePoints: number;
    valorPoints: number;
  };
}

export interface IBossDefinition {
  id: string;
  name: string;
  health: number;
  stats: Partial<Record<PrimaryStat, number>>;
  armor: number;
  resistance: number;
  abilities: IBossMechanic[];
  lootTableId: string;
  /** Number of items that drop from this boss. */
  lootCount: number;
}

export interface IBossMechanic {
  id: string;
  name: string;
  description: string;
  /** How this mechanic affects success chance calculation. */
  difficultyWeight: number;
  /** Stat check: which stat helps counter this mechanic. */
  counterStat: PrimaryStat | SecondaryStat | null;
}
```

---

## 8. Performance Considerations

### 8.1 Worker Thread Strategy

Phase 1 uses a single Engine Worker thread. This is sufficient because:

- There is only one active character simulation at a time.
- The tick rate is 4/sec, giving 250ms per tick -- far more than the ~1-2ms a tick actually needs.
- Offline calculation is the heaviest operation (up to 2 seconds) and runs in the same worker since it pauses the game loop during calculation.

If profiling reveals performance issues in Phase 2+ (multiple dungeon simulations, crafting queues), we will add a second worker as a computation pool. The architecture supports this because the MessagePort pattern allows N ports.

**Thread allocation:**

| Thread | Role | CPU Budget |
|---|---|---|
| Main (Electron) | Window management, file I/O, IPC relay | < 5% idle, spike on save |
| Renderer | React rendering, DOM updates | < 30% during active UI |
| Engine Worker | Game simulation, all formulas | < 10% active, < 2% idle tick |

### 8.2 Memory Budget

**Target: under 200MB total for typical gameplay.**

| Component | Budget | Notes |
|---|---|---|
| Electron shell overhead | ~80MB | Chromium + Node.js baseline |
| React DOM + component tree | ~30MB | Modest UI complexity |
| Game data (JSON, parsed) | ~10MB | All item templates, talents, zones |
| Game state (live) | ~5MB | One character, one combat, inventory |
| Combat log ring buffer | ~2MB | 200 entries max |
| Asset cache (icons, sprites) | ~50MB | Lazy loaded, LRU eviction |
| Save file (uncompressed) | ~1MB | Generous estimate |
| **Total** | **~178MB** | Under 200MB budget |

### 8.3 Snapshot Transfer Optimization

State snapshots are sent from the engine worker to the renderer via `postMessage`. The structured clone algorithm copies the data. To minimize copy overhead:

1. **Throttle snapshots to 1/sec** (every 4th tick). Discrete events (loot drops, level-ups) are sent immediately but are small.
2. **Pre-compute derived values** in the engine (DPS averages, XP percentages) rather than making the renderer calculate them.
3. **Limit combat log** to last 50 entries in the snapshot (the engine keeps 200 internally).
4. **Omit unchanged sections** in future optimization: diff-based snapshots. Not needed in Phase 1.

### 8.4 Virtualized Lists

The following UI lists require virtualization (only render visible rows) because they can grow large:

- **Combat log**: Up to 50 visible entries, scrollable.
- **Inventory grid**: Up to 120 slots (4 bags of 30).
- **Quest journal**: Up to 25 active quests + completed history.
- **Achievement list**: Hundreds of entries (Phase 3, but architect for it now).

Use `@tanstack/react-virtual` for virtualization.

### 8.5 Asset Lazy Loading

- **Phase 1 assets** (icons for ~200 items, 27 talent trees, zone backgrounds): Small enough to bundle. No lazy loading needed yet.
- **Phase 2+ assets** (transmog library, achievement icons, all dungeon art): Lazy load by screen. When the player opens the Achievements tab, load those assets on demand.
- **Sprite sheets**: Combine item icons into sprite sheets (16x16 or 32x32 grids) to reduce HTTP-style overhead even in Electron file loading.

---

## 9. Testing Strategy

### 9.1 Unit Test Patterns

All pure game logic functions are unit tested. Tests use deterministic seeded RNG so results are reproducible.

```typescript
// tests/unit/combat/formulas.test.ts (example structure)

import { describe, it, expect } from 'vitest';
import { calculatePhysicalDamage } from '@engine/combat/formulas';
import { SeededRandom } from '@shared/utils/rng';

describe('calculatePhysicalDamage', () => {
  it('calculates base physical damage correctly', () => {
    const rng = new SeededRandom(12345);
    const result = calculatePhysicalDamage(
      /* weaponMin */ 100,
      /* weaponMax */ 200,
      /* strMod */ 50,
      /* critChance */ 0, // No crit for this test
      /* critMult */ 1.5,
      /* armorReduction */ 0.2,
      /* hitChance */ 1.0, // Guaranteed hit
      rng,
    );
    expect(result.type).toBe('physical');
    expect(result.isCrit).toBe(false);
    // Base = rng.nextInRange(100, 200) + 50, then * 0.8 (armor)
    expect(result.amount).toBeGreaterThan(0);
  });

  it('returns miss when hit check fails', () => {
    const rng = new SeededRandom(99999);
    const result = calculatePhysicalDamage(100, 200, 50, 0, 1.5, 0.2, 0.0, rng);
    expect(result.type).toBe('miss');
    expect(result.amount).toBe(0);
  });

  it('applies crit multiplier correctly', () => {
    // Use a seed that produces a "hit" roll and a "crit" roll
    const rng = new SeededRandom(42);
    const result = calculatePhysicalDamage(
      100, 100, // Fixed weapon damage for determinism
      0,        // No STR mod
      1.0,      // 100% crit chance
      1.5,      // 150% crit multiplier
      0.0,      // No armor
      1.0,      // Guaranteed hit
      rng,
    );
    expect(result.isCrit).toBe(true);
    expect(result.amount).toBe(250); // 100 * (1 + 1.5) = 250
  });

  it('never returns less than 1 damage on hit', () => {
    const rng = new SeededRandom(1);
    const result = calculatePhysicalDamage(1, 1, 0, 0, 1.5, 0.99, 1.0, rng);
    expect(result.amount).toBeGreaterThanOrEqual(1);
  });
});
```

### 9.2 Seeded Random Number Generator

Deterministic RNG is critical for reproducible tests and for offline simulation consistency.

```typescript
// src/shared/utils/rng.ts

/**
 * Mulberry32 PRNG -- fast, small, deterministic.
 * Produces uniform floats in [0, 1).
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive. */
  nextInRange(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a copy of this RNG at its current state (for forking). */
  fork(): SeededRandom {
    const copy = new SeededRandom(0);
    copy.state = this.state;
    return copy;
  }
}
```

### 9.3 Integration Test Approach

Integration tests verify that multiple systems interact correctly. These tests create a real `GameState`, run multiple systems for several ticks, and assert the combined outcome.

```typescript
// tests/integration/equip-stat-recalc.test.ts (example)

describe('Equipment -> Stat Recalculation -> Combat DPS', () => {
  it('equipping a weapon increases damage output', () => {
    const state = createTestGameState({ level: 10, class: CharacterClass.Blademaster });

    // Record baseline DPS
    const baselineDps = simulateCombatTicks(state, 100);

    // Equip a weapon upgrade
    const sword = createTestItem({
      slot: GearSlot.MainHand,
      weaponDamage: { min: 50, max: 80 },
      stats: { [PrimaryStat.Strength]: 10 },
    });
    equipItem(state, sword);

    // Verify stats recalculated
    expect(state.character.computedStats.primary[PrimaryStat.Strength])
      .toBeGreaterThan(10); // base + bonus + gear

    // Verify DPS increased
    const upgradedDps = simulateCombatTicks(state, 100);
    expect(upgradedDps).toBeGreaterThan(baselineDps);
  });
});
```

### 9.4 Balance Simulation Tests

These are longer-running tests that verify pacing targets from the GDD. They run the offline calculator or simulate many ticks to measure progression rates.

```typescript
// tests/balance/leveling-pacing.test.ts

describe('Leveling Pacing', () => {
  it('reaches level 10 within target hours', () => {
    const config = loadBalanceConfig();
    const state = createTestGameState({ level: 1 });

    // Simulate hours of play
    const result = simulatePlaytime(state, config, {
      hours: config.pacing.targetHoursLevel1to10,
    });

    expect(result.finalLevel).toBeGreaterThanOrEqual(10);
  });

  it('reaches level 60 within 25 hours of total play', () => {
    const config = loadBalanceConfig();
    const state = createTestGameState({ level: 1 });

    const result = simulatePlaytime(state, config, { hours: 25 });

    // Should be at or near 60
    expect(result.finalLevel).toBeGreaterThanOrEqual(55);
  });

  it('first ascension takes 25-40 hours', () => {
    const config = loadBalanceConfig();
    // This test simulates the full journey and measures total time
    const result = simulateFullProgression(config);

    expect(result.totalHours).toBeGreaterThanOrEqual(25);
    expect(result.totalHours).toBeLessThanOrEqual(40);
  });
});
```

### 9.5 Test Organization

```
tests/
├── setup.ts                          # Global test setup, helpers
├── helpers/
│   ├── test-state-factory.ts         # createTestGameState, createTestItem, etc.
│   ├── combat-simulator.ts           # simulateCombatTicks helper
│   └── progression-simulator.ts      # simulatePlaytime helper
├── unit/
│   ├── combat/
│   │   ├── formulas.test.ts
│   │   ├── ability-priority.test.ts
│   │   └── periodic-effects.test.ts
│   ├── gear/
│   │   ├── item-generation.test.ts
│   │   ├── stat-calculation.test.ts
│   │   └── set-bonuses.test.ts
│   ├── progression/
│   │   ├── xp-curve.test.ts
│   │   └── level-up.test.ts
│   ├── talents/
│   │   ├── talent-allocation.test.ts
│   │   └── talent-effects.test.ts
│   ├── offline/
│   │   ├── diminishing-returns.test.ts
│   │   └── offline-calculator.test.ts
│   └── save/
│       ├── save-io.test.ts
│       └── migrations.test.ts
├── integration/
│   ├── equip-stat-recalc.test.ts
│   ├── talent-combat-interaction.test.ts
│   ├── quest-completion-flow.test.ts
│   └── save-load-roundtrip.test.ts
└── balance/
    ├── leveling-pacing.test.ts
    ├── gear-progression.test.ts
    └── offline-returns.test.ts
```

---

## 10. Dependency Choices

### 10.1 Core Dependencies

| Package | Version | Purpose | Rationale |
|---|---|---|---|
| `electron` | ^34.x | Desktop app shell | Required platform. Latest stable. |
| `react` | ^19.x | UI framework | Industry standard, excellent DX, huge ecosystem |
| `react-dom` | ^19.x | React DOM renderer | Required by React |
| `typescript` | ^5.7 | Language | Strict mode, latest features |
| `vite` | ^6.x | Renderer bundler | Fast HMR, native ESM, excellent Electron integration |

### 10.2 Engine Dependencies

| Package | Version | Purpose | Rationale |
|---|---|---|---|
| (none) | -- | -- | The engine uses zero external dependencies. All game logic (RNG, formulas, state) is hand-written. This ensures no supply-chain risk for the core simulation and keeps the worker thread lean. |

### 10.3 Renderer Dependencies

| Package | Version | Purpose | Rationale |
|---|---|---|---|
| `@tanstack/react-virtual` | ^3.x | List virtualization | Best-in-class virtual scrolling for combat log, inventory |
| `react-dnd` | ^16.x | Drag and drop | Inventory item dragging to gear slots |
| `react-dnd-html5-backend` | ^16.x | DnD HTML5 backend | Standard backend for react-dnd |
| `clsx` | ^2.x | Class name utility | Clean conditional CSS class composition |

### 10.4 Main Process Dependencies

| Package | Version | Purpose | Rationale |
|---|---|---|---|
| `electron-store` | ^10.x | Window state persistence | Simple key-value store for non-game settings (window size, position) |
| `electron-updater` | ^6.x | Auto-updates | Built-in update mechanism for Electron apps |

### 10.5 Dev Dependencies

| Package | Version | Purpose | Rationale |
|---|---|---|---|
| `vitest` | ^3.x | Test runner | Fast, Vite-native, excellent TS support |
| `@vitest/coverage-v8` | ^3.x | Coverage reporting | V8-based coverage, fast |
| `playwright` | ^1.x | E2E testing | Future Phase 4 UI testing |
| `electron-builder` | ^25.x | Packaging/distribution | Standard Electron packaging tool |
| `eslint` | ^9.x | Linting | Code quality enforcement |
| `prettier` | ^3.x | Formatting | Consistent code style |
| `tsc-alias` | ^1.x | Path alias resolution | Resolves `@shared/` etc. in compiled output |
| `concurrently` | ^9.x | Script runner | Run multiple dev processes |
| `@types/react` | ^19.x | React type definitions | TypeScript support for React |
| `@types/react-dom` | ^19.x | ReactDOM type definitions | TypeScript support for ReactDOM |

### 10.6 Intentionally Excluded

| Package | Reason for exclusion |
|---|---|
| Redux / Zustand / MobX | Overkill. Game state lives in the engine worker; the renderer just displays snapshots. React Context + useReducer is sufficient. |
| Socket.io / WebSocket libs | No multiplayer. All communication is local IPC/MessagePort. |
| SQLite / better-sqlite3 | Save files are small enough for JSON + gzip. A database adds complexity without benefit for single-player saves under 5MB. |
| Lodash | Tree-shakeable but unnecessary. Native JS array/object methods suffice. TypeScript generics provide type safety that lodash cannot. |
| Moment / Day.js | Minimal date handling needed. Native `Date` and `Intl.DateTimeFormat` are sufficient. |
| Tailwind CSS | CSS Modules provide scoped styling with less configuration overhead. The UI has a custom fantasy theme that benefits from hand-written CSS rather than utility classes. |

---

## Appendix A: File Bootstrapping Order

When starting the engine for the first time (new game), initialization proceeds as follows:

```
1. Main process starts, creates BrowserWindow
2. Main process spawns Engine Worker
3. Main process creates MessageChannel, transfers ports
4. Renderer loads React app, receives MessagePort
5. Renderer sends INIT command to engine
6. Engine loads data/*.json files from disk
7. Engine validates data against TypeScript schemas
8. Engine creates empty GameState
9. Engine sends ENGINE_READY event
10. Renderer shows character creation screen
11. Player fills in creation form, submits
12. Renderer sends CREATE_CHARACTER command
13. Engine initializes character with race/class/stats
14. Engine starts game loop (first tick)
15. Engine begins sending STATE_SNAPSHOT events
16. Main process starts auto-save timer
```

## Appendix B: Save/Load Sequence

```
SAVE (auto or manual):
1. Main sends SAVE_AUTO_STARTED to renderer
2. Renderer sends GET_SAVE_PAYLOAD to engine
3. Engine pauses game loop
4. Engine serializes GameState into ISaveData
5. Engine sends SAVE_PAYLOAD_READY with ISaveData to renderer
6. Engine resumes game loop
7. Renderer invokes SAVE_GAME on main with ISaveData
8. Main rotates backup files
9. Main writes compressed save to disk (atomic via .tmp)
10. Main sends SAVE_AUTO_COMPLETE to renderer

LOAD:
1. Renderer invokes LOAD_GAME on main with save file path
2. Main reads and decompresses save file
3. Main runs migration pipeline if version < current
4. Main returns ISaveData to renderer
5. Renderer sends LOAD_STATE to engine with ISaveData
6. Engine pauses game loop
7. Engine reconstructs GameState from ISaveData
8. Engine recalculates all computed stats (gear + talents + buffs)
9. Engine calculates offline progress since lastActiveTimestamp
10. Engine sends OFFLINE_RESULT event with summary
11. Engine resumes game loop
12. Renderer displays offline progress summary screen
```

## Appendix C: XP Curve Formula

The XP curve follows a polynomial growth pattern tuned to match GDD pacing targets:

```typescript
// src/shared/utils/xp-curve.ts

/**
 * Generate the XP-to-next-level table for levels 1-59.
 * Formula: base * (level ^ exponent) * levelRangeMultiplier
 *
 * The level range multiplier creates the pacing tiers:
 *   1-10:  rapid (low multiplier)
 *   11-30: moderate
 *   31-50: standard
 *   51-59: steep (gear becomes more important than leveling)
 */
export function generateXpCurve(config: {
  base: number;
  exponent: number;
  rangeMultipliers: Record<string, number>;
}): number[] {
  const curve: number[] = [];
  for (let level = 1; level < 60; level++) {
    const rangeKey = getRange(level);
    const multiplier = config.rangeMultipliers[rangeKey] ?? 1;
    const xp = Math.round(config.base * Math.pow(level, config.exponent) * multiplier);
    curve.push(xp);
  }
  return curve;
}
```

## Appendix D: Stat Computation Pipeline

When any stat-affecting change occurs (equip/unequip gear, allocate talent, buff applied/expired), the engine recalculates all stats in this order:

```
1. Base stats = class base + (level * class growth per level)
2. + Race stat bonuses
3. + Bonus stat allocation (10 points from creation)
4. + Gear stats (sum all equipped item stats)
5. + Talent flat bonuses (stat_bonus type talents)
6. = Flat total
7. * Talent percent bonuses (stat_percent type talents)
8. * Buff percent bonuses
9. * Racial percent bonuses
10. = Final primary stats
11. Derive secondary stats from primary:
    - Crit% = AGI / agiPerCritPercent
    - Haste% = hasteRating / hasteRatingPerPercent
    - Hit% = hitRating / hitRatingPerPercent
    - HP = STA * healthPerStamina
    - Mana = INT * manaPerIntellect
    - Attack Power = STR * attackPowerPerStrength
    - Spell Power = INT * spellPowerPerIntellect
    - Mana Regen/5s = SPI * manaRegenPerSpirit
12. + Gear secondary stats (direct additions)
13. + Talent secondary stat bonuses
14. + Set bonuses (check equipped set piece counts)
15. = Final computed stats
```

This pipeline is implemented as a pure function that takes all inputs and returns a `ComputedStats` object, making it easy to test in isolation.
