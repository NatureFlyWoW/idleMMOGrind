import { parentPort, type MessagePort } from 'worker_threads';
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
