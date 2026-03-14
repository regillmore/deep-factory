import { describe, expect, it } from 'vitest';

import {
  cloneWorldSessionGameplayState,
  createDefaultWorldSessionGameplayState,
  decodeWorldSessionGameplayState,
  loadWorldSessionGameplayState,
  loadWorldSessionGameplayStateWithPersistenceAvailability,
  saveWorldSessionGameplayState,
  WORLD_SESSION_GAMEPLAY_STATE_STORAGE_KEY,
  type WorldSessionGameplayState
} from './mainWorldSessionGameplayState';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const createMemoryStorage = (initialState?: string): FakeStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  if (initialState !== undefined) {
    values.set(WORLD_SESSION_GAMEPLAY_STATE_STORAGE_KEY, initialState);
  }

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
};

describe('createDefaultWorldSessionGameplayState', () => {
  it('starts with peaceful mode disabled', () => {
    expect(createDefaultWorldSessionGameplayState()).toEqual({
      peacefulModeEnabled: false
    });
  });
});

describe('cloneWorldSessionGameplayState', () => {
  it('returns a detached gameplay-state snapshot', () => {
    const source: WorldSessionGameplayState = {
      peacefulModeEnabled: true
    };

    expect(cloneWorldSessionGameplayState(source)).toEqual(source);
    expect(cloneWorldSessionGameplayState(source)).not.toBe(source);
  });
});

describe('decodeWorldSessionGameplayState', () => {
  it('accepts a validated peaceful-mode payload', () => {
    expect(
      decodeWorldSessionGameplayState({
        peacefulModeEnabled: true
      })
    ).toEqual({
      peacefulModeEnabled: true
    });
  });

  it('defaults missing peaceful-mode fields to the normal gameplay state', () => {
    expect(decodeWorldSessionGameplayState({})).toEqual({
      peacefulModeEnabled: false
    });
  });

  it('rejects malformed gameplay-state payloads', () => {
    expect(() => decodeWorldSessionGameplayState(null)).toThrow('gameplay state must be an object');
    expect(() =>
      decodeWorldSessionGameplayState({
        peacefulModeEnabled: 'yes'
      })
    ).toThrow('gameplay state field "peacefulModeEnabled" must be boolean');
  });
});

describe('loadWorldSessionGameplayStateWithPersistenceAvailability', () => {
  const FALLBACK_STATE: WorldSessionGameplayState = {
    peacefulModeEnabled: false
  };

  it('marks persistence unavailable when storage access is missing or throws', () => {
    expect(loadWorldSessionGameplayStateWithPersistenceAvailability(null, FALLBACK_STATE)).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: false
    });

    const throwingStorage: FakeStorage = {
      getItem: () => {
        throw new Error('read blocked');
      },
      setItem: () => {}
    };

    expect(
      loadWorldSessionGameplayStateWithPersistenceAvailability(throwingStorage, FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: false
    });
  });

  it('keeps persistence available when readable storage has no valid saved state', () => {
    expect(
      loadWorldSessionGameplayStateWithPersistenceAvailability(createMemoryStorage(), FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: true
    });

    expect(
      loadWorldSessionGameplayStateWithPersistenceAvailability(
        createMemoryStorage('{not-json'),
        FALLBACK_STATE
      )
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: true
    });
  });
});

describe('loadWorldSessionGameplayState', () => {
  const FALLBACK_STATE: WorldSessionGameplayState = {
    peacefulModeEnabled: false
  };

  it('returns fallback state when storage is unavailable or empty', () => {
    expect(loadWorldSessionGameplayState(null, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
    expect(loadWorldSessionGameplayState(createMemoryStorage(), FALLBACK_STATE)).toEqual(
      FALLBACK_STATE
    );
  });

  it('loads valid persisted gameplay state', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        peacefulModeEnabled: true
      })
    );

    expect(loadWorldSessionGameplayState(storage, FALLBACK_STATE)).toEqual({
      peacefulModeEnabled: true
    });
  });

  it('falls back when persisted gameplay json is malformed or invalid', () => {
    const invalidFieldStorage = createMemoryStorage(
      JSON.stringify({
        peacefulModeEnabled: 'yes'
      })
    );
    expect(loadWorldSessionGameplayState(invalidFieldStorage, FALLBACK_STATE)).toEqual(
      FALLBACK_STATE
    );

    const malformedStorage = createMemoryStorage('{not-json');
    expect(loadWorldSessionGameplayState(malformedStorage, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });
});

describe('saveWorldSessionGameplayState', () => {
  const STATE: WorldSessionGameplayState = {
    peacefulModeEnabled: true
  };

  it('serializes and writes gameplay state using the storage key', () => {
    const storage = createMemoryStorage();
    expect(saveWorldSessionGameplayState(storage, STATE)).toBe(true);

    expect(storage.values.get(WORLD_SESSION_GAMEPLAY_STATE_STORAGE_KEY)).toBe(JSON.stringify(STATE));
  });

  it('returns false when storage is unavailable or throws', () => {
    expect(saveWorldSessionGameplayState(null, STATE)).toBe(false);

    const throwingStorage: FakeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('write blocked');
      }
    };
    expect(saveWorldSessionGameplayState(throwingStorage, STATE)).toBe(false);
  });
});
