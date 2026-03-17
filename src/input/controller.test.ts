import { describe, expect, it } from 'vitest';

import { Camera2D } from '../core/camera2d';
import {
  advancePlayerRopeDropInputState,
  buildDebugTileEditRequest,
  createDefaultPlayerRopeDropInputState,
  DESKTOP_CAMERA_PAN_MOUSE_BUTTON,
  resolveDesktopPlayerItemUseActionForClick,
  resolveTouchPlayerItemUseActionForTap,
  getDesktopDebugPaintKindForPointerDown,
  getTouchDebugPaintKindForPointerDown,
  isPlayerClimbDownControlKey,
  isPlayerJumpControlKey,
  isPlayerMoveLeftControlKey,
  isPlayerMoveRightControlKey,
  PLAYER_ROPE_DROP_DOUBLE_TAP_WINDOW_MS,
  PLAYER_ROPE_DROP_MAX_TAP_DURATION_MS,
  isPlayerRopeDropDoubleTapWindowArmed,
  resolvePlayerClimbYIntent,
  markDebugPaintTileSeen,
  resolveCameraPanWorldDeltaFromClientDelta,
  resolvePlayerInputTelemetry,
  resolvePlayerMovementIntent,
  resolvePlayerMoveXIntent,
  shouldStartPointerCameraPanGesture,
  shouldRetainPointerInspectOnPointerLeave,
  walkFilledEllipseTileArea,
  walkEllipseOutlineTileArea,
  walkFilledRectangleTileArea,
  walkRectangleOutlineTileArea,
  walkLineSteppedTilePath,
  type PointerInspectSnapshot
} from './controller';

const mousePointerInspect = (tileX: number, tileY: number): PointerInspectSnapshot => ({
  client: { x: 100, y: 50 },
  canvas: { x: 200, y: 100 },
  world: { x: tileX * 16 + 1, y: tileY * 16 + 1 },
  tile: { x: tileX, y: tileY },
  pointerType: 'mouse'
});

const collectLineSteppedTilePath = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): Array<[number, number]> => {
  const tiles: Array<[number, number]> = [];
  walkLineSteppedTilePath(startTileX, startTileY, endTileX, endTileY, (tileX, tileY) => {
    tiles.push([tileX, tileY]);
  });
  return tiles;
};

const collectFilledRectangleTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): Array<[number, number]> => {
  const tiles: Array<[number, number]> = [];
  walkFilledRectangleTileArea(startTileX, startTileY, endTileX, endTileY, (tileX, tileY) => {
    tiles.push([tileX, tileY]);
  });
  return tiles;
};

const collectFilledEllipseTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): Array<[number, number]> => {
  const tiles: Array<[number, number]> = [];
  walkFilledEllipseTileArea(startTileX, startTileY, endTileX, endTileY, (tileX, tileY) => {
    tiles.push([tileX, tileY]);
  });
  return tiles;
};

const collectEllipseOutlineTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): Array<[number, number]> => {
  const tiles: Array<[number, number]> = [];
  walkEllipseOutlineTileArea(startTileX, startTileY, endTileX, endTileY, (tileX, tileY) => {
    tiles.push([tileX, tileY]);
  });
  return tiles;
};

const collectRectangleOutlineTiles = (
  startTileX: number,
  startTileY: number,
  endTileX: number,
  endTileY: number
): Array<[number, number]> => {
  const tiles: Array<[number, number]> = [];
  walkRectangleOutlineTileArea(startTileX, startTileY, endTileX, endTileY, (tileX, tileY) => {
    tiles.push([tileX, tileY]);
  });
  return tiles;
};

