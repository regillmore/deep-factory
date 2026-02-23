import { CHUNK_SIZE } from './constants';

export interface ChunkBounds {
  minChunkX: number;
  minChunkY: number;
  maxChunkX: number;
  maxChunkY: number;
}

export const chunkKey = (x: number, y: number): string => `${x},${y}`;

export const toTileIndex = (x: number, y: number): number => y * CHUNK_SIZE + x;

export const worldToChunkCoord = (tileX: number, tileY: number): { chunkX: number; chunkY: number } => ({
  chunkX: Math.floor(tileX / CHUNK_SIZE),
  chunkY: Math.floor(tileY / CHUNK_SIZE)
});

export const worldToLocalTile = (tileX: number, tileY: number): { localX: number; localY: number } => ({
  localX: ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
  localY: ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
});

export const chunkCoordBounds = (
  minTileX: number,
  minTileY: number,
  maxTileX: number,
  maxTileY: number
): ChunkBounds => {
  const { chunkX: minChunkX, chunkY: minChunkY } = worldToChunkCoord(minTileX, minTileY);
  const { chunkX: maxChunkX, chunkY: maxChunkY } = worldToChunkCoord(maxTileX, maxTileY);
  return { minChunkX, minChunkY, maxChunkX, maxChunkY };
};

export const expandChunkBounds = (bounds: ChunkBounds, paddingChunks: number): ChunkBounds => ({
  minChunkX: bounds.minChunkX - paddingChunks,
  minChunkY: bounds.minChunkY - paddingChunks,
  maxChunkX: bounds.maxChunkX + paddingChunks,
  maxChunkY: bounds.maxChunkY + paddingChunks
});

export const chunkBoundsContains = (bounds: ChunkBounds, chunkX: number, chunkY: number): boolean =>
  chunkX >= bounds.minChunkX &&
  chunkX <= bounds.maxChunkX &&
  chunkY >= bounds.minChunkY &&
  chunkY <= bounds.maxChunkY;
