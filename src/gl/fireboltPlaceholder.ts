import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import type { StarterWandFireboltState } from '../world/starterWand';
import type { TileWorld } from '../world/world';

export const FIREBOLT_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const FIREBOLT_PLACEHOLDER_VERTEX_COUNT = 6;
export const FIREBOLT_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  FIREBOLT_PLACEHOLDER_VERTEX_COUNT * FIREBOLT_PLACEHOLDER_VERTEX_STRIDE_FLOATS;

const FIREBOLT_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;

interface TileRange {
  min: number;
  max: number;
}

export interface FireboltPlaceholderNearbyLightSourceTile {
  x: number;
  y: number;
}

export interface FireboltPlaceholderNearbyLightSample {
  level: number;
  sourceTile: FireboltPlaceholderNearbyLightSourceTile | null;
}

const clampFireboltPlaceholderLightLevel = (lightLevel: number): number =>
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

const getFireboltPlaceholderBounds = (
  state: StarterWandFireboltState,
  renderPosition: StarterWandFireboltState['position'] = state.position
): { minX: number; minY: number; maxX: number; maxY: number } => ({
  minX: renderPosition.x - state.radius,
  minY: renderPosition.y - state.radius,
  maxX: renderPosition.x + state.radius,
  maxY: renderPosition.y + state.radius
});

export const buildFireboltPlaceholderVertices = (
  state: StarterWandFireboltState,
  renderPosition: StarterWandFireboltState['position'] = state.position
): Float32Array => {
  const bounds = getFireboltPlaceholderBounds(state, renderPosition);

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

export const getFireboltPlaceholderNearbyLightSample = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: StarterWandFireboltState,
  renderPosition: StarterWandFireboltState['position'] = state.position
): FireboltPlaceholderNearbyLightSample => {
  const bounds = getFireboltPlaceholderBounds(state, renderPosition);
  const xRange = getOverlappingTileRange(bounds.minX, bounds.maxX);
  const yRange = getOverlappingTileRange(bounds.minY, bounds.maxY);
  if (!xRange || !yRange) {
    return { level: 0, sourceTile: null };
  }

  let maxNearbyLightLevel = 0;
  let maxNearbyLightSourceTile: FireboltPlaceholderNearbyLightSourceTile | null = null;
  for (
    let tileY = yRange.min - FIREBOLT_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + FIREBOLT_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - FIREBOLT_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + FIREBOLT_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      const sampledLightLevel = clampFireboltPlaceholderLightLevel(world.getLightLevel(tileX, tileY));
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
    level: clampFireboltPlaceholderLightLevel(maxNearbyLightLevel),
    sourceTile: maxNearbyLightSourceTile
  };
};
