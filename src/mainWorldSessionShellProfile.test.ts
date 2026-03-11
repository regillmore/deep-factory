import { describe, expect, it } from 'vitest';

import { createDefaultShellActionKeybindingState } from './input/shellActionKeybindings';
import { createDefaultWorldSessionShellState } from './mainWorldSessionShellState';
import {
  createWorldSessionShellProfileEnvelope,
  decodeWorldSessionShellProfileEnvelope,
  WORLD_SESSION_SHELL_PROFILE_KIND,
  WORLD_SESSION_SHELL_PROFILE_VERSION
} from './mainWorldSessionShellProfile';

describe('createWorldSessionShellProfileEnvelope', () => {
  it('returns a versioned shell-profile envelope with detached shell state and hotkeys', () => {
    expect(createWorldSessionShellProfileEnvelope()).toEqual({
      kind: WORLD_SESSION_SHELL_PROFILE_KIND,
      version: WORLD_SESSION_SHELL_PROFILE_VERSION,
      shellState: createDefaultWorldSessionShellState(),
      shellActionKeybindings: createDefaultShellActionKeybindingState()
    });
  });

  it('clones the supplied shell state and hotkeys so later mutation does not rewrite the envelope', () => {
    const shellState = createDefaultWorldSessionShellState();
    const shellActionKeybindings = createDefaultShellActionKeybindingState();

    const envelope = createWorldSessionShellProfileEnvelope({
      shellState,
      shellActionKeybindings
    });

    shellState.debugOverlayVisible = true;
    shellActionKeybindings['toggle-debug-overlay'] = 'U';

    expect(envelope).toEqual({
      kind: WORLD_SESSION_SHELL_PROFILE_KIND,
      version: WORLD_SESSION_SHELL_PROFILE_VERSION,
      shellState: createDefaultWorldSessionShellState(),
      shellActionKeybindings: createDefaultShellActionKeybindingState()
    });
  });
});

describe('decodeWorldSessionShellProfileEnvelope', () => {
  it('decodes a validated shell-profile envelope into detached shell state and hotkeys', () => {
    expect(
      decodeWorldSessionShellProfileEnvelope({
        kind: WORLD_SESSION_SHELL_PROFILE_KIND,
        version: WORLD_SESSION_SHELL_PROFILE_VERSION,
        shellState: {
          debugOverlayVisible: true,
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: true
        },
        shellActionKeybindings: {
          'return-to-main-menu': 'x',
          'recenter-camera': 'z',
          'toggle-debug-overlay': 'u',
          'toggle-debug-edit-controls': 'j',
          'toggle-debug-edit-overlays': 'k',
          'toggle-player-spawn-marker': 'y'
        }
      })
    ).toEqual({
      kind: WORLD_SESSION_SHELL_PROFILE_KIND,
      version: WORLD_SESSION_SHELL_PROFILE_VERSION,
      shellState: {
        debugOverlayVisible: true,
        debugEditControlsVisible: false,
        debugEditOverlaysVisible: true,
        playerSpawnMarkerVisible: false,
        shortcutsOverlayVisible: true
      },
      shellActionKeybindings: {
        'return-to-main-menu': 'X',
        'recenter-camera': 'Z',
        'toggle-debug-overlay': 'U',
        'toggle-debug-edit-controls': 'J',
        'toggle-debug-edit-overlays': 'K',
        'toggle-player-spawn-marker': 'Y'
      }
    });
  });

  it('rejects shell profiles with the wrong envelope kind or malformed nested state', () => {
    expect(() =>
      decodeWorldSessionShellProfileEnvelope({
        kind: 'wrong-kind',
        version: WORLD_SESSION_SHELL_PROFILE_VERSION
      })
    ).toThrow(`shell profile envelope kind must be "${WORLD_SESSION_SHELL_PROFILE_KIND}"`);

    expect(() =>
      decodeWorldSessionShellProfileEnvelope({
        kind: WORLD_SESSION_SHELL_PROFILE_KIND,
        version: WORLD_SESSION_SHELL_PROFILE_VERSION,
        shellState: {
          debugOverlayVisible: 'yes',
          debugEditControlsVisible: false,
          debugEditOverlaysVisible: true,
          playerSpawnMarkerVisible: false,
          shortcutsOverlayVisible: true
        },
        shellActionKeybindings: createDefaultShellActionKeybindingState()
      })
    ).toThrow('shell-profile shell state field "debugOverlayVisible" must be boolean');

    expect(() =>
      decodeWorldSessionShellProfileEnvelope({
        kind: WORLD_SESSION_SHELL_PROFILE_KIND,
        version: WORLD_SESSION_SHELL_PROFILE_VERSION,
        shellState: createDefaultWorldSessionShellState(),
        shellActionKeybindings: {
          'return-to-main-menu': 'x',
          'recenter-camera': 'x',
          'toggle-debug-overlay': 'u',
          'toggle-debug-edit-controls': 'j',
          'toggle-debug-edit-overlays': 'k',
          'toggle-player-spawn-marker': 'y'
        }
      })
    ).toThrow('shell-profile shell hotkey "X" is assigned to both Main Menu and Recenter Camera');
  });
});
