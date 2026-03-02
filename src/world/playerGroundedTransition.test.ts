import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import { resolvePlayerGroundedTransitionEvent } from './playerGroundedTransition';

describe('resolvePlayerGroundedTransitionEvent', () => {
  it('returns null when grounded state does not change', () => {
    const event = resolvePlayerGroundedTransitionEvent(
      createPlayerState({
        position: { x: 8, y: 0 },
        grounded: true
      }),
      createPlayerState({
        position: { x: 10, y: 0 },
        velocity: { x: 20, y: 0 },
        grounded: true
      }),
      { moveX: 1 }
    );

    expect(event).toBeNull();
  });

  it('classifies grounded jump takeoff transitions', () => {
    const event = resolvePlayerGroundedTransitionEvent(
      createPlayerState({
        position: { x: 8, y: 0 },
        grounded: true
      }),
      createPlayerState({
        position: { x: 8, y: -20 },
        velocity: { x: 0, y: -80 },
        grounded: false
      }),
      { jumpPressed: true }
    );

    expect(event).toEqual({
      kind: 'jump',
      position: { x: 8, y: -20 },
      velocity: { x: 0, y: -80 }
    });
  });

  it('classifies grounded ledge-drop transitions as falls', () => {
    const event = resolvePlayerGroundedTransitionEvent(
      createPlayerState({
        position: { x: 8, y: 0 },
        grounded: true
      }),
      createPlayerState({
        position: { x: 12, y: 4 },
        velocity: { x: 40, y: 60 },
        grounded: false
      }),
      { moveX: 1, jumpPressed: false }
    );

    expect(event).toEqual({
      kind: 'fall',
      position: { x: 12, y: 4 },
      velocity: { x: 40, y: 60 }
    });
  });

  it('classifies airborne-to-ground transitions as landings', () => {
    const event = resolvePlayerGroundedTransitionEvent(
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 120 },
        grounded: false
      }),
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true
      })
    );

    expect(event).toEqual({
      kind: 'landing',
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 }
    });
  });
});
