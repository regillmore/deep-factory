import {
  buildAutotileAdjacencyMask,
  normalizeAutotileAdjacencyMask,
  resolveTerrainAutotileVariantIndex
} from './autotile';
import { CHUNK_SIZE, TILE_ATLAS_COLUMNS, TILE_ATLAS_ROWS, TILE_SIZE } from './constants';
import { toTileIndex } from './chunkMath';
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

const tileUvRect = (tileId: number): { u0: number; v0: number; u1: number; v1: number } => {
  const index = tileId % (TILE_ATLAS_COLUMNS * TILE_ATLAS_ROWS);
  const col = index % TILE_ATLAS_COLUMNS;
  const row = Math.floor(index / TILE_ATLAS_COLUMNS);
  const u0 = col / TILE_ATLAS_COLUMNS;
  const v0 = row / TILE_ATLAS_ROWS;
  const u1 = (col + 1) / TILE_ATLAS_COLUMNS;
  const v1 = (row + 1) / TILE_ATLAS_ROWS;
  return { u0, v0, u1, v1 };
};

const usesTerrainAutotile = (tileId: number): boolean => tileId === 1 || tileId === 2;

const resolveChunkTileAtlasIndex = (
  chunk: Chunk,
  localX: number,
  localY: number,
  tileId: number,
  sampleNeighborhood?: ChunkMeshBuildOptions['sampleNeighborhood']
): number => {
  if (!sampleNeighborhood || !usesTerrainAutotile(tileId)) {
    return tileId;
  }

  const neighborhood = sampleNeighborhood(chunk.coord.x, chunk.coord.y, localX, localY);
  const rawMask = buildAutotileAdjacencyMask(neighborhood);
  const normalizedMask = normalizeAutotileAdjacencyMask(rawMask);
  return resolveTerrainAutotileVariantIndex(normalizedMask);
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
      const atlasTileIndex = resolveChunkTileAtlasIndex(chunk, x, y, tileId, sampleNeighborhood);
      const { u0, v0, u1, v1 } = tileUvRect(atlasTileIndex);

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
