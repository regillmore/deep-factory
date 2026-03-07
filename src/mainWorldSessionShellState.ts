export interface WorldSessionShellState {
  debugOverlayVisible: boolean;
  debugEditControlsVisible: boolean;
  debugEditOverlaysVisible: boolean;
  playerSpawnMarkerVisible: boolean;
  shortcutsOverlayVisible: boolean;
}

export interface WorldSessionShellStatePersistenceSummary {
  resumedToggleLabels: readonly string[];
  clearedByActionLabels: readonly string[];
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

const PERSISTED_WORLD_SESSION_SHELL_TOGGLE_LABELS = [
  'Debug HUD',
  'Edit Panel',
  'Edit Overlays',
  'Spawn Marker',
  'Shortcuts'
] as const;

const WORLD_SESSION_SHELL_STATE_CLEAR_ACTION_LABELS = [
  'Reset Shell Toggles',
  'New World'
] as const;

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
  (): WorldSessionShellStatePersistenceSummary => ({
    resumedToggleLabels: PERSISTED_WORLD_SESSION_SHELL_TOGGLE_LABELS,
    clearedByActionLabels: WORLD_SESSION_SHELL_STATE_CLEAR_ACTION_LABELS
  });

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

export const loadWorldSessionShellState = (
  storage: StorageLike | null | undefined,
  fallbackState: WorldSessionShellState
): WorldSessionShellState => {
  if (!storage) return fallbackState;

  let rawState: string | null;
  try {
    rawState = storage.getItem(STORAGE_KEY);
  } catch {
    return fallbackState;
  }

  if (!rawState) return fallbackState;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawState);
  } catch {
    return fallbackState;
  }

  if (!isWorldSessionShellStateRecord(parsed)) return fallbackState;

  return {
    debugOverlayVisible: parsed.debugOverlayVisible,
    debugEditControlsVisible: parsed.debugEditControlsVisible,
    debugEditOverlaysVisible: parsed.debugEditOverlaysVisible,
    playerSpawnMarkerVisible: parsed.playerSpawnMarkerVisible,
    shortcutsOverlayVisible: parsed.shortcutsOverlayVisible
  };
};

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
