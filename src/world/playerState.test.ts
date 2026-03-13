import { describe, expect, it } from 'vitest';

import { findPlayerSpawnPoint } from './playerSpawn';
import {
  clonePlayerState,
  createPlayerState,
  createPlayerStateFromSpawn,
  DEFAULT_PLAYER_AIR_ACCELERATION,
  DEFAULT_PLAYER_BREATH_RECOVERY_PER_SECOND,
  DEFAULT_PLAYER_DROWNING_DAMAGE_PER_TICK,
  DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS,
  DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED,
  DEFAULT_PLAYER_FALL_DAMAGE_SPEED_PER_HEALTH,
  DEFAULT_PLAYER_GROUND_ACCELERATION,
  DEFAULT_PLAYER_GROUND_DECELERATION,
  DEFAULT_PLAYER_GRAVITY_ACCELERATION,
  DEFAULT_PLAYER_HEIGHT,
  DEFAULT_PLAYER_JUMP_SPEED,
  DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_LAVA_DAMAGE_PER_TICK,
  DEFAULT_PLAYER_MAX_BREATH_SECONDS,
  DEFAULT_PLAYER_MAX_HEALTH,
  DEFAULT_PLAYER_MAX_FALL_SPEED,
  DEFAULT_PLAYER_MAX_WALK_SPEED,
  DEFAULT_PLAYER_WATER_BUOYANCY_ACCELERATION,
  DEFAULT_PLAYER_WATER_HORIZONTAL_DRAG_PER_SECOND,
  DEFAULT_PLAYER_WATER_VERTICAL_DRAG_PER_SECOND,
  DEFAULT_PLAYER_WIDTH,
  getPlayerCameraFocusPoint,
  getPlayerCollisionContacts,
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

const withDefaultPlayerVitals = <T extends object>(state: T): T & {
  health: number;
  breathSecondsRemaining: number;
  lavaDamageTickSecondsRemaining: number;
  drowningDamageTickSecondsRemaining: number;
  fallDamageRecoverySecondsRemaining: number;
} => ({
  ...state,
  health: DEFAULT_PLAYER_MAX_HEALTH,
  breathSecondsRemaining: DEFAULT_PLAYER_MAX_BREATH_SECONDS,
  lavaDamageTickSecondsRemaining: DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
  drowningDamageTickSecondsRemaining: DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
  fallDamageRecoverySecondsRemaining: 0
});

const WATER_TILE_ID = 7;
const LAVA_TILE_ID = 8;

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

    expect(state).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: true,
      facing: 'right'
    }));
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

    expect(recovered).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: true,
      facing: 'left'
    }));
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

  it('clones player state into detached nested vectors for entity render snapshots', () => {
    const state = createPlayerState({
      position: { x: 24, y: -8 },
      velocity: { x: -12, y: 36 },
      size: { width: 10, height: 20 },
      grounded: true,
      facing: 'left',
      health: 75,
      breathSecondsRemaining: 3.5,
      lavaDamageTickSecondsRemaining: 0.125,
      drowningDamageTickSecondsRemaining: 0.4,
      fallDamageRecoverySecondsRemaining: 0.2
    });

    const cloned = clonePlayerState(state);

    expect(cloned).toEqual(state);
    expect(cloned).not.toBe(state);
    expect(cloned.position).not.toBe(state.position);
    expect(cloned.velocity).not.toBe(state.velocity);
    expect(cloned.size).not.toBe(state.size);
  });

  it('reports support, wall, and ceiling contacts adjacent to the current player AABB', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, 0, 3);
    world.setTile(1, -1, 3);
    world.setTile(0, -2, 3);

    const contacts = getPlayerCollisionContacts(
      world,
      createPlayerState({
        position: { x: 10, y: 0 },
        size: { width: 12, height: 16 },
        grounded: true,
        facing: 'right'
      })
    );

    expect(contacts).toEqual({
      support: { tileX: 0, tileY: 0, tileId: 3 },
      wall: { tileX: 1, tileY: -1, tileId: 3, side: 'right' },
      ceiling: { tileX: 0, tileY: -2, tileId: 3 }
    });
  });

  it('tags fallback wall probes with the actual blocking side instead of the preferred facing side', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(-1, -1, 3);

    const contacts = getPlayerCollisionContacts(
      world,
      createPlayerState({
        position: { x: 6, y: 0 },
        size: { width: 12, height: 16 },
        grounded: false,
        facing: 'right'
      })
    );

    expect(contacts.wall).toEqual({ tileX: -1, tileY: -1, tileId: 3, side: 'left' });
  });

  it('returns null contacts when no adjacent blocking tiles are present', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);

    const contacts = getPlayerCollisionContacts(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        size: { width: 12, height: 16 },
        grounded: true,
        facing: 'right'
      })
    );

    expect(contacts).toEqual({
      support: null,
      wall: null,
      ceiling: null
    });
  });

  it('advances position from velocity over one fixed step without mutating the input state', () => {
    const initial = createPlayerState({
      position: { x: 10, y: 20 },
      velocity: { x: 24, y: -40 },
      grounded: true
    });

    const stepped = integratePlayerState(initial, 0.25);

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 16, y: 10 },
      velocity: { x: 24, y: -40 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: false,
      facing: 'right'
    }));
    expect(initial).toEqual(withDefaultPlayerVitals({
      position: { x: 10, y: 20 },
      velocity: { x: 24, y: -40 },
      size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
      grounded: false,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -4 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 24, y: 0 },
      velocity: { x: 32, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -11 },
      velocity: { x: 0, y: 20 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 18, y: 0 },
      velocity: { x: 40, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 10, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -20 },
      velocity: { x: 0, y: -80 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -35 },
      velocity: { x: 0, y: -60 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 13, y: 0 },
      velocity: { x: 20, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    }));
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

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: 14 },
      velocity: { x: 0, y: 120 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('does not apply fall damage when the landing speed stays at or below the safe threshold', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, 0, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -20 },
        velocity: { x: 0, y: DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED },
        size: { width: 12, height: 12 }
      }),
      0.1,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    expect(stepped.health).toBe(DEFAULT_PLAYER_MAX_HEALTH);
    expect(stepped.fallDamageRecoverySecondsRemaining).toBe(0);
    expect(stepped.grounded).toBe(true);
  });

  it('applies hard-landing damage, clamps nonlethal falls to one health, and starts fall recovery', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, 0, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -20 },
        velocity: {
          x: 0,
          y:
            DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED +
            DEFAULT_PLAYER_FALL_DAMAGE_SPEED_PER_HEALTH * 3
        },
        size: { width: 12, height: 12 },
        health: 2
      }),
      0.1,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    expect(stepped.health).toBe(1);
    expect(stepped.fallDamageRecoverySecondsRemaining).toBe(
      DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS
    );
    expect(stepped.grounded).toBe(true);
  });

  it('skips repeated hard-landing damage while fall recovery is still active, then damages again after it expires', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, 0, 3);

    const invulnerableLanding = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -20 },
        velocity: {
          x: 0,
          y:
            DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED +
            DEFAULT_PLAYER_FALL_DAMAGE_SPEED_PER_HEALTH
        },
        size: { width: 12, height: 12 },
        grounded: false,
        health: 80,
        fallDamageRecoverySecondsRemaining: 0.2
      }),
      0.1,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    expect(invulnerableLanding.health).toBe(80);
    expect(invulnerableLanding.fallDamageRecoverySecondsRemaining).toBeCloseTo(0.1, 6);

    const vulnerableLanding = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -20 },
        velocity: {
          x: 0,
          y:
            DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED +
            DEFAULT_PLAYER_FALL_DAMAGE_SPEED_PER_HEALTH
        },
        size: { width: 12, height: 12 },
        grounded: false,
        health: invulnerableLanding.health,
        fallDamageRecoverySecondsRemaining: 0.05
      }),
      0.1,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    expect(vulnerableLanding.health).toBe(79);
    expect(vulnerableLanding.fallDamageRecoverySecondsRemaining).toBe(
      DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS
    );
  });

  it('applies water buoyancy before collision stepping when the player is submerged', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, -1, WATER_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      {},
      {
        gravityAcceleration: 80,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        waterBuoyancyAcceleration: 120,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(stepped).toEqual({
      ...withDefaultPlayerVitals({
        position: { x: 8, y: -2.5 },
        velocity: { x: 0, y: -10 },
        size: { width: 12, height: 12 },
        grounded: false,
        facing: 'right'
      }),
      breathSecondsRemaining: 7.75
    });
  });

  it('applies water drag to horizontal and vertical velocity while submerged', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, -1, WATER_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 40, y: 20 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 4,
        waterVerticalDragPerSecond: 4,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(stepped.position.x).toBe(13);
    expect(stepped.position.y).toBe(2.5);
    expect(stepped.velocity.x).toBe(20);
    expect(stepped.velocity.y).toBe(10);
    expect(stepped.size).toEqual({ width: 12, height: 12 });
    expect(stepped.grounded).toBe(false);
    expect(stepped.facing).toBe('right');
    expect(stepped.health).toBe(DEFAULT_PLAYER_MAX_HEALTH);
    expect(stepped.lavaDamageTickSecondsRemaining).toBe(
      DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS
    );
    expect(stepped.fallDamageRecoverySecondsRemaining).toBe(0);
  });

  it('drains breath only when the player head sample is underwater', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, 0, WATER_TILE_ID);

    const feetOnlySubmerged = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        breathSecondsRemaining: 4
      }),
      0.5,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        maxBreathSeconds: 8,
        breathRecoveryPerSecond: 2,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        drowningDamagePerTick: 5,
        drowningDamageTickIntervalSeconds: 0.5,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(feetOnlySubmerged.breathSecondsRemaining).toBe(5);
    expect(feetOnlySubmerged.drowningDamageTickSecondsRemaining).toBe(0.5);

    world.setTile(0, -1, WATER_TILE_ID);

    const headSubmerged = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        breathSecondsRemaining: 4
      }),
      0.5,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        maxBreathSeconds: 8,
        breathRecoveryPerSecond: 2,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        drowningDamagePerTick: 5,
        drowningDamageTickIntervalSeconds: 0.5,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(headSubmerged.breathSecondsRemaining).toBe(3.5);
    expect(headSubmerged.drowningDamageTickSecondsRemaining).toBe(0.5);
  });

  it('applies nonlethal drowning damage on a fixed cadence after breath runs out', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, -1, WATER_TILE_ID);

    const drainedBreath = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        health: 12,
        breathSecondsRemaining: 0.25,
        drowningDamageTickSecondsRemaining: 0.5
      }),
      0.5,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        maxBreathSeconds: 8,
        breathRecoveryPerSecond: 2,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        drowningDamagePerTick: 5,
        drowningDamageTickIntervalSeconds: 0.5,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(drainedBreath.health).toBe(12);
    expect(drainedBreath.breathSecondsRemaining).toBe(0);
    expect(drainedBreath.drowningDamageTickSecondsRemaining).toBe(0.25);

    const firstDrownTick = stepPlayerState(
      world,
      drainedBreath,
      0.25,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        maxBreathSeconds: 8,
        breathRecoveryPerSecond: 2,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        drowningDamagePerTick: 5,
        drowningDamageTickIntervalSeconds: 0.5,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(firstDrownTick.health).toBe(7);
    expect(firstDrownTick.drowningDamageTickSecondsRemaining).toBe(0.5);

    const clampedDrownTick = stepPlayerState(
      world,
      {
        ...firstDrownTick,
        health: 3
      },
      0.5,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        maxBreathSeconds: 8,
        breathRecoveryPerSecond: 2,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        drowningDamagePerTick: 5,
        drowningDamageTickIntervalSeconds: 0.5,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(clampedDrownTick.health).toBe(1);
    expect(clampedDrownTick.breathSecondsRemaining).toBe(0);
    expect(clampedDrownTick.drowningDamageTickSecondsRemaining).toBe(0.5);
  });

  it('recovers breath and resets drowning cadence once the player surfaces', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -4, 2, 2, 0);

    const surfaced = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        health: 47,
        breathSecondsRemaining: 0,
        drowningDamageTickSecondsRemaining: 0.1
      }),
      0.5,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        maxBreathSeconds: DEFAULT_PLAYER_MAX_BREATH_SECONDS,
        breathRecoveryPerSecond: DEFAULT_PLAYER_BREATH_RECOVERY_PER_SECOND,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        drowningDamagePerTick: DEFAULT_PLAYER_DROWNING_DAMAGE_PER_TICK,
        drowningDamageTickIntervalSeconds: DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
        lavaDamagePerTick: 0,
        lavaDamageTickIntervalSeconds: 0.5
      }
    );

    expect(surfaced.health).toBe(47);
    expect(surfaced.breathSecondsRemaining).toBe(2);
    expect(surfaced.drowningDamageTickSecondsRemaining).toBe(
      DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS
    );
  });

  it('applies periodic lava contact damage inside the shared fixed-step player update', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, -1, LAVA_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        health: 50,
        lavaDamageTickSecondsRemaining: 0.25
      }),
      0.25,
      {},
      {
        gravityAcceleration: 0,
        maxFallSpeed: 200,
        maxWalkSpeed: 40,
        groundAcceleration: 0,
        airAcceleration: 0,
        groundDeceleration: 0,
        jumpSpeed: 0,
        waterBuoyancyAcceleration: 0,
        waterHorizontalDragPerSecond: 0,
        waterVerticalDragPerSecond: 0,
        lavaDamagePerTick: 10,
        lavaDamageTickIntervalSeconds: 0.25
      }
    );

    expect(stepped).toEqual({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right',
      health: 40,
      breathSecondsRemaining: DEFAULT_PLAYER_MAX_BREATH_SECONDS,
      lavaDamageTickSecondsRemaining: 0.25,
      drowningDamageTickSecondsRemaining: DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
      fallDamageRecoverySecondsRemaining: 0
    });
  });

  it('rejects invalid size and fixed-step durations', () => {
    expect(() =>
      createPlayerState({
        size: { width: 0, height: DEFAULT_PLAYER_HEIGHT }
      })
    ).toThrowError(/size\.width must be a positive finite number/);
    expect(() =>
      createPlayerState({
        health: -1
      })
    ).toThrowError(/health must be a non-negative finite number/);
    expect(() =>
      createPlayerState({
        breathSecondsRemaining: -0.1
      })
    ).toThrowError(/breathSecondsRemaining must be a non-negative finite number/);
    expect(() =>
      createPlayerState({
        lavaDamageTickSecondsRemaining: -0.1
      })
    ).toThrowError(/lavaDamageTickSecondsRemaining must be a non-negative finite number/);
    expect(() =>
      createPlayerState({
        drowningDamageTickSecondsRemaining: -0.1
      })
    ).toThrowError(/drowningDamageTickSecondsRemaining must be a non-negative finite number/);
    expect(() =>
      createPlayerState({
        fallDamageRecoverySecondsRemaining: -0.1
      })
    ).toThrowError(/fallDamageRecoverySecondsRemaining must be a non-negative finite number/);

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
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        maxBreathSeconds: 0
      })
    ).toThrowError(/options\.maxBreathSeconds must be a positive finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        breathRecoveryPerSecond: -DEFAULT_PLAYER_BREATH_RECOVERY_PER_SECOND
      })
    ).toThrowError(/options\.breathRecoveryPerSecond must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        waterBuoyancyAcceleration: -DEFAULT_PLAYER_WATER_BUOYANCY_ACCELERATION
      })
    ).toThrowError(/options\.waterBuoyancyAcceleration must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        waterHorizontalDragPerSecond: -DEFAULT_PLAYER_WATER_HORIZONTAL_DRAG_PER_SECOND
      })
    ).toThrowError(/options\.waterHorizontalDragPerSecond must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        waterVerticalDragPerSecond: -DEFAULT_PLAYER_WATER_VERTICAL_DRAG_PER_SECOND
      })
    ).toThrowError(/options\.waterVerticalDragPerSecond must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        drowningDamagePerTick: -DEFAULT_PLAYER_DROWNING_DAMAGE_PER_TICK
      })
    ).toThrowError(/options\.drowningDamagePerTick must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        drowningDamageTickIntervalSeconds: 0
      })
    ).toThrowError(/options\.drowningDamageTickIntervalSeconds must be a positive finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        lavaDamagePerTick: -DEFAULT_PLAYER_LAVA_DAMAGE_PER_TICK
      })
    ).toThrowError(/options\.lavaDamagePerTick must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        lavaDamageTickIntervalSeconds: 0
      })
    ).toThrowError(/options\.lavaDamageTickIntervalSeconds must be a positive finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        fallDamageSafeLandingSpeed: -DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED
      })
    ).toThrowError(/options\.fallDamageSafeLandingSpeed must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        fallDamageSpeedPerHealth: 0
      })
    ).toThrowError(/options\.fallDamageSpeedPerHealth must be a positive finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        fallDamageRecoverySeconds: -DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS
      })
    ).toThrowError(/options\.fallDamageRecoverySeconds must be a non-negative finite number/);
  });
});
