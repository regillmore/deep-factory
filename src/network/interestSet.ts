import { TILE_SIZE } from '../world/constants';
import { chunkCoordBounds, chunkKey, expandChunkBounds } from '../world/chunkMath';
import type { ChunkBounds } from '../world/chunkMath';
import type { ChunkCoord } from '../world/types';
import type { NetworkVector2 } from './protocol';

type RecordLike = Record<string, unknown>;

export interface InterestSetViewport {
  x: number;
  y: number;
  zoom: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
}

export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface InterestSetEntityCandidate {
  id: number;
  position: NetworkVector2;
}

export interface CalculateClientInterestSetOptions {
  viewport: InterestSetViewport;
  entities?: Iterable<InterestSetEntityCandidate>;
  chunkPaddingChunks?: number;
  entityPaddingWorld?: number;
}

export interface ClientInterestSet {
  visibleWorldBounds: WorldBounds;
  entityWorldBounds: WorldBounds;
  visibleChunkBounds: ChunkBounds;
  chunkBounds: ChunkBounds;
  chunks: ChunkCoord[];
  entityIds: number[];
}

export interface ClientInterestSetDelta {
  enteredChunks: ChunkCoord[];
  exitedChunks: ChunkCoord[];
  enteredEntityIds: number[];
  exitedEntityIds: number[];
}

const isRecord = (value: unknown): value is RecordLike => typeof value === 'object' && value !== null;

const compareChunkCoords = (left: ChunkCoord, right: ChunkCoord): number =>
  left.y - right.y || left.x - right.x;

const expectFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectNonNegativeInteger = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return normalizedValue;
};

const expectPositiveNumber = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }

  return normalizedValue;
};

const expectNonNegativeNumber = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }

  return normalizedValue;
};

const normalizeVector2 = (value: unknown, label: string): NetworkVector2 => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    x: expectFiniteNumber(value.x, `${label}.x`),
    y: expectFiniteNumber(value.y, `${label}.y`)
  };
};

const normalizeViewport = (value: InterestSetViewport): InterestSetViewport => ({
  x: expectFiniteNumber(value.x, 'viewport.x'),
  y: expectFiniteNumber(value.y, 'viewport.y'),
  zoom: expectPositiveNumber(value.zoom, 'viewport.zoom'),
  viewportWidthPx: expectNonNegativeNumber(value.viewportWidthPx, 'viewport.viewportWidthPx'),
  viewportHeightPx: expectNonNegativeNumber(value.viewportHeightPx, 'viewport.viewportHeightPx')
});

const normalizeWorldBounds = (value: WorldBounds, label: string): WorldBounds => {
  const bounds = {
    minX: expectFiniteNumber(value.minX, `${label}.minX`),
    minY: expectFiniteNumber(value.minY, `${label}.minY`),
    maxX: expectFiniteNumber(value.maxX, `${label}.maxX`),
    maxY: expectFiniteNumber(value.maxY, `${label}.maxY`)
  };

  if (bounds.maxX < bounds.minX) {
    throw new Error(`${label}.maxX must be greater than or equal to ${label}.minX`);
  }
  if (bounds.maxY < bounds.minY) {
    throw new Error(`${label}.maxY must be greater than or equal to ${label}.minY`);
  }

  return bounds;
};

const normalizeEntityCandidate = (
  value: InterestSetEntityCandidate,
  label: string
): InterestSetEntityCandidate => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    id: expectNonNegativeInteger(value.id, `${label}.id`),
    position: normalizeVector2(value.position, `${label}.position`)
  };
};

const resolveChunkBoundsFromWorldBounds = (worldBounds: WorldBounds): ChunkBounds => {
  const bounds = normalizeWorldBounds(worldBounds, 'worldBounds');
  const minTileX = Math.floor(bounds.minX / TILE_SIZE);
  const minTileY = Math.floor(bounds.minY / TILE_SIZE);
  const maxTileX = Math.ceil(bounds.maxX / TILE_SIZE);
  const maxTileY = Math.ceil(bounds.maxY / TILE_SIZE);
  return chunkCoordBounds(minTileX, minTileY, maxTileX, maxTileY);
};

const expandWorldBounds = (worldBounds: WorldBounds, paddingWorld: number): WorldBounds => {
  const bounds = normalizeWorldBounds(worldBounds, 'worldBounds');
  const padding = expectNonNegativeNumber(paddingWorld, 'entityPaddingWorld');
  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding
  };
};

