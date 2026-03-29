import { describe, expect, it } from 'vitest';

import { MAX_LIGHT_LEVEL } from '../world/constants';
import { createDroppedItemState } from '../world/droppedItem';
import { createPlayerState } from '../world/playerState';
import {
  cloneStandalonePlayerRenderState,
  createStandalonePlayerRenderPresentationState
} from '../world/standalonePlayerRenderState';
import {
  buildGrapplingHookTetherPlaceholderVertices,
  getGrapplingHookTetherPlaceholderNearbyLightSample,
  resolveInterpolatedGrapplingHookTetherPlaceholderEndpoints
} from './grapplingHookTetherPlaceholder';

describe('grapplingHookTetherPlaceholder', () => {
  it('resolves interpolated tether endpoints from the player focus and hook snapshots', () => {
    const previousPlayerState = createPlayerState({
      position: { x: 8, y: 28 }
    });
    const currentPlayerState = createPlayerState({
      position: { x: 16, y: 28 }
    });
    const previousHookState = createDroppedItemState({
      position: { x: 20, y: 14 },
      itemId: 'grappling-hook',
      amount: 1
    });
    const currentHookState = createDroppedItemState({
      position: { x: 28, y: 14 },
      itemId: 'grappling-hook',
      amount: 1
    });

    expect(
      resolveInterpolatedGrapplingHookTetherPlaceholderEndpoints(
        {
          previous: cloneStandalonePlayerRenderState(
            previousPlayerState,
            createStandalonePlayerRenderPresentationState()
          ),
          current: cloneStandalonePlayerRenderState(
            currentPlayerState,
            createStandalonePlayerRenderPresentationState()
          )
        },
        {
          previous: previousHookState,
          current: currentHookState
        },
        0.5
      )
    ).toEqual({
      playerWorldPoint: { x: 12, y: 14 },
      hookWorldPoint: { x: 24, y: 14 }
    });
  });

  it('builds a horizontal tether strip between the player and hook points', () => {
    expect(
      Array.from(
        buildGrapplingHookTetherPlaceholderVertices({
          playerWorldPoint: { x: 12, y: 14 },
          hookWorldPoint: { x: 24, y: 14 }
        })
      )
    ).toEqual([
      12,
      13,
      0,
      0,
      12,
      15,
      0,
      1,
      24,
      15,
      1,
      1,
      12,
      13,
      0,
      0,
      24,
      15,
      1,
      1,
      24,
      13,
      1,
      0
    ]);
  });

  it('samples the brightest nearby world light across the tether span', () => {
    const world = {
      getLightLevel: (tileX: number, tileY: number) => {
        if (tileX === 2 && tileY === 1) {
          return MAX_LIGHT_LEVEL;
        }

        return 0;
      }
    };

    expect(
      getGrapplingHookTetherPlaceholderNearbyLightSample(world, {
        playerWorldPoint: { x: 12, y: 14 },
        hookWorldPoint: { x: 24, y: 14 }
      })
    ).toEqual({
      level: MAX_LIGHT_LEVEL,
      sourceTile: { x: 2, y: 1 }
    });
  });
});
