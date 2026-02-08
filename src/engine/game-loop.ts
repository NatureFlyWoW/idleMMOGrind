import type { IGameSystem } from './systems/game-system';
import { EventBus } from './events/event-bus';

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
    this.eventBus.drain();

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
