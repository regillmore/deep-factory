import { chunkKey, toTileIndex, worldToChunkCoord, worldToLocalTile } from './chunkMath';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import { doesTileBlockLight, getTileEmissiveLightLevel, TILE_METADATA } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
import type { Chunk } from './types';
import { TileWorld } from './world';

interface ResidentChunkLightingBounds {
  minChunkX: number;
  minChunkY: number;
  maxChunkX: number;
  maxChunkY: number;
  minWorldTileX: number;
  minWorldTileY: number;
  maxWorldTileX: number;
  maxWorldTileY: number;
  chunksByKey: Map<string, Chunk>;
}

interface DirtyResidentChunkColumn {
  chunkX: number;
  localColumnMask: number;
}

interface DirtyResidentChunkColumnContext extends DirtyResidentChunkColumn {
  residentColumnChunks: Chunk[];
}

interface ResidentTileSample {
  chunk: Chunk;
  tileId: number;
  tileIndex: number;
  chunkX: number;
  localX: number;
}

interface EmissiveLightSource {
  worldTileX: number;
  worldTileY: number;
  lightLevel: number;
}

interface TrackedChunkLightSnapshot {
  chunk: Chunk;
  lightLevels: Uint8Array;
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
    minWorldTileX: minChunkX * CHUNK_SIZE,
    minWorldTileY: minChunkY * CHUNK_SIZE,
    maxWorldTileX: (maxChunkX + 1) * CHUNK_SIZE - 1,
    maxWorldTileY: (maxChunkY + 1) * CHUNK_SIZE - 1,
    chunksByKey
  };
};

const collectResidentChunkColumnChunks = (
  bounds: ResidentChunkLightingBounds,
  chunkX: number
): Chunk[] => {
  const residentColumnChunks: Chunk[] = [];
  for (let chunkY = bounds.minChunkY; chunkY <= bounds.maxChunkY; chunkY += 1) {
    const chunk = bounds.chunksByKey.get(chunkKey(chunkX, chunkY));
    if (chunk) {
      residentColumnChunks.push(chunk);
    }
  }
  return residentColumnChunks;
};

const trackChunkLightSnapshot = (
  trackedChunkLightSnapshotsByKey: Map<string, TrackedChunkLightSnapshot>,
  chunk: Chunk
): void => {
  const key = chunkKey(chunk.coord.x, chunk.coord.y);
  if (trackedChunkLightSnapshotsByKey.has(key)) {
    return;
  }

  trackedChunkLightSnapshotsByKey.set(key, {
    chunk,
    lightLevels: chunk.lightLevels.slice()
  });
};

const didChunkLightLevelsChange = (previousLightLevels: Uint8Array, nextLightLevels: Uint8Array): boolean => {
  for (let index = 0; index < previousLightLevels.length; index += 1) {
    if (previousLightLevels[index] !== nextLightLevels[index]) {
      return true;
    }
  }

  return false;
};

const sampleResidentTileAtWorldTile = (
  bounds: ResidentChunkLightingBounds,
  worldTileX: number,
  worldTileY: number
): ResidentTileSample | null => {
  if (
    worldTileX < bounds.minWorldTileX ||
    worldTileX > bounds.maxWorldTileX ||
    worldTileY < bounds.minWorldTileY ||
    worldTileY > bounds.maxWorldTileY
  ) {
    return null;
  }

  const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
  const chunk = bounds.chunksByKey.get(chunkKey(chunkX, chunkY));
  if (!chunk) {
    return null;
  }

  const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
  const tileIndex = toTileIndex(localX, localY);
  const tileId = chunk.tiles[tileIndex] ?? 0;
  return {
    chunk,
    tileId,
    tileIndex,
    chunkX,
    localX
  };
};

