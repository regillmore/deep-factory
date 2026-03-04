import { chunkKey, toTileIndex } from './chunkMath';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import { doesTileBlockLight, TILE_METADATA } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
import type { Chunk } from './types';
import { TileWorld } from './world';

interface ResidentChunkLightingBounds {
  minChunkX: number;
  minChunkY: number;
  maxChunkX: number;
  maxChunkY: number;
  chunksByKey: Map<string, Chunk>;
}

interface DirtyResidentChunkColumn {
  chunkX: number;
  localColumnMask: number;
}

const collectDirtyResidentChunkColumns = (world: TileWorld): DirtyResidentChunkColumn[] => {
  const dirtyChunkColumnMasksByChunkX = new Map<number, number>();
  for (const { x, y } of world.getDirtyLightChunkCoords()) {
    const chunkMask = world.getChunkLightDirtyColumnMask(x, y);
    if (chunkMask === 0) {
      continue;
    }

    const accumulatedMask = dirtyChunkColumnMasksByChunkX.get(x) ?? 0;
    dirtyChunkColumnMasksByChunkX.set(x, (accumulatedMask | chunkMask) >>> 0);
  }

  return Array.from(dirtyChunkColumnMasksByChunkX.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([chunkX, localColumnMask]) => ({ chunkX, localColumnMask }));
};

const collectResidentChunkLightingBounds = (world: TileWorld): ResidentChunkLightingBounds | null => {
  const chunksByKey = new Map<string, Chunk>();
  let minChunkX = Number.POSITIVE_INFINITY;
  let minChunkY = Number.POSITIVE_INFINITY;
  let maxChunkX = Number.NEGATIVE_INFINITY;
  let maxChunkY = Number.NEGATIVE_INFINITY;

  for (const chunk of world.getChunks()) {
    chunksByKey.set(chunkKey(chunk.coord.x, chunk.coord.y), chunk);
    if (chunk.coord.x < minChunkX) minChunkX = chunk.coord.x;
    if (chunk.coord.y < minChunkY) minChunkY = chunk.coord.y;
    if (chunk.coord.x > maxChunkX) maxChunkX = chunk.coord.x;
    if (chunk.coord.y > maxChunkY) maxChunkY = chunk.coord.y;
  }

  if (chunksByKey.size === 0) {
    return null;
  }

  return {
    minChunkX,
    minChunkY,
    maxChunkX,
    maxChunkY,
    chunksByKey
  };
};

export const recomputeSunlightFromExposedChunkTops = (
  world: TileWorld,
  registry: TileMetadataRegistry = TILE_METADATA
): number => {
  if (world.getDirtyLightChunkCount() === 0) {
    return 0;
  }

  const bounds = collectResidentChunkLightingBounds(world);
  if (!bounds) {
    return 0;
  }

  const dirtyChunkColumns = collectDirtyResidentChunkColumns(world);
  if (dirtyChunkColumns.length === 0) {
    return 0;
  }

  let recomputedChunkCount = 0;

  for (const dirtyColumn of dirtyChunkColumns) {
    const { chunkX, localColumnMask } = dirtyColumn;
    if (localColumnMask === 0) {
      continue;
    }

    const residentColumnChunks: Chunk[] = [];
    for (let chunkY = bounds.minChunkY; chunkY <= bounds.maxChunkY; chunkY += 1) {
      const chunk = bounds.chunksByKey.get(chunkKey(chunkX, chunkY));
      if (chunk) {
        residentColumnChunks.push(chunk);
      }
    }

    if (residentColumnChunks.length === 0) {
      continue;
    }

    for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
      if (((localColumnMask >>> localX) & 1) === 0) {
        continue;
      }

      let sunlightVisible = true;
      for (const chunk of residentColumnChunks) {
        for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
          const tileIndex = toTileIndex(localX, localY);
          const tileId = chunk.tiles[tileIndex] ?? 0;
          const blocksLight = doesTileBlockLight(tileId, registry);
          chunk.lightLevels[tileIndex] = sunlightVisible && !blocksLight ? MAX_LIGHT_LEVEL : 0;
          if (blocksLight) {
            sunlightVisible = false;
          }
        }
      }
    }

    for (const chunk of residentColumnChunks) {
      world.markChunkLightColumnsClean(chunk.coord.x, chunk.coord.y, localColumnMask);
    }

    recomputedChunkCount += residentColumnChunks.length;
  }

  return recomputedChunkCount;
};
