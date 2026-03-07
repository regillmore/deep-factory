export interface DebugEditShortcutKeyEventLike {
  key: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type InWorldShellActionKeybindingActionType =
  | 'return-to-main-menu'
  | 'recenter-camera'
  | 'toggle-debug-overlay'
  | 'toggle-debug-edit-controls'
  | 'toggle-debug-edit-overlays'
  | 'toggle-player-spawn-marker';

export type ShellActionKeybindingState = Record<InWorldShellActionKeybindingActionType, string>;

const STORAGE_KEY = 'deep-factory.shellActionKeybindings.v1';

const IN_WORLD_SHELL_ACTION_KEYBINDING_IDS: readonly InWorldShellActionKeybindingActionType[] = [
  'return-to-main-menu',
  'recenter-camera',
  'toggle-debug-overlay',
  'toggle-debug-edit-controls',
  'toggle-debug-edit-overlays',
  'toggle-player-spawn-marker'
];

const RESERVED_NON_SHELL_IN_WORLD_KEYBINDING_LABELS = new Set([
  'A',
  'B',
  'D',
  'E',
  'F',
  'I',
  'L',
  'N',
  'O',
  'P',
  'R',
  'T',
  'W'
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeShellActionKeybindingLabel = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;

  const normalizedValue = value.trim().toUpperCase();
  return /^[A-Z]$/.test(normalizedValue) ? normalizedValue : null;
};

const collectDuplicateShellActionKeybindingLabels = (
  state: ShellActionKeybindingState
): ReadonlySet<string> => {
  const counts = new Map<string, number>();
  for (const actionType of IN_WORLD_SHELL_ACTION_KEYBINDING_IDS) {
    const label = state[actionType];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const duplicates = new Set<string>();
  for (const [label, count] of counts) {
    if (count > 1) {
      duplicates.add(label);
    }
  }

  return duplicates;
};

export const createDefaultShellActionKeybindingState = (): ShellActionKeybindingState => ({
  'return-to-main-menu': 'Q',
  'recenter-camera': 'C',
  'toggle-debug-overlay': 'H',
  'toggle-debug-edit-controls': 'G',
  'toggle-debug-edit-overlays': 'V',
  'toggle-player-spawn-marker': 'M'
});

export const matchesDefaultShellActionKeybindingState = (
  keybindings: ShellActionKeybindingState,
  defaultKeybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): boolean =>
  IN_WORLD_SHELL_ACTION_KEYBINDING_IDS.every(
    (actionType) => keybindings[actionType] === defaultKeybindings[actionType]
  );

export const loadShellActionKeybindingState = (
  storage: StorageLike | null | undefined,
  fallbackState: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): ShellActionKeybindingState => {
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

  if (!isRecord(parsed)) return fallbackState;

  const nextState = { ...fallbackState };
  for (const actionType of IN_WORLD_SHELL_ACTION_KEYBINDING_IDS) {
    const normalizedLabel = normalizeShellActionKeybindingLabel(parsed[actionType]);
    if (
      normalizedLabel === null ||
      RESERVED_NON_SHELL_IN_WORLD_KEYBINDING_LABELS.has(normalizedLabel)
    ) {
      continue;
    }

    nextState[actionType] = normalizedLabel;
  }

  const duplicateLabels = collectDuplicateShellActionKeybindingLabels(nextState);
  if (duplicateLabels.size === 0) {
    return nextState;
  }

  for (const actionType of IN_WORLD_SHELL_ACTION_KEYBINDING_IDS) {
    if (duplicateLabels.has(nextState[actionType])) {
      nextState[actionType] = fallbackState[actionType];
    }
  }

  return nextState;
};

export const saveShellActionKeybindingState = (
  storage: StorageLike | null | undefined,
  state: ShellActionKeybindingState
): boolean => {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const resolveInWorldShellActionKeybindingAction = (
  event: DebugEditShortcutKeyEventLike,
  keybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): InWorldShellActionKeybindingActionType | null => {
  const normalizedKey = normalizeShellActionKeybindingLabel(event.key);
  if (normalizedKey === null) {
    return null;
  }

  for (const actionType of IN_WORLD_SHELL_ACTION_KEYBINDING_IDS) {
    if (keybindings[actionType] === normalizedKey) {
      return actionType;
    }
  }

  return null;
};

export const getDesktopReturnToMainMenuHotkeyLabel = (
  keybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => keybindings['return-to-main-menu'];

export const getDesktopRecenterCameraHotkeyLabel = (
  keybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => keybindings['recenter-camera'];

export const getDesktopDebugOverlayHotkeyLabel = (
  keybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => keybindings['toggle-debug-overlay'];

export const getDesktopDebugEditControlsHotkeyLabel = (
  keybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => keybindings['toggle-debug-edit-controls'];

export const getDesktopDebugEditOverlaysHotkeyLabel = (
  keybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => keybindings['toggle-debug-edit-overlays'];

export const getDesktopPlayerSpawnMarkerHotkeyLabel = (
  keybindings: ShellActionKeybindingState = createDefaultShellActionKeybindingState()
): string => keybindings['toggle-player-spawn-marker'];

export const SHELL_ACTION_KEYBINDING_STORAGE_KEY = STORAGE_KEY;
