import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import {
  clearGrapplingHookState,
  cloneGrapplingHookState,
  createFiredGrapplingHookStateFromUse,
  createGrapplingHookState,
  createIdleGrapplingHookState,
  DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
  DEFAULT_GRAPPLING_HOOK_RADIUS,
  DEFAULT_GRAPPLING_HOOK_SPEED,
  evaluateGrapplingHookAimRange,
  evaluateGrapplingHookPreviewTarget,
  isGrapplingHookActive,
  isGrapplingHookLatched,
  shouldDetachLatchedGrapplingHookForTileEdit,
  stepLatchedGrapplingHookTraversal,
  stepGrapplingHookState,
  tryFireGrapplingHook
} from './grapplingHook';
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

describe('grapplingHook', () => {
  it('starts an in-flight hook state from player aim and clones it safely', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });

    const fireResult = tryFireGrapplingHook(
      playerState,
      createIdleGrapplingHookState(),
      {
        x: 38,
        y: -26
      }
    );

    expect(fireResult).toEqual({
      nextState: {
        kind: 'fired',
        phase: 'in-flight',
        originWorldPoint: { x: 8, y: 14 },
        targetWorldPoint: { x: 38, y: -26 },
        hookWorldPoint: { x: 8, y: 14 },
        velocity: {
          x: DEFAULT_GRAPPLING_HOOK_SPEED * 0.6,
          y: DEFAULT_GRAPPLING_HOOK_SPEED * -0.8
        },
        radius: DEFAULT_GRAPPLING_HOOK_RADIUS,
        maxRange: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
        travelledDistance: 0,
        latchedTile: null
      },
      hookFired: true,
      blockedReason: null
    });
    expect(isGrapplingHookActive(fireResult.nextState)).toBe(true);
    expect(isGrapplingHookLatched(fireResult.nextState)).toBe(false);

    const clonedState = cloneGrapplingHookState(fireResult.nextState);
    if (clonedState.kind !== 'fired') {
      throw new Error('expected a fired grappling-hook state');
    }
    clonedState.hookWorldPoint.x += 10;
    expect(fireResult.nextState).toEqual({
      kind: 'fired',
      phase: 'in-flight',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 38, y: -26 },
      hookWorldPoint: { x: 8, y: 14 },
      velocity: {
        x: DEFAULT_GRAPPLING_HOOK_SPEED * 0.6,
        y: DEFAULT_GRAPPLING_HOOK_SPEED * -0.8
      },
      radius: DEFAULT_GRAPPLING_HOOK_RADIUS,
      maxRange: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
      travelledDistance: 0,
      latchedTile: null
    });
  });

  it('falls back to the current facing direction when the aim target sits on the player focus point', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'left'
    });

    expect(createFiredGrapplingHookStateFromUse(playerState, { x: 8, y: 14 })).toEqual({
      kind: 'fired',
      phase: 'in-flight',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 8, y: 14 },
      hookWorldPoint: { x: 8, y: 14 },
      velocity: {
        x: -DEFAULT_GRAPPLING_HOOK_SPEED,
        y: 0
      },
      radius: DEFAULT_GRAPPLING_HOOK_RADIUS,
      maxRange: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
      travelledDistance: 0,
      latchedTile: null
    });
  });

  it('blocks dead players and already-active hooks without mutating the source state', () => {
    const firedState = createGrapplingHookState({
      kind: 'fired',
      phase: 'in-flight',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 24, y: 14 },
      hookWorldPoint: { x: 12, y: 14 },
      velocity: { x: 540, y: 0 },
      radius: DEFAULT_GRAPPLING_HOOK_RADIUS,
      maxRange: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
      travelledDistance: 4,
      latchedTile: null
    });

    expect(
      tryFireGrapplingHook(
        createPlayerState({
          position: { x: 8, y: 28 },
          health: 0
        }),
        createIdleGrapplingHookState(),
        { x: 24, y: 14 }
      )
    ).toEqual({
      nextState: createIdleGrapplingHookState(),
      hookFired: false,
      blockedReason: 'dead'
    });

    const blockedWhileActive = tryFireGrapplingHook(
      createPlayerState({
        position: { x: 8, y: 28 },
        facing: 'left'
      }),
      firedState,
      { x: -24, y: 14 }
    );

    expect(blockedWhileActive).toEqual({
      nextState: firedState,
      hookFired: false,
      blockedReason: 'active-hook'
    });
    expect(blockedWhileActive.nextState).not.toBe(firedState);
    expect(clearGrapplingHookState()).toEqual(createIdleGrapplingHookState());
  });

  it('evaluates selected-hook aim targets against the maximum hook range from the player focus', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });

    expect(
      evaluateGrapplingHookAimRange(playerState, {
        x: 8 + DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
        y: 14
      })
    ).toEqual({
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 8 + DEFAULT_GRAPPLING_HOOK_MAX_RANGE, y: 14 },
      distance: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
      maxRange: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
      withinRange: true
    });

    expect(
      evaluateGrapplingHookAimRange(playerState, {
        x: 8 + DEFAULT_GRAPPLING_HOOK_MAX_RANGE + 1,
        y: 14
      })
    ).toMatchObject({
      distance: DEFAULT_GRAPPLING_HOOK_MAX_RANGE + 1,
      withinRange: false
    });
  });

  it('marks only in-range solid preview targets as latch-ready', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });

    expect(
      evaluateGrapplingHookPreviewTarget(
        playerState,
        {
          x: 32,
          y: 14
        },
        1
      )
    ).toMatchObject({
      targetSolid: true,
      withinRange: true,
      latchReady: true
    });

    expect(
      evaluateGrapplingHookPreviewTarget(
        playerState,
        {
          x: 32,
          y: 14
        },
        0
      )
    ).toMatchObject({
      targetSolid: false,
      withinRange: true,
      latchReady: false
    });

    expect(
      evaluateGrapplingHookPreviewTarget(
        playerState,
        {
          x: 8 + DEFAULT_GRAPPLING_HOOK_MAX_RANGE + 1,
          y: 14
        },
        1
      )
    ).toMatchObject({
      targetSolid: true,
      withinRange: false,
      latchReady: false
    });
  });

  it('advances in-flight hook states in a straight line and clears them once they outrun the maximum range', () => {
    const initialState = createGrapplingHookState({
      kind: 'fired',
      phase: 'in-flight',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 80, y: 14 },
      hookWorldPoint: { x: 8, y: 14 },
      velocity: { x: 300, y: 0 },
      radius: 4,
      maxRange: 60,
      travelledDistance: 0,
      latchedTile: null
    });

    const steppedResult = stepGrapplingHookState(initialState, {
      fixedDtSeconds: 0.1
    });

    expect(steppedResult.nextState).toEqual({
      kind: 'fired',
      phase: 'in-flight',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 80, y: 14 },
      hookWorldPoint: { x: 38, y: 14 },
      velocity: { x: 300, y: 0 },
      radius: 4,
      maxRange: 60,
      travelledDistance: 30,
      latchedTile: null
    });
    expect(cloneGrapplingHookState(initialState)).toEqual(initialState);

    expect(
      stepGrapplingHookState(steppedResult.nextState, {
        fixedDtSeconds: 0.1
      })
    ).toEqual({
      nextState: createIdleGrapplingHookState()
    });
  });

  it('latches onto the first solid tile along the hook travel segment and then stays anchored', () => {
    const world = new TileWorld(0);
    clearTileRect(world, -1, 6, -2, 1);
    world.setTile(2, 0, 1);
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });

    const stepResult = stepGrapplingHookState(
      createFiredGrapplingHookStateFromUse(playerState, {
        x: 80,
        y: 14
      }),
      {
        world: {
          getTile: (worldTileX, worldTileY) => world.getTile(worldTileX, worldTileY)
        },
        fixedDtSeconds: 0.2
      }
    );

    expect(stepResult.nextState).toMatchObject({
      kind: 'fired',
      phase: 'latched',
      hookWorldPoint: {
        x: 28,
        y: 14
      },
      travelledDistance: 20,
      latchedTile: {
        worldTileX: 2,
        worldTileY: 0,
        tileId: 1
      }
    });
    if (stepResult.nextState.kind !== 'fired') {
      throw new Error('expected the grappling hook to remain fired after latching');
    }
    expect(stepResult.nextState.velocity).toEqual({
      x: 0,
      y: 0
    });
    expect(isGrapplingHookLatched(stepResult.nextState)).toBe(true);

    expect(
      stepGrapplingHookState(stepResult.nextState, {
        fixedDtSeconds: 0.2
      })
    ).toEqual({
      nextState: stepResult.nextState
    });
  });

  it('pulls the player toward a latched anchor and detaches once the player reaches release range', () => {
    const world = new TileWorld(0);
    clearTileRect(world, -1, 6, -2, 1);
    world.setTile(2, 0, 1);
    const playerState = createPlayerState({
      position: { x: 8, y: 28 },
      facing: 'right'
    });
    const latchedState = createGrapplingHookState({
      kind: 'fired',
      phase: 'latched',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 80, y: 14 },
      hookWorldPoint: { x: 28, y: 14 },
      velocity: { x: 0, y: 0 },
      radius: DEFAULT_GRAPPLING_HOOK_RADIUS,
      maxRange: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
      travelledDistance: 20,
      latchedTile: {
        worldTileX: 2,
        worldTileY: 0,
        tileId: 1
      }
    });

    const pullStep = stepLatchedGrapplingHookTraversal(playerState, latchedState, {
      world,
      fixedDtSeconds: 0.1,
      pullSpeed: 100,
      releaseDistance: 4
    });

    expect(pullStep.nextPlayerState.position).toEqual({
      x: 18,
      y: 28
    });
    expect(pullStep.nextPlayerState.velocity).toEqual({
      x: 100,
      y: 0
    });
    expect(pullStep.nextHookState).toEqual(latchedState);
    expect(pullStep.detachedReason).toBeNull();

    const detachStep = stepLatchedGrapplingHookTraversal(
      pullStep.nextPlayerState,
      pullStep.nextHookState,
      {
        world,
        fixedDtSeconds: 0.1,
        pullSpeed: 100,
        releaseDistance: 4
      }
    );

    expect(detachStep.nextPlayerState.position).toEqual({
      x: 26,
      y: 28
    });
    expect(detachStep.nextPlayerState.velocity).toEqual({
      x: 0,
      y: 0
    });
    expect(detachStep.nextHookState).toEqual(createIdleGrapplingHookState());
    expect(detachStep.detachedReason).toBe('reached-anchor');
  });

  it('detaches a latched hook when its anchor tile becomes non-solid', () => {
    const latchedState = createGrapplingHookState({
      kind: 'fired',
      phase: 'latched',
      originWorldPoint: { x: 8, y: 14 },
      targetWorldPoint: { x: 80, y: 14 },
      hookWorldPoint: { x: 28, y: 14 },
      velocity: { x: 0, y: 0 },
      radius: DEFAULT_GRAPPLING_HOOK_RADIUS,
      maxRange: DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
      travelledDistance: 20,
      latchedTile: {
        worldTileX: 2,
        worldTileY: 0,
        tileId: 1
      }
    });

    expect(
      shouldDetachLatchedGrapplingHookForTileEdit(latchedState, {
        worldTileX: 1,
        worldTileY: 0,
        tileId: 0
      })
    ).toBe(false);
    expect(
      shouldDetachLatchedGrapplingHookForTileEdit(latchedState, {
        worldTileX: 2,
        worldTileY: 0,
        tileId: 19
      })
    ).toBe(false);
    expect(
      shouldDetachLatchedGrapplingHookForTileEdit(latchedState, {
        worldTileX: 2,
        worldTileY: 0,
        tileId: 0
      })
    ).toBe(true);
    expect(
      shouldDetachLatchedGrapplingHookForTileEdit(createIdleGrapplingHookState(), {
        worldTileX: 2,
        worldTileY: 0,
        tileId: 0
      })
    ).toBe(false);
  });
});
