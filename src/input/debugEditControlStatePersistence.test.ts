import { describe, expect, it } from 'vitest';

import {
  DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY,
  loadDebugEditControlState,
  saveDebugEditControlState,
  type DebugEditControlState
} from './debugEditControlStatePersistence';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const FALLBACK_STATE: DebugEditControlState = {
  touchMode: 'pan',
  brushTileId: 2
};

const createMemoryStorage = (initialState?: string): FakeStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  if (initialState !== undefined) {
    values.set(DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY, initialState);
  }

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
};

describe('loadDebugEditControlState', () => {
  it('returns fallback state when storage is unavailable or empty', () => {
    expect(loadDebugEditControlState(null, [2, 3, 4], FALLBACK_STATE)).toEqual(FALLBACK_STATE);
    expect(loadDebugEditControlState(createMemoryStorage(), [2, 3, 4], FALLBACK_STATE)).toEqual(
      FALLBACK_STATE
    );
  });

  it('loads valid persisted touch mode and brush tile', () => {
    const storage = createMemoryStorage(JSON.stringify({ touchMode: 'break', brushTileId: 4 }));
    expect(loadDebugEditControlState(storage, [2, 3, 4], FALLBACK_STATE)).toEqual({
      touchMode: 'break',
      brushTileId: 4
    });
  });

  it('falls back only the brush tile when metadata no longer contains the saved tile', () => {
    const storage = createMemoryStorage(JSON.stringify({ touchMode: 'place', brushTileId: 99 }));
    expect(loadDebugEditControlState(storage, [2, 3, 4], FALLBACK_STATE)).toEqual({
      touchMode: 'place',
      brushTileId: 2
    });
  });

  it('falls back invalid fields and malformed JSON safely', () => {
    const invalidFieldStorage = createMemoryStorage(
      JSON.stringify({ touchMode: 'paint', brushTileId: 3.5 })
    );
    expect(loadDebugEditControlState(invalidFieldStorage, [2, 3, 4], FALLBACK_STATE)).toEqual(
      FALLBACK_STATE
    );

    const malformedStorage = createMemoryStorage('{not-json');
    expect(loadDebugEditControlState(malformedStorage, [2, 3, 4], FALLBACK_STATE)).toEqual(
      FALLBACK_STATE
    );
  });

  it('returns fallback when storage throws', () => {
    const throwingStorage: FakeStorage = {
      getItem: () => {
        throw new Error('read blocked');
      },
      setItem: () => {}
    };

    expect(loadDebugEditControlState(throwingStorage, [2, 3, 4], FALLBACK_STATE)).toEqual(
      FALLBACK_STATE
    );
  });
});

describe('saveDebugEditControlState', () => {
  it('serializes and writes state using the storage key', () => {
    const storage = createMemoryStorage();
    expect(
      saveDebugEditControlState(storage, {
        touchMode: 'break',
        brushTileId: 4
      })
    ).toBe(true);

    expect(storage.values.get(DEBUG_EDIT_CONTROL_STATE_STORAGE_KEY)).toBe(
      JSON.stringify({ touchMode: 'break', brushTileId: 4 })
    );
  });

  it('returns false when storage is unavailable or throws', () => {
    expect(saveDebugEditControlState(null, FALLBACK_STATE)).toBe(false);

    const throwingStorage: FakeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('write blocked');
      }
    };
    expect(saveDebugEditControlState(throwingStorage, FALLBACK_STATE)).toBe(false);
  });
});
