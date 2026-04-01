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
import { hasStarterTorchFaceSupport, STARTER_TORCH_TILE_ID } from './starterTorchPlacement';
import {
  hasStarterBedGroundSupport,
  isStarterBedTileId,
  resolvePlacedStarterBedAnchor,
  resolveStarterBedAnchor
} from './starterBedPlacement';
import {
  hasStarterDoorDoorwaySupport,
  isStarterDoorTileId,
  resolveStarterDoorPairAnchor,
  resolveStarterDoorToggleTarget
} from './starterDoorPlacement';
import {
  hasStarterWorkbenchGroundSupport,
  STARTER_WORKBENCH_TILE_ID
} from './starterWorkbenchPlacement';
import {
  hasStarterFurnaceGroundSupport,
  STARTER_FURNACE_TILE_ID
} from './starterFurnacePlacement';
import {
  hasStarterAnvilGroundSupport,
  STARTER_ANVIL_TILE_ID
} from './starterAnvilPlacement';
import { resolveSmallTreeGrowthStageAtAnchor } from './smallTreeAnchors';
import { clearSmallTreeGrowthStageAtAnchor } from './smallTreeFootprintWrites';
import {
  PROCEDURAL_DIRT_TILE_ID,
  PROCEDURAL_GRASS_SURFACE_TILE_ID,
  resolveProceduralTerrainColumn,
  resolveProceduralTerrainLayers,
  resolveProceduralTerrainTileId
} from './proceduralTerrain';
import { DEFAULT_WORLD_SEED, normalizeWorldSeed } from './worldSeed';
import {
  doesTileBlockLight,
  getTileEmissiveLightLevel,
  getTileLiquidKind,
  isTileOneWayPlatform,
  isTileSolid
} from './tileMetadata';
import { isSmallTreeTileId } from './smallTreeTiles';
import { isSurfaceFlowerTileId } from './surfaceFlowerTiles';
import { isTallGrassTileId } from './tallGrassTiles';
import type { TileMetadataRegistry } from './tileMetadata';
import type { Chunk, ChunkCoord } from './types';

export interface TileEditEvent {
  worldTileX: number;
  worldTileY: number;
  chunkX: number;
  chunkY: number;
  localX: number;
  localY: number;
  previousTileId: number;
  previousLiquidLevel: number;
  tileId: number;
  liquidLevel: number;
  editOrigin: WorldEditOrigin;
}

export interface WallEditEvent {
  worldTileX: number;
  worldTileY: number;
  chunkX: number;
  chunkY: number;
  localX: number;
  localY: number;
  previousWallId: number;
  wallId: number;
  editOrigin: WorldEditOrigin;
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
  downwardActiveChunksScanned: number;
  sidewaysCandidateChunksScanned: number;
  sidewaysPairsTested: number;
  downwardTransfersApplied: number;
  sidewaysTransfersApplied: number;
}

export type LiquidStepPhaseSummary = 'none' | 'downward' | 'sideways' | 'both';
export type WorldEditOrigin = 'gameplay' | 'debug-break' | 'debug-history';

export interface TileWorldSnapshot {
  worldSeed: number;
  liquidSimulationTick: number;
  residentChunks: ResidentChunkSnapshot[];
  editedChunks: EditedChunkSnapshot[];
}

type TileEditListener = (event: TileEditEvent) => void;
type WallEditListener = (event: WallEditEvent) => void;

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
  downwardActiveChunksScanned: 0,
  sidewaysCandidateChunksScanned: 0,
  sidewaysPairsTested: 0,
  downwardTransfersApplied: 0,
  sidewaysTransfersApplied: 0
});

const CARDINAL_NEIGHBOR_OFFSETS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 }
] as const;

export const resolveLiquidStepPhaseSummary = (
  stats: LiquidSimulationStats
): LiquidStepPhaseSummary => {
  const hadDownwardTransfer = stats.downwardTransfersApplied > 0;
  const hadSidewaysTransfer = stats.sidewaysTransfersApplied > 0;

  if (hadDownwardTransfer && hadSidewaysTransfer) {
    return 'both';
  }
  if (hadDownwardTransfer) {
    return 'downward';
  }
  if (hadSidewaysTransfer) {
    return 'sideways';
  }
  return 'none';
};

// Sideways equalization alternates horizontal-pair parity every tick, so liquid chunks
// need two quiet steps before they can safely sleep without skipping the opposite parity.
const LIQUID_CHUNK_SLEEP_QUIET_STEP_THRESHOLD = 2;

const chunkContainsLiquid = (chunk: Chunk): boolean => {
  for (let index = 0; index < chunk.liquidLevels.length; index += 1) {
    if ((chunk.liquidLevels[index] ?? 0) > 0) {
      return true;
    }
  }

  return false;
};

