import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './constants';
import type { ChunkBounds } from './chunkMath';
import { TileWorld } from './world';
import type { TileEditEvent } from './world';

describe('TileWorld', () => {
  it('prunes chunks outside retained bounds', () => {
    const world = new TileWorld(1);
    const retainBounds: ChunkBounds = { minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 };

    const removed = world.pruneChunksOutside(retainBounds);

    expect(removed).toBe(8);
    expect(world.getChunkCount()).toBe(1);
    expect(Array.from(world.getChunks()).map((chunk) => chunk.coord)).toEqual([{ x: 0, y: 0 }]);
  });

  it('sets tiles and emits edit metadata', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];
    const previousTileId = world.getTile(-1, 0);

    world.onTileEdited((event) => {
      events.push(event);
    });

    const changed = world.setTile(-1, 0, 3);

    expect(changed).toBe(true);
    expect(world.getTile(-1, 0)).toBe(3);
    expect(events).toEqual([
      {
        worldTileX: -1,
        worldTileY: 0,
        chunkX: -1,
        chunkY: 0,
        localX: CHUNK_SIZE - 1,
        localY: 0,
        previousTileId,
        tileId: 3
      }
    ]);
  });

  it('does not emit or change when setting the same tile value', () => {
    const world = new TileWorld(0);
    const tileId = world.getTile(0, 0);
    let editCount = 0;

    world.onTileEdited(() => {
      editCount += 1;
    });

    const changed = world.setTile(0, 0, tileId);

    expect(changed).toBe(false);
    expect(editCount).toBe(0);
  });

  it('samples cardinal and diagonal neighbors across chunk boundaries', () => {
    const world = new TileWorld(0);

    world.setTile(0, 0, 11);
    world.setTile(0, -1, 12);
    world.setTile(1, -1, 13);
    world.setTile(1, 0, 14);
    world.setTile(1, 1, 15);
    world.setTile(0, 1, 16);
    world.setTile(-1, 1, 17);
    world.setTile(-1, 0, 18);
    world.setTile(-1, -1, 19);

    const sampled = world.sampleTileNeighborhood(0, 0);

    expect(sampled).toEqual({
      center: 11,
      north: 12,
      northEast: 13,
      east: 14,
      southEast: 15,
      south: 16,
      southWest: 17,
      west: 18,
      northWest: 19
    });

    expect(world.sampleLocalTileNeighborhood(0, 0, 0, 0)).toEqual(sampled);
  });
});
