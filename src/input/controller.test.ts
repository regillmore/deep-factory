import { describe, expect, it } from 'vitest';

import {
  buildDebugTileEditRequest,
  getDesktopDebugPaintKindForPointerDown,
  getTouchDebugPaintKindForPointerDown,
  markDebugPaintTileSeen,
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
