import { MAX_LIQUID_LEVEL, TILE_SIZE } from './constants';
import {
  doesAabbOverlapSolid,
  sweepAabbAlongAxis,
  type SolidTileCollision,
  type WorldAabb
} from './collision';
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

const compareSignedOffsets = (a: number, b: number): number => {
  const absDelta = Math.abs(a) - Math.abs(b);
  if (absDelta !== 0) {
    return absDelta;
  }

  return a - b;
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
  registry: TileMetadataRegistry
): SolidTileCollision | null => {
  const sweep = sweepAabbAlongAxis(world, aabb, 'y', 1, registry);
  if (sweep.allowedDelta !== 0 || sweep.hit === null) {
    return null;
  }

  return sweep.hit;
};

export const findPlayerSpawnPoint = (
  world: PlayerSpawnWorldView,
  options: PlayerSpawnSearchOptions,
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerSpawnPoint | null => {
  const width = expectPositiveFiniteNumber(options.width, 'width');
  const height = expectPositiveFiniteNumber(options.height, 'height');
  const originTileX = expectInteger(options.originTileX ?? DEFAULT_ORIGIN_TILE_X, 'originTileX');
  const originTileY = expectInteger(options.originTileY ?? DEFAULT_ORIGIN_TILE_Y, 'originTileY');
  const maxHorizontalOffsetTiles = expectNonNegativeInteger(
    options.maxHorizontalOffsetTiles ?? DEFAULT_MAX_HORIZONTAL_OFFSET_TILES,
    'maxHorizontalOffsetTiles'
  );
  const maxVerticalOffsetTiles = expectNonNegativeInteger(
    options.maxVerticalOffsetTiles ?? DEFAULT_MAX_VERTICAL_OFFSET_TILES,
    'maxVerticalOffsetTiles'
  );

  const candidates: Array<{ xOffset: number; yOffset: number }> = [];
  for (let yOffset = -maxVerticalOffsetTiles; yOffset <= maxVerticalOffsetTiles; yOffset += 1) {
    for (let xOffset = -maxHorizontalOffsetTiles; xOffset <= maxHorizontalOffsetTiles; xOffset += 1) {
      candidates.push({ xOffset, yOffset });
    }
  }

  candidates.sort((left, right) => {
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
  });

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

    const support = getGroundSupport(world, aabb, registry);
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