const collectResidentLiquidChunkKeys = (chunks: ReadonlyMap<string, Chunk>): Set<string> => {
  const residentLiquidChunkKeys = new Set<string>();
  for (const [key, chunk] of chunks) {
    if (chunkContainsLiquid(chunk)) {
      residentLiquidChunkKeys.add(key);
    }
  }

  return residentLiquidChunkKeys;
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

const resolveChunkBoundsFromKeys = (chunkKeys: Iterable<string>): ChunkBounds | null => {
  let bounds: ChunkBounds | null = null;
  for (const key of chunkKeys) {
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
};

const resolveSleepingLiquidChunkBoundsFromKeys = (
  residentLiquidChunkKeys: ReadonlySet<string>,
  activeLiquidChunkKeys: ReadonlySet<string>
): ChunkBounds | null => {
  let bounds: ChunkBounds | null = null;
  for (const key of residentLiquidChunkKeys) {
    if (activeLiquidChunkKeys.has(key)) {
      continue;
    }

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
};

const createChunkWallIds = (): Uint8Array => new Uint8Array(CHUNK_SIZE * CHUNK_SIZE);
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

const expectInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }

  return value;
};

const doesTileBlockOpenSky = (tileId: number): boolean => {
  if (tileId === 0) {
    return false;
  }

  // Decorative vegetation should not count as a roof over surface critter habitat.
  return (
    isTileSolid(tileId) ||
    (!isSmallTreeTileId(tileId) && !isTallGrassTileId(tileId) && !isSurfaceFlowerTileId(tileId))
  );
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

  for (const [tileIndex, wallId] of state.wallOverrides) {
    if ((chunk.wallIds[tileIndex] ?? 0) !== wallId) {
      throw new Error(`${label}.wallOverrides must match resident chunk wall ${tileIndex}`);
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
  private worldSeed: number;
  private chunks = new Map<string, Chunk>();
  private editedChunkTiles = new Map<string, Map<number, number>>();
  private editedChunkWalls = new Map<string, Map<number, number>>();
  private editedChunkLiquidLevels = new Map<string, Map<number, number>>();
  private tileEditListeners = new Set<TileEditListener>();
  private wallEditListeners = new Set<WallEditListener>();
  private dirtyLightChunkKeys = new Set<string>();
  private residentLiquidChunkKeys = new Set<string>();
  private activeLiquidChunkKeys = new Set<string>();
  private liquidChunkQuietStepCounts = new Map<string, number>();
  private liquidSimulationTick = 0;
  private lastLiquidSimulationStats = createLiquidSimulationStats();
  private lastSidewaysLiquidCandidateChunkBounds: ChunkBounds | null = null;

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

  private getResidentOrEditedTileId(worldTileX: number, worldTileY: number): number | null {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const key = chunkKey(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const residentTileId = this.getResidentTileId(worldTileX, worldTileY);
    if (residentTileId !== null) {
      return residentTileId;
    }

    return this.editedChunkTiles.get(key)?.get(tileIndex) ?? null;
  }

  private getResolvedTileIdWithoutEnsuringChunk(worldTileX: number, worldTileY: number): number {
    const residentOrEditedTileId = this.getResidentOrEditedTileId(worldTileX, worldTileY);
    if (residentOrEditedTileId !== null) {
      return residentOrEditedTileId;
    }

    return resolveProceduralTerrainTileId(worldTileX, worldTileY, this.worldSeed);
  }

  private setEditedTileStateWithoutEnsuringChunk(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    liquidLevel: number
  ): boolean {
    const normalizedLiquidLevel = expectLiquidLevel(tileId, liquidLevel);
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const residentChunk = this.getResidentChunk(chunkX, chunkY);
    if (residentChunk) {
      return this.commitTileState(worldTileX, worldTileY, tileId, normalizedLiquidLevel, false).changed;
    }

    const key = chunkKey(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const previousTileId = this.getResolvedTileIdWithoutEnsuringChunk(worldTileX, worldTileY);
    const previousLiquidLevel = this.editedChunkLiquidLevels.get(key)?.get(tileIndex) ?? 0;
    if (previousTileId === tileId && previousLiquidLevel === normalizedLiquidLevel) {
      return false;
    }

    this.updateEditedChunkTileState(key, tileIndex, worldTileX, worldTileY, tileId, normalizedLiquidLevel);
    return true;
  }

  private clearMalformedStarterDoorRemnantsFromLoadedSnapshot(): void {
    const candidateCoords: Array<{ worldTileX: number; worldTileY: number }> = [];
    const seenCoords = new Set<string>();
    const collectDoorCoord = (worldTileX: number, worldTileY: number): void => {
      const coordKey = `${worldTileX},${worldTileY}`;
      if (seenCoords.has(coordKey)) {
        return;
      }

      seenCoords.add(coordKey);
      candidateCoords.push({ worldTileX, worldTileY });
    };

    for (const chunk of this.chunks.values()) {
      const chunkWorldTileX = chunk.coord.x * CHUNK_SIZE;
      const chunkWorldTileY = chunk.coord.y * CHUNK_SIZE;
      for (let tileIndex = 0; tileIndex < chunk.tiles.length; tileIndex += 1) {
        const tileId = chunk.tiles[tileIndex] ?? 0;
        if (!isStarterDoorTileId(tileId)) {
          continue;
        }

        collectDoorCoord(
          chunkWorldTileX + (tileIndex % CHUNK_SIZE),
          chunkWorldTileY + Math.floor(tileIndex / CHUNK_SIZE)
        );
      }
    }

    for (const [key, editedTiles] of this.editedChunkTiles) {
      const coord = parseChunkCoordFromKey(key);
      const chunkWorldTileX = coord.x * CHUNK_SIZE;
      const chunkWorldTileY = coord.y * CHUNK_SIZE;
      for (const [tileIndex, tileId] of editedTiles) {
        if (!isStarterDoorTileId(tileId)) {
          continue;
        }

        collectDoorCoord(
          chunkWorldTileX + (tileIndex % CHUNK_SIZE),
          chunkWorldTileY + Math.floor(tileIndex / CHUNK_SIZE)
        );
      }
    }

    const doorWorldView = {
      getTile: (tileX: number, tileY: number) => this.getResolvedTileIdWithoutEnsuringChunk(tileX, tileY)
    };
    for (const { worldTileX, worldTileY } of candidateCoords) {
      const tileId = this.getResidentOrEditedTileId(worldTileX, worldTileY);
      if (!isStarterDoorTileId(tileId ?? 0)) {
        continue;
      }
      if (resolveStarterDoorToggleTarget(doorWorldView, worldTileX, worldTileY) !== null) {
        continue;
      }

      this.setEditedTileStateWithoutEnsuringChunk(worldTileX, worldTileY, 0, 0);
    }
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
    const generatedTileId = resolveProceduralTerrainTileId(worldTileX, worldTileY, this.worldSeed);
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

  private updateEditedChunkWallState(
    key: string,
    tileIndex: number,
    worldTileX: number,
    worldTileY: number,
    wallId: number
  ): void {
    const generatedWallId = resolveProceduralTerrainLayers(worldTileX, worldTileY, this.worldSeed).wallId;
    if (wallId === generatedWallId) {
      const editedWalls = this.editedChunkWalls.get(key);
      editedWalls?.delete(tileIndex);
      if (editedWalls && editedWalls.size === 0) {
        this.editedChunkWalls.delete(key);
      }
      return;
    }

    let editedWalls = this.editedChunkWalls.get(key);
    if (!editedWalls) {
      editedWalls = new Map<number, number>();
      this.editedChunkWalls.set(key, editedWalls);
    }
    editedWalls.set(tileIndex, wallId);
  }

  private collectEditedChunkSnapshotStates(): EditedChunkSnapshotState[] {
    const editedChunkKeys = new Set<string>([
      ...this.editedChunkTiles.keys(),
      ...this.editedChunkWalls.keys(),
      ...this.editedChunkLiquidLevels.keys()
    ]);
    const states: EditedChunkSnapshotState[] = [];

    for (const key of editedChunkKeys) {
      states.push({
        coord: parseChunkCoordFromKey(key),
        tileOverrides: new Map(this.editedChunkTiles.get(key)),
        wallOverrides: new Map(this.editedChunkWalls.get(key)),
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
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
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
    }

    if (emitTileEditEvent) {
      const event: TileEditEvent = {
        worldTileX,
        worldTileY,
        chunkX,
        chunkY,
        localX,
        localY,
        previousTileId,
        previousLiquidLevel,
        tileId,
        liquidLevel: normalizedLiquidLevel,
        editOrigin
      };

      for (const listener of this.tileEditListeners) {
        listener(event);
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
      this.residentLiquidChunkKeys.add(key);
      this.activateLiquidChunk(key);
      return;
    }

    if (previousLiquidLevel > 0 && !chunkContainsLiquid(chunk)) {
      this.residentLiquidChunkKeys.delete(key);
      this.deactivateLiquidChunk(key);
    }
  }

  private clearUnsupportedAdjacentStarterTorches(
    worldTileX: number,
    worldTileY: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    for (const offset of CARDINAL_NEIGHBOR_OFFSETS) {
      const adjacentWorldTileX = worldTileX + offset.x;
      const adjacentWorldTileY = worldTileY + offset.y;
      if (
        this.getResidentOrEditedTileId(adjacentWorldTileX, adjacentWorldTileY) !== STARTER_TORCH_TILE_ID
      ) {
        continue;
      }
      if (hasStarterTorchFaceSupport(this, adjacentWorldTileX, adjacentWorldTileY)) {
        continue;
      }

      this.commitTileState(adjacentWorldTileX, adjacentWorldTileY, 0, 0, emitTileEditEvent, editOrigin);
    }
  }

  private clearUnsupportedAdjacentStarterWorkbenches(
    worldTileX: number,
    worldTileY: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    const supportedWorkbenchWorldTileX = worldTileX;
    const supportedWorkbenchWorldTileY = worldTileY - 1;
    if (
      this.getResidentOrEditedTileId(supportedWorkbenchWorldTileX, supportedWorkbenchWorldTileY) !==
      STARTER_WORKBENCH_TILE_ID
    ) {
      return;
    }
    if (
      hasStarterWorkbenchGroundSupport(
        this,
        supportedWorkbenchWorldTileX,
        supportedWorkbenchWorldTileY
      )
    ) {
      return;
    }

    this.commitTileState(
      supportedWorkbenchWorldTileX,
      supportedWorkbenchWorldTileY,
      0,
      0,
      emitTileEditEvent,
      editOrigin
    );
  }

  private clearUnsupportedAdjacentStarterBeds(
    worldTileX: number,
    worldTileY: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    const bedWorldView = {
      getTile: (tileX: number, tileY: number) => this.getResolvedTileIdWithoutEnsuringChunk(tileX, tileY)
    };
    const candidateAnchors = [
      { leftTileX: worldTileX, tileY: worldTileY - 1 },
      { leftTileX: worldTileX - 1, tileY: worldTileY - 1 }
    ];
    const visitedAnchors = new Set<string>();

    for (const candidate of candidateAnchors) {
      const anchorKey = `${candidate.leftTileX},${candidate.tileY}`;
      if (visitedAnchors.has(anchorKey)) {
        continue;
      }
      visitedAnchors.add(anchorKey);

      const bedAnchor = resolvePlacedStarterBedAnchor(
        bedWorldView,
        candidate.leftTileX,
        candidate.tileY
      );
      if (bedAnchor === null) {
        continue;
      }
      if (hasStarterBedGroundSupport(bedWorldView, bedAnchor.leftTileX, bedAnchor.tileY)) {
        continue;
      }

      this.commitTileState(
        bedAnchor.leftTileX + 1,
        bedAnchor.tileY,
        0,
        0,
        emitTileEditEvent,
        editOrigin
      );
      this.commitTileState(
        bedAnchor.leftTileX,
        bedAnchor.tileY,
        0,
        0,
        emitTileEditEvent,
        editOrigin
      );
    }
  }

  private clearUnsupportedAdjacentStarterDoors(
    worldTileX: number,
    worldTileY: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    const doorWorldView = {
      getTile: (tileX: number, tileY: number) => this.getResolvedTileIdWithoutEnsuringChunk(tileX, tileY)
    };
    // One changed support tile can only affect the doorway directly above it or one tile to either
    // side across the door's two vertical rows.
    const candidateAnchors = [
      { tileX: worldTileX, bottomTileY: worldTileY - 1 },
      { tileX: worldTileX - 1, bottomTileY: worldTileY },
      { tileX: worldTileX - 1, bottomTileY: worldTileY + 1 },
      { tileX: worldTileX + 1, bottomTileY: worldTileY },
      { tileX: worldTileX + 1, bottomTileY: worldTileY + 1 }
    ];
    const visitedAnchors = new Set<string>();

    for (const candidate of candidateAnchors) {
      const anchorKey = `${candidate.tileX},${candidate.bottomTileY}`;
      if (visitedAnchors.has(anchorKey)) {
        continue;
      }
      visitedAnchors.add(anchorKey);

      const doorPair = resolveStarterDoorToggleTarget(
        doorWorldView,
        candidate.tileX,
        candidate.bottomTileY
      );
      if (doorPair === null) {
        continue;
      }
      if (hasStarterDoorDoorwaySupport(doorWorldView, doorPair.tileX, doorPair.bottomTileY)) {
        continue;
      }

      this.commitTileState(
        doorPair.tileX,
        doorPair.bottomTileY - 1,
        0,
        0,
        emitTileEditEvent,
        editOrigin
      );
      this.commitTileState(
        doorPair.tileX,
        doorPair.bottomTileY,
        0,
        0,
        emitTileEditEvent,
        editOrigin
      );
    }
  }

  private clearOrphanedStarterBedMateIfNeeded(
    worldTileX: number,
    worldTileY: number,
    previousTileId: number,
    nextTileId: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    if (!isStarterBedTileId(previousTileId) || isStarterBedTileId(nextTileId)) {
      return;
    }

    const bedAnchor = resolveStarterBedAnchor(worldTileX, worldTileY, previousTileId);
    if (bedAnchor === null) {
      return;
    }

    const mateTileX =
      bedAnchor.leftTileX === worldTileX ? bedAnchor.leftTileX + 1 : bedAnchor.leftTileX;
    if (!isStarterBedTileId(this.getResolvedTileIdWithoutEnsuringChunk(mateTileX, bedAnchor.tileY))) {
      return;
    }

    this.setTile(mateTileX, bedAnchor.tileY, 0, editOrigin);
  }

  private clearOrphanedStarterDoorMateIfNeeded(
    worldTileX: number,
    worldTileY: number,
    previousTileId: number,
    nextTileId: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    if (!isStarterDoorTileId(previousTileId) || isStarterDoorTileId(nextTileId)) {
      return;
    }

    const pairAnchor = resolveStarterDoorPairAnchor(worldTileX, worldTileY, previousTileId);
    if (pairAnchor === null) {
      return;
    }

    const mateTileY =
      pairAnchor.bottomTileY === worldTileY ? pairAnchor.bottomTileY - 1 : pairAnchor.bottomTileY;
    if (!isStarterDoorTileId(this.getResolvedTileIdWithoutEnsuringChunk(pairAnchor.tileX, mateTileY))) {
      return;
    }

    this.setTile(pairAnchor.tileX, mateTileY, 0, editOrigin);
  }

  private clearUnsupportedAdjacentStarterFurnaces(
    worldTileX: number,
    worldTileY: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    const supportedFurnaceWorldTileX = worldTileX;
    const supportedFurnaceWorldTileY = worldTileY - 1;
    if (
      this.getResidentOrEditedTileId(supportedFurnaceWorldTileX, supportedFurnaceWorldTileY) !==
      STARTER_FURNACE_TILE_ID
    ) {
      return;
    }
    if (
      hasStarterFurnaceGroundSupport(
        this,
        supportedFurnaceWorldTileX,
        supportedFurnaceWorldTileY
      )
    ) {
      return;
    }

    this.commitTileState(
      supportedFurnaceWorldTileX,
      supportedFurnaceWorldTileY,
      0,
      0,
      emitTileEditEvent,
      editOrigin
    );
  }

  private clearUnsupportedAdjacentStarterAnvils(
    worldTileX: number,
    worldTileY: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    const supportedAnvilWorldTileX = worldTileX;
    const supportedAnvilWorldTileY = worldTileY - 1;
    if (
      this.getResidentOrEditedTileId(supportedAnvilWorldTileX, supportedAnvilWorldTileY) !==
      STARTER_ANVIL_TILE_ID
    ) {
      return;
    }
    if (
      hasStarterAnvilGroundSupport(
        this,
        supportedAnvilWorldTileX,
        supportedAnvilWorldTileY
      )
    ) {
      return;
    }

    this.commitTileState(
      supportedAnvilWorldTileX,
      supportedAnvilWorldTileY,
      0,
      0,
      emitTileEditEvent,
      editOrigin
    );
  }

  private clearUnsupportedSmallTreeAtAnchor(
    anchorTileX: number,
    anchorTileY: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    if (this.getTile(anchorTileX, anchorTileY) === PROCEDURAL_GRASS_SURFACE_TILE_ID) {
      return;
    }

    const growthStage = resolveSmallTreeGrowthStageAtAnchor(
      {
        getTile: (worldTileX, worldTileY) => this.getResidentOrEditedTileId(worldTileX, worldTileY) ?? 0
      },
      anchorTileX,
      anchorTileY
    );
    if (growthStage === null) {
      return;
    }

    clearSmallTreeGrowthStageAtAnchor(
      {
        getTile: (worldTileX, worldTileY) => this.getTile(worldTileX, worldTileY),
        setTile: (worldTileX, worldTileY, tileId) =>
          this.commitTileState(worldTileX, worldTileY, tileId, 0, emitTileEditEvent, editOrigin)
            .changed
      },
      anchorTileX,
      anchorTileY,
      growthStage
    );
  }

  private clearUnsupportedSurfaceDecorationAtAnchor(
    anchorTileX: number,
    anchorTileY: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    if (this.getResolvedTileIdWithoutEnsuringChunk(anchorTileX, anchorTileY) === PROCEDURAL_GRASS_SURFACE_TILE_ID) {
      return;
    }

    const coverTileY = anchorTileY - 1;
    const coverTileId = this.getResolvedTileIdWithoutEnsuringChunk(anchorTileX, coverTileY);
    if (!isTallGrassTileId(coverTileId) && !isSurfaceFlowerTileId(coverTileId)) {
      return;
    }

    const { chunkX, chunkY } = worldToChunkCoord(anchorTileX, coverTileY);
    if (this.getResidentChunk(chunkX, chunkY)) {
      this.setTile(anchorTileX, coverTileY, 0, editOrigin);
      return;
    }

    this.setEditedTileStateWithoutEnsuringChunk(anchorTileX, coverTileY, 0, 0);
  }

  private clearSmallTreeAboveBuriedGrassIfNeeded(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    emitTileEditEvent: boolean,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    if (!isTileSolid(tileId)) {
      return;
    }

    const buriedGrassAnchorTileY = worldTileY + 1;
    if (
      this.getResolvedTileIdWithoutEnsuringChunk(worldTileX, buriedGrassAnchorTileY) !==
      PROCEDURAL_GRASS_SURFACE_TILE_ID
    ) {
      return;
    }

    const growthStage = resolveSmallTreeGrowthStageAtAnchor(
      {
        getTile: (sampleWorldTileX, sampleWorldTileY) =>
          this.getResolvedTileIdWithoutEnsuringChunk(sampleWorldTileX, sampleWorldTileY)
      },
      worldTileX,
      buriedGrassAnchorTileY
    );
    if (growthStage === null) {
      return;
    }

    clearSmallTreeGrowthStageAtAnchor(
      {
        getTile: (sampleWorldTileX, sampleWorldTileY) => this.getTile(sampleWorldTileX, sampleWorldTileY),
        setTile: (sampleWorldTileX, sampleWorldTileY, nextTileId) =>
          this.commitTileState(
            sampleWorldTileX,
            sampleWorldTileY,
            nextTileId,
            0,
            emitTileEditEvent,
            editOrigin
          ).changed
      },
      worldTileX,
      buriedGrassAnchorTileY,
      growthStage
    );
  }

  private revertBuriedGrassBelow(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): void {
    if (!isTileSolid(tileId)) {
      return;
    }

    const buriedGrassTileY = worldTileY + 1;
    if (
      this.getResolvedTileIdWithoutEnsuringChunk(worldTileX, buriedGrassTileY) !==
      PROCEDURAL_GRASS_SURFACE_TILE_ID
    ) {
      return;
    }

    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, buriedGrassTileY);
    if (this.getResidentChunk(chunkX, chunkY)) {
      this.setTile(worldTileX, buriedGrassTileY, PROCEDURAL_DIRT_TILE_ID, editOrigin);
      return;
    }

    this.setEditedTileStateWithoutEnsuringChunk(worldTileX, buriedGrassTileY, PROCEDURAL_DIRT_TILE_ID, 0);
  }

  private activateLiquidChunk(key: string): void {
    this.activeLiquidChunkKeys.add(key);
    this.liquidChunkQuietStepCounts.set(key, 0);
  }

  private deactivateLiquidChunk(key: string): void {
    this.activeLiquidChunkKeys.delete(key);
    this.liquidChunkQuietStepCounts.delete(key);
  }

  private wakeResidentLiquidChunk(
    chunkX: number,
    chunkY: number,
    disturbedChunkKeys?: Set<string>
  ): void {
    const key = chunkKey(chunkX, chunkY);
    const chunk = this.chunks.get(key);
    if (!chunk || !this.residentLiquidChunkKeys.has(key)) {
      return;
    }

    this.activateLiquidChunk(key);
    disturbedChunkKeys?.add(key);
  }

  private wakeNearbyResidentLiquidChunks(
    worldTileX: number,
    worldTileY: number,
    disturbedChunkKeys?: Set<string>
  ): void {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    this.wakeResidentLiquidChunk(chunkX, chunkY, disturbedChunkKeys);
    this.wakeResidentLiquidChunk(chunkX - 1, chunkY, disturbedChunkKeys);
    this.wakeResidentLiquidChunk(chunkX + 1, chunkY, disturbedChunkKeys);
    this.wakeResidentLiquidChunk(chunkX, chunkY - 1, disturbedChunkKeys);
    this.wakeResidentLiquidChunk(chunkX, chunkY + 1, disturbedChunkKeys);
  }

  private updateActiveLiquidChunkSleepState(
    startingActiveChunkKeys: ReadonlySet<string>,
    disturbedChunkKeys: ReadonlySet<string>
  ): void {
    for (const key of startingActiveChunkKeys) {
      const chunk = this.chunks.get(key);
      if (!chunk || !this.residentLiquidChunkKeys.has(key)) {
        this.residentLiquidChunkKeys.delete(key);
        this.deactivateLiquidChunk(key);
        continue;
      }

      if (disturbedChunkKeys.has(key)) {
        this.activateLiquidChunk(key);
        continue;
      }

      const nextQuietStepCount = (this.liquidChunkQuietStepCounts.get(key) ?? 0) + 1;
      if (nextQuietStepCount >= LIQUID_CHUNK_SLEEP_QUIET_STEP_THRESHOLD) {
        this.deactivateLiquidChunk(key);
        continue;
      }

      this.activeLiquidChunkKeys.add(key);
      this.liquidChunkQuietStepCounts.set(key, nextQuietStepCount);
    }
  }

  private applyLiquidTransfer(
    transfer: LiquidTransfer,
    disturbedChunkKeys?: Set<string>
  ): boolean {
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
    if (sourceChanged || targetChanged) {
      this.wakeNearbyResidentLiquidChunks(
        transfer.fromWorldTileX,
        transfer.fromWorldTileY,
        disturbedChunkKeys
      );
      this.wakeNearbyResidentLiquidChunks(
        transfer.toWorldTileX,
        transfer.toWorldTileY,
        disturbedChunkKeys
      );
    }
    return sourceChanged || targetChanged;
  }

  constructor(radius = 3, worldSeed = DEFAULT_WORLD_SEED) {
    this.worldSeed = normalizeWorldSeed(worldSeed);
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
    const wallIds = createChunkWallIds();
    const liquidLevels = createChunkLiquidLevels();
    for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
      for (let localX = 0; localX < CHUNK_SIZE; localX += 1) {
        const worldX = normalizedChunkX * CHUNK_SIZE + localX;
        const worldY = normalizedChunkY * CHUNK_SIZE + localY;
        const tileIndex = toTileIndex(localX, localY);
        const { tileId, wallId } = resolveProceduralTerrainLayers(worldX, worldY, this.worldSeed);
        tiles[tileIndex] = tileId;
        wallIds[tileIndex] = wallId;
      }
    }

    const editedTiles = this.editedChunkTiles.get(key);
    const editedWalls = this.editedChunkWalls.get(key);
    const editedLiquidLevels = this.editedChunkLiquidLevels.get(key);
    if (editedTiles) {
      for (const [tileIndex, tileId] of editedTiles) {
        tiles[tileIndex] = tileId;
        if (getTileLiquidKind(tileId) !== null) {
          liquidLevels[tileIndex] = editedLiquidLevels?.get(tileIndex) ?? MAX_LIQUID_LEVEL;
        }
      }
    }

    if (editedWalls) {
      for (const [tileIndex, wallId] of editedWalls) {
        wallIds[tileIndex] = wallId;
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
      wallIds,
      liquidLevels,
      lightLevels: createChunkLightLevels(),
      lightDirty: true,
      lightDirtyColumnMask: ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK
    };
    this.chunks.set(key, chunk);
    this.dirtyLightChunkKeys.add(key);
    if (chunkContainsLiquid(chunk)) {
      this.residentLiquidChunkKeys.add(key);
      this.activateLiquidChunk(key);
    }
    return chunk;
  }

  hasChunk(chunkX: number, chunkY: number): boolean {
    return this.chunks.has(chunkKey(chunkX, chunkY));
  }

  getTile(worldTileX: number, worldTileY: number): number {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.tiles[toTileIndex(localX, localY)];
  }

  getWall(worldTileX: number, worldTileY: number): number {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    return chunk.wallIds[toTileIndex(localX, localY)] ?? 0;
  }

  hasOpenSkyAbove(worldTileX: number, standingTileY: number): boolean {
    const normalizedWorldTileX = expectInteger(worldTileX, 'worldTileX');
    const normalizedStandingTileY = expectInteger(standingTileY, 'standingTileY');
    const { chunkX } = worldToChunkCoord(normalizedWorldTileX, normalizedStandingTileY);
    const { localX } = worldToLocalTile(normalizedWorldTileX, normalizedStandingTileY);
    const { surfaceTileY } = resolveProceduralTerrainColumn(normalizedWorldTileX, this.worldSeed);

    for (
      let sampleWorldTileY = normalizedStandingTileY - 1;
      sampleWorldTileY >= surfaceTileY;
      sampleWorldTileY -= 1
    ) {
      if (
        doesTileBlockOpenSky(
          this.getResolvedTileIdWithoutEnsuringChunk(normalizedWorldTileX, sampleWorldTileY)
        )
      ) {
        return false;
      }
    }

    const maxSkyTileYExclusive = Math.min(normalizedStandingTileY, surfaceTileY);
    for (const chunk of this.chunks.values()) {
      if (chunk.coord.x !== chunkX) {
        continue;
      }

      const chunkStartWorldTileY = chunk.coord.y * CHUNK_SIZE;
      const maxLocalY = Math.min(CHUNK_SIZE - 1, maxSkyTileYExclusive - chunkStartWorldTileY - 1);
      if (maxLocalY < 0) {
        continue;
      }

      for (let localY = 0; localY <= maxLocalY; localY += 1) {
        if (doesTileBlockOpenSky(chunk.tiles[toTileIndex(localX, localY)] ?? 0)) {
          return false;
        }
      }
    }

    for (const [key, editedTiles] of this.editedChunkTiles) {
      if (this.chunks.has(key)) {
        continue;
      }

      const coord = parseChunkCoordFromKey(key);
      if (coord.x !== chunkX) {
        continue;
      }

      const chunkStartWorldTileY = coord.y * CHUNK_SIZE;
      const maxLocalY = Math.min(CHUNK_SIZE - 1, maxSkyTileYExclusive - chunkStartWorldTileY - 1);
      if (maxLocalY < 0) {
        continue;
      }

      for (const [tileIndex, tileId] of editedTiles) {
        if (!doesTileBlockOpenSky(tileId)) {
          continue;
        }

        const localTileY = Math.floor(tileIndex / CHUNK_SIZE);
        const localTileX = tileIndex % CHUNK_SIZE;
        if (localTileX === localX && localTileY <= maxLocalY) {
          return false;
        }
      }
    }

    return true;
  }

  setTile(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): boolean {
    if (this.getTile(worldTileX, worldTileY) === tileId) {
      return false;
    }

    const liquidKind = getTileLiquidKind(tileId);
    return this.setTileState(
      worldTileX,
      worldTileY,
      tileId,
      liquidKind === null ? 0 : MAX_LIQUID_LEVEL,
      editOrigin
    );
  }

  setTileState(
    worldTileX: number,
    worldTileY: number,
    tileId: number,
    liquidLevel: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): boolean {
    const normalizedLiquidLevel = expectLiquidLevel(tileId, liquidLevel);
    const previousTileId = this.getTile(worldTileX, worldTileY);
    const previousLiquidLevel = this.getLiquidLevel(worldTileX, worldTileY);
    if (previousTileId === tileId && previousLiquidLevel === normalizedLiquidLevel) {
      return false;
    }

    this.clearSmallTreeAboveBuriedGrassIfNeeded(
      worldTileX,
      worldTileY,
      tileId,
      true,
      editOrigin
    );

    const result = this.commitTileState(
      worldTileX,
      worldTileY,
      tileId,
      normalizedLiquidLevel,
      true,
      editOrigin
    );
    const changed = result.changed;
    if (changed) {
      const tileSolidnessChanged =
        result.tileIdChanged && isTileSolid(result.previousTileId) !== isTileSolid(tileId);
      const tileDoorwaySupportChanged =
        result.tileIdChanged &&
        (tileSolidnessChanged ||
          isTileOneWayPlatform(result.previousTileId) !== isTileOneWayPlatform(tileId));
      const tileBedGroundSupportRemoved =
        result.tileIdChanged &&
        (isTileSolid(result.previousTileId) || isTileOneWayPlatform(result.previousTileId)) &&
        !isTileSolid(tileId) &&
        !isTileOneWayPlatform(tileId);

      if (
        result.previousTileId === PROCEDURAL_GRASS_SURFACE_TILE_ID &&
        tileId !== PROCEDURAL_GRASS_SURFACE_TILE_ID
      ) {
        this.clearUnsupportedSurfaceDecorationAtAnchor(worldTileX, worldTileY, editOrigin);
        this.clearUnsupportedSmallTreeAtAnchor(worldTileX, worldTileY, true, editOrigin);
      }
      this.clearOrphanedStarterBedMateIfNeeded(
        worldTileX,
        worldTileY,
        result.previousTileId,
        tileId,
        editOrigin
      );
      this.clearOrphanedStarterDoorMateIfNeeded(
        worldTileX,
        worldTileY,
        result.previousTileId,
        tileId,
        editOrigin
      );
      if (tileSolidnessChanged) {
        this.clearUnsupportedAdjacentStarterTorches(worldTileX, worldTileY, true, editOrigin);
        this.clearUnsupportedAdjacentStarterWorkbenches(worldTileX, worldTileY, true, editOrigin);
        this.clearUnsupportedAdjacentStarterFurnaces(worldTileX, worldTileY, true, editOrigin);
        this.clearUnsupportedAdjacentStarterAnvils(worldTileX, worldTileY, true, editOrigin);
      }
      if (tileBedGroundSupportRemoved) {
        this.clearUnsupportedAdjacentStarterBeds(worldTileX, worldTileY, true, editOrigin);
      }
      if (tileDoorwaySupportChanged) {
        this.clearUnsupportedAdjacentStarterDoors(worldTileX, worldTileY, true, editOrigin);
      }
      this.revertBuriedGrassBelow(worldTileX, worldTileY, tileId, editOrigin);
      this.wakeNearbyResidentLiquidChunks(worldTileX, worldTileY);
    }

    return changed;
  }

  setWall(
    worldTileX: number,
    worldTileY: number,
    wallId: number,
    editOrigin: WorldEditOrigin = 'gameplay'
  ): boolean {
    const { chunkX, chunkY } = worldToChunkCoord(worldTileX, worldTileY);
    const key = chunkKey(chunkX, chunkY);
    const chunk = this.ensureChunk(chunkX, chunkY);
    const { localX, localY } = worldToLocalTile(worldTileX, worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const previousWallId = chunk.wallIds[tileIndex] ?? 0;
    if (previousWallId === wallId) {
      return false;
    }

    chunk.wallIds[tileIndex] = wallId;
    this.updateEditedChunkWallState(key, tileIndex, worldTileX, worldTileY, wallId);
    const event: WallEditEvent = {
      worldTileX,
      worldTileY,
      chunkX,
      chunkY,
      localX,
      localY,
      previousWallId,
      wallId,
      editOrigin
    };
    for (const listener of this.wallEditListeners) {
      listener(event);
    }
    return true;
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
      this.lastSidewaysLiquidCandidateChunkBounds = null;
      this.liquidSimulationTick = (this.liquidSimulationTick + 1) >>> 0;
      return false;
    }

    const startingActiveChunkKeys = new Set(this.activeLiquidChunkKeys);
    const disturbedChunkKeys = new Set<string>();
    const downwardCandidateChunkKeys = new Set(startingActiveChunkKeys);
    const downwardTransfers: LiquidTransfer[] = [];

    for (const [key, chunk] of this.chunks) {
      if (!downwardCandidateChunkKeys.has(key)) {
        continue;
      }

      stats.downwardActiveChunksScanned += 1;
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
      const applied = this.applyLiquidTransfer(transfer, disturbedChunkKeys);
      if (applied) {
        stats.downwardTransfersApplied += 1;
      }
      changed = applied || changed;
    }

    const sidewaysCandidateChunkKeys = collectSidewaysLiquidCandidateChunkKeys(
      this.chunks,
      this.activeLiquidChunkKeys
    );
    this.lastSidewaysLiquidCandidateChunkBounds = resolveChunkBoundsFromKeys(sidewaysCandidateChunkKeys);
    const horizontalPairParity = this.liquidSimulationTick & 1;
    for (const [key, chunk] of this.chunks) {
      if (!sidewaysCandidateChunkKeys.has(key)) {
        continue;
      }

      stats.sidewaysCandidateChunksScanned += 1;
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

          stats.sidewaysPairsTested += 1;

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
            ,
            disturbedChunkKeys
          );
          if (applied) {
            stats.sidewaysTransfersApplied += 1;
          }
          changed = applied || changed;
        }
      }
    }

    this.updateActiveLiquidChunkSleepState(startingActiveChunkKeys, disturbedChunkKeys);
    this.lastLiquidSimulationStats = stats;
    this.liquidSimulationTick = (this.liquidSimulationTick + 1) >>> 0;
    return changed;
  }

  getLastLiquidSimulationStats(): LiquidSimulationStats {
    return { ...this.lastLiquidSimulationStats };
  }

  getLastSidewaysLiquidCandidateChunkBounds(): ChunkBounds | null {
    return this.lastSidewaysLiquidCandidateChunkBounds === null
      ? null
      : { ...this.lastSidewaysLiquidCandidateChunkBounds };
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

  onWallEdited(listener: WallEditListener): () => void {
    this.wallEditListeners.add(listener);
    return () => {
      this.wallEditListeners.delete(listener);
    };
  }

  getWorldSeed(): number {
    return this.worldSeed;
  }

  createSnapshot(): TileWorldSnapshot {
    const residentChunks = Array.from(this.chunks.values())
      .sort((left, right) => compareChunkCoords(left.coord, right.coord))
      .map((chunk) => encodeResidentChunkSnapshot(chunk));
    const editedChunks = this.collectEditedChunkSnapshotStates().map((state) =>
      encodeEditedChunkSnapshot(state)
    );

    return {
      worldSeed: this.worldSeed,
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
    const nextEditedChunkWalls = new Map<string, Map<number, number>>();
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
      if (state.wallOverrides.size > 0) {
        nextEditedChunkWalls.set(key, new Map(state.wallOverrides));
      }
      if (state.liquidLevelOverrides.size > 0) {
        nextEditedChunkLiquidLevels.set(key, new Map(state.liquidLevelOverrides));
      }
    }

    const nextWorldSeed = normalizeWorldSeed(
      (snapshot as { worldSeed?: unknown }).worldSeed === undefined
        ? DEFAULT_WORLD_SEED
        : (snapshot as { worldSeed: number }).worldSeed
    );

    this.worldSeed = nextWorldSeed;
    this.chunks = nextChunks;
    this.editedChunkTiles = nextEditedChunkTiles;
    this.editedChunkWalls = nextEditedChunkWalls;
    this.editedChunkLiquidLevels = nextEditedChunkLiquidLevels;
    this.dirtyLightChunkKeys = nextDirtyLightChunkKeys;
    this.residentLiquidChunkKeys = collectResidentLiquidChunkKeys(nextChunks);
    this.activeLiquidChunkKeys = new Set(this.residentLiquidChunkKeys);
    this.liquidChunkQuietStepCounts = new Map(
      Array.from(this.activeLiquidChunkKeys, (key): [string, number] => [key, 0])
    );
    this.clearMalformedStarterDoorRemnantsFromLoadedSnapshot();
    this.liquidSimulationTick = expectLiquidSimulationTick(snapshot.liquidSimulationTick);
    this.lastLiquidSimulationStats = createLiquidSimulationStats();
    this.lastSidewaysLiquidCandidateChunkBounds = null;
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

  getSleepingLiquidChunkCount(): number {
    return Math.max(0, this.residentLiquidChunkKeys.size - this.activeLiquidChunkKeys.size);
  }

  getActiveLiquidChunkBounds(): ChunkBounds | null {
    return resolveChunkBoundsFromKeys(this.activeLiquidChunkKeys);
  }

  getSleepingLiquidChunkBounds(): ChunkBounds | null {
    return resolveSleepingLiquidChunkBoundsFromKeys(
      this.residentLiquidChunkKeys,
      this.activeLiquidChunkKeys
    );
  }

  pruneChunksOutside(bounds: ChunkBounds): number {
    let removed = 0;
    for (const [key, chunk] of this.chunks) {
      if (chunkBoundsContains(bounds, chunk.coord.x, chunk.coord.y)) continue;
      this.chunks.delete(key);
      this.dirtyLightChunkKeys.delete(key);
      this.residentLiquidChunkKeys.delete(key);
      this.deactivateLiquidChunk(key);
      removed += 1;
    }
    return removed;
  }
}
