import { CHUNK_SIZE } from './constants';
import {
  chunkBoundsContains,
  chunkKey,
  toTileIndex,
  worldToChunkCoord,
  worldToLocalTile
} from './chunkMath';
import type { ChunkBounds } from './chunkMath';
import type { Chunk } from './types';

const solidTileId = 1;

const proceduralTile = (worldX: number, worldY: number): number => {
  const height = Math.floor(Math.sin(worldX * 0.2) * 3) - 2;
  // World +Y points downward, so tiles with smaller Y are above the surface (sky).
  if (worldY < height) return 0;
  if (worldY === height) return 2;
  return solidTileId;
};

export interface TileEditEvent {
  worldTileX: number;
  worldTileY: number;
  chunkX: number;
  chunkY: number;
  localX: number;
  localY: number;
  previousTileId: number;
  tileId: number;
}

export interface TileNeighborhood {
  center: number;
  north: number;
  northEast: number;
  east: number;
  southEast: number;
  south: number;
  southWest: number;
  west: number;
  northWest: number;
}

type TileEditListener = (event: TileEditEvent) => void;

const createTileNeighborhood = (): TileNeighborhood => ({
  center: 0,
  north: 0,
  northEast: 0,
  east: 0,
  southEast: 0,
  south: 0,
  southWest: 0,
  west: 0,
  northWest: 0
});

export class TileWorld {
  private chunks = new Map<string, Chunk>();
  private editedChunkTiles = new Map<string, Map<number, number>>();
  private tileEditListeners = new Set<TileEditListener>();

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

    const editedTiles = this.editedChunkTiles.get(key);
    if (editedTiles) {
      for (const [tileIndex, tileId] of editedTiles) {
        tiles[tileIndex] = tileId;
      }
    }

    const chunk: Chunk = { coord: { x: chunkX, y: chunkY }, tiles };
    this.chunks.set(key, chunk);
    return chunk;
  }

  getTile(worldTileX: number, worldTileY: number): number {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.tiles[toTileIndex(localX, localY)];
  }

  setTile(worldTileX: number, worldTileY: number, tileId: number): boolean {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const key = chunkKey(chunkX, chunkY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const previousTileId = chunk.tiles[tileIndex];
    if (previousTileId === tileId) return false;

    chunk.tiles[tileIndex] = tileId;
    const generatedTileId = proceduralTile(worldTileX, worldTileY);
    if (tileId === generatedTileId) {
      const editedTiles = this.editedChunkTiles.get(key);
      editedTiles?.delete(tileIndex);
      if (editedTiles && editedTiles.size === 0) {
        this.editedChunkTiles.delete(key);
      }
    } else {
      let editedTiles = this.editedChunkTiles.get(key);
      if (!editedTiles) {
        editedTiles = new Map<number, number>();
        this.editedChunkTiles.set(key, editedTiles);
      }
      editedTiles.set(tileIndex, tileId);
    }

    const event: TileEditEvent = {
      worldTileX,
      worldTileY,
      chunkX,
      chunkY,
      localX,
      localY,
      previousTileId,
      tileId
    };

    for (const listener of this.tileEditListeners) {
      listener(event);
    }

    return true;
  }

  sampleTileNeighborhood(worldTileX: number, worldTileY: number): TileNeighborhood {
    return this.sampleTileNeighborhoodInto(worldTileX, worldTileY, createTileNeighborhood());
  }

  sampleTileNeighborhoodInto(
    worldTileX: number,
    worldTileY: number,
    target: TileNeighborhood
  ): TileNeighborhood {
    target.center = this.getTile(worldTileX, worldTileY);
    target.north = this.getTile(worldTileX, worldTileY - 1);
    target.northEast = this.getTile(worldTileX + 1, worldTileY - 1);
    target.east = this.getTile(worldTileX + 1, worldTileY);
    target.southEast = this.getTile(worldTileX + 1, worldTileY + 1);
    target.south = this.getTile(worldTileX, worldTileY + 1);
    target.southWest = this.getTile(worldTileX - 1, worldTileY + 1);
    target.west = this.getTile(worldTileX - 1, worldTileY);
    target.northWest = this.getTile(worldTileX - 1, worldTileY - 1);
    return target;
  }

  sampleLocalTileNeighborhood(
    chunkX: number,
    chunkY: number,
    localX: number,
    localY: number
  ): TileNeighborhood {
    return this.sampleLocalTileNeighborhoodInto(chunkX, chunkY, localX, localY, createTileNeighborhood());
  }

  sampleLocalTileNeighborhoodInto(
    chunkX: number,
    chunkY: number,
    localX: number,
    localY: number,
    target: TileNeighborhood
  ): TileNeighborhood {
    const worldTileX = chunkX * CHUNK_SIZE + localX;
    const worldTileY = chunkY * CHUNK_SIZE + localY;
    return this.sampleTileNeighborhoodInto(worldTileX, worldTileY, target);
  }

  onTileEdited(listener: TileEditListener): () => void {
    this.tileEditListeners.add(listener);
    return () => {
      this.tileEditListeners.delete(listener);
    };
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
