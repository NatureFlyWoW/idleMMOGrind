import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop, DEFAULT_LOOP_CONFIG } from '@engine/game-loop';
import type { IGameSystem } from '@engine/systems/game-system';
import { EngineEventType } from '@shared/types/ipc';

function createMockSystem(): IGameSystem {
  return {
    update: vi.fn(),
  };
}

describe('GameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const loop = new GameLoop();
      expect(loop.isRunning()).toBe(false);
      expect(loop.getTickNumber()).toBe(0);
    });

    it('should accept custom config', () => {
      const config = { tickIntervalMs: 100, maxBatchTicks: 50 };
      const loop = new GameLoop(config);
      expect(loop.isRunning()).toBe(false);
    });
  });

  describe('DEFAULT_LOOP_CONFIG', () => {
    it('should have 250ms tick interval', () => {
      expect(DEFAULT_LOOP_CONFIG.tickIntervalMs).toBe(250);
    });

    it('should have maxBatchTicks of 100', () => {
      expect(DEFAULT_LOOP_CONFIG.maxBatchTicks).toBe(100);
    });
  });

  describe('registerSystem', () => {
    it('should register a system that gets called on tick', () => {
      const loop = new GameLoop();
      const system = createMockSystem();
      loop.registerSystem(system);

      loop.start();
      vi.advanceTimersByTime(250);

      expect(system.update).toHaveBeenCalledTimes(1);
      loop.destroy();
    });

    it('should call multiple systems in registration order', () => {
      const loop = new GameLoop();
      const callOrder: number[] = [];

      const system1: IGameSystem = {
        update: vi.fn(() => callOrder.push(1)),
      };
      const system2: IGameSystem = {
        update: vi.fn(() => callOrder.push(2)),
      };

      loop.registerSystem(system1);
      loop.registerSystem(system2);

      loop.start();
      vi.advanceTimersByTime(250);

      expect(callOrder).toEqual([1, 2]);
      loop.destroy();
    });
  });

  describe('start / pause', () => {
    it('should set isRunning to true when started', () => {
      const loop = new GameLoop();
      loop.start();
      expect(loop.isRunning()).toBe(true);
      loop.destroy();
    });

    it('should set isRunning to false when paused', () => {
      const loop = new GameLoop();
      loop.start();
      loop.pause();
      expect(loop.isRunning()).toBe(false);
    });

    it('should not create duplicate intervals when start is called twice', () => {
      const loop = new GameLoop();
      const system = createMockSystem();
      loop.registerSystem(system);

      loop.start();
      loop.start(); // Second call should be a no-op

      vi.advanceTimersByTime(250);
      // Should only tick once, not twice (no duplicate interval)
      expect(system.update).toHaveBeenCalledTimes(1);
      loop.destroy();
    });

    it('should stop ticking when paused', () => {
      const loop = new GameLoop();
      const system = createMockSystem();
      loop.registerSystem(system);

      loop.start();
      vi.advanceTimersByTime(250); // 1 tick
      loop.pause();
      vi.advanceTimersByTime(1000); // Should not tick further

      expect(system.update).toHaveBeenCalledTimes(1);
      loop.destroy();
    });

    it('should resume ticking after pause + start', () => {
      const loop = new GameLoop();
      const system = createMockSystem();
      loop.registerSystem(system);

      loop.start();
      vi.advanceTimersByTime(250); // 1 tick
      loop.pause();
      vi.advanceTimersByTime(500); // No ticks

      loop.start();
      vi.advanceTimersByTime(250); // 1 more tick

      expect(system.update).toHaveBeenCalledTimes(2);
      loop.destroy();
    });
  });

  describe('tick counting', () => {
    it('should increment tick number on each tick', () => {
      const loop = new GameLoop();
      loop.start();

      vi.advanceTimersByTime(250);
      expect(loop.getTickNumber()).toBe(1);

      vi.advanceTimersByTime(250);
      expect(loop.getTickNumber()).toBe(2);

      vi.advanceTimersByTime(250);
      expect(loop.getTickNumber()).toBe(3);

      loop.destroy();
    });

    it('should reach 4 ticks per second at 250ms interval', () => {
      const loop = new GameLoop();
      loop.start();

      vi.advanceTimersByTime(1000);
      expect(loop.getTickNumber()).toBe(4);

      loop.destroy();
    });

    it('should pass deltaMs to systems', () => {
      const loop = new GameLoop({ tickIntervalMs: 250, maxBatchTicks: 100 });
      const system = createMockSystem();
      loop.registerSystem(system);

      loop.start();
      vi.advanceTimersByTime(250);

      expect(system.update).toHaveBeenCalledWith({}, 250);
      loop.destroy();
    });
  });

  describe('snapshot callback', () => {
    it('should fire snapshot callback every 4th tick', () => {
      const loop = new GameLoop();
      const snapshotFn = vi.fn();
      loop.setSnapshotCallback(snapshotFn);
      loop.start();

      vi.advanceTimersByTime(250); // tick 1
      expect(snapshotFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250); // tick 2
      expect(snapshotFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250); // tick 3
      expect(snapshotFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250); // tick 4
      expect(snapshotFn).toHaveBeenCalledTimes(1);
      expect(snapshotFn).toHaveBeenCalledWith(4);

      loop.destroy();
    });

    it('should fire snapshot once per second at default rate', () => {
      const loop = new GameLoop();
      const snapshotFn = vi.fn();
      loop.setSnapshotCallback(snapshotFn);
      loop.start();

      vi.advanceTimersByTime(3000); // 12 ticks = 3 snapshots (at ticks 4, 8, 12)
      expect(snapshotFn).toHaveBeenCalledTimes(3);

      loop.destroy();
    });

    it('should not fire snapshot if no callback is set', () => {
      const loop = new GameLoop();
      loop.start();

      // Should not throw when no callback is set
      vi.advanceTimersByTime(1000);
      expect(loop.getTickNumber()).toBe(4);

      loop.destroy();
    });
  });

  describe('getEventBus', () => {
    it('should return an EventBus instance', () => {
      const loop = new GameLoop();
      const bus = loop.getEventBus();
      expect(bus).toBeDefined();
      expect(typeof bus.emit).toBe('function');
      expect(typeof bus.drain).toBe('function');
    });

    it('should drain events on each tick', () => {
      const loop = new GameLoop();
      const bus = loop.getEventBus();

      // Emit an event before starting
      bus.emit(EngineEventType.COMBAT_LOG_ENTRY, { test: true });

      expect(bus.pending).toBe(1);

      loop.start();
      vi.advanceTimersByTime(250); // 1 tick

      // Events should be drained after tick
      expect(bus.pending).toBe(0);

      loop.destroy();
    });
  });

  describe('destroy', () => {
    it('should stop the loop and clear systems', () => {
      const loop = new GameLoop();
      const system = createMockSystem();
      loop.registerSystem(system);

      loop.start();
      loop.destroy();

      expect(loop.isRunning()).toBe(false);

      vi.advanceTimersByTime(1000);
      // System should not be called after destroy
      expect(system.update).not.toHaveBeenCalled();
    });
  });
});
