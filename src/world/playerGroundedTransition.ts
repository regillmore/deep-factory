import type { PlayerMovementIntent, PlayerState } from './playerState';

export type PlayerGroundedTransitionKind = 'jump' | 'fall' | 'landing';

export interface PlayerGroundedTransitionEvent {
  kind: PlayerGroundedTransitionKind;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export const resolvePlayerGroundedTransitionEvent = (
  previousState: PlayerState,
  nextState: PlayerState,
  intent: PlayerMovementIntent = {}
): PlayerGroundedTransitionEvent | null => {
  if (previousState.grounded === nextState.grounded) {
    return null;
  }

  return {
    kind:
      previousState.grounded && !nextState.grounded
        ? intent.jumpPressed === true
          ? 'jump'
          : 'fall'
        : 'landing',
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
