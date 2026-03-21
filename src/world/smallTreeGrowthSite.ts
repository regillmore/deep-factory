import { resolveSmallTreeGrowthStageAtAnchor, type SmallTreeAnchorWorldView } from './smallTreeAnchors';
import { GROWN_SMALL_TREE_FOOTPRINT_CELLS } from './smallTreeFootprints';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export type SmallTreeGrowthSiteWorldView = SmallTreeAnchorWorldView;

export interface SmallTreeGrowthSiteBlockedTile {
  worldTileX: number;
  worldTileY: number;
  tileId: number;
}

export interface SmallTreeGrowthSiteEvaluation {
  anchorTileId: number;
  hasGrassAnchor: boolean;
  currentGrowthStage: 'planted' | 'grown' | null;
  blockedGrowthTiles: SmallTreeGrowthSiteBlockedTile[];
  hasUnobstructedGrowthSpace: boolean;
  canPlant: boolean;
  canGrow: boolean;
}

const GRASS_SURFACE_TILE_NAME = 'grass_surface';
const grassSurfaceTileIdCache = new WeakMap<TileMetadataRegistry, number>();

const getRequiredTileIdByName = (tileName: string, registry: TileMetadataRegistry): number => {
  const tile = registry.tiles.find((entry) => entry.name === tileName);
  if (!tile) {
    throw new Error(`smallTreeGrowthSite expected tile metadata entry "${tileName}"`);
  }

  return tile.id;
};

const getGrassSurfaceTileId = (registry: TileMetadataRegistry = TILE_METADATA): number => {
  const cached = grassSurfaceTileIdCache.get(registry);
  if (cached !== undefined) {
    return cached;
  }

  const resolved = getRequiredTileIdByName(GRASS_SURFACE_TILE_NAME, registry);
  grassSurfaceTileIdCache.set(registry, resolved);
  return resolved;
};

const collectBlockedGrowthTiles = (
  world: SmallTreeGrowthSiteWorldView,
  anchorTileX: number,
  anchorTileY: number
): SmallTreeGrowthSiteBlockedTile[] => {
  const blockedGrowthTiles: SmallTreeGrowthSiteBlockedTile[] = [];

  for (const cell of GROWN_SMALL_TREE_FOOTPRINT_CELLS) {
    // Sapling-to-grown replacement reuses the planted anchor cell, so only the other grown cells
    // must stay empty before a planted tree can expand.
    if (cell.localX === 0 && cell.localY === 0) {
      continue;
    }

    const worldTileX = anchorTileX + cell.localX;
    const worldTileY = anchorTileY + cell.localY;
    const tileId = world.getTile(worldTileX, worldTileY);
    if (tileId === 0) {
      continue;
    }

    blockedGrowthTiles.push({
      worldTileX,
      worldTileY,
      tileId
    });
  }

  return blockedGrowthTiles;
};

export const evaluateSmallTreeGrowthSiteAtAnchor = (
  world: SmallTreeGrowthSiteWorldView,
  anchorTileX: number,
  anchorTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): SmallTreeGrowthSiteEvaluation => {
  const anchorTileId = world.getTile(anchorTileX, anchorTileY);
  const currentGrowthStage = resolveSmallTreeGrowthStageAtAnchor(world, anchorTileX, anchorTileY, registry);
  const blockedGrowthTiles = collectBlockedGrowthTiles(world, anchorTileX, anchorTileY);
  const hasGrassAnchor = anchorTileId === getGrassSurfaceTileId(registry);
  const hasUnobstructedGrowthSpace = blockedGrowthTiles.length === 0;

  return {
    anchorTileId,
    hasGrassAnchor,
    currentGrowthStage,
    blockedGrowthTiles,
    hasUnobstructedGrowthSpace,
    canPlant: hasGrassAnchor,
    canGrow: currentGrowthStage === 'planted' && hasUnobstructedGrowthSpace
  };
};
