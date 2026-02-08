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
  CHAIN_COMPLETED = 'event:chain-completed',
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
