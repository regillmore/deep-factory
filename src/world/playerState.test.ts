import { describe, expect, it } from 'vitest';

import { findPlayerSpawnPoint } from './playerSpawn';
import {
  createPlayerState,
  createPlayerStateFromSpawn,
  DEFAULT_PLAYER_GRAVITY_ACCELERATION,
  DEFAULT_PLAYER_HEIGHT,
  DEFAULT_PLAYER_MAX_FALL_SPEED,
  DEFAULT_PLAYER_WIDTH,
  getPlayerAabb,
  integratePlayerState,
  movePlayerStateWithCollisions,
  stepPlayerStateWithGravity
} from './playerState';
import { TileWorld } from './world';

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

describe('playerState', () => {
  it('creates a grounded standing player state from resolved spawn output', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -6, 3, 3, 0);
    setTiles(world, -1, 0, 1, 0, 3);

    const spawn = findPlayerSpawnPoint(world, {
      width: DEFAULT_PLAYER_WIDTH,
      height: DEFAULT_PLAYER_HEIGHT,
      maxHorizontalOffsetTiles: 2,
      maxVerticalOffsetTiles: 2
    });

    expect(spawn).not.toBeNull();

    const state = createPlayerStateFromSpawn(spawn!);

    expect(state).toEqual({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: true,
      facing: 'right'
    });
    expect(getPlayerAabb(state)).toEqual(spawn!.aabb);
  });

  it('derives a collision AABB from feet-centered position and explicit size', () => {
    const state = createPlayerState({
      position: { x: 24, y: -8 },
      size: { width: 10, height: 20 }
    });

    expect(getPlayerAabb(state)).toEqual({
      minX: 19,
      minY: -28,
      maxX: 29,
      maxY: -8
    });
  });

  it('advances position from velocity over one fixed step without mutating the input state', () => {
    const initial = createPlayerState({
      position: { x: 10, y: 20 },
      velocity: { x: 24, y: -40 },
      grounded: true
    });

    const stepped = integratePlayerState(initial, 0.25);

    expect(stepped).toEqual({
      position: { x: 16, y: 10 },
      velocity: { x: 24, y: -40 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: false,
      facing: 'right'
    });
    expect(initial).toEqual({
      position: { x: 10, y: 20 },
      velocity: { x: 24, y: -40 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: false,
      facing: 'right'
    });
  });

  it('tracks facing from horizontal velocity and preserves the last facing while idle', () => {
    const movingLeft = createPlayerState({
      velocity: { x: -12, y: 0 },
      grounded: true
    });

    expect(movingLeft.facing).toBe('left');

    const idle = integratePlayerState(
      createPlayerState({
        facing: 'left',
        grounded: true
      }),
      1 / 60
    );

    expect(idle.facing).toBe('left');
    expect(idle.grounded).toBe(true);
  });

  it('sweeps horizontally into a wall tile and zeroes blocked horizontal velocity', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -2, 2, 1, 0);
    world.setTile(1, -1, 3);

    const stepped = movePlayerStateWithCollisions(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 20, y: 0 },
        size: { width: 12, height: 12 },
        facing: 'left',
        grounded: true
      }),
      0.5
    );

    expect(stepped).toEqual({
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    });
  });

  it('lands on solid ground and marks the player as grounded', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -2, 2, 1, 0);
    world.setTile(0, 0, 3);

    const stepped = movePlayerStateWithCollisions(
      world,
      createPlayerState({
        position: { x: 8, y: -2 },
        velocity: { x: 0, y: 20 },
        size: { width: 12, height: 12 }
      }),
      0.5
    );

    expect(stepped).toEqual({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    });
  });

  it('clamps upward movement against a ceiling tile without reporting grounded support', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 1, 0);
    world.setTile(0, -2, 3);

    const stepped = movePlayerStateWithCollisions(
      world,
      createPlayerState({
        position: { x: 8, y: -2 },
        velocity: { x: 0, y: -20 },
        size: { width: 12, height: 12 }
      }),
      0.5
    );

    expect(stepped).toEqual({
      position: { x: 8, y: -4 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    });
  });

  it('recomputes grounded from post-move support so horizontal movement can walk off ledges', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -2, 3, 1, 0);
    world.setTile(0, 0, 3);

    const stepped = movePlayerStateWithCollisions(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 32, y: 0 },
        size: { width: 12, height: 12 },
        grounded: true
      }),
      0.5
    );

    expect(stepped).toEqual({
      position: { x: 24, y: 0 },
      velocity: { x: 32, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    });
  });

  it('applies gravity before collision stepping so unsupported players start falling immediately', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -2, 2, 2, 0);

    const stepped = stepPlayerStateWithGravity(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { gravityAcceleration: 80, maxFallSpeed: 120 }
    );

    expect(stepped).toEqual({
      position: { x: 8, y: -11 },
      velocity: { x: 0, y: 20 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    });
  });

  it('keeps grounded players resting on support while gravity is active', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -2, 2, 2, 0);
    world.setTile(0, 0, 3);

    const stepped = stepPlayerStateWithGravity(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        grounded: true
      }),
      1 / 60,
      { gravityAcceleration: 120, maxFallSpeed: 200 }
    );

    expect(stepped).toEqual({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    });
  });

  it('clamps downward speed before collision stepping when gravity would exceed the fall-speed cap', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -2, 2, 4, 0);

    const stepped = stepPlayerStateWithGravity(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 500 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { gravityAcceleration: 80, maxFallSpeed: 120 }
    );

    expect(stepped).toEqual({
      position: { x: 8, y: 14 },
      velocity: { x: 0, y: 120 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    });
  });

  it('rejects invalid size and fixed-step durations', () => {
    expect(() =>
      createPlayerState({
        size: { width: 0, height: DEFAULT_PLAYER_HEIGHT }
      })
    ).toThrowError(/size\.width must be a positive finite number/);

    expect(() => integratePlayerState(createPlayerState(), -1 / 60)).toThrowError(
      /fixedDtSeconds must be a non-negative finite number/
    );
    expect(() =>
      movePlayerStateWithCollisions(new TileWorld(0), createPlayerState(), -1 / 60)
    ).toThrowError(/fixedDtSeconds must be a non-negative finite number/);
    expect(() =>
      stepPlayerStateWithGravity(new TileWorld(0), createPlayerState(), 1 / 60, {
        gravityAcceleration: -DEFAULT_PLAYER_GRAVITY_ACCELERATION
      })
    ).toThrowError(/options\.gravityAcceleration must be a non-negative finite number/);
    expect(() =>
      stepPlayerStateWithGravity(new TileWorld(0), createPlayerState(), 1 / 60, {
        maxFallSpeed: -DEFAULT_PLAYER_MAX_FALL_SPEED
      })
    ).toThrowError(/options\.maxFallSpeed must be a non-negative finite number/);
  });
});
