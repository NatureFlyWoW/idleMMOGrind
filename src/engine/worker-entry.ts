import { parentPort, type MessagePort } from 'worker_threads';
import { GameLoop, DEFAULT_LOOP_CONFIG } from './game-loop';
import { EngineCommandType, EngineEventType } from '@shared/types/ipc';
import type { EngineCommand, EngineEvent } from '@shared/types/ipc';
import { ZoneEventManager } from '@engine/zones/zone-event-manager';
import { QuestChainManager } from '@engine/zones/quest-chain-manager';
import { RareSpawnManager } from '@engine/zones/rare-spawn-manager';
import { EliteAreaManager } from '@engine/zones/elite-area-manager';
import type { IZoneEvent, IQuestChain, IRareSpawn, IEliteArea } from '@shared/types/zone-expansion';
import type { IBalanceConfig } from '@shared/types/balance';
import type { IGameSystem } from '@engine/systems/game-system';
import { SeededRandom } from '@shared/utils/rng';
import { ProfessionManager } from './professions/profession-manager';
import type { IProfessionDefinition, IMaterial, IRecipe } from '@shared/types/profession';

import eventsData from '@data/zones/events.json';

let gameLoop: GameLoop | null = null;
let professionManager: ProfessionManager | null = null;
let enginePort: MessagePort | null = null;

// Zone system instances -- initialized lazily when the game loop starts.
let zoneEventManager: ZoneEventManager | null = null;
let questChainManager: QuestChainManager | null = null;
let rareSpawnManager: RareSpawnManager | null = null;
let eliteAreaManager: EliteAreaManager | null = null;

// Listen for the MessagePort from the main process
parentPort?.on('message', (msg: { type: string; port?: MessagePort }) => {
  if (msg.type === 'port' && msg.port) {
    enginePort = msg.port;
    setupEnginePort(enginePort);
  }
});

/**
 * Wraps ZoneEventManager as an IGameSystem so it can be registered
 * with the game loop. Provides the SeededRandom and timestamp that
 * ZoneEventManager.update() requires beyond the IGameSystem contract.
 */
function createZoneEventSystemAdapter(
  manager: ZoneEventManager,
  rng: SeededRandom,
): IGameSystem {
  return {
    update(_state: unknown, deltaMs: number): void {
      manager.update(rng, Date.now(), deltaMs);
    },
  };
}

/**
 * Initialize zone subsystems and register them with the game loop.
 *
 * QuestChainManager, RareSpawnManager, and EliteAreaManager are services
 * queried by other systems -- they do not need per-tick updates via the
 * game loop. ZoneEventManager does need per-tick updates and is wrapped
 * in an IGameSystem adapter for registration.
 */
function initializeZoneSystems(loop: GameLoop): void {
  const eventBus = loop.getEventBus();

  // Default balance values for event manager configuration.
  // These will be overridden when a full IBalanceConfig is loaded via LOAD_STATE.
  const defaultCheckIntervalMs = 60_000;
  const defaultEventBaseChance = 0.15;

  // Instantiate zone services
  questChainManager = new QuestChainManager(eventBus);
  rareSpawnManager = new RareSpawnManager(eventBus);
  eliteAreaManager = new EliteAreaManager(eventBus, questChainManager);

  // Instantiate zone event manager and load event definitions
  zoneEventManager = new ZoneEventManager(
    eventBus,
    defaultCheckIntervalMs,
    defaultEventBaseChance,
  );
  zoneEventManager.loadZoneEvents(eventsData as IZoneEvent[]);

  // Register the event manager with the game loop via adapter
  const rng = new SeededRandom(Date.now());
  const adapter = createZoneEventSystemAdapter(zoneEventManager, rng);
  loop.registerSystem(adapter);
}

function setupEnginePort(port: MessagePort): void {
  gameLoop = new GameLoop(DEFAULT_LOOP_CONFIG);

  // Initialize zone systems before starting the loop
  initializeZoneSystems(gameLoop);

  // Create ProfessionManager and register with the game loop.
  // Data loading is deferred until INIT command provides loaded game data.
  // For now, initialize with empty data; real data will be loaded from
  // the LOAD_STATE command or provided during character creation.

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

/**
 * Initialize the ProfessionManager with provided game data and register
 * it as a system with the GameLoop.
 */
function initProfessionManager(
  definitions: IProfessionDefinition[],
  materials: IMaterial[],
  recipes: IRecipe[],
  balanceConfig: IBalanceConfig['professions'],
  zoneLevel: number,
): void {
  professionManager = new ProfessionManager({
    definitions,
    materials,
    recipes,
    balanceConfig,
    zoneLevel,
  });
  gameLoop?.registerSystem(professionManager);
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

// Re-export for testing access
export { professionManager, initProfessionManager };