const collectChunkCoords = (bounds: ChunkBounds): ChunkCoord[] => {
  const coords: ChunkCoord[] = [];
  for (let chunkY = bounds.minChunkY; chunkY <= bounds.maxChunkY; chunkY += 1) {
    for (let chunkX = bounds.minChunkX; chunkX <= bounds.maxChunkX; chunkX += 1) {
      coords.push({ x: chunkX, y: chunkY });
    }
  }
  return coords;
};

const isPositionWithinBounds = (position: NetworkVector2, bounds: WorldBounds): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY;

const collectRelevantEntityIds = (
  entities: Iterable<InterestSetEntityCandidate> | undefined,
  entityWorldBounds: WorldBounds
): number[] => {
  const relevantEntityIds: number[] = [];
  const seenEntityIds = new Set<number>();
  let index = 0;

  for (const entityValue of entities ?? []) {
    const entity = normalizeEntityCandidate(entityValue, `entities[${index}]`);
    if (seenEntityIds.has(entity.id)) {
      throw new Error(`entities must not contain duplicate id ${entity.id}`);
    }
    seenEntityIds.add(entity.id);
    if (isPositionWithinBounds(entity.position, entityWorldBounds)) {
      relevantEntityIds.push(entity.id);
    }
    index += 1;
  }

  return relevantEntityIds.sort((left, right) => left - right);
};

const diffChunkCoords = (
  previousChunks: readonly ChunkCoord[],
  nextChunks: readonly ChunkCoord[]
): { entered: ChunkCoord[]; exited: ChunkCoord[] } => {
  const previousKeys = new Set(previousChunks.map((coord) => chunkKey(coord.x, coord.y)));
  const nextKeys = new Set(nextChunks.map((coord) => chunkKey(coord.x, coord.y)));

  return {
    entered: nextChunks
      .filter((coord) => !previousKeys.has(chunkKey(coord.x, coord.y)))
      .sort(compareChunkCoords),
    exited: previousChunks
      .filter((coord) => !nextKeys.has(chunkKey(coord.x, coord.y)))
      .sort(compareChunkCoords)
  };
};

const diffSortedEntityIds = (
  previousEntityIds: readonly number[],
  nextEntityIds: readonly number[]
): { entered: number[]; exited: number[] } => {
  const previousIds = new Set(previousEntityIds);
  const nextIds = new Set(nextEntityIds);

  return {
    entered: nextEntityIds.filter((entityId) => !previousIds.has(entityId)),
    exited: previousEntityIds.filter((entityId) => !nextIds.has(entityId))
  };
};

export const resolveViewportWorldBounds = (viewport: InterestSetViewport): WorldBounds => {
  const normalizedViewport = normalizeViewport(viewport);
  const worldHalfWidth = normalizedViewport.viewportWidthPx / (2 * normalizedViewport.zoom);
  const worldHalfHeight = normalizedViewport.viewportHeightPx / (2 * normalizedViewport.zoom);

  return {
    minX: normalizedViewport.x - worldHalfWidth,
    minY: normalizedViewport.y - worldHalfHeight,
    maxX: normalizedViewport.x + worldHalfWidth,
    maxY: normalizedViewport.y + worldHalfHeight
  };
};

export const calculateClientInterestSet = ({
  viewport,
  entities,
  chunkPaddingChunks = 0,
  entityPaddingWorld = 0
}: CalculateClientInterestSetOptions): ClientInterestSet => {
  const visibleWorldBounds = resolveViewportWorldBounds(viewport);
  const visibleChunkBounds = resolveChunkBoundsFromWorldBounds(visibleWorldBounds);
  const chunkBounds = expandChunkBounds(
    visibleChunkBounds,
    expectNonNegativeInteger(chunkPaddingChunks, 'chunkPaddingChunks')
  );
  const entityWorldBounds = expandWorldBounds(visibleWorldBounds, entityPaddingWorld);

  return {
    visibleWorldBounds,
    entityWorldBounds,
    visibleChunkBounds,
    chunkBounds,
    chunks: collectChunkCoords(chunkBounds),
    entityIds: collectRelevantEntityIds(entities, entityWorldBounds)
  };
};

export const diffClientInterestSets = (
  previous: ClientInterestSet,
  next: ClientInterestSet
): ClientInterestSetDelta => {
  const chunkDelta = diffChunkCoords(previous.chunks, next.chunks);
  const entityDelta = diffSortedEntityIds(previous.entityIds, next.entityIds);

  return {
    enteredChunks: chunkDelta.entered,
    exitedChunks: chunkDelta.exited,
    enteredEntityIds: entityDelta.entered,
    exitedEntityIds: entityDelta.exited
  };
};
