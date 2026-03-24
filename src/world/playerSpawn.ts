import { MAX_LIQUID_LEVEL, TILE_SIZE } from './constants';
import {
  doesAabbOverlapSolid,
  sweepAabbAlongAxis,
  sweepAabbDownwardAlongOneWayPlatforms,
  type SolidTileCollision,
  type WorldAabb
} from './collision';
import { resolveProceduralTerrainColumn } from './proceduralTerrain';
import { getTileLiquidKind, TILE_METADATA } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
export interface PlayerSpawnWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
  getLiquidLevel(worldTileX: number, worldTileY: number): number;
}

export interface PlayerSpawnSearchOptions {
  width: number;
  height: number;
  originTileX?: number;
  originTileY?: number;
  maxHorizontalOffsetTiles?: number;
  maxVerticalOffsetTiles?: number;
  allowOneWayPlatformSupport?: boolean;
}

export interface PlayerSpawnPoint {
  anchorTileX: number;
  standingTileY: number;
  x: number;
  y: number;
  aabb: WorldAabb;
  support: SolidTileCollision;
}

export type PlayerSpawnLiquidSafetyStatus = 'safe' | 'overlap';

interface PlayerSpawnSeededWorldView extends PlayerSpawnWorldView {
  getWorldSeed(): number;
}

const DEFAULT_ORIGIN_TILE_X = 0;
const DEFAULT_ORIGIN_TILE_Y = 0;
const DEFAULT_MAX_HORIZONTAL_OFFSET_TILES = 8;
const DEFAULT_MAX_VERTICAL_OFFSET_TILES = 8;
const AABB_INTERSECTION_EPSILON = 1e-6;

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return value;
};

const expectInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }

  return value;
};

const expectNonNegativeInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return value;
};

const expectBoolean = (value: boolean, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

const compareSignedOffsets = (a: number, b: number): number => {
  const absDelta = Math.abs(a) - Math.abs(b);
  if (absDelta !== 0) {
    return absDelta;
  }

  return a - b;
};

const compareVerticalSurfaceOffsets = (a: number, b: number): number => {
  const absDelta = Math.abs(a) - Math.abs(b);
  if (absDelta !== 0) {
    return absDelta;
  }

  return b - a;
};

const isPlayerSpawnSeededWorldView = (
  world: PlayerSpawnWorldView
): world is PlayerSpawnSeededWorldView =>
  typeof (world as Partial<PlayerSpawnSeededWorldView>).getWorldSeed === 'function';

const resolveDefaultOriginTileY = (world: PlayerSpawnWorldView, originTileX: number): number =>
  isPlayerSpawnSeededWorldView(world)
    ? resolveProceduralTerrainColumn(originTileX, world.getWorldSeed()).surfaceTileY
    : DEFAULT_ORIGIN_TILE_Y;

const compareSpawnCandidates = (
  left: { xOffset: number; yOffset: number },
  right: { xOffset: number; yOffset: number },
  preferVerticalSurfaceAlignment: boolean
): number => {
  if (preferVerticalSurfaceAlignment) {
    const verticalComparison = compareVerticalSurfaceOffsets(left.yOffset, right.yOffset);
    if (verticalComparison !== 0) {
      return verticalComparison;
    }

    const horizontalComparison = compareSignedOffsets(left.xOffset, right.xOffset);
    if (horizontalComparison !== 0) {
      return horizontalComparison;
    }
  }

  const leftDistance = Math.abs(left.xOffset) + Math.abs(left.yOffset);
  const rightDistance = Math.abs(right.xOffset) + Math.abs(right.yOffset);
  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  const xComparison = compareSignedOffsets(left.xOffset, right.xOffset);
  if (xComparison !== 0) {
    return xComparison;
  }

  return compareSignedOffsets(left.yOffset, right.yOffset);
};

const buildSpawnCandidateAabb = (
  anchorTileX: number,
  standingTileY: number,
  width: number,
  height: number
): WorldAabb => {
  const minX = anchorTileX * TILE_SIZE + (TILE_SIZE - width) * 0.5;
  const maxX = minX + width;
  const maxY = standingTileY * TILE_SIZE;
  const minY = maxY - height;

  return {
    minX,
    minY,
    maxX,
    maxY
  };
};

const resolveAabbLiquidSafetyStatus = (
  world: PlayerSpawnWorldView,
  aabb: WorldAabb,
  registry: TileMetadataRegistry
): PlayerSpawnLiquidSafetyStatus => {
  const minTileX = Math.floor(aabb.minX / TILE_SIZE);
  const maxTileX = Math.floor((aabb.maxX - AABB_INTERSECTION_EPSILON) / TILE_SIZE);
  const minTileY = Math.floor(aabb.minY / TILE_SIZE);
  const maxTileY = Math.floor((aabb.maxY - AABB_INTERSECTION_EPSILON) / TILE_SIZE);

  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    const tileWorldMinY = tileY * TILE_SIZE;
    const tileWorldMaxY = tileWorldMinY + TILE_SIZE;

    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      const tileId = world.getTile(tileX, tileY);
      if (getTileLiquidKind(tileId, registry) === null) {
        continue;
      }

      const liquidLevel = world.getLiquidLevel(tileX, tileY);
      if (liquidLevel <= 0) {
        continue;
      }

      const tileWorldMinX = tileX * TILE_SIZE;
      const tileWorldMaxX = tileWorldMinX + TILE_SIZE;
      const liquidFillHeight = (liquidLevel / MAX_LIQUID_LEVEL) * TILE_SIZE;
      const liquidWorldMinY = tileWorldMaxY - liquidFillHeight;
      const overlapWidth = Math.min(aabb.maxX, tileWorldMaxX) - Math.max(aabb.minX, tileWorldMinX);
      const overlapHeight = Math.min(aabb.maxY, tileWorldMaxY) - Math.max(aabb.minY, liquidWorldMinY);
      if (overlapWidth > 0 && overlapHeight > 0) {
        return 'overlap';
      }
    }
  }

  return 'safe';
};

