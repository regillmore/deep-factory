import { describe, expect, it } from 'vitest';

import { findPlayerSpawnPoint } from './playerSpawn';
import {
  createPlayerState,
  createPlayerStateFromSpawn,
  DEFAULT_PLAYER_AIR_ACCELERATION,
  DEFAULT_PLAYER_GROUND_ACCELERATION,
  DEFAULT_PLAYER_GROUND_DECELERATION,
  DEFAULT_PLAYER_GRAVITY_ACCELERATION,
  DEFAULT_PLAYER_HEIGHT,
  DEFAULT_PLAYER_JUMP_SPEED,
  DEFAULT_PLAYER_MAX_FALL_SPEED,
  DEFAULT_PLAYER_MAX_WALK_SPEED,
  DEFAULT_PLAYER_WIDTH,
  getPlayerCameraFocusPoint,
  getPlayerAabb,
  integratePlayerState,
  movePlayerStateWithCollisions,
  respawnPlayerStateAtSpawnIfEmbeddedInSolid,
  stepPlayerState,
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

  it('respawns from the latest resolved spawn when debug edits embed the player in solid tiles', () => {
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

    const embedded = createPlayerState({
      position: { x: 8, y: 0 },
      velocity: { x: -24, y: 60 },
      grounded: false,
      facing: 'left'
    });
    world.setTile(0, -1, 3);

    const recovered = respawnPlayerStateAtSpawnIfEmbeddedInSolid(world, embedded, spawn);

    expect(recovered).toEqual({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: true,
      facing: 'left'
    });
  });

  it('leaves the player state unchanged when no solid overlap or fallback spawn exists', () => {
    const world = new TileWorld(0);
    const clearState = createPlayerState({
      position: { x: 8, y: -16 },
      velocity: { x: 18, y: 0 },
      grounded: false,
      facing: 'left'
    });

    expect(respawnPlayerStateAtSpawnIfEmbeddedInSolid(world, clearState, null)).toBe(clearState);

    world.setTile(0, -1, 3);

    const embeddedState = createPlayerState({
      position: { x: 8, y: 0 },
      velocity: { x: 18, y: 0 },
      grounded: false,
      facing: 'left'
    });

    expect(respawnPlayerStateAtSpawnIfEmbeddedInSolid(world, embeddedState, null)).toBe(embeddedState);
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

  it('derives the camera follow focus point from the player body center', () => {
    const state = createPlayerState({
      position: { x: 24, y: -8 },
      size: { width: 10, height: 20 }
    });

    expect(getPlayerCameraFocusPoint(state)).toEqual({
      x: 24,
      y: -18
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

  it('accelerates grounded movement toward the requested walk speed before collision stepping', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -2, 5, 2, 0);
    setTiles(world, -3, 0, 5, 0, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        grounded: true
      }),
      0.25,
      { moveX: 1 },
      {
        maxWalkSpeed: 40,
        groundAcceleration: 160,
        airAcceleration: 80,
        groundDeceleration: 80,
        jumpSpeed: 100,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual({
      position: { x: 18, y: 0 },
      velocity: { x: 40, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    });
  });

  it('reuses collision sweeps for walk input so a blocking wall zeroes horizontal velocity', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -2, 5, 2, 0);
    setTiles(world, -3, 0, 5, 0, 3);
    world.setTile(1, -1, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        grounded: true
      }),
      0.5,
      { moveX: 1 },
      {
        maxWalkSpeed: 40,
        groundAcceleration: 160,
        airAcceleration: 80,
        groundDeceleration: 80,
        jumpSpeed: 100,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual({
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    });
  });

  it('applies a grounded jump impulse before gravity so the player leaves support immediately', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -4, 5, 2, 0);
    setTiles(world, -3, 0, 5, 0, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        grounded: true
      }),
      0.25,
      { jumpPressed: true },
      {
        maxWalkSpeed: 40,
        groundAcceleration: 160,
        airAcceleration: 80,
        groundDeceleration: 80,
        jumpSpeed: 100,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual({
      position: { x: 8, y: -20 },
      velocity: { x: 0, y: -80 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    });
  });

  it('does not reapply the jump impulse while airborne', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -4, 5, 2, 0);
    setTiles(world, -3, 0, 5, 0, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -20 },
        velocity: { x: 0, y: -80 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { jumpPressed: true },
      {
        maxWalkSpeed: 40,
        groundAcceleration: 160,
        airAcceleration: 80,
        groundDeceleration: 80,
        jumpSpeed: 100,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual({
      position: { x: 8, y: -35 },
      velocity: { x: 0, y: -60 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    });
  });

  it('applies grounded braking when no horizontal movement intent is present', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -2, 5, 2, 0);
    setTiles(world, -3, 0, 5, 0, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 40, y: 0 },
        size: { width: 12, height: 12 },
        grounded: true
      }),
      0.25,
      {},
      {
        maxWalkSpeed: 40,
        groundAcceleration: 160,
        airAcceleration: 80,
        groundDeceleration: 80,
        jumpSpeed: 100,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual({
      position: { x: 13, y: 0 },
      velocity: { x: 20, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
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
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {
        moveX: Number.NaN
      })
    ).toThrowError(/intent\.moveX must be a finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        maxWalkSpeed: -DEFAULT_PLAYER_MAX_WALK_SPEED
      })
    ).toThrowError(/options\.maxWalkSpeed must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        groundAcceleration: -DEFAULT_PLAYER_GROUND_ACCELERATION
      })
    ).toThrowError(/options\.groundAcceleration must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        airAcceleration: -DEFAULT_PLAYER_AIR_ACCELERATION
      })
    ).toThrowError(/options\.airAcceleration must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        groundDeceleration: -DEFAULT_PLAYER_GROUND_DECELERATION
      })
    ).toThrowError(/options\.groundDeceleration must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        jumpSpeed: -DEFAULT_PLAYER_JUMP_SPEED
      })
    ).toThrowError(/options\.jumpSpeed must be a non-negative finite number/);
  });
});
