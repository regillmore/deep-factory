import type { PlayerInventoryItemId } from './playerInventory';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_TORCH_ITEM_ID: PlayerInventoryItemId = 'torch';
export const STARTER_TORCH_TILE_ID = 10;

export interface StarterTorchPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterTorchPlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

const hasSolidFaceSupport = (
  world: StarterTorchPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry
): boolean =>
  isTileSolid(world.getTile(worldTileX, worldTileY - 1), registry) ||
  isTileSolid(world.getTile(worldTileX + 1, worldTileY), registry) ||
  isTileSolid(world.getTile(worldTileX, worldTileY + 1), registry) ||
  isTileSolid(world.getTile(worldTileX - 1, worldTileY), registry);

export const hasStarterTorchFaceSupport = (
  world: StarterTorchPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => hasSolidFaceSupport(world, worldTileX, worldTileY, registry);

export const evaluateStarterTorchPlacement = (
  world: StarterTorchPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterTorchPlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0;
  const solidFaceSupport = !occupied && hasStarterTorchFaceSupport(world, worldTileX, worldTileY, registry);

  return {
    occupied,
    hasSolidFaceSupport: solidFaceSupport,
    blockedByPlayer: false,
    canPlace: !occupied && solidFaceSupport
  };
};
