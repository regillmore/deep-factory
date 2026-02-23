import { describe, expect, it } from 'vitest';

import type { ChunkBounds } from './chunkMath';
import { TileWorld } from './world';

describe('TileWorld', () => {
  it('prunes chunks outside retained bounds', () => {
    const world = new TileWorld(1);
    const retainBounds: ChunkBounds = { minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 };

    const removed = world.pruneChunksOutside(retainBounds);

    expect(removed).toBe(8);
    expect(world.getChunkCount()).toBe(1);
    expect(Array.from(world.getChunks()).map((chunk) => chunk.coord)).toEqual([{ x: 0, y: 0 }]);
  });
});
