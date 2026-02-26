import { describe, expect, it } from 'vitest';

import {
  buildDebugTileEditRequest,
  getDesktopDebugPaintKindForPointerDown,
  markDebugPaintTileSeen,
  type PointerInspectSnapshot
} from './controller';

const mousePointerInspect = (tileX: number, tileY: number): PointerInspectSnapshot => ({
  client: { x: 100, y: 50 },
  canvas: { x: 200, y: 100 },
  world: { x: tileX * 16 + 1, y: tileY * 16 + 1 },
  tile: { x: tileX, y: tileY },
  pointerType: 'mouse'
});

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
