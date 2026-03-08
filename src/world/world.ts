import { CHUNK_SIZE, MAX_LIGHT_LEVEL, MAX_LIQUID_LEVEL } from './constants';
import {
  chunkBoundsContains,
  chunkKey,
  toTileIndex,
  worldToChunkCoord,
  worldToLocalTile
} from './chunkMath';
import type { ChunkBounds } from './chunkMath';
import {
  decodeEditedChunkSnapshot,
  decodeResidentChunkSnapshot,
  encodeEditedChunkSnapshot,
  encodeResidentChunkSnapshot
} from './chunkSnapshot';
import type {
  EditedChunkSnapshot,
  EditedChunkSnapshotState,
  ResidentChunkSnapshot
} from './chunkSnapshot';
import { doesTileBlockLight, getTileEmissiveLightLevel, getTileLiquidKind } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
import type { Chunk, ChunkCoord } from './types';

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

export interface LiquidSimulationStats {
  residentChunksScanned: number;
  horizontalPairsTested: number;
  transfersApplied: number;
}

export interface TileWorldSnapshot {
  liquidSimulationTick: number;
  residentChunks: ResidentChunkSnapshot[];
  editedChunks: EditedChunkSnapshot[];
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

const createLiquidSimulationStats = (): LiquidSimulationStats => ({
  residentChunksScanned: 0,
  horizontalPairsTested: 0,
  transfersApplied: 0
});

const chunkContainsLiquid = (chunk: Chunk): boolean => {
  for (let index = 0; index < chunk.liquidLevels.length; index += 1) {
    if ((chunk.liquidLevels[index] ?? 0) > 0) {
      return true;
    }
  }

  return false;
};

const collectActiveLiquidChunkKeys = (chunks: ReadonlyMap<string, Chunk>): Set<string> => {
  const activeLiquidChunkKeys = new Set<string>();
  for (const [key, chunk] of chunks) {
    if (chunkContainsLiquid(chunk)) {
      activeLiquidChunkKeys.add(key);
    }
  }

  return activeLiquidChunkKeys;
};

const collectSidewaysLiquidCandidateChunkKeys = (
  chunks: ReadonlyMap<string, Chunk>,
  activeLiquidChunkKeys: ReadonlySet<string>
): Set<string> => {
  const candidateChunkKeys = new Set<string>();
  for (const key of activeLiquidChunkKeys) {
    const activeChunk = chunks.get(key);
    if (!activeChunk) {
      continue;
    }

    for (
      let candidateChunkX = activeChunk.coord.x - 1;
      candidateChunkX <= activeChunk.coord.x + 1;
      candidateChunkX += 1
    ) {
      const candidateKey = chunkKey(candidateChunkX, activeChunk.coord.y);
      if (chunks.has(candidateKey)) {
        candidateChunkKeys.add(candidateKey);
      }
    }
  }

  return candidateChunkKeys;
};

const compareChunkCoords = (left: ChunkCoord, right: ChunkCoord): number => left.y - right.y || left.x - right.x;

const parseChunkCoordFromKey = (key: string): ChunkCoord => {
  const [rawX, rawY, ...rest] = key.split(',');
  if (rawX === undefined || rawY === undefined || rest.length > 0) {
    throw new Error(`chunk key must be "x,y", received ${key}`);
  }

  const x = Number(rawX);
  const y = Number(rawY);
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error(`chunk key must contain integer coordinates, received ${key}`);
  }

  return { x, y };
};

const createChunkLiquidLevels = (): Uint8Array => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
const createChunkLightLevels = (): Uint8Array => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
const ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK = CHUNK_SIZE >= 32 ? 0xffffffff >>> 0 : ((1 << CHUNK_SIZE) - 1) >>> 0;

const toLocalLightColumnBit = (localX: number): number => {
  if (!Number.isInteger(localX) || localX < 0 || localX >= CHUNK_SIZE) {
    throw new Error(`localX must be an integer between 0 and ${CHUNK_SIZE - 1}`);
  }

  return (1 << localX) >>> 0;
};

const expectLocalLightColumnMask = (localColumnMask: number): number => {
  if (!Number.isInteger(localColumnMask) || localColumnMask < 0) {
    throw new Error('localColumnMask must be a non-negative integer');
  }

  const normalizedMask = localColumnMask >>> 0;
  const uncoveredMask = (normalizedMask & ~ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK) >>> 0;
  if (uncoveredMask !== 0) {
    throw new Error(`localColumnMask must only use the lowest ${CHUNK_SIZE} bits`);
  }

  return normalizedMask;
};

