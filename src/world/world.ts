import { CHUNK_SIZE } from './constants';
import { chunkBoundsContains, chunkKey, toTileIndex, worldToLocalTile } from './chunkMath';
import type { ChunkBounds } from './chunkMath';
import type { Chunk } from './types';

const solidTileId = 1;

const proceduralTile = (worldX: number, worldY: number): number => {
  const height = Math.floor(Math.sin(worldX * 0.2) * 3) - 2;
  if (worldY > height) return 0;
  if (worldY === height) return 2;
  return solidTileId;
};

export class TileWorld {
  private chunks = new Map<string, Chunk>();

  constructor(radius = 3) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        this.ensureChunk(x, y);
      }
    }
  }

  ensureChunk(chunkX: number, chunkY: number): Chunk {
    const key = chunkKey(chunkX, chunkY);
    const existing = this.chunks.get(key);
    if (existing) return existing;

    const tiles = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        const worldX = chunkX * CHUNK_SIZE + localX;
        const worldY = chunkY * CHUNK_SIZE + localY;
        tiles[toTileIndex(localX, localY)] = proceduralTile(worldX, worldY);
      }
    }

    const chunk: Chunk = { coord: { x: chunkX, y: chunkY }, tiles };
    this.chunks.set(key, chunk);
    return chunk;
  }

  getTile(worldTileX: number, worldTileY: number): number {
    const chunkX = Math.floor(worldTileX / CHUNK_SIZE);
    const chunkY = Math.floor(worldTileY / CHUNK_SIZE);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.tiles[toTileIndex(localX, localY)];
  }

  getChunks(): IterableIterator<Chunk> {
    return this.chunks.values();
  }

  getChunkCount(): number {
    return this.chunks.size;
  }

  pruneChunksOutside(bounds: ChunkBounds): number {
    let removed = 0;
    for (const [key, chunk] of this.chunks) {
      if (chunkBoundsContains(bounds, chunk.coord.x, chunk.coord.y)) continue;
      this.chunks.delete(key);
      removed += 1;
    }
    return removed;
  }
}
