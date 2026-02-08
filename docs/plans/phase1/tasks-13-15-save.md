# Phase 1 Implementation Plan — Save System (Tasks 13-15)

> Part of the [Phase 1 Implementation Plan](phase1-index.md) | **Status:** Pending

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

