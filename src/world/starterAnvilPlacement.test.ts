import { describe, expect, it } from 'vitest';

import {
  evaluateStarterAnvilPlacement,
  hasStarterAnvilGroundSupport,
  STARTER_ANVIL_TILE_ID,
  type StarterAnvilPlacementWorldView
} from './starterAnvilPlacement';

const createWorld = (
  tiles: Record<string, number> = {}
): StarterAnvilPlacementWorldView => ({
  getTile: (worldTileX, worldTileY) => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

describe('starterAnvilPlacement', () => {
  it('exports a stable anvil tile id', () => {
    expect(STARTER_ANVIL_TILE_ID).toBe(15);
  });

  it('requires solid ground support directly below the target tile', () => {
    const supportedWorld = createWorld({
      '0,0': 1
    });
    const unsupportedWorld = createWorld({
      '1,0': 0
    });

    expect(hasStarterAnvilGroundSupport(supportedWorld, 0, -1)).toBe(true);
    expect(hasStarterAnvilGroundSupport(unsupportedWorld, 1, -1)).toBe(false);
  });

  it('allows empty supported tiles and rejects occupied or unsupported targets', () => {
    const world = createWorld({
      '0,0': 1,
      '1,-1': 9,
      '1,0': 1
    });

    expect(evaluateStarterAnvilPlacement(world, 0, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
    expect(evaluateStarterAnvilPlacement(world, 1, -1)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(evaluateStarterAnvilPlacement(world, 2, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });
});
