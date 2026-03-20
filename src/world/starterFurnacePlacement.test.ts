import { describe, expect, it } from 'vitest';

import {
  evaluateStarterFurnacePlacement,
  hasStarterFurnaceGroundSupport,
  STARTER_FURNACE_TILE_ID,
  type StarterFurnacePlacementWorldView
} from './starterFurnacePlacement';

const createWorld = (
  tiles: Record<string, number> = {}
): StarterFurnacePlacementWorldView => ({
  getTile: (worldTileX, worldTileY) => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

describe('starterFurnacePlacement', () => {
  it('exports a stable furnace tile id', () => {
    expect(STARTER_FURNACE_TILE_ID).toBe(14);
  });

  it('requires solid ground support directly below the target tile', () => {
    const supportedWorld = createWorld({
      '0,0': 1
    });
    const unsupportedWorld = createWorld({
      '1,0': 0
    });

    expect(hasStarterFurnaceGroundSupport(supportedWorld, 0, -1)).toBe(true);
    expect(hasStarterFurnaceGroundSupport(unsupportedWorld, 1, -1)).toBe(false);
  });

  it('allows empty supported tiles and rejects occupied or unsupported targets', () => {
    const world = createWorld({
      '0,0': 1,
      '1,-1': 9,
      '1,0': 1
    });

    expect(evaluateStarterFurnacePlacement(world, 0, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
    expect(evaluateStarterFurnacePlacement(world, 1, -1)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(evaluateStarterFurnacePlacement(world, 2, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });
});
