import { describe, expect, it } from 'vitest';

import { type TileMetadataRegistry } from './tileMetadata';
import { getSurfaceFlowerTileId, isSurfaceFlowerTileId } from './surfaceFlowerTiles';

describe('surfaceFlowerTiles', () => {
  it('pins the shipped surface-flower tile id', () => {
    expect(getSurfaceFlowerTileId()).toBe(22);
    expect(isSurfaceFlowerTileId(22)).toBe(true);
    expect(isSurfaceFlowerTileId(21)).toBe(false);
    expect(isSurfaceFlowerTileId(0)).toBe(false);
  });

  it('resolves surface-flower ids by tile name from a provided registry', () => {
    const registry = {
      tiles: [
        { id: 0, name: 'empty' },
        { id: 4, name: 'tall_grass' },
        { id: 12, name: 'surface_flower' }
      ],
      tilesById: new Map(),
      gameplayPropertyLookup: {
        propertyFlagsByTileId: new Uint8Array(13),
        liquidKindCodeByTileId: new Int8Array(13),
        emissiveLightByTileId: new Uint8Array(13)
      },
      terrainConnectivityLookup: {
        connectivityGroupIdByTileId: new Int32Array(13),
        materialTagMaskByTileId: Array(13).fill(0n)
      },
      liquidConnectivityLookup: {
        connectivityGroupIdByTileId: new Int32Array(13),
        connectivityGroupLabelByTileId: Array(13).fill(null)
      },
      renderLookup: {
        staticUvRectByTileId: Array(13).fill(null),
        animationFrameStartByTileId: new Int32Array(13),
        animationFrameCountByTileId: new Int32Array(13),
        animationFrameDurationMsByTileId: new Uint32Array(13),
        animationFrameUvRects: [],
        terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask: new Int32Array(13 * 16),
        terrainAutotileVariantAtlasIndexByTileIdAndNormalizedAdjacencyMask: new Int32Array(13 * 256),
        terrainAutotileVariantAtlasIndexByTileIdAndRawAdjacencyMask: new Int32Array(13 * 256),
        liquidVariantRenderByTileIdAndCardinalMask: Array(13 * 16).fill(null),
        liquidVariantStaticUvRectByTileIdAndCardinalMask: Array(13 * 16).fill(null),
        liquidVariantAnimationFrameStartByTileIdAndCardinalMask: new Int32Array(13 * 16),
        liquidVariantAnimationFrameCountByTileIdAndCardinalMask: new Int32Array(13 * 16),
        liquidVariantAnimationFrameDurationMsByTileIdAndCardinalMask: new Uint32Array(13 * 16),
        liquidVariantAnimationFrameUvRects: []
      }
    } satisfies TileMetadataRegistry;

    expect(getSurfaceFlowerTileId(registry)).toBe(12);
    expect(isSurfaceFlowerTileId(12, registry)).toBe(true);
    expect(isSurfaceFlowerTileId(4, registry)).toBe(false);
  });
});
