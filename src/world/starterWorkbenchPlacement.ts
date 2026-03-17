import type { PlayerInventoryItemId } from './playerInventory';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_WORKBENCH_ITEM_ID: PlayerInventoryItemId = 'workbench';
export const STARTER_WORKBENCH_TILE_ID = 12;

export interface StarterWorkbenchPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterWorkbenchPlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

export const hasStarterWorkbenchGroundSupport = (
  world: StarterWorkbenchPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => isTileSolid(world.getTile(worldTileX, worldTileY + 1), registry);

export const evaluateStarterWorkbenchPlacement = (
  world: StarterWorkbenchPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterWorkbenchPlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0;
  const solidGroundSupport = !occupied && hasStarterWorkbenchGroundSupport(world, worldTileX, worldTileY, registry);

  return {
    occupied,
    hasSolidFaceSupport: solidGroundSupport,
    blockedByPlayer: false,
    canPlace: !occupied && solidGroundSupport
  };
};
