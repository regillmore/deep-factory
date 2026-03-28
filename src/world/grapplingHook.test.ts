import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import {
  clearGrapplingHookState,
  cloneGrapplingHookState,
  createGrapplingHookState,
  createIdleGrapplingHookState,
  isGrapplingHookActive,
  tryFireGrapplingHook
} from './grapplingHook';

describe('grapplingHook', () => {
  it('starts an active hook state from player aim and clones it safely', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });

    const fireResult = tryFireGrapplingHook(
      playerState,
      createIdleGrapplingHookState(),
      {
        x: 96,
        y: -12
      }
    );

    expect(fireResult).toEqual({
      nextState: {
        kind: 'fired',
        originWorldPoint: { x: 8, y: 14 },
        targetWorldPoint: { x: 96, y: -12 }
      },
      hookFired: true,
      blockedReason: null
    });
    expect(isGrapplingHookActive(fireResult.nextState)).toBe(true);

    const clonedState = cloneGrapplingHookState(fireResult.nextState);
    if (clonedState.kind !== 'fired') {
      throw new Error('expected a fired grappling-hook state');
    }
    clonedState.originWorldPoint.x += 10;
    expect(fireResult.nextState).toEqual({
      kind: 'fired',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 96, y: -12 }
    });
  });

  it('blocks dead players and already-active hooks without mutating the source state', () => {
    const firedState = createGrapplingHookState({
      kind: 'fired',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 96, y: -12 }
    });

    expect(
      tryFireGrapplingHook(
        createPlayerState({
          position: { x: 8, y: 28 },
          health: 0
        }),
        createIdleGrapplingHookState(),
        { x: 24, y: 14 }
      )
    ).toEqual({
      nextState: createIdleGrapplingHookState(),
      hookFired: false,
      blockedReason: 'dead'
    });

    const blockedWhileActive = tryFireGrapplingHook(
      createPlayerState({
        position: { x: 8, y: 28 },
        facing: 'left'
      }),
      firedState,
      { x: -24, y: 14 }
    );

    expect(blockedWhileActive).toEqual({
      nextState: firedState,
      hookFired: false,
      blockedReason: 'active-hook'
    });
    expect(blockedWhileActive.nextState).not.toBe(firedState);
    expect(clearGrapplingHookState()).toEqual(createIdleGrapplingHookState());
  });
});
