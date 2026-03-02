import { describe, expect, it } from 'vitest';

import { createPlayerState, type PlayerCollisionContacts } from './playerState';
import { resolvePlayerCeilingContactTransitionEvent } from './playerCeilingContactTransition';

const contactsWithCeiling = (
  ceiling: PlayerCollisionContacts['ceiling']
): PlayerCollisionContacts => ({
  support: null,
  wall: null,
  ceiling
});

describe('resolvePlayerCeilingContactTransitionEvent', () => {
  it('returns null when ceiling-contact presence does not change', () => {
    const event = resolvePlayerCeilingContactTransitionEvent(
      contactsWithCeiling(null),
      createPlayerState({
        position: { x: 10, y: 0 },
        velocity: { x: 0, y: -80 },
        grounded: false
      }),
      contactsWithCeiling(null)
    );

    expect(event).toBeNull();
  });

  it('returns null when a ceiling contact persists on a different tile', () => {
    const event = resolvePlayerCeilingContactTransitionEvent(
      contactsWithCeiling({ tileX: 2, tileY: -3, tileId: 3 }),
      createPlayerState({
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: false
      }),
      contactsWithCeiling({ tileX: 3, tileY: -3, tileId: 3 })
    );

    expect(event).toBeNull();
  });

  it('classifies ceiling-contact appearance as blocked', () => {
    const event = resolvePlayerCeilingContactTransitionEvent(
      contactsWithCeiling(null),
      createPlayerState({
        position: { x: 10, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: false
      }),
      contactsWithCeiling({ tileX: 1, tileY: -3, tileId: 4 })
    );

    expect(event).toEqual({
      kind: 'blocked',
      tile: { x: 1, y: -3, id: 4 },
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 }
    });
  });

  it('classifies ceiling-contact clearing as cleared', () => {
    const event = resolvePlayerCeilingContactTransitionEvent(
      contactsWithCeiling({ tileX: -1, tileY: -4, tileId: 5 }),
      createPlayerState({
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: -90 },
        grounded: false
      }),
      contactsWithCeiling(null)
    );

    expect(event).toEqual({
      kind: 'cleared',
      tile: { x: -1, y: -4, id: 5 },
      position: { x: 12, y: 0 },
      velocity: { x: 0, y: -90 }
    });
  });
});
