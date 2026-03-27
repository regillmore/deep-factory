import { describe, expect, it } from 'vitest';

import {
  normalizeAutotileAdjacencyMask,
  TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK,
  TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
} from './autotile';
import {
  AUTHORED_ATLAS_HEIGHT,
  AUTHORED_ATLAS_REGION_COUNT,
  AUTHORED_ATLAS_WIDTH
} from './authoredAtlasLayout';
import {
  describeLiquidConnectivityGroup,
  describeLiquidRenderVariantPixelBounds,
  describeLiquidRenderVariantPixelBoundsAtElapsedMs,
  describeLiquidRenderVariantUvRect,
  describeLiquidRenderVariantUvRectAtElapsedMs,
  describeLiquidRenderVariantSource,
  describeLiquidRenderVariantSourceAtElapsedMs,
  describeTileRenderPixelBoundsAtElapsedMs,
  describeTileRenderSourceAtElapsedMs,
  describeTileRenderUvRectAtElapsedMs,
  getAnimatedLiquidRenderVariantFrameCount,
  getAnimatedLiquidRenderVariantFrameDurationMs,
  describeTileUvRectPixelBounds,
  describeTileUvRect,
  LIQUID_RENDER_CARDINAL_MASK_COUNT,
  TILE_METADATA,
  areLiquidRenderNeighborsConnected,
  areTerrainAutotileNeighborsConnected,
  atlasIndexToUvRect,
  doesTileBlockLight,
  getAnimatedTileRenderFrameCount,
  getAnimatedTileRenderFrameDurationMs,
  getTileEmissiveLightLevel,
  getTileLiquidKind,
  hasAnimatedLiquidRenderVariantMetadata,
  hasAnimatedTileRenderMetadata,
  hasLiquidRenderMetadata,
  hasTerrainAutotileMetadata,
  isTileClimbable,
  isTileOneWayPlatform,
  isTileSolid,
  parseTileMetadataRegistry,
  resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs,
  resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameUvRect,
  resolveAnimatedLiquidRenderVariantFrameUvRectAtElapsedMs,
  resolveAnimatedTileRenderFrameIndexAtElapsedMs,
  resolveAnimatedTileRenderFrameUvRect,
  resolveAnimatedTileRenderFrameUvRectAtElapsedMs,
  resolveLiquidRenderCardinalMaskFromNeighborhood,
  resolveLiquidRenderVariantFrameMetadataAtElapsedMs,
  resolveLiquidRenderVariantUvRectAtElapsedMs,
  resolveLiquidRenderVariantMetadata,
  resolveLiquidRenderVariantUvRect,
  resolveTileGameplayMetadata,
  resolveTerrainAutotileAtlasIndexByRawAdjacencyMask,
  resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask,
  resolveTerrainAutotileUvRectByRawAdjacencyMask,
  resolveTerrainAutotileVariantAtlasIndex,
  resolveTerrainAutotileUvRectByNormalizedAdjacencyMask,
  resolveTerrainAutotileVariantUvRect,
  resolveTileRenderUvRect
} from './tileMetadata';

const authoredUvRectFromPixels = (x0: number, y0: number, x1: number, y1: number) => ({
  u0: x0 / AUTHORED_ATLAS_WIDTH,
  v0: y0 / AUTHORED_ATLAS_HEIGHT,
  u1: x1 / AUTHORED_ATLAS_WIDTH,
  v1: y1 / AUTHORED_ATLAS_HEIGHT
});

const describeAuthoredUvRectFromPixels = (
  x0: number,
  y0: number,
  x1: number,
  y1: number
): string => describeTileUvRect(authoredUvRectFromPixels(x0, y0, x1, y1))!;

const describeAuthoredSourceFromPixels = (
  x0: number,
  y0: number,
  x1: number,
  y1: number
): string => `uvRect ${describeAuthoredUvRectFromPixels(x0, y0, x1, y1)}`;

