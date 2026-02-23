import { describe, expect, it } from 'vitest';

import { TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT } from './autotile';
import {
  TILE_METADATA,
  hasTerrainAutotileMetadata,
  parseTileMetadataRegistry,
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
    expect(resolveTerrainAutotileVariantAtlasIndex(1, TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT)).toBe(
      null
    );
  });

  it('rejects duplicate tile ids', () => {
    expect(() =>
      parseTileMetadataRegistry({
        tiles: [
          { id: 1, name: 'stone' },
          { id: 1, name: 'grass_surface' }
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
});
