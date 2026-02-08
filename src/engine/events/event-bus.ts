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