describe('tile metadata loader', () => {
  it('loads placeholder terrain autotile mappings from JSON', () => {
    expect(TILE_METADATA.tilesById.size).toBeGreaterThanOrEqual(22);
    expect(hasTerrainAutotileMetadata(1)).toBe(true);
    expect(hasTerrainAutotileMetadata(2)).toBe(true);
    expect(hasTerrainAutotileMetadata(13)).toBe(true);
    expect(hasTerrainAutotileMetadata(19)).toBe(true);
    expect(hasTerrainAutotileMetadata(3)).toBe(false);
    expect(hasLiquidRenderMetadata(7)).toBe(true);
    expect(hasLiquidRenderMetadata(8)).toBe(true);
    expect(hasLiquidRenderMetadata(3)).toBe(false);
    expect(areTerrainAutotileNeighborsConnected(1, 2)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(1, 13)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(19, 19)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(19, 1)).toBe(false);
    expect(areTerrainAutotileNeighborsConnected(1, 3)).toBe(false);
    expect(areLiquidRenderNeighborsConnected(7, 7)).toBe(true);
    expect(areLiquidRenderNeighborsConnected(7, 8)).toBe(false);
    expect(resolveTileGameplayMetadata(0)).toEqual({ solid: false, blocksLight: false });
    expect(resolveTileGameplayMetadata(1)).toEqual({ solid: true, blocksLight: true });
    expect(resolveTileGameplayMetadata(10)).toEqual({
      solid: false,
      blocksLight: false,
      emissiveLight: 12
    });
    expect(resolveTileGameplayMetadata(11)).toEqual({
      solid: false,
      blocksLight: false,
      climbable: true
    });
    expect(resolveTileGameplayMetadata(14)).toEqual({
      solid: false,
      blocksLight: false
    });
    expect(resolveTileGameplayMetadata(15)).toEqual({
      solid: false,
      blocksLight: false
    });
    expect(resolveTileGameplayMetadata(16)).toEqual({
      solid: false,
      blocksLight: false
    });
    expect(resolveTileGameplayMetadata(17)).toEqual({
      solid: false,
      blocksLight: false
    });
    expect(resolveTileGameplayMetadata(18)).toEqual({
      solid: false,
      blocksLight: false
    });
    expect(resolveTileGameplayMetadata(19)).toEqual({
      solid: true,
      blocksLight: true
    });
    expect(resolveTileGameplayMetadata(20)).toEqual({
      solid: false,
      blocksLight: false,
      oneWayPlatform: true
    });
    expect(resolveTileGameplayMetadata(21)).toEqual({
      solid: false,
      blocksLight: false
    });
    expect(resolveTileGameplayMetadata(22)).toEqual({
      solid: false,
      blocksLight: false
    });
    expect(isTileSolid(1)).toBe(true);
    expect(isTileSolid(4)).toBe(false);
    expect(isTileSolid(19)).toBe(true);
    expect(isTileClimbable(11)).toBe(true);
    expect(isTileClimbable(10)).toBe(false);
    expect(isTileOneWayPlatform(20)).toBe(true);
    expect(isTileOneWayPlatform(10)).toBe(false);
    expect(doesTileBlockLight(1)).toBe(true);
    expect(doesTileBlockLight(4)).toBe(false);
    expect(doesTileBlockLight(19)).toBe(true);
    expect(getTileEmissiveLightLevel(10)).toBe(12);
    expect(getTileLiquidKind(1)).toBe(null);
    expect(getTileLiquidKind(7)).toBe('water');
    expect(getTileLiquidKind(8)).toBe('lava');

    expect(resolveTerrainAutotileVariantAtlasIndex(1, 0)).toBe(0);
    expect(resolveTerrainAutotileVariantAtlasIndex(1, 15)).toBe(15);
    expect(resolveTerrainAutotileVariantAtlasIndex(2, 6)).toBe(6);
    expect(resolveTerrainAutotileVariantAtlasIndex(19, 6)).toBe(6);
    expect(resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(1, 0)).toBe(0);
    expect(resolveTileRenderUvRect(1)).toEqual(atlasIndexToUvRect(31));
    expect(resolveTileRenderUvRect(2)).toEqual(atlasIndexToUvRect(29));
    expect(resolveTileRenderUvRect(12)).toEqual(atlasIndexToUvRect(27));
    expect(resolveTileRenderUvRect(3)).toEqual(atlasIndexToUvRect(14));
    expect(resolveTileRenderUvRect(9)).toEqual(atlasIndexToUvRect(30));
    expect(resolveTileRenderUvRect(10)).toEqual(atlasIndexToUvRect(20));
    expect(resolveTileRenderUvRect(11)).toEqual(atlasIndexToUvRect(19));
    expect(resolveTileRenderUvRect(13)).toEqual(atlasIndexToUvRect(32));
    expect(resolveTileRenderUvRect(14)).toEqual(atlasIndexToUvRect(28));
    expect(resolveTileRenderUvRect(15)).toEqual(atlasIndexToUvRect(26));
    expect(resolveTileRenderUvRect(16)).toEqual(atlasIndexToUvRect(23));
    expect(resolveTileRenderUvRect(17)).toEqual(atlasIndexToUvRect(24));
    expect(resolveTileRenderUvRect(18)).toEqual(authoredUvRectFromPixels(81, 17, 95, 31));
    expect(resolveTileRenderUvRect(19)).toEqual(atlasIndexToUvRect(33));
    expect(resolveTileRenderUvRect(20)).toEqual(atlasIndexToUvRect(21));
    expect(resolveTileRenderUvRect(21)).toEqual(atlasIndexToUvRect(37));
    expect(resolveTileRenderUvRect(22)).toEqual(atlasIndexToUvRect(23));
    expect(hasAnimatedTileRenderMetadata(10)).toBe(true);
    expect(hasAnimatedTileRenderMetadata(18)).toBe(true);
    expect(getAnimatedTileRenderFrameCount(10)).toBe(2);
    expect(getAnimatedTileRenderFrameCount(18)).toBe(2);
    expect(getAnimatedTileRenderFrameDurationMs(10)).toBe(180);
    expect(getAnimatedTileRenderFrameDurationMs(18)).toBe(300);
    expect(resolveAnimatedTileRenderFrameUvRect(10, 0)).toBe(atlasIndexToUvRect(20));
    expect(resolveAnimatedTileRenderFrameUvRect(10, 1)).toBe(atlasIndexToUvRect(22));
    expect(resolveAnimatedTileRenderFrameUvRect(18, 0)).toEqual(
      authoredUvRectFromPixels(81, 17, 95, 31)
    );
    expect(resolveAnimatedTileRenderFrameUvRect(18, 1)).toEqual(
      authoredUvRectFromPixels(82, 17, 96, 31)
    );
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(10, 179)).toBe(0);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(10, 180)).toBe(1);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(10, 360)).toBe(0);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(18, 299)).toBe(0);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(18, 300)).toBe(1);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(18, 600)).toBe(0);
    expect(resolveAnimatedTileRenderFrameUvRectAtElapsedMs(10, 180)).toBe(atlasIndexToUvRect(22));
    expect(resolveAnimatedTileRenderFrameUvRectAtElapsedMs(18, 300)).toEqual(
      authoredUvRectFromPixels(82, 17, 96, 31)
    );
    expect(describeTileRenderSourceAtElapsedMs(10, 0)).toBe('atlasIndex 20');
    expect(describeTileRenderSourceAtElapsedMs(10, 180)).toBe('atlasIndex 22');
    expect(describeTileRenderSourceAtElapsedMs(18, 0)).toBe(
      describeAuthoredSourceFromPixels(81, 17, 95, 31)
    );
    expect(describeTileRenderSourceAtElapsedMs(18, 300)).toBe(
      describeAuthoredSourceFromPixels(82, 17, 96, 31)
    );
    expect(describeTileRenderUvRectAtElapsedMs(10, 180)).toBe(describeTileUvRect(atlasIndexToUvRect(22)));
    expect(describeTileRenderUvRectAtElapsedMs(18, 300)).toBe(
      describeTileUvRect(authoredUvRectFromPixels(82, 17, 96, 31))
    );
    expect(
      describeTileRenderPixelBoundsAtElapsedMs(10, 180, AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    ).toBe(
      describeTileUvRectPixelBounds(atlasIndexToUvRect(22), AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    );
    expect(
      describeTileRenderPixelBoundsAtElapsedMs(18, 300, AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    ).toBe('82,17..96,31');
    expect(describeTileRenderSourceAtElapsedMs(6, 0)).toBe(
      describeAuthoredSourceFromPixels(16, 16, 32, 32)
    );
    expect(describeTileRenderSourceAtElapsedMs(6, 180)).toBe(
      describeAuthoredSourceFromPixels(48, 16, 64, 32)
    );
    expect(describeTileRenderUvRectAtElapsedMs(6, 180)).toBe(
      describeTileUvRect(authoredUvRectFromPixels(48, 16, 64, 32))
    );
    expect(
      describeTileRenderPixelBoundsAtElapsedMs(6, 180, AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    ).toBe('48,16..64,32');
    expect(resolveLiquidRenderVariantMetadata(7, 0)).toMatchObject({
      uvRect: authoredUvRectFromPixels(64, 16, 72, 32)
    });
    expect(describeLiquidRenderVariantSource(7, 0)).toBe(
      describeAuthoredSourceFromPixels(64, 16, 72, 32)
    );
    expect(resolveLiquidRenderVariantUvRect(7, 0)).toEqual(authoredUvRectFromPixels(64, 16, 72, 32));
    expect(describeLiquidRenderVariantSource(7, 3)).toBe(
      describeAuthoredSourceFromPixels(64, 8, 68, 16)
    );
    expect(describeLiquidRenderVariantSource(7, 6)).toBe(
      describeAuthoredSourceFromPixels(68, 0, 72, 8)
    );
    expect(describeLiquidRenderVariantSource(7, 7)).toBe(
      describeAuthoredSourceFromPixels(64, 16, 68, 32)
    );
    expect(describeLiquidRenderVariantSource(7, 9)).toBe(
      describeAuthoredSourceFromPixels(64, 0, 68, 8)
    );
    expect(describeLiquidRenderVariantSource(7, 12)).toBe(
      describeAuthoredSourceFromPixels(68, 8, 72, 16)
    );
    expect(describeLiquidRenderVariantSource(7, 13)).toBe(
      describeAuthoredSourceFromPixels(68, 16, 72, 32)
    );
    expect(describeLiquidRenderVariantSource(7, 14)).toBe(
      describeAuthoredSourceFromPixels(64, 24, 72, 32)
    );
    expect(describeLiquidRenderVariantSource(7, 15)).toBe(
      describeAuthoredSourceFromPixels(64, 0, 72, 16)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(7, 9, 180)).toBe(
      describeAuthoredSourceFromPixels(72, 0, 76, 8)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(7, 7, 180)).toBe(
      describeAuthoredSourceFromPixels(72, 16, 76, 32)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(7, 14, 180)).toBe(
      describeAuthoredSourceFromPixels(72, 24, 80, 32)
    );
    expect(describeLiquidRenderVariantSource(8, 0)).toBe(
      describeAuthoredSourceFromPixels(48, 48, 56, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 10)).toBe(
      describeAuthoredSourceFromPixels(48, 52, 64, 60)
    );
    expect(describeLiquidRenderVariantSource(8, 1)).toBe(
      describeAuthoredSourceFromPixels(56, 48, 64, 56)
    );
    expect(describeLiquidRenderVariantSource(8, 2)).toBe(
      describeAuthoredSourceFromPixels(48, 48, 52, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 3)).toBe(
      describeAuthoredSourceFromPixels(60, 48, 64, 56)
    );
    expect(describeLiquidRenderVariantSource(8, 4)).toBe(
      describeAuthoredSourceFromPixels(52, 48, 56, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 5)).toBe(
      describeAuthoredSourceFromPixels(52, 48, 60, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 6)).toBe(
      describeAuthoredSourceFromPixels(60, 56, 64, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 7)).toBe(
      describeAuthoredSourceFromPixels(60, 48, 64, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 8)).toBe(
      describeAuthoredSourceFromPixels(60, 48, 64, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 9)).toBe(
      describeAuthoredSourceFromPixels(56, 48, 60, 56)
    );
    expect(describeLiquidRenderVariantSource(8, 12)).toBe(
      describeAuthoredSourceFromPixels(56, 56, 60, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 13)).toBe(
      describeAuthoredSourceFromPixels(56, 48, 60, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 14)).toBe(
      describeAuthoredSourceFromPixels(56, 56, 64, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 11)).toBe(
      describeAuthoredSourceFromPixels(48, 48, 64, 56)
    );
    expect(describeLiquidRenderVariantSource(8, 15)).toBe(
      describeAuthoredSourceFromPixels(48, 56, 64, 64)
    );
    expect(describeLiquidRenderVariantSource(8, 0)).not.toBe(describeLiquidRenderVariantSource(8, 5));
    expect(describeLiquidRenderVariantSource(8, 0)).not.toBe(describeLiquidRenderVariantSource(8, 10));
    expect(describeLiquidRenderVariantSource(8, 1)).not.toBe(describeLiquidRenderVariantSource(8, 0));
    expect(describeLiquidRenderVariantSource(8, 1)).not.toBe(describeLiquidRenderVariantSource(8, 11));
    expect(describeLiquidRenderVariantSource(8, 2)).not.toBe(describeLiquidRenderVariantSource(8, 0));
    expect(describeLiquidRenderVariantSource(8, 2)).not.toBe(describeLiquidRenderVariantSource(8, 1));
    expect(describeLiquidRenderVariantSource(8, 4)).not.toBe(describeLiquidRenderVariantSource(8, 0));
    expect(describeLiquidRenderVariantSource(8, 4)).not.toBe(describeLiquidRenderVariantSource(8, 1));
    expect(describeLiquidRenderVariantSource(8, 5)).not.toBe(describeLiquidRenderVariantSource(8, 1));
    expect(describeLiquidRenderVariantSource(8, 5)).not.toBe(describeLiquidRenderVariantSource(8, 10));
    expect(describeLiquidRenderVariantSource(8, 8)).not.toBe(describeLiquidRenderVariantSource(8, 0));
    expect(describeLiquidRenderVariantSource(8, 8)).not.toBe(describeLiquidRenderVariantSource(8, 2));
    expect(describeLiquidRenderVariantSource(8, 10)).not.toBe(describeLiquidRenderVariantSource(8, 11));
    expect(describeLiquidRenderVariantSource(8, 10)).not.toBe(describeLiquidRenderVariantSource(8, 15));
    expect(describeLiquidRenderVariantSource(8, 11)).not.toBe(describeLiquidRenderVariantSource(8, 15));
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 0, 180)).toBe(
      describeAuthoredSourceFromPixels(32, 48, 40, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 1, 180)).toBe(
      describeAuthoredSourceFromPixels(40, 48, 48, 56)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 2, 180)).toBe(
      describeAuthoredSourceFromPixels(32, 48, 36, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 3, 180)).toBe(
      describeAuthoredSourceFromPixels(44, 48, 48, 56)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 4, 180)).toBe(
      describeAuthoredSourceFromPixels(36, 48, 40, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 5, 180)).toBe(
      describeAuthoredSourceFromPixels(36, 48, 44, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 7, 180)).toBe(
      describeAuthoredSourceFromPixels(44, 48, 48, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 8, 180)).toBe(
      describeAuthoredSourceFromPixels(44, 48, 48, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 12, 180)).toBe(
      describeAuthoredSourceFromPixels(40, 56, 44, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 13, 180)).toBe(
      describeAuthoredSourceFromPixels(40, 48, 44, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 14, 180)).toBe(
      describeAuthoredSourceFromPixels(40, 56, 48, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 15, 180)).toBe(
      describeAuthoredSourceFromPixels(32, 56, 48, 64)
    );
    expect(describeLiquidRenderVariantSourceAtElapsedMs(8, 10, 180)).toBe(
      describeAuthoredSourceFromPixels(32, 52, 48, 60)
    );
    expect(resolveLiquidRenderVariantUvRect(8, 14)).toEqual(authoredUvRectFromPixels(56, 56, 64, 64));
    expect(resolveLiquidRenderVariantUvRect(8, 15)).toEqual(authoredUvRectFromPixels(48, 56, 64, 64));
    expect(resolveTileRenderUvRect(4)).toEqual(authoredUvRectFromPixels(16, 16, 32, 32));
    expect(resolveTerrainAutotileVariantUvRect(2, 6)).toEqual(atlasIndexToUvRect(6));
    expect(resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(2, 0)).toEqual(atlasIndexToUvRect(0));
    expect(resolveTerrainAutotileVariantAtlasIndex(1, TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT)).toBe(
      null
    );
    expect(resolveLiquidRenderVariantMetadata(7, LIQUID_RENDER_CARDINAL_MASK_COUNT)).toBe(null);
  });

  it('resolves lava single-side masks to distinct placeholder sources', () => {
    const lavaTileId = 8;
    const lavaSingleSideMasks = [1, 2, 4, 8];

    const staticSources = lavaSingleSideMasks.map((cardinalMask) =>
      describeLiquidRenderVariantSource(lavaTileId, cardinalMask)
    );
    expect(staticSources).not.toContain(null);
    expect(new Set(staticSources).size).toBe(lavaSingleSideMasks.length);

    const animatedSources = lavaSingleSideMasks.map((cardinalMask) =>
      describeLiquidRenderVariantSourceAtElapsedMs(lavaTileId, cardinalMask, 180)
    );
    expect(animatedSources).not.toContain(null);
    expect(new Set(animatedSources).size).toBe(lavaSingleSideMasks.length);
  });

  it('resolves liquid cardinal masks from sampled neighborhoods using liquid connectivity rules', () => {
    expect(
      resolveLiquidRenderCardinalMaskFromNeighborhood({
        center: 7,
        north: 7,
        northEast: 8,
        east: 7,
        southEast: 7,
        south: 0,
        southWest: 7,
        west: 8,
        northWest: 7
      })
    ).toBe(1 | 2);
  });

  it('reuses cached atlas UV rect objects for atlas-index and terrain variant lookups', () => {
    const atlasUvRect = atlasIndexToUvRect(6);

    expect(atlasIndexToUvRect(6)).toBe(atlasUvRect);
    expect(resolveTerrainAutotileVariantUvRect(2, 6)).toBe(atlasUvRect);
    expect(resolveTerrainAutotileVariantUvRect(2, 6)).toBe(resolveTerrainAutotileVariantUvRect(2, 6));
    expect(resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(2, 20)).toBe(atlasUvRect);
    expect(resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(2, 20)).toBe(
      resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(2, 20)
    );
  });

  it('rejects duplicate tile ids', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          { id: 1, name: 'stone', render: { atlasIndex: 0 } },
          { id: 1, name: 'grass_surface', render: { atlasIndex: 1 } }
        ]
      })
    ).toThrowError(/duplicate tile metadata id 1/);
  });

  it('rejects terrain variant maps with the wrong cardinal mask count', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 1,
            name: 'stone',
            terrainAutotile: {
              placeholderVariantAtlasByCardinalMask: Array.from(
                { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT - 1 },
                (_, index) => index
              )
            }
          }
        ]
      })
    ).toThrowError(new RegExp(`must have ${TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT} entries`));
  });

  it('rejects terrain variant atlas indices outside the atlas capacity', () => {
    const invalidAtlasIndex = AUTHORED_ATLAS_REGION_COUNT;

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 1,
            name: 'stone',
            terrainAutotile: {
              placeholderVariantAtlasByCardinalMask: Array.from(
                { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
                (_, index) => (index === 5 ? invalidAtlasIndex : index)
              )
            }
          }
        ]
      })
    ).toThrowError(
      new RegExp(`atlas index must be between 0 and ${AUTHORED_ATLAS_REGION_COUNT - 1}`)
    );
  });

  it('uses connectivity groups first and falls back to shared material tags for terrain adjacency', () => {
    const variantMap = Array.from(
      { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
      (_, index) => index
    );
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 1,
          name: 'ground_a',
          materialTags: ['terrain', 'solid'],
          terrainAutotile: {
            connectivityGroup: 'ground',
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 2,
          name: 'ground_b',
          materialTags: ['terrain', 'solid'],
          terrainAutotile: {
            connectivityGroup: 'ground',
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 3,
          name: 'sand',
          materialTags: ['terrain', 'solid'],
          terrainAutotile: {
            connectivityGroup: 'sand',
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 4,
          name: 'mud',
          materialTags: ['soft', 'terrain'],
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 5,
          name: 'clay',
          materialTags: ['soft', 'clay'],
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 6,
          name: 'soft_decor',
          materialTags: ['soft'],
          render: { atlasIndex: 0 }
        }
      ]
    });

    expect(areTerrainAutotileNeighborsConnected(1, 2, registry)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(1, 3, registry)).toBe(false);
    expect(areTerrainAutotileNeighborsConnected(4, 5, registry)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(4, 6, registry)).toBe(false);
  });

  it('builds a dense terrain connectivity lookup and preserves adjacency semantics', () => {
    const variantMap = Array.from(
      { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
      (_, index) => index
    );
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 12,
          name: 'mud_a',
          materialTags: ['soft'],
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 20,
          name: 'mud_b',
          materialTags: ['soft'],
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 25,
          name: 'ground_a',
          materialTags: ['soft', 'terrain'],
          terrainAutotile: {
            connectivityGroup: 'ground',
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 26,
          name: 'sand_a',
          materialTags: ['soft', 'terrain'],
          terrainAutotile: {
            connectivityGroup: 'sand',
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 30,
          name: 'terrain_no_tags',
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        },
        {
          id: 40,
          name: 'soft_decor',
          materialTags: ['soft'],
          render: { atlasIndex: 0 }
        }
      ]
    });

    expect(registry.terrainConnectivityLookup.connectivityGroupIdByTileId).toBeInstanceOf(Int32Array);
    expect(registry.terrainConnectivityLookup.connectivityGroupIdByTileId.length).toBe(41);
    expect(registry.terrainConnectivityLookup.materialTagMaskByTileId.length).toBe(41);
    expect(typeof registry.terrainConnectivityLookup.materialTagMaskByTileId[12]).toBe('bigint');
    expect(registry.terrainConnectivityLookup.materialTagMaskByTileId[12]).toBe(
      registry.terrainConnectivityLookup.materialTagMaskByTileId[20]
    );

    expect(areTerrainAutotileNeighborsConnected(12, 20, registry)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(25, 26, registry)).toBe(false);
    expect(areTerrainAutotileNeighborsConnected(12, 40, registry)).toBe(false);
    expect(areTerrainAutotileNeighborsConnected(30, 30, registry)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(999, 12, registry)).toBe(false);
    expect(hasTerrainAutotileMetadata(30, registry)).toBe(true);
  });

  it('parses gameplay flags and liquid kind metadata', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 8,
          name: 'water',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          render: { atlasIndex: 2 }
        },
        {
          id: 9,
          name: 'lava',
          gameplay: { solid: false, blocksLight: true, liquidKind: 'lava' },
          render: { atlasIndex: 3 }
        },
        {
          id: 10,
          name: 'torch',
          gameplay: { solid: false, blocksLight: false, emissiveLight: 12 },
          render: { atlasIndex: 4 }
        }
      ]
    });

    expect(resolveTileGameplayMetadata(8, registry)).toEqual({
      solid: false,
      blocksLight: false,
      liquidKind: 'water'
    });
    expect(getTileLiquidKind(8, registry)).toBe('water');
    expect(getTileLiquidKind(9, registry)).toBe('lava');
    expect(resolveTileGameplayMetadata(10, registry)).toEqual({
      solid: false,
      blocksLight: false,
      emissiveLight: 12
    });
    expect(getTileEmissiveLightLevel(10, registry)).toBe(12);
    expect(isTileSolid(8, registry)).toBe(false);
    expect(doesTileBlockLight(9, registry)).toBe(true);
  });

  it('builds dense gameplay property lookup arrays for sparse tile ids', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 12,
          name: 'torch_lava',
          gameplay: {
            solid: false,
            blocksLight: true,
            climbable: true,
            liquidKind: 'lava',
            emissiveLight: 9
          },
          render: { atlasIndex: 1 }
        }
      ]
    });

    expect(registry.gameplayPropertyLookup.propertyFlagsByTileId).toBeInstanceOf(Uint8Array);
    expect(registry.gameplayPropertyLookup.liquidKindCodeByTileId).toBeInstanceOf(Int8Array);
    expect(registry.gameplayPropertyLookup.emissiveLightByTileId).toBeInstanceOf(Uint8Array);
    expect(registry.gameplayPropertyLookup.propertyFlagsByTileId.length).toBe(13);
    expect(registry.gameplayPropertyLookup.liquidKindCodeByTileId.length).toBe(13);
    expect(registry.gameplayPropertyLookup.emissiveLightByTileId.length).toBe(13);

    expect(resolveTileGameplayMetadata(7, registry)).toEqual({ solid: false, blocksLight: false });
    expect(resolveTileGameplayMetadata(999, registry)).toEqual({ solid: false, blocksLight: false });
    expect(resolveTileGameplayMetadata(12, registry)).toEqual({
      solid: false,
      blocksLight: true,
      climbable: true,
      liquidKind: 'lava',
      emissiveLight: 9
    });
    expect(isTileSolid(12, registry)).toBe(false);
    expect(isTileClimbable(12, registry)).toBe(true);
    expect(doesTileBlockLight(12, registry)).toBe(true);
    expect(getTileEmissiveLightLevel(12, registry)).toBe(9);
    expect(getTileLiquidKind(12, registry)).toBe('lava');
    expect(getTileLiquidKind(7, registry)).toBe(null);
    expect(getTileEmissiveLightLevel(7, registry)).toBe(0);
    expect(isTileSolid(-1, registry)).toBe(false);
  });

  it('builds a dense liquid connectivity lookup and preserves liquid adjacency semantics', () => {
    const distinctLiquidVariantMap = Array.from(
      { length: LIQUID_RENDER_CARDINAL_MASK_COUNT },
      (_, index) => ({
        atlasIndex: index
      })
    );
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 12,
          name: 'water_a',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: distinctLiquidVariantMap
          }
        },
        {
          id: 20,
          name: 'water_b',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: distinctLiquidVariantMap
          }
        },
        {
          id: 25,
          name: 'lava',
          gameplay: { solid: false, blocksLight: true, liquidKind: 'lava' },
          liquidRender: {
            connectivityGroup: 'lava',
            variantRenderByCardinalMask: distinctLiquidVariantMap
          }
        },
        {
          id: 30,
          name: 'sludge',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            variantRenderByCardinalMask: distinctLiquidVariantMap
          }
        },
        {
          id: 40,
          name: 'soft_decor',
          render: { atlasIndex: 0 }
        }
      ]
    });

    expect(registry.liquidConnectivityLookup.connectivityGroupIdByTileId).toBeInstanceOf(Int32Array);
    expect(registry.liquidConnectivityLookup.connectivityGroupIdByTileId.length).toBe(41);
    expect(registry.renderLookup.liquidVariantRenderByTileIdAndCardinalMask.length).toBe(
      41 * LIQUID_RENDER_CARDINAL_MASK_COUNT
    );
    expect(registry.renderLookup.liquidVariantStaticUvRectByTileIdAndCardinalMask.length).toBe(
      41 * LIQUID_RENDER_CARDINAL_MASK_COUNT
    );

    expect(areLiquidRenderNeighborsConnected(12, 20, registry)).toBe(true);
    expect(areLiquidRenderNeighborsConnected(12, 25, registry)).toBe(false);
    expect(areLiquidRenderNeighborsConnected(30, 30, registry)).toBe(true);
    expect(areLiquidRenderNeighborsConnected(30, 12, registry)).toBe(false);
    expect(areLiquidRenderNeighborsConnected(12, 40, registry)).toBe(false);
    expect(hasLiquidRenderMetadata(30, registry)).toBe(true);
    expect(resolveLiquidRenderVariantMetadata(12, 0, registry)).toMatchObject({ atlasIndex: 0 });
    expect(resolveLiquidRenderVariantMetadata(12, 5, registry)).toMatchObject({ atlasIndex: 5 });
    expect(resolveLiquidRenderVariantMetadata(25, 15, registry)).toMatchObject({ atlasIndex: 15 });
    expect(resolveLiquidRenderVariantUvRect(12, 0, registry)).toBe(atlasIndexToUvRect(0));
    expect(resolveLiquidRenderVariantUvRect(12, 5, registry)).toBe(atlasIndexToUvRect(5));
    expect(resolveLiquidRenderVariantUvRect(12, -1, registry)).toBe(null);
    expect(resolveLiquidRenderVariantUvRect(12, LIQUID_RENDER_CARDINAL_MASK_COUNT, registry)).toBe(null);
  });

  it('describes resolved liquid variant sources for atlas-index and direct uvRect metadata', () => {
    const atlasVariantMap = Array.from({ length: LIQUID_RENDER_CARDINAL_MASK_COUNT }, (_, index) => ({
      atlasIndex: index
    }));
    const uvRectVariantMap = Array.from({ length: LIQUID_RENDER_CARDINAL_MASK_COUNT }, () => ({
      uvRect: {
        u0: 0.125,
        v0: 0.25,
        u1: 0.5,
        v1: 0.75
      }
    }));
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 12,
          name: 'water_atlas',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: atlasVariantMap
          }
        },
        {
          id: 20,
          name: 'water_uv',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: uvRectVariantMap
          }
        }
      ]
    });

    expect(describeLiquidRenderVariantSource(12, 5, registry)).toBe('atlasIndex 5');
    expect(describeLiquidRenderVariantSource(20, 2, registry)).toBe('uvRect 0.125,0.25..0.5,0.75');
    expect(describeLiquidRenderVariantSource(20, LIQUID_RENDER_CARDINAL_MASK_COUNT, registry)).toBe(null);
    expect(describeLiquidRenderVariantUvRect(12, 5, registry)).toBe(describeTileUvRect(atlasIndexToUvRect(5)));
    expect(describeLiquidRenderVariantUvRect(20, 2, registry)).toBe('0.125,0.25..0.5,0.75');
    expect(describeLiquidRenderVariantUvRect(20, LIQUID_RENDER_CARDINAL_MASK_COUNT, registry)).toBe(null);
    expect(
      describeLiquidRenderVariantPixelBounds(
        12,
        5,
        AUTHORED_ATLAS_WIDTH,
        AUTHORED_ATLAS_HEIGHT,
        registry
      )
    ).toBe(describeTileUvRectPixelBounds(atlasIndexToUvRect(5), AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT));
    expect(describeLiquidRenderVariantPixelBounds(20, 2, 96, 64, registry)).toBe('12,16..48,48');
    expect(describeLiquidRenderVariantPixelBounds(20, LIQUID_RENDER_CARDINAL_MASK_COUNT, 96, 64, registry)).toBe(
      null
    );
  });

  it('describes resolved liquid connectivity-group labels for grouped and ungrouped liquid tiles', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 12,
          name: 'water_grouped',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: Array.from({ length: LIQUID_RENDER_CARDINAL_MASK_COUNT }, () => ({
              atlasIndex: 0
            }))
          }
        },
        {
          id: 20,
          name: 'lava_ungrouped',
          gameplay: { solid: false, blocksLight: true, liquidKind: 'lava' },
          liquidRender: {
            variantRenderByCardinalMask: Array.from({ length: LIQUID_RENDER_CARDINAL_MASK_COUNT }, () => ({
              atlasIndex: 1
            }))
          }
        },
        {
          id: 30,
          name: 'stone',
          gameplay: { solid: true, blocksLight: true },
          render: { atlasIndex: 2 }
        }
      ]
    });

    expect(describeLiquidConnectivityGroup(12, registry)).toBe('water');
    expect(describeLiquidConnectivityGroup(20, registry)).toBe('ungrouped');
    expect(describeLiquidConnectivityGroup(30, registry)).toBe(null);
  });

  it('describes tile uv rects with compact rounded coordinates', () => {
    expect(
      describeTileUvRect({
        u0: 1 / 6,
        v0: 0.25,
        u1: 1 / 3,
        v1: 0.5
      })
    ).toBe('0.167,0.25..0.333,0.5');
    expect(describeTileUvRect(null)).toBe(null);
  });

  it('describes tile uv rect pixel bounds using atlas dimensions', () => {
    expect(
      describeTileUvRectPixelBounds(
        {
          u0: 1 / 6,
          v0: 0.25,
          u1: 1 / 3,
          v1: 0.5
        },
        96,
        64
      )
    ).toBe('16,16..32,32');
    expect(describeTileUvRectPixelBounds(null, 96, 64)).toBe(null);
    expect(
      describeTileUvRectPixelBounds(
        {
          u0: 1 / 6,
          v0: 0.25,
          u1: 1 / 3,
          v1: 0.5
        },
        0,
        64
      )
    ).toBe(null);
  });

  it('builds dense render lookup tables for static UVs and terrain variants', () => {
    const variantMap = Array.from(
      { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
      (_, index) => (index + 1) % TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
    );
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 5,
          name: 'panel',
          render: {
            uvRect: {
              u0: 0.16666666666666666,
              v0: 0.25,
              u1: 0.3333333333333333,
              v1: 0.5
            }
          }
        },
        {
          id: 12,
          name: 'brick',
          render: { atlasIndex: 14 }
        },
        {
          id: 18,
          name: 'ground',
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        }
      ]
    });

    expect(registry.renderLookup.staticUvRectByTileId.length).toBe(19);
    expect(registry.renderLookup.animationFrameStartByTileId).toBeInstanceOf(Int32Array);
    expect(registry.renderLookup.animationFrameCountByTileId).toBeInstanceOf(Int32Array);
    expect(registry.renderLookup.animationFrameDurationMsByTileId).toBeInstanceOf(Uint32Array);
    expect(registry.renderLookup.animationFrameStartByTileId.length).toBe(19);
    expect(registry.renderLookup.animationFrameCountByTileId.length).toBe(19);
    expect(registry.renderLookup.animationFrameDurationMsByTileId.length).toBe(19);
    expect(registry.renderLookup.animationFrameUvRects).toEqual([]);
    expect(registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask).toBeInstanceOf(
      Int32Array
    );
    expect(
      registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask
    ).toBeInstanceOf(Int32Array);
    expect(registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask).toBeInstanceOf(
      Int32Array
    );
    expect(registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask.length).toBe(
      19 * TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
    );
    expect(
      registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask.length
    ).toBe(19 * 256);
    expect(registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask.length).toBe(
      19 * 256
    );

    expect(resolveTileRenderUvRect(5, registry)).toEqual({
      u0: 0.16666666666666666,
      v0: 0.25,
      u1: 0.3333333333333333,
      v1: 0.5
    });
    expect(resolveTileRenderUvRect(12, registry)).toEqual(atlasIndexToUvRect(14));
    expect(resolveTileRenderUvRect(12, registry)).toBe(atlasIndexToUvRect(14));
    expect(resolveTileRenderUvRect(18, registry)).toBe(null);
    expect(resolveTileRenderUvRect(999, registry)).toBe(null);

    expect(resolveTerrainAutotileVariantAtlasIndex(18, 0, registry)).toBe(1);
    expect(resolveTerrainAutotileVariantAtlasIndex(18, 15, registry)).toBe(0);
    expect(resolveTerrainAutotileVariantUvRect(18, 0, registry)).toBe(atlasIndexToUvRect(1));
    expect(resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(18, 0, registry)).toBe(1);
    expect(resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(18, 0, registry)).toBe(
      atlasIndexToUvRect(1)
    );
    expect(resolveTerrainAutotileVariantAtlasIndex(12, 0, registry)).toBe(null);
    expect(resolveTerrainAutotileVariantAtlasIndex(18, -1, registry)).toBe(null);
    expect(resolveTerrainAutotileVariantAtlasIndex(18, TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT, registry)).toBe(
      null
    );
    expect(resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(12, 0, registry)).toBe(null);
    expect(resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(18, -1, registry)).toBe(null);
    expect(resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(18, 256, registry)).toBe(null);
    expect(resolveTerrainAutotileAtlasIndexByRawAdjacencyMask(12, 0, registry)).toBe(null);
    expect(resolveTerrainAutotileAtlasIndexByRawAdjacencyMask(18, -1, registry)).toBe(null);
    expect(resolveTerrainAutotileAtlasIndexByRawAdjacencyMask(18, 256, registry)).toBe(null);
  });

  it('builds dense animated render lookup tables without changing static render resolution', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 7,
          name: 'lantern',
          render: {
            atlasIndex: 6,
            frames: [
              { atlasIndex: 6 },
              { uvRect: { u0: 0.5, v0: 0, u1: 0.75, v1: 0.25 } },
              { atlasIndex: 7 }
            ],
            frameDurationMs: 120
          }
        },
        {
          id: 8,
          name: 'panel',
          render: { uvRect: { u0: 0, v0: 0.5, u1: 0.25, v1: 0.75 } }
        }
      ]
    });

    expect(hasAnimatedTileRenderMetadata(7, registry)).toBe(true);
    expect(hasAnimatedTileRenderMetadata(8, registry)).toBe(false);
    expect(getAnimatedTileRenderFrameCount(7, registry)).toBe(3);
    expect(getAnimatedTileRenderFrameCount(999, registry)).toBe(0);
    expect(getAnimatedTileRenderFrameDurationMs(7, registry)).toBe(120);
    expect(getAnimatedTileRenderFrameDurationMs(8, registry)).toBe(null);

    expect(resolveTileRenderUvRect(7, registry)).toBe(atlasIndexToUvRect(6));
    expect(resolveAnimatedTileRenderFrameUvRect(7, 0, registry)).toBe(atlasIndexToUvRect(6));
    expect(resolveAnimatedTileRenderFrameUvRect(7, 0, registry)).toBe(resolveTileRenderUvRect(7, registry));
    expect(resolveAnimatedTileRenderFrameUvRect(7, 1, registry)).toEqual({
      u0: 0.5,
      v0: 0,
      u1: 0.75,
      v1: 0.25
    });
    expect(resolveAnimatedTileRenderFrameUvRect(7, 2, registry)).toBe(atlasIndexToUvRect(7));
    expect(resolveAnimatedTileRenderFrameUvRect(7, -1, registry)).toBe(null);
    expect(resolveAnimatedTileRenderFrameUvRect(7, 3, registry)).toBe(null);
    expect(resolveAnimatedTileRenderFrameUvRect(8, 0, registry)).toBe(null);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(7, 0, registry)).toBe(0);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(7, 119, registry)).toBe(0);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(7, 120, registry)).toBe(1);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(7, 240, registry)).toBe(2);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(7, 360, registry)).toBe(0);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(7, -1, registry)).toBe(2);
    expect(resolveAnimatedTileRenderFrameIndexAtElapsedMs(8, 120, registry)).toBe(null);
    expect(resolveAnimatedTileRenderFrameUvRectAtElapsedMs(7, 0, registry)).toBe(atlasIndexToUvRect(6));
    expect(resolveAnimatedTileRenderFrameUvRectAtElapsedMs(7, 120, registry)).toEqual({
      u0: 0.5,
      v0: 0,
      u1: 0.75,
      v1: 0.25
    });
    expect(resolveAnimatedTileRenderFrameUvRectAtElapsedMs(7, 360, registry)).toBe(atlasIndexToUvRect(6));
    expect(resolveAnimatedTileRenderFrameUvRectAtElapsedMs(8, 0, registry)).toBe(null);
    expect(registry.renderLookup.animationFrameUvRects.length).toBe(3);
  });

  it('builds dense animated liquid variant lookup tables without changing static liquid variant resolution', () => {
    const animatedVariantMap = Array.from({ length: LIQUID_RENDER_CARDINAL_MASK_COUNT }, (_, index) =>
      index === 3
        ? {
            atlasIndex: 14,
            frames: [{ atlasIndex: 14 }, { atlasIndex: 15 }],
            frameDurationMs: 120
          }
        : { atlasIndex: index % AUTHORED_ATLAS_REGION_COUNT }
    );
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 12,
          name: 'animated_water',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: animatedVariantMap
          }
        },
        {
          id: 13,
          name: 'static_lava',
          gameplay: { solid: false, blocksLight: true, liquidKind: 'lava' },
          liquidRender: {
            connectivityGroup: 'lava',
            variantRenderByCardinalMask: Array.from(
              { length: LIQUID_RENDER_CARDINAL_MASK_COUNT },
              () => ({ atlasIndex: 15 })
            )
          }
        }
      ]
    });

    expect(hasAnimatedLiquidRenderVariantMetadata(12, 3, registry)).toBe(true);
    expect(hasAnimatedLiquidRenderVariantMetadata(12, 4, registry)).toBe(false);
    expect(hasAnimatedLiquidRenderVariantMetadata(13, 3, registry)).toBe(false);
    expect(getAnimatedLiquidRenderVariantFrameCount(12, 3, registry)).toBe(2);
    expect(getAnimatedLiquidRenderVariantFrameCount(12, 4, registry)).toBe(0);
    expect(getAnimatedLiquidRenderVariantFrameDurationMs(12, 3, registry)).toBe(120);
    expect(getAnimatedLiquidRenderVariantFrameDurationMs(12, 4, registry)).toBe(null);
    expect(resolveLiquidRenderVariantUvRect(12, 3, registry)).toBe(atlasIndexToUvRect(14));
    expect(resolveAnimatedLiquidRenderVariantFrameUvRect(12, 0, 0, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantFrameUvRect(12, 3, 0, registry)).toBe(atlasIndexToUvRect(14));
    expect(resolveAnimatedLiquidRenderVariantFrameUvRect(12, 3, 1, registry)).toBe(atlasIndexToUvRect(15));
    expect(resolveAnimatedLiquidRenderVariantFrameUvRect(12, 3, 2, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(12, 3, 0, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(12, 3, 119, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(12, 3, 120, registry)).toBe(1);
    expect(resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(12, 3, 240, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(12, 3, -1, registry)).toBe(1);
    expect(resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs(12, 3, 0, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs(12, 3, 119, registry)).toBe(119);
    expect(resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs(12, 3, 120, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs(12, 3, 181, registry)).toBe(61);
    expect(resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs(12, 3, -1, registry)).toBe(119);
    expect(resolveAnimatedLiquidRenderVariantFrameElapsedMsAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs(12, 3, 0, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs(12, 3, 119, registry)).toBeCloseTo(
      119 / 120
    );
    expect(resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs(12, 3, 120, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs(12, 3, 181, registry)).toBeCloseTo(
      61 / 120
    );
    expect(resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs(12, 3, -1, registry)).toBeCloseTo(
      119 / 120
    );
    expect(resolveAnimatedLiquidRenderVariantFrameProgressNormalizedAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs(12, 3, 0, registry)).toBe(120);
    expect(resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs(12, 3, 119, registry)).toBe(1);
    expect(resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs(12, 3, 120, registry)).toBe(120);
    expect(resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs(12, 3, 181, registry)).toBe(59);
    expect(resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs(12, 3, -1, registry)).toBe(1);
    expect(resolveAnimatedLiquidRenderVariantFrameRemainingMsAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(12, 3, 0, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(12, 3, 119, registry)).toBe(119);
    expect(resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(12, 3, 120, registry)).toBe(120);
    expect(resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(12, 3, 239, registry)).toBe(239);
    expect(resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(12, 3, 240, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(12, 3, -1, registry)).toBe(239);
    expect(resolveAnimatedLiquidRenderVariantLoopElapsedMsAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(12, 3, 0, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(12, 3, 119, registry)).toBeCloseTo(
      119 / 240
    );
    expect(resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(12, 3, 120, registry)).toBeCloseTo(
      0.5
    );
    expect(resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(12, 3, 239, registry)).toBeCloseTo(
      239 / 240
    );
    expect(resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(12, 3, 240, registry)).toBe(0);
    expect(resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(12, 3, -1, registry)).toBeCloseTo(
      239 / 240
    );
    expect(resolveAnimatedLiquidRenderVariantLoopProgressNormalizedAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(12, 3, 0, registry)).toBe(240);
    expect(resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(12, 3, 119, registry)).toBe(121);
    expect(resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(12, 3, 120, registry)).toBe(120);
    expect(resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(12, 3, 239, registry)).toBe(1);
    expect(resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(12, 3, 240, registry)).toBe(240);
    expect(resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(12, 3, -1, registry)).toBe(1);
    expect(resolveAnimatedLiquidRenderVariantLoopRemainingMsAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(resolveLiquidRenderVariantFrameMetadataAtElapsedMs(12, 3, 0, registry)).toEqual({
      atlasIndex: 14
    });
    expect(resolveLiquidRenderVariantFrameMetadataAtElapsedMs(12, 3, 120, registry)).toEqual({
      atlasIndex: 15
    });
    expect(resolveLiquidRenderVariantFrameMetadataAtElapsedMs(13, 3, 120, registry)).toEqual({
      atlasIndex: 15
    });
    expect(resolveLiquidRenderVariantUvRectAtElapsedMs(12, 3, 0, registry)).toBe(atlasIndexToUvRect(14));
    expect(resolveLiquidRenderVariantUvRectAtElapsedMs(12, 3, 120, registry)).toBe(atlasIndexToUvRect(15));
    expect(resolveLiquidRenderVariantUvRectAtElapsedMs(13, 3, 120, registry)).toBe(atlasIndexToUvRect(15));
    expect(describeLiquidRenderVariantSourceAtElapsedMs(12, 3, 0, registry)).toBe('atlasIndex 14');
    expect(describeLiquidRenderVariantSourceAtElapsedMs(12, 3, 120, registry)).toBe('atlasIndex 15');
    expect(describeLiquidRenderVariantSourceAtElapsedMs(13, 3, 120, registry)).toBe('atlasIndex 15');
    expect(describeLiquidRenderVariantUvRectAtElapsedMs(12, 3, 0, registry)).toBe(
      describeTileUvRect(atlasIndexToUvRect(14))
    );
    expect(describeLiquidRenderVariantUvRectAtElapsedMs(12, 3, 120, registry)).toBe(
      describeTileUvRect(atlasIndexToUvRect(15))
    );
    expect(
      describeLiquidRenderVariantPixelBoundsAtElapsedMs(
        12,
        3,
        0,
        AUTHORED_ATLAS_WIDTH,
        AUTHORED_ATLAS_HEIGHT,
        registry
      )
    ).toBe(
      describeTileUvRectPixelBounds(atlasIndexToUvRect(14), AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    );
    expect(
      describeLiquidRenderVariantPixelBoundsAtElapsedMs(
        12,
        3,
        120,
        AUTHORED_ATLAS_WIDTH,
        AUTHORED_ATLAS_HEIGHT,
        registry
      )
    ).toBe(
      describeTileUvRectPixelBounds(atlasIndexToUvRect(15), AUTHORED_ATLAS_WIDTH, AUTHORED_ATLAS_HEIGHT)
    );
    expect(resolveAnimatedLiquidRenderVariantFrameUvRectAtElapsedMs(12, 3, 0, registry)).toBe(
      atlasIndexToUvRect(14)
    );
    expect(resolveAnimatedLiquidRenderVariantFrameUvRectAtElapsedMs(12, 3, 120, registry)).toBe(
      atlasIndexToUvRect(15)
    );
    expect(resolveAnimatedLiquidRenderVariantFrameUvRectAtElapsedMs(12, 4, 120, registry)).toBe(null);
    expect(registry.renderLookup.liquidVariantAnimationFrameStartByTileIdAndCardinalMask).toBeInstanceOf(
      Int32Array
    );
    expect(registry.renderLookup.liquidVariantAnimationFrameCountByTileIdAndCardinalMask).toBeInstanceOf(
      Int32Array
    );
    expect(
      registry.renderLookup.liquidVariantAnimationFrameDurationMsByTileIdAndCardinalMask
    ).toBeInstanceOf(Uint32Array);
    expect(registry.renderLookup.liquidVariantAnimationFrameStartByTileIdAndCardinalMask.length).toBe(
      14 * LIQUID_RENDER_CARDINAL_MASK_COUNT
    );
    expect(registry.renderLookup.liquidVariantAnimationFrameCountByTileIdAndCardinalMask.length).toBe(
      14 * LIQUID_RENDER_CARDINAL_MASK_COUNT
    );
    expect(
      registry.renderLookup.liquidVariantAnimationFrameDurationMsByTileIdAndCardinalMask.length
    ).toBe(14 * LIQUID_RENDER_CARDINAL_MASK_COUNT);
    expect(registry.renderLookup.liquidVariantAnimationFrameUvRects).toEqual([
      atlasIndexToUvRect(14),
      atlasIndexToUvRect(15)
    ]);
  });

  it('precomputes normalized-adjacency terrain atlas lookup entries with parity to placeholder variant mapping', () => {
    const variantMap = Array.from(
      { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
      (_, index) => (index + 5) % TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
    );
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 18,
          name: 'ground',
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        }
      ]
    });

    for (let normalizedMask = 0; normalizedMask < 256; normalizedMask += 1) {
      const expectedVariant =
        TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK[normalizedMask] ?? 0;
      const expectedAtlasIndex = variantMap[expectedVariant] ?? 0;

      expect(
        resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(18, normalizedMask, registry),
        `normalized mask ${normalizedMask}`
      ).toBe(expectedAtlasIndex);
      expect(
        resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(18, normalizedMask, registry),
        `normalized mask uv ${normalizedMask}`
      ).toBe(atlasIndexToUvRect(expectedAtlasIndex));
    }
  });

  it('precomputes raw-adjacency terrain atlas lookup entries with parity to the normalized lookup path', () => {
    const variantMap = Array.from(
      { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
      (_, index) => (index + 9) % TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
    );
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 18,
          name: 'ground',
          terrainAutotile: {
            placeholderVariantAtlasByCardinalMask: variantMap
          }
        }
      ]
    });

    for (let rawMask = 0; rawMask < 256; rawMask += 1) {
      const normalizedMask = normalizeAutotileAdjacencyMask(rawMask);
      const expectedAtlasIndex = resolveTerrainAutotileAtlasIndexByNormalizedAdjacencyMask(
        18,
        normalizedMask,
        registry
      );
      const expectedUvRect = resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(18, normalizedMask, registry);

      expect(
        resolveTerrainAutotileAtlasIndexByRawAdjacencyMask(18, rawMask, registry),
        `raw mask atlas ${rawMask}`
      ).toBe(expectedAtlasIndex);
      expect(
        resolveTerrainAutotileUvRectByRawAdjacencyMask(18, rawMask, registry),
        `raw mask uv ${rawMask}`
      ).toBe(expectedUvRect);
    }
  });

  it('rejects duplicate material tags', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'duplicate_tags',
            materialTags: ['solid', 'solid'],
            render: { atlasIndex: 1 }
          }
        ]
      })
    ).toThrowError(/materialTags contains duplicate tag "solid"/);
  });

  it('rejects non-boolean gameplay flags', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'bad_gameplay',
            gameplay: { solid: 1, blocksLight: false },
            render: { atlasIndex: 1 }
          }
        ]
      })
    ).toThrowError(/gameplay\.solid must be a boolean/);

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'bad_emissive',
            gameplay: { solid: false, blocksLight: false, emissiveLight: 0 },
            render: { atlasIndex: 1 }
          }
        ]
      })
    ).toThrowError(/gameplay\.emissiveLight must be between 1 and 15/);
  });

  it('rejects unsupported liquid kinds and solid liquids', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'acid',
            gameplay: { solid: false, blocksLight: false, liquidKind: 'acid' },
            render: { atlasIndex: 1 }
          }
        ]
      })
    ).toThrowError(/gameplay\.liquidKind must be "water" or "lava"/);

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'solid_water',
            gameplay: { solid: true, blocksLight: true, liquidKind: 'water' },
            render: { atlasIndex: 1 }
          }
        ]
      })
    ).toThrowError(/liquidKind cannot be set when solid is true/);
  });

  it('rejects solid one-way platform gameplay metadata', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'solid_platform',
            gameplay: { solid: true, blocksLight: true, oneWayPlatform: true },
            render: { atlasIndex: 1 }
          }
        ]
      })
    ).toThrowError(/oneWayPlatform cannot be set when solid is true/);
  });

  it('rejects non-empty tiles without render or terrain metadata', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [{ id: 7, name: 'missing_render' }]
      })
    ).toThrowError(/must define render, terrainAutotile, or liquidRender metadata/);
  });

  it('rejects invalid liquid render metadata', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'bad_liquid_variant_count',
            gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
            liquidRender: {
              variantRenderByCardinalMask: Array.from(
                { length: LIQUID_RENDER_CARDINAL_MASK_COUNT - 1 },
                () => ({ atlasIndex: 1 })
              )
            }
          }
        ]
      })
    ).toThrowError(
      new RegExp(`liquidRender\\.variantRenderByCardinalMask must have ${LIQUID_RENDER_CARDINAL_MASK_COUNT} entries`)
    );

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'liquid_without_kind',
            liquidRender: {
              variantRenderByCardinalMask: Array.from(
                { length: LIQUID_RENDER_CARDINAL_MASK_COUNT },
                () => ({ atlasIndex: 1 })
              )
            }
          }
        ]
      })
    ).toThrowError(/liquidRender requires gameplay\.liquidKind/);

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'liquid_terrain_hybrid',
            gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
            terrainAutotile: {
              placeholderVariantAtlasByCardinalMask: Array.from(
                { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
                (_, index) => index
              )
            },
            liquidRender: {
              variantRenderByCardinalMask: Array.from(
                { length: LIQUID_RENDER_CARDINAL_MASK_COUNT },
                () => ({ atlasIndex: 1 })
              )
            }
          }
        ]
      })
    ).toThrowError(/cannot define both terrainAutotile and liquidRender/);
  });

  it('rejects render metadata that defines both atlasIndex and uvRect', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'bad_render',
            render: {
              atlasIndex: 1,
              uvRect: { u0: 0, v0: 0, u1: 0.25, v1: 0.25 }
            }
          }
        ]
      })
    ).toThrowError(/exactly one of atlasIndex or uvRect/);
  });

  it('rejects partial or invalid animated render metadata', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'missing_duration',
            render: {
              atlasIndex: 1,
              frames: [{ atlasIndex: 1 }, { atlasIndex: 2 }]
            }
          }
        ]
      })
    ).toThrowError(/must define both frames and frameDurationMs/);

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'empty_frames',
            render: {
              atlasIndex: 1,
              frames: [],
              frameDurationMs: 120
            }
          }
        ]
      })
    ).toThrowError(/must contain at least one frame/);

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'bad_duration',
            render: {
              atlasIndex: 1,
              frames: [{ atlasIndex: 1 }, { atlasIndex: 2 }],
              frameDurationMs: 0
            }
          }
        ]
      })
    ).toThrowError(/frameDurationMs must be > 0/);

    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 7,
            name: 'mismatched_first_frame',
            render: {
              atlasIndex: 1,
              frames: [{ atlasIndex: 2 }, { atlasIndex: 3 }],
              frameDurationMs: 120
            }
          }
        ]
      })
    ).toThrowError(/frames\[0\] must match the static render source/);
  });
});
