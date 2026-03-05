import { describe, expect, it } from 'vitest';

import {
  createDefaultWorldSessionShellState,
  resolveWorldSessionShellStateAfterPausedMainMenuTransition
} from './mainWorldSessionShellState';

describe('resolveWorldSessionShellStateAfterPausedMainMenuTransition', () => {
  it('keeps shortcuts overlay visibility through paused-session pause and resume transitions', () => {
    const initial = {
      ...createDefaultWorldSessionShellState(false),
      shortcutsOverlayVisible: true
    };

    const paused = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      initial,
      'pause-to-main-menu',
      false
    );
    const resumed = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      paused,
      'resume-paused-world-session',
      false
    );

    expect(resumed.shortcutsOverlayVisible).toBe(true);
  });

  it('resets shortcuts overlay visibility to hidden when a fresh paused-menu world starts', () => {
    const pausedSessionState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: false,
      debugEditOverlaysVisible: false,
      playerSpawnMarkerVisible: false,
      shortcutsOverlayVisible: true
    };

    const freshWorldState = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      pausedSessionState,
      'start-fresh-world-session',
      false
    );

    expect(freshWorldState).toEqual(createDefaultWorldSessionShellState(false));
    expect(freshWorldState.shortcutsOverlayVisible).toBe(false);
  });
});
