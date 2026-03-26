import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

const SURFACE_FLOWER_TILE_NAME = 'surface_flower';

const surfaceFlowerTileIdCache = new WeakMap<TileMetadataRegistry, number>();

const getRequiredTileIdByName = (tileName: string, registry: TileMetadataRegistry): number => {
  const tile = registry.tiles.find((entry) => entry.name === tileName);
  if (!tile) {
    throw new Error(`surfaceFlowerTiles expected tile metadata entry "${tileName}"`);
  }

  return tile.id;
};

export const getSurfaceFlowerTileId = (
  registry: TileMetadataRegistry = TILE_METADATA
): number => {
  const cached = surfaceFlowerTileIdCache.get(registry);
  if (cached !== undefined) {
    return cached;
  }

  const resolved = getRequiredTileIdByName(SURFACE_FLOWER_TILE_NAME, registry);
  surfaceFlowerTileIdCache.set(registry, resolved);
  return resolved;
};

export const isSurfaceFlowerTileId = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => tileId === getSurfaceFlowerTileId(registry);
