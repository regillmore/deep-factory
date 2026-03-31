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

export const STARTER_DOOR_ITEM_ID: PlayerInventoryItemId = 'door';
export const STARTER_DOOR_BOTTOM_TILE_ID = 23;
export const STARTER_DOOR_TOP_TILE_ID = 24;
export const STARTER_DOOR_OPEN_BOTTOM_TILE_ID = 25;
export const STARTER_DOOR_OPEN_TOP_TILE_ID = 26;

export type StarterDoorState = 'closed' | 'open';

export interface StarterDoorPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
}

export interface StarterDoorPlacementEvaluation {
  occupied: boolean;
  hasSolidFaceSupport: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

export interface StarterDoorToggleTarget {
  tileX: number;
  bottomTileY: number;
  state: StarterDoorState;
  nextBottomTileId: number;
  nextTopTileId: number;
}

export interface StarterDoorPairAnchor {
  tileX: number;
  bottomTileY: number;
}

const doesAabbOverlap = (aabb: WorldAabb, other: WorldAabb): boolean =>
  aabb.minX < other.maxX &&
  aabb.maxX > other.minX &&
  aabb.minY < other.maxY &&
  aabb.maxY > other.minY;

const createDoorAabb = (worldTileX: number, bottomWorldTileY: number): WorldAabb => ({
  minX: worldTileX * TILE_SIZE,
  minY: (bottomWorldTileY - 1) * TILE_SIZE,
  maxX: (worldTileX + 1) * TILE_SIZE,
  maxY: (bottomWorldTileY + 1) * TILE_SIZE
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

export const isStarterDoorTileId = (tileId: number): boolean =>
  tileId === STARTER_DOOR_BOTTOM_TILE_ID ||
  tileId === STARTER_DOOR_TOP_TILE_ID ||
  tileId === STARTER_DOOR_OPEN_BOTTOM_TILE_ID ||
  tileId === STARTER_DOOR_OPEN_TOP_TILE_ID;

const isStarterDoorBottomTileId = (tileId: number): boolean =>
  tileId === STARTER_DOOR_BOTTOM_TILE_ID || tileId === STARTER_DOOR_OPEN_BOTTOM_TILE_ID;

const isStarterDoorTopTileId = (tileId: number): boolean =>
  tileId === STARTER_DOOR_TOP_TILE_ID || tileId === STARTER_DOOR_OPEN_TOP_TILE_ID;

export const resolveStarterDoorPairAnchor = (
  worldTileX: number,
  worldTileY: number,
  tileId: number
): StarterDoorPairAnchor | null => {
  if (isStarterDoorTopTileId(tileId)) {
    return {
      tileX: worldTileX,
      bottomTileY: worldTileY + 1
    };
  }
  if (isStarterDoorBottomTileId(tileId)) {
    return {
      tileX: worldTileX,
      bottomTileY: worldTileY
    };
  }
  return null;
};

const resolveStarterDoorStateFromPair = (
  bottomTileId: number,
  topTileId: number
): StarterDoorState | null => {
  if (
    bottomTileId === STARTER_DOOR_BOTTOM_TILE_ID &&
    topTileId === STARTER_DOOR_TOP_TILE_ID
  ) {
    return 'closed';
  }
  if (
    bottomTileId === STARTER_DOOR_OPEN_BOTTOM_TILE_ID &&
    topTileId === STARTER_DOOR_OPEN_TOP_TILE_ID
  ) {
    return 'open';
  }
  return null;
};

export const resolveStarterDoorToggleTarget = (
  world: StarterDoorPlacementWorldView,
  worldTileX: number,
  worldTileY: number
): StarterDoorToggleTarget | null => {
  const targetedTileId = world.getTile(worldTileX, worldTileY);
  const anchor = resolveStarterDoorPairAnchor(worldTileX, worldTileY, targetedTileId);
  if (anchor === null) {
    return null;
  }

  const { tileX, bottomTileY } = anchor;
  const bottomTileId = world.getTile(worldTileX, bottomTileY);
  const topTileId = world.getTile(worldTileX, bottomTileY - 1);
  const state = resolveStarterDoorStateFromPair(bottomTileId, topTileId);
  if (state === null) {
    return null;
  }

  return {
    tileX,
    bottomTileY,
    state,
    nextBottomTileId:
      state === 'closed' ? STARTER_DOOR_OPEN_BOTTOM_TILE_ID : STARTER_DOOR_BOTTOM_TILE_ID,
    nextTopTileId:
      state === 'closed' ? STARTER_DOOR_OPEN_TOP_TILE_ID : STARTER_DOOR_TOP_TILE_ID
  };
};

export const hasStarterDoorDoorwaySupport = (
  world: StarterDoorPlacementWorldView,
  worldTileX: number,
  bottomWorldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  const hasFloorSupport = (() => {
    const supportTileId = world.getTile(worldTileX, bottomWorldTileY + 1);
    return isTileSolid(supportTileId, registry) || isTileOneWayPlatform(supportTileId, registry);
  })();

  const leftColumnSupported =
    isTileSolid(world.getTile(worldTileX - 1, bottomWorldTileY), registry) &&
    isTileSolid(world.getTile(worldTileX - 1, bottomWorldTileY - 1), registry);
  const rightColumnSupported =
    isTileSolid(world.getTile(worldTileX + 1, bottomWorldTileY), registry) &&
    isTileSolid(world.getTile(worldTileX + 1, bottomWorldTileY - 1), registry);

  return hasFloorSupport && leftColumnSupported && rightColumnSupported;
};

export const evaluateStarterDoorPlacement = (
  world: StarterDoorPlacementWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'>,
  worldTileX: number,
  bottomWorldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterDoorPlacementEvaluation => {
  const occupied =
    world.getTile(worldTileX, bottomWorldTileY) !== 0 ||
    world.getTile(worldTileX, bottomWorldTileY - 1) !== 0;
  const doorwaySupported =
    !occupied && hasStarterDoorDoorwaySupport(world, worldTileX, bottomWorldTileY, registry);
  const blockedByPlayer =
    !occupied && doesAabbOverlap(createDoorAabb(worldTileX, bottomWorldTileY), getPlayerBodyAabb(playerState));

  return {
    occupied,
    hasSolidFaceSupport: doorwaySupported,
    blockedByPlayer,
    canPlace: !occupied && doorwaySupported && !blockedByPlayer
  };
};
