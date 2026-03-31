import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import {
  evaluateStarterDoorPlacement,
  hasStarterDoorDoorwaySupport,
  isStarterDoorTileId,
  STARTER_DOOR_BOTTOM_TILE_ID,
  STARTER_DOOR_ITEM_ID,
  STARTER_DOOR_TOP_TILE_ID
} from './starterDoorPlacement';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';

const createWorld = (tiles: Record<string, number> = {}) => ({
  getTile: (worldTileX: number, worldTileY: number): number => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

describe('starterDoorPlacement', () => {
  it('exports the shared door item and paired closed-door tile ids', () => {
    expect(STARTER_DOOR_ITEM_ID).toBe('door');
    expect(STARTER_DOOR_BOTTOM_TILE_ID).toBe(23);
    expect(STARTER_DOOR_TOP_TILE_ID).toBe(24);
    expect(isStarterDoorTileId(STARTER_DOOR_BOTTOM_TILE_ID)).toBe(true);
    expect(isStarterDoorTileId(STARTER_DOOR_TOP_TILE_ID)).toBe(true);
    expect(isStarterDoorTileId(19)).toBe(false);
  });

  it('requires a framed two-tile doorway with floor support below the bottom tile', () => {
    const framedWorld = createWorld({
      '-1,-2': 1,
      '-1,-1': 1,
      '1,-2': 1,
      '1,-1': 1,
      '0,0': 1
    });
    const platformFloorWorld = createWorld({
      '-1,-2': 1,
      '-1,-1': 1,
      '1,-2': 1,
      '1,-1': 1,
      '0,0': STARTER_PLATFORM_TILE_ID
    });
    const missingFrameWorld = createWorld({
      '-1,-2': 1,
      '-1,-1': 1,
      '0,0': 1
    });

    expect(hasStarterDoorDoorwaySupport(framedWorld, 0, -1)).toBe(true);
    expect(hasStarterDoorDoorwaySupport(platformFloorWorld, 0, -1)).toBe(true);
    expect(hasStarterDoorDoorwaySupport(missingFrameWorld, 0, -1)).toBe(false);
  });

  it('allows empty framed doorways and rejects occupied, unsupported, or player-overlapping footprints', () => {
    const playerState = createPlayerState({
      position: { x: 64, y: 0 }
    });
    const framedWorld = createWorld({
      '-1,-2': 1,
      '-1,-1': 1,
      '1,-2': 1,
      '1,-1': 1,
      '0,0': 1
    });
    const occupiedWorld = createWorld({
      '-1,-2': 1,
      '-1,-1': 1,
      '1,-2': 1,
      '1,-1': 1,
      '0,0': 1,
      '0,-2': 9
    });
    const unsupportedWorld = createWorld({
      '-1,-2': 1,
      '-1,-1': 1,
      '0,0': 1
    });

    expect(evaluateStarterDoorPlacement(framedWorld, playerState, 0, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
    expect(evaluateStarterDoorPlacement(occupiedWorld, playerState, 0, -1)).toEqual({
      occupied: true,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(evaluateStarterDoorPlacement(unsupportedWorld, playerState, 0, -1)).toEqual({
      occupied: false,
      hasSolidFaceSupport: false,
      blockedByPlayer: false,
      canPlace: false
    });
    expect(
      evaluateStarterDoorPlacement(
        framedWorld,
        createPlayerState({
          position: { x: 8, y: 0 }
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
