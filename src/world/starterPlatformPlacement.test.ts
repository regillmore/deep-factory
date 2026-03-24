import { describe, expect, it } from 'vitest';

import {
  evaluateStarterPlatformPlacement,
  STARTER_PLATFORM_ITEM_ID,
  STARTER_PLATFORM_TILE_ID
} from './starterPlatformPlacement';

const createWorld = (tiles: Record<string, number> = {}) => ({
  getTile: (worldTileX: number, worldTileY: number): number =>
    tiles[`${worldTileX},${worldTileY}`] ?? 0
});

describe('starterPlatformPlacement', () => {
  it('exports the shared platform item and tile ids', () => {
    expect(STARTER_PLATFORM_ITEM_ID).toBe('platform');
    expect(STARTER_PLATFORM_TILE_ID).toBe(20);
  });

  it('allows placement next to a solid anchor', () => {
    const world = createWorld({
      '0,0': 1
    });

    expect(evaluateStarterPlatformPlacement(world, 0, 1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });

  it('allows extending a run from an existing platform tile', () => {
    const world = createWorld({
      '0,0': STARTER_PLATFORM_TILE_ID
    });

    expect(evaluateStarterPlatformPlacement(world, 1, 0)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });

  it('rejects occupied or unsupported platform placements', () => {
    const occupiedWorld = createWorld({
      '2,3': STARTER_PLATFORM_TILE_ID
    });
    const unsupportedWorld = createWorld();

    expect(evaluateStarterPlatformPlacement(occupiedWorld, 2, 3)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(evaluateStarterPlatformPlacement(unsupportedWorld, 5, -2)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });
});
