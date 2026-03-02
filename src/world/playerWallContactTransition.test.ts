import { describe, expect, it } from 'vitest';

import { createPlayerState, type PlayerCollisionContacts } from './playerState';
import { resolvePlayerWallContactTransitionEvent } from './playerWallContactTransition';

const contactsWithWall = (
  wall: PlayerCollisionContacts['wall']
): PlayerCollisionContacts => ({
  support: null,
  wall,
  ceiling: null
});

describe('resolvePlayerWallContactTransitionEvent', () => {
  it('returns null when wall-contact presence does not change', () => {
    const event = resolvePlayerWallContactTransitionEvent(
      contactsWithWall(null),
      createPlayerState({
        position: { x: 10, y: 0 },
        velocity: { x: 80, y: 0 },
        grounded: true
      }),
      contactsWithWall(null)
    );

    expect(event).toBeNull();
  });

  it('returns null when a wall contact persists on a different tile', () => {
    const event = resolvePlayerWallContactTransitionEvent(
      contactsWithWall({ tileX: 2, tileY: -1, tileId: 3 }),
      createPlayerState({
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true
      }),
      contactsWithWall({ tileX: 3, tileY: -1, tileId: 3 })
    );

    expect(event).toBeNull();
  });

  it('classifies wall-contact appearance as blocked', () => {
    const event = resolvePlayerWallContactTransitionEvent(
      contactsWithWall(null),
      createPlayerState({
        position: { x: 10, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true
      }),
      contactsWithWall({ tileX: 1, tileY: -1, tileId: 4 })
    );

    expect(event).toEqual({
      kind: 'blocked',
      tile: { x: 1, y: -1, id: 4 },
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 }
    });
  });

  it('classifies wall-contact clearing as cleared', () => {
    const event = resolvePlayerWallContactTransitionEvent(
      contactsWithWall({ tileX: -1, tileY: -1, tileId: 5 }),
      createPlayerState({
        position: { x: 12, y: 0 },
        velocity: { x: 90, y: 0 },
        grounded: true
      }),
      contactsWithWall(null)
    );

    expect(event).toEqual({
      kind: 'cleared',
      tile: { x: -1, y: -1, id: 5 },
      position: { x: 12, y: 0 },
      velocity: { x: 90, y: 0 }
    });
  });
});
