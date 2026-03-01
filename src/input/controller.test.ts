import { describe, expect, it } from 'vitest';

import {
  buildDebugTileEditRequest,
  getDesktopDebugPaintKindForPointerDown,
  getTouchDebugPaintKindForPointerDown,
  markDebugPaintTileSeen,
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
