import { describe, expect, it } from 'vitest';

import { AUTOTILE_DIRECTION_BITS, normalizeAutotileAdjacencyMask } from './autotile';
import { toTileIndex, worldToChunkCoord, worldToLocalTile } from './chunkMath';
import { CHUNK_SIZE, TILE_SIZE } from './constants';
import {
  CHUNK_MESH_FLOATS_PER_VERTEX,
  buildChunkMesh,
  insetTileUvRectForAtlasSampling
} from './mesher';
import {
  LIQUID_RENDER_CARDINAL_MASK_COUNT,
  atlasIndexToUvRect,
  parseTileMetadataRegistry,
  resolveTileRenderUvRect,
  resolveTerrainAutotileUvRectByNormalizedAdjacencyMask
} from './tileMetadata';
import type { Chunk } from './types';
import { TileWorld } from './world';
import type { TileNeighborhood } from './world';

const createEmptyChunk = (chunkX = 0, chunkY = 0): Chunk => ({
  coord: { x: chunkX, y: chunkY },
  tiles: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
  liquidLevels: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
  lightLevels: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
  lightDirty: true,
  lightDirtyColumnMask: 0xffffffff >>> 0
});

const setChunkTile = (chunk: Chunk, localX: number, localY: number, tileId: number): void => {
  chunk.tiles[toTileIndex(localX, localY)] = tileId;
};

const setChunkLiquidLevel = (chunk: Chunk, localX: number, localY: number, liquidLevel: number): void => {
  chunk.liquidLevels[toTileIndex(localX, localY)] = liquidLevel;
};

const setChunkLiquidTile = (
  chunk: Chunk,
  localX: number,
  localY: number,
  tileId: number,
  liquidLevel: number
): void => {
  setChunkTile(chunk, localX, localY, tileId);
  setChunkLiquidLevel(chunk, localX, localY, liquidLevel);
};

const atlasUvRect = (atlasTileIndex: number) => atlasIndexToUvRect(atlasTileIndex);
const sampleUvRect = (uvRect: { u0: number; v0: number; u1: number; v1: number }) =>
  insetTileUvRectForAtlasSampling(uvRect);
const toFloat32 = (value: number): number => Math.fround(value);
const FLOATS_PER_TILE_QUAD = 6 * CHUNK_MESH_FLOATS_PER_VERTEX;

const createDistinctLiquidVariantMap = () =>
  Array.from({ length: LIQUID_RENDER_CARDINAL_MASK_COUNT }, (_, index) => ({
    atlasIndex: index
  }));

const createAnimatedLiquidVariantMap = (staticAtlasIndex: number, animatedAtlasIndex: number) =>
  Array.from({ length: LIQUID_RENDER_CARDINAL_MASK_COUNT }, () => ({
    atlasIndex: staticAtlasIndex,
    frames: [{ atlasIndex: staticAtlasIndex }, { atlasIndex: animatedAtlasIndex }],
    frameDurationMs: 120
  }));

const createLiquidTestRegistry = () =>
  parseTileMetadataRegistry({
    tiles: [
      {
        id: 0,
        name: 'empty',
        gameplay: { solid: false, blocksLight: false }
      },
      {
        id: 12,
        name: 'water_a',
        gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
        liquidRender: {
          connectivityGroup: 'water',
          variantRenderByCardinalMask: createDistinctLiquidVariantMap()
        }
      },
      {
        id: 20,
        name: 'water_b',
        gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
        liquidRender: {
          connectivityGroup: 'water',
          variantRenderByCardinalMask: createDistinctLiquidVariantMap()
        }
      },
      {
        id: 25,
        name: 'lava',
        gameplay: { solid: false, blocksLight: true, liquidKind: 'lava' },
        liquidRender: {
          connectivityGroup: 'lava',
          variantRenderByCardinalMask: createDistinctLiquidVariantMap()
        }
      }
    ]
  });

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
  const { u0, v0, u1, v1 } = sampleUvRect(uvRect);
  const expectedU0 = toFloat32(u0);
  const expectedV0 = toFloat32(v0);
  const expectedU1 = toFloat32(u1);
  const expectedV1 = toFloat32(v1);
  const expectedUvs: Array<{ u: number; v: number }> = [
    { u: expectedU0, v: expectedV0 },
    { u: expectedU1, v: expectedV0 },
    { u: expectedU1, v: expectedV1 },
    { u: expectedU0, v: expectedV0 },
    { u: expectedU1, v: expectedV1 },
    { u: expectedU0, v: expectedV1 }
  ];

  expect(vertices.length).toBe(6 * CHUNK_MESH_FLOATS_PER_VERTEX);
  expectedUvs.forEach((expectedUv, vertexIndex) => {
    const uvOffset = vertexIndex * CHUNK_MESH_FLOATS_PER_VERTEX + 2;
    expect(vertices[uvOffset]).toBe(expectedUv.u);
    expect(vertices[uvOffset + 1]).toBe(expectedUv.v);
  });
};

