import type { PlayerInventoryItemId } from './playerInventory';
import {
  isTileOneWayPlatform,
  isTileSolid,
  TILE_METADATA,
  type TileMetadataRegistry
} from './tileMetadata';

export const STARTER_PLATFORM_ITEM_ID: PlayerInventoryItemId = 'platform';
export const STARTER_PLATFORM_TILE_ID = 20;

export interface StarterPlatformPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterPlatformPlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

const hasPlatformAnchorSupport = (
  world: StarterPlatformPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry
): boolean => {
  const hasSupportTile = (tileId: number): boolean =>
    isTileSolid(tileId, registry) || isTileOneWayPlatform(tileId, registry);

  return (
    hasSupportTile(world.getTile(worldTileX, worldTileY - 1)) ||
    hasSupportTile(world.getTile(worldTileX + 1, worldTileY)) ||
    hasSupportTile(world.getTile(worldTileX, worldTileY + 1)) ||
    hasSupportTile(world.getTile(worldTileX - 1, worldTileY))
  );
};

export const evaluateStarterPlatformPlacement = (
  world: StarterPlatformPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterPlatformPlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0;
  const anchored = !occupied && hasPlatformAnchorSupport(world, worldTileX, worldTileY, registry);

  return {
    occupied,
    hasSolidFaceSupport: anchored,
    blockedByPlayer: false,
    canPlace: !occupied && anchored
  };
};
