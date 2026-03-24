import { describe, expect, it } from 'vitest';

import { TILE_SIZE } from './constants';
import {
  PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES,
  resolveProceduralTerrainColumn
} from './proceduralTerrain';
import { findPlayerSpawnPoint, resolvePlayerSpawnLiquidSafetyStatus } from './playerSpawn';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';
import { TileWorld } from './world';

const PLAYER_WIDTH = 12;
const PLAYER_HEIGHT = 28;
const WATER_TILE_ID = 7;
const LAVA_TILE_ID = 8;
const SEEDED_SURFACE_OUTSIDE_LEGACY_DEFAULT_ORIGIN_WINDOW_TILE_Y = 8;

const findFirstSeededSurfaceOutsideLegacyDefaultOriginWindow = (): number => {
  for (let worldSeed = 1; worldSeed <= 0xffff; worldSeed += 1) {
    if (
      Math.abs(resolveProceduralTerrainColumn(0, worldSeed).surfaceTileY) >
      SEEDED_SURFACE_OUTSIDE_LEGACY_DEFAULT_ORIGIN_WINDOW_TILE_Y
    ) {
      return worldSeed;
    }
  }

  throw new Error('expected at least one sampled world seed to move the origin surface outside y=0');
};

const setTiles = (
  world: TileWorld,
  minTileX: number,
  minTileY: number,
  maxTileX: number,
  maxTileY: number,
  tileId: number
): void => {
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      world.setTile(tileX, tileY, tileId);
    }
  }
};

