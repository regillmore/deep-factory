import { describe, expect, it } from 'vitest';

import { resolvePlayerFacingTransitionEvent } from './playerFacingTransition';
import { createPlayerState } from './playerState';

describe('resolvePlayerFacingTransitionEvent', () => {
  it('returns null when facing does not change between fixed steps', () => {
    const event = resolvePlayerFacingTransitionEvent(
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 40, y: 0 },
        grounded: true,
        facing: 'right'
      }),
      createPlayerState({
        position: { x: 12, y: 0 },
        velocity: { x: 0, y: 0 },
        grounded: true,
        facing: 'right'
      })
    );

    expect(event).toBeNull();
  });

  it('reports right-to-left facing flips from the next fixed-step state', () => {
    const event = resolvePlayerFacingTransitionEvent(
      createPlayerState({
        position: { x: 24, y: -8 },
        velocity: { x: 120, y: 0 },
        facing: 'right'
      }),
      createPlayerState({
        position: { x: 20, y: -8 },
        velocity: { x: -80, y: 30 },
        facing: 'left'
      })
    );

    expect(event).toEqual({
      kind: 'left',
      previousFacing: 'right',
      nextFacing: 'left',
      position: { x: 20, y: -8 },
      velocity: { x: -80, y: 30 }
    });
  });

  it('reports left-to-right facing flips from the next fixed-step state', () => {
    const event = resolvePlayerFacingTransitionEvent(
      createPlayerState({
        position: { x: 20, y: -8 },
        velocity: { x: -80, y: 30 },
        facing: 'left'
      }),
      createPlayerState({
        position: { x: 24, y: -8 },
        velocity: { x: 100, y: 0 },
        facing: 'right'
      })
    );

    expect(event).toEqual({
      kind: 'right',
      previousFacing: 'left',
      nextFacing: 'right',
      position: { x: 24, y: -8 },
      velocity: { x: 100, y: 0 }
    });
  });
});