const collectResidentEmissiveLightSources = (
  bounds: ResidentChunkLightingBounds,
  registry: TileMetadataRegistry
): EmissiveLightSource[] => {
  const sources: EmissiveLightSource[] = [];
  for (const chunk of bounds.chunksByKey.values()) {
    const chunkBaseWorldX = chunk.coord.x * CHUNK_SIZE;
    const chunkBaseWorldY = chunk.coord.y * CHUNK_SIZE;
    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        const tileId = chunk.tiles[toTileIndex(localX, localY)] ?? 0;
        const lightLevel = getTileEmissiveLightLevel(tileId, registry);
        if (lightLevel <= 0) {
          continue;
        }

        sources.push({
          worldTileX: chunkBaseWorldX + localX,
          worldTileY: chunkBaseWorldY + localY,
          lightLevel
        });
      }
    }
  }

  return sources;
};

const applyResidentEmissiveLightToDirtyColumns = (
  bounds: ResidentChunkLightingBounds,
  dirtyLocalColumnMaskByChunkX: Map<number, number>,
  registry: TileMetadataRegistry
): void => {
  const emissiveSources = collectResidentEmissiveLightSources(bounds, registry);
  if (emissiveSources.length === 0) {
    return;
  }

  const residentWidthInTiles = bounds.maxWorldTileX - bounds.minWorldTileX + 1;
  const residentHeightInTiles = bounds.maxWorldTileY - bounds.minWorldTileY + 1;
  const propagatedLightByResidentTile = new Uint8Array(residentWidthInTiles * residentHeightInTiles);

  const toResidentTileLookupIndex = (worldTileX: number, worldTileY: number): number => {
    if (
      worldTileX < bounds.minWorldTileX ||
      worldTileX > bounds.maxWorldTileX ||
      worldTileY < bounds.minWorldTileY ||
      worldTileY > bounds.maxWorldTileY
    ) {
      return -1;
    }

    const localX = worldTileX - bounds.minWorldTileX;
    const localY = worldTileY - bounds.minWorldTileY;
    return localY * residentWidthInTiles + localX;
  };

  const writeLightLevelIfDirtyColumn = (tile: ResidentTileSample, lightLevel: number): void => {
    const localColumnMask = dirtyLocalColumnMaskByChunkX.get(tile.chunkX) ?? 0;
    if (((localColumnMask >>> tile.localX) & 1) === 0) {
      return;
    }

    const previousLightLevel = tile.chunk.lightLevels[tile.tileIndex] ?? 0;
    if (lightLevel > previousLightLevel) {
      tile.chunk.lightLevels[tile.tileIndex] = lightLevel;
    }
  };

  const queueWorldTileX: number[] = [];
  const queueWorldTileY: number[] = [];
  const queueLightLevel: number[] = [];
  let queueReadIndex = 0;

  for (const source of emissiveSources) {
    const sourceLookupIndex = toResidentTileLookupIndex(source.worldTileX, source.worldTileY);
    if (sourceLookupIndex < 0) {
      continue;
    }

    if ((propagatedLightByResidentTile[sourceLookupIndex] ?? 0) >= source.lightLevel) {
      continue;
    }

    const sourceTile = sampleResidentTileAtWorldTile(bounds, source.worldTileX, source.worldTileY);
    if (!sourceTile) {
      continue;
    }

    propagatedLightByResidentTile[sourceLookupIndex] = source.lightLevel;
    writeLightLevelIfDirtyColumn(sourceTile, source.lightLevel);
    queueWorldTileX.push(source.worldTileX);
    queueWorldTileY.push(source.worldTileY);
    queueLightLevel.push(source.lightLevel);
  }

  while (queueReadIndex < queueWorldTileX.length) {
    const currentWorldTileX = queueWorldTileX[queueReadIndex] ?? 0;
    const currentWorldTileY = queueWorldTileY[queueReadIndex] ?? 0;
    const currentLightLevel = queueLightLevel[queueReadIndex] ?? 0;
    queueReadIndex += 1;

    if (currentLightLevel <= 1) {
      continue;
    }

    const nextLightLevel = currentLightLevel - 1;
    const neighboringWorldTiles = [
      [currentWorldTileX, currentWorldTileY - 1],
      [currentWorldTileX + 1, currentWorldTileY],
      [currentWorldTileX, currentWorldTileY + 1],
      [currentWorldTileX - 1, currentWorldTileY]
    ];

    for (const [neighborWorldTileX, neighborWorldTileY] of neighboringWorldTiles) {
      const neighborLookupIndex = toResidentTileLookupIndex(neighborWorldTileX, neighborWorldTileY);
      if (neighborLookupIndex < 0) {
        continue;
      }

      if ((propagatedLightByResidentTile[neighborLookupIndex] ?? 0) >= nextLightLevel) {
        continue;
      }

      const neighborTile = sampleResidentTileAtWorldTile(bounds, neighborWorldTileX, neighborWorldTileY);
      if (!neighborTile) {
        continue;
      }

      propagatedLightByResidentTile[neighborLookupIndex] = nextLightLevel;
      writeLightLevelIfDirtyColumn(neighborTile, nextLightLevel);
      if (doesTileBlockLight(neighborTile.tileId, registry)) {
        continue;
      }

      queueWorldTileX.push(neighborWorldTileX);
      queueWorldTileY.push(neighborWorldTileY);
      queueLightLevel.push(nextLightLevel);
    }
  }
};

