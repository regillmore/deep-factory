import type { PlayerFacing, PlayerState } from './playerState';

export type PlayerFacingTransitionKind = PlayerFacing;

export interface PlayerFacingTransitionEvent {
  kind: PlayerFacingTransitionKind;
  previousFacing: PlayerFacing;
  nextFacing: PlayerFacing;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export const resolvePlayerFacingTransitionEvent = (
  previousState: PlayerState,
  nextState: PlayerState
): PlayerFacingTransitionEvent | null => {
  if (previousState.facing === nextState.facing) {
    return null;
  }

  return {
    kind: nextState.facing,
    previousFacing: previousState.facing,
    nextFacing: nextState.facing,
    position: {
      x: nextState.position.x,
      y: nextState.position.y
    },
    velocity: {
      x: nextState.velocity.x,
      y: nextState.velocity.y
    }
  };
};
