export interface WorldSessionShellState {
  debugOverlayVisible: boolean;
  debugEditControlsVisible: boolean;
  debugEditOverlaysVisible: boolean;
  playerSpawnMarkerVisible: boolean;
  shortcutsOverlayVisible: boolean;
}

export interface WorldSessionShellStatePersistenceSummary {
  statusValue: string;
  descriptionLine: string;
  resumedToggleLabels: readonly string[];
  savedOnToggleLabels: readonly string[];
  savedOffToggleLabels: readonly string[];
  clearedByActionLabels: readonly string[];
}

export interface WorldSessionShellStateLoadResult {
  state: WorldSessionShellState;
  persistenceAvailable: boolean;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export type PausedMainMenuWorldSessionShellTransition =
  | 'pause-to-main-menu'
  | 'resume-paused-world-session'
  | 'start-fresh-world-session'
  | 'reset-shell-toggle-preferences';

const STORAGE_KEY = 'deep-factory.worldSessionShellState.v1';

const PERSISTED_WORLD_SESSION_SHELL_TOGGLE_LABELS_BY_KEY = [
  ['debugOverlayVisible', 'Debug HUD'],
  ['debugEditControlsVisible', 'Edit Panel'],
  ['debugEditOverlaysVisible', 'Edit Overlays'],
  ['playerSpawnMarkerVisible', 'Spawn Marker'],
  ['shortcutsOverlayVisible', 'Shortcuts']
] as const;

const PERSISTED_WORLD_SESSION_SHELL_TOGGLE_LABELS = PERSISTED_WORLD_SESSION_SHELL_TOGGLE_LABELS_BY_KEY.map(
  ([, label]) => label
);

const WORLD_SESSION_SHELL_STATE_CLEAR_ACTION_LABELS = [
  'Reset Shell Toggles',
  'New World'
] as const;
const WORLD_SESSION_SHELL_STATE_PERSISTENCE_STATUS_BROWSER_SAVED = 'Browser saved';
const WORLD_SESSION_SHELL_STATE_PERSISTENCE_STATUS_SESSION_ONLY_FALLBACK =
  'Session-only fallback';
const WORLD_SESSION_SHELL_STATE_PERSISTENCE_DESCRIPTION_BROWSER_SAVED =
  'Saved in-world shell visibility resumes with the paused session until a reset path clears it.';
const WORLD_SESSION_SHELL_STATE_PERSISTENCE_DESCRIPTION_SESSION_ONLY_FALLBACK =
  'Browser shell storage is unavailable, so this paused session keeps the current shell layout only until a reset path or reload clears it.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

const isWorldSessionShellStateRecord = (
  value: unknown
): value is Record<keyof WorldSessionShellState, boolean> =>
  isRecord(value) &&
  isBoolean(value.debugOverlayVisible) &&
  isBoolean(value.debugEditControlsVisible) &&
  isBoolean(value.debugEditOverlaysVisible) &&
  isBoolean(value.playerSpawnMarkerVisible) &&
  isBoolean(value.shortcutsOverlayVisible);

export const createDefaultWorldSessionShellState = (): WorldSessionShellState => ({
  debugOverlayVisible: false,
  debugEditControlsVisible: false,
  debugEditOverlaysVisible: false,
  playerSpawnMarkerVisible: false,
  shortcutsOverlayVisible: false
});

export const createWorldSessionShellStatePersistenceSummary =
  (
    state: WorldSessionShellState = createDefaultWorldSessionShellState(),
    persistenceAvailable = true
  ): WorldSessionShellStatePersistenceSummary => {
    const savedOnToggleLabels: string[] = [];
    const savedOffToggleLabels: string[] = [];

    for (const [key, label] of PERSISTED_WORLD_SESSION_SHELL_TOGGLE_LABELS_BY_KEY) {
      if (state[key]) {
        savedOnToggleLabels.push(label);
        continue;
      }

      savedOffToggleLabels.push(label);
    }

    return {
      statusValue: persistenceAvailable
        ? WORLD_SESSION_SHELL_STATE_PERSISTENCE_STATUS_BROWSER_SAVED
        : WORLD_SESSION_SHELL_STATE_PERSISTENCE_STATUS_SESSION_ONLY_FALLBACK,
      descriptionLine: persistenceAvailable
        ? WORLD_SESSION_SHELL_STATE_PERSISTENCE_DESCRIPTION_BROWSER_SAVED
        : WORLD_SESSION_SHELL_STATE_PERSISTENCE_DESCRIPTION_SESSION_ONLY_FALLBACK,
      resumedToggleLabels: PERSISTED_WORLD_SESSION_SHELL_TOGGLE_LABELS,
      savedOnToggleLabels,
      savedOffToggleLabels,
      clearedByActionLabels: WORLD_SESSION_SHELL_STATE_CLEAR_ACTION_LABELS
    };
  };

export const resolveWorldSessionShellStateAfterPausedMainMenuTransition = (
  currentState: WorldSessionShellState,
  transition: PausedMainMenuWorldSessionShellTransition
): WorldSessionShellState => {
  if (
    transition === 'start-fresh-world-session' ||
    transition === 'reset-shell-toggle-preferences'
  ) {
    return createDefaultWorldSessionShellState();
  }

  return currentState;
};

export const loadWorldSessionShellStateWithPersistenceAvailability = (
  storage: StorageLike | null | undefined,
  fallbackState: WorldSessionShellState
): WorldSessionShellStateLoadResult => {
  if (!storage) {
    return {
      state: fallbackState,
      persistenceAvailable: false
    };
  }

  let rawState: string | null;
  try {
    rawState = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      state: fallbackState,
      persistenceAvailable: false
    };
  }

  if (!rawState) {
    return {
      state: fallbackState,
      persistenceAvailable: true
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawState);
  } catch {
    return {
      state: fallbackState,
      persistenceAvailable: true
    };
  }

  if (!isWorldSessionShellStateRecord(parsed)) {
    return {
      state: fallbackState,
      persistenceAvailable: true
    };
  }

  return {
    state: {
      debugOverlayVisible: parsed.debugOverlayVisible,
      debugEditControlsVisible: parsed.debugEditControlsVisible,
      debugEditOverlaysVisible: parsed.debugEditOverlaysVisible,
      playerSpawnMarkerVisible: parsed.playerSpawnMarkerVisible,
      shortcutsOverlayVisible: parsed.shortcutsOverlayVisible
    },
    persistenceAvailable: true
  };
};

export const loadWorldSessionShellState = (
  storage: StorageLike | null | undefined,
  fallbackState: WorldSessionShellState
): WorldSessionShellState =>
  loadWorldSessionShellStateWithPersistenceAvailability(storage, fallbackState).state;

export const saveWorldSessionShellState = (
  storage: StorageLike | null | undefined,
  state: WorldSessionShellState
): boolean => {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const clearWorldSessionShellState = (storage: StorageLike | null | undefined): boolean => {
  if (!storage || typeof storage.removeItem !== 'function') return false;

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const WORLD_SESSION_SHELL_STATE_STORAGE_KEY = STORAGE_KEY;