const clearChunkLightColumns = (chunk: Chunk, localColumnMask: number): void => {
  if (localColumnMask === 0) {
    return;
  }

  if (localColumnMask === ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK) {
    chunk.lightLevels.fill(0);
    return;
  }

  for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
    for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
      if (((localColumnMask >>> localX) & 1) === 0) {
        continue;
      }

      chunk.lightLevels[toTileIndex(localX, localY)] = 0;
    }
  }
};

const collectSunlightInvalidationChunkYOffsetsForLocalTile = (localY: number): number[] => {
  const yOffsets = [0];
  if (localY === 0) {
    yOffsets.push(-1);
  }
  if (localY === CHUNK_SIZE - 1) {
    yOffsets.push(1);
  }
  return yOffsets;
};

const collectLightInvalidationColumnsForWorldTileXRange = (
  minWorldTileX: number,
  maxWorldTileX: number
): Array<{ chunkX: number; localColumnMask: number }> => {
  const startWorldTileX = Math.min(minWorldTileX, maxWorldTileX);
  const endWorldTileX = Math.max(minWorldTileX, maxWorldTileX);
  const localColumnMasksByChunkX = new Map<number, number>();

  for (let worldTileX = startWorldTileX; worldTileX <= endWorldTileX; worldTileX += 1) {
    const { chunkX } = worldToChunkCoord(worldTileX, 0);
    const { localX } = worldToLocalTile(worldTileX, 0);
    const existingMask = localColumnMasksByChunkX.get(chunkX) ?? 0;
    localColumnMasksByChunkX.set(chunkX, (existingMask | toLocalLightColumnBit(localX)) >>> 0);
  }

  return Array.from(localColumnMasksByChunkX.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([chunkX, localColumnMask]) => ({ chunkX, localColumnMask }));
};

const collectSunlightInvalidationWorldTileXRangeForLocalTile = (
  worldTileX: number,
  localX: number,
  localLightingRange: number
): { minWorldTileX: number; maxWorldTileX: number } => {
  let minWorldTileX = worldTileX - localLightingRange;
  let maxWorldTileX = worldTileX + localLightingRange;

  if (localLightingRange === 0) {
    minWorldTileX -= 1;
    maxWorldTileX += 1;

    if (localX === 0) {
      minWorldTileX -= 1;
    } else if (localX === CHUNK_SIZE - 1) {
      maxWorldTileX += 1;
    }
  }

  return { minWorldTileX, maxWorldTileX };
};

const expectLightLevel = (lightLevel: number): number => {
  if (!Number.isInteger(lightLevel) || lightLevel < 0 || lightLevel > MAX_LIGHT_LEVEL) {
    throw new Error(`lightLevel must be an integer between 0 and ${MAX_LIGHT_LEVEL}`);
  }

  return lightLevel;
};

const expectLiquidSimulationTick = (liquidSimulationTick: number): number => {
  if (!Number.isInteger(liquidSimulationTick) || liquidSimulationTick < 0) {
    throw new Error('liquidSimulationTick must be a non-negative integer');
  }

  return liquidSimulationTick >>> 0;
};

const expectLiquidLevel = (
  tileId: number,
  liquidLevel: number,
  registry?: TileMetadataRegistry
): number => {
  const liquidKind = getTileLiquidKind(tileId, registry);
  if (liquidKind === null) {
    if (liquidLevel !== 0) {
      throw new Error('liquidLevel must be 0 for non-liquid tiles');
    }
    return 0;
  }

  if (!Number.isInteger(liquidLevel) || liquidLevel < 1 || liquidLevel > MAX_LIQUID_LEVEL) {
    throw new Error(`liquidLevel must be an integer between 1 and ${MAX_LIQUID_LEVEL}`);
  }

  return liquidLevel;
};

const expectConsistentChunkLightDirtyState = (chunk: Chunk, label: string): Chunk => {
  if (chunk.lightDirty !== (chunk.lightDirtyColumnMask !== 0)) {
    throw new Error(`${label} light dirty flag must match dirtyColumnMask`);
  }

  return chunk;
};

