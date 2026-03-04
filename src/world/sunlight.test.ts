import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import { recomputeSunlightFromExposedChunkTops } from './sunlight';
import { TileWorld } from './world';

const localLightColumnBit = (localX: number): number => (1 << localX) >>> 0;

describe('recomputeSunlightFromExposedChunkTops', () => {
  it('propagates sunlight downward from exposed chunk tops until light-blocking tiles', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -1);

    world.setTile(0, -32, 0);
    world.setTile(0, -31, 0);
    world.setTile(0, -30, 1);
    world.setTile(0, -29, 0);
    world.setTile(0, 0, 0);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(2);
    expect(world.getLightLevel(0, -32)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -31)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -30)).toBe(0);
    expect(world.getLightLevel(0, -29)).toBe(0);
    expect(world.getLightLevel(0, 0)).toBe(0);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('keeps lower chunks unlit when a loaded chunk above blocks sunlight', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -2);
    world.ensureChunk(0, -1);

    world.setTile(0, -34, 0);
    world.setTile(0, -33, 1);
    world.setTile(0, -32, 0);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(3);
    expect(world.getLightLevel(0, -34)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -33)).toBe(0);
    expect(world.getLightLevel(0, -32)).toBe(0);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('recomputes only chunk columns that contain dirty resident light chunks', () => {
    const world = new TileWorld(1);

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    world.invalidateChunkLight(1, 0);

    expect(world.getLightLevel(CHUNK_SIZE, -32)).toBe(7);
    expect(world.getLightLevel(0, -32)).toBe(7);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(3);
    expect(world.getLightLevel(CHUNK_SIZE, -32)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -32)).toBe(7);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('returns early when no resident chunks are dirty', () => {
    const world = new TileWorld(0);

    for (const coord of world.getDirtyLightChunkCoords()) {
      world.markChunkLightClean(coord.x, coord.y);
    }

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(0);
  });

  it('recomputes only dirty local sunlight columns within a dirty resident chunk column', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -1);

    world.setTile(0, -32, 0);
    world.setTile(1, -32, 0);

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    world.invalidateChunkLightColumns(0, 0, localLightColumnBit(0));

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(2);
    expect(world.getLightLevel(0, -32)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(1, -32)).toBe(7);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('keeps neighboring chunkX columns clean for edge lighting edits until horizontal sunlight transport exists', () => {
    const world = new TileWorld(1);

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    expect(world.setTile(CHUNK_SIZE - 1, 0, 0)).toBe(true);

    expect(world.getDirtyLightChunkCoords()).toEqual(
      expect.arrayContaining([
        { x: 0, y: -1 },
        { x: 0, y: 0 }
      ])
    );
    expect(world.getDirtyLightChunkCoords()).toHaveLength(2);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(3);
    expect(world.getLightLevel(CHUNK_SIZE, -32)).toBe(7);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });
});
