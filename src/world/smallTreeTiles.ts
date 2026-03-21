import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export interface SmallTreeTileIds {
  sapling: number;
  trunk: number;
  leaf: number;
}

const SMALL_TREE_SAPLING_TILE_NAME = 'small_tree_sapling';
const SMALL_TREE_TRUNK_TILE_NAME = 'small_tree_trunk';
const SMALL_TREE_LEAF_TILE_NAME = 'small_tree_leaf';

const smallTreeTileIdsCache = new WeakMap<TileMetadataRegistry, Readonly<SmallTreeTileIds>>();

const getRequiredTileIdByName = (tileName: string, registry: TileMetadataRegistry): number => {
  const tile = registry.tiles.find((entry) => entry.name === tileName);
  if (!tile) {
    throw new Error(`smallTreeTiles expected tile metadata entry "${tileName}"`);
  }

  return tile.id;
};

const getCachedSmallTreeTileIds = (
  registry: TileMetadataRegistry = TILE_METADATA
): Readonly<SmallTreeTileIds> => {
  const cached = smallTreeTileIdsCache.get(registry);
  if (cached) {
    return cached;
  }

  const resolved = Object.freeze({
    sapling: getRequiredTileIdByName(SMALL_TREE_SAPLING_TILE_NAME, registry),
    trunk: getRequiredTileIdByName(SMALL_TREE_TRUNK_TILE_NAME, registry),
    leaf: getRequiredTileIdByName(SMALL_TREE_LEAF_TILE_NAME, registry)
  });
  smallTreeTileIdsCache.set(registry, resolved);
  return resolved;
};

export const getSmallTreeTileIds = (
  registry: TileMetadataRegistry = TILE_METADATA
): Readonly<SmallTreeTileIds> => getCachedSmallTreeTileIds(registry);

export const getSmallTreeSaplingTileId = (
  registry: TileMetadataRegistry = TILE_METADATA
): number => getCachedSmallTreeTileIds(registry).sapling;

export const getSmallTreeTrunkTileId = (
  registry: TileMetadataRegistry = TILE_METADATA
): number => getCachedSmallTreeTileIds(registry).trunk;

export const getSmallTreeLeafTileId = (
  registry: TileMetadataRegistry = TILE_METADATA
): number => getCachedSmallTreeTileIds(registry).leaf;

export const isSmallTreeSaplingTileId = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => tileId === getCachedSmallTreeTileIds(registry).sapling;

export const isSmallTreeTrunkTileId = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => tileId === getCachedSmallTreeTileIds(registry).trunk;

export const isSmallTreeLeafTileId = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => tileId === getCachedSmallTreeTileIds(registry).leaf;

export const isSmallTreeTileId = (
  tileId: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  const { sapling, trunk, leaf } = getCachedSmallTreeTileIds(registry);
  return tileId === sapling || tileId === trunk || tileId === leaf;
};
