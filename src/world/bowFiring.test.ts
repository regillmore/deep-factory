import { describe, expect, it } from 'vitest';

import { createHostileSlimeState, DEFAULT_HOSTILE_SLIME_HEALTH } from './hostileSlimeState';
import { createPlayerState, getPlayerCameraFocusPoint } from './playerState';
import {
  applyArrowProjectileHitToHostileSlime,
  cloneBowDrawCooldownState,
  createBowDrawCooldownState,
  cloneArrowProjectileState,
  createArrowProjectileState,
  createArrowProjectileStateFromBowFire,
  DEFAULT_BOW_ARROW_DAMAGE,
  DEFAULT_BOW_ARROW_KNOCKBACK_SPEED,
  DEFAULT_BOW_DRAW_COOLDOWN_SECONDS,
  DEFAULT_BOW_ARROW_LIFETIME_SECONDS,
  DEFAULT_BOW_ARROW_RADIUS,
  DEFAULT_BOW_ARROW_SPEED,
  stepBowDrawCooldownState,
  tryFireBow,
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

  it('starts a bow shot only when the player is alive, has ammo, and is not already drawing', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);
    const readyCooldownState = createBowDrawCooldownState();

    const firedResult = tryFireBow(
      playerState,
      readyCooldownState,
      12,
      {
        x: playerFocusPoint.x + 48,
        y: playerFocusPoint.y - 16
      }
    );

    expect(firedResult.shotStarted).toBe(true);
    expect(firedResult.blockedReason).toBeNull();
    expect(firedResult.arrowProjectileState).not.toBeNull();
    expect(firedResult.nextCooldownState.secondsRemaining).toBe(
      DEFAULT_BOW_DRAW_COOLDOWN_SECONDS
    );
    expect(cloneBowDrawCooldownState(readyCooldownState)).toEqual(readyCooldownState);

    expect(
      tryFireBow(
        playerState,
        createBowDrawCooldownState(0.2),
        12,
        {
          x: playerFocusPoint.x + 48,
          y: playerFocusPoint.y
        }
      )
    ).toMatchObject({
      shotStarted: false,
      blockedReason: 'cooldown',
      arrowProjectileState: null,
      nextCooldownState: { secondsRemaining: 0.2 }
    });

    expect(
      tryFireBow(
        playerState,
        readyCooldownState,
        0,
        {
          x: playerFocusPoint.x + 48,
          y: playerFocusPoint.y
        }
      )
    ).toMatchObject({
      shotStarted: false,
      blockedReason: 'no-ammo',
      arrowProjectileState: null,
      nextCooldownState: { secondsRemaining: 0 }
    });

    expect(
      tryFireBow(
        createPlayerState({
          position: { x: 8, y: 28 },
          health: 0
        }),
        readyCooldownState,
        12,
        {
          x: playerFocusPoint.x + 48,
          y: playerFocusPoint.y
        }
      )
    ).toMatchObject({
      shotStarted: false,
      blockedReason: 'dead',
      arrowProjectileState: null,
      nextCooldownState: { secondsRemaining: 0 }
    });
  });

  it('steps the detached bow draw cooldown back to zero without going negative', () => {
    expect(
      stepBowDrawCooldownState(createBowDrawCooldownState(0.25), 0.1).secondsRemaining
    ).toBeCloseTo(0.15, 8);
    expect(stepBowDrawCooldownState(createBowDrawCooldownState(0.05), 0.2)).toEqual({
      secondsRemaining: 0
    });
  });

  it('advances arrow projectiles in a straight line and expires them when their lifetime runs out', () => {
    const initialState = createArrowProjectileState({
      position: { x: 10, y: 20 },
      velocity: { x: 60, y: -30 },
      radius: 3,
      secondsRemaining: 0.12
    });

    const steppedResult = stepArrowProjectileState(initialState, {
      fixedDtSeconds: 0.05
    });

    expect(steppedResult.hitEvent).toBeNull();
    expect(steppedResult.nextState).toMatchObject({
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
    expect(steppedResult.nextState?.secondsRemaining).toBeCloseTo(0.07, 8);
    expect(cloneArrowProjectileState(initialState)).toEqual(initialState);
    expect(
      stepArrowProjectileState(initialState, {
        fixedDtSeconds: 0.2
      })
    ).toEqual({
      nextState: null,
      hitEvent: null
    });
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
    ).toEqual({
      nextState: null,
      hitEvent: {
        kind: 'terrain',
        worldTileX: 2,
        worldTileY: 0,
        tileId: 1
      }
    });
  });

  it('reports the earliest hostile-slime hit before later terrain and applies damage plus knockback', () => {
    const world = new TileWorld(0);
    clearTileRect(world, -1, 6, -2, 1);
    world.setTile(6, 0, 1);
    const playerState = createPlayerState({
      position: { x: 8, y: 16 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);
    const stepResult = stepArrowProjectileState(
      createArrowProjectileStateFromBowFire(playerState, {
        x: 96,
        y: playerFocusPoint.y
      }),
      {
        world: {
          getTile: (worldTileX, worldTileY) => world.getTile(worldTileX, worldTileY)
        },
        hostileSlimes: [
          {
            entityId: 7,
            state: createHostileSlimeState({
              position: { x: 44, y: 16 }
            })
          }
        ],
        fixedDtSeconds: 0.2
      }
    );
    if (stepResult.hitEvent === null || stepResult.hitEvent.kind !== 'hostile-slime') {
      throw new Error('expected a hostile-slime hit event');
    }

    expect(stepResult.nextState).toBeNull();
    expect(stepResult.hitEvent).toEqual({
      kind: 'hostile-slime',
      entityId: 7,
      direction: {
        x: 1,
        y: 0
      },
      damage: DEFAULT_BOW_ARROW_DAMAGE,
      knockbackSpeed: DEFAULT_BOW_ARROW_KNOCKBACK_SPEED
    });
    expect(
      applyArrowProjectileHitToHostileSlime(
        createHostileSlimeState({
          position: { x: 44, y: 16 }
        }),
        stepResult.hitEvent
      )
    ).toEqual(
      createHostileSlimeState({
        position: { x: 44, y: 16 },
        velocity: {
          x: DEFAULT_BOW_ARROW_KNOCKBACK_SPEED,
          y: 0
        },
        health: DEFAULT_HOSTILE_SLIME_HEALTH - DEFAULT_BOW_ARROW_DAMAGE,
        grounded: false,
        facing: 'right',
        launchKind: null
      })
    );
  });
});