const applyHorizontalSunlightTransportBetweenNeighborChunkColumns = (
  bounds: ResidentChunkLightingBounds,
  dirtyLocalColumnMaskByChunkX: Map<number, number>,
  registry: TileMetadataRegistry
): void => {
  for (let chunkX = bounds.minChunkX; chunkX < bounds.maxChunkX; chunkX += 1) {
    const leftDirtyMask = dirtyLocalColumnMaskByChunkX.get(chunkX) ?? 0;
    const rightDirtyMask = dirtyLocalColumnMaskByChunkX.get(chunkX + 1) ?? 0;
    const leftBoundaryColumnDirty = ((leftDirtyMask >>> (CHUNK_SIZE - 1)) & 1) !== 0;
    const rightBoundaryColumnDirty = (rightDirtyMask & 1) !== 0;
    if (!leftBoundaryColumnDirty && !rightBoundaryColumnDirty) {
      continue;
    }

    for (let chunkY = bounds.minChunkY; chunkY <= bounds.maxChunkY; chunkY += 1) {
      const leftChunk = bounds.chunksByKey.get(chunkKey(chunkX, chunkY));
      const rightChunk = bounds.chunksByKey.get(chunkKey(chunkX + 1, chunkY));
      if (!leftChunk || !rightChunk) {
        continue;
      }

      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        const leftTileIndex = toTileIndex(CHUNK_SIZE - 1, localY);
        const rightTileIndex = toTileIndex(0, localY);
        const leftTileId = leftChunk.tiles[leftTileIndex] ?? 0;
        const rightTileId = rightChunk.tiles[rightTileIndex] ?? 0;
        if (doesTileBlockLight(leftTileId, registry) || doesTileBlockLight(rightTileId, registry)) {
          continue;
        }

        const leftSunlit = (leftChunk.lightLevels[leftTileIndex] ?? 0) > 0;
        const rightSunlit = (rightChunk.lightLevels[rightTileIndex] ?? 0) > 0;
        if (leftSunlit && rightBoundaryColumnDirty) {
          rightChunk.lightLevels[rightTileIndex] = MAX_LIGHT_LEVEL;
        }
        if (rightSunlit && leftBoundaryColumnDirty) {
          leftChunk.lightLevels[leftTileIndex] = MAX_LIGHT_LEVEL;
        }
      }
    }
  }
};

