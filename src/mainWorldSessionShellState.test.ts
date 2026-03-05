import { describe, expect, it } from 'vitest';

import {
  createDefaultWorldSessionShellState,
  resolveWorldSessionShellStateAfterPausedMainMenuTransition
} from './mainWorldSessionShellState';

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
      'pause-to-main-menu',
      false
    );
    const resumed = resolveWorldSessionShellStateAfterPausedMainMenuTransition(
      paused,
      'resume-paused-world-session',
      false
    );

    expect(resumed).toEqual(initial);
  });

  it('resets all in-world shell toggles to desktop first-start defaults when a fresh paused-menu world starts', () => {
    const pausedSessionState = {
      debugOverlayVisible: true,
      debugEditControlsVisible: true,
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
  });

  it('resets all in-world shell toggles to touch first-start defaults when a fresh paused-menu world starts', () => {
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
      true
    );

    expect(freshWorldState).toEqual(createDefaultWorldSessionShellState(true));
    expect(freshWorldState.debugEditControlsVisible).toBe(true);
  });
});