const expectSingleQuadLightLevel = (vertices: Float32Array, expectedLightLevel: number): void => {
  expect(vertices.length).toBe(6 * CHUNK_MESH_FLOATS_PER_VERTEX);
  for (let vertexIndex = 0; vertexIndex < 6; vertexIndex += 1) {
    const lightOffset = vertexIndex * CHUNK_MESH_FLOATS_PER_VERTEX + 4;
    expect(vertices[lightOffset]).toBe(expectedLightLevel);
  }
};

const expectSingleQuadGeometry = (
  vertices: Float32Array,
  expected: {
    leftX: number;
    rightX: number;
    topLeftY: number;
    topRightY: number;
    bottomY: number;
  }
): void => {
  expect(vertices.length).toBe(FLOATS_PER_TILE_QUAD);
  const expectedPositions = [
    { x: expected.leftX, y: expected.topLeftY },
    { x: expected.rightX, y: expected.topRightY },
    { x: expected.rightX, y: expected.bottomY },
    { x: expected.leftX, y: expected.topLeftY },
    { x: expected.rightX, y: expected.bottomY },
    { x: expected.leftX, y: expected.bottomY }
  ];

  expectedPositions.forEach((expectedPosition, vertexIndex) => {
    const positionOffset = vertexIndex * CHUNK_MESH_FLOATS_PER_VERTEX;
    expect(vertices[positionOffset]).toBe(toFloat32(expectedPosition.x));
    expect(vertices[positionOffset + 1]).toBe(toFloat32(expectedPosition.y));
  });
};

const expectSingleQuadLiquidUv = (
  vertices: Float32Array,
  uvRect: { u0: number; v0: number; u1: number; v1: number },
  topHeights: { topLeft: number; topRight: number }
): void => {
  const { u0, v0, u1, v1 } = sampleUvRect(uvRect);
  const bottomLeftV = v0 + (v1 - v0) * topHeights.topLeft;
  const bottomRightV = v0 + (v1 - v0) * topHeights.topRight;
  const expectedUvs: Array<{ u: number; v: number }> = [
    { u: toFloat32(u0), v: toFloat32(v0) },
    { u: toFloat32(u1), v: toFloat32(v0) },
    { u: toFloat32(u1), v: toFloat32(bottomRightV) },
    { u: toFloat32(u0), v: toFloat32(v0) },
    { u: toFloat32(u1), v: toFloat32(bottomRightV) },
    { u: toFloat32(u0), v: toFloat32(bottomLeftV) }
  ];

  expect(vertices.length).toBe(6 * CHUNK_MESH_FLOATS_PER_VERTEX);
  expectedUvs.forEach((expectedUv, vertexIndex) => {
    const uvOffset = vertexIndex * CHUNK_MESH_FLOATS_PER_VERTEX + 2;
    expect(vertices[uvOffset]).toBe(expectedUv.u);
    expect(vertices[uvOffset + 1]).toBe(expectedUv.v);
  });
};

const getQuadVertices = (vertices: Float32Array, quadIndex: number): Float32Array =>
  vertices.slice(quadIndex * FLOATS_PER_TILE_QUAD, (quadIndex + 1) * FLOATS_PER_TILE_QUAD);

const setWorldLiquidTile = (
  world: TileWorld,
  worldTileX: number,
  worldTileY: number,
  tileId: number,
  liquidLevel: number
): void => {
  const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
  const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
  const chunk = world.ensureChunk(chunkX, chunkY);
  setChunkLiquidTile(chunk, localX, localY, tileId, liquidLevel);
};