const expectEditedChunkStateMatchesResidentChunk = (
  chunk: Chunk,
  state: EditedChunkSnapshotState,
  label: string
): void => {
  for (const [tileIndex, tileId] of state.tileOverrides) {
    if ((chunk.tiles[tileIndex] ?? 0) !== tileId) {
      throw new Error(`${label}.tileOverrides must match resident chunk tile ${tileIndex}`);
    }
  }

  for (const [tileIndex, liquidLevel] of state.liquidLevelOverrides) {
    if ((chunk.liquidLevels[tileIndex] ?? 0) !== liquidLevel) {
      throw new Error(`${label}.liquidLevelOverrides must match resident chunk liquid ${tileIndex}`);
    }
  }
};

interface LiquidTransfer {
  fromWorldTileX: number;
  fromWorldTileY: number;
  toWorldTileX: number;
  toWorldTileY: number;
  tileId: number;
  liquidLevel: number;
}

export const didTileLightingStateChange = (
  previousTileId: number,
  tileId: number,
  registry?: TileMetadataRegistry
): boolean =>
  doesTileBlockLight(previousTileId, registry) !== doesTileBlockLight(tileId, registry) ||
  getTileEmissiveLightLevel(previousTileId, registry) !== getTileEmissiveLightLevel(tileId, registry);

export class TileWorld {
  private chunks = new Map<string, Chunk>();
  private editedChunkTiles = new Map<string, Map<number, number>>();
  private editedChunkLiquidLevels = new Map<string, Map<number, number>>();
  private tileEditListeners = new Set<TileEditListener>();
  private dirtyLightChunkKeys = new Set<string>();
  private activeLiquidChunkKeys = new Set<string>();
  private liquidSimulationTick = 0;
  private lastLiquidSimulationStats = createLiquidSimulationStats();

  private getResidentChunk(chunkX: number, chunkY: number): Chunk | null {
    return this.chunks.get(chunkKey(chunkX, chunkY)) ?? null;
  }

  private getResidentTileId(worldTileX: number, worldTileY: number): number | null {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.getResidentChunk(chunkX, chunkY);
    if (!chunk) {
      return null;
    }

    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.tiles[toTileIndex(localX, localY)] ?? 0;
  }

  private getResidentLiquidLevel(worldTileX: number, worldTileY: number): number | null {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.getResidentChunk(chunkX, chunkY);
    if (!chunk) {
      return null;
    }

    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.liquidLevels[toTileIndex(localX, localY)] ?? 0;
  }

  private collectNearbyEmissiveInvalidationRange(worldTileX: number, worldTileY: number): number {
    const maxSearchDistance = MAX_LIGHT_LEVEL - 1;
    let localLightingRange = 0;

    for (let yOffset = -maxSearchDistance; yOffset <= maxSearchDistance; yOffset += 1) {
      const maxHorizontalDistance = maxSearchDistance - Math.abs(yOffset);
      for (let xOffset = -maxHorizontalDistance; xOffset <= maxHorizontalDistance; xOffset += 1) {
        const sampledTileId = this.getResidentTileId(worldTileX + xOffset, worldTileY + yOffset);
        if (sampledTileId === null) {
          continue;
        }

        const sourceLightLevel = getTileEmissiveLightLevel(sampledTileId);
        if (sourceLightLevel === 0) {
          continue;
        }

        const sourceDistance = Math.abs(xOffset) + Math.abs(yOffset);
        if (sourceDistance >= sourceLightLevel) {
          continue;
        }

        if (sourceLightLevel > localLightingRange) {
          localLightingRange = sourceLightLevel;
          if (localLightingRange === MAX_LIGHT_LEVEL) {
            return localLightingRange;
          }
        }
      }
    }

    return localLightingRange;
  }

  private updateEditedChunkTileState(
    key: string,
    tileIndex: number,
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    liquidLevel: number
  ): void {
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

    if (liquidLevel === 0) {
      const editedLiquidLevels = this.editedChunkLiquidLevels.get(key);
      editedLiquidLevels?.delete(tileIndex);
      if (editedLiquidLevels && editedLiquidLevels.size === 0) {
        this.editedChunkLiquidLevels.delete(key);
      }
      return;
    }

    let editedLiquidLevels = this.editedChunkLiquidLevels.get(key);
    if (!editedLiquidLevels) {
      editedLiquidLevels = new Map<number, number>();
      this.editedChunkLiquidLevels.set(key, editedLiquidLevels);
    }
    editedLiquidLevels.set(tileIndex, liquidLevel);
  }

