import type { PlayerInventoryItemId } from './playerInventory';
import { isTileClimbable, isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_ROPE_ITEM_ID: PlayerInventoryItemId = 'rope';
export const STARTER_ROPE_TILE_ID = 11;

export interface StarterRopePlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterRopePlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

export const hasStarterRopeAnchorSupport = (
  world: StarterRopePlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  const tileAbove = world.getTile(worldTileX, worldTileY - 1);
  return isTileSolid(tileAbove, registry) || isTileClimbable(tileAbove, registry);
};

export const evaluateStarterRopePlacement = (
  world: StarterRopePlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterRopePlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0;
  const anchored = !occupied && hasStarterRopeAnchorSupport(world, worldTileX, worldTileY, registry);

  return {
    occupied,
    hasSolidFaceSupport: anchored,
    blockedByPlayer: false,
    canPlace: !occupied && anchored
  };
};
