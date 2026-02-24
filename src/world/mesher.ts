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

const usesTerrainAutotile = (tileId: number): boolean => hasTerrainAutotileMetadata(tileId);

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

  const floats: number[] = [];

  for (let y = 0; y < CHUNK_SIZE; y += 1) {
    for (let x = 0; x < CHUNK_SIZE; x += 1) {
      const tileId = chunk.tiles[toTileIndex(x, y)];
      if (tileId === 0) continue;

      const px = chunkOriginX + x * TILE_SIZE;
      const py = chunkOriginY + y * TILE_SIZE;
      const { u0, v0, u1, v1 } = resolveChunkTileUvRect(chunk, x, y, tileId, sampleNeighborhood);

      floats.push(
        px,
        py,
        u0,
        v0,
        px + TILE_SIZE,
        py,
        u1,
        v0,
        px + TILE_SIZE,
        py + TILE_SIZE,
        u1,
        v1,
        px,
        py,
        u0,
        v0,
        px + TILE_SIZE,
        py + TILE_SIZE,
        u1,
        v1,
        px,
        py + TILE_SIZE,
        u0,
        v1
      );
    }
  }

  const vertices = new Float32Array(floats);
  return { vertices, vertexCount: vertices.length / 4 };
};