  private collectEditedChunkSnapshotStates(): EditedChunkSnapshotState[] {
    const editedChunkKeys = new Set<string>([
      ...this.editedChunkTiles.keys(),
      ...this.editedChunkLiquidLevels.keys()
    ]);
    const states: EditedChunkSnapshotState[] = [];

    for (const key of editedChunkKeys) {
      states.push({
        coord: parseChunkCoordFromKey(key),
        tileOverrides: new Map(this.editedChunkTiles.get(key)),
        liquidLevelOverrides: new Map(this.editedChunkLiquidLevels.get(key))
      });
    }

    return states.sort((left, right) => compareChunkCoords(left.coord, right.coord));
  }

  private invalidateLightingForTileStateChange(
    worldTileX: number,
    worldTileY: number,
    localX: number,
    localY: number,
    chunkY: number,
    previousTileId: number,
    tileId: number
  ): void {
    const previousTileBlocksLight = doesTileBlockLight(previousTileId);
    const nextTileBlocksLight = doesTileBlockLight(tileId);
    const previousTileEmissiveLight = getTileEmissiveLightLevel(previousTileId);
    const nextTileEmissiveLight = getTileEmissiveLightLevel(tileId);

    if (
      previousTileBlocksLight === nextTileBlocksLight &&
      previousTileEmissiveLight === nextTileEmissiveLight
    ) {
      return;
    }

    let localLightingRange = Math.max(previousTileEmissiveLight, nextTileEmissiveLight);
    if (localLightingRange === 0 && previousTileBlocksLight !== nextTileBlocksLight) {
      localLightingRange = this.collectNearbyEmissiveInvalidationRange(worldTileX, worldTileY);
    }

    const sunlightInvalidationWorldTileXRange = collectSunlightInvalidationWorldTileXRangeForLocalTile(
      worldTileX,
      localX,
      localLightingRange
    );
    const invalidationColumns = collectLightInvalidationColumnsForWorldTileXRange(
      sunlightInvalidationWorldTileXRange.minWorldTileX,
      sunlightInvalidationWorldTileXRange.maxWorldTileX
    );

    for (const chunkYOffset of collectSunlightInvalidationChunkYOffsetsForLocalTile(localY)) {
      for (const column of invalidationColumns) {
        this.invalidateChunkLightColumns(column.chunkX, chunkY + chunkYOffset, column.localColumnMask);
      }
    }
  }

