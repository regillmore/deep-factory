import { describe, expect, it } from 'vitest';

import { TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT } from './autotile';
import {
  TILE_METADATA,
  areTerrainAutotileNeighborsConnected,
  atlasIndexToUvRect,
  doesTileBlockLight,
  getTileLiquidKind,
  hasTerrainAutotileMetadata,
  isTileSolid,
  parseTileMetadataRegistry,
  resolveTileGameplayMetadata,
  resolveTerrainAutotileVariantAtlasIndex,
  resolveTerrainAutotileVariantUvRect,
  resolveTileRenderUvRect
} from './tileMetadata';

describe('tile metadata loader', () => {
  it('loads placeholder terrain autotile mappings from JSON', () => {
    expect(TILE_METADATA.tilesById.size).toBeGreaterThanOrEqual(3);
    expect(hasTerrainAutotileMetadata(1)).toBe(true);
    expect(hasTerrainAutotileMetadata(2)).toBe(true);
    expect(hasTerrainAutotileMetadata(3)).toBe(false);
    expect(areTerrainAutotileNeighborsConnected(1, 2)).toBe(true);
    expect(areTerrainAutotileNeighborsConnected(1, 3)).toBe(false);
    expect(resolveTileGameplayMetadata(0)).toEqual({ solid: false, blocksLight: false });
    expect(resolveTileGameplayMetadata(1)).toEqual({ solid: true, blocksLight: true });
    expect(isTileSolid(1)).toBe(true);
    expect(isTileSolid(4)).toBe(false);
    expect(doesTileBlockLight(1)).toBe(true);
    expect(doesTileBlockLight(4)).toBe(false);
    expect(getTileLiquidKind(1)).toBe(null);

    expect(resolveTerrainAutotileVariantAtlasIndex(1, 0)).toBe(0);
    expect(resolveTerrainAutotileVariantAtlasIndex(1, 15)).toBe(15);
    expect(resolveTerrainAutotileVariantAtlasIndex(2, 6)).toBe(6);
    expect(resolveTileRenderUvRect(3)).toEqual(atlasIndexToUvRect(14));
    expect(resolveTileRenderUvRect(4)).toEqual({ u0: 0.25, v0: 0.25, u1: 0.5, v1: 0.5 });
    expect(resolveTerrainAutotileVariantUvRect(2, 6)).toEqual(atlasIndexToUvRect(6));
    expect(resolveTerrainAutotileVariantAtlasIndex(1, TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT)).toBe(
      null
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
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          {
            id: 1,
            name: 'stone',
            terrainAutotile: {
              placeholderVariantAtlasByCardinalMask: Array.from(
                { length: TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT },
                (_, index) => (index === 5 ? 16 : index)
              )
            }
          }
        ]
      })
    ).toThrowError(/atlas index must be between 0 and 15/);
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
          gameplay: { solid: false, blocksLight: true, liquidKind: 'lava' },
          render: { atlasIndex: 1 }
        }
      ]
    });

    expect(registry.gameplayPropertyLookup.propertyFlagsByTileId).toBeInstanceOf(Uint8Array);
    expect(registry.gameplayPropertyLookup.liquidKindCodeByTileId).toBeInstanceOf(Int8Array);
    expect(registry.gameplayPropertyLookup.propertyFlagsByTileId.length).toBe(13);
    expect(registry.gameplayPropertyLookup.liquidKindCodeByTileId.length).toBe(13);

    expect(resolveTileGameplayMetadata(7, registry)).toEqual({ solid: false, blocksLight: false });
    expect(resolveTileGameplayMetadata(999, registry)).toEqual({ solid: false, blocksLight: false });
    expect(isTileSolid(12, registry)).toBe(false);
    expect(doesTileBlockLight(12, registry)).toBe(true);
    expect(getTileLiquidKind(12, registry)).toBe('lava');
    expect(getTileLiquidKind(7, registry)).toBe(null);
    expect(isTileSolid(-1, registry)).toBe(false);
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
          render: { uvRect: { u0: 0.25, v0: 0.25, u1: 0.5, v1: 0.5 } }
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
    expect(registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask).toBeInstanceOf(
      Int32Array
    );
    expect(registry.renderLookup.terrainAutotileVariantAtlasIndexByTileIdAndCardinalMask.length).toBe(
      19 * TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
    );

    expect(resolveTileRenderUvRect(5, registry)).toEqual({ u0: 0.25, v0: 0.25, u1: 0.5, v1: 0.5 });
    expect(resolveTileRenderUvRect(12, registry)).toEqual(atlasIndexToUvRect(14));
    expect(resolveTileRenderUvRect(18, registry)).toBe(null);
    expect(resolveTileRenderUvRect(999, registry)).toBe(null);

    expect(resolveTerrainAutotileVariantAtlasIndex(18, 0, registry)).toBe(1);
    expect(resolveTerrainAutotileVariantAtlasIndex(18, 15, registry)).toBe(0);
    expect(resolveTerrainAutotileVariantAtlasIndex(12, 0, registry)).toBe(null);
    expect(resolveTerrainAutotileVariantAtlasIndex(18, -1, registry)).toBe(null);
    expect(resolveTerrainAutotileVariantAtlasIndex(18, TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT, registry)).toBe(
      null
    );
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

  it('rejects non-empty tiles without render or terrain metadata', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [{ id: 7, name: 'missing_render' }]
      })
    ).toThrowError(/must define render or terrainAutotile metadata/);
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
});