describe('buildDebugTileEditRequest', () => {
  it('builds a place request from a mouse pointer snapshot tile', () => {
    expect(buildDebugTileEditRequest(mousePointerInspect(5, -2), 'place')).toEqual({
      worldTileX: 5,
      worldTileY: -2,
      kind: 'place'
    });
  });

  it('returns null when no pointer snapshot is available', () => {
    expect(buildDebugTileEditRequest(null, 'break')).toBeNull();
  });

  it('returns null for non-mouse pointer snapshots', () => {
    expect(
      buildDebugTileEditRequest(
        {
          ...mousePointerInspect(1, 2),
          pointerType: 'touch'
        },
        'break'
      )
    ).toBeNull();
  });
});

describe('resolveCameraPanWorldDeltaFromClientDelta', () => {
  it('scales client drag deltas through the canvas backbuffer before converting to world space', () => {
    const camera = new Camera2D();
    camera.zoom = 4;

    expect(
      resolveCameraPanWorldDeltaFromClientDelta(
        12,
        -6,
        { width: 1600, height: 900 },
        { left: 100, top: 50, width: 800, height: 450 },
        camera
      )
    ).toEqual({
      x: 6,
      y: -3
    });
  });
});

describe('shouldStartPointerCameraPanGesture', () => {
  it('keeps play-mode left click free for item use instead of camera panning', () => {
    expect(
      shouldStartPointerCameraPanGesture('mouse', 0, false, 'play', 'pan')
    ).toBe(false);
  });

  it('allows desktop camera pan from middle mouse in play mode', () => {
    expect(
      shouldStartPointerCameraPanGesture(
        'mouse',
        DESKTOP_CAMERA_PAN_MOUSE_BUTTON,
        false,
        'play',
        'pan'
      )
    ).toBe(true);
  });

  it('keeps shift-drag camera pan available during desktop debug editing', () => {
    expect(
      shouldStartPointerCameraPanGesture('mouse', 0, true, 'debug-edit', 'place')
    ).toBe(true);
  });

  it('limits touch camera pan to debug pan mode', () => {
    expect(shouldStartPointerCameraPanGesture('touch', 0, false, 'debug-edit', 'pan')).toBe(true);
    expect(shouldStartPointerCameraPanGesture('touch', 0, false, 'debug-edit', 'place')).toBe(false);
    expect(shouldStartPointerCameraPanGesture('touch', 0, false, 'play', 'pan')).toBe(false);
  });
});

describe('shouldRetainPointerInspectOnPointerLeave', () => {
  it('retains pointer inspect when any registered retainer matches the leave target', () => {
    const matchingTarget = new EventTarget();

    expect(
      shouldRetainPointerInspectOnPointerLeave(matchingTarget, [
        () => false,
        (candidate) => candidate === matchingTarget
      ])
    ).toBe(true);
  });

  it('clears pointer inspect when no registered retainer matches the leave target', () => {
    expect(
      shouldRetainPointerInspectOnPointerLeave(
        new EventTarget(),
        [() => false, () => false]
      )
    ).toBe(false);
    expect(shouldRetainPointerInspectOnPointerLeave(null, [(candidate) => candidate !== null])).toBe(false);
  });
});

describe('getDesktopDebugPaintKindForPointerDown', () => {
  it('uses left mouse pointerdown for place edits', () => {
    expect(getDesktopDebugPaintKindForPointerDown('mouse', 0, false)).toBe('place');
  });

  it('uses right mouse pointerdown for break edits', () => {
    expect(getDesktopDebugPaintKindForPointerDown('mouse', 2, false)).toBe('break');
  });

  it('disables debug paint when the pan modifier is held', () => {
    expect(getDesktopDebugPaintKindForPointerDown('mouse', 0, true)).toBeNull();
    expect(getDesktopDebugPaintKindForPointerDown('mouse', 2, true)).toBeNull();
  });

  it('ignores non-mouse pointerdown events', () => {
    expect(getDesktopDebugPaintKindForPointerDown('touch', 0, false)).toBeNull();
  });
});