const applySunlightToBlockingTilesAdjacentToLitAir = (
  bounds: ResidentChunkLightingBounds,
  dirtyColumnContexts: DirtyResidentChunkColumnContext[],
  registry: TileMetadataRegistry
): void => {
  const sunlitAirByWorldTileKey = new Map<string, boolean>();
  const sunlitAirInProgressWorldTileKeys = new Set<string>();

  const isResidentAirTileLitBySunlight = (worldTileX: number, worldTileY: number): boolean => {
    const worldTileKey = `${worldTileX},${worldTileY}`;
    const cachedResult = sunlitAirByWorldTileKey.get(worldTileKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }
    if (sunlitAirInProgressWorldTileKeys.has(worldTileKey)) {
      return false;
    }

    sunlitAirInProgressWorldTileKeys.add(worldTileKey);

    let isSunlit = false;
    const tile = sampleResidentTileAtWorldTile(bounds, worldTileX, worldTileY);
    if (tile && !doesTileBlockLight(tile.tileId, registry)) {
      isSunlit = true;
      for (let probeWorldTileY = worldTileY - 1; probeWorldTileY >= bounds.minWorldTileY; probeWorldTileY -= 1) {
        const aboveTile = sampleResidentTileAtWorldTile(bounds, worldTileX, probeWorldTileY);
        if (aboveTile && doesTileBlockLight(aboveTile.tileId, registry)) {
          isSunlit = false;
          break;
        }
      }

      if (!isSunlit) {
        let transportedNeighborWorldTileX: number | null = null;
        if (tile.localX === 0) {
          transportedNeighborWorldTileX = worldTileX - 1;
        } else if (tile.localX === CHUNK_SIZE - 1) {
          transportedNeighborWorldTileX = worldTileX + 1;
        }

        if (transportedNeighborWorldTileX !== null) {
          const transportedNeighborTile = sampleResidentTileAtWorldTile(
            bounds,
            transportedNeighborWorldTileX,
            worldTileY
          );
          if (
            transportedNeighborTile &&
            !doesTileBlockLight(transportedNeighborTile.tileId, registry)
          ) {
            isSunlit = isResidentAirTileLitBySunlight(transportedNeighborWorldTileX, worldTileY);
          }
        }
      }
    }

    sunlitAirInProgressWorldTileKeys.delete(worldTileKey);
    sunlitAirByWorldTileKey.set(worldTileKey, isSunlit);
    return isSunlit;
  };

  const hasHorizontalSunlitAirNeighbor = (worldTileX: number, worldTileY: number): boolean => {
    const horizontalNeighborWorldTiles = [
      [worldTileX - 1, worldTileY],
      [worldTileX + 1, worldTileY]
    ];

    for (const [neighborWorldTileX, neighborWorldTileY] of horizontalNeighborWorldTiles) {
      const horizontalNeighborTile = sampleResidentTileAtWorldTile(
        bounds,
        neighborWorldTileX,
        neighborWorldTileY
      );
      if (!horizontalNeighborTile || doesTileBlockLight(horizontalNeighborTile.tileId, registry)) {
        continue;
      }

      if (isResidentAirTileLitBySunlight(neighborWorldTileX, neighborWorldTileY)) {
        return true;
      }
    }

    return false;
  };

  for (const dirtyColumn of dirtyColumnContexts) {
    const { localColumnMask, residentColumnChunks } = dirtyColumn;
    for (const chunk of residentColumnChunks) {
      const chunkBaseWorldTileX = chunk.coord.x * CHUNK_SIZE;
      const chunkBaseWorldTileY = chunk.coord.y * CHUNK_SIZE;

      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        if (((localColumnMask >>> localX) & 1) === 0) {
          continue;
        }

        for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
          const tileIndex = toTileIndex(localX, localY);
          const tileId = chunk.tiles[tileIndex] ?? 0;
          if (!doesTileBlockLight(tileId, registry)) {
            continue;
          }

          const worldTileX = chunkBaseWorldTileX + localX;
          const worldTileY = chunkBaseWorldTileY + localY;
          const neighboringWorldTiles = [
            [worldTileX, worldTileY - 1],
            [worldTileX + 1, worldTileY],
            [worldTileX, worldTileY + 1],
            [worldTileX - 1, worldTileY]
          ];

          let hasAdjacentSunlitAir = false;
          for (const [neighborWorldTileX, neighborWorldTileY] of neighboringWorldTiles) {
            const neighborTile = sampleResidentTileAtWorldTile(bounds, neighborWorldTileX, neighborWorldTileY);
            if (!neighborTile || doesTileBlockLight(neighborTile.tileId, registry)) {
              continue;
            }

            if (isResidentAirTileLitBySunlight(neighborWorldTileX, neighborWorldTileY)) {
              hasAdjacentSunlitAir = true;
              break;
            }

            const isVerticalNeighbor = neighborWorldTileX === worldTileX;
            if (
              isVerticalNeighbor &&
              hasHorizontalSunlitAirNeighbor(neighborWorldTileX, neighborWorldTileY)
            ) {
              hasAdjacentSunlitAir = true;
              break;
            }
          }

          if (hasAdjacentSunlitAir) {
            chunk.lightLevels[tileIndex] = MAX_LIGHT_LEVEL;
          }
        }
      }
    }
  }
};

