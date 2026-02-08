import { parentPort, type MessagePort } from 'worker_threads';
import { GameLoop, DEFAULT_LOOP_CONFIG } from './game-loop';
import { EngineCommandType, EngineEventType } from '@shared/types/ipc';
import type { EngineCommand, EngineEvent } from '@shared/types/ipc';
import { ProfessionManager } from './professions/profession-manager';
import type { IProfessionDefinition, IMaterial, IRecipe } from '@shared/types/profession';
import type { IBalanceConfig } from '@shared/types/balance';

let gameLoop: GameLoop | null = null;
let professionManager: ProfessionManager | null = null;
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
