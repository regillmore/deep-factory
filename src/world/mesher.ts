import { TILE_ATLAS_COLUMNS, TILE_ATLAS_ROWS, TILE_SIZE } from './constants';
import { toTileIndex } from './chunkMath';
import type { Chunk } from './types';

export interface ChunkMeshData {
  vertices: Float32Array;
  vertexCount: number;
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

export const buildChunkMesh = (chunk: Chunk): ChunkMeshData => {
  const chunkOriginX = chunk.coord.x * 32 * TILE_SIZE;
  const chunkOriginY = chunk.coord.y * 32 * TILE_SIZE;

  const floats: number[] = [];

  for (let y = 0; y < 32; y += 1) {
    for (let x = 0; x < 32; x += 1) {
      const tileId = chunk.tiles[toTileIndex(x, y)];
      if (tileId === 0) continue;

      const px = chunkOriginX + x * TILE_SIZE;
      const py = chunkOriginY + y * TILE_SIZE;
      const { u0, v0, u1, v1 } = tileUvRect(tileId);

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
