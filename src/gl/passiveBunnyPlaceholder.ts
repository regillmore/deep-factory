import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import { getPassiveBunnyAabb, type PassiveBunnyState } from '../world/passiveBunnyState';
import type { TileWorld } from '../world/world';

export const PASSIVE_BUNNY_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const PASSIVE_BUNNY_PLACEHOLDER_VERTEX_COUNT = 6;
export const PASSIVE_BUNNY_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  PASSIVE_BUNNY_PLACEHOLDER_VERTEX_COUNT * PASSIVE_BUNNY_PLACEHOLDER_VERTEX_STRIDE_FLOATS;

const PASSIVE_BUNNY_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;

interface TileRange {
  min: number;
  max: number;
}

export interface PassiveBunnyPlaceholderNearbyLightSourceTile {
  x: number;
  y: number;
}

export interface PassiveBunnyPlaceholderNearbyLightSample {
  level: number;
  sourceTile: PassiveBunnyPlaceholderNearbyLightSourceTile | null;
}

const clampPassiveBunnyPlaceholderLightLevel = (lightLevel: number): number =>
  Math.max(0, Math.min(MAX_LIGHT_LEVEL, Math.floor(lightLevel)));

const getOverlappingTileRange = (min: number, max: number): TileRange | null => {
  if (max <= min) {
    return null;
  }

  return {
    min: Math.floor(min / TILE_SIZE),
    max: Math.ceil(max / TILE_SIZE) - 1
  };
};

export const buildPassiveBunnyPlaceholderVertices = (
  state: PassiveBunnyState,
  renderPosition: PassiveBunnyState['position'] = state.position
): Float32Array => {
  const aabb = getPassiveBunnyAabb({
    ...state,
    position: {
      x: renderPosition.x,
      y: renderPosition.y
    }
  });

  return new Float32Array([
    aabb.minX,
    aabb.minY,
    0,
    0,
    aabb.maxX,
    aabb.minY,
    1,
    0,
    aabb.maxX,
    aabb.maxY,
    1,
    1,
    aabb.minX,
    aabb.minY,
    0,
    0,
    aabb.maxX,
    aabb.maxY,
    1,
    1,
    aabb.minX,
    aabb.maxY,
    0,
    1
  ]);
};

export const getPassiveBunnyPlaceholderFacingSign = (
  state: Pick<PassiveBunnyState, 'facing'>
): number => (state.facing === 'left' ? -1 : 1);

export const getPassiveBunnyPlaceholderNearbyLightSample = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: PassiveBunnyState,
  renderPosition: PassiveBunnyState['position'] = state.position
): PassiveBunnyPlaceholderNearbyLightSample => {
  const aabb = getPassiveBunnyAabb({
    ...state,
    position: {
      x: renderPosition.x,
      y: renderPosition.y
    }
  });
  const xRange = getOverlappingTileRange(aabb.minX, aabb.maxX);
  const yRange = getOverlappingTileRange(aabb.minY, aabb.maxY);
  if (!xRange || !yRange) {
    return { level: 0, sourceTile: null };
  }

  let maxNearbyLightLevel = 0;
  let maxNearbyLightSourceTile: PassiveBunnyPlaceholderNearbyLightSourceTile | null = null;
  for (
    let tileY = yRange.min - PASSIVE_BUNNY_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + PASSIVE_BUNNY_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - PASSIVE_BUNNY_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + PASSIVE_BUNNY_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      const sampledLightLevel = clampPassiveBunnyPlaceholderLightLevel(world.getLightLevel(tileX, tileY));
      if (sampledLightLevel > maxNearbyLightLevel || maxNearbyLightSourceTile === null) {
        maxNearbyLightLevel = sampledLightLevel;
        maxNearbyLightSourceTile = { x: tileX, y: tileY };
      }
      if (maxNearbyLightLevel >= MAX_LIGHT_LEVEL) {
        return {
          level: MAX_LIGHT_LEVEL,
          sourceTile: maxNearbyLightSourceTile
        };
      }
    }
  }

  return {
    level: clampPassiveBunnyPlaceholderLightLevel(maxNearbyLightLevel),
    sourceTile: maxNearbyLightSourceTile
  };
};
