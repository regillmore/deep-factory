import type { SmallTreeGrowthStage } from './smallTreeAnchors';
import {
  GROWN_SMALL_TREE_FOOTPRINT_CELLS,
  PLANTED_SMALL_TREE_FOOTPRINT_CELLS,
  type SmallTreeFootprintCell
} from './smallTreeFootprints';
import { getSmallTreeTileIds } from './smallTreeTiles';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export interface SmallTreeMutableWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
  setTile(worldTileX: number, worldTileY: number, tileId: number): boolean;
}

export interface SmallTreeFootprintWrite {
  worldTileX: number;
  worldTileY: number;
  previousTileId: number;
  tileId: number;
}

export interface SmallTreeFootprintWriteResult {
  changed: boolean;
  writes: SmallTreeFootprintWrite[];
}

const createWorldTileKey = (worldTileX: number, worldTileY: number): string => `${worldTileX},${worldTileY}`;

const getSmallTreeFootprintCellsForGrowthStage = (
  growthStage: SmallTreeGrowthStage
): readonly Readonly<SmallTreeFootprintCell>[] =>
  growthStage === 'planted' ? PLANTED_SMALL_TREE_FOOTPRINT_CELLS : GROWN_SMALL_TREE_FOOTPRINT_CELLS;

const collectSmallTreeFootprintWriteTargets = (
  anchorTileX: number,
  anchorTileY: number,
  previousGrowthStage: SmallTreeGrowthStage | null,
  nextGrowthStage: SmallTreeGrowthStage | null,
  registry: TileMetadataRegistry
): Array<{ worldTileX: number; worldTileY: number; tileId: number }> => {
  const writeTargets: Array<{ worldTileX: number; worldTileY: number; tileId: number }> = [];
  const occupiedKeys = new Set<string>();
  const tileIds = getSmallTreeTileIds(registry);

  if (nextGrowthStage !== null) {
    for (const cell of getSmallTreeFootprintCellsForGrowthStage(nextGrowthStage)) {
      const worldTileX = anchorTileX + cell.localX;
      const worldTileY = anchorTileY + cell.localY;
      writeTargets.push({
        worldTileX,
        worldTileY,
        tileId: tileIds[cell.tileKind]
      });
      occupiedKeys.add(createWorldTileKey(worldTileX, worldTileY));
    }
  }

  if (previousGrowthStage !== null) {
    for (const cell of getSmallTreeFootprintCellsForGrowthStage(previousGrowthStage)) {
      const worldTileX = anchorTileX + cell.localX;
      const worldTileY = anchorTileY + cell.localY;
      const key = createWorldTileKey(worldTileX, worldTileY);
      if (occupiedKeys.has(key)) {
        continue;
      }

      writeTargets.push({
        worldTileX,
        worldTileY,
        tileId: 0
      });
      occupiedKeys.add(key);
    }
  }

  return writeTargets;
};

const applySmallTreeFootprintWriteTargets = (
  world: SmallTreeMutableWorldView,
  writeTargets: ReadonlyArray<{ worldTileX: number; worldTileY: number; tileId: number }>
): SmallTreeFootprintWriteResult => {
  const writes: SmallTreeFootprintWrite[] = [];

  for (const target of writeTargets) {
    const previousTileId = world.getTile(target.worldTileX, target.worldTileY);
    if (previousTileId === target.tileId) {
      continue;
    }

    world.setTile(target.worldTileX, target.worldTileY, target.tileId);
    writes.push({
      worldTileX: target.worldTileX,
      worldTileY: target.worldTileY,
      previousTileId,
      tileId: target.tileId
    });
  }

  return {
    changed: writes.length > 0,
    writes
  };
};

export const applySmallTreeGrowthStageAtAnchor = (
  world: SmallTreeMutableWorldView,
  anchorTileX: number,
  anchorTileY: number,
  growthStage: SmallTreeGrowthStage,
  registry: TileMetadataRegistry = TILE_METADATA
): SmallTreeFootprintWriteResult =>
  applySmallTreeFootprintWriteTargets(
    world,
    collectSmallTreeFootprintWriteTargets(anchorTileX, anchorTileY, null, growthStage, registry)
  );

export const replaceSmallTreeGrowthStageAtAnchor = (
  world: SmallTreeMutableWorldView,
  anchorTileX: number,
  anchorTileY: number,
  previousGrowthStage: SmallTreeGrowthStage | null,
  nextGrowthStage: SmallTreeGrowthStage | null,
  registry: TileMetadataRegistry = TILE_METADATA
): SmallTreeFootprintWriteResult =>
  applySmallTreeFootprintWriteTargets(
    world,
    collectSmallTreeFootprintWriteTargets(
      anchorTileX,
      anchorTileY,
      previousGrowthStage,
      nextGrowthStage,
      registry
    )
  );

export const clearSmallTreeGrowthStageAtAnchor = (
  world: SmallTreeMutableWorldView,
  anchorTileX: number,
  anchorTileY: number,
  growthStage: SmallTreeGrowthStage,
  registry: TileMetadataRegistry = TILE_METADATA
): SmallTreeFootprintWriteResult =>
  replaceSmallTreeGrowthStageAtAnchor(world, anchorTileX, anchorTileY, growthStage, null, registry);
