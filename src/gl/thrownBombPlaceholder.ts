import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import type { ThrownBombState } from '../world/bombThrowing';
import type { TileWorld } from '../world/world';

export const THROWN_BOMB_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const THROWN_BOMB_PLACEHOLDER_VERTEX_COUNT = 6;
export const THROWN_BOMB_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  THROWN_BOMB_PLACEHOLDER_VERTEX_COUNT * THROWN_BOMB_PLACEHOLDER_VERTEX_STRIDE_FLOATS;

const THROWN_BOMB_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;

interface TileRange {
  min: number;
  max: number;
}

export interface ThrownBombPlaceholderNearbyLightSourceTile {
  x: number;
  y: number;
}

export interface ThrownBombPlaceholderNearbyLightSample {
  level: number;
  sourceTile: ThrownBombPlaceholderNearbyLightSourceTile | null;
}

const clampThrownBombPlaceholderLightLevel = (lightLevel: number): number =>
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

const getThrownBombPlaceholderBounds = (
  state: ThrownBombState,
  renderPosition: ThrownBombState['position'] = state.position
): { minX: number; minY: number; maxX: number; maxY: number } => ({
  minX: renderPosition.x - state.radius,
  minY: renderPosition.y - state.radius,
  maxX: renderPosition.x + state.radius,
  maxY: renderPosition.y + state.radius
});

export const buildThrownBombPlaceholderVertices = (
  state: ThrownBombState,
  renderPosition: ThrownBombState['position'] = state.position
): Float32Array => {
  const bounds = getThrownBombPlaceholderBounds(state, renderPosition);

  return new Float32Array([
    bounds.minX,
    bounds.minY,
    0,
    0,
    bounds.maxX,
    bounds.minY,
    1,
    0,
    bounds.maxX,
    bounds.maxY,
    1,
    1,
    bounds.minX,
    bounds.minY,
    0,
    0,
    bounds.maxX,
    bounds.maxY,
    1,
    1,
    bounds.minX,
    bounds.maxY,
    0,
    1
  ]);
};

export const getThrownBombPlaceholderNearbyLightSample = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: ThrownBombState,
  renderPosition: ThrownBombState['position'] = state.position
): ThrownBombPlaceholderNearbyLightSample => {
  const bounds = getThrownBombPlaceholderBounds(state, renderPosition);
  const xRange = getOverlappingTileRange(bounds.minX, bounds.maxX);
  const yRange = getOverlappingTileRange(bounds.minY, bounds.maxY);
  if (!xRange || !yRange) {
    return { level: 0, sourceTile: null };
  }

  let maxNearbyLightLevel = 0;
  let maxNearbyLightSourceTile: ThrownBombPlaceholderNearbyLightSourceTile | null = null;
  for (
    let tileY = yRange.min - THROWN_BOMB_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + THROWN_BOMB_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - THROWN_BOMB_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + THROWN_BOMB_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      const sampledLightLevel = clampThrownBombPlaceholderLightLevel(world.getLightLevel(tileX, tileY));
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
    level: clampThrownBombPlaceholderLightLevel(maxNearbyLightLevel),
    sourceTile: maxNearbyLightSourceTile
  };
};
