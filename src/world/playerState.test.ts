import { describe, expect, it } from 'vitest';

import { findPlayerSpawnPoint } from './playerSpawn';
import { STARTER_ROPE_TILE_ID } from './starterRopePlacement';
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
  DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED,
  DEFAULT_PLAYER_GROUND_ACCELERATION,
  DEFAULT_PLAYER_GROUND_DECELERATION,
  DEFAULT_PLAYER_GRAVITY_ACCELERATION,
  DEFAULT_PLAYER_HEIGHT,
  DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS,
  DEFAULT_PLAYER_JUMP_SPEED,
  DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_LAVA_DAMAGE_PER_TICK,
  DEFAULT_PLAYER_MAX_BREATH_SECONDS,
  DEFAULT_PLAYER_MAX_HEALTH,
  DEFAULT_PLAYER_MAX_MANA,
  DEFAULT_PLAYER_MAX_FALL_SPEED,
  DEFAULT_PLAYER_MANA_REGEN_TICK_INTERVAL_SECONDS,
  DEFAULT_PLAYER_ROPE_CLIMB_SPEED,
  DEFAULT_PLAYER_ROPE_CENTERING_SPEED,
  DEFAULT_PLAYER_MAX_WALK_SPEED,
  DEFAULT_PLAYER_WATER_BUOYANCY_ACCELERATION,
  DEFAULT_PLAYER_WATER_HORIZONTAL_DRAG_PER_SECOND,
  DEFAULT_PLAYER_WATER_VERTICAL_DRAG_PER_SECOND,
  DEFAULT_PLAYER_WIDTH,
  getPlayerCameraFocusPoint,
  getPlayerCollisionContacts,
  getPlayerDrowningDamageTickApplied,
  getPlayerLandingImpactSpeed,
  getPlayerLavaDamageTickApplied,
  getPlayerWaterSubmersionTelemetry,
  getPlayerAabb,
  integratePlayerState,
  isPlayerRopeDropActive,
  movePlayerStateWithCollisions,
  type PlayerState,
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

const withDefaultPlayerVitals = <
  T extends Partial<{
    maxHealth: number;
    health: number;
    maxMana: number;
    mana: number;
    manaRegenDelaySecondsRemaining: number;
    manaRegenTickSecondsRemaining: number;
    breathSecondsRemaining: number;
    lavaDamageTickSecondsRemaining: number;
    drowningDamageTickSecondsRemaining: number;
    fallDamageRecoverySecondsRemaining: number;
    hostileContactInvulnerabilitySecondsRemaining: number;
  }> &
    object
>(
  state: T
): Omit<
  T,
  | 'maxHealth'
  | 'health'
  | 'maxMana'
  | 'mana'
  | 'manaRegenDelaySecondsRemaining'
  | 'manaRegenTickSecondsRemaining'
  | 'breathSecondsRemaining'
  | 'lavaDamageTickSecondsRemaining'
  | 'drowningDamageTickSecondsRemaining'
  | 'fallDamageRecoverySecondsRemaining'
  | 'hostileContactInvulnerabilitySecondsRemaining'
