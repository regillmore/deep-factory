import { describe, expect, it } from 'vitest';

import {
  cloneThrownBombState,
  createThrownBombState,
  createThrownBombStateFromThrow,
  stepThrownBombState
} from './bombThrowing';
import { createPlayerState, getPlayerCameraFocusPoint } from './playerState';

describe('bombThrowing', () => {
  it('creates a thrown-bomb state aimed from the player focus point toward the target', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    expect(
      createThrownBombStateFromThrow(
        playerState,
        {
          x: playerFocusPoint.x + 30,
          y: playerFocusPoint.y - 40
        },
        {
          speed: 200,
          radius: 5,
          fuseSeconds: 1.2
        }
      )
    ).toEqual({
      position: playerFocusPoint,
      velocity: {
        x: 120,
        y: -160
      },
      radius: 5,
      secondsRemaining: 1.2
    });
  });

  it('falls back to the current facing when the target sits on the player focus point', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'left'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    expect(
      createThrownBombStateFromThrow(
        playerState,
        playerFocusPoint,
        {
          speed: 90,
          radius: 6,
          fuseSeconds: 0.75
        }
      )
    ).toEqual({
      position: playerFocusPoint,
      velocity: {
        x: -90,
        y: 0
      },
      radius: 6,
      secondsRemaining: 0.75
    });
  });

  it('advances thrown bombs with fixed-step gravity and expires them when the fuse runs out', () => {
    const initialState = createThrownBombState({
      position: { x: 10, y: 20 },
      velocity: { x: 60, y: -30 },
      radius: 6,
      secondsRemaining: 0.12
    });

    const steppedState = stepThrownBombState(initialState, {
      fixedDtSeconds: 0.05,
      gravity: 100
    });

    expect(steppedState).not.toBeNull();
    expect(steppedState).toMatchObject({
      position: {
        x: 13,
        y: 18.75
      },
      velocity: {
        x: 60,
        y: -25
      },
      radius: 6
    });
    expect(steppedState?.secondsRemaining).toBeCloseTo(0.07, 8);
    expect(cloneThrownBombState(initialState)).toEqual(initialState);
    expect(
      stepThrownBombState(initialState, {
        fixedDtSeconds: 0.12,
        gravity: 100
      })
    ).toBeNull();
  });
});
