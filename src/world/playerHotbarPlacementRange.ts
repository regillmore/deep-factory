import type { WorldAabb } from './collision';
import { TILE_SIZE } from './constants';
import type { PlayerState } from './playerState';

export const DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE_TILES = 5;
export const DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE =
  DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE_TILES * TILE_SIZE;

export interface PlayerHotbarTilePlacementRangeEvaluation {
  horizontalGap: number;
  verticalGap: number;
  distanceSquared: number;
  maxDistanceSquared: number;
  withinRange: boolean;
}

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

const measureAxisGap = (
  sourceMin: number,
  sourceMax: number,
  targetMin: number,
  targetMax: number
): number => {
  if (sourceMax < targetMin) {
    return targetMin - sourceMax;
  }
  if (targetMax < sourceMin) {
    return sourceMin - targetMax;
  }
  return 0;
};

export const evaluatePlayerHotbarTilePlacementRange = (
  playerState: Pick<PlayerState, 'position' | 'size'>,
  worldTileX: number,
  worldTileY: number,
  maxDistance: number = DEFAULT_PLAYER_HOTBAR_TILE_PLACEMENT_RANGE
): PlayerHotbarTilePlacementRangeEvaluation => {
  const playerAabb = getPlayerBodyAabb(playerState);
  const tileAabb = createTileAabb(worldTileX, worldTileY);
  const horizontalGap = measureAxisGap(
    playerAabb.minX,
    playerAabb.maxX,
    tileAabb.minX,
    tileAabb.maxX
  );
  const verticalGap = measureAxisGap(playerAabb.minY, playerAabb.maxY, tileAabb.minY, tileAabb.maxY);
  const distanceSquared = horizontalGap * horizontalGap + verticalGap * verticalGap;
  const maxDistanceSquared = Math.max(0, maxDistance) * Math.max(0, maxDistance);

  return {
    horizontalGap,
    verticalGap,
    distanceSquared,
    maxDistanceSquared,
    withinRange: distanceSquared <= maxDistanceSquared
  };
};
