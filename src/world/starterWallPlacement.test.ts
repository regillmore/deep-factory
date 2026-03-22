import { describe, expect, it } from 'vitest';

import { TileWorld } from './world';
import {
  evaluateStarterWallPlacement,
  isPlaceableBackgroundWallItemId,
  resolvePlaceableBackgroundWallId,
  STARTER_DIRT_WALL_ID
} from './starterWallPlacement';

describe('starterWallPlacement', () => {
  it('maps placeable background-wall hotbar items to the correct wall ids', () => {
    expect(isPlaceableBackgroundWallItemId('dirt-wall')).toBe(true);
    expect(isPlaceableBackgroundWallItemId('dirt-block')).toBe(false);
    expect(resolvePlaceableBackgroundWallId('dirt-wall')).toBe(STARTER_DIRT_WALL_ID);
  });

  it('allows placement into an enclosed empty tile even when the enclosure is farther than one tile away', () => {
    const world = new TileWorld(0);
    for (let tileX = 0; tileX <= 4; tileX += 1) {
      world.setTile(tileX, 0, 1);
      world.setTile(tileX, -4, 1);
    }
    for (let tileY = -4; tileY <= 0; tileY += 1) {
      world.setTile(0, tileY, 1);
      world.setTile(4, tileY, 1);
    }

    expect(evaluateStarterWallPlacement(world, 2, -2)).toEqual({
      occupied: false,
      enclosed: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });

  it('rejects placement when the target cell is exposed instead of enclosed', () => {
    const world = new TileWorld(0);
    for (let tileX = 0; tileX <= 4; tileX += 1) {
      world.setTile(tileX, 0, 1);
    }
    for (let tileY = -3; tileY <= 0; tileY += 1) {
      world.setTile(0, tileY, 1);
      world.setTile(4, tileY, 1);
    }

    expect(evaluateStarterWallPlacement(world, 2, -2)).toEqual({
      occupied: false,
      enclosed: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });

  it('rejects placement when the target cell already contains a wall', () => {
    const world = new TileWorld(0);
    world.setTile(1, -2, 1);
    world.setTile(2, -1, 1);
    world.setTile(1, 0, 1);
    world.setTile(0, -1, 1);
    world.setWall(1, -1, STARTER_DIRT_WALL_ID);

    expect(evaluateStarterWallPlacement(world, 1, -1)).toEqual({
      occupied: true,
      enclosed: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });
});
