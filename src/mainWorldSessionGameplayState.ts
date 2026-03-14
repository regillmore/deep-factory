export interface WorldSessionGameplayState {
  peacefulModeEnabled: boolean;
}

export interface WorldSessionGameplayStateLoadResult {
  state: WorldSessionGameplayState;
  persistenceAvailable: boolean;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'deep-factory.worldSessionGameplayState.v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

export const createDefaultWorldSessionGameplayState = (): WorldSessionGameplayState => ({
  peacefulModeEnabled: false
});

export const cloneWorldSessionGameplayState = (
  state: WorldSessionGameplayState = createDefaultWorldSessionGameplayState()
): WorldSessionGameplayState => ({
  peacefulModeEnabled: state.peacefulModeEnabled
});

export const decodeWorldSessionGameplayState = (value: unknown): WorldSessionGameplayState => {
  if (!isRecord(value)) {
    throw new Error('gameplay state must be an object');
  }

  const nextState = createDefaultWorldSessionGameplayState();
  const peacefulModeEnabled = value.peacefulModeEnabled;
  if (peacefulModeEnabled !== undefined && !isBoolean(peacefulModeEnabled)) {
    throw new Error('gameplay state field "peacefulModeEnabled" must be boolean');
  }
  if (isBoolean(peacefulModeEnabled)) {
    nextState.peacefulModeEnabled = peacefulModeEnabled;
  }

  return nextState;
};

export const loadWorldSessionGameplayStateWithPersistenceAvailability = (
  storage: StorageLike | null | undefined,
  fallbackState: WorldSessionGameplayState
): WorldSessionGameplayStateLoadResult => {
  if (!storage) {
    return {
      state: cloneWorldSessionGameplayState(fallbackState),
      persistenceAvailable: false
    };
  }

  let rawState: string | null;
  try {
    rawState = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: cloneWorldSessionGameplayState(fallbackState),
      persistenceAvailable: false
    };
  }

  if (!rawState) {
    return {
      state: cloneWorldSessionGameplayState(fallbackState),
      persistenceAvailable: true
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawState);
  } catch {
    return {
      state: cloneWorldSessionGameplayState(fallbackState),
      persistenceAvailable: true
    };
  }

  try {
    return {
      state: decodeWorldSessionGameplayState(parsed),
      persistenceAvailable: true
    };
  } catch {
    return {
      state: cloneWorldSessionGameplayState(fallbackState),
      persistenceAvailable: true
    };
  }
};

export const loadWorldSessionGameplayState = (
  storage: StorageLike | null | undefined,
  fallbackState: WorldSessionGameplayState
): WorldSessionGameplayState =>
  loadWorldSessionGameplayStateWithPersistenceAvailability(storage, fallbackState).state;

export const saveWorldSessionGameplayState = (
  storage: StorageLike | null | undefined,
  state: WorldSessionGameplayState
): boolean => {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const WORLD_SESSION_GAMEPLAY_STATE_STORAGE_KEY = STORAGE_KEY;