const getGroundSupport = (
  world: PlayerSpawnWorldView,
  aabb: WorldAabb,
  allowOneWayPlatformSupport: boolean,
  registry: TileMetadataRegistry
): SolidTileCollision | null => {
  const solidSweep = sweepAabbAlongAxis(world, aabb, 'y', 1, registry);
  if (solidSweep.allowedDelta === 0 && solidSweep.hit !== null) {
    return solidSweep.hit;
  }

  if (!allowOneWayPlatformSupport) {
    return null;
  }

  const platformSweep = sweepAabbDownwardAlongOneWayPlatforms(world, aabb, 1, registry);
  if (platformSweep.allowedDelta !== 0 || platformSweep.hit === null) {
    return null;
  }

  return platformSweep.hit;
};

export const findPlayerSpawnPoint = (
  world: PlayerSpawnWorldView,
  options: PlayerSpawnSearchOptions,
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerSpawnPoint | null => {
  const width = expectPositiveFiniteNumber(options.width, 'width');
  const height = expectPositiveFiniteNumber(options.height, 'height');
  const originTileX = expectInteger(options.originTileX ?? DEFAULT_ORIGIN_TILE_X, 'originTileX');
  const preferVerticalSurfaceAlignment = options.originTileY === undefined;
  const originTileY = expectInteger(
    options.originTileY ?? resolveDefaultOriginTileY(world, originTileX),
    'originTileY'
  );
  const maxHorizontalOffsetTiles = expectNonNegativeInteger(
    options.maxHorizontalOffsetTiles ?? DEFAULT_MAX_HORIZONTAL_OFFSET_TILES,
    'maxHorizontalOffsetTiles'
  );
  const maxVerticalOffsetTiles = expectNonNegativeInteger(
    options.maxVerticalOffsetTiles ?? DEFAULT_MAX_VERTICAL_OFFSET_TILES,
    'maxVerticalOffsetTiles'
  );
  const allowOneWayPlatformSupport =
    options.allowOneWayPlatformSupport === undefined
      ? false
      : expectBoolean(options.allowOneWayPlatformSupport, 'allowOneWayPlatformSupport');

  const candidates: Array<{ xOffset: number; yOffset: number }> = [];
  for (let yOffset = -maxVerticalOffsetTiles; yOffset <= maxVerticalOffsetTiles; yOffset += 1) {
    for (let xOffset = -maxHorizontalOffsetTiles; xOffset <= maxHorizontalOffsetTiles; xOffset += 1) {
      candidates.push({ xOffset, yOffset });
    }
  }

  candidates.sort((left, right) =>
    compareSpawnCandidates(left, right, preferVerticalSurfaceAlignment)
  );

  for (const candidate of candidates) {
    const anchorTileX = originTileX + candidate.xOffset;
    const standingTileY = originTileY + candidate.yOffset;
    const aabb = buildSpawnCandidateAabb(anchorTileX, standingTileY, width, height);

    if (doesAabbOverlapSolid(world, aabb, registry)) {
      continue;
    }

    if (resolveAabbLiquidSafetyStatus(world, aabb, registry) !== 'safe') {
      continue;
    }

    const support = getGroundSupport(world, aabb, allowOneWayPlatformSupport, registry);
    if (!support) {
      continue;
    }

    return {
      anchorTileX,
      standingTileY,
      x: (aabb.minX + aabb.maxX) * 0.5,
      y: aabb.maxY,
      aabb,
      support
    };
  }

  return null;
};

export const resolvePlayerSpawnLiquidSafetyStatus = (
  world: PlayerSpawnWorldView,
  spawn: PlayerSpawnPoint,
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerSpawnLiquidSafetyStatus => resolveAabbLiquidSafetyStatus(world, spawn.aabb, registry);
