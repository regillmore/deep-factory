import {
  GROWN_SMALL_TREE_FOOTPRINT_CELLS,
  PLANTED_SMALL_TREE_FOOTPRINT_CELLS,
  type SmallTreeFootprintCell,
  type SmallTreeFootprintTileKind
} from './smallTreeFootprints';
import {
  getSmallTreeTileIds,
  isSmallTreeLeafTileId,
  isSmallTreeSaplingTileId,
  isSmallTreeTrunkTileId,
  type SmallTreeTileIds
} from './smallTreeTiles';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export interface SmallTreeAnchorWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export type SmallTreeGrowthStage = 'planted' | 'grown';

export interface ResolvedSmallTreeAnchor {
  anchorTileX: number;
  anchorTileY: number;
  growthStage: SmallTreeGrowthStage;
}

const doesSmallTreeFootprintMatchAtAnchor = (
  world: SmallTreeAnchorWorldView,
  anchorTileX: number,
  anchorTileY: number,
  footprintCells: readonly Readonly<SmallTreeFootprintCell>[],
  tileIds: Readonly<SmallTreeTileIds>
): boolean =>
  footprintCells.every(
    (cell) =>
      world.getTile(anchorTileX + cell.localX, anchorTileY + cell.localY) === tileIds[cell.tileKind]
  );

const resolveSampledGrownSmallTreeTileKind = (
  sampledTileId: number,
  registry: TileMetadataRegistry
): Extract<SmallTreeFootprintTileKind, 'trunk' | 'leaf'> | null => {
  if (isSmallTreeTrunkTileId(sampledTileId, registry)) {
    return 'trunk';
  }

  if (isSmallTreeLeafTileId(sampledTileId, registry)) {
    return 'leaf';
  }

  return null;
};

export const resolveSmallTreeGrowthStageAtAnchor = (
  world: SmallTreeAnchorWorldView,
  anchorTileX: number,
  anchorTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): SmallTreeGrowthStage | null => {
  const tileIds = getSmallTreeTileIds(registry);
  if (
    doesSmallTreeFootprintMatchAtAnchor(
      world,
      anchorTileX,
      anchorTileY,
      PLANTED_SMALL_TREE_FOOTPRINT_CELLS,
      tileIds
    )
  ) {
    return 'planted';
  }

  if (
    doesSmallTreeFootprintMatchAtAnchor(
      world,
      anchorTileX,
      anchorTileY,
      GROWN_SMALL_TREE_FOOTPRINT_CELLS,
      tileIds
    )
  ) {
    return 'grown';
  }

  return null;
};

export const resolveSmallTreeAnchorFromSampledTile = (
  world: SmallTreeAnchorWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): ResolvedSmallTreeAnchor | null => {
  const sampledTileId = world.getTile(worldTileX, worldTileY);
  if (isSmallTreeSaplingTileId(sampledTileId, registry)) {
    return resolveSmallTreeGrowthStageAtAnchor(world, worldTileX, worldTileY, registry) === 'planted'
      ? {
          anchorTileX: worldTileX,
          anchorTileY: worldTileY,
          growthStage: 'planted'
        }
      : null;
  }

  const sampledGrownTileKind = resolveSampledGrownSmallTreeTileKind(sampledTileId, registry);
  if (sampledGrownTileKind === null) {
    return null;
  }

  for (const cell of GROWN_SMALL_TREE_FOOTPRINT_CELLS) {
    if (cell.tileKind !== sampledGrownTileKind) {
      continue;
    }

    const anchorTileX = worldTileX - cell.localX;
    const anchorTileY = worldTileY - cell.localY;
    if (resolveSmallTreeGrowthStageAtAnchor(world, anchorTileX, anchorTileY, registry) !== 'grown') {
      continue;
    }

    return {
      anchorTileX,
      anchorTileY,
      growthStage: 'grown'
    };
  }

  return null;
};
