import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED,
  DEFAULT_PASSIVE_BUNNY_HOP_VERTICAL_SPEED,
  stepPassiveBunnyState
} from './passiveBunnyLocomotion';
import {
  createPassiveBunnyState,
  DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS
} from './passiveBunnyState';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';
import { TileWorld } from './world';

const FIXED_DT_SECONDS = 1 / 60;

const setTiles = (
  world: TileWorld,
  minTileX: number,
  minTileY: number,
  maxTileX: number,
  maxTileY: number,
  tileId: number
): void => {
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      world.setTile(tileX, tileY, tileId);
    }
  }
};

const createFlatSurfaceWorld = (): TileWorld => {
  const world = new TileWorld(0);
  setTiles(world, -32, -16, 32, 16, 0);
  setTiles(world, -32, 0, 32, 0, 3);
  return world;
};

const createPlatformRunWorld = (minTileX: number, maxTileX: number): TileWorld => {
  const world = new TileWorld(0);
  setTiles(world, -32, -16, 32, 16, 0);
  setTiles(world, minTileX, 0, maxTileX, 0, STARTER_PLATFORM_TILE_ID);
  return world;
};

describe('passiveBunnyLocomotion', () => {
  it('counts down grounded hop timing and launches a wander hop in the current facing direction', () => {
    const world = createFlatSurfaceWorld();
    const waitingState = stepPassiveBunnyState(
      world,
      createPassiveBunnyState({
        position: { x: 0, y: 0 },
        hopCooldownTicksRemaining: 2,
        facing: 'right'
      }),
      FIXED_DT_SECONDS
    );

    expect(waitingState).toEqual({
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 14, height: 18 },
      grounded: true,
      facing: 'right',
      hopCooldownTicksRemaining: 1
    });

    const launchedState = stepPassiveBunnyState(world, waitingState, FIXED_DT_SECONDS);

    expect(launchedState.position.x).toBeCloseTo(
      DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS
    );
    expect(launchedState.position.y).toBeCloseTo(-4.5);
    expect(launchedState.velocity).toEqual({
      x: DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED,
      y: -(DEFAULT_PASSIVE_BUNNY_HOP_VERTICAL_SPEED - 30)
    });
    expect(launchedState.grounded).toBe(false);
    expect(launchedState.facing).toBe('right');
    expect(launchedState.hopCooldownTicksRemaining).toBe(DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS);
  });

  it('keeps the committed hop direction while airborne', () => {
    const world = createFlatSurfaceWorld();
    const nextState = stepPassiveBunnyState(
      world,
      createPassiveBunnyState({
        position: { x: 0, y: -20 },
        velocity: { x: DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED, y: -60 },
        grounded: false,
        facing: 'right'
      }),
      FIXED_DT_SECONDS
    );

    expect(nextState.facing).toBe('right');
    expect(nextState.velocity).toEqual({
      x: DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED,
      y: -30
    });
    expect(nextState.position.x).toBeCloseTo(
      DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS
    );
    expect(nextState.position.y).toBeCloseTo(-20.5);
    expect(nextState.grounded).toBe(false);
  });

  it('lands on one-way platforms from above', () => {
    const world = createPlatformRunWorld(2, 2);

    const nextState = stepPassiveBunnyState(
      world,
      createPassiveBunnyState({
        position: { x: 40, y: -1 },
        velocity: { x: DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED, y: 60 },
        grounded: false,
        facing: 'right',
        hopCooldownTicksRemaining: 4
      }),
      FIXED_DT_SECONDS
    );

    expect(nextState).toEqual({
      position: { x: 41.2, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 14, height: 18 },
      grounded: true,
      facing: 'right',
      hopCooldownTicksRemaining: 4
    });
  });

  it('keeps platform runs as valid ground support instead of turning away early', () => {
    const world = createPlatformRunWorld(0, 2);

    const nextState = stepPassiveBunnyState(
      world,
      createPassiveBunnyState({
        position: { x: 8, y: 0 },
        facing: 'right',
        hopCooldownTicksRemaining: 2
      }),
      FIXED_DT_SECONDS
    );

    expect(nextState).toEqual({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 14, height: 18 },
      grounded: true,
      facing: 'right',
      hopCooldownTicksRemaining: 1
    });
  });

  it('turns around and launches away from a ledge instead of hopping off it', () => {
    const world = new TileWorld(0);
    setTiles(world, -32, -16, 0, 16, 0);
    setTiles(world, -32, 0, 0, 0, 3);

    const nextState = stepPassiveBunnyState(
      world,
      createPassiveBunnyState({
        position: { x: 8, y: 0 },
        facing: 'right',
        hopCooldownTicksRemaining: 1
      }),
      FIXED_DT_SECONDS
    );

    expect(nextState.position.x).toBeCloseTo(
      8 - DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS
    );
    expect(nextState.position.y).toBeCloseTo(-4.5);
    expect(nextState.velocity).toEqual({
      x: -DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED,
      y: -(DEFAULT_PASSIVE_BUNNY_HOP_VERTICAL_SPEED - 30)
    });
    expect(nextState.grounded).toBe(false);
    expect(nextState.facing).toBe('left');
  });

  it('turns around at the end of a placed platform run instead of hopping off it', () => {
    const world = createPlatformRunWorld(0, 1);

    const nextState = stepPassiveBunnyState(
      world,
      createPassiveBunnyState({
        position: { x: 24, y: 0 },
        facing: 'right',
        hopCooldownTicksRemaining: 1
      }),
      FIXED_DT_SECONDS
    );

    expect(nextState.position.x).toBeCloseTo(
      24 - DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS
    );
    expect(nextState.position.y).toBeCloseTo(-4.5);
    expect(nextState.velocity).toEqual({
      x: -DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED,
      y: -(DEFAULT_PASSIVE_BUNNY_HOP_VERTICAL_SPEED - 30)
    });
    expect(nextState.grounded).toBe(false);
    expect(nextState.facing).toBe('left');
  });

  it('turns around and launches away from a blocking wall', () => {
    const world = createFlatSurfaceWorld();
    world.setTile(1, -1, 3);

    const nextState = stepPassiveBunnyState(
      world,
      createPassiveBunnyState({
        position: { x: 8, y: 0 },
        facing: 'right',
        hopCooldownTicksRemaining: 1
      }),
      FIXED_DT_SECONDS
    );

    expect(nextState.position.x).toBeCloseTo(
      8 - DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS
    );
    expect(nextState.position.y).toBeCloseTo(-4.5);
    expect(nextState.velocity).toEqual({
      x: -DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED,
      y: -(DEFAULT_PASSIVE_BUNNY_HOP_VERTICAL_SPEED - 30)
    });
    expect(nextState.grounded).toBe(false);
    expect(nextState.facing).toBe('left');
  });
});
