import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './constants';
import {
  affectedChunkCoordsForLocalTileEdit,
  chunkBoundsContains,
  chunkCoordBounds,
  expandChunkBounds,
  toTileIndex,
  worldToChunkCoord,
  worldToLocalTile
} from './chunkMath';

describe('chunkMath', () => {
  it('computes packed tile index from local coordinates', () => {
    expect(toTileIndex(0, 0)).toBe(0);
    expect(toTileIndex(5, 2)).toBe(2 * CHUNK_SIZE + 5);
    expect(toTileIndex(CHUNK_SIZE - 1, CHUNK_SIZE - 1)).toBe(CHUNK_SIZE * CHUNK_SIZE - 1);
  });

  it('converts world tile coords to chunk and local tile coords', () => {
    expect(worldToChunkCoord(0, 0)).toEqual({ chunkX: 0, chunkY: 0 });
    expect(worldToChunkCoord(33, -1)).toEqual({ chunkX: 1, chunkY: -1 });
    expect(worldToLocalTile(33, -1)).toEqual({ localX: 1, localY: CHUNK_SIZE - 1 });
  });

  it('expands chunk bounds and checks containment', () => {
    const baseBounds = chunkCoordBounds(0, 0, CHUNK_SIZE - 1, CHUNK_SIZE - 1);
    expect(baseBounds).toEqual({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 });

    const paddedBounds = expandChunkBounds(baseBounds, 2);
    expect(paddedBounds).toEqual({ minChunkX: -2, minChunkY: -2, maxChunkX: 2, maxChunkY: 2 });
    expect(chunkBoundsContains(paddedBounds, 2, -2)).toBe(true);
    expect(chunkBoundsContains(paddedBounds, 3, 0)).toBe(false);
  });

  it('returns affected chunks for interior, edge, and corner tile edits', () => {
    expect(affectedChunkCoordsForLocalTileEdit(5, -2, 4, 7)).toEqual([{ x: 5, y: -2 }]);

    expect(affectedChunkCoordsForLocalTileEdit(5, -2, 0, 7)).toEqual([
      { x: 5, y: -2 },
      { x: 4, y: -2 }
    ]);

    expect(affectedChunkCoordsForLocalTileEdit(5, -2, CHUNK_SIZE - 1, 0)).toEqual([
      { x: 5, y: -2 },
      { x: 6, y: -2 },
      { x: 5, y: -3 },
      { x: 6, y: -3 }
    ]);
  });
});
