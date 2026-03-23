import { describe, expect, it } from 'vitest';

import {
  collectDebugBreakPreviewTargets,
  evaluateDebugBreakTarget,
  resolveDebugBreakPreviewTarget
} from './debugBreakTargeting';

describe('evaluateDebugBreakTarget', () => {
  it('targets the foreground tile before the wall layer in mixed cells', () => {
    const world = {
      getTile: () => 7,
      getWall: () => 3
    };

    expect(evaluateDebugBreakTarget(world, 4, -2)).toEqual({
      tileX: 4,
      tileY: -2,
      tileId: 7,
      wallId: 3,
      targetLayer: 'tile',
      targetId: 7,
      breakableTarget: true
    });
  });

  it('falls back to the wall layer when the foreground tile is empty', () => {
    const world = {
      getTile: () => 0,
      getWall: () => 2
    };

    expect(evaluateDebugBreakTarget(world, 9, 5)).toEqual({
      tileX: 9,
      tileY: 5,
      tileId: 0,
      wallId: 2,
      targetLayer: 'wall',
      targetId: 2,
      breakableTarget: true
    });
  });

  it('reports empty cells as not breakable', () => {
    const world = {
      getTile: () => 0,
      getWall: () => 0
    };

    expect(evaluateDebugBreakTarget(world, -3, 12)).toEqual({
      tileX: -3,
      tileY: 12,
      tileId: 0,
      wallId: 0,
      targetLayer: null,
      targetId: 0,
      breakableTarget: false
    });
  });
});

describe('resolveDebugBreakPreviewTarget', () => {
  it('returns a wall-layer preview target for wall-only cells', () => {
    const world = {
      getTile: () => 0,
      getWall: () => 5
    };

    expect(resolveDebugBreakPreviewTarget(world, 1, 2)).toEqual({
      tileX: 1,
      tileY: 2,
      targetLayer: 'wall'
    });
  });
});

describe('collectDebugBreakPreviewTargets', () => {
  it('filters empty cells while preserving wall-only targets and foreground precedence', () => {
    const worldState = new Map<string, { tileId: number; wallId: number }>([
      ['0,0', { tileId: 0, wallId: 1 }],
      ['1,0', { tileId: 8, wallId: 2 }],
      ['2,0', { tileId: 0, wallId: 0 }],
      ['3,0', { tileId: 0, wallId: 4 }]
    ]);
    const world = {
      getTile: (worldTileX: number, worldTileY: number) =>
        worldState.get(`${worldTileX},${worldTileY}`)?.tileId ?? 0,
      getWall: (worldTileX: number, worldTileY: number) =>
        worldState.get(`${worldTileX},${worldTileY}`)?.wallId ?? 0
    };

    expect(
      collectDebugBreakPreviewTargets(world, (visit) => {
        visit(0, 0);
        visit(1, 0);
        visit(2, 0);
        visit(3, 0);
      })
    ).toEqual([
      { tileX: 0, tileY: 0, targetLayer: 'wall' },
      { tileX: 1, tileY: 0, targetLayer: 'tile' },
      { tileX: 3, tileY: 0, targetLayer: 'wall' }
    ]);
  });

  it('deduplicates repeated visited cells', () => {
    const world = {
      getTile: () => 6,
      getWall: () => 2
    };

    expect(
      collectDebugBreakPreviewTargets(world, (visit) => {
        visit(4, -4);
        visit(4, -4);
      })
    ).toEqual([{ tileX: 4, tileY: -4, targetLayer: 'tile' }]);
  });
});
