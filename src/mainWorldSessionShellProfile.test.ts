import { describe, expect, it } from 'vitest';

import { createDefaultShellActionKeybindingState } from './input/shellActionKeybindings';
import { createDefaultWorldSessionShellState } from './mainWorldSessionShellState';
import {
  createWorldSessionShellProfileEnvelope,
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