> & {
  maxHealth: number;
  health: number;
  maxMana: number;
  mana: number;
  manaRegenDelaySecondsRemaining: number;
  manaRegenTickSecondsRemaining: number;
  breathSecondsRemaining: number;
  lavaDamageTickSecondsRemaining: number;
  drowningDamageTickSecondsRemaining: number;
  fallDamageRecoverySecondsRemaining: number;
  hostileContactInvulnerabilitySecondsRemaining: number;
} => ({
  ...state,
  maxHealth: state.maxHealth ?? DEFAULT_PLAYER_MAX_HEALTH,
  health: state.health ?? state.maxHealth ?? DEFAULT_PLAYER_MAX_HEALTH,
  maxMana: state.maxMana ?? DEFAULT_PLAYER_MAX_MANA,
  mana: state.mana ?? state.maxMana ?? DEFAULT_PLAYER_MAX_MANA,
  manaRegenDelaySecondsRemaining: state.manaRegenDelaySecondsRemaining ?? 0,
  manaRegenTickSecondsRemaining:
    state.manaRegenTickSecondsRemaining ?? DEFAULT_PLAYER_MANA_REGEN_TICK_INTERVAL_SECONDS,
  breathSecondsRemaining: state.breathSecondsRemaining ?? DEFAULT_PLAYER_MAX_BREATH_SECONDS,
  lavaDamageTickSecondsRemaining:
    state.lavaDamageTickSecondsRemaining ?? DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
  drowningDamageTickSecondsRemaining:
    state.drowningDamageTickSecondsRemaining ??
    DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
  fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining ?? 0,
  hostileContactInvulnerabilitySecondsRemaining:
    state.hostileContactInvulnerabilitySecondsRemaining ??
    DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS
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
      maxHealth: 140,
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

  it('preserves extra enumerable runtime fields when cloning player state', () => {
    const state = createPlayerState({
      position: { x: 24, y: -8 },
      velocity: { x: -12, y: 36 }
    }) as PlayerState & {
      headSubmergedInWater?: boolean;
      waterSubmergedFraction?: number;
      lavaDamageApplied?: number;
    };
    state.headSubmergedInWater = true;
    state.waterSubmergedFraction = 2 / 3;
    state.lavaDamageApplied = 25;

    const cloned = clonePlayerState(state);

    expect((cloned as typeof state).headSubmergedInWater).toBe(true);
    expect((cloned as typeof state).waterSubmergedFraction).toBeCloseTo(2 / 3, 5);
    expect((cloned as typeof state).lavaDamageApplied).toBe(25);
    expect(cloned.position).not.toBe(state.position);
    expect(cloned.velocity).not.toBe(state.velocity);
    expect(cloned.size).not.toBe(state.size);
  });

  it('defaults health and mana to their max values and rejects values above either cap', () => {
    expect(
      createPlayerState({
        maxHealth: 140,
        maxMana: 60
      })
    ).toEqual(
      withDefaultPlayerVitals({
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: DEFAULT_PLAYER_WIDTH, height: DEFAULT_PLAYER_HEIGHT },
        grounded: false,
        facing: 'right',
        maxHealth: 140,
        health: 140,
        maxMana: 60,
        mana: 60
      })
    );

    expect(() =>
      createPlayerState({
        maxHealth: 120,
        health: 121
      })
    ).toThrowError(/health must be less than or equal to maxHealth/);
    expect(() =>
      createPlayerState({
        maxMana: 40,
        mana: 41
      })
    ).toThrowError(/mana must be less than or equal to maxMana/);
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

  it('climbs upward on rope tiles instead of applying a grounded jump impulse', () => {
    const world = new TileWorld(0);
    setTiles(world, -3, 0, 5, 0, 3);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        grounded: true
      }),
      0.25,
      { jumpPressed: true, climbY: -1 },
      {
        maxWalkSpeed: 40,
        groundAcceleration: 160,
        airAcceleration: 80,
        groundDeceleration: 80,
        jumpSpeed: 100,
        ropeClimbSpeed: 60,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -15 },
      velocity: { x: 0, y: -60 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('holds the player in place on rope tiles when there is no vertical climb intent', () => {
    const world = new TileWorld(0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 40 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      {},
      {
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -16 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('applies grounded-style horizontal braking while a centered player is holding a rope', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 40, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      {},
      {
        groundDeceleration: 160,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -16 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('gently recenters neutral rope hold toward the rope column without flipping facing', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 12, y: -16 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        facing: 'right'
      }),
      1 / 60,
      {},
      {
        ropeCenteringSpeed: 24,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 11.600000000000001, y: -16 },
      velocity: { x: -24.00000000000002, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('moves downward on rope tiles when climb-down intent is held', () => {
    const world = new TileWorld(0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { climbY: 1 },
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -1 },
      velocity: { x: 0, y: 60 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('releases rope hold into a faster drop while ropeDropHeld stays active', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -6, 2, 2, 0);
    world.setTile(0, -4, STARTER_ROPE_TILE_ID);
    world.setTile(0, -3, STARTER_ROPE_TILE_ID);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -48 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { climbY: 1, ropeDropHeld: true },
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 320,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -28 },
      velocity: { x: 0, y: 80 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('regrabs the rope as soon as ropeDropHeld is released while still overlapping the column', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -6, 2, 2, 0);
    world.setTile(0, -4, STARTER_ROPE_TILE_ID);
    world.setTile(0, -3, STARTER_ROPE_TILE_ID);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const dropped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -48 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { climbY: 1, ropeDropHeld: true },
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 320,
        maxFallSpeed: 200
      }
    );

    const regrabbed = stepPlayerState(
      world,
      dropped,
      0.25,
      {},
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 320,
        maxFallSpeed: 200
      }
    );

    expect(regrabbed).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -28 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('auto-catches at the rope bottom instead of falling past the last segment during a rope drop', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -6, 2, 2, 0);
    world.setTile(0, -4, STARTER_ROPE_TILE_ID);
    world.setTile(0, -3, STARTER_ROPE_TILE_ID);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -4 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { climbY: 1, ropeDropHeld: true },
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 320,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('slows across the final rope tile before a rope drop reaches solid ground', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -6, 2, 2, 0);
    world.setTile(0, -4, STARTER_ROPE_TILE_ID);
    world.setTile(0, -3, STARTER_ROPE_TILE_ID);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);
    world.setTile(0, 0, 3);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -28 },
        velocity: { x: 0, y: 80 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { climbY: 1, ropeDropHeld: true },
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 320,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: -13 },
      velocity: { x: 0, y: 60 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('does not apply fall damage when a rope drop lands on solid ground at the rope bottom', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -6, 2, 2, 0);
    world.setTile(0, -4, STARTER_ROPE_TILE_ID);
    world.setTile(0, -3, STARTER_ROPE_TILE_ID);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);
    world.setTile(0, 0, 3);

    const slowed = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -28 },
        velocity: { x: 0, y: 80 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { climbY: 1, ropeDropHeld: true },
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 320,
        maxFallSpeed: 200
      }
    );

    const landed = stepPlayerState(
      world,
      slowed,
      0.25,
      { climbY: 1, ropeDropHeld: true },
      {
        ropeClimbSpeed: 60,
        gravityAcceleration: 320,
        maxFallSpeed: 200
      }
    );

    expect(landed).toEqual(withDefaultPlayerVitals({
      position: { x: 8, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 12, height: 12 },
      grounded: true,
      facing: 'right'
    }));
  });

  it('reports rope-drop active only while the player is still descending within a climbable rope column', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -6, 2, 2, 0);
    world.setTile(0, -4, STARTER_ROPE_TILE_ID);
    world.setTile(0, -3, STARTER_ROPE_TILE_ID);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    expect(
      isPlayerRopeDropActive(
        world,
        createPlayerState({
          position: { x: 8, y: -48 },
          velocity: { x: 0, y: 80 },
          size: { width: 12, height: 12 }
        }),
        true
      )
    ).toBe(true);
    expect(
      isPlayerRopeDropActive(
        world,
        createPlayerState({
          position: { x: 8, y: 0 },
          velocity: { x: 0, y: 0 },
          size: { width: 12, height: 12 }
        }),
        true
      )
    ).toBe(false);
    expect(
      isPlayerRopeDropActive(
        world,
        createPlayerState({
          position: { x: 40, y: -48 },
          velocity: { x: 0, y: 80 },
          size: { width: 12, height: 12 }
        }),
        true
      )
    ).toBe(false);
  });

  it('jumps off a rope on a fresh jump press with horizontal input even before leaving the rope column', () => {
    const world = new TileWorld(0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { moveX: 1, jumpPressed: true, climbY: -1 },
      {
        maxWalkSpeed: 80,
        airAcceleration: 20,
        ropeClimbSpeed: 60,
        jumpSpeed: 100,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 9.25, y: -36 },
      velocity: { x: 5, y: -80 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('keeps climbing a rope when horizontal input is held without a fresh jump press', () => {
    const world = new TileWorld(0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { moveX: 1, climbY: -1 },
      {
        maxWalkSpeed: 80,
        airAcceleration: 20,
        ropeClimbSpeed: 60,
        jumpSpeed: 100,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 9.25, y: -31 },
      velocity: { x: 5, y: -60 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('resumes gravity immediately when sideways movement carries the player off a rope', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -4, 6, 6, 0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { moveX: 1 },
      {
        maxWalkSpeed: 80,
        airAcceleration: 320,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 28, y: -11 },
      velocity: { x: 80, y: 20 },
      size: { width: 12, height: 12 },
      grounded: false,
      facing: 'right'
    }));
  });

  it('drops rope climb speed on the same tick that sideways movement detaches from a rope', () => {
    const world = new TileWorld(0);
    setTiles(world, -2, -4, 6, 6, 0);
    world.setTile(0, -2, STARTER_ROPE_TILE_ID);
    world.setTile(0, -1, STARTER_ROPE_TILE_ID);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -16 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      }),
      0.25,
      { moveX: 1, climbY: 1 },
      {
        maxWalkSpeed: 80,
        airAcceleration: 320,
        ropeClimbSpeed: 60,
        gravityAcceleration: 80,
        maxFallSpeed: 200
      }
    );

    expect(stepped).toEqual(withDefaultPlayerVitals({
      position: { x: 28, y: -11 },
      velocity: { x: 80, y: 20 },
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

  it('applies lethal hard-landing damage and starts fall recovery', () => {
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

    expect(stepped.health).toBe(0);
    expect(stepped.fallDamageRecoverySecondsRemaining).toBe(
      DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS
    );
    expect(stepped.grounded).toBe(true);
  });

  it('reports the same gravity-adjusted landing impact speed used by hard-landing damage resolution', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, 0, 3);

    const initialState = createPlayerState({
      position: { x: 8, y: -20 },
      velocity: {
        x: 0,
        y: DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED - 10
      },
      size: { width: 12, height: 12 },
      health: DEFAULT_PLAYER_MAX_HEALTH
    });

    const impactSpeed = getPlayerLandingImpactSpeed(
      world,
      initialState,
      0.25,
      {},
      {
        gravityAcceleration: 80,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );
    const stepped = stepPlayerState(
      world,
      initialState,
      0.25,
      {},
      {
        gravityAcceleration: 80,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    expect(impactSpeed).toBe(DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED + 10);
    expect(stepped.health).toBe(DEFAULT_PLAYER_MAX_HEALTH - 3);
    expect(stepped.fallDamageRecoverySecondsRemaining).toBe(
      DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS
    );
  });

  it('clamps falling speed while glideHeld stays active', () => {
    const world = new TileWorld(0);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -80 },
        velocity: { x: 0, y: DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED + 90 },
        size: { width: 12, height: 12 },
        grounded: false
      }),
      0.1,
      { glideHeld: true },
      {
        gravityAcceleration: 80,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    expect(stepped.velocity.y).toBe(DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED);
    expect(stepped.position.y).toBeCloseTo(-80 + DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED * 0.1, 6);
  });

  it('releases the glide clamp as soon as glideHeld is cleared', () => {
    const world = new TileWorld(0);
    const dt = 0.1;

    const gliding = stepPlayerState(
      world,
      createPlayerState({
        position: { x: 8, y: -80 },
        velocity: { x: 0, y: DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED + 60 },
        size: { width: 12, height: 12 },
        grounded: false
      }),
      dt,
      { glideHeld: true },
      {
        gravityAcceleration: 80,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    const released = stepPlayerState(
      world,
      gliding,
      dt,
      {},
      {
        gravityAcceleration: 80,
        maxFallSpeed: DEFAULT_PLAYER_MAX_FALL_SPEED
      }
    );

    expect(gliding.velocity.y).toBe(DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED);
    expect(released.velocity.y).toBe(DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED + 8);
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

  it('reports head submersion separately from the normalized water-overlap fraction', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, 0, WATER_TILE_ID);

    const feetOnlyTelemetry = getPlayerWaterSubmersionTelemetry(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      })
    );

    expect(feetOnlyTelemetry.headSubmergedInWater).toBe(false);
    expect(feetOnlyTelemetry.waterSubmergedFraction).toBeCloseTo(2 / 3, 5);
    expect(feetOnlyTelemetry.lavaSubmergedFraction).toBe(0);

    world.setTile(0, -1, WATER_TILE_ID);

    const headSubmergedTelemetry = getPlayerWaterSubmersionTelemetry(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      })
    );

    expect(headSubmergedTelemetry.headSubmergedInWater).toBe(true);
    expect(headSubmergedTelemetry.waterSubmergedFraction).toBe(1);
    expect(headSubmergedTelemetry.lavaSubmergedFraction).toBe(0);
  });

  it('reports normalized lava overlap separately from the water head-submersion telemetry', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, 0, LAVA_TILE_ID);

    const feetOnlyTelemetry = getPlayerWaterSubmersionTelemetry(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      })
    );

    expect(feetOnlyTelemetry.headSubmergedInWater).toBe(false);
    expect(feetOnlyTelemetry.waterSubmergedFraction).toBe(0);
    expect(feetOnlyTelemetry.lavaSubmergedFraction).toBeCloseTo(2 / 3, 5);

    world.setTile(0, -1, LAVA_TILE_ID);

    const fullyOverlappingLavaTelemetry = getPlayerWaterSubmersionTelemetry(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 }
      })
    );

    expect(fullyOverlappingLavaTelemetry.headSubmergedInWater).toBe(false);
    expect(fullyOverlappingLavaTelemetry.waterSubmergedFraction).toBe(0);
    expect(fullyOverlappingLavaTelemetry.lavaSubmergedFraction).toBe(1);
  });

  it('applies lethal drowning damage on a fixed cadence after breath runs out', () => {
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

    const lethalDrownTick = stepPlayerState(
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

    expect(lethalDrownTick.health).toBe(0);
    expect(lethalDrownTick.breathSecondsRemaining).toBe(0);
    expect(lethalDrownTick.drowningDamageTickSecondsRemaining).toBe(0.5);
  });

  it('reports the applied drowning tick damage through the shared drowning helper when the timer elapses underwater', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, -1, WATER_TILE_ID);

    const damageApplied = getPlayerDrowningDamageTickApplied(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        health: 50,
        breathSecondsRemaining: 0,
        drowningDamageTickSecondsRemaining: 0.25
      }),
      0.25,
      {
        drowningDamagePerTick: 5,
        drowningDamageTickIntervalSeconds: 0.25
      }
    );

    expect(damageApplied).toBe(5);
  });

  it('reports zero drowning tick damage through the shared drowning helper when only the feet are submerged', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -4, 2, 2, 0);
    world.setTile(0, 0, WATER_TILE_ID);

    const damageApplied = getPlayerDrowningDamageTickApplied(
      world,
      createPlayerState({
        position: { x: 8, y: 8 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        health: 50,
        breathSecondsRemaining: 0,
        drowningDamageTickSecondsRemaining: 0.25
      }),
      0.25,
      {
        drowningDamagePerTick: 5,
        drowningDamageTickIntervalSeconds: 0.25
      }
    );

    expect(damageApplied).toBe(0);
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

    expect(stepped).toEqual(
      withDefaultPlayerVitals({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        grounded: false,
        facing: 'right',
        health: 40,
        lavaDamageTickSecondsRemaining: 0.25,
        drowningDamageTickSecondsRemaining: DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
        hostileContactInvulnerabilitySecondsRemaining:
          DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS
      })
    );
  });

  it('reports the applied lava tick damage through the shared lava helper when the timer elapses in lava', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -3, 2, 2, 0);
    world.setTile(0, -1, LAVA_TILE_ID);

    const damageApplied = getPlayerLavaDamageTickApplied(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        health: 50,
        lavaDamageTickSecondsRemaining: 0.25
      }),
      0.25,
      {
        lavaDamagePerTick: 10,
        lavaDamageTickIntervalSeconds: 0.25
      }
    );

    expect(damageApplied).toBe(10);
  });

  it('reports zero lava tick damage through the shared lava helper when the player is dry', () => {
    const world = new TileWorld(0);

    const damageApplied = getPlayerLavaDamageTickApplied(
      world,
      createPlayerState({
        position: { x: 8, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 12, height: 12 },
        health: 50,
        lavaDamageTickSecondsRemaining: 0.25
      }),
      0.25,
      {
        lavaDamagePerTick: 10,
        lavaDamageTickIntervalSeconds: 0.25
      }
    );

    expect(damageApplied).toBe(0);
  });

  it('counts down hostile-contact invulnerability during shared fixed-step player updates', () => {
    const world = new TileWorld(0);

    const stepped = stepPlayerState(
      world,
      createPlayerState({
        hostileContactInvulnerabilitySecondsRemaining: 0.2
      }),
      0.05
    );

    expect(stepped.hostileContactInvulnerabilitySecondsRemaining).toBeCloseTo(0.15, 6);

    const expired = stepPlayerState(
      world,
      createPlayerState({
        hostileContactInvulnerabilitySecondsRemaining: 0.04
      }),
      0.05
    );

    expect(expired.hostileContactInvulnerabilitySecondsRemaining).toBe(0);
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
        mana: -1
      })
    ).toThrowError(/mana must be a non-negative finite number/);
    expect(() =>
      createPlayerState({
        manaRegenDelaySecondsRemaining: -0.1
      })
    ).toThrowError(/manaRegenDelaySecondsRemaining must be a non-negative finite number/);
    expect(() =>
      createPlayerState({
        manaRegenTickSecondsRemaining: -0.1
      })
    ).toThrowError(/manaRegenTickSecondsRemaining must be a non-negative finite number/);
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
    expect(() =>
      createPlayerState({
        hostileContactInvulnerabilitySecondsRemaining: -0.1
      })
    ).toThrowError(/hostileContactInvulnerabilitySecondsRemaining must be a non-negative finite number/);

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
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {
        climbY: Number.NaN
      })
    ).toThrowError(/intent\.climbY must be a finite number/);
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
        ropeClimbSpeed: -DEFAULT_PLAYER_ROPE_CLIMB_SPEED
      })
    ).toThrowError(/options\.ropeClimbSpeed must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        ropeCenteringSpeed: -DEFAULT_PLAYER_ROPE_CENTERING_SPEED
      })
    ).toThrowError(/options\.ropeCenteringSpeed must be a non-negative finite number/);
    expect(() =>
      stepPlayerState(new TileWorld(0), createPlayerState(), 1 / 60, {}, {
        glideMaxFallSpeed: -DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED
      })
    ).toThrowError(/options\.glideMaxFallSpeed must be a non-negative finite number/);
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
