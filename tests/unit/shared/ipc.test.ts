import { describe, it, expect } from 'vitest';
import {
  MainInvokeChannel,
  MainSendChannel,
  EngineCommandType,
  EngineEventType,
} from '@shared/types/ipc';
import type { EngineCommand, EngineEvent } from '@shared/types/ipc';

// ---- MainInvokeChannel ----

describe('MainInvokeChannel enum', () => {
  it('should have exactly 9 invoke channels', () => {
    expect(Object.values(MainInvokeChannel)).toHaveLength(9);
  });

  it('should contain save-related channels', () => {
    expect(MainInvokeChannel.SAVE_GAME).toBe('save:save-game');
    expect(MainInvokeChannel.LOAD_GAME).toBe('save:load-game');
    expect(MainInvokeChannel.EXPORT_SAVE).toBe('save:export');
    expect(MainInvokeChannel.IMPORT_SAVE).toBe('save:import');
    expect(MainInvokeChannel.LIST_SAVES).toBe('save:list');
    expect(MainInvokeChannel.DELETE_SAVE).toBe('save:delete');
  });

  it('should contain app-related channels', () => {
    expect(MainInvokeChannel.APP_GET_VERSION).toBe('app:get-version');
    expect(MainInvokeChannel.APP_GET_PLATFORM).toBe('app:get-platform');
    expect(MainInvokeChannel.APP_GET_USER_DATA_PATH).toBe('app:get-user-data-path');
  });
});

// ---- MainSendChannel ----

describe('MainSendChannel enum', () => {
  it('should have exactly 4 send channels', () => {
    expect(Object.values(MainSendChannel)).toHaveLength(4);
  });

  it('should contain auto-save channels', () => {
    expect(MainSendChannel.SAVE_AUTO_STARTED).toBe('save:auto-started');
    expect(MainSendChannel.SAVE_AUTO_COMPLETE).toBe('save:auto-complete');
    expect(MainSendChannel.SAVE_AUTO_FAILED).toBe('save:auto-failed');
  });

  it('should contain app lifecycle channels', () => {
    expect(MainSendChannel.APP_BEFORE_QUIT).toBe('app:before-quit');
  });
});

// ---- EngineCommandType ----

describe('EngineCommandType enum', () => {
  it('should have exactly 19 command types', () => {
    expect(Object.values(EngineCommandType)).toHaveLength(19);
  });

  it('should contain engine lifecycle commands', () => {
    expect(EngineCommandType.INIT).toBe('engine:init');
    expect(EngineCommandType.PAUSE).toBe('engine:pause');
    expect(EngineCommandType.RESUME).toBe('engine:resume');
    expect(EngineCommandType.SHUTDOWN).toBe('engine:shutdown');
    expect(EngineCommandType.SET_TICK_RATE).toBe('engine:set-tick-rate');
    expect(EngineCommandType.LOAD_STATE).toBe('engine:load-state');
    expect(EngineCommandType.GET_SAVE_PAYLOAD).toBe('engine:get-save-payload');
    expect(EngineCommandType.CALCULATE_OFFLINE).toBe('engine:calculate-offline');
  });

  it('should contain character management commands', () => {
    expect(EngineCommandType.CREATE_CHARACTER).toBe('char:create');
    expect(EngineCommandType.DELETE_CHARACTER).toBe('char:delete');
    expect(EngineCommandType.SELECT_CHARACTER).toBe('char:select');
    expect(EngineCommandType.EQUIP_ITEM).toBe('char:equip-item');
    expect(EngineCommandType.UNEQUIP_ITEM).toBe('char:unequip-item');
    expect(EngineCommandType.ALLOCATE_TALENT).toBe('char:allocate-talent');
    expect(EngineCommandType.RESET_TALENTS).toBe('char:reset-talents');
    expect(EngineCommandType.SET_ABILITY_PRIORITY).toBe('char:set-ability-priority');
    expect(EngineCommandType.SELL_ITEM).toBe('char:sell-item');
    expect(EngineCommandType.TRAIN_ABILITY).toBe('char:train-ability');
  });

  it('should contain progression commands', () => {
    expect(EngineCommandType.SELECT_ZONE).toBe('prog:select-zone');
  });
});

// ---- EngineEventType ----

describe('EngineEventType enum', () => {
  it('should have exactly 13 event types', () => {
    expect(Object.values(EngineEventType)).toHaveLength(13);
  });

  it('should contain state and engine events', () => {
    expect(EngineEventType.STATE_SNAPSHOT).toBe('state:snapshot');
    expect(EngineEventType.ENGINE_READY).toBe('engine:ready');
    expect(EngineEventType.ENGINE_ERROR).toBe('engine:error');
    expect(EngineEventType.SAVE_PAYLOAD_READY).toBe('engine:save-payload-ready');
    expect(EngineEventType.OFFLINE_RESULT).toBe('engine:offline-result');
  });

  it('should contain gameplay events', () => {
    expect(EngineEventType.COMBAT_LOG_ENTRY).toBe('event:combat-log');
    expect(EngineEventType.LEVEL_UP).toBe('event:level-up');
    expect(EngineEventType.LOOT_DROPPED).toBe('event:loot-dropped');
    expect(EngineEventType.QUEST_COMPLETE).toBe('event:quest-complete');
    expect(EngineEventType.QUEST_PROGRESS).toBe('event:quest-progress');
    expect(EngineEventType.ZONE_CHANGED).toBe('event:zone-changed');
    expect(EngineEventType.ABILITY_UNLOCKED).toBe('event:ability-unlocked');
    expect(EngineEventType.CHAIN_COMPLETED).toBe('event:chain-completed');
  });
});

// ---- Message Envelopes ----

describe('EngineCommand interface', () => {
  it('should accept a typed command message', () => {
    const command: EngineCommand<{ name: string }> = {
      id: 'cmd-001',
      type: EngineCommandType.CREATE_CHARACTER,
      payload: { name: 'TestHero' },
      timestamp: Date.now(),
    };

    expect(command.id).toBe('cmd-001');
    expect(command.type).toBe(EngineCommandType.CREATE_CHARACTER);
    expect(command.payload.name).toBe('TestHero');
    expect(command.timestamp).toBeGreaterThan(0);
  });

  it('should accept unknown payload by default', () => {
    const command: EngineCommand = {
      id: 'cmd-002',
      type: EngineCommandType.PAUSE,
      payload: undefined,
      timestamp: Date.now(),
    };

    expect(command.type).toBe(EngineCommandType.PAUSE);
  });
});

describe('EngineEvent interface', () => {
  it('should accept a typed event message', () => {
    const event: EngineEvent<{ level: number }> = {
      id: 'evt-001',
      type: EngineEventType.LEVEL_UP,
      payload: { level: 10 },
      timestamp: Date.now(),
      tickNumber: 42,
    };

    expect(event.id).toBe('evt-001');
    expect(event.type).toBe(EngineEventType.LEVEL_UP);
    expect(event.payload.level).toBe(10);
    expect(event.tickNumber).toBe(42);
  });

  it('should include tickNumber for engine synchronization', () => {
    const event: EngineEvent<null> = {
      id: 'evt-002',
      type: EngineEventType.ENGINE_READY,
      payload: null,
      timestamp: Date.now(),
      tickNumber: 0,
    };

    expect(event.tickNumber).toBe(0);
  });
});