const buildWorldLiquidChunkMesh = (
  world: TileWorld,
  chunkX: number,
  chunkY: number,
  registry = createLiquidTestRegistry()
) =>
  buildChunkMesh(world.ensureChunk(chunkX, chunkY), {
    tileMetadataRegistry: registry,
    sampleNeighborhoodInto: (sampleChunkX, sampleChunkY, sampleLocalX, sampleLocalY, target) => {
      world.sampleLocalTileNeighborhoodInto(sampleChunkX, sampleChunkY, sampleLocalX, sampleLocalY, target);
    },
    sampleLiquidLevel: (worldTileX, worldTileY) => world.getLiquidLevel(worldTileX, worldTileY)
  });

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

  it('uses a static render override for terrain-connected tiles that define their own placeholder art', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 1,
          name: 'stone',
          materialTags: ['terrain', 'solid'],
          gameplay: { solid: true, blocksLight: true },
          terrainAutotile: {
            connectivityGroup: 'ground',
            placeholderVariantAtlasByCardinalMask: Array.from({ length: 16 }, (_, index) => index)
          }
        },
        {
          id: 30,
          name: 'copper_ore',
          materialTags: ['terrain', 'solid', 'ore'],
          gameplay: { solid: true, blocksLight: true },
          render: { atlasIndex: 20 },
          terrainAutotile: {
            connectivityGroup: 'ground',
            placeholderVariantAtlasByCardinalMask: Array.from({ length: 16 }, (_, index) => index)
          }
        }
      ]
    });
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 30);

    const mesh = buildChunkMesh(chunk, {
      tileMetadataRegistry: registry,
      sampleNeighborhood: () => ({
        center: 30,
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
    expectSingleQuadUvRect(mesh.vertices, 20);
  });

  it('uses chunk-edge neighborhood sampling to resolve UVs across adjacent chunks', () => {
    const chunkX = 0;
    const chunkY = -10;
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
      const expectedUvRect = resolveTerrainAutotileUvRectByNormalizedAdjacencyMask(1, normalizedMask);

      expect(mesh.vertexCount, `raw mask ${rawMask}`).toBe(6);
      expect(expectedUvRect, `raw mask ${rawMask} expected uv`).toEqual(atlasUvRect(expectedVariant));
      expectSingleQuadUv(mesh.vertices, expectedUvRect!);
    }
  });

  it('uses metadata atlasIndex for non-autotile tiles', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 3);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 14);
  });

  it('uses dedicated atlas-backed renders for small-tree sapling, trunk, and leaf tiles', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 16);
    setChunkTile(chunk, 1, 0, 17);
    setChunkTile(chunk, 2, 0, 18);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(18);
    expectSingleQuadUvRect(getQuadVertices(mesh.vertices, 0), 23);
    expectSingleQuadUvRect(getQuadVertices(mesh.vertices, 1), 24);
    expectSingleQuadUvRect(getQuadVertices(mesh.vertices, 2), 25);
  });

  it('insets atlas UV sampling by half a texel so neighboring atlas regions cannot bleed in', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 3);

    const mesh = buildChunkMesh(chunk);
    const rawUvRect = atlasUvRect(14);
    const sampledUvRect = sampleUvRect(rawUvRect);

    expect(sampledUvRect).toEqual({
      u0: rawUvRect.u0 + 0.5 / 128,
      v0: rawUvRect.v0 + 0.5 / 64,
      u1: rawUvRect.u1 - 0.5 / 128,
      v1: rawUvRect.v1 - 0.5 / 64
    });
    expect(Array.from(mesh.vertices.slice(2, 4))).toEqual([
      toFloat32(sampledUvRect.u0),
      toFloat32(sampledUvRect.v0)
    ]);
    expect(Array.from(mesh.vertices.slice(27, 29))).toEqual([
      toFloat32(sampledUvRect.u0),
      toFloat32(sampledUvRect.v1)
    ]);
  });

  it('uses metadata uvRect for non-autotile tiles', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 4);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUv(mesh.vertices, resolveTileRenderUvRect(4)!);
  });

  it('bakes per-tile light levels into each vertex of the emitted quad', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 3);
    chunk.lightLevels[toTileIndex(0, 0)] = 11;

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadLightLevel(mesh.vertices, 11);
  });

  it('records animated non-terrain quads while keeping the baked static frame-zero UVs', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 5);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 14);
    expect(mesh.animatedTileQuads).toEqual([
      {
        tileId: 5,
        vertexFloatOffset: 0
      }
    ]);
  });

  it('resolves liquid tile UVs from sampled liquid cardinal masks', () => {
    const registry = createLiquidTestRegistry();
    const chunk = createEmptyChunk();
    setChunkLiquidTile(chunk, 0, 0, 12, 8);

    const mesh = buildChunkMesh(chunk, {
      tileMetadataRegistry: registry,
      sampleNeighborhood: () => ({
        center: 12,
        north: 12,
        northEast: 12,
        east: 12,
        southEast: 12,
        south: 0,
        southWest: 12,
        west: 0,
        northWest: 12
      })
    });

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 3);
    expect(mesh.animatedTileQuads).toEqual([]);
  });

  it('treats related liquid tile ids as connected when metadata groups match', () => {
    const registry = createLiquidTestRegistry();
    const chunk = createEmptyChunk();
    setChunkLiquidTile(chunk, 0, 0, 12, 8);

    const mesh = buildChunkMesh(chunk, {
      tileMetadataRegistry: registry,
      sampleNeighborhood: () => ({
        center: 12,
        north: 20,
        northEast: 25,
        east: 0,
        southEast: 0,
        south: 0,
        southWest: 0,
        west: 20,
        northWest: 25
      })
    });

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 9);
    expect(mesh.animatedTileQuads).toEqual([]);
  });

  it('packs multiple tile quads contiguously into a tightly sized Float32Array', () => {
    const chunk = createEmptyChunk();
    setChunkTile(chunk, 0, 0, 3);
    setChunkTile(chunk, 1, 0, 4);

    const mesh = buildChunkMesh(chunk);

    expect(mesh.vertexCount).toBe(12);
    expect(mesh.vertices.length).toBe(12 * CHUNK_MESH_FLOATS_PER_VERTEX);

    expect(mesh.vertices[0]).toBe(0);
    expect(mesh.vertices[1]).toBe(0);
    expect(mesh.vertices[30]).toBe(TILE_SIZE);
    expect(mesh.vertices[31]).toBe(0);
  });

  it('uses the isolated liquid variant when no neighborhood sampler is provided', () => {
    const registry = createLiquidTestRegistry();
    const chunk = createEmptyChunk();
    setChunkLiquidTile(chunk, 0, 0, 12, 4);

    const mesh = buildChunkMesh(chunk, {
      tileMetadataRegistry: registry
    });

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadLiquidUv(mesh.vertices, atlasUvRect(0), {
      topLeft: 0.5,
      topRight: 0.5
    });
  });

  it('uses the center fill height for exposed partial liquid without same-kind neighbors', () => {
    const registry = createLiquidTestRegistry();
    const chunk = createEmptyChunk(2, -10);
    setChunkLiquidTile(chunk, 0, 0, 12, 4);

    const mesh = buildChunkMesh(chunk, {
      tileMetadataRegistry: registry
    });
    const tileOriginX = chunk.coord.x * CHUNK_SIZE * TILE_SIZE;
    const tileOriginY = chunk.coord.y * CHUNK_SIZE * TILE_SIZE;

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadGeometry(mesh.vertices, {
      leftX: tileOriginX,
      rightX: tileOriginX + TILE_SIZE,
      topLeftY: tileOriginY + TILE_SIZE * 0.5,
      topRightY: tileOriginY + TILE_SIZE * 0.5,
      bottomY: tileOriginY + TILE_SIZE
    });
    expectSingleQuadLiquidUv(mesh.vertices, atlasUvRect(0), {
      topLeft: 0.5,
      topRight: 0.5
    });
  });

  it('slopes exposed partial liquid corners halfway toward same-kind side neighbors', () => {
    const registry = createLiquidTestRegistry();
    const world = new TileWorld(-1);
    const chunkX = 0;
    const chunkY = -10;
    const worldTileY = chunkY * CHUNK_SIZE;
    setWorldLiquidTile(world, chunkX * CHUNK_SIZE + 0, worldTileY, 12, 8);
    setWorldLiquidTile(world, chunkX * CHUNK_SIZE + 1, worldTileY, 12, 4);
    setWorldLiquidTile(world, chunkX * CHUNK_SIZE + 2, worldTileY, 20, 2);

    const mesh = buildWorldLiquidChunkMesh(world, chunkX, chunkY, registry);
    const centerQuadVertices = getQuadVertices(mesh.vertices, 1);
    const tileOriginX = chunkX * CHUNK_SIZE * TILE_SIZE + TILE_SIZE;
    const tileOriginY = chunkY * CHUNK_SIZE * TILE_SIZE;

    expect(mesh.vertexCount).toBe(18);
    expectSingleQuadGeometry(centerQuadVertices, {
      leftX: tileOriginX,
      rightX: tileOriginX + TILE_SIZE,
      topLeftY: tileOriginY + TILE_SIZE * 0.25,
      topRightY: tileOriginY + TILE_SIZE * 0.625,
      bottomY: tileOriginY + TILE_SIZE
    });
    expectSingleQuadLiquidUv(centerQuadVertices, atlasUvRect(10), {
      topLeft: 0.75,
      topRight: 0.375
    });
  });

  it('keeps covered liquid tiles full-height even when the center fill is partial', () => {
    const registry = createLiquidTestRegistry();
    const world = new TileWorld(-1);
    const chunkX = 0;
    const chunkY = -10;
    const worldTileX = chunkX * CHUNK_SIZE;
    const worldTileY = chunkY * CHUNK_SIZE;
    setWorldLiquidTile(world, worldTileX, worldTileY, 12, 2);
    setWorldLiquidTile(world, worldTileX, worldTileY + 1, 12, 3);

    const mesh = buildWorldLiquidChunkMesh(world, chunkX, chunkY, registry);
    const centerQuadVertices = getQuadVertices(mesh.vertices, 1);
    const tileOriginX = chunkX * CHUNK_SIZE * TILE_SIZE;
    const tileOriginY = chunkY * CHUNK_SIZE * TILE_SIZE + TILE_SIZE;

    expect(mesh.vertexCount).toBe(12);
    expectSingleQuadGeometry(centerQuadVertices, {
      leftX: tileOriginX,
      rightX: tileOriginX + TILE_SIZE,
      topLeftY: tileOriginY,
      topRightY: tileOriginY,
      bottomY: tileOriginY + TILE_SIZE
    });
  });

  it('resolves partial-liquid corner slopes across chunk boundaries through the world liquid sampler', () => {
    const registry = createLiquidTestRegistry();
    const world = new TileWorld(-1);
    const chunkX = 0;
    const chunkY = -10;
    const localX = CHUNK_SIZE - 1;
    const localY = 0;
    const worldTileX = chunkX * CHUNK_SIZE + localX;
    const worldTileY = chunkY * CHUNK_SIZE + localY;
    setWorldLiquidTile(world, worldTileX, worldTileY, 12, 4);
    setWorldLiquidTile(world, worldTileX + 1, worldTileY, 20, 8);

    const mesh = buildWorldLiquidChunkMesh(world, chunkX, chunkY, registry);
    const tileOriginX = chunkX * CHUNK_SIZE * TILE_SIZE + localX * TILE_SIZE;
    const tileOriginY = chunkY * CHUNK_SIZE * TILE_SIZE + localY * TILE_SIZE;

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadGeometry(mesh.vertices, {
      leftX: tileOriginX,
      rightX: tileOriginX + TILE_SIZE,
      topLeftY: tileOriginY + TILE_SIZE * 0.5,
      topRightY: tileOriginY + TILE_SIZE * 0.25,
      bottomY: tileOriginY + TILE_SIZE
    });
  });

  it('records animated liquid quads with the resolved liquid cardinal mask while keeping frame-zero UVs baked', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 12,
          name: 'water',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: createAnimatedLiquidVariantMap(14, 15)
          }
        }
      ]
    });
    const chunk = createEmptyChunk();
    setChunkLiquidTile(chunk, 0, 0, 12, 8);

    const mesh = buildChunkMesh(chunk, {
      tileMetadataRegistry: registry,
      sampleNeighborhood: () => ({
        center: 12,
        north: 12,
        northEast: 0,
        east: 12,
        southEast: 0,
        south: 0,
        southWest: 0,
        west: 0,
        northWest: 0
      })
    });

    expect(mesh.vertexCount).toBe(6);
    expectSingleQuadUvRect(mesh.vertices, 14);
    expect(mesh.animatedTileQuads).toEqual([
      {
        tileId: 12,
        vertexFloatOffset: 0,
        liquidCardinalMask: 3,
        liquidTopHeights: {
          topLeft: 1,
          topRight: 1
        }
      }
    ]);
  });

  it('uses chunk-edge neighborhood sampling to resolve liquid UVs across adjacent chunks', () => {
    const registry = createLiquidTestRegistry();
    const chunkX = 0;
    const chunkY = -10;
    const localX = CHUNK_SIZE - 1;
    const localY = CHUNK_SIZE - 1;
    const world = new TileWorld(0);
    const worldTileX = chunkX * CHUNK_SIZE + localX;
    const worldTileY = chunkY * CHUNK_SIZE + localY;

    setWorldLiquidTile(world, worldTileX, worldTileY, 12, 8);
    setWorldLiquidTile(world, worldTileX + 1, worldTileY, 20, 8);
    setWorldLiquidTile(world, worldTileX, worldTileY + 1, 12, 8);
    setWorldLiquidTile(world, worldTileX + 1, worldTileY + 1, 25, 8);

    const chunk = world.ensureChunk(chunkX, chunkY);
    const scratchRefs: object[] = [];
    const mesh = buildChunkMesh(chunk, {
      tileMetadataRegistry: registry,
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
