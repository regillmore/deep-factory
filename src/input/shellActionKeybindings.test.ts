import { describe, expect, it } from 'vitest';

import {
  createDefaultShellActionKeybindingState,
  getDesktopDebugEditControlsHotkeyLabel,
  getDesktopDebugEditOverlaysHotkeyLabel,
  getDesktopDebugOverlayHotkeyLabel,
  getDesktopPlayerSpawnMarkerHotkeyLabel,
  getDesktopRecenterCameraHotkeyLabel,
  getDesktopReturnToMainMenuHotkeyLabel,
  loadShellActionKeybindingState,
  matchesDefaultShellActionKeybindingState,
  resolveInWorldShellActionKeybindingAction,
  saveShellActionKeybindingState,
  SHELL_ACTION_KEYBINDING_STORAGE_KEY,
  type ShellActionKeybindingState
} from './shellActionKeybindings';

interface FakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const createMemoryStorage = (initialState?: string): FakeStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  if (initialState !== undefined) {
    values.set(SHELL_ACTION_KEYBINDING_STORAGE_KEY, initialState);
  }

  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
};

describe('createDefaultShellActionKeybindingState', () => {
  it('returns the default in-world shell action hotkeys', () => {
    expect(createDefaultShellActionKeybindingState()).toEqual({
      'return-to-main-menu': 'Q',
      'recenter-camera': 'C',
      'toggle-debug-overlay': 'H',
      'toggle-debug-edit-controls': 'G',
      'toggle-debug-edit-overlays': 'V',
      'toggle-player-spawn-marker': 'M'
    });
  });
});

describe('matchesDefaultShellActionKeybindingState', () => {
  it('detects whether the configured in-world shell-action keybindings still match the default set', () => {
    expect(
      matchesDefaultShellActionKeybindingState(createDefaultShellActionKeybindingState())
    ).toBe(true);

    expect(
      matchesDefaultShellActionKeybindingState({
        'return-to-main-menu': 'X',
        'recenter-camera': 'C',
        'toggle-debug-overlay': 'H',
        'toggle-debug-edit-controls': 'G',
        'toggle-debug-edit-overlays': 'V',
        'toggle-player-spawn-marker': 'M'
      })
    ).toBe(false);
  });
});

describe('loadShellActionKeybindingState', () => {
  const FALLBACK_STATE = createDefaultShellActionKeybindingState();

  it('returns fallback state when storage is unavailable, empty, malformed, or unreadable', () => {
    expect(loadShellActionKeybindingState(null, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
    expect(loadShellActionKeybindingState(createMemoryStorage(), FALLBACK_STATE)).toEqual(FALLBACK_STATE);
    expect(loadShellActionKeybindingState(createMemoryStorage('{not-json'), FALLBACK_STATE)).toEqual(
      FALLBACK_STATE
    );

    const throwingStorage: FakeStorage = {
      getItem: () => {
        throw new Error('read blocked');
      },
      setItem: () => {}
    };
    expect(loadShellActionKeybindingState(throwingStorage, FALLBACK_STATE)).toEqual(FALLBACK_STATE);
  });

  it('loads valid persisted shell-action keybindings', () => {
    const customState: ShellActionKeybindingState = {
      'return-to-main-menu': 'X',
      'recenter-camera': 'Z',
      'toggle-debug-overlay': 'U',
      'toggle-debug-edit-controls': 'J',
      'toggle-debug-edit-overlays': 'K',
      'toggle-player-spawn-marker': 'Y'
    };
    const storage = createMemoryStorage(JSON.stringify(customState));

    expect(loadShellActionKeybindingState(storage, FALLBACK_STATE)).toEqual(customState);
  });

  it('normalizes lowercase persisted labels and preserves valid swap combinations', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        'return-to-main-menu': 'c',
        'recenter-camera': 'q',
        'toggle-debug-overlay': 'u',
        'toggle-debug-edit-controls': 'j',
        'toggle-debug-edit-overlays': 'k',
        'toggle-player-spawn-marker': 'y'
      })
    );

    expect(loadShellActionKeybindingState(storage, FALLBACK_STATE)).toEqual({
      'return-to-main-menu': 'C',
      'recenter-camera': 'Q',
      'toggle-debug-overlay': 'U',
      'toggle-debug-edit-controls': 'J',
      'toggle-debug-edit-overlays': 'K',
      'toggle-player-spawn-marker': 'Y'
    });
  });

  it('falls back invalid, reserved, or duplicate persisted labels to defaults', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        'return-to-main-menu': 'F',
        'recenter-camera': 'Q',
        'toggle-debug-overlay': 'Q',
        'toggle-debug-edit-controls': '11',
        'toggle-debug-edit-overlays': '?',
        'toggle-player-spawn-marker': 'Y'
      })
    );

    expect(loadShellActionKeybindingState(storage, FALLBACK_STATE)).toEqual({
      'return-to-main-menu': 'Q',
      'recenter-camera': 'C',
      'toggle-debug-overlay': 'H',
      'toggle-debug-edit-controls': 'G',
      'toggle-debug-edit-overlays': 'V',
      'toggle-player-spawn-marker': 'Y'
    });
  });
});

