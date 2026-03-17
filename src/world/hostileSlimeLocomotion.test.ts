import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED,
  DEFAULT_HOSTILE_SLIME_HOP_VERTICAL_SPEED,
  DEFAULT_HOSTILE_SLIME_STEP_HOP_HORIZONTAL_SPEED,
  DEFAULT_HOSTILE_SLIME_STEP_HOP_VERTICAL_SPEED,
  stepHostileSlimeState
} from './hostileSlimeLocomotion';
import { createPlayerState } from './playerState';
import {
  createHostileSlimeState,
  DEFAULT_HOSTILE_SLIME_HEALTH,
  DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS
} from './hostileSlimeState';
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

describe('hostileSlimeLocomotion', () => {
  it('counts down grounded hop timing, turns toward the player, and launches a chase hop', () => {
    const world = createFlatSurfaceWorld();
    const playerState = createPlayerState({
      position: { x: 96, y: 0 }
    });
    const waitingState = stepHostileSlimeState(
      world,
      createHostileSlimeState({
        position: { x: 0, y: 0 },
        hopCooldownTicksRemaining: 2
      }),
      FIXED_DT_SECONDS,
      playerState
    );

    expect(waitingState).toEqual({
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 20, height: 12 },
      health: DEFAULT_HOSTILE_SLIME_HEALTH,
      grounded: true,
      facing: 'right',
      hopCooldownTicksRemaining: 1,
      launchKind: null
    });

    const launchedState = stepHostileSlimeState(
      world,
      waitingState,
      FIXED_DT_SECONDS,
      playerState
    );

    expect(launchedState.position.x).toBeCloseTo(DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS);
    expect(launchedState.position.y).toBeCloseTo(-5.5);
    expect(launchedState.velocity).toEqual({
      x: DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED,
      y: -330
    });
    expect(launchedState.grounded).toBe(false);
    expect(launchedState.facing).toBe('right');
    expect(launchedState.hopCooldownTicksRemaining).toBe(DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS);
    expect(launchedState.launchKind).toBe('standard-hop');
  });

  it('keeps the committed hop direction while airborne even if the player crosses behind it', () => {
    const world = createFlatSurfaceWorld();
    const nextState = stepHostileSlimeState(
      world,
      createHostileSlimeState({
        position: { x: 0, y: -20 },
        velocity: { x: DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED, y: -60 },
        grounded: false,
        facing: 'right'
      }),
      FIXED_DT_SECONDS,
      createPlayerState({
        position: { x: -96, y: 0 }
      })
    );

    expect(nextState.facing).toBe('right');
    expect(nextState.velocity).toEqual({
      x: DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED,
      y: -30
    });
    expect(nextState.position.x).toBeCloseTo(DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS);
    expect(nextState.position.y).toBeCloseTo(-20.5);
    expect(nextState.grounded).toBe(false);
  });

  it('launches a short-range step-up hop when grounded against a one-tile rise', () => {
    const world = createFlatSurfaceWorld();
    world.setTile(1, -1, 3);

    const nextState = stepHostileSlimeState(
      world,
      createHostileSlimeState({
        position: { x: 6, y: 0 },
        facing: 'right',
        hopCooldownTicksRemaining: 1
      }),
      FIXED_DT_SECONDS,
      createPlayerState({
        position: { x: 96, y: 0 }
      })
    );

    expect(nextState.position.x).toBeCloseTo(6 + DEFAULT_HOSTILE_SLIME_STEP_HOP_HORIZONTAL_SPEED * FIXED_DT_SECONDS);
    expect(nextState.position.y).toBeCloseTo(-19.5);
    expect(nextState.velocity).toEqual({
      x: DEFAULT_HOSTILE_SLIME_STEP_HOP_HORIZONTAL_SPEED,
      y: -(DEFAULT_HOSTILE_SLIME_STEP_HOP_VERTICAL_SPEED - 30)
    });
    expect(nextState.grounded).toBe(false);
    expect(nextState.facing).toBe('right');
    expect(nextState.hopCooldownTicksRemaining).toBe(DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS);
    expect(nextState.launchKind).toBe('step-hop');
  });

  it('does not select the step-up hop against walls taller than the lift allowance', () => {
    const world = createFlatSurfaceWorld();
    setTiles(world, 1, -2, 1, -1, 3);

    const nextState = stepHostileSlimeState(
      world,
      createHostileSlimeState({
        position: { x: 6, y: 0 },
        facing: 'right',
        hopCooldownTicksRemaining: 1
      }),
      FIXED_DT_SECONDS,
      createPlayerState({
        position: { x: 96, y: 0 }
      })
    );

    expect(nextState.position.x).toBe(6);
    expect(nextState.position.y).toBeCloseTo(-5.5);
    expect(nextState.velocity).toEqual({
      x: 0,
      y: -330
    });
    expect(nextState.grounded).toBe(false);
    expect(nextState.facing).toBe('left');
  });

  it('does not auto-step a normal airborne hop onto a one-tile rise anymore', () => {
    const world = createFlatSurfaceWorld();
    world.setTile(1, -1, 3);

    const nextState = stepHostileSlimeState(
      world,
      createHostileSlimeState({
        position: { x: 6, y: 0 },
        velocity: { x: DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED, y: -60 },
        grounded: false,
        facing: 'right'
      }),
      FIXED_DT_SECONDS,
      createPlayerState({
        position: { x: 96, y: 0 }
      })
    );

    expect(nextState.position.x).toBe(6);
    expect(nextState.position.y).toBeCloseTo(-0.5);
    expect(nextState.velocity).toEqual({
      x: 0,
      y: -30
    });
    expect(nextState.grounded).toBe(false);
    expect(nextState.facing).toBe('left');
  });

  it('does not step up onto a rise while falling into the ledge face', () => {
    const world = createFlatSurfaceWorld();
    world.setTile(1, -1, 3);

    const nextState = stepHostileSlimeState(
      world,
      createHostileSlimeState({
        position: { x: 6, y: -10 },
        velocity: { x: DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED, y: 60 },
        grounded: false,
        facing: 'right'
      }),
      FIXED_DT_SECONDS,
      createPlayerState({
        position: { x: 96, y: 0 }
      })
    );

    expect(nextState.position.x).toBe(6);
    expect(nextState.position.y).toBeCloseTo(-8.5);
    expect(nextState.velocity).toEqual({
      x: 0,
      y: 90
    });
    expect(nextState.grounded).toBe(false);
    expect(nextState.facing).toBe('left');
  });

  it('resets the hop timer and retargets toward the player when landing', () => {
    const world = createFlatSurfaceWorld();

    const nextState = stepHostileSlimeState(
      world,
      createHostileSlimeState({
        position: { x: 40, y: -1 },
        velocity: { x: DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED, y: 60 },
        grounded: false,
        facing: 'right',
        hopCooldownTicksRemaining: 4
      }),
      FIXED_DT_SECONDS,
      createPlayerState({
        position: { x: -96, y: 0 }
      }),
      {
        hopIntervalTicks: 7
      }
    );

    expect(nextState).toEqual({
      position: { x: 42, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 20, height: 12 },
      health: DEFAULT_HOSTILE_SLIME_HEALTH,
      grounded: true,
      facing: 'left',
      hopCooldownTicksRemaining: 7,
      launchKind: null
    });
  });

  it('defaults new slimes to a full hop cooldown so they do not jump on the spawn frame', () => {
    const state = createHostileSlimeState({
      position: { x: 0, y: 0 }
    });

    expect(state.hopCooldownTicksRemaining).toBe(DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS);
    expect(state.velocity.y).not.toBe(-DEFAULT_HOSTILE_SLIME_HOP_VERTICAL_SPEED);
  });
});
