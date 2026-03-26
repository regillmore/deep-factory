import { describe, expect, it } from 'vitest';

import { type ChunkBounds } from './chunkMath';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import {
  createGrassGrowthState,
  isGrassGrowthTileNeighborhoodResident,
  resolveGrassGrowthWindowIndex,
  stepGrassGrowth
} from './grassGrowth';
import { PROCEDURAL_DIRT_TILE_ID, PROCEDURAL_GRASS_SURFACE_TILE_ID } from './proceduralTerrain';

const WATER_TILE_ID = 7;

interface GrassGrowthWorldTile {
  tileX: number;
  tileY: number;
  tileId: number;
}

interface GrassGrowthWorldLightLevel {
  tileX: number;
  tileY: number;
  lightLevel: number;
}

const createTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;
const createChunkKey = (chunkX: number, chunkY: number): string => `${chunkX},${chunkY}`;

const createGrassGrowthWorldView = ({
  tiles,
  lightLevels = [],
  residentChunkBounds = {
    minChunkX: 0,
    minChunkY: 0,
    maxChunkX: 0,
    maxChunkY: 0
  },
  residentChunkKeys = [createChunkKey(0, 0)]
}: {
  tiles: readonly GrassGrowthWorldTile[];
  lightLevels?: readonly GrassGrowthWorldLightLevel[];
  residentChunkBounds?: ChunkBounds | null;
  residentChunkKeys?: readonly string[];
}) => {
  const tileMap = new Map<string, number>(tiles.map((tile) => [createTileKey(tile.tileX, tile.tileY), tile.tileId]));
  const lightLevelMap = new Map<string, number>(
    lightLevels.map((lightLevel) => [
      createTileKey(lightLevel.tileX, lightLevel.tileY),
      lightLevel.lightLevel
    ])
  );
  const residentChunks = new Set<string>(residentChunkKeys);

  return {
    getTile: (worldTileX: number, worldTileY: number) =>
      tileMap.get(createTileKey(worldTileX, worldTileY)) ?? 0,
    setTile: (worldTileX: number, worldTileY: number, tileId: number) => {
      const key = createTileKey(worldTileX, worldTileY);
      const previousTileId = tileMap.get(key) ?? 0;
      if (previousTileId === tileId) {
        return false;
      }

      if (tileId === 0) {
        tileMap.delete(key);
      } else {
        tileMap.set(key, tileId);
      }

      return true;
    },
    getLightLevel: (worldTileX: number, worldTileY: number) =>
      lightLevelMap.get(createTileKey(worldTileX, worldTileY)) ?? 0,
    hasResidentChunk: (chunkX: number, chunkY: number) => residentChunks.has(createChunkKey(chunkX, chunkY)),
    getResidentChunkBounds: () => residentChunkBounds
  };
};

describe('grassGrowth', () => {
  it('spreads grass onto sunlit dirt on the same row and within height one', () => {
    const world = createGrassGrowthWorldView({
      tiles: [
        { tileX: 0, tileY: 1, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
        { tileX: 1, tileY: 1, tileId: PROCEDURAL_DIRT_TILE_ID },
        { tileX: 3, tileY: 2, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
        { tileX: 4, tileY: 1, tileId: PROCEDURAL_DIRT_TILE_ID }
      ],
      lightLevels: [
        { tileX: 1, tileY: 1, lightLevel: MAX_LIGHT_LEVEL },
        { tileX: 4, tileY: 1, lightLevel: MAX_LIGHT_LEVEL }
      ]
    });

    const growthStep = stepGrassGrowth({
      world,
      growthState: createGrassGrowthState(1),
      growthIntervalTicks: 1,
      windowCount: 1
    });

    expect(growthStep.spreadTiles).toEqual([
      { worldTileX: 1, worldTileY: 1 },
      { worldTileX: 4, worldTileY: 1 }
    ]);
    expect(world.getTile(1, 1)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(world.getTile(4, 1)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
  });

  it('keeps lit dirt unchanged while direct-cover water occupies the tile above', () => {
    const world = createGrassGrowthWorldView({
      tiles: [
        { tileX: 0, tileY: 1, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
        { tileX: 1, tileY: 1, tileId: PROCEDURAL_DIRT_TILE_ID },
        { tileX: 1, tileY: 0, tileId: WATER_TILE_ID }
      ],
      lightLevels: [{ tileX: 1, tileY: 1, lightLevel: MAX_LIGHT_LEVEL }]
    });

    const growthStep = stepGrassGrowth({
      world,
      growthState: createGrassGrowthState(1),
      growthIntervalTicks: 1,
      windowCount: 1
    });

    expect(growthStep.spreadTiles).toEqual([]);
    expect(world.getTile(1, 1)).toBe(PROCEDURAL_DIRT_TILE_ID);
  });

  it('does not read or write the world on non-due ticks', () => {
    let getTileCallCount = 0;
    let setTileCallCount = 0;
    let getLightLevelCallCount = 0;
    let getResidentChunkBoundsCallCount = 0;

    const growthStep = stepGrassGrowth({
      world: {
        getTile: () => {
          getTileCallCount += 1;
          return 0;
        },
        setTile: () => {
          setTileCallCount += 1;
          return false;
        },
        getLightLevel: () => {
          getLightLevelCallCount += 1;
          return 0;
        },
        hasResidentChunk: () => false,
        getResidentChunkBounds: () => {
          getResidentChunkBoundsCallCount += 1;
          return null;
        }
      },
      growthState: createGrassGrowthState(2),
      growthIntervalTicks: 2,
      windowCount: 4
    });

    expect(getTileCallCount).toBe(0);
    expect(setTileCallCount).toBe(0);
    expect(getLightLevelCallCount).toBe(0);
    expect(getResidentChunkBoundsCallCount).toBe(0);
    expect(growthStep.spreadTiles).toEqual([]);
    expect(growthStep.nextGrowthState).toEqual({
      ticksUntilNextGrowth: 1,
      nextWindowIndex: 0
    });
  });

  it('requires the surrounding one-tile neighborhood chunks to stay resident before a tile can spread', () => {
    expect(
      isGrassGrowthTileNeighborhoodResident(
        CHUNK_SIZE - 1,
        4,
        (chunkX, chunkY) => chunkX === 0 && chunkY === 0
      )
    ).toBe(false);

    expect(
      isGrassGrowthTileNeighborhoodResident(
        CHUNK_SIZE - 1,
        4,
        (chunkX, chunkY) => (chunkX === 0 || chunkX === 1) && chunkY === 0
      )
    ).toBe(true);
  });

  it('hashes tile coordinates into a stable non-negative growth window index', () => {
    expect(resolveGrassGrowthWindowIndex(0, 0, 4)).toBe(0);
    expect(resolveGrassGrowthWindowIndex(1, 0, 4)).toBe(1);
    expect(resolveGrassGrowthWindowIndex(-7, 3, 4)).toBeGreaterThanOrEqual(0);
    expect(resolveGrassGrowthWindowIndex(-7, 3, 4)).toBeLessThan(4);
  });
});
