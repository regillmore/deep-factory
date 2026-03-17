import { describe, expect, it } from 'vitest';

import {
  evaluateStarterWorkbenchPlacement,
  hasStarterWorkbenchGroundSupport,
  STARTER_WORKBENCH_TILE_ID,
  type StarterWorkbenchPlacementWorldView
} from './starterWorkbenchPlacement';

const createWorld = (
  tiles: Record<string, number> = {}
): StarterWorkbenchPlacementWorldView => ({
  getTile: (worldTileX, worldTileY) => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

describe('starterWorkbenchPlacement', () => {
  it('exports a stable workbench tile id', () => {
    expect(STARTER_WORKBENCH_TILE_ID).toBe(12);
  });

  it('requires solid ground support directly below the target tile', () => {
    const supportedWorld = createWorld({
      '0,0': 1
    });
    const unsupportedWorld = createWorld({
      '1,0': 0
    });

    expect(hasStarterWorkbenchGroundSupport(supportedWorld, 0, -1)).toBe(true);
    expect(hasStarterWorkbenchGroundSupport(unsupportedWorld, 1, -1)).toBe(false);
  });

  it('allows empty supported tiles and rejects occupied or unsupported targets', () => {
    const world = createWorld({
      '0,0': 1,
      '1,-1': 9,
      '1,0': 1
    });

    expect(evaluateStarterWorkbenchPlacement(world, 0, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
    expect(evaluateStarterWorkbenchPlacement(world, 1, -1)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(evaluateStarterWorkbenchPlacement(world, 2, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
  });
});