describe('getTouchDebugPaintKindForPointerDown', () => {
  it('uses touch pointerdown with place mode for place edits', () => {
    expect(getTouchDebugPaintKindForPointerDown('touch', 'place')).toBe('place');
  });

  it('uses touch pointerdown with break mode for break edits', () => {
    expect(getTouchDebugPaintKindForPointerDown('touch', 'break')).toBe('break');
  });

  it('keeps touch panning active when touch debug mode is pan', () => {
    expect(getTouchDebugPaintKindForPointerDown('touch', 'pan')).toBeNull();
  });

  it('ignores non-touch pointerdown events', () => {
    expect(getTouchDebugPaintKindForPointerDown('mouse', 'place')).toBeNull();
  });
});

describe('player item use gestures', () => {
  it('accepts a short unmodified left click for desktop play item use', () => {
    expect(
      resolveDesktopPlayerItemUseActionForClick({
        durationMs: 120,
        maxPointerTravelPx: 4,
        gesturesEnabled: true,
        button: 0,
        shiftKey: false
      })
    ).toBe('use-item');
  });

  it('rejects modified, long, or drifting desktop clicks for item use', () => {
    expect(
      resolveDesktopPlayerItemUseActionForClick({
        durationMs: 300,
        maxPointerTravelPx: 4,
        gesturesEnabled: true,
        button: 0,
        shiftKey: false
      })
    ).toBeNull();
    expect(
      resolveDesktopPlayerItemUseActionForClick({
        durationMs: 120,
        maxPointerTravelPx: 7,
        gesturesEnabled: true,
        button: 0,
        shiftKey: false
      })
    ).toBeNull();
    expect(
      resolveDesktopPlayerItemUseActionForClick({
        durationMs: 120,
        maxPointerTravelPx: 4,
        gesturesEnabled: true,
        button: 0,
        shiftKey: true
      })
    ).toBeNull();
  });

  it('accepts a short low-drift touch tap for play item use and rejects drags', () => {
    expect(
      resolveTouchPlayerItemUseActionForTap({
        durationMs: 180,
        maxPointerTravelPx: 10,
        gesturesEnabled: true
      })
    ).toBe('use-item');
    expect(
      resolveTouchPlayerItemUseActionForTap({
        durationMs: 180,
        maxPointerTravelPx: 15,
        gesturesEnabled: true
      })
    ).toBeNull();
  });
});

