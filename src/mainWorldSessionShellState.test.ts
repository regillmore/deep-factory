import { describe, expect, it } from 'vitest';

import {
  clearWorldSessionShellState,
  createDefaultWorldSessionShellState,
  createWorldSessionShellStatePersistenceSummary,
  loadWorldSessionShellState,
  loadWorldSessionShellStateWithPersistenceAvailability,
  resolveWorldSessionShellStateAfterPausedMainMenuTransition,
  saveWorldSessionShellState,
  WORLD_SESSION_SHELL_STATE_STORAGE_KEY,
  type WorldSessionShellState
} from './mainWorldSessionShellState';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
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
    },
    removeItem: (key) => {
      values.delete(key);
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

  it('reapplies the default-off shell layout when the paused menu resets shell toggle preferences', () => {
    const pausedSessionState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    };

    const resetShellState = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      pausedSessionState,
      'reset-shell-toggle-preferences'
    );

    expect(resetShellState).toEqual(createDefaultWorldSessionShellState());
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

describe('createWorldSessionShellStatePersistenceSummary', () => {
  it('lists the paused-session shell toggles that resume from saved preferences plus the current saved on and off groups', () => {
    expect(createWorldSessionShellStatePersistenceSummary()).toEqual({
      statusValue: 'Browser saved',
      descriptionLine:
        'Saved in-world shell visibility resumes with the paused session until a reset path clears it.',
      resumedToggleLabels: ['Debug HUD', 'Edit Panel', 'Edit Overlays', 'Spawn Marker', 'Shortcuts'],
      savedOnToggleLabels: [],
      savedOffToggleLabels: ['Debug HUD', 'Edit Panel', 'Edit Overlays', 'Spawn Marker', 'Shortcuts'],
      clearedByActionLabels: ['Reset Shell Toggles', 'New World']
    });
  });

  it('groups the current saved shell layout into saved-on and saved-off labels', () => {
    expect(
      createWorldSessionShellStatePersistenceSummary({
        debugOverlayVisible: true,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: true
      })
    ).toEqual({
      statusValue: 'Browser saved',
      descriptionLine:
        'Saved in-world shell visibility resumes with the paused session until a reset path clears it.',
      resumedToggleLabels: ['Debug HUD', 'Edit Panel', 'Edit Overlays', 'Spawn Marker', 'Shortcuts'],
      savedOnToggleLabels: ['Debug HUD', 'Edit Overlays', 'Shortcuts'],
      savedOffToggleLabels: ['Edit Panel', 'Spawn Marker'],
      clearedByActionLabels: ['Reset Shell Toggles', 'New World']
    });
  });

  it('switches the summary to session-only fallback copy when browser shell storage is unavailable', () => {
    expect(
      createWorldSessionShellStatePersistenceSummary(
        {
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: true
        },
        false
      )
    ).toEqual({
      statusValue: 'Session-only fallback',
      descriptionLine:
        'Browser shell storage is unavailable, so this paused session keeps the current shell layout only until a reset path or reload clears it.',
      resumedToggleLabels: ['Debug HUD', 'Edit Panel', 'Edit Overlays', 'Spawn Marker', 'Shortcuts'],
      savedOnToggleLabels: ['Debug HUD', 'Edit Overlays', 'Shortcuts'],
      savedOffToggleLabels: ['Edit Panel', 'Spawn Marker'],
      clearedByActionLabels: ['Reset Shell Toggles', 'New World']
    });
  });
});

describe('loadWorldSessionShellStateWithPersistenceAvailability', () => {
  const FALLBACK_STATE: WorldSessionShellState = {
    debugOverlayVisible: false,
    debugEditControlsVisible: false,
    debugEditOverlaysVisible: false,
    playerSpawnMarkerVisible: false,
    shortcutsOverlayVisible: false
  };

  it('marks persistence unavailable when storage access is missing or throws', () => {
    expect(loadWorldSessionShellStateWithPersistenceAvailability(null, FALLBACK_STATE)).toEqual({
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
      loadWorldSessionShellStateWithPersistenceAvailability(throwingStorage, FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: false
    });
  });

  it('keeps persistence available when storage is readable even if no valid saved state exists', () => {
    expect(
      loadWorldSessionShellStateWithPersistenceAvailability(createMemoryStorage(), FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: true
    });

    const malformedStorage = createMemoryStorage('{not-json');
    expect(
      loadWorldSessionShellStateWithPersistenceAvailability(malformedStorage, FALLBACK_STATE)
    ).toEqual({
      state: FALLBACK_STATE,
      persistenceAvailable: true
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

  it('falls back to the default all-off state when any persisted field is invalid', () => {
    const invalidFieldStorage = createMemoryStorage(
      JSON.stringify({
        debugOverlayVisible: 'yes',
        debugEditControlsVisible: true,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: true,
        shortcutsOverlayVisible: true
      })
    );
    expect(loadWorldSessionShellState(invalidFieldStorage, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });

  it('falls back to the default all-off state when persisted JSON is malformed', () => {
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

describe('clearWorldSessionShellState', () => {
  it('removes the persisted shell-toggle storage entry', () => {
    const storage = createMemoryStorage(JSON.stringify(createDefaultWorldSessionShellState()));

    expect(clearWorldSessionShellState(storage)).toBe(true);
    expect(storage.values.has(WORLD_SESSION_SHELL_STATE_STORAGE_KEY)).toBe(false);
  });

  it('returns false when storage is unavailable, missing remove support, or throws', () => {
    expect(clearWorldSessionShellState(null)).toBe(false);

    const storageWithoutRemove: FakeStorage = {
      getItem: () => null,
      setItem: () => {}
    };
    expect(clearWorldSessionShellState(storageWithoutRemove)).toBe(false);

    const throwingStorage: FakeStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error('remove blocked');
      }
    };
    expect(clearWorldSessionShellState(throwingStorage)).toBe(false);
  });
});
