import { describe, expect, it } from 'vitest';

import { AUTOTILE_DIRECTION_BITS, normalizeAutotileAdjacencyMask } from './autotile';
import { toTileIndex } from './chunkMath';
import { TILE_ATLAS_COLUMNS, TILE_ATLAS_ROWS, CHUNK_SIZE, TILE_SIZE } from './constants';
import { buildChunkMesh } from './mesher';
import type { Chunk } from './types';
import { TileWorld } from './world';
import type { TileNeighborhood } from './world';

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

const resolveTerrainAutotileVariantIndexBitwiseBaseline = (normalizedMask: number): number => {
  let cardinalMask = 0;
  const mask = normalizedMask & 0xff;

  if (mask & AUTOTILE_DIRECTION_BITS.north) cardinalMask |= 1 << 0;
  if (mask & AUTOTILE_DIRECTION_BITS.east) cardinalMask |= 1 << 1;
  if (mask & AUTOTILE_DIRECTION_BITS.south) cardinalMask |= 1 << 2;
  if (mask & AUTOTILE_DIRECTION_BITS.west) cardinalMask |= 1 << 3;

  return cardinalMask;
};

const createTerrainNeighborhoodFromMask = (rawMask: number, centerTileId = 1): TileNeighborhood => {
  const connectedTile = (bit: number): number => ((rawMask & bit) !== 0 ? centerTileId : 0);

  return {
    center: centerTileId,
    north: connectedTile(AUTOTILE_DIRECTION_BITS.north),
    northEast: connectedTile(AUTOTILE_DIRECTION_BITS.northEast),
    east: connectedTile(AUTOTILE_DIRECTION_BITS.east),
    southEast: connectedTile(AUTOTILE_DIRECTION_BITS.southEast),
    south: connectedTile(AUTOTILE_DIRECTION_BITS.south),
    southWest: connectedTile(AUTOTILE_DIRECTION_BITS.southWest),
    west: connectedTile(AUTOTILE_DIRECTION_BITS.west),
    northWest: connectedTile(AUTOTILE_DIRECTION_BITS.northWest)
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

  it('treats related terrain tile ids as connected when metadata groups match', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 2);

    const mesh = buildChunkMesh(chunk, {
      sampleNeighborhood: () => ({
        center: 2,
        north: 1,
        northEast: 1,
        east: 1,
        southEast: 0,
        south: 0,
        southWest: 0,
        west: 0,
        northWest: 0
      })
    });

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
    const scratchRefs: object[] = [];
    const mesh = buildChunkMesh(chunk, {
      sampleNeighborhoodInto: (sampleChunkX, sampleChunkY, sampleLocalX, sampleLocalY, target) => {
        scratchRefs.push(target);
        world.sampleLocalTileNeighborhoodInto(
          sampleChunkX,
          sampleChunkY,
          sampleLocalX,
          sampleLocalY,
          target
        );
      }
    });

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 6);
    expect(scratchRefs).toHaveLength(1);
  });

  it('matches legacy bitwise placeholder variant UV selection across all raw adjacency masks', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 1);

    for (let rawMask = 0; rawMask < 256; rawMask += 1) {
      const mesh = buildChunkMesh(chunk, {
        sampleNeighborhood: () => createTerrainNeighborhoodFromMask(rawMask, 1)
      });

      const normalizedMask = normalizeAutotileAdjacencyMask(rawMask);
      const expectedVariant = resolveTerrainAutotileVariantIndexBitwiseBaseline(normalizedMask);

      expect(mesh.vertexCount, `raw mask ${rawMask}`).toBe(6);
      expectSingleQuadUvRect(mesh.vertices, expectedVariant);
    }
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

  it('packs multiple tile quads contiguously into a tightly sized Float32Array', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 3);
    setChunkTile(chunk, 1, 0, 4);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(12);
    expect(mesh.vertices.length).toBe(12 * 4);

    expect(mesh.vertices[0]).toBe(0);
    expect(mesh.vertices[1]).toBe(0);
    expect(mesh.vertices[24]).toBe(TILE_SIZE);
    expect(mesh.vertices[25]).toBe(0);
  });

  it('reuses one neighborhood scratch object across terrain tiles with sampleNeighborhoodInto', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 1);
    setChunkTile(chunk, 1, 0, 1);

    const scratchRefs: object[] = [];
    const mesh = buildChunkMesh(chunk, {
      sampleNeighborhoodInto: (_chunkX, _chunkY, localX, localY, target) => {
        scratchRefs.push(target);
        target.center = chunk.tiles[toTileIndex(localX, localY)];
        target.north = 0;
        target.northEast = 0;
        target.east = 0;
        target.southEast = 0;
        target.south = 0;
        target.southWest = 0;
        target.west = 0;
        target.northWest = 0;
      }
    });

    expect(mesh.vertexCount).toBe(12);
    expect(scratchRefs).toHaveLength(2);
    expect(scratchRefs[0]).toBe(scratchRefs[1]);
  });

  it('throws for non-empty tiles without render metadata instead of using raw tile id fallback', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 99);

    expect(() => buildChunkMesh(chunk)).toThrowError(/Missing tile render metadata for tile 99/);
  });
});
