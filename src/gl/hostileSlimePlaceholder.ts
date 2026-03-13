import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import { getHostileSlimeAabb, type HostileSlimeState } from '../world/hostileSlimeState';
import type { TileWorld } from '../world/world';

export const HOSTILE_SLIME_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const HOSTILE_SLIME_PLACEHOLDER_VERTEX_COUNT = 6;
export const HOSTILE_SLIME_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  HOSTILE_SLIME_PLACEHOLDER_VERTEX_COUNT * HOSTILE_SLIME_PLACEHOLDER_VERTEX_STRIDE_FLOATS;

const HOSTILE_SLIME_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;

interface TileRange {
  min: number;
  max: number;
}

export interface HostileSlimePlaceholderNearbyLightSourceTile {
  x: number;
  y: number;
}

export interface HostileSlimePlaceholderNearbyLightSample {
  level: number;
  sourceTile: HostileSlimePlaceholderNearbyLightSourceTile | null;
}

const clampHostileSlimePlaceholderLightLevel = (lightLevel: number): number =>
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

export const buildHostileSlimePlaceholderVertices = (
  state: HostileSlimeState,
  renderPosition: HostileSlimeState['position'] = state.position
): Float32Array => {
  const aabb = getHostileSlimeAabb({
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

export const getHostileSlimePlaceholderFacingSign = (state: Pick<HostileSlimeState, 'facing'>): number =>
  state.facing === 'left' ? -1 : 1;

export const getHostileSlimePlaceholderNearbyLightSample = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: HostileSlimeState,
  renderPosition: HostileSlimeState['position'] = state.position
): HostileSlimePlaceholderNearbyLightSample => {
  const aabb = getHostileSlimeAabb({
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
  let maxNearbyLightSourceTile: HostileSlimePlaceholderNearbyLightSourceTile | null = null;
  for (
    let tileY = yRange.min - HOSTILE_SLIME_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + HOSTILE_SLIME_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - HOSTILE_SLIME_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + HOSTILE_SLIME_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      const sampledLightLevel = clampHostileSlimePlaceholderLightLevel(world.getLightLevel(tileX, tileY));
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
    level: clampHostileSlimePlaceholderLightLevel(maxNearbyLightLevel),
    sourceTile: maxNearbyLightSourceTile
  };
};
