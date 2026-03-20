import type { PlayerInventoryItemId } from '../world/playerInventory';
import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import { getDroppedItemAabb, type DroppedItemState } from '../world/droppedItem';
import type { TileWorld } from '../world/world';

export const DROPPED_ITEM_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const DROPPED_ITEM_PLACEHOLDER_VERTEX_COUNT = 6;
export const DROPPED_ITEM_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  DROPPED_ITEM_PLACEHOLDER_VERTEX_COUNT * DROPPED_ITEM_PLACEHOLDER_VERTEX_STRIDE_FLOATS;

const DROPPED_ITEM_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;

interface TileRange {
  min: number;
  max: number;
}

export interface DroppedItemPlaceholderPalette {
  baseColor: readonly [number, number, number];
  accentColor: readonly [number, number, number];
}

export interface DroppedItemPlaceholderNearbyLightSourceTile {
  x: number;
  y: number;
}

export interface DroppedItemPlaceholderNearbyLightSample {
  level: number;
  sourceTile: DroppedItemPlaceholderNearbyLightSourceTile | null;
}

const DROPPED_ITEM_PLACEHOLDER_PALETTES: Readonly<
  Record<PlayerInventoryItemId, DroppedItemPlaceholderPalette>
> = {
  pickaxe: {
    baseColor: [0.51, 0.56, 0.62],
    accentColor: [0.86, 0.68, 0.31]
  },
  'dirt-block': {
    baseColor: [0.47, 0.33, 0.18],
    accentColor: [0.68, 0.54, 0.33]
  },
  'stone-block': {
    baseColor: [0.41, 0.43, 0.47],
    accentColor: [0.67, 0.69, 0.74]
  },
  'copper-ore': {
    baseColor: [0.65, 0.35, 0.17],
    accentColor: [0.94, 0.71, 0.38]
  },
  'copper-bar': {
    baseColor: [0.71, 0.45, 0.24],
    accentColor: [0.98, 0.79, 0.52]
  },
  gel: {
    baseColor: [0.22, 0.58, 0.23],
    accentColor: [0.72, 0.93, 0.46]
  },
  workbench: {
    baseColor: [0.49, 0.34, 0.19],
    accentColor: [0.77, 0.64, 0.42]
  },
  furnace: {
    baseColor: [0.38, 0.36, 0.34],
    accentColor: [0.83, 0.58, 0.26]
  },
  torch: {
    baseColor: [0.79, 0.55, 0.16],
    accentColor: [0.99, 0.88, 0.46]
  },
  rope: {
    baseColor: [0.61, 0.49, 0.28],
    accentColor: [0.83, 0.73, 0.50]
  },
  umbrella: {
    baseColor: [0.53, 0.35, 0.16],
    accentColor: [0.96, 0.82, 0.48]
  },
  'bug-net': {
    baseColor: [0.39, 0.55, 0.31],
    accentColor: [0.86, 0.9, 0.57]
  },
  bunny: {
    baseColor: [0.68, 0.61, 0.54],
    accentColor: [0.96, 0.9, 0.82]
  },
  'healing-potion': {
    baseColor: [0.67, 0.18, 0.22],
    accentColor: [0.98, 0.82, 0.34]
  },
  'heart-crystal': {
    baseColor: [0.76, 0.23, 0.31],
    accentColor: [0.99, 0.73, 0.82]
  },
  sword: {
    baseColor: [0.62, 0.64, 0.7],
    accentColor: [0.97, 0.93, 0.62]
  },
  spear: {
    baseColor: [0.58, 0.49, 0.33],
    accentColor: [0.88, 0.82, 0.66]
  }
};

const clampDroppedItemPlaceholderLightLevel = (lightLevel: number): number =>
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

export const getDroppedItemPlaceholderPalette = (
  itemId: PlayerInventoryItemId
): DroppedItemPlaceholderPalette => DROPPED_ITEM_PLACEHOLDER_PALETTES[itemId];

export const buildDroppedItemPlaceholderVertices = (
  state: DroppedItemState,
  renderPosition: DroppedItemState['position'] = state.position
): Float32Array => {
  const aabb = getDroppedItemAabb({
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

export const getDroppedItemPlaceholderNearbyLightSample = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: DroppedItemState,
  renderPosition: DroppedItemState['position'] = state.position
): DroppedItemPlaceholderNearbyLightSample => {
  const aabb = getDroppedItemAabb({
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
  let maxNearbyLightSourceTile: DroppedItemPlaceholderNearbyLightSourceTile | null = null;
  for (
    let tileY = yRange.min - DROPPED_ITEM_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + DROPPED_ITEM_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - DROPPED_ITEM_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + DROPPED_ITEM_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      const sampledLightLevel = clampDroppedItemPlaceholderLightLevel(world.getLightLevel(tileX, tileY));
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
    level: clampDroppedItemPlaceholderLightLevel(maxNearbyLightLevel),
    sourceTile: maxNearbyLightSourceTile
  };
};
