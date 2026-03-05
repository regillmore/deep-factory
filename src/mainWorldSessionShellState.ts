export interface WorldSessionShellState {
  debugOverlayVisible: boolean;
  debugEditControlsVisible: boolean;
  debugEditOverlaysVisible: boolean;
  playerSpawnMarkerVisible: boolean;
  shortcutsOverlayVisible: boolean;
}

export type PausedMainMenuWorldSessionShellTransition =
  | 'pause-to-main-menu'
  | 'resume-paused-world-session'
  | 'start-fresh-world-session';

export const createDefaultWorldSessionShellState = (
  touchControlsAvailable: boolean
): WorldSessionShellState => ({
  debugOverlayVisible: false,
  debugEditControlsVisible: touchControlsAvailable,
  debugEditOverlaysVisible: true,
  playerSpawnMarkerVisible: true,
  shortcutsOverlayVisible: false
});

export const resolveWorldSessionShellStateAfterPausedMainMenuTransition = (
  currentState: WorldSessionShellState,
  transition: PausedMainMenuWorldSessionShellTransition,
  touchControlsAvailable: boolean
): WorldSessionShellState => {
  if (transition === 'start-fresh-world-session') {
    return createDefaultWorldSessionShellState(touchControlsAvailable);
  }

  return currentState;
};