describe('findPlayerSpawnPoint', () => {
  it('finds grounded standing headroom at the origin when it is available', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -6, 3, 3, 0);
    setTiles(world, -1, 0, 1, 0, 3);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      maxHorizontalOffsetTiles: 2,
      maxVerticalOffsetTiles: 2
    });

    expect(spawn).toEqual({
      anchorTileX: 0,
      standingTileY: 0,
      x: 8,
      y: 0,
      aabb: {
        minX: 2,
        minY: -28,
        maxX: 14,
        maxY: 0
      },
      support: {
        tileX: 0,
        tileY: 0,
        tileId: 3
      }
    });
  });

  it('falls back to the nearest unblocked grounded column near the origin', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -6, 3, 3, 0);
    setTiles(world, -1, 0, 1, 0, 3);
    setTiles(world, 0, -3, 0, 2, 3);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      maxHorizontalOffsetTiles: 2,
      maxVerticalOffsetTiles: 2
    });

    expect(spawn).toEqual({
      anchorTileX: -1,
      standingTileY: 0,
      x: -8,
      y: 0,
      aabb: {
        minX: -14,
        minY: -28,
        maxX: -2,
        maxY: 0
      },
      support: {
        tileX: -1,
        tileY: 0,
        tileId: 3
      }
    });
  });

  it('skips grounded candidates whose standing AABB overlaps water and falls back to the nearest dry column', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -6, 3, 3, 0);
    setTiles(world, -1, 0, 1, 0, 3);
    world.setTile(0, -1, WATER_TILE_ID);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      maxHorizontalOffsetTiles: 2,
      maxVerticalOffsetTiles: 2
    });

    expect(spawn).toEqual({
      anchorTileX: -1,
      standingTileY: 0,
      x: -8,
      y: 0,
      aabb: {
        minX: -14,
        minY: -28,
        maxX: -2,
        maxY: 0
      },
      support: {
        tileX: -1,
        tileY: 0,
        tileId: 3
      }
    });
  });

  it('returns null when every grounded candidate within the search bounds overlaps lava', () => {
    const world = new TileWorld(0);

    setTiles(world, -2, -6, 2, 3, 0);
    world.setTile(0, 0, 3);
    world.setTile(0, -1, LAVA_TILE_ID);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      maxHorizontalOffsetTiles: 0,
      maxVerticalOffsetTiles: 1
    });

    expect(spawn).toBeNull();
  });

  it('reports whether an already resolved spawn remains liquid-safe against current world liquid overlap', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -6, 3, 3, 0);
    setTiles(world, -1, 0, 1, 0, 3);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      maxHorizontalOffsetTiles: 2,
      maxVerticalOffsetTiles: 2
    });

    expect(spawn).not.toBeNull();
    expect(resolvePlayerSpawnLiquidSafetyStatus(world, spawn!)).toBe('safe');

    world.setTile(0, -1, WATER_TILE_ID);
    expect(resolvePlayerSpawnLiquidSafetyStatus(world, spawn!)).toBe('overlap');

    world.setTile(0, -1, LAVA_TILE_ID);
    expect(resolvePlayerSpawnLiquidSafetyStatus(world, spawn!)).toBe('overlap');
  });

  it('returns null when no grounded standing headroom exists within the search bounds', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -6, 3, 3, 0);
    setTiles(world, 0, 3, 0, 3, 3);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      maxHorizontalOffsetTiles: 1,
      maxVerticalOffsetTiles: 1
    });

    expect(spawn).toBeNull();
  });

  it('accepts custom origins and searches around them in tile space', () => {
    const world = new TileWorld(0);

    setTiles(world, 2, -4, 8, 2, 0);
    setTiles(world, 4, -1, 6, -1, 3);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      originTileX: 5,
      originTileY: -1,
      maxHorizontalOffsetTiles: 1,
      maxVerticalOffsetTiles: 1
    });

    expect(spawn?.anchorTileX).toBe(5);
    expect(spawn?.standingTileY).toBe(-1);
    expect(spawn?.x).toBe(5 * TILE_SIZE + TILE_SIZE * 0.5);
    expect(spawn?.y).toBe(-TILE_SIZE);
  });

  it('treats one-way platforms as spawn support only when the caller opts in', () => {
    const world = new TileWorld(0);

    setTiles(world, -3, -6, 3, 3, 0);
    world.setTile(0, 0, STARTER_PLATFORM_TILE_ID);

    expect(
      findPlayerSpawnPoint(world, {
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        originTileX: 0,
        originTileY: 0,
        maxHorizontalOffsetTiles: 0,
        maxVerticalOffsetTiles: 0
      })
    ).toBeNull();

    expect(
      findPlayerSpawnPoint(world, {
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        originTileX: 0,
        originTileY: 0,
        maxHorizontalOffsetTiles: 0,
        maxVerticalOffsetTiles: 0,
        allowOneWayPlatformSupport: true
      })
    ).toEqual({
      anchorTileX: 0,
      standingTileY: 0,
      x: 8,
      y: 0,
      aabb: {
        minX: 2,
        minY: -28,
        maxX: 14,
        maxY: 0
      },
      support: {
        tileX: 0,
        tileY: 0,
        tileId: STARTER_PLATFORM_TILE_ID
      }
    });
  });

  it('keeps the origin-area procedural spawn viable after underground cave carving and cave-mouth openings', () => {
    const world = new TileWorld(0);

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT
    });

    expect(spawn).not.toBeNull();
    expect(Math.abs(spawn!.anchorTileX)).toBeLessThanOrEqual(1);
    expect(resolvePlayerSpawnLiquidSafetyStatus(world, spawn!)).toBe('safe');

    for (
      let worldX = -PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES;
      worldX <= PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES;
      worldX += 1
    ) {
      const { surfaceTileY } = resolveProceduralTerrainColumn(worldX, world.getWorldSeed());
      expect(world.getTile(worldX, surfaceTileY)).not.toBe(0);
    }
  });

  it('anchors default fresh-world spawn height to the seeded origin surface instead of y=0', () => {
    const worldSeed = findFirstSeededSurfaceOutsideLegacyDefaultOriginWindow();
    const world = new TileWorld(0, worldSeed);
    const expectedSurfaceTileY = resolveProceduralTerrainColumn(0, worldSeed).surfaceTileY;

    const spawn = findPlayerSpawnPoint(world, {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT
    });

    expect(spawn).not.toBeNull();
    expect(spawn?.anchorTileX).toBe(0);
    expect(spawn?.standingTileY).toBe(expectedSurfaceTileY);
    expect(resolvePlayerSpawnLiquidSafetyStatus(world, spawn!)).toBe('safe');
  });
});
