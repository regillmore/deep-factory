import type { PlayerInventoryItemId } from './playerInventory';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

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

export interface StarterRopePlacementTarget {
  tileX: number;
  tileY: number;
}

const isStarterRopeTile = (tileId: number): boolean => tileId === STARTER_ROPE_TILE_ID;

const hasSolidSideSupport = (
  world: StarterRopePlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry
): boolean =>
  isTileSolid(world.getTile(worldTileX - 1, worldTileY), registry) ||
  isTileSolid(world.getTile(worldTileX + 1, worldTileY), registry);

export const resolveStarterRopePlacementTarget = (
  world: StarterRopePlacementWorldView,
  worldTileX: number,
  worldTileY: number
): StarterRopePlacementTarget => {
  let targetTileY = worldTileY;
  while (isStarterRopeTile(world.getTile(worldTileX, targetTileY))) {
    targetTileY += 1;
  }

  return {
    tileX: worldTileX,
    tileY: targetTileY
  };
};

export const hasStarterRopeAnchorSupport = (
  world: StarterRopePlacementWorldView,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  const tileAbove = world.getTile(worldTileX, worldTileY - 1);
  return (
    isTileSolid(tileAbove, registry) ||
    isStarterRopeTile(tileAbove) ||
    hasSolidSideSupport(world, worldTileX, worldTileY, registry)
  );
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
