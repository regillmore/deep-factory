import { chunkCoordBounds, type ChunkBounds } from './chunkMath';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import { PROCEDURAL_DIRT_TILE_ID, PROCEDURAL_GRASS_SURFACE_TILE_ID } from './proceduralTerrain';
import { getTileLiquidKind, isTileSolid } from './tileMetadata';

export interface GrassGrowthState {
  ticksUntilNextGrowth: number;
  nextWindowIndex: number;
}

export interface GrassGrowthSpreadTile {
  worldTileX: number;
  worldTileY: number;
}

export interface GrassGrowthWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
  setTile(worldTileX: number, worldTileY: number, tileId: number): boolean;
  getLightLevel(worldTileX: number, worldTileY: number): number;
  hasResidentChunk(chunkX: number, chunkY: number): boolean;
  getResidentChunkBounds(): ChunkBounds | null;
}

export interface GrassGrowthStepResult {
  nextGrowthState: GrassGrowthState;
  spreadTiles: GrassGrowthSpreadTile[];
}

export interface StepGrassGrowthOptions {
  world: GrassGrowthWorldView;
  growthState?: GrassGrowthState;
  growthIntervalTicks?: number;
  windowCount?: number;
}

export const DEFAULT_GRASS_GROWTH_INTERVAL_TICKS = 60;
export const DEFAULT_GRASS_GROWTH_WINDOW_COUNT = 4;

const expectInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }

  return value;
};

const expectPositiveInteger = (value: number, label: string): number => {
  const normalizedValue = expectInteger(value, label);
  if (normalizedValue <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return normalizedValue;
};

const expectNonNegativeInteger = (value: number, label: string): number => {
  const normalizedValue = expectInteger(value, label);
  if (normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return normalizedValue;
};

const hasDryNonSolidCover = (world: Pick<GrassGrowthWorldView, 'getTile'>, worldTileX: number, worldTileY: number) => {
  const coverTileId = world.getTile(worldTileX, worldTileY - 1);
  return !isTileSolid(coverTileId) && getTileLiquidKind(coverTileId) === null;
};

const hasAdjacentGrassWithinHeightOne = (
  world: Pick<GrassGrowthWorldView, 'getTile'>,
  worldTileX: number,
  worldTileY: number
): boolean => {
  for (const offsetX of [-1, 1] as const) {
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      if (world.getTile(worldTileX + offsetX, worldTileY + offsetY) === PROCEDURAL_GRASS_SURFACE_TILE_ID) {
        return true;
      }
    }
  }

  return false;
};

const canGrassSpreadToTile = (
  world: Pick<GrassGrowthWorldView, 'getLightLevel' | 'getTile'>,
  worldTileX: number,
  worldTileY: number
): boolean => {
  if (world.getTile(worldTileX, worldTileY) !== PROCEDURAL_DIRT_TILE_ID) {
    return false;
  }
  if (world.getLightLevel(worldTileX, worldTileY) !== MAX_LIGHT_LEVEL) {
    return false;
  }
  if (!hasDryNonSolidCover(world, worldTileX, worldTileY)) {
    return false;
  }

  return hasAdjacentGrassWithinHeightOne(world, worldTileX, worldTileY);
};

export const createGrassGrowthState = (
  growthIntervalTicks = DEFAULT_GRASS_GROWTH_INTERVAL_TICKS
): GrassGrowthState => ({
  ticksUntilNextGrowth: expectPositiveInteger(growthIntervalTicks, 'growthIntervalTicks'),
  nextWindowIndex: 0
});

export const resolveGrassGrowthWindowIndex = (
  worldTileX: number,
  worldTileY: number,
  windowCount = DEFAULT_GRASS_GROWTH_WINDOW_COUNT
): number => {
  const normalizedWorldTileX = expectInteger(worldTileX, 'worldTileX');
  const normalizedWorldTileY = expectInteger(worldTileY, 'worldTileY');
  const normalizedWindowCount = expectPositiveInteger(windowCount, 'windowCount');
  const hashedTile =
    Math.imul(normalizedWorldTileX, 73856093) ^ Math.imul(normalizedWorldTileY, 19349663);
  const normalizedIndex = hashedTile % normalizedWindowCount;
  return normalizedIndex >= 0 ? normalizedIndex : normalizedIndex + normalizedWindowCount;
};

export const resolveGrassGrowthRequiredChunkBounds = (
  worldTileX: number,
  worldTileY: number
): ChunkBounds => chunkCoordBounds(worldTileX - 1, worldTileY - 1, worldTileX + 1, worldTileY + 1);

export const isGrassGrowthTileNeighborhoodResident = (
  worldTileX: number,
  worldTileY: number,
  hasResidentChunk: (chunkX: number, chunkY: number) => boolean
): boolean => {
  const bounds = resolveGrassGrowthRequiredChunkBounds(worldTileX, worldTileY);
  for (let chunkY = bounds.minChunkY; chunkY <= bounds.maxChunkY; chunkY += 1) {
    for (let chunkX = bounds.minChunkX; chunkX <= bounds.maxChunkX; chunkX += 1) {
      if (!hasResidentChunk(chunkX, chunkY)) {
        return false;
      }
    }
  }

  return true;
};

const collectSpreadTargets = (
  world: GrassGrowthWorldView,
  windowIndex: number,
  windowCount: number
): GrassGrowthSpreadTile[] => {
  const residentChunkBounds = world.getResidentChunkBounds();
  if (residentChunkBounds === null) {
    return [];
  }

  const spreadTiles: GrassGrowthSpreadTile[] = [];

  for (let chunkY = residentChunkBounds.minChunkY; chunkY <= residentChunkBounds.maxChunkY; chunkY += 1) {
    for (let chunkX = residentChunkBounds.minChunkX; chunkX <= residentChunkBounds.maxChunkX; chunkX += 1) {
      if (!world.hasResidentChunk(chunkX, chunkY)) {
        continue;
      }

      const chunkBaseWorldTileX = chunkX * CHUNK_SIZE;
      const chunkBaseWorldTileY = chunkY * CHUNK_SIZE;
      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
          const worldTileX = chunkBaseWorldTileX + localX;
          const worldTileY = chunkBaseWorldTileY + localY;
          if (resolveGrassGrowthWindowIndex(worldTileX, worldTileY, windowCount) !== windowIndex) {
            continue;
          }
          if (
            !isGrassGrowthTileNeighborhoodResident(
              worldTileX,
              worldTileY,
              (residentChunkX, residentChunkY) => world.hasResidentChunk(residentChunkX, residentChunkY)
            )
          ) {
            continue;
          }
          if (!canGrassSpreadToTile(world, worldTileX, worldTileY)) {
            continue;
          }

          spreadTiles.push({ worldTileX, worldTileY });
        }
      }
    }
  }

  return spreadTiles;
};