describe('player control key resolution', () => {
  it('maps keyboard and touch-facing horizontal controls into a normalized movement axis', () => {
    expect(resolvePlayerMoveXIntent(true, false)).toBe(-1);
    expect(resolvePlayerMoveXIntent(false, true)).toBe(1);
    expect(resolvePlayerMoveXIntent(false, false)).toBe(0);
    expect(resolvePlayerMoveXIntent(true, true)).toBe(0);
  });

  it('recognizes desktop movement and jump keys', () => {
    expect(isPlayerMoveLeftControlKey('a')).toBe(true);
    expect(isPlayerMoveLeftControlKey('arrowleft')).toBe(true);
    expect(isPlayerMoveLeftControlKey('c')).toBe(false);
    expect(isPlayerMoveLeftControlKey('h')).toBe(false);
    expect(isPlayerMoveLeftControlKey('v')).toBe(false);
    expect(isPlayerMoveLeftControlKey('m')).toBe(false);
    expect(isPlayerMoveRightControlKey('d')).toBe(true);
    expect(isPlayerMoveRightControlKey('arrowright')).toBe(true);
    expect(isPlayerMoveRightControlKey('c')).toBe(false);
    expect(isPlayerMoveRightControlKey('h')).toBe(false);
    expect(isPlayerMoveRightControlKey('v')).toBe(false);
    expect(isPlayerMoveRightControlKey('m')).toBe(false);
    expect(isPlayerJumpControlKey(' ')).toBe(true);
    expect(isPlayerJumpControlKey('w')).toBe(true);
    expect(isPlayerJumpControlKey('arrowup')).toBe(true);
    expect(isPlayerJumpControlKey('c')).toBe(false);
    expect(isPlayerJumpControlKey('h')).toBe(false);
    expect(isPlayerJumpControlKey('v')).toBe(false);
    expect(isPlayerJumpControlKey('m')).toBe(false);
    expect(isPlayerJumpControlKey('s')).toBe(false);
    expect(isPlayerClimbDownControlKey('s')).toBe(true);
    expect(isPlayerClimbDownControlKey('arrowdown')).toBe(true);
    expect(isPlayerClimbDownControlKey('w')).toBe(false);
    expect(isPlayerClimbDownControlKey('space')).toBe(false);
  });

  it('emits jumpPressed only on the rising edge of the held jump state', () => {
    expect(resolvePlayerMovementIntent(true, false, true, false)).toEqual({
      moveX: -1,
      jumpPressed: true,
      climbY: -1
    });
    expect(resolvePlayerMovementIntent(true, false, true, true)).toEqual({
      moveX: -1,
      jumpPressed: false,
      climbY: -1
    });
    expect(resolvePlayerMovementIntent(false, true, false, true)).toEqual({
      moveX: 1,
      jumpPressed: false,
      climbY: 0
    });
    expect(resolvePlayerMovementIntent(false, false, false, false, true)).toEqual({
      moveX: 0,
      jumpPressed: false,
      climbY: 1
    });
  });

  it('collapses simultaneous climb-up and climb-down input into a neutral rope intent', () => {
    expect(resolvePlayerClimbYIntent(true, false)).toBe(-1);
    expect(resolvePlayerClimbYIntent(false, true)).toBe(1);
    expect(resolvePlayerClimbYIntent(false, false)).toBe(0);
    expect(resolvePlayerClimbYIntent(true, true)).toBe(0);
  });

  it('captures move, jumpHeld, and jumpPressed telemetry for the current input sample', () => {
    expect(resolvePlayerInputTelemetry(true, false, true, false)).toEqual({
      moveX: -1,
      jumpHeld: true,
      jumpPressed: true,
      ropeDropHeld: false,
      ropeDropWindowArmed: false
    });
    expect(resolvePlayerInputTelemetry(true, false, true, true)).toEqual({
      moveX: -1,
      jumpHeld: true,
      jumpPressed: false,
      ropeDropHeld: false,
      ropeDropWindowArmed: false
    });
    expect(resolvePlayerInputTelemetry(false, false, false, true)).toEqual({
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false,
      ropeDropHeld: false,
      ropeDropWindowArmed: false
    });
  });

  it('includes rope-drop hold and window telemetry flags in the sampled input telemetry', () => {
    expect(
      resolvePlayerInputTelemetry(false, false, false, false, {
        ropeDropHeld: true,
        ropeDropWindowArmed: false
      })
    ).toEqual({
      moveX: 0,
      jumpHeld: false,
      jumpPressed: false,
      ropeDropHeld: true,
      ropeDropWindowArmed: false
    });
  });

  it('arms ropeDropHeld only when a short climb-down tap is followed by a held second press within the double-tap window', () => {
    const firstPress = advancePlayerRopeDropInputState(
      createDefaultPlayerRopeDropInputState(),
      true,
      100
    );
    const firstRelease = advancePlayerRopeDropInputState(
      firstPress,
      false,
      100 + PLAYER_ROPE_DROP_MAX_TAP_DURATION_MS
    );
    const secondPress = advancePlayerRopeDropInputState(
      firstRelease,
      true,
      100 + PLAYER_ROPE_DROP_MAX_TAP_DURATION_MS + PLAYER_ROPE_DROP_DOUBLE_TAP_WINDOW_MS - 1
    );

    expect(secondPress).toEqual({
      climbDownHeld: true,
      ropeDropHeld: true,
      lastTapReleasedAtMs: 100 + PLAYER_ROPE_DROP_MAX_TAP_DURATION_MS,
      pressStartedAtMs:
        100 + PLAYER_ROPE_DROP_MAX_TAP_DURATION_MS + PLAYER_ROPE_DROP_DOUBLE_TAP_WINDOW_MS - 1
    });
  });

  it('does not arm ropeDropHeld after a long first hold or keep it once climb-down is released', () => {
    const longFirstPress = advancePlayerRopeDropInputState(
      createDefaultPlayerRopeDropInputState(),
      true,
      50
    );
    const longFirstRelease = advancePlayerRopeDropInputState(
      longFirstPress,
      false,
      50 + PLAYER_ROPE_DROP_MAX_TAP_DURATION_MS + 1
    );
    const secondPress = advancePlayerRopeDropInputState(
      longFirstRelease,
      true,
      50 + PLAYER_ROPE_DROP_MAX_TAP_DURATION_MS + 100
    );
    const secondRelease = advancePlayerRopeDropInputState(secondPress, false, 500);

    expect(secondPress.ropeDropHeld).toBe(false);
    expect(secondRelease).toEqual({
      climbDownHeld: false,
      ropeDropHeld: false,
      lastTapReleasedAtMs: 500,
      pressStartedAtMs: null
    });
  });

  it('reports the double-tap window as armed only after a short released tap and before the second press begins', () => {
    const firstPress = advancePlayerRopeDropInputState(
      createDefaultPlayerRopeDropInputState(),
      true,
      100
    );
    const firstRelease = advancePlayerRopeDropInputState(firstPress, false, 220);
    const secondPress = advancePlayerRopeDropInputState(firstRelease, true, 260);

    expect(isPlayerRopeDropDoubleTapWindowArmed(firstRelease, 220)).toBe(true);
    expect(isPlayerRopeDropDoubleTapWindowArmed(firstRelease, 220 + PLAYER_ROPE_DROP_DOUBLE_TAP_WINDOW_MS)).toBe(
      true
    );
    expect(
      isPlayerRopeDropDoubleTapWindowArmed(
        firstRelease,
        220 + PLAYER_ROPE_DROP_DOUBLE_TAP_WINDOW_MS + 1
      )
    ).toBe(false);
    expect(isPlayerRopeDropDoubleTapWindowArmed(secondPress, 260)).toBe(false);
  });
});

