import type { PlayerInventoryItemId } from './playerInventory';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_ANVIL_ITEM_ID: PlayerInventoryItemId = 'anvil';
export const STARTER_ANVIL_TILE_ID = 15;

export interface StarterAnvilPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterAnvilPlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

export const hasStarterAnvilGroundSupport = (
  world: StarterAnvilPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => isTileSolid(world.getTile(worldTileX, worldTileY + 1), registry);

export const evaluateStarterAnvilPlacement = (
  world: StarterAnvilPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterAnvilPlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0;
  const solidGroundSupport = !occupied && hasStarterAnvilGroundSupport(world, worldTileX, worldTileY, registry);

  return {
    occupied,
    hasSolidFaceSupport: solidGroundSupport,
    blockedByPlayer: false,
    canPlace: !occupied && solidGroundSupport
  };
};