export const stepGrassGrowth = ({
  world,
  growthState = createGrassGrowthState(),
  growthIntervalTicks = DEFAULT_GRASS_GROWTH_INTERVAL_TICKS,
  windowCount = DEFAULT_GRASS_GROWTH_WINDOW_COUNT
}: StepGrassGrowthOptions): GrassGrowthStepResult => {
  const normalizedGrowthIntervalTicks = expectPositiveInteger(
    growthIntervalTicks,
    'growthIntervalTicks'
  );
  const normalizedWindowCount = expectPositiveInteger(windowCount, 'windowCount');
  const normalizedTicksUntilNextGrowth = expectPositiveInteger(
    growthState.ticksUntilNextGrowth,
    'growthState.ticksUntilNextGrowth'
  );
  const normalizedNextWindowIndex = expectNonNegativeInteger(
    growthState.nextWindowIndex,
    'growthState.nextWindowIndex'
  );
  const activeWindowIndex = normalizedNextWindowIndex % normalizedWindowCount;
  const decrementedTicksUntilNextGrowth = normalizedTicksUntilNextGrowth - 1;

  if (decrementedTicksUntilNextGrowth > 0) {
    return {
      nextGrowthState: {
        ticksUntilNextGrowth: decrementedTicksUntilNextGrowth,
        nextWindowIndex: activeWindowIndex
      },
      spreadTiles: []
    };
  }

  // Collect targets before writing so one spread step cannot cascade through fresh grass.
  const spreadTargets = collectSpreadTargets(world, activeWindowIndex, normalizedWindowCount);
  const spreadTiles: GrassGrowthSpreadTile[] = [];
  for (const spreadTarget of spreadTargets) {
    if (!world.setTile(spreadTarget.worldTileX, spreadTarget.worldTileY, PROCEDURAL_GRASS_SURFACE_TILE_ID)) {
      continue;
    }

    spreadTiles.push(spreadTarget);
  }

  return {
    nextGrowthState: {
      ticksUntilNextGrowth: normalizedGrowthIntervalTicks,
      nextWindowIndex: (activeWindowIndex + 1) % normalizedWindowCount
    },
    spreadTiles
  };
};
