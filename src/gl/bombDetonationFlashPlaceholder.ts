import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import type { BombDetonationFlashState } from '../world/bombDetonationFlash';
import type { TileWorld } from '../world/world';

export const BOMB_DETONATION_FLASH_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const BOMB_DETONATION_FLASH_PLACEHOLDER_VERTEX_COUNT = 6;
export const BOMB_DETONATION_FLASH_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  BOMB_DETONATION_FLASH_PLACEHOLDER_VERTEX_COUNT *
  BOMB_DETONATION_FLASH_PLACEHOLDER_VERTEX_STRIDE_FLOATS;
export const BOMB_DETONATION_FLASH_PLACEHOLDER_MIN_LIGHT_FACTOR = 0.8;
export const BOMB_DETONATION_FLASH_PLACEHOLDER_BASE_COLOR = [1, 0.56, 0.18] as const;
export const BOMB_DETONATION_FLASH_PLACEHOLDER_ACCENT_COLOR = [1, 0.94, 0.7] as const;

const BOMB_DETONATION_FLASH_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;

interface TileRange {
  min: number;
  max: number;
}

export interface BombDetonationFlashPlaceholderNearbyLightSourceTile {
  x: number;
  y: number;
}

export interface BombDetonationFlashPlaceholderNearbyLightSample {
  level: number;
  sourceTile: BombDetonationFlashPlaceholderNearbyLightSourceTile | null;
}

const clampBombDetonationFlashPlaceholderLightLevel = (lightLevel: number): number =>
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

const getBombDetonationFlashPlaceholderBounds = (
  state: BombDetonationFlashState,
  renderPosition: BombDetonationFlashState['position'] = state.position
): { minX: number; minY: number; maxX: number; maxY: number } => ({
  minX: renderPosition.x - state.radius,
  minY: renderPosition.y - state.radius,
  maxX: renderPosition.x + state.radius,
  maxY: renderPosition.y + state.radius
});

export const buildBombDetonationFlashPlaceholderVertices = (
  state: BombDetonationFlashState,
  renderPosition: BombDetonationFlashState['position'] = state.position
): Float32Array => {
  const bounds = getBombDetonationFlashPlaceholderBounds(state, renderPosition);

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

export const getBombDetonationFlashPlaceholderNearbyLightSample = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: BombDetonationFlashState,
  renderPosition: BombDetonationFlashState['position'] = state.position
): BombDetonationFlashPlaceholderNearbyLightSample => {
  const bounds = getBombDetonationFlashPlaceholderBounds(state, renderPosition);
  const xRange = getOverlappingTileRange(bounds.minX, bounds.maxX);
  const yRange = getOverlappingTileRange(bounds.minY, bounds.maxY);
  if (!xRange || !yRange) {
    return { level: 0, sourceTile: null };
  }

  let maxNearbyLightLevel = 0;
  let maxNearbyLightSourceTile: BombDetonationFlashPlaceholderNearbyLightSourceTile | null = null;
  for (
    let tileY = yRange.min - BOMB_DETONATION_FLASH_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + BOMB_DETONATION_FLASH_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - BOMB_DETONATION_FLASH_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + BOMB_DETONATION_FLASH_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      const sampledLightLevel = clampBombDetonationFlashPlaceholderLightLevel(
        world.getLightLevel(tileX, tileY)
      );
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
    level: clampBombDetonationFlashPlaceholderLightLevel(maxNearbyLightLevel),
    sourceTile: maxNearbyLightSourceTile
  };
};
