import { describe, expect, it } from 'vitest';

import { createHostileSlimeState, DEFAULT_HOSTILE_SLIME_HEALTH } from './hostileSlimeState';
import { createPlayerState, getPlayerCameraFocusPoint } from './playerState';
import {
  applyStarterWandFireboltHitToHostileSlime,
  createStarterWandCooldownState,
  DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS,
  DEFAULT_STARTER_WAND_FIREBOLT_DAMAGE,
  DEFAULT_STARTER_WAND_FIREBOLT_KNOCKBACK_SPEED,
  DEFAULT_STARTER_WAND_FIREBOLT_RADIUS,
  DEFAULT_STARTER_WAND_FIREBOLT_SPEED,
  stepStarterWandCooldownState,
  stepStarterWandFireboltState,
  tryUseStarterWand
} from './starterWand';
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

describe('starterWand', () => {
  it('starts a cast from the player focus point toward the requested world point', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    const useResult = tryUseStarterWand(
      playerState,
      createStarterWandCooldownState(),
      { x: playerFocusPoint.x + 30, y: playerFocusPoint.y - 40 }
    );

    expect(useResult).toEqual({
      nextCooldownState: createStarterWandCooldownState(
        DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS
      ),
      fireboltState: {
        position: playerFocusPoint,
        velocity: {
          x: DEFAULT_STARTER_WAND_FIREBOLT_SPEED * 0.6,
          y: DEFAULT_STARTER_WAND_FIREBOLT_SPEED * -0.8
        },
        radius: DEFAULT_STARTER_WAND_FIREBOLT_RADIUS,
        secondsRemaining: expect.any(Number)
      },
      castStarted: true,
      blockedReason: null
    });
  });

  it('falls back to the player facing direction at zero-length aim and blocks recasts during cooldown', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'left'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    const initialUseResult = tryUseStarterWand(
      playerState,
      createStarterWandCooldownState(),
      playerFocusPoint
    );
    const blockedUseResult = tryUseStarterWand(
      playerState,
      initialUseResult.nextCooldownState,
      { x: playerFocusPoint.x - 20, y: playerFocusPoint.y }
    );
    const cooledDownState = stepStarterWandCooldownState(
      stepStarterWandCooldownState(initialUseResult.nextCooldownState, 0.2),
      0.2
    );
    const useAfterCooldown = tryUseStarterWand(
      playerState,
      cooledDownState,
      playerFocusPoint
    );

    expect(initialUseResult.fireboltState?.velocity.x).toBeCloseTo(
      -DEFAULT_STARTER_WAND_FIREBOLT_SPEED,
      6
    );
    expect(initialUseResult.fireboltState?.velocity.y).toBeCloseTo(0, 6);
    expect(blockedUseResult).toEqual({
      nextCooldownState: initialUseResult.nextCooldownState,
      fireboltState: null,
      castStarted: false,
      blockedReason: 'cooldown'
    });
    expect(cooledDownState).toEqual(createStarterWandCooldownState());
    expect(useAfterCooldown.castStarted).toBe(true);
  });

  it('despawns firebolts on the first solid terrain tile they reach', () => {
    const world = new TileWorld(0);
    clearTileRect(world, -1, 3, -2, 1);
    world.setTile(2, 0, 1);
    const playerState = createPlayerState({
      position: { x: 8, y: 16 },
      facing: 'right'
    });

    const useResult = tryUseStarterWand(
      playerState,
      createStarterWandCooldownState(),
      { x: 48, y: 8 }
    );
    if (useResult.fireboltState === null) {
      throw new Error('expected a firebolt state');
    }

    const hitResult = stepStarterWandFireboltState(useResult.fireboltState, {
      world: {
        getTile: (worldTileX, worldTileY) => world.getTile(worldTileX, worldTileY)
      },
      hostileSlimes: [],
      fixedDtSeconds: 0.2
    });

    expect(hitResult).toEqual({
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
    const useResult = tryUseStarterWand(
      playerState,
      createStarterWandCooldownState(),
      { x: 96, y: playerFocusPoint.y }
    );
    if (useResult.fireboltState === null) {
      throw new Error('expected a firebolt state');
    }

    const hitResult = stepStarterWandFireboltState(useResult.fireboltState, {
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
    });
    if (hitResult.hitEvent === null || hitResult.hitEvent.kind !== 'hostile-slime') {
      throw new Error('expected a hostile-slime hit event');
    }

    expect(hitResult.nextState).toBeNull();
    expect(hitResult.hitEvent).toEqual({
      kind: 'hostile-slime',
      entityId: 7,
      direction: {
        x: 1,
        y: 0
      },
      damage: DEFAULT_STARTER_WAND_FIREBOLT_DAMAGE,
      knockbackSpeed: DEFAULT_STARTER_WAND_FIREBOLT_KNOCKBACK_SPEED
    });
    expect(
      applyStarterWandFireboltHitToHostileSlime(
        createHostileSlimeState({
          position: { x: 44, y: 16 }
        }),
        hitResult.hitEvent
      )
    ).toEqual(
      createHostileSlimeState({
        position: { x: 44, y: 16 },
        velocity: {
          x: DEFAULT_STARTER_WAND_FIREBOLT_KNOCKBACK_SPEED,
          y: 0
        },
        health: DEFAULT_HOSTILE_SLIME_HEALTH - DEFAULT_STARTER_WAND_FIREBOLT_DAMAGE,
        grounded: false,
        facing: 'right',
        launchKind: null
      })
    );
  });
});