describe('markDebugPaintTileSeen', () => {
  it('dedupes repeated tiles within the same stroke', () => {
    const seenTiles = new Set<string>();
    expect(markDebugPaintTileSeen(10, -4, seenTiles)).toBe(true);
    expect(markDebugPaintTileSeen(10, -4, seenTiles)).toBe(false);
  });

  it('allows distinct tiles in the same stroke', () => {
    const seenTiles = new Set<string>();
    expect(markDebugPaintTileSeen(1, 2, seenTiles)).toBe(true);
    expect(markDebugPaintTileSeen(1, 3, seenTiles)).toBe(true);
  });
});

describe('walkLineSteppedTilePath', () => {
  it('returns a single tile when the pointer stays within one tile', () => {
    expect(collectLineSteppedTilePath(4, -2, 4, -2)).toEqual([[4, -2]]);
  });

  it('fills horizontal gaps between sampled tiles', () => {
    expect(collectLineSteppedTilePath(2, 3, 5, 3)).toEqual([
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3]
    ]);
  });

  it('fills steep diagonal movement with contiguous tile steps', () => {
    expect(collectLineSteppedTilePath(0, 0, 2, 5)).toEqual([
      [0, 0],
      [0, 1],
      [1, 2],
      [1, 3],
      [2, 4],
      [2, 5]
    ]);
  });

  it('supports reverse-direction swipes', () => {
    expect(collectLineSteppedTilePath(5, 2, 0, 0)).toEqual([
      [5, 2],
      [4, 2],
      [3, 1],
      [2, 1],
      [1, 0],
      [0, 0]
    ]);
  });
});

