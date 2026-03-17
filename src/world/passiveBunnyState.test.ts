import { describe, expect, it } from 'vitest';

import { findPlayerSpawnPoint } from './playerSpawn';
import {
  createPassiveBunnyState,
  createPassiveBunnyStateFromSpawn,
  getPassiveBunnyAabb
} from './passiveBunnyState';
import { TileWorld } from './world';

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

describe('passiveBunnyState', () => {
  it('creates grounded bunny state with default wander-hop timing', () => {
    expect(createPassiveBunnyState()).toEqual({
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 14, height: 18 },
      grounded: true,
      facing: 'right',
      hopCooldownTicksRemaining: 48
    });
  });

  it('builds bunny state from a resolved spawn search point', () => {
    const world = new TileWorld(0);
    setTiles(world, -8, -8, 8, 8, 0);
    setTiles(world, -8, 0, 8, 0, 3);
    const spawn = findPlayerSpawnPoint(world, {
      width: 14,
      height: 18,
      originTileX: 2,
      originTileY: 0,
      maxHorizontalOffsetTiles: 0,
      maxVerticalOffsetTiles: 0
    });

    expect(spawn).not.toBeNull();
    expect(createPassiveBunnyStateFromSpawn(spawn!, { facing: 'left' })).toEqual({
      position: { x: 40, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 14, height: 18 },
      grounded: true,
      facing: 'left',
      hopCooldownTicksRemaining: 48
    });
  });

  it('derives the bunny world-space AABB from the feet-centered position', () => {
    const bunnyState = createPassiveBunnyState({
      position: { x: 40, y: 32 }
    });

    expect(getPassiveBunnyAabb(bunnyState)).toEqual({
      minX: 33,
      minY: 14,
      maxX: 47,
      maxY: 32
    });
  });
});
