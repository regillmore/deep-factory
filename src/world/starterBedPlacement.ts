import type { WorldAabb } from './collision';
import { TILE_SIZE } from './constants';
import type { PlayerInventoryItemId } from './playerInventory';
import type { PlayerState } from './playerState';
import {
  isTileOneWayPlatform,
  isTileSolid,
  TILE_METADATA,
  type TileMetadataRegistry
} from './tileMetadata';

export const STARTER_BED_ITEM_ID: PlayerInventoryItemId = 'bed';
export const STARTER_BED_LEFT_TILE_ID = 27;
export const STARTER_BED_RIGHT_TILE_ID = 28;

export interface StarterBedPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterBedPlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

export interface StarterBedAnchor {
  leftTileX: number;
  tileY: number;
}

const doesAabbOverlap = (aabb: WorldAabb, other: WorldAabb): boolean =>
  aabb.minX < other.maxX &&
  aabb.maxX > other.minX &&
  aabb.minY < other.maxY &&
  aabb.maxY > other.minY;

const createBedAabb = (leftTileX: number, worldTileY: number): WorldAabb => ({
  minX: leftTileX * TILE_SIZE,
  minY: worldTileY * TILE_SIZE,
  maxX: (leftTileX + 2) * TILE_SIZE,
  maxY: (worldTileY + 1) * TILE_SIZE
});

const getPlayerBodyAabb = (playerState: Pick<PlayerState, 'position' | 'size'>): WorldAabb => {
  const halfWidth = playerState.size.width * 0.5;
  return {
    minX: playerState.position.x - halfWidth,
    minY: playerState.position.y - playerState.size.height,
    maxX: playerState.position.x + halfWidth,
    maxY: playerState.position.y
  };
};

const hasGroundSupportTile = (tileId: number, registry: TileMetadataRegistry): boolean =>
  isTileSolid(tileId, registry) || isTileOneWayPlatform(tileId, registry);

export const isStarterBedTileId = (tileId: number): boolean =>
  tileId === STARTER_BED_LEFT_TILE_ID || tileId === STARTER_BED_RIGHT_TILE_ID;

export const resolveStarterBedAnchor = (
  worldTileX: number,
  worldTileY: number,
  tileId: number
): StarterBedAnchor | null => {
  if (tileId === STARTER_BED_LEFT_TILE_ID) {
    return {
      leftTileX: worldTileX,
      tileY: worldTileY
    };
  }
  if (tileId === STARTER_BED_RIGHT_TILE_ID) {
    return {
      leftTileX: worldTileX - 1,
      tileY: worldTileY
    };
  }
  return null;
};

export const hasStarterBedGroundSupport = (
  world: StarterBedPlacementWorldView,
  leftTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean =>
  hasGroundSupportTile(world.getTile(leftTileX, worldTileY + 1), registry) &&
  hasGroundSupportTile(world.getTile(leftTileX + 1, worldTileY + 1), registry);

export const evaluateStarterBedPlacement = (
  world: StarterBedPlacementWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'>,
  leftTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterBedPlacementEvaluation => {
  const occupied =
    world.getTile(leftTileX, worldTileY) !== 0 || world.getTile(leftTileX + 1, worldTileY) !== 0;
  const groundSupported =
    !occupied && hasStarterBedGroundSupport(world, leftTileX, worldTileY, registry);
  const blockedByPlayer =
    !occupied &&
    doesAabbOverlap(createBedAabb(leftTileX, worldTileY), getPlayerBodyAabb(playerState));

  return {
    occupied,
    hasSolidFaceSupport: groundSupported,
    blockedByPlayer,
    canPlace: !occupied && groundSupported && !blockedByPlayer
  };
};
