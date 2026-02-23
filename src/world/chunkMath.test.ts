import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './constants';
import { toTileIndex, worldToChunkCoord, worldToLocalTile } from './chunkMath';

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
});
