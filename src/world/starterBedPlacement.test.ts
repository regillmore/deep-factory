import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';
import {
  evaluateStarterBedPlacement,
  hasStarterBedGroundSupport,
  isStarterBedTileId,
  resolveStarterBedAnchor,
  STARTER_BED_ITEM_ID,
  STARTER_BED_LEFT_TILE_ID,
  STARTER_BED_RIGHT_TILE_ID
} from './starterBedPlacement';

const createWorld = (tiles: Record<string, number> = {}) => ({
  getTile: (worldTileX: number, worldTileY: number): number => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

describe('starterBedPlacement', () => {
  it('exports the shared bed item plus left and right tile ids', () => {
    expect(STARTER_BED_ITEM_ID).toBe('bed');
    expect(STARTER_BED_LEFT_TILE_ID).toBe(27);
    expect(STARTER_BED_RIGHT_TILE_ID).toBe(28);
    expect(isStarterBedTileId(STARTER_BED_LEFT_TILE_ID)).toBe(true);
    expect(isStarterBedTileId(STARTER_BED_RIGHT_TILE_ID)).toBe(true);
    expect(isStarterBedTileId(26)).toBe(false);
  });

  it('resolves the shared left-anchored bed footprint from either tile half', () => {
    expect(resolveStarterBedAnchor(3, -1, STARTER_BED_LEFT_TILE_ID)).toEqual({
      leftTileX: 3,
      tileY: -1
    });
    expect(resolveStarterBedAnchor(4, -1, STARTER_BED_RIGHT_TILE_ID)).toEqual({
      leftTileX: 3,
      tileY: -1
    });
    expect(resolveStarterBedAnchor(3, -1, 0)).toBeNull();
  });

  it('requires ground support under both bed halves and accepts one-way platforms', () => {
    const solidGroundWorld = createWorld({
      '0,0': 1,
      '1,0': 1
    });
    const mixedPlatformGroundWorld = createWorld({
      '0,0': 1,
      '1,0': STARTER_PLATFORM_TILE_ID
    });
    const missingHalfSupportWorld = createWorld({
      '0,0': 1
    });

    expect(hasStarterBedGroundSupport(solidGroundWorld, 0, -1)).toBe(true);
    expect(hasStarterBedGroundSupport(mixedPlatformGroundWorld, 0, -1)).toBe(true);
    expect(hasStarterBedGroundSupport(missingHalfSupportWorld, 0, -1)).toBe(false);
  });

  it('allows empty grounded footprints and rejects occupied, unsupported, or player-overlapping placements', () => {
    const playerState = createPlayerState({
      position: { x: 64, y: 0 }
    });
    const groundedWorld = createWorld({
      '0,0': 1,
      '1,0': 1
    });
    const occupiedWorld = createWorld({
      '0,-1': STARTER_BED_LEFT_TILE_ID,
      '0,0': 1,
      '1,0': 1
    });
    const unsupportedWorld = createWorld({
      '0,0': 1
    });

    expect(evaluateStarterBedPlacement(groundedWorld, playerState, 0, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
    expect(evaluateStarterBedPlacement(occupiedWorld, playerState, 0, -1)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(evaluateStarterBedPlacement(unsupportedWorld, playerState, 0, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(
      evaluateStarterBedPlacement(
        groundedWorld,
        createPlayerState({
          position: { x: 16, y: 0 }
        }),
        0,
        -1
      )
    ).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: true,
      canPlace: false
    });
  });
});