describe('saveShellActionKeybindingState', () => {
  it('serializes and writes shell-action keybindings using the storage key', () => {
    const storage = createMemoryStorage();
    const state: ShellActionKeybindingState = {
      'return-to-main-menu': 'X',
      'recenter-camera': 'Z',
      'toggle-debug-overlay': 'U',
      'toggle-debug-edit-controls': 'J',
      'toggle-debug-edit-overlays': 'K',
      'toggle-player-spawn-marker': 'Y'
    };

    expect(saveShellActionKeybindingState(storage, state)).toBe(true);
    expect(storage.values.get(SHELL_ACTION_KEYBINDING_STORAGE_KEY)).toBe(JSON.stringify(state));
  });

  it('returns false when storage is unavailable or throws', () => {
    expect(saveShellActionKeybindingState(null, createDefaultShellActionKeybindingState())).toBe(false);

    const throwingStorage: FakeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('write blocked');
      }
    };
    expect(
      saveShellActionKeybindingState(throwingStorage, createDefaultShellActionKeybindingState())
    ).toBe(false);
  });
});

describe('resolveInWorldShellActionKeybindingAction', () => {
  const customState: ShellActionKeybindingState = {
    'return-to-main-menu': 'X',
    'recenter-camera': 'Z',
    'toggle-debug-overlay': 'U',
    'toggle-debug-edit-controls': 'J',
    'toggle-debug-edit-overlays': 'K',
    'toggle-player-spawn-marker': 'Y'
  };

  it('maps the configured shell-action keybindings to in-world actions', () => {
    expect(resolveInWorldShellActionKeybindingAction({ key: 'x' }, customState)).toBe(
      'return-to-main-menu'
    );
    expect(resolveInWorldShellActionKeybindingAction({ key: 'Z' }, customState)).toBe(
      'recenter-camera'
    );
    expect(resolveInWorldShellActionKeybindingAction({ key: 'u' }, customState)).toBe(
      'toggle-debug-overlay'
    );
    expect(resolveInWorldShellActionKeybindingAction({ key: 'J' }, customState)).toBe(
      'toggle-debug-edit-controls'
    );
    expect(resolveInWorldShellActionKeybindingAction({ key: 'k' }, customState)).toBe(
      'toggle-debug-edit-overlays'
    );
    expect(resolveInWorldShellActionKeybindingAction({ key: 'Y' }, customState)).toBe(
      'toggle-player-spawn-marker'
    );
  });

  it('returns null for unsupported keys', () => {
    expect(resolveInWorldShellActionKeybindingAction({ key: '?' }, customState)).toBeNull();
    expect(resolveInWorldShellActionKeybindingAction({ key: '1' }, customState)).toBeNull();
  });
});

describe('shell-action hotkey label helpers', () => {
  const customState: ShellActionKeybindingState = {
    'return-to-main-menu': 'X',
    'recenter-camera': 'Z',
    'toggle-debug-overlay': 'U',
    'toggle-debug-edit-controls': 'J',
    'toggle-debug-edit-overlays': 'K',
    'toggle-player-spawn-marker': 'Y'
  };

  it('returns the configured labels for the in-world shell actions', () => {
    expect(getDesktopReturnToMainMenuHotkeyLabel(customState)).toBe('X');
    expect(getDesktopRecenterCameraHotkeyLabel(customState)).toBe('Z');
    expect(getDesktopDebugOverlayHotkeyLabel(customState)).toBe('U');
    expect(getDesktopDebugEditControlsHotkeyLabel(customState)).toBe('J');
    expect(getDesktopDebugEditOverlaysHotkeyLabel(customState)).toBe('K');
    expect(getDesktopPlayerSpawnMarkerHotkeyLabel(customState)).toBe('Y');
  });
});
