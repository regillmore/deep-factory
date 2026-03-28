import { describe, expect, it } from 'vitest';

import {
  applyThrownBombBlastHitToPlayer,
  applyThrownBombBlastHitToHostileSlime,
  cloneThrownBombState,
  createThrownBombState,
  createThrownBombStateFromThrow,
  resolveThrownBombBlastBreakTargets,
  resolveThrownBombBlastHostileSlimeHitEvents,
  resolveThrownBombBlastPlayerHitEvent,
  stepThrownBombState
} from './bombThrowing';
import {
  createHostileSlimeState,
  DEFAULT_HOSTILE_SLIME_HEALTH
} from './hostileSlimeState';
import { createPlayerState, getPlayerCameraFocusPoint } from './playerState';
import { STARTER_ROPE_TILE_ID } from './starterRopePlacement';
import { STARTER_DIRT_WALL_ID } from './starterWallPlacement';

describe('bombThrowing', () => {
  it('creates a thrown-bomb state aimed from the player focus point toward the target', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    expect(
      createThrownBombStateFromThrow(
        playerState,
        {
          x: playerFocusPoint.x + 30,
          y: playerFocusPoint.y - 40
        },
        {
          speed: 200,
          radius: 5,
          fuseSeconds: 1.2
        }
      )
    ).toEqual({
      position: playerFocusPoint,
      velocity: {
        x: 120,
        y: -160
      },
      radius: 5,
      secondsRemaining: 1.2
    });
  });

  it('falls back to the current facing when the target sits on the player focus point', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'left'
    });
    const playerFocusPoint = getPlayerCameraFocusPoint(playerState);

    expect(
      createThrownBombStateFromThrow(
        playerState,
        playerFocusPoint,
        {
          speed: 90,
          radius: 6,
          fuseSeconds: 0.75
        }
      )
    ).toEqual({
      position: playerFocusPoint,
      velocity: {
        x: -90,
        y: 0
      },
      radius: 6,
      secondsRemaining: 0.75
    });
  });

  it('advances thrown bombs with fixed-step gravity and expires them when the fuse runs out', () => {
    const initialState = createThrownBombState({
      position: { x: 10, y: 20 },
      velocity: { x: 60, y: -30 },
      radius: 6,
      secondsRemaining: 0.12
    });

    const steppedResult = stepThrownBombState(initialState, {
      fixedDtSeconds: 0.05,
      gravity: 100
    });

    expect(steppedResult.blastEvent).toBeNull();
    expect(steppedResult.nextState).toMatchObject({
      position: {
        x: 13,
        y: 18.75
      },
      velocity: {
        x: 60,
        y: -25
      },
      radius: 6
    });
    expect(steppedResult.nextState?.secondsRemaining).toBeCloseTo(0.07, 8);
    expect(cloneThrownBombState(initialState)).toEqual(initialState);

    expect(
      stepThrownBombState(initialState, {
        fixedDtSeconds: 0.2,
        gravity: 100,
        blastRadius: 24,
        damage: 7,
        knockbackSpeed: 90
      })
    ).toEqual({
      nextState: null,
      blastEvent: {
        position: {
          x: 17.2,
          y: 17.84
        },
        blastRadius: 24,
        damage: 7,
        knockbackSpeed: 90
      }
    });
  });

  it('bounces thrown bombs off solid terrain instead of tunneling through it', () => {
    const initialState = createThrownBombState({
      position: { x: 24, y: 20 },
      velocity: { x: 0, y: 100 },
      radius: 6,
      secondsRemaining: 0.4
    });
    const steppedResult = stepThrownBombState(initialState, {
      fixedDtSeconds: 0.1,
      gravity: 0,
      world: {
        getTile: (worldTileX, worldTileY) =>
          worldTileX === 1 && worldTileY === 2 ? 1 : 0
      },
      bounceRestitution: 0.5,
      minimumBounceSpeed: 1
    });

    expect(steppedResult.blastEvent).toBeNull();
    expect(steppedResult.nextState).toMatchObject({
      position: {
        x: 24,
        y: 26
      },
      velocity: {
        x: 0,
        y: -50
      },
      radius: 6
    });
    expect(steppedResult.nextState?.secondsRemaining).toBeCloseTo(0.3, 8);
  });

  it('resolves blast hits only for hostile slimes inside the bomb radius and applies outward knockback', () => {
    const nearbySlime = createHostileSlimeState({
      position: { x: 48, y: 16 }
    });
    const distantSlime = createHostileSlimeState({
      position: { x: 80, y: 16 }
    });
    const hitEvents = resolveThrownBombBlastHostileSlimeHitEvents(
      {
        position: { x: 32, y: 10 },
        blastRadius: 8,
        damage: 7,
        knockbackSpeed: 90
      },
      [
        { entityId: 7, state: nearbySlime },
        { entityId: 9, state: distantSlime }
      ]
    );

    expect(hitEvents).toEqual([
      {
        entityId: 7,
        direction: {
          x: 1,
          y: 0
        },
        damage: 7,
        knockbackSpeed: 90
      }
    ]);
    expect(applyThrownBombBlastHitToHostileSlime(nearbySlime, hitEvents[0]!)).toEqual(
      createHostileSlimeState({
        position: { x: 48, y: 16 },
        velocity: {
          x: 90,
          y: 0
        },
        health: DEFAULT_HOSTILE_SLIME_HEALTH - 7,
        grounded: false,
        facing: 'right',
        launchKind: null
      })
    );
  });

  it('resolves player blast hits inside the bomb radius and applies outward knockback plus damage', () => {
    const playerState = createPlayerState({
      position: { x: 48, y: 32 },
      grounded: true,
      facing: 'left',
      health: 35
    });
    const blastEvent = {
      position: { x: 32, y: 6 },
      blastRadius: 12,
      damage: 7,
      knockbackSpeed: 90
    };
    const hitEvent = resolveThrownBombBlastPlayerHitEvent(blastEvent, playerState);

    expect(hitEvent).toEqual({
      direction: {
        x: 0.8,
        y: 0.6
      },
      damage: 7,
      knockbackSpeed: 90
    });
    expect(
      resolveThrownBombBlastPlayerHitEvent(
        {
          ...blastEvent,
          blastRadius: 9
        },
        playerState
      )
    ).toBeNull();
    expect(applyThrownBombBlastHitToPlayer(playerState, hitEvent!)).toEqual(
      createPlayerState({
        position: { x: 48, y: 32 },
        velocity: {
          x: 72,
          y: 54
        },
        grounded: false,
        facing: 'right',
        health: 28
      })
    );
  });

  it('collects deterministic blast break targets only for mineable and utility tiles', () => {
    const tileIds = new Map<string, number>([
      ['1,0', STARTER_ROPE_TILE_ID],
      ['2,0', 1],
      ['1,1', 1]
    ]);
    const wallIds = new Map<string, number>([
      ['0,0', STARTER_DIRT_WALL_ID],
      ['1,1', STARTER_DIRT_WALL_ID],
      ['3,0', STARTER_DIRT_WALL_ID]
    ]);
    const world = {
      getTile: (worldTileX: number, worldTileY: number) =>
        tileIds.get(`${worldTileX},${worldTileY}`) ?? 0,
      getWall: (worldTileX: number, worldTileY: number) =>
        wallIds.get(`${worldTileX},${worldTileY}`) ?? 0
    };

    expect(
      resolveThrownBombBlastBreakTargets(
        {
          position: { x: 24, y: 8 },
          blastRadius: 20,
          damage: 7,
          knockbackSpeed: 90
        },
        {
          world
        }
      )
    ).toEqual([
      {
        worldTileX: 1,
        worldTileY: 0,
        targetLayer: 'tile',
        targetId: STARTER_ROPE_TILE_ID
      },
      {
        worldTileX: 2,
        worldTileY: 0,
        targetLayer: 'tile',
        targetId: 1
      },
      {
        worldTileX: 1,
        worldTileY: 1,
        targetLayer: 'tile',
        targetId: 1
      }
    ]);
  });
});
