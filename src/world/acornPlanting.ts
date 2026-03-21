import { evaluatePlayerHotbarTilePlacementRange } from './playerHotbarPlacementRange';
import type { PlayerInventoryItemId } from './playerInventory';
import type { PlayerState } from './playerState';
import {
  evaluateSmallTreeGrowthSiteAtAnchor,
  type SmallTreeGrowthSiteEvaluation,
  type SmallTreeGrowthSiteWorldView
} from './smallTreeGrowthSite';
import {
  applySmallTreeGrowthStageAtAnchor,
  type SmallTreeFootprintWrite,
  type SmallTreeMutableWorldView
} from './smallTreeFootprintWrites';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const ACORN_ITEM_ID: PlayerInventoryItemId = 'acorn';

export interface AcornPlantingWorldView
  extends SmallTreeGrowthSiteWorldView,
    SmallTreeMutableWorldView {}

export interface AcornPlantingEvaluation {
  placementRangeWithinReach: boolean;
  site: SmallTreeGrowthSiteEvaluation;
  canPlant: boolean;
}

export interface PlantAcornAtAnchorResult {
  planted: boolean;
  evaluation: AcornPlantingEvaluation;
  writes: SmallTreeFootprintWrite[];
}

export interface EvaluateAcornPlantingOptions {
  maxPlacementDistance?: number;
}

export const evaluateAcornPlantingAtAnchor = (
  world: SmallTreeGrowthSiteWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'>,
  anchorTileX: number,
  anchorTileY: number,
  options: EvaluateAcornPlantingOptions = {},
  registry: TileMetadataRegistry = TILE_METADATA
): AcornPlantingEvaluation => {
  const site = evaluateSmallTreeGrowthSiteAtAnchor(world, anchorTileX, anchorTileY, registry);
  const placementRange = evaluatePlayerHotbarTilePlacementRange(
    playerState,
    anchorTileX,
    anchorTileY,
    options.maxPlacementDistance
  );

  return {
    placementRangeWithinReach: placementRange.withinRange,
    site,
    canPlant: site.canPlant && placementRange.withinRange
  };
};

export const tryPlantAcornAtAnchor = (
  world: AcornPlantingWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'>,
  anchorTileX: number,
  anchorTileY: number,
  options: EvaluateAcornPlantingOptions = {},
  registry: TileMetadataRegistry = TILE_METADATA
): PlantAcornAtAnchorResult => {
  const evaluation = evaluateAcornPlantingAtAnchor(
    world,
    playerState,
    anchorTileX,
    anchorTileY,
    options,
    registry
  );
  if (!evaluation.canPlant) {
    return {
      planted: false,
      evaluation,
      writes: []
    };
  }

  const writeResult = applySmallTreeGrowthStageAtAnchor(
    world,
    anchorTileX,
    anchorTileY,
    'planted',
    registry
  );

  return {
    planted: writeResult.changed,
    evaluation,
    writes: writeResult.writes
  };
};
