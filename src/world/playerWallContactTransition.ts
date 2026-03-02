import type { PlayerCollisionContacts, PlayerState } from './playerState';

export type PlayerWallContactTransitionKind = 'blocked' | 'cleared';

export interface PlayerWallContactTransitionEvent {
  kind: PlayerWallContactTransitionKind;
  tile: { x: number; y: number; id: number };
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export const resolvePlayerWallContactTransitionEvent = (
  previousContacts: PlayerCollisionContacts,
  nextState: PlayerState,
  nextContacts: PlayerCollisionContacts
): PlayerWallContactTransitionEvent | null => {
  const previousWall = previousContacts.wall;
  const nextWall = nextContacts.wall;

  if ((previousWall === null) === (nextWall === null)) {
    return null;
  }

  const relevantWall = nextWall ?? previousWall;
  if (!relevantWall) {
    return null;
  }

  return {
    kind: nextWall ? 'blocked' : 'cleared',
    tile: {
      x: relevantWall.tileX,
      y: relevantWall.tileY,
      id: relevantWall.tileId
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
