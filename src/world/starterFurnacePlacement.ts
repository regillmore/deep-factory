import type { PlayerInventoryItemId } from './playerInventory';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_FURNACE_ITEM_ID: PlayerInventoryItemId = 'furnace';
export const STARTER_FURNACE_TILE_ID = 14;

export interface StarterFurnacePlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterFurnacePlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

export const hasStarterFurnaceGroundSupport = (
  world: StarterFurnacePlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => isTileSolid(world.getTile(worldTileX, worldTileY + 1), registry);

export const evaluateStarterFurnacePlacement = (
  world: StarterFurnacePlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterFurnacePlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0;
  const solidGroundSupport = !occupied && hasStarterFurnaceGroundSupport(world, worldTileX, worldTileY, registry);

  return {
    occupied,
    hasSolidFaceSupport: solidGroundSupport,
    blockedByPlayer: false,
    canPlace: !occupied && solidGroundSupport
  };
};
