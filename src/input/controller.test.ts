import { describe, expect, it } from 'vitest';

import { buildDebugTileEditRequest, type PointerInspectSnapshot } from './controller';

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
