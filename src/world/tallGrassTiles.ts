import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

const TALL_GRASS_TILE_NAME = 'tall_grass';

const tallGrassTileIdCache = new WeakMap<TileMetadataRegistry, number>();

const getRequiredTileIdByName = (tileName: string, registry: TileMetadataRegistry): number => {
  const tile = registry.tiles.find((entry) => entry.name === tileName);
  if (!tile) {
    throw new Error(`tallGrassTiles expected tile metadata entry "${tileName}"`);
  }

  return tile.id;
};

export const getTallGrassTileId = (
  registry: TileMetadataRegistry = TILE_METADATA
): number => {
  const cached = tallGrassTileIdCache.get(registry);
  if (cached !== undefined) {
    return cached;
  }

  const resolved = getRequiredTileIdByName(TALL_GRASS_TILE_NAME, registry);
  tallGrassTileIdCache.set(registry, resolved);
  return resolved;
};

export const isTallGrassTileId = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => tileId === getTallGrassTileId(registry);
