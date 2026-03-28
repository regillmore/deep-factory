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
import { TileWorld } from './world';

const clearTileRect = (
  world: TileWorld,
  minTileX: number,
  maxTileX: number,
  minTileY: number,
  maxTileY: number
): void => {
  for (let worldTileY = minTileY; worldTileY <= maxTileY; worldTileY += 1) {
    for (let worldTileX = minTileX; worldTileX <= maxTileX; worldTileX += 1) {
      world.setTile(worldTileX, worldTileY, 0);
    }
  }
};

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

  it('despawns arrows on the first solid-terrain hit along their travel segment', () => {
    const world = new TileWorld(0);
    clearTileRect(world, -1, 6, -2, 1);
    world.setTile(2, 0, 1);
    const playerState = createPlayerState({
      position: { x: 8, y: 16 },
      facing: 'right'
    });

    expect(
      stepArrowProjectileState(
        createArrowProjectileStateFromBowFire(playerState, {
          x: 48,
          y: 8
        }),
        {
          world: {
            getTile: (worldTileX, worldTileY) => world.getTile(worldTileX, worldTileY)
          },
          fixedDtSeconds: 0.2
        }
      )
    ).toBeNull();
  });
});