export const recomputeSunlightFromExposedChunkTops = (
  world: TileWorld,
  registry: TileMetadataRegistry = TILE_METADATA,
  changedChunkCoords?: Array<{ x: number; y: number }>
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

  const dirtyColumnContexts: DirtyResidentChunkColumnContext[] = [];
  const dirtyLocalColumnMaskByChunkX = new Map<number, number>();
  const trackedChunkLightSnapshotsByKey =
    changedChunkCoords === undefined ? null : new Map<string, TrackedChunkLightSnapshot>();

  for (const dirtyColumn of dirtyChunkColumns) {
    const { chunkX, localColumnMask } = dirtyColumn;
    if (localColumnMask === 0) {
      continue;
    }

    const residentColumnChunks = collectResidentChunkColumnChunks(bounds, chunkX);
    if (residentColumnChunks.length === 0) {
      continue;
    }

    dirtyColumnContexts.push({
      chunkX,
      localColumnMask,
      residentColumnChunks
    });
    dirtyLocalColumnMaskByChunkX.set(chunkX, localColumnMask);

    if (trackedChunkLightSnapshotsByKey) {
      for (const chunk of residentColumnChunks) {
        trackChunkLightSnapshot(trackedChunkLightSnapshotsByKey, chunk);
      }

      if ((localColumnMask & 1) !== 0) {
        for (const chunk of collectResidentChunkColumnChunks(bounds, chunkX - 1)) {
          trackChunkLightSnapshot(trackedChunkLightSnapshotsByKey, chunk);
        }
      }

      if (((localColumnMask >>> (CHUNK_SIZE - 1)) & 1) !== 0) {
        for (const chunk of collectResidentChunkColumnChunks(bounds, chunkX + 1)) {
          trackChunkLightSnapshot(trackedChunkLightSnapshotsByKey, chunk);
        }
      }
    }
  }

  if (dirtyColumnContexts.length === 0) {
    return 0;
  }

  let recomputedChunkCount = 0;

  for (const dirtyColumn of dirtyColumnContexts) {
    const { localColumnMask, residentColumnChunks } = dirtyColumn;

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
          chunk.lightLevels[tileIndex] = sunlightVisible ? MAX_LIGHT_LEVEL : 0;
          if (blocksLight) {
            sunlightVisible = false;
          }
        }
      }
    }

    recomputedChunkCount += residentColumnChunks.length;
  }

  applyHorizontalSunlightTransportBetweenNeighborChunkColumns(
    bounds,
    dirtyLocalColumnMaskByChunkX,
    registry
  );
  applySunlightToBlockingTilesAdjacentToLitAir(bounds, dirtyColumnContexts, registry);
  applyResidentEmissiveLightToDirtyColumns(bounds, dirtyLocalColumnMaskByChunkX, registry);

  if (trackedChunkLightSnapshotsByKey && changedChunkCoords) {
    for (const trackedChunk of trackedChunkLightSnapshotsByKey.values()) {
      if (!didChunkLightLevelsChange(trackedChunk.lightLevels, trackedChunk.chunk.lightLevels)) {
        continue;
      }

      changedChunkCoords.push({ x: trackedChunk.chunk.coord.x, y: trackedChunk.chunk.coord.y });
    }
  }

  for (const dirtyColumn of dirtyColumnContexts) {
    const { localColumnMask, residentColumnChunks } = dirtyColumn;
    for (const chunk of residentColumnChunks) {
      world.markChunkLightColumnsClean(chunk.coord.x, chunk.coord.y, localColumnMask);
    }
  }

  return recomputedChunkCount;
};
