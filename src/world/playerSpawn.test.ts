import { describe, expect, it } from 'vitest';

import { TILE_SIZE } from './constants';
import { findPlayerSpawnPoint } from './playerSpawn';
import { TileWorld } from './world';

const PLAYER_WIDTH = 12;
const PLAYER_HEIGHT = 28;

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
});
