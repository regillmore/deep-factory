import { describe, expect, it } from 'vitest';

import { TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT } from './autotile';
import {
  TILE_METADATA,
  atlasIndexToUvRect,
  hasTerrainAutotileMetadata,
  parseTileMetadataRegistry,
  resolveTerrainAutotileVariantUvRect,
  resolveTileRenderUvRect,
  resolveTerrainAutotileVariantAtlasIndex
} from './tileMetadata';

describe('tile metadata loader', () => {
  it('loads placeholder terrain autotile mappings from JSON', () => {
    expect(TILE_METADATA.tilesById.size).toBeGreaterThanOrEqual(3);
    expect(hasTerrainAutotileMetadata(1)).toBe(true);
    expect(hasTerrainAutotileMetadata(2)).toBe(true);
    expect(hasTerrainAutotileMetadata(3)).toBe(false);

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
