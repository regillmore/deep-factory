import type { WorldAabb } from './collision';
import { TILE_SIZE } from './constants';
import type { PlayerInventoryItemId } from './playerInventory';
import type { PlayerState } from './playerState';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_BUILDING_BLOCK_ITEM_ID: PlayerInventoryItemId = 'dirt-block';
export const STARTER_BUILDING_BLOCK_TILE_ID = 9;

export interface StarterBlockPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterBlockPlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

const doesAabbOverlap = (aabb: WorldAabb, other: WorldAabb): boolean =>
  aabb.minX < other.maxX &&
  aabb.maxX > other.minX &&
  aabb.minY < other.maxY &&
  aabb.maxY > other.minY;

const createTileAabb = (worldTileX: number, worldTileY: number): WorldAabb => ({
  minX: worldTileX * TILE_SIZE,
  minY: worldTileY * TILE_SIZE,
  maxX: (worldTileX + 1) * TILE_SIZE,
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

const hasSolidFaceSupport = (
  world: StarterBlockPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry
): boolean =>
  isTileSolid(world.getTile(worldTileX, worldTileY - 1), registry) ||
  isTileSolid(world.getTile(worldTileX + 1, worldTileY), registry) ||
  isTileSolid(world.getTile(worldTileX, worldTileY + 1), registry) ||
  isTileSolid(world.getTile(worldTileX - 1, worldTileY), registry);

export const evaluateStarterBlockPlacement = (
  world: StarterBlockPlacementWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'>,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterBlockPlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0;
  const solidFaceSupport = !occupied && hasSolidFaceSupport(world, worldTileX, worldTileY, registry);
  const blockedByPlayer =
    !occupied && doesAabbOverlap(createTileAabb(worldTileX, worldTileY), getPlayerBodyAabb(playerState));

  return {
    occupied,
    hasSolidFaceSupport: solidFaceSupport,
    blockedByPlayer,
    canPlace: !occupied && solidFaceSupport && !blockedByPlayer
  };
};
