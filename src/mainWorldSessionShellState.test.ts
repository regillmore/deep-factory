import { describe, expect, it } from 'vitest';

import {
  createDefaultWorldSessionShellState,
  loadWorldSessionShellState,
  resolveWorldSessionShellStateAfterPausedMainMenuTransition,
  saveWorldSessionShellState,
  WORLD_SESSION_SHELL_STATE_STORAGE_KEY,
  type WorldSessionShellState
} from './mainWorldSessionShellState';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const createMemoryStorage = (initialState?: string): FakeStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  if (initialState !== undefined) {
    values.set(WORLD_SESSION_SHELL_STATE_STORAGE_KEY, initialState);
  }

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
};

describe('resolveWorldSessionShellStateAfterPausedMainMenuTransition', () => {
  it('keeps all in-world shell toggles through paused-session pause and resume transitions', () => {
    const initial = {
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    };

    const paused = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      initial,
      'pause-to-main-menu'
    );
    const resumed = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      paused,
      'resume-paused-world-session'
    );

    expect(resumed).toEqual(initial);
  });

  it('resets all in-world shell toggles to first-start defaults when a fresh paused-menu world starts', () => {
    const pausedSessionState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    };

    const freshWorldState = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      pausedSessionState,
      'start-fresh-world-session'
    );

    expect(freshWorldState).toEqual(createDefaultWorldSessionShellState());
  });

  it('starts with all in-world shell toggles off by default', () => {
    expect(createDefaultWorldSessionShellState()).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: false
    });
  });
});

describe('loadWorldSessionShellState', () => {
  const FALLBACK_STATE: WorldSessionShellState = {
    debugOverlayVisible: false,
    debugEditControlsVisible: false,
    debugEditOverlaysVisible: false,
    playerSpawnMarkerVisible: false,
    shortcutsOverlayVisible: false
  };

  it('returns fallback state when storage is unavailable or empty', () => {
    expect(loadWorldSessionShellState(null, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
    expect(loadWorldSessionShellState(createMemoryStorage(), FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });

  it('loads valid persisted shell toggle state', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        debugOverlayVisible: true,
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true
      })
    );

    expect(loadWorldSessionShellState(storage, FALLBACK_STATE)).toEqual({
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: true,
      playerSpawnMarkerVisible: true,
      shortcutsOverlayVisible: true
    });
  });

  it('falls back invalid fields and malformed JSON safely', () => {
    const invalidFieldStorage = createMemoryStorage(
      JSON.stringify({
        debugOverlayVisible: 'yes',
        debugEditControlsVisible: 1,
        debugEditOverlaysVisible: null,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: true
      })
    );
    expect(loadWorldSessionShellState(invalidFieldStorage, FALLBACK_STATE)).toEqual({
      debugOverlayVisible: false,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    });

    const malformedStorage = createMemoryStorage('{not-json');
    expect(loadWorldSessionShellState(malformedStorage, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });

  it('returns fallback when storage throws', () => {
    const throwingStorage: FakeStorage = {
      getItem: () => {
        throw new Error('read blocked');
      },
      setItem: () => {}
    };

    expect(loadWorldSessionShellState(throwingStorage, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });
});

describe('saveWorldSessionShellState', () => {
  const STATE: WorldSessionShellState = {
    debugOverlayVisible: true,
    debugEditControlsVisible: false,
    debugEditOverlaysVisible: true,
    playerSpawnMarkerVisible: false,
    shortcutsOverlayVisible: true
  };

  it('serializes and writes shell toggles using the storage key', () => {
    const storage = createMemoryStorage();
    expect(saveWorldSessionShellState(storage, STATE)).toBe(true);

    expect(storage.values.get(WORLD_SESSION_SHELL_STATE_STORAGE_KEY)).toBe(JSON.stringify(STATE));
  });

  it('returns false when storage is unavailable or throws', () => {
    expect(saveWorldSessionShellState(null, STATE)).toBe(false);

    const throwingStorage: FakeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('write blocked');
      }
    };
    expect(saveWorldSessionShellState(throwingStorage, STATE)).toBe(false);
  });
});
