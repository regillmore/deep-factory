import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import type { ChunkBounds } from './chunkMath';
import { parseTileMetadataRegistry } from './tileMetadata';
import { didTileLightingStateChange, TileWorld } from './world';
import type { TileEditEvent } from './world';

describe('TileWorld', () => {
  it('prunes chunks outside retained bounds', () => {
    const world = new TileWorld(1);
    const retainBounds: ChunkBounds = { minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 };

    const removed = world.pruneChunksOutside(retainBounds);

    expect(removed).toBe(8);
    expect(world.getChunkCount()).toBe(1);
    expect(Array.from(world.getChunks()).map((chunk) => chunk.coord)).toEqual([{ x: 0, y: 0 }]);
    expect(world.getDirtyLightChunkCoords()).toEqual([{ x: 0, y: 0 }]);
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

  it('reapplies edited tiles when a pruned chunk streams back in', () => {
    const world = new TileWorld(0);
    const editedTileId = 5;

    world.setTile(0, 0, editedTileId);

    expect(world.pruneChunksOutside({ minChunkX: 1, minChunkY: 1, maxChunkX: 1, maxChunkY: 1 })).toBe(1);
    expect(world.getChunkCount()).toBe(0);
    expect(world.getTile(0, 0)).toBe(editedTileId);
    expect(world.getChunkCount()).toBe(1);
  });

  it('drops stored chunk overrides when an edited tile is reset to its procedural value', () => {
    const world = new TileWorld(0);
    const proceduralTileId = world.getTile(0, 0);

    world.setTile(0, 0, 5);
    world.setTile(0, 0, proceduralTileId);

    expect(world.pruneChunksOutside({ minChunkX: 1, minChunkY: 1, maxChunkX: 1, maxChunkY: 1 })).toBe(1);
    expect(world.getTile(0, 0)).toBe(proceduralTileId);
  });

  it('generates procedural terrain with sky above and ground below in +Y-down world space', () => {
    const world = new TileWorld(0);
    const worldX = 0;
    const heightAtX = -2; // floor(sin(0 * 0.2) * 3) - 2

    expect(world.getTile(worldX, heightAtX - 1)).toBe(0);
    expect(world.getTile(worldX, heightAtX)).toBe(2);
    expect(world.getTile(worldX, heightAtX + 1)).toBe(1);
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

  it('stores per-chunk light levels and tracks resident dirty light chunks', () => {
    const world = new TileWorld(0);

    expect(world.getLightLevel(0, 0)).toBe(0);
    expect(world.isChunkLightDirty(0, 0)).toBe(true);
    expect(world.getDirtyLightChunkCoords()).toEqual([{ x: 0, y: 0 }]);

    world.fillChunkLight(0, 0, MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(world.setLightLevel(0, 0, MAX_LIGHT_LEVEL - 1)).toBe(true);
    expect(world.setLightLevel(0, 0, MAX_LIGHT_LEVEL - 1)).toBe(false);
    expect(world.getLightLevel(0, 0)).toBe(MAX_LIGHT_LEVEL - 1);

    world.markChunkLightClean(0, 0);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getDirtyLightChunkCoords()).toEqual([]);

    expect(() => world.setLightLevel(0, 0, MAX_LIGHT_LEVEL + 1)).toThrowError(
      /lightLevel must be an integer between 0 and 15/
    );
  });

  it('invalidates loaded light chunks only when an edit changes tile lighting state', () => {
    const world = new TileWorld(1);
    const affectedChunks = [
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ];
    const unaffectedChunk = { x: -1, y: 0 };

    for (const chunk of [...affectedChunks, unaffectedChunk]) {
      world.fillChunkLight(chunk.x, chunk.y, 7);
      world.markChunkLightClean(chunk.x, chunk.y);
    }

    expect(world.setTile(CHUNK_SIZE - 1, 0, 0)).toBe(true);

    for (const chunk of affectedChunks) {
      expect(world.isChunkLightDirty(chunk.x, chunk.y)).toBe(true);
      expect(world.getChunkLightLevels(chunk.x, chunk.y).every((lightLevel) => lightLevel === 0)).toBe(true);
    }

    expect(world.isChunkLightDirty(unaffectedChunk.x, unaffectedChunk.y)).toBe(false);
    expect(world.getChunkLightLevels(unaffectedChunk.x, unaffectedChunk.y).every((lightLevel) => lightLevel === 7)).toBe(
      true
    );

    for (const chunk of affectedChunks) {
      world.markChunkLightClean(chunk.x, chunk.y);
    }

    world.fillChunkLight(0, 0, 5);
    world.markChunkLightClean(0, 0);

    expect(world.setTile(0, 0, 2)).toBe(true);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getChunkLightLevels(0, 0).every((lightLevel) => lightLevel === 5)).toBe(true);
  });

  it('treats emissive changes as lighting-state changes even before default tiles emit light', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 5,
          name: 'lamp_off',
          gameplay: { solid: false, blocksLight: false },
          render: { atlasIndex: 1 }
        },
        {
          id: 6,
          name: 'lamp_on',
          gameplay: { solid: false, blocksLight: false, emissiveLight: 11 },
          render: { atlasIndex: 2 }
        }
      ]
    });

    expect(didTileLightingStateChange(5, 6, registry)).toBe(true);
    expect(didTileLightingStateChange(6, 5, registry)).toBe(true);
    expect(didTileLightingStateChange(5, 0, registry)).toBe(false);
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

    const scratch = {
      center: -1,
      north: -1,
      northEast: -1,
      east: -1,
      southEast: -1,
      south: -1,
      southWest: -1,
      west: -1,
      northWest: -1
    };
    expect(world.sampleLocalTileNeighborhoodInto(0, 0, 0, 0, scratch)).toBe(scratch);
    expect(scratch).toEqual(sampled);
  });
});
