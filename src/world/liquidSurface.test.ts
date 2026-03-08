import { describe, expect, it } from 'vitest';

import { TILE_METADATA } from './tileMetadata';
import {
  resolveConnectedLiquidNeighborLevel,
  resolveLiquidSurfaceBottomVCrops,
  resolveLiquidSurfaceBranchKind,
  resolveLiquidSurfaceTopHeights
} from './liquidSurface';

describe('resolveLiquidSurfaceBranchKind', () => {
  it('classifies empty tiles when the clamped center fill is zero', () => {
    expect(
      resolveLiquidSurfaceBranchKind({
        center: -3,
        north: 8,
        east: 8,
        west: 8
      })
    ).toBe('empty');
  });

  it('classifies north-covered tiles when same-kind liquid continues above', () => {
    expect(
      resolveLiquidSurfaceBranchKind({
        center: 3,
        north: 2,
        east: 8,
        west: 0
      })
    ).toBe('north-covered');
  });

  it('classifies exposed tiles when liquid remains in the center without a north cover tile', () => {
    expect(
      resolveLiquidSurfaceBranchKind({
        center: 4,
        north: 0,
        east: 2,
        west: 8
      })
    ).toBe('exposed');
  });
});

describe('resolveLiquidSurfaceTopHeights', () => {
  it('returns zero heights when the center tile has no liquid after clamping', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: -3,
        north: 8,
        east: 8,
        west: 8
      })
    ).toEqual({
      topLeft: 0,
      topRight: 0
    });
  });

  it('clamps out-of-range exposed fill levels before resolving corner heights', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: 4,
        north: 0,
        east: 99,
        west: -12
      })
    ).toEqual({
      topLeft: 0.5,
      topRight: 0.75
    });
  });

  it('forces a full-height top when same-kind liquid continues above the tile', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: 3,
        north: 2,
        east: 8,
        west: 0
      })
    ).toEqual({
      topLeft: 1,
      topRight: 1
    });
  });

  it('resolves asymmetric exposed slopes from same-kind side neighbors', () => {
    expect(
      resolveLiquidSurfaceTopHeights({
        center: 4,
        north: 0,
        east: 2,
        west: 8
      })
    ).toEqual({
      topLeft: 0.75,
      topRight: 0.375
    });
  });

  it('keeps shared boundary heights continuous across neighboring tiles', () => {
    const leftTile = resolveLiquidSurfaceTopHeights({
      center: 4,
      north: 0,
      east: 8,
      west: 0
    });
    const rightTile = resolveLiquidSurfaceTopHeights({
      center: 8,
      north: 0,
      east: 0,
      west: 4
    });

    expect(leftTile.topRight).toBe(0.75);
    expect(rightTile.topLeft).toBe(0.75);
    expect(leftTile.topRight).toBe(rightTile.topLeft);
  });
});

describe('resolveConnectedLiquidNeighborLevel', () => {
  const waterTileId =
    TILE_METADATA.tiles.find((tile) => tile.gameplay?.liquidKind === 'water')?.id ?? null;
  const lavaTileId =
    TILE_METADATA.tiles.find((tile) => tile.gameplay?.liquidKind === 'lava')?.id ?? null;

  it('ignores non-connected liquid neighbors while preserving same-kind levels', () => {
    if (waterTileId === null || lavaTileId === null) {
      throw new Error('expected water and lava tile metadata');
    }

    expect(resolveConnectedLiquidNeighborLevel(waterTileId, waterTileId, 6)).toBe(6);
    expect(resolveConnectedLiquidNeighborLevel(waterTileId, lavaTileId, 6)).toBe(0);
  });
});

describe('resolveLiquidSurfaceBottomVCrops', () => {
  it('maps resolved liquid top heights onto bottom-edge variant v coordinates', () => {
    expect(
      resolveLiquidSurfaceBottomVCrops(
        {
          v0: 0.75,
          v1: 0.875
        },
        {
          topLeft: 0.5,
          topRight: 0.375
        }
      )
    ).toEqual({
      bottomLeftV: 0.8125,
      bottomRightV: 0.796875
    });
  });

  it('clamps invalid top heights before resolving bottom-edge crops', () => {
    expect(
      resolveLiquidSurfaceBottomVCrops(
        {
          v0: 0.5,
          v1: 0.75
        },
        {
          topLeft: 99,
          topRight: -4
        }
      )
    ).toEqual({
      bottomLeftV: 0.75,
      bottomRightV: 0.5
    });
  });
});
