import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';
import {
  evaluateStarterBedPlacement,
  findStarterBedRespawnPoint,
  hasStarterBedGroundSupport,
  isCompleteStarterBedAtAnchor,
  isStarterBedTileId,
  resolvePlacedStarterBedAnchor,
  resolveStarterBedAnchor,
  STARTER_BED_ITEM_ID,
  STARTER_BED_LEFT_TILE_ID,
  STARTER_BED_RIGHT_TILE_ID
} from './starterBedPlacement';

const createWorld = (
  tiles: Record<string, number> = {},
  liquidLevels: Record<string, number> = {}
) => ({
  getTile: (worldTileX: number, worldTileY: number): number => tiles[`${worldTileX},${worldTileY}`] ?? 0,
  getLiquidLevel: (worldTileX: number, worldTileY: number): number =>
    liquidLevels[`${worldTileX},${worldTileY}`] ?? 0
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

  it('recognizes only complete placed bed pairs at the shared left anchor', () => {
    const completeBedWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID,
      '4,-1': STARTER_BED_RIGHT_TILE_ID
    });
    const mismatchedBedWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID,
      '4,-1': 0
    });

    expect(isCompleteStarterBedAtAnchor(completeBedWorld, 3, -1)).toBe(true);
    expect(isCompleteStarterBedAtAnchor(mismatchedBedWorld, 3, -1)).toBe(false);
  });

  it('resolves placed bed interactions only from complete pairs and accepts either half', () => {
    const completeBedWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID,
      '4,-1': STARTER_BED_RIGHT_TILE_ID
    });
    const orphanedHalfWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID
    });
    const mismatchedHalfWorld = createWorld({
      '4,-1': STARTER_BED_RIGHT_TILE_ID,
      '3,-1': 0
    });

    expect(resolvePlacedStarterBedAnchor(completeBedWorld, 3, -1)).toEqual({
      leftTileX: 3,
      tileY: -1
    });
    expect(resolvePlacedStarterBedAnchor(completeBedWorld, 4, -1)).toEqual({
      leftTileX: 3,
      tileY: -1
    });
    expect(resolvePlacedStarterBedAnchor(orphanedHalfWorld, 3, -1)).toBeNull();
    expect(resolvePlacedStarterBedAnchor(mismatchedHalfWorld, 4, -1)).toBeNull();
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

  it('finds the claimed bed respawn point when the pair, floor support, and standing area stay clear', () => {
    const groundedBedWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID,
      '4,-1': STARTER_BED_RIGHT_TILE_ID,
      '3,0': 1,
      '4,0': STARTER_PLATFORM_TILE_ID
    });

    expect(
      findStarterBedRespawnPoint(
        groundedBedWorld,
        {
          leftTileX: 3,
          tileY: -1
        },
        {
          width: 12,
          height: 28
        }
      )
    ).toEqual({
      anchorTileX: 3,
      standingTileY: 0,
      x: 56,
      y: 0,
      aabb: {
        minX: 50,
        minY: -28,
        maxX: 62,
        maxY: 0
      },
      support: {
        tileX: 3,
        tileY: 0,
        tileId: 1
      }
    });
  });

  it('falls back from claimed bed respawn resolution when the pair, floor support, or standing area is invalid', () => {
    const obstructedBedWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID,
      '4,-1': STARTER_BED_RIGHT_TILE_ID,
      '3,-2': 1,
      '3,0': 1,
      '4,0': 1
    });
    const floodedBedWorld = createWorld(
      {
        '3,-1': STARTER_BED_LEFT_TILE_ID,
        '4,-1': STARTER_BED_RIGHT_TILE_ID,
        '3,0': 1,
        '4,0': 1,
        '3,-2': 7
      },
      {
        '3,-2': 8
      }
    );
    const unsupportedBedWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID,
      '4,-1': STARTER_BED_RIGHT_TILE_ID,
      '3,0': 1
    });
    const orphanedBedWorld = createWorld({
      '3,-1': STARTER_BED_LEFT_TILE_ID,
      '3,0': 1,
      '4,0': 1
    });

    const checkpoint = {
      leftTileX: 3,
      tileY: -1
    };
    const playerSize = {
      width: 12,
      height: 28
    };

    expect(findStarterBedRespawnPoint(obstructedBedWorld, null, playerSize)).toBeNull();
    expect(findStarterBedRespawnPoint(obstructedBedWorld, checkpoint, playerSize)).toBeNull();
    expect(findStarterBedRespawnPoint(floodedBedWorld, checkpoint, playerSize)).toBeNull();
    expect(findStarterBedRespawnPoint(unsupportedBedWorld, checkpoint, playerSize)).toBeNull();
    expect(findStarterBedRespawnPoint(orphanedBedWorld, checkpoint, playerSize)).toBeNull();
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
