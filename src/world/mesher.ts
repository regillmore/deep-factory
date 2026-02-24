import {
  buildAutotileAdjacencyMask,
  normalizeAutotileAdjacencyMask,
  resolveTerrainAutotileVariantIndex
} from './autotile';
import { CHUNK_SIZE, TILE_SIZE } from './constants';
import { toTileIndex } from './chunkMath';
import {
  areTerrainAutotileNeighborsConnected,
  hasTerrainAutotileMetadata,
  resolveTerrainAutotileVariantUvRect,
  resolveTileRenderUvRect
} from './tileMetadata';
import type { TileUvRect } from './tileMetadata';
import type { Chunk } from './types';
import type { TileNeighborhood } from './world';

export interface ChunkMeshData {
  vertices: Float32Array;
  vertexCount: number;
}

export interface ChunkMeshBuildOptions {
  sampleNeighborhood?: (
    chunkX: number,
    chunkY: number,
    localX: number,
    localY: number
  ) => TileNeighborhood;
}

const FLOATS_PER_VERTEX = 4;
const VERTICES_PER_TILE_QUAD = 6;
const FLOATS_PER_TILE_QUAD = FLOATS_PER_VERTEX * VERTICES_PER_TILE_QUAD;

const usesTerrainAutotile = (tileId: number): boolean => hasTerrainAutotileMetadata(tileId);

const countNonEmptyTiles = (chunk: Chunk): number => {
  let count = 0;
  for (let index = 0; index < chunk.tiles.length; index += 1) {
    if (chunk.tiles[index] !== 0) {
      count += 1;
    }
  }

  return count;
};

const resolveChunkTileUvRect = (
  chunk: Chunk,
  localX: number,
  localY: number,
  tileId: number,
  sampleNeighborhood?: ChunkMeshBuildOptions['sampleNeighborhood']
): TileUvRect => {
  if (usesTerrainAutotile(tileId)) {
    if (!sampleNeighborhood) {
      const isolatedTerrainUvRect = resolveTerrainAutotileVariantUvRect(tileId, 0);
      if (isolatedTerrainUvRect) return isolatedTerrainUvRect;
      throw new Error(`Missing terrain autotile metadata for tile ${tileId}`);
    }

    const neighborhood = sampleNeighborhood(chunk.coord.x, chunk.coord.y, localX, localY);
    const rawMask = buildAutotileAdjacencyMask(neighborhood, (centerTileId, neighborTileId) =>
      areTerrainAutotileNeighborsConnected(centerTileId, neighborTileId)
    );
    const normalizedMask = normalizeAutotileAdjacencyMask(rawMask);
    const cardinalVariantIndex = resolveTerrainAutotileVariantIndex(normalizedMask);
    const terrainUvRect = resolveTerrainAutotileVariantUvRect(tileId, cardinalVariantIndex);
    if (terrainUvRect) return terrainUvRect;
    throw new Error(`Missing terrain autotile variant metadata for tile ${tileId}`);
  }

  const staticUvRect = resolveTileRenderUvRect(tileId);
  if (staticUvRect) return staticUvRect;
  throw new Error(`Missing tile render metadata for tile ${tileId}`);
};

export const buildChunkMesh = (chunk: Chunk, options: ChunkMeshBuildOptions = {}): ChunkMeshData => {
  const chunkOriginX = chunk.coord.x * CHUNK_SIZE * TILE_SIZE;
  const chunkOriginY = chunk.coord.y * CHUNK_SIZE * TILE_SIZE;
  const { sampleNeighborhood } = options;
  const nonEmptyTileCount = countNonEmptyTiles(chunk);
  if (nonEmptyTileCount === 0) {
    return { vertices: new Float32Array(0), vertexCount: 0 };
  }

  const vertices = new Float32Array(nonEmptyTileCount * FLOATS_PER_TILE_QUAD);
  let writeIndex = 0;

  for (let y = 0; y < CHUNK_SIZE; y += 1) {
    for (let x = 0; x < CHUNK_SIZE; x += 1) {
      const tileId = chunk.tiles[toTileIndex(x, y)];
      if (tileId === 0) continue;

      const px = chunkOriginX + x * TILE_SIZE;
      const py = chunkOriginY + y * TILE_SIZE;
      const px1 = px + TILE_SIZE;
      const py1 = py + TILE_SIZE;
      const { u0, v0, u1, v1 } = resolveChunkTileUvRect(chunk, x, y, tileId, sampleNeighborhood);

      vertices[writeIndex] = px;
      vertices[writeIndex + 1] = py;
      vertices[writeIndex + 2] = u0;
      vertices[writeIndex + 3] = v0;
      vertices[writeIndex + 4] = px1;
      vertices[writeIndex + 5] = py;
      vertices[writeIndex + 6] = u1;
      vertices[writeIndex + 7] = v0;
      vertices[writeIndex + 8] = px1;
      vertices[writeIndex + 9] = py1;
      vertices[writeIndex + 10] = u1;
      vertices[writeIndex + 11] = v1;
      vertices[writeIndex + 12] = px;
      vertices[writeIndex + 13] = py;
      vertices[writeIndex + 14] = u0;
      vertices[writeIndex + 15] = v0;
      vertices[writeIndex + 16] = px1;
      vertices[writeIndex + 17] = py1;
      vertices[writeIndex + 18] = u1;
      vertices[writeIndex + 19] = v1;
      vertices[writeIndex + 20] = px;
      vertices[writeIndex + 21] = py1;
      vertices[writeIndex + 22] = u0;
      vertices[writeIndex + 23] = v1;
      writeIndex += FLOATS_PER_TILE_QUAD;
    }
  }

  return { vertices, vertexCount: writeIndex / FLOATS_PER_VERTEX };
};
