import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import type { ChunkBounds } from './chunkMath';
import { toTileIndex } from './chunkMath';
import { getTileEmissiveLightLevel, parseTileMetadataRegistry } from './tileMetadata';
import { didTileLightingStateChange, TileWorld } from './world';
import type { TileEditEvent } from './world';

const ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK = 0xffffffff >>> 0;
const localLightColumnBit = (localX: number): number => (1 << localX) >>> 0;
const localLightColumnRangeMask = (startLocalX: number, endLocalX: number): number => {
  let mask = 0;
  for (let localX = startLocalX; localX <= endLocalX; localX += 1) {
    mask = (mask | localLightColumnBit(localX)) >>> 0;
  }
  return mask;
};

describe('TileWorld', () => {
  it('prunes chunks outside retained bounds', () => {
    const world = new TileWorld(1);
    const retainBounds: ChunkBounds = { minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 };

    const removed = world.pruneChunksOutside(retainBounds);

    expect(removed).toBe(8);
    expect(world.getChunkCount()).toBe(1);
    expect(Array.from(world.getChunks()).map((chunk) => chunk.coord)).toEqual([{ x: 0, y: 0 }]);
    expect(world.getDirtyLightChunkCoords()).toEqual([{ x: 0, y: 0 }]);
    expect(world.getDirtyLightChunkCount()).toBe(1);
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
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK);
    expect(world.getDirtyLightChunkCoords()).toEqual([{ x: 0, y: 0 }]);
    expect(world.getDirtyLightChunkCount()).toBe(1);

    world.fillChunkLight(0, 0, MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(world.setLightLevel(0, 0, MAX_LIGHT_LEVEL - 1)).toBe(true);
    expect(world.setLightLevel(0, 0, MAX_LIGHT_LEVEL - 1)).toBe(false);
    expect(world.getLightLevel(0, 0)).toBe(MAX_LIGHT_LEVEL - 1);

    world.markChunkLightClean(0, 0);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(0);
    expect(world.getDirtyLightChunkCoords()).toEqual([]);
    expect(world.getDirtyLightChunkCount()).toBe(0);

    expect(() => world.setLightLevel(0, 0, MAX_LIGHT_LEVEL + 1)).toThrowError(
      /lightLevel must be an integer between 0 and 15/
    );
  });

  it('invalidates loaded light chunks only when an edit changes tile lighting state', () => {
    const world = new TileWorld(1);
    const affectedChunks = [
      { x: 0, y: -1, expectedLocalX: CHUNK_SIZE - 1 },
      { x: 0, y: 0, expectedLocalX: CHUNK_SIZE - 1 },
      { x: 1, y: -1, expectedLocalX: 0 },
      { x: 1, y: 0, expectedLocalX: 0 }
    ];
    const unaffectedChunks = [
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ];

    for (const chunk of [...affectedChunks, ...unaffectedChunks]) {
      world.fillChunkLight(chunk.x, chunk.y, 7);
      world.markChunkLightClean(chunk.x, chunk.y);
    }

    expect(world.setTile(CHUNK_SIZE - 1, 0, 0)).toBe(true);

    for (const chunk of affectedChunks) {
      expect(world.isChunkLightDirty(chunk.x, chunk.y)).toBe(true);
      expect(world.getChunkLightDirtyColumnMask(chunk.x, chunk.y)).toBe(
        localLightColumnBit(chunk.expectedLocalX)
      );

      const levels = world.getChunkLightLevels(chunk.x, chunk.y);
      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        expect(levels[toTileIndex(chunk.expectedLocalX, localY)]).toBe(0);
      }

      const untouchedLocalX = chunk.expectedLocalX === 0 ? 1 : 0;
      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        expect(levels[toTileIndex(untouchedLocalX, localY)]).toBe(7);
      }
    }

    for (const chunk of unaffectedChunks) {
      expect(world.isChunkLightDirty(chunk.x, chunk.y)).toBe(false);
      expect(world.getChunkLightLevels(chunk.x, chunk.y).every((lightLevel) => lightLevel === 7)).toBe(true);
    }

    for (const chunk of affectedChunks) {
      world.markChunkLightClean(chunk.x, chunk.y);
    }

    world.fillChunkLight(0, 0, 5);
    world.markChunkLightClean(0, 0);

    expect(world.setTile(0, 0, 2)).toBe(true);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getChunkLightLevels(0, 0).every((lightLevel) => lightLevel === 5)).toBe(true);
  });

  it('treats emissive gameplay changes as lighting-state changes', () => {
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

  it('invalidates neighboring chunk columns when a local emissive source is edited', () => {
    const world = new TileWorld(1);
    const placedEmissiveWorldTileX = CHUNK_SIZE - 1;

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    expect(world.setTile(placedEmissiveWorldTileX, 0, 6)).toBe(true);

    const expectedSameChunkMask = localLightColumnRangeMask(CHUNK_SIZE - 13, CHUNK_SIZE - 1);
    const expectedNextChunkMask = localLightColumnRangeMask(0, 11);

    expect(world.getChunkLightDirtyColumnMask(0, -1)).toBe(expectedSameChunkMask);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(expectedSameChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, -1)).toBe(expectedNextChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, 0)).toBe(expectedNextChunkMask);
    expect(world.isChunkLightDirty(-1, 0)).toBe(false);
  });

  it('widens non-emissive blocksLight edit invalidation when nearby emissive sources can reach the edit', () => {
    const world = new TileWorld(1);
    const worldTileY = -20;
    const emissiveTileId = 6;
    const emissiveRange = getTileEmissiveLightLevel(emissiveTileId);
    const emissiveWorldTileX = CHUNK_SIZE - 1;
    const blockerWorldTileX = CHUNK_SIZE + 2;

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    expect(world.setTile(emissiveWorldTileX, worldTileY, emissiveTileId)).toBe(true);

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    expect(world.getTile(blockerWorldTileX, worldTileY)).toBe(0);
    expect(world.setTile(blockerWorldTileX, worldTileY, 1)).toBe(true);

    const expectedPreviousChunkMask = localLightColumnRangeMask(
      CHUNK_SIZE + 2 - emissiveRange,
      CHUNK_SIZE - 1
    );
    const expectedEditedChunkMask = localLightColumnRangeMask(
      0,
      Math.min(CHUNK_SIZE - 1, 2 + emissiveRange)
    );

    expect(world.getChunkLightDirtyColumnMask(0, -1)).toBe(expectedPreviousChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, -1)).toBe(expectedEditedChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, -1)).not.toBe(localLightColumnBit(2));
    expect(world.isChunkLightDirty(-1, -1)).toBe(false);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.isChunkLightDirty(1, 0)).toBe(false);
  });

  it('tracks and clears chunk light dirtiness per local sunlight column', () => {
    const world = new TileWorld(0);
    const firstColumnMask = localLightColumnBit(3);
    const secondColumnMask = localLightColumnBit(8);

    world.fillChunkLight(0, 0, 9);
    world.markChunkLightClean(0, 0);

    world.invalidateChunkLightColumns(0, 0, firstColumnMask);
    expect(world.isChunkLightDirty(0, 0)).toBe(true);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(firstColumnMask);

    const levelsAfterFirstInvalidation = world.getChunkLightLevels(0, 0);
    expect(levelsAfterFirstInvalidation[toTileIndex(3, 0)]).toBe(0);
    expect(levelsAfterFirstInvalidation[toTileIndex(4, 0)]).toBe(9);

    world.invalidateChunkLightColumns(0, 0, secondColumnMask);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe((firstColumnMask | secondColumnMask) >>> 0);

    world.markChunkLightColumnsClean(0, 0, firstColumnMask);
    expect(world.isChunkLightDirty(0, 0)).toBe(true);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(secondColumnMask);

    world.markChunkLightColumnsClean(0, 0, secondColumnMask);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(0);
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
