import { TILE_SIZE } from './constants';
import {
  doesAabbOverlapSolid,
  sweepAabbAlongAxis,
  type SolidTileCollision,
  type WorldAabb
} from './collision';
import { TILE_METADATA } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
import type { TileWorld } from './world';

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

const DEFAULT_ORIGIN_TILE_X = 0;
const DEFAULT_ORIGIN_TILE_Y = 0;
const DEFAULT_MAX_HORIZONTAL_OFFSET_TILES = 8;
const DEFAULT_MAX_VERTICAL_OFFSET_TILES = 8;

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

const getGroundSupport = (
  world: TileWorld,
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
  world: TileWorld,
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