describe('walkFilledRectangleTileArea', () => {
  it('visits a single tile when both corners are the same', () => {
    expect(collectFilledRectangleTiles(4, -2, 4, -2)).toEqual([[4, -2]]);
  });

  it('fills an inclusive axis-aligned rectangle', () => {
    expect(collectFilledRectangleTiles(1, 2, 3, 3)).toEqual([
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3]
    ]);
  });

  it('supports reverse corner ordering', () => {
    expect(collectFilledRectangleTiles(2, 1, 0, 0)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1]
    ]);
  });
});

describe('walkFilledEllipseTileArea', () => {
  it('visits a single tile when both corners are the same', () => {
    expect(collectFilledEllipseTiles(4, -2, 4, -2)).toEqual([[4, -2]]);
  });

  it('fills an inscribed ellipse within the inclusive bounds', () => {
    expect(collectFilledEllipseTiles(0, 0, 4, 4)).toEqual([
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [1, 4],
      [2, 4],
      [3, 4]
    ]);
  });

  it('supports reverse corner ordering', () => {
    expect(collectFilledEllipseTiles(4, 4, 0, 0)).toEqual(collectFilledEllipseTiles(0, 0, 4, 4));
  });

  it('covers the full span for single-row or single-column ellipses', () => {
    expect(collectFilledEllipseTiles(1, 2, 5, 2)).toEqual([
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2]
    ]);
    expect(collectFilledEllipseTiles(3, -1, 3, 2)).toEqual([
      [3, -1],
      [3, 0],
      [3, 1],
      [3, 2]
    ]);
  });
});

describe('walkEllipseOutlineTileArea', () => {
  it('visits a single tile when both corners are the same', () => {
    expect(collectEllipseOutlineTiles(4, -2, 4, -2)).toEqual([[4, -2]]);
  });

  it('visits the perimeter of an inscribed ellipse without the interior fill', () => {
    expect(collectEllipseOutlineTiles(0, 0, 4, 4)).toEqual([
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [4, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [4, 3],
      [1, 4],
      [2, 4],
      [3, 4]
    ]);
  });

  it('supports reverse corner ordering', () => {
    expect(collectEllipseOutlineTiles(4, 4, 0, 0)).toEqual(collectEllipseOutlineTiles(0, 0, 4, 4));
  });

  it('covers the full span for single-row or single-column ellipse outlines', () => {
    expect(collectEllipseOutlineTiles(1, 2, 5, 2)).toEqual([
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2]
    ]);
    expect(collectEllipseOutlineTiles(3, -1, 3, 2)).toEqual([
      [3, -1],
      [3, 0],
      [3, 1],
      [3, 2]
    ]);
  });
});

describe('walkRectangleOutlineTileArea', () => {
  it('visits a single tile when both corners are the same', () => {
    expect(collectRectangleOutlineTiles(4, -2, 4, -2)).toEqual([[4, -2]]);
  });

  it('visits an inclusive rectangle perimeter without interior tiles', () => {
    expect(collectRectangleOutlineTiles(1, 2, 3, 4)).toEqual([
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 4],
      [2, 4],
      [3, 4],
      [1, 3],
      [3, 3]
    ]);
  });

  it('supports reverse corner ordering', () => {
    expect(collectRectangleOutlineTiles(3, 4, 1, 2)).toEqual([
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 4],
      [2, 4],
      [3, 4],
      [1, 3],
      [3, 3]
    ]);
  });

  it('does not double-visit tiles for single-row or single-column outlines', () => {
    expect(collectRectangleOutlineTiles(1, 2, 3, 2)).toEqual([
      [1, 2],
      [2, 2],
      [3, 2]
    ]);
    expect(collectRectangleOutlineTiles(5, 1, 5, 3)).toEqual([
      [5, 1],
      [5, 3],
      [5, 2]
    ]);
  });
});
