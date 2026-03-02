import type { PlayerCollisionContacts, PlayerState } from './playerState';

export type PlayerCeilingContactTransitionKind = 'blocked' | 'cleared';

export interface PlayerCeilingContactTransitionEvent {
  kind: PlayerCeilingContactTransitionKind;
  tile: { x: number; y: number; id: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export const resolvePlayerCeilingContactTransitionEvent = (
  previousContacts: PlayerCollisionContacts,
  nextState: PlayerState,
  nextContacts: PlayerCollisionContacts
): PlayerCeilingContactTransitionEvent | null => {
  const previousCeiling = previousContacts.ceiling;
  const nextCeiling = nextContacts.ceiling;

  if ((previousCeiling === null) === (nextCeiling === null)) {
    return null;
  }

  const relevantCeiling = nextCeiling ?? previousCeiling;
  if (!relevantCeiling) {
    return null;
  }

  return {
    kind: nextCeiling ? 'blocked' : 'cleared',
    tile: {
      x: relevantCeiling.tileX,
      y: relevantCeiling.tileY,
      id: relevantCeiling.tileId
    },
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
