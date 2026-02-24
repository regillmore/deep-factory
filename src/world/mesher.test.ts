import { describe, expect, it } from 'vitest';

import { toTileIndex } from './chunkMath';
import { TILE_ATLAS_COLUMNS, TILE_ATLAS_ROWS, CHUNK_SIZE } from './constants';
import { buildChunkMesh } from './mesher';
import type { Chunk } from './types';
import { TileWorld } from './world';

const createEmptyChunk = (chunkX = 0, chunkY = 0): Chunk => ({
  coord: { x: chunkX, y: chunkY },
  tiles: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE)
});

const setChunkTile = (chunk: Chunk, localX: number, localY: number, tileId: number): void => {
  chunk.tiles[toTileIndex(localX, localY)] = tileId;
};

const atlasUvRect = (atlasTileIndex: number) => {
  const col = atlasTileIndex % TILE_ATLAS_COLUMNS;
  const row = Math.floor(atlasTileIndex / TILE_ATLAS_COLUMNS);
  return {
    u0: col / TILE_ATLAS_COLUMNS,
    v0: row / TILE_ATLAS_ROWS,
    u1: (col + 1) / TILE_ATLAS_COLUMNS,
    v1: (row + 1) / TILE_ATLAS_ROWS
  };
};

const expectSingleQuadUvRect = (vertices: Float32Array, atlasTileIndex: number): void => {
  const { u0, v0, u1, v1 } = atlasUvRect(atlasTileIndex);
  expectSingleQuadUv(vertices, { u0, v0, u1, v1 });
};

const expectSingleQuadUv = (
  vertices: Float32Array,
  uvRect: { u0: number; v0: number; u1: number; v1: number }
): void => {
  const { u0, v0, u1, v1 } = uvRect;

  expect(Array.from(vertices)).toEqual([
    expect.any(Number),
    expect.any(Number),
    u0,
    v0,
    expect.any(Number),
    expect.any(Number),
    u1,
    v0,
    expect.any(Number),
    expect.any(Number),
    u1,
    v1,
    expect.any(Number),
    expect.any(Number),
    u0,
    v0,
    expect.any(Number),
    expect.any(Number),
    u1,
    v1,
    expect.any(Number),
    expect.any(Number),
    u0,
    v1
  ]);
};

describe('buildChunkMesh autotile UV selection', () => {
  it('resolves terrain tile UVs from sampled neighborhood masks', () => {
    const chunk = createEmptyChunk(2, 3);
    const localX = 4;
    const localY = 5;
    setChunkTile(chunk, localX, localY, 1);

    const sampledCalls: Array<[number, number, number, number]> = [];
    const mesh = buildChunkMesh(chunk, {
      sampleNeighborhood: (chunkX, chunkY, sampledLocalX, sampledLocalY) => {
        sampledCalls.push([chunkX, chunkY, sampledLocalX, sampledLocalY]);
        return {
          center: 1,
          north: 1,
          northEast: 1,
          east: 1,
          southEast: 0,
          south: 0,
          southWest: 0,
          west: 0,
          northWest: 0
        };
      }
    });

    expect(sampledCalls).toEqual([[2, 3, localX, localY]]);
    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 3);
  });

  it('uses chunk-edge neighborhood sampling to resolve UVs across adjacent chunks', () => {
    const chunkX = 0;
    const chunkY = 10;
    const localX = CHUNK_SIZE - 1;
    const localY = CHUNK_SIZE - 1;
    const tileId = 2;
    const world = new TileWorld(0);

    const worldTileX = chunkX * CHUNK_SIZE + localX;
    const worldTileY = chunkY * CHUNK_SIZE + localY;

    world.setTile(worldTileX, worldTileY, tileId);
    world.setTile(worldTileX + 1, worldTileY, tileId);
    world.setTile(worldTileX, worldTileY + 1, tileId);
    world.setTile(worldTileX + 1, worldTileY + 1, tileId);

    const chunk = world.ensureChunk(chunkX, chunkY);
    const mesh = buildChunkMesh(chunk, {
      sampleNeighborhood: (sampleChunkX, sampleChunkY, sampleLocalX, sampleLocalY) =>
        world.sampleLocalTileNeighborhood(sampleChunkX, sampleChunkY, sampleLocalX, sampleLocalY)
    });

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 6);
  });

  it('uses metadata atlasIndex for non-autotile tiles', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 3);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 14);
  });

  it('uses metadata uvRect for non-autotile tiles', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 4);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUv(mesh.vertices, { u0: 0.25, v0: 0.25, u1: 0.5, v1: 0.5 });
  });

  it('throws for non-empty tiles without render metadata instead of using raw tile id fallback', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 99);

    expect(() => buildChunkMesh(chunk)).toThrowError(/Missing tile render metadata for tile 99/);
  });
});
