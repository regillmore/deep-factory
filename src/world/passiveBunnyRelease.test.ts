import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import { evaluatePassiveBunnyRelease } from './passiveBunnyRelease';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';

const tileKey = (worldTileX: number, worldTileY: number): string => `${worldTileX},${worldTileY}`;

const createPassiveBunnyReleaseWorld = (
  solidTiles: ReadonlyArray<{ x: number; y: number; tileId?: number }> = [],
  liquidTiles: ReadonlyArray<{ x: number; y: number; liquidLevel: number }> = []
) => {
  const tileIds = new Map<string, number>();
  const liquidLevels = new Map<string, number>();

  for (const tile of solidTiles) {
    tileIds.set(tileKey(tile.x, tile.y), tile.tileId ?? 1);
  }
  for (const tile of liquidTiles) {
    liquidLevels.set(tileKey(tile.x, tile.y), tile.liquidLevel);
  }

  return {
    getTile(worldTileX: number, worldTileY: number): number {
      return tileIds.get(tileKey(worldTileX, worldTileY)) ?? 0;
    },
    getLiquidLevel(worldTileX: number, worldTileY: number): number {
      return liquidLevels.get(tileKey(worldTileX, worldTileY)) ?? 0;
    }
  };
};

describe('passiveBunnyRelease', () => {
  it('releases onto nearby ground within the shared hotbar reach and faces away from the player', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const world = createPassiveBunnyReleaseWorld([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 }
    ]);

    expect(evaluatePassiveBunnyRelease(world, playerState, 2, -1)).toEqual({
      placementRangeWithinReach: true,
      spawnState: {
        position: { x: 40, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 14, height: 18 },
        grounded: true,
        facing: 'right',
        hopCooldownTicksRemaining: 48
      },
      landingTile: {
        tileX: 2,
        tileY: -1
      },
      canRelease: true
    });
  });

  it('falls back to the nearest valid ground tile in deterministic left-before-right order', () => {
    const playerState = createPlayerState({
      position: { x: 40, y: 0 }
    });
    const world = createPassiveBunnyReleaseWorld([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 2, y: -1 }
    ]);

    expect(
      evaluatePassiveBunnyRelease(world, playerState, 2, 0, {
        horizontalSearchTiles: 1,
        verticalSearchTiles: 0
      })
    ).toEqual({
      placementRangeWithinReach: true,
      spawnState: {
        position: { x: 24, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 14, height: 18 },
        grounded: true,
        facing: 'left',
        hopCooldownTicksRemaining: 48
      },
      landingTile: {
        tileX: 1,
        tileY: -1
      },
      canRelease: true
    });
  });

  it('treats a placed platform floor as valid landing support at the requested release tile', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const world = createPassiveBunnyReleaseWorld([
      { x: 2, y: 0, tileId: STARTER_PLATFORM_TILE_ID }
    ]);

    expect(evaluatePassiveBunnyRelease(world, playerState, 2, -1)).toEqual({
      placementRangeWithinReach: true,
      spawnState: {
        position: { x: 40, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 14, height: 18 },
        grounded: true,
        facing: 'right',
        hopCooldownTicksRemaining: 48
      },
      landingTile: {
        tileX: 2,
        tileY: -1
      },
      canRelease: true
    });
  });

  it('falls back to the nearest placed platform floor in deterministic left-before-right order', () => {
    const playerState = createPlayerState({
      position: { x: 40, y: 0 }
    });
    const world = createPassiveBunnyReleaseWorld([
      { x: 1, y: 0, tileId: STARTER_PLATFORM_TILE_ID },
      { x: 2, y: -1 },
      { x: 3, y: 0, tileId: STARTER_PLATFORM_TILE_ID }
    ]);

    expect(
      evaluatePassiveBunnyRelease(world, playerState, 2, 0, {
        horizontalSearchTiles: 1,
        verticalSearchTiles: 0
      })
    ).toEqual({
      placementRangeWithinReach: true,
      spawnState: {
        position: { x: 24, y: 0 },
        velocity: { x: 0, y: 0 },
        size: { width: 14, height: 18 },
        grounded: true,
        facing: 'left',
        hopCooldownTicksRemaining: 48
      },
      landingTile: {
        tileX: 1,
        tileY: -1
      },
      canRelease: true
    });
  });

  it('rejects release requests outside the shared hotbar reach before searching for ground', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const world = createPassiveBunnyReleaseWorld([
      { x: 8, y: 0 }
    ]);

    expect(evaluatePassiveBunnyRelease(world, playerState, 8, -1)).toEqual({
      placementRangeWithinReach: false,
      spawnState: null,
      landingTile: null,
      canRelease: false
    });
  });
});
