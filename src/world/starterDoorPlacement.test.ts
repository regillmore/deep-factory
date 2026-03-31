import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import {
  evaluateStarterDoorItemPreview,
  evaluateStarterDoorPlacement,
  hasStarterDoorDoorwaySupport,
  isStarterDoorTileId,
  resolveStarterDoorPairAnchor,
  resolveStarterDoorToggleTarget,
  STARTER_DOOR_BOTTOM_TILE_ID,
  STARTER_DOOR_ITEM_ID,
  STARTER_DOOR_OPEN_BOTTOM_TILE_ID,
  STARTER_DOOR_OPEN_TOP_TILE_ID,
  STARTER_DOOR_TOP_TILE_ID
} from './starterDoorPlacement';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';

const createWorld = (tiles: Record<string, number> = {}) => ({
  getTile: (worldTileX: number, worldTileY: number): number => tiles[`${worldTileX},${worldTileY}`] ?? 0
});

describe('starterDoorPlacement', () => {
  it('exports the shared door item plus closed and open paired door tile ids', () => {
    expect(STARTER_DOOR_ITEM_ID).toBe('door');
    expect(STARTER_DOOR_BOTTOM_TILE_ID).toBe(23);
    expect(STARTER_DOOR_TOP_TILE_ID).toBe(24);
    expect(STARTER_DOOR_OPEN_BOTTOM_TILE_ID).toBe(25);
    expect(STARTER_DOOR_OPEN_TOP_TILE_ID).toBe(26);
    expect(isStarterDoorTileId(STARTER_DOOR_BOTTOM_TILE_ID)).toBe(true);
    expect(isStarterDoorTileId(STARTER_DOOR_TOP_TILE_ID)).toBe(true);
    expect(isStarterDoorTileId(STARTER_DOOR_OPEN_BOTTOM_TILE_ID)).toBe(true);
    expect(isStarterDoorTileId(STARTER_DOOR_OPEN_TOP_TILE_ID)).toBe(true);
    expect(isStarterDoorTileId(19)).toBe(false);
  });

  it('resolves the shared bottom-anchored door pair from either tile role', () => {
    expect(resolveStarterDoorPairAnchor(3, 4, STARTER_DOOR_BOTTOM_TILE_ID)).toEqual({
      tileX: 3,
      bottomTileY: 4
    });
    expect(resolveStarterDoorPairAnchor(3, 3, STARTER_DOOR_TOP_TILE_ID)).toEqual({
      tileX: 3,
      bottomTileY: 4
    });
    expect(resolveStarterDoorPairAnchor(3, 4, STARTER_DOOR_OPEN_BOTTOM_TILE_ID)).toEqual({
      tileX: 3,
      bottomTileY: 4
    });
    expect(resolveStarterDoorPairAnchor(3, 3, STARTER_DOOR_OPEN_TOP_TILE_ID)).toEqual({
      tileX: 3,
      bottomTileY: 4
    });
    expect(resolveStarterDoorPairAnchor(3, 4, 0)).toBeNull();
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

  it('resolves a complete paired door toggle target from either tile and rejects mismatched pairs', () => {
    const closedDoorWorld = createWorld({
      '0,-2': STARTER_DOOR_TOP_TILE_ID,
      '0,-1': STARTER_DOOR_BOTTOM_TILE_ID
    });
    const openDoorWorld = createWorld({
      '0,-2': STARTER_DOOR_OPEN_TOP_TILE_ID,
      '0,-1': STARTER_DOOR_OPEN_BOTTOM_TILE_ID
    });
    const mismatchedDoorWorld = createWorld({
      '0,-2': STARTER_DOOR_OPEN_TOP_TILE_ID,
      '0,-1': STARTER_DOOR_BOTTOM_TILE_ID
    });

    expect(resolveStarterDoorToggleTarget(closedDoorWorld, 0, -1)).toEqual({
      tileX: 0,
      bottomTileY: -1,
      state: 'closed',
      nextBottomTileId: STARTER_DOOR_OPEN_BOTTOM_TILE_ID,
      nextTopTileId: STARTER_DOOR_OPEN_TOP_TILE_ID
    });
    expect(resolveStarterDoorToggleTarget(closedDoorWorld, 0, -2)).toEqual({
      tileX: 0,
      bottomTileY: -1,
      state: 'closed',
      nextBottomTileId: STARTER_DOOR_OPEN_BOTTOM_TILE_ID,
      nextTopTileId: STARTER_DOOR_OPEN_TOP_TILE_ID
    });
    expect(resolveStarterDoorToggleTarget(openDoorWorld, 0, -1)).toEqual({
      tileX: 0,
      bottomTileY: -1,
      state: 'open',
      nextBottomTileId: STARTER_DOOR_BOTTOM_TILE_ID,
      nextTopTileId: STARTER_DOOR_TOP_TILE_ID
    });
    expect(resolveStarterDoorToggleTarget(mismatchedDoorWorld, 0, -1)).toBeNull();
    expect(resolveStarterDoorToggleTarget(createWorld(), 0, -1)).toBeNull();
  });

  it('prioritizes complete paired doors as selected-item toggle previews before placement copy', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    const nearDoorWorld = createWorld({
      '0,-2': STARTER_DOOR_TOP_TILE_ID,
      '0,-1': STARTER_DOOR_BOTTOM_TILE_ID
    });
    const farDoorWorld = createWorld({
      '20,-2': STARTER_DOOR_TOP_TILE_ID,
      '20,-1': STARTER_DOOR_BOTTOM_TILE_ID
    });

    expect(evaluateStarterDoorItemPreview(nearDoorWorld, playerState, 0, -2)).toEqual({
      kind: 'toggle',
      toggleTarget: {
        tileX: 0,
        bottomTileY: -1,
        state: 'closed',
        nextBottomTileId: STARTER_DOOR_OPEN_BOTTOM_TILE_ID,
        nextTopTileId: STARTER_DOOR_OPEN_TOP_TILE_ID
      },
      withinRange: true,
      canToggle: true
    });
    expect(evaluateStarterDoorItemPreview(farDoorWorld, playerState, 20, -1)).toEqual({
      kind: 'toggle',
      toggleTarget: {
        tileX: 20,
        bottomTileY: -1,
        state: 'closed',
        nextBottomTileId: STARTER_DOOR_OPEN_BOTTOM_TILE_ID,
        nextTopTileId: STARTER_DOOR_OPEN_TOP_TILE_ID
      },
      withinRange: false,
      canToggle: false
    });
  });

  it('falls back to empty-doorway placement preview state when no complete paired door is targeted', () => {
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

    expect(evaluateStarterDoorItemPreview(framedWorld, playerState, 0, -1)).toEqual({
      kind: 'placement',
      occupied: false,
      hasSolidFaceSupport: true,
      blockedByPlayer: false,
      canPlace: true
    });
  });
});
