import { TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT } from './autotile';
import { TILE_ATLAS_COLUMNS, TILE_ATLAS_ROWS } from './constants';
import rawTileMetadata from './tileMetadata.json';

export interface TerrainAutotileTileMetadata {
  placeholderVariantAtlasByCardinalMask: readonly number[];
}

export interface TileMetadataEntry {
  id: number;
  name: string;
  terrainAutotile?: TerrainAutotileTileMetadata;
}

export interface TileMetadataRegistry {
  tiles: readonly TileMetadataEntry[];
  tilesById: ReadonlyMap<number, TileMetadataEntry>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const expectInteger = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  return value;
};

const parseTerrainAutotileMetadata = (
  value: unknown,
  tileId: number
): TerrainAutotileTileMetadata => {
  if (!isRecord(value)) {
    throw new Error(`tiles[${tileId}].terrainAutotile must be an object`);
  }

  const variantMap = value.placeholderVariantAtlasByCardinalMask;
  if (!Array.isArray(variantMap)) {
    throw new Error(
      `tiles[${tileId}].terrainAutotile.placeholderVariantAtlasByCardinalMask must be an array`
    );
  }

  if (variantMap.length !== TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT) {
    throw new Error(
      `tiles[${tileId}] terrain variant map must have ${TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT} entries`
    );
  }

  const atlasTileCapacity = TILE_ATLAS_COLUMNS * TILE_ATLAS_ROWS;
  const parsedVariantMap = variantMap.map((entry, cardinalMask) => {
    const atlasIndex = expectInteger(
      entry,
      `tiles[${tileId}] terrain variant map entry ${cardinalMask} atlas index`
    );

    if (atlasIndex < 0 || atlasIndex >= atlasTileCapacity) {
      throw new Error(
        `tiles[${tileId}] terrain variant map entry ${cardinalMask} atlas index must be between 0 and ${
          atlasTileCapacity - 1
        }`
      );
    }

    return atlasIndex;
  });

  return { placeholderVariantAtlasByCardinalMask: parsedVariantMap };
};

export const parseTileMetadataRegistry = (value: unknown): TileMetadataRegistry => {
  if (!isRecord(value)) {
    throw new Error('tile metadata root must be an object');
  }

  const rawTiles = value.tiles;
  if (!Array.isArray(rawTiles)) {
    throw new Error('tile metadata root must include a tiles array');
  }

  const tiles: TileMetadataEntry[] = [];
  const tilesById = new Map<number, TileMetadataEntry>();

  for (let index = 0; index < rawTiles.length; index += 1) {
    const rawTile = rawTiles[index];
    if (!isRecord(rawTile)) {
      throw new Error(`tiles[${index}] must be an object`);
    }

    const tileId = expectInteger(rawTile.id, `tiles[${index}].id`);
    if (tileId < 0) {
      throw new Error(`tiles[${index}].id must be >= 0`);
    }
    if (tilesById.has(tileId)) {
      throw new Error(`duplicate tile metadata id ${tileId}`);
    }

    const name = rawTile.name;
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error(`tiles[${index}].name must be a non-empty string`);
    }

    const terrainAutotileValue = rawTile.terrainAutotile;
    const parsedTile: TileMetadataEntry = {
      id: tileId,
      name,
      terrainAutotile:
        terrainAutotileValue === undefined
          ? undefined
          : parseTerrainAutotileMetadata(terrainAutotileValue, tileId)
    };

    tiles.push(parsedTile);
    tilesById.set(tileId, parsedTile);
  }

  return {
    tiles,
    tilesById
  };
};

export const TILE_METADATA = parseTileMetadataRegistry(rawTileMetadata);

export const getTileMetadata = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): TileMetadataEntry | undefined => registry.tilesById.get(tileId);

export const hasTerrainAutotileMetadata = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => getTileMetadata(tileId, registry)?.terrainAutotile !== undefined;

export const resolveTerrainAutotileVariantAtlasIndex = (
  tileId: number,
  cardinalVariantIndex: number,
  registry: TileMetadataRegistry = TILE_METADATA
): number | null => {
  const terrainAutotile = getTileMetadata(tileId, registry)?.terrainAutotile;
  if (!terrainAutotile) return null;
  if (!Number.isInteger(cardinalVariantIndex)) return null;
  if (
    cardinalVariantIndex < 0 ||
    cardinalVariantIndex >= terrainAutotile.placeholderVariantAtlasByCardinalMask.length
  ) {
    return null;
  }

  return terrainAutotile.placeholderVariantAtlasByCardinalMask[cardinalVariantIndex] ?? null;
};
