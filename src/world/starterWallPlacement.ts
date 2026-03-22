import type { PlayerInventoryItemId } from './playerInventory';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export type PlaceableBackgroundWallItemId = Extract<PlayerInventoryItemId, 'dirt-wall' | 'wood-wall'>;

export const STARTER_DIRT_WALL_ITEM_ID: PlaceableBackgroundWallItemId = 'dirt-wall';
export const STARTER_DIRT_WALL_ID = 1;
export const STARTER_WOOD_WALL_ITEM_ID: PlaceableBackgroundWallItemId = 'wood-wall';
export const STARTER_WOOD_WALL_ID = 2;
export const STARTER_BACKGROUND_WALL_ENCLOSURE_SCAN_LIMIT_TILES = 32;

const PLACEABLE_BACKGROUND_WALL_IDS: Readonly<Record<PlaceableBackgroundWallItemId, number>> = {
  'dirt-wall': STARTER_DIRT_WALL_ID,
  'wood-wall': STARTER_WOOD_WALL_ID
};

export interface StarterWallPlacementWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
  getWall(worldTileX: number, worldTileY: number): number;
}

export interface StarterWallPlacementEvaluation {
  occupied: boolean;
  enclosed: boolean;
  blockedByPlayer: boolean;
  canPlace: boolean;
}

export const isPlaceableBackgroundWallItemId = (
  itemId: PlayerInventoryItemId
): itemId is PlaceableBackgroundWallItemId => itemId in PLACEABLE_BACKGROUND_WALL_IDS;

export const resolvePlaceableBackgroundWallId = (
  itemId: PlaceableBackgroundWallItemId
): number => PLACEABLE_BACKGROUND_WALL_IDS[itemId];

const isDirectionEnclosedBySolidTile = (
  world: StarterWallPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  stepX: number,
  stepY: number,
  registry: TileMetadataRegistry
): boolean => {
  for (
    let distance = 1;
    distance <= STARTER_BACKGROUND_WALL_ENCLOSURE_SCAN_LIMIT_TILES;
    distance += 1
  ) {
    const scannedTileId = world.getTile(worldTileX + stepX * distance, worldTileY + stepY * distance);
    if (isTileSolid(scannedTileId, registry)) {
      return true;
    }
  }

  return false;
};

const isStarterWallPlacementEnclosed = (
  world: StarterWallPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry
): boolean =>
  isDirectionEnclosedBySolidTile(world, worldTileX, worldTileY, 0, -1, registry) &&
  isDirectionEnclosedBySolidTile(world, worldTileX, worldTileY, 1, 0, registry) &&
  isDirectionEnclosedBySolidTile(world, worldTileX, worldTileY, 0, 1, registry) &&
  isDirectionEnclosedBySolidTile(world, worldTileX, worldTileY, -1, 0, registry);

export const evaluateStarterWallPlacement = (
  world: StarterWallPlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): StarterWallPlacementEvaluation => {
  const occupied = world.getTile(worldTileX, worldTileY) !== 0 || world.getWall(worldTileX, worldTileY) !== 0;
  const enclosed = !occupied && isStarterWallPlacementEnclosed(world, worldTileX, worldTileY, registry);

  return {
    occupied,
    enclosed,
    blockedByPlayer: false,
    canPlace: !occupied && enclosed
  };
};