  private commitTileState(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    liquidLevel: number,
    emitTileEditEvent: boolean
  ): {
    previousTileId: number;
    previousLiquidLevel: number;
    changed: boolean;
    tileIdChanged: boolean;
  } {
    const normalizedLiquidLevel = expectLiquidLevel(tileId, liquidLevel);
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const key = chunkKey(chunkX, chunkY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const previousTileId = chunk.tiles[tileIndex] ?? 0;
    const previousLiquidLevel = chunk.liquidLevels[tileIndex] ?? 0;
    if (previousTileId === tileId && previousLiquidLevel === normalizedLiquidLevel) {
      return {
        previousTileId,
        previousLiquidLevel,
        changed: false,
        tileIdChanged: false
      };
    }

    chunk.tiles[tileIndex] = tileId;
    chunk.liquidLevels[tileIndex] = normalizedLiquidLevel;
    this.updateActiveLiquidChunkMembershipForCommittedTile(
      key,
      chunk,
      previousLiquidLevel,
      normalizedLiquidLevel
    );
    this.updateEditedChunkTileState(key, tileIndex, worldTileX, worldTileY, tileId, normalizedLiquidLevel);

    const tileIdChanged = previousTileId !== tileId;
    if (tileIdChanged) {
      this.invalidateLightingForTileStateChange(
        worldTileX,
        worldTileY,
        localX,
        localY,
        chunkY,
        previousTileId,
        tileId
      );

      if (emitTileEditEvent) {
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
      }
    }

    return {
      previousTileId,
      previousLiquidLevel,
      changed: true,
      tileIdChanged
    };
  }

  private updateActiveLiquidChunkMembershipForCommittedTile(
    key: string,
    chunk: Chunk,
    previousLiquidLevel: number,
    nextLiquidLevel: number
  ): void {
    if (nextLiquidLevel > 0) {
      this.activeLiquidChunkKeys.add(key);
      return;
    }

    if (previousLiquidLevel > 0 && !chunkContainsLiquid(chunk)) {
      this.activeLiquidChunkKeys.delete(key);
    }
  }

  private applyLiquidTransfer(transfer: LiquidTransfer): boolean {
    const sourceTileId = this.getResidentTileId(transfer.fromWorldTileX, transfer.fromWorldTileY);
    const sourceLiquidLevel = this.getResidentLiquidLevel(transfer.fromWorldTileX, transfer.fromWorldTileY);
    const targetTileId = this.getResidentTileId(transfer.toWorldTileX, transfer.toWorldTileY);
    const targetLiquidLevel = this.getResidentLiquidLevel(transfer.toWorldTileX, transfer.toWorldTileY);
    if (
      sourceTileId === null ||
      sourceLiquidLevel === null ||
      targetTileId === null ||
      targetLiquidLevel === null ||
      sourceTileId !== transfer.tileId ||
      sourceLiquidLevel < transfer.liquidLevel
    ) {
      return false;
    }

    const nextSourceLiquidLevel = sourceLiquidLevel - transfer.liquidLevel;
    const nextSourceTileId = nextSourceLiquidLevel === 0 ? 0 : sourceTileId;
    const nextTargetLiquidLevel = targetLiquidLevel + transfer.liquidLevel;
    const nextTargetTileId = targetTileId === 0 ? sourceTileId : targetTileId;
    const sourceChanged = this.commitTileState(
      transfer.fromWorldTileX,
      transfer.fromWorldTileY,
      nextSourceTileId,
      nextSourceLiquidLevel,
      true
    ).changed;
    const targetChanged = this.commitTileState(
      transfer.toWorldTileX,
      transfer.toWorldTileY,
      nextTargetTileId,
      nextTargetLiquidLevel,
      true
    ).changed;
    return sourceChanged || targetChanged;
  }

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
    const normalizedChunkX = chunkX === 0 ? 0 : chunkX;
    const normalizedChunkY = chunkY === 0 ? 0 : chunkY;

    const tiles = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
    const liquidLevels = createChunkLiquidLevels();
    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        const worldX = normalizedChunkX * CHUNK_SIZE + localX;
        const worldY = normalizedChunkY * CHUNK_SIZE + localY;
        tiles[toTileIndex(localX, localY)] = proceduralTile(worldX, worldY);
      }
    }

    const editedTiles = this.editedChunkTiles.get(key);
    const editedLiquidLevels = this.editedChunkLiquidLevels.get(key);
    if (editedTiles) {
      for (const [tileIndex, tileId] of editedTiles) {
        tiles[tileIndex] = tileId;
        if (getTileLiquidKind(tileId) !== null) {
          liquidLevels[tileIndex] = editedLiquidLevels?.get(tileIndex) ?? MAX_LIQUID_LEVEL;
        }
      }
    }

    if (editedLiquidLevels) {
      for (const [tileIndex, liquidLevel] of editedLiquidLevels) {
        if (getTileLiquidKind(tiles[tileIndex] ?? 0) === null) {
          continue;
        }
        liquidLevels[tileIndex] = liquidLevel;
      }
    }

    const chunk: Chunk = {
      coord: { x: normalizedChunkX, y: normalizedChunkY },
      tiles,
      liquidLevels,
      lightLevels: createChunkLightLevels(),
      lightDirty: true,
      lightDirtyColumnMask: ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK
    };
    this.chunks.set(key, chunk);
    this.dirtyLightChunkKeys.add(key);
    if (chunkContainsLiquid(chunk)) {
      this.activeLiquidChunkKeys.add(key);
    }
    return chunk;
  }

  getTile(worldTileX: number, worldTileY: number): number {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.tiles[toTileIndex(localX, localY)];
  }

  setTile(worldTileX: number, worldTileY: number, tileId: number): boolean {
    if (this.getTile(worldTileX, worldTileY) === tileId) {
      return false;
    }

    const liquidKind = getTileLiquidKind(tileId);
    return this.commitTileState(
      worldTileX,
      worldTileY,
      tileId,
      liquidKind === null ? 0 : MAX_LIQUID_LEVEL,
      true
    ).changed;
  }

  getLiquidLevel(worldTileX: number, worldTileY: number): number {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.liquidLevels[toTileIndex(localX, localY)] ?? 0;
  }

  stepLiquidSimulation(): boolean {
    const stats = createLiquidSimulationStats();
    if (this.activeLiquidChunkKeys.size === 0) {
      this.lastLiquidSimulationStats = stats;
      this.liquidSimulationTick = (this.liquidSimulationTick + 1) >>> 0;
      return false;
    }

    stats.residentChunksScanned = this.chunks.size;
    const downwardTransfers: LiquidTransfer[] = [];

    for (const chunk of this.chunks.values()) {
      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
          const tileIndex = toTileIndex(localX, localY);
          const tileId = chunk.tiles[tileIndex] ?? 0;
          const liquidLevel = chunk.liquidLevels[tileIndex] ?? 0;
          if (liquidLevel === 0 || getTileLiquidKind(tileId) === null) {
            continue;
          }

          const worldTileX = chunk.coord.x * CHUNK_SIZE + localX;
          const worldTileY = chunk.coord.y * CHUNK_SIZE + localY;
          const belowTileId = this.getResidentTileId(worldTileX, worldTileY + 1);
          const belowLiquidLevel = this.getResidentLiquidLevel(worldTileX, worldTileY + 1);
          if (belowTileId === null || belowLiquidLevel === null) {
            continue;
          }

          const belowLiquidKind = getTileLiquidKind(belowTileId);
          if (belowTileId !== 0 && belowLiquidKind !== getTileLiquidKind(tileId)) {
            continue;
          }

          const capacity = MAX_LIQUID_LEVEL - belowLiquidLevel;
          if (capacity <= 0) {
            continue;
          }

          downwardTransfers.push({
            fromWorldTileX: worldTileX,
            fromWorldTileY: worldTileY,
            toWorldTileX: worldTileX,
            toWorldTileY: worldTileY + 1,
            tileId,
            liquidLevel: Math.min(liquidLevel, capacity)
          });
        }
      }
    }

    let changed = false;
    for (const transfer of downwardTransfers) {
      const applied = this.applyLiquidTransfer(transfer);
      if (applied) {
        stats.transfersApplied += 1;
      }
      changed = applied || changed;
    }

    const sidewaysCandidateChunkKeys = collectSidewaysLiquidCandidateChunkKeys(
      this.chunks,
      this.activeLiquidChunkKeys
    );
    const horizontalPairParity = this.liquidSimulationTick & 1;
    for (const [key, chunk] of this.chunks) {
      if (!sidewaysCandidateChunkKeys.has(key)) {
        continue;
      }

      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
          const worldTileX = chunk.coord.x * CHUNK_SIZE + localX;
          if ((worldTileX & 1) !== horizontalPairParity) {
            continue;
          }

          const worldTileY = chunk.coord.y * CHUNK_SIZE + localY;
          const leftTileId = this.getResidentTileId(worldTileX, worldTileY);
          const leftLiquidLevel = this.getResidentLiquidLevel(worldTileX, worldTileY);
          const rightTileId = this.getResidentTileId(worldTileX + 1, worldTileY);
          const rightLiquidLevel = this.getResidentLiquidLevel(worldTileX + 1, worldTileY);
          if (
            leftTileId === null ||
            leftLiquidLevel === null ||
            rightTileId === null ||
            rightLiquidLevel === null
          ) {
            continue;
          }

          stats.horizontalPairsTested += 1;

          const leftLiquidKind = getTileLiquidKind(leftTileId);
          const rightLiquidKind = getTileLiquidKind(rightTileId);
          if (leftLiquidKind === null && rightLiquidKind === null) {
            continue;
          }
          if (leftLiquidKind !== null && rightLiquidKind !== null && leftLiquidKind !== rightLiquidKind) {
            continue;
          }

          const transferDirection =
            leftLiquidLevel > rightLiquidLevel
              ? 'left-to-right'
              : rightLiquidLevel > leftLiquidLevel
                ? 'right-to-left'
                : null;
          if (!transferDirection) {
            continue;
          }

          const donorTileId = transferDirection === 'left-to-right' ? leftTileId : rightTileId;
          const donorLiquidLevel =
            transferDirection === 'left-to-right' ? leftLiquidLevel : rightLiquidLevel;
          const receiverTileId = transferDirection === 'left-to-right' ? rightTileId : leftTileId;
          const receiverLiquidLevel =
            transferDirection === 'left-to-right' ? rightLiquidLevel : leftLiquidLevel;
          const donorLiquidKind = getTileLiquidKind(donorTileId);
          if (donorLiquidKind === null) {
            continue;
          }
          if (receiverTileId !== 0 && getTileLiquidKind(receiverTileId) !== donorLiquidKind) {
            continue;
          }

          const capacity = MAX_LIQUID_LEVEL - receiverLiquidLevel;
          const transferLevel = Math.min(Math.floor((donorLiquidLevel - receiverLiquidLevel) / 2), capacity);
          if (transferLevel <= 0) {
            continue;
          }

          const applied = this.applyLiquidTransfer(
            transferDirection === 'left-to-right'
              ? {
                  fromWorldTileX: worldTileX,
                  fromWorldTileY: worldTileY,
                  toWorldTileX: worldTileX + 1,
                  toWorldTileY: worldTileY,
                  tileId: donorTileId,
                  liquidLevel: transferLevel
                }
              : {
                  fromWorldTileX: worldTileX + 1,
                  fromWorldTileY: worldTileY,
                  toWorldTileX: worldTileX,
                  toWorldTileY: worldTileY,
                  tileId: donorTileId,
                  liquidLevel: transferLevel
                }
          );
          if (applied) {
            stats.transfersApplied += 1;
          }
          changed = applied || changed;
        }
      }
    }

    this.lastLiquidSimulationStats = stats;
    this.liquidSimulationTick = (this.liquidSimulationTick + 1) >>> 0;
    return changed;
  }

  getLastLiquidSimulationStats(): LiquidSimulationStats {
    return { ...this.lastLiquidSimulationStats };
  }

  getLightLevel(worldTileX: number, worldTileY: number): number {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.lightLevels[toTileIndex(localX, localY)] ?? 0;
  }

  setLightLevel(worldTileX: number, worldTileY: number, lightLevel: number): boolean {
    const nextLightLevel = expectLightLevel(lightLevel);
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const previousLightLevel = chunk.lightLevels[tileIndex] ?? 0;
    if (previousLightLevel === nextLightLevel) {
      return false;
    }

    chunk.lightLevels[tileIndex] = nextLightLevel;
    return true;
  }

  getChunkLightLevels(chunkX: number, chunkY: number): Uint8Array {
    return this.ensureChunk(chunkX, chunkY).lightLevels;
  }

  fillChunkLight(chunkX: number, chunkY: number, lightLevel: number): void {
    this.ensureChunk(chunkX, chunkY).lightLevels.fill(expectLightLevel(lightLevel));
  }

  isChunkLightDirty(chunkX: number, chunkY: number): boolean {
    return this.chunks.get(chunkKey(chunkX, chunkY))?.lightDirty ?? false;
  }

  getChunkLightDirtyColumnMask(chunkX: number, chunkY: number): number {
    return this.chunks.get(chunkKey(chunkX, chunkY))?.lightDirtyColumnMask ?? 0;
  }

  getDirtyLightChunkCoords(): Array<{ x: number; y: number }> {
    const coords: Array<{ x: number; y: number }> = [];
    for (const key of this.dirtyLightChunkKeys) {
      const chunk = this.chunks.get(key);
      if (!chunk || !chunk.lightDirty) {
        continue;
      }

      coords.push({ x: chunk.coord.x, y: chunk.coord.y });
    }

    return coords;
  }

  getDirtyLightChunkCount(): number {
    return this.dirtyLightChunkKeys.size;
  }

  markChunkLightClean(chunkX: number, chunkY: number): void {
    this.markChunkLightColumnsClean(chunkX, chunkY, ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK);
  }

  markChunkLightColumnsClean(chunkX: number, chunkY: number, localColumnMask: number): void {
    const normalizedMask = expectLocalLightColumnMask(localColumnMask);
    if (normalizedMask === 0) {
      return;
    }

    const key = chunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);
    if (!chunk) {
      return;
    }

    chunk.lightDirtyColumnMask = (chunk.lightDirtyColumnMask & ~normalizedMask) >>> 0;
    if (chunk.lightDirtyColumnMask === 0) {
      chunk.lightDirty = false;
      this.dirtyLightChunkKeys.delete(key);
      return;
    }

    chunk.lightDirty = true;
    this.dirtyLightChunkKeys.add(key);
  }

  invalidateChunkLight(chunkX: number, chunkY: number): void {
    this.invalidateChunkLightColumns(chunkX, chunkY, ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK);
  }

  invalidateChunkLightColumns(chunkX: number, chunkY: number, localColumnMask: number): void {
    const normalizedMask = expectLocalLightColumnMask(localColumnMask);
    if (normalizedMask === 0) {
      return;
    }

    const key = chunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);
    if (!chunk) {
      return;
    }

    clearChunkLightColumns(chunk, normalizedMask);
    chunk.lightDirtyColumnMask = (chunk.lightDirtyColumnMask | normalizedMask) >>> 0;
    chunk.lightDirty = true;
    this.dirtyLightChunkKeys.add(key);
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

  createSnapshot(): TileWorldSnapshot {
    const residentChunks = Array.from(this.chunks.values())
      .sort((left, right) => compareChunkCoords(left.coord, right.coord))
      .map((chunk) => encodeResidentChunkSnapshot(chunk));
    const editedChunks = this.collectEditedChunkSnapshotStates().map((state) =>
      encodeEditedChunkSnapshot(state)
    );

    return {
      liquidSimulationTick: this.liquidSimulationTick,
      residentChunks,
      editedChunks
    };
  }

  loadSnapshot(snapshot: TileWorldSnapshot): void {
    if (!Array.isArray(snapshot.residentChunks)) {
      throw new Error('residentChunks must be an array');
    }
    if (!Array.isArray(snapshot.editedChunks)) {
      throw new Error('editedChunks must be an array');
    }

    const nextChunks = new Map<string, Chunk>();
    const nextDirtyLightChunkKeys = new Set<string>();
    for (const [index, residentChunkSnapshot] of snapshot.residentChunks.entries()) {
      const chunk = expectConsistentChunkLightDirtyState(
        decodeResidentChunkSnapshot(residentChunkSnapshot),
        `residentChunks[${index}]`
      );
      const key = chunkKey(chunk.coord.x, chunk.coord.y);
      if (nextChunks.has(key)) {
        throw new Error(`residentChunks must not contain duplicate chunk coord ${key}`);
      }

      nextChunks.set(key, chunk);
      if (chunk.lightDirty) {
        nextDirtyLightChunkKeys.add(key);
      }
    }

    const nextEditedChunkTiles = new Map<string, Map<number, number>>();
    const nextEditedChunkLiquidLevels = new Map<string, Map<number, number>>();
    const seenEditedChunkKeys = new Set<string>();
    for (const [index, editedChunkSnapshot] of snapshot.editedChunks.entries()) {
      const state = decodeEditedChunkSnapshot(editedChunkSnapshot);
      const key = chunkKey(state.coord.x, state.coord.y);
      if (seenEditedChunkKeys.has(key)) {
        throw new Error(`editedChunks must not contain duplicate chunk coord ${key}`);
      }

      seenEditedChunkKeys.add(key);

      const residentChunk = nextChunks.get(key);
      if (residentChunk) {
        expectEditedChunkStateMatchesResidentChunk(residentChunk, state, `editedChunks[${index}]`);
      }

      if (state.tileOverrides.size > 0) {
        nextEditedChunkTiles.set(key, new Map(state.tileOverrides));
      }
      if (state.liquidLevelOverrides.size > 0) {
        nextEditedChunkLiquidLevels.set(key, new Map(state.liquidLevelOverrides));
      }
    }

    this.chunks = nextChunks;
    this.editedChunkTiles = nextEditedChunkTiles;
    this.editedChunkLiquidLevels = nextEditedChunkLiquidLevels;
    this.dirtyLightChunkKeys = nextDirtyLightChunkKeys;
    this.activeLiquidChunkKeys = collectActiveLiquidChunkKeys(nextChunks);
    this.liquidSimulationTick = expectLiquidSimulationTick(snapshot.liquidSimulationTick);
    this.lastLiquidSimulationStats = createLiquidSimulationStats();
  }

  getChunks(): IterableIterator<Chunk> {
    return this.chunks.values();
  }

  getChunkCount(): number {
    return this.chunks.size;
  }

  getActiveLiquidChunkCount(): number {
    return this.activeLiquidChunkKeys.size;
  }

  getActiveLiquidChunkBounds(): ChunkBounds | null {
    let bounds: ChunkBounds | null = null;
    for (const key of this.activeLiquidChunkKeys) {
      const coord = parseChunkCoordFromKey(key);
      if (!bounds) {
        bounds = {
          minChunkX: coord.x,
          minChunkY: coord.y,
          maxChunkX: coord.x,
          maxChunkY: coord.y
        };
        continue;
      }

      if (coord.x < bounds.minChunkX) bounds.minChunkX = coord.x;
      if (coord.y < bounds.minChunkY) bounds.minChunkY = coord.y;
      if (coord.x > bounds.maxChunkX) bounds.maxChunkX = coord.x;
      if (coord.y > bounds.maxChunkY) bounds.maxChunkY = coord.y;
    }

    return bounds;
  }

  pruneChunksOutside(bounds: ChunkBounds): number {
    let removed = 0;
    for (const [key, chunk] of this.chunks) {
      if (chunkBoundsContains(bounds, chunk.coord.x, chunk.coord.y)) continue;
      this.chunks.delete(key);
      this.dirtyLightChunkKeys.delete(key);
      this.activeLiquidChunkKeys.delete(key);
      removed += 1;
    }
    return removed;
  }
}
