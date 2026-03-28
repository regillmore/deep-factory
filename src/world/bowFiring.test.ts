import { describe, expect, it } from 'vitest';

import { createPlayerState, getPlayerCameraFocusPoint } from './playerState';
import {
  cloneArrowProjectileState,
  createArrowProjectileState,
  createArrowProjectileStateFromBowFire,
  DEFAULT_BOW_ARROW_LIFETIME_SECONDS,
  DEFAULT_BOW_ARROW_RADIUS,
  DEFAULT_BOW_ARROW_SPEED,
  stepArrowProjectileState
} from './bowFiring';

describe('bowFiring', () => {
  it('creates an arrow projectile aimed from the player focus point toward the requested world point', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    expect(
      createArrowProjectileStateFromBowFire(playerState, {
        x: playerFocusPoint.x + 30,
        y: playerFocusPoint.y - 40
      })
    ).toEqual({
      position: playerFocusPoint,
      velocity: {
        x: DEFAULT_BOW_ARROW_SPEED * 0.6,
        y: DEFAULT_BOW_ARROW_SPEED * -0.8
      },
      radius: DEFAULT_BOW_ARROW_RADIUS,
      secondsRemaining: DEFAULT_BOW_ARROW_LIFETIME_SECONDS
    });
  });

  it('falls back to the current facing direction when the aim target sits on the player focus point', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'left'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    expect(createArrowProjectileStateFromBowFire(playerState, playerFocusPoint)).toEqual({
      position: playerFocusPoint,
      velocity: {
        x: -DEFAULT_BOW_ARROW_SPEED,
        y: 0
      },
      radius: DEFAULT_BOW_ARROW_RADIUS,
      secondsRemaining: DEFAULT_BOW_ARROW_LIFETIME_SECONDS
    });
  });

  it('advances arrow projectiles in a straight line and expires them when their lifetime runs out', () => {
    const initialState = createArrowProjectileState({
      position: { x: 10, y: 20 },
      velocity: { x: 60, y: -30 },
      radius: 3,
      secondsRemaining: 0.12
    });

    const steppedState = stepArrowProjectileState(initialState, {
      fixedDtSeconds: 0.05
    });

    expect(steppedState).toMatchObject({
      position: {
        x: 13,
        y: 18.5
      },
      velocity: {
        x: 60,
        y: -30
      },
      radius: 3
    });
    expect(steppedState?.secondsRemaining).toBeCloseTo(0.07, 8);
    expect(cloneArrowProjectileState(initialState)).toEqual(initialState);
    expect(
      stepArrowProjectileState(initialState, {
        fixedDtSeconds: 0.2
      })
    ).toBeNull();
  });
});
