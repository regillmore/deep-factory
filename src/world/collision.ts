import { TILE_SIZE } from './constants';
import { isTileSolid, TILE_METADATA } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
import type { TileWorld } from './world';

export interface WorldAabb {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type CollisionAxis = 'x' | 'y';

export interface SolidTileCollision {
  tileX: number;
  tileY: number;
  tileId: number;
}

export interface AxisSweepCollisionResult {
  attemptedDelta: number;
  allowedDelta: number;
  hit: SolidTileCollision | null;
}

interface TileRange {
  min: number;
  max: number;
}

const EMPTY_AXIS_SWEEP_RESULT: AxisSweepCollisionResult = {
  attemptedDelta: 0,
  allowedDelta: 0,
  hit: null
};

const isAabbEmpty = (aabb: WorldAabb): boolean => aabb.maxX <= aabb.minX || aabb.maxY <= aabb.minY;

// Collision queries treat AABBs as half-open intervals so edge contact does not count as overlap.
const getOverlappingTileRange = (min: number, max: number): TileRange | null => {
  if (max <= min) {
    return null;
  }

  return {
    min: Math.floor(min / TILE_SIZE),
    max: Math.ceil(max / TILE_SIZE) - 1
  };
};

const getSolidTileCollision = (
  world: TileWorld,
  tileX: number,
  tileY: number,
  registry: TileMetadataRegistry
): SolidTileCollision | null => {
  const tileId = world.getTile(tileX, tileY);
  if (!isTileSolid(tileId, registry)) {
    return null;
  }

  return {
    tileX,
    tileY,
    tileId
  };
};

export const isSolidAt = (
  world: TileWorld,
  worldTileX: number,
  worldTileY: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => isTileSolid(world.getTile(worldTileX, worldTileY), registry);

export const doesAabbOverlapSolid = (
  world: TileWorld,
  aabb: WorldAabb,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  if (isAabbEmpty(aabb)) {
    return false;
  }

  const xRange = getOverlappingTileRange(aabb.minX, aabb.maxX);
  const yRange = getOverlappingTileRange(aabb.minY, aabb.maxY);
  if (!xRange || !yRange) {
    return false;
  }

  for (let tileY = yRange.min; tileY <= yRange.max; tileY += 1) {
    for (let tileX = xRange.min; tileX <= xRange.max; tileX += 1) {
      if (getSolidTileCollision(world, tileX, tileY, registry) !== null) {
        return true;
      }
    }
  }

  return false;
};

// Axis sweeps assume the starting AABB is not already embedded inside solid tiles.
export const sweepAabbAlongAxis = (
  world: TileWorld,
  aabb: WorldAabb,
  axis: CollisionAxis,
  delta: number,
  registry: TileMetadataRegistry = TILE_METADATA
): AxisSweepCollisionResult => {
  if (delta === 0 || isAabbEmpty(aabb)) {
    return {
      ...EMPTY_AXIS_SWEEP_RESULT,
      attemptedDelta: delta,
      allowedDelta: delta
    };
  }

  if (axis === 'x') {
    const yRange = getOverlappingTileRange(aabb.minY, aabb.maxY);
    if (!yRange) {
      return { attemptedDelta: delta, allowedDelta: delta, hit: null };
    }

    if (delta > 0) {
      const startTileX = Math.ceil(aabb.maxX / TILE_SIZE);
      const endTileX = Math.ceil((aabb.maxX + delta) / TILE_SIZE) - 1;
      if (startTileX > endTileX) {
        return { attemptedDelta: delta, allowedDelta: delta, hit: null };
      }

      for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
        for (let tileY = yRange.min; tileY <= yRange.max; tileY += 1) {
          const hit = getSolidTileCollision(world, tileX, tileY, registry);
          if (hit) {
            return {
              attemptedDelta: delta,
              allowedDelta: tileX * TILE_SIZE - aabb.maxX,
              hit
            };
          }
        }
      }

      return { attemptedDelta: delta, allowedDelta: delta, hit: null };
    }

    const startTileX = Math.floor(aabb.minX / TILE_SIZE) - 1;
    const endTileX = Math.floor((aabb.minX + delta) / TILE_SIZE);
    if (startTileX < endTileX) {
      return { attemptedDelta: delta, allowedDelta: delta, hit: null };
    }

    for (let tileX = startTileX; tileX >= endTileX; tileX -= 1) {
      for (let tileY = yRange.min; tileY <= yRange.max; tileY += 1) {
        const hit = getSolidTileCollision(world, tileX, tileY, registry);
        if (hit) {
          return {
            attemptedDelta: delta,
            allowedDelta: (tileX + 1) * TILE_SIZE - aabb.minX,
            hit
          };
        }
      }
    }

    return { attemptedDelta: delta, allowedDelta: delta, hit: null };
  }

  const xRange = getOverlappingTileRange(aabb.minX, aabb.maxX);
  if (!xRange) {
    return { attemptedDelta: delta, allowedDelta: delta, hit: null };
  }

  if (delta > 0) {
    const startTileY = Math.ceil(aabb.maxY / TILE_SIZE);
    const endTileY = Math.ceil((aabb.maxY + delta) / TILE_SIZE) - 1;
    if (startTileY > endTileY) {
      return { attemptedDelta: delta, allowedDelta: delta, hit: null };
    }

    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      for (let tileX = xRange.min; tileX <= xRange.max; tileX += 1) {
        const hit = getSolidTileCollision(world, tileX, tileY, registry);
        if (hit) {
          return {
            attemptedDelta: delta,
            allowedDelta: tileY * TILE_SIZE - aabb.maxY,
            hit
          };
        }
      }
    }

    return { attemptedDelta: delta, allowedDelta: delta, hit: null };
  }

  const startTileY = Math.floor(aabb.minY / TILE_SIZE) - 1;
  const endTileY = Math.floor((aabb.minY + delta) / TILE_SIZE);
  if (startTileY < endTileY) {
    return { attemptedDelta: delta, allowedDelta: delta, hit: null };
  }

  for (let tileY = startTileY; tileY >= endTileY; tileY -= 1) {
    for (let tileX = xRange.min; tileX <= xRange.max; tileX += 1) {
      const hit = getSolidTileCollision(world, tileX, tileY, registry);
      if (hit) {
        return {
          attemptedDelta: delta,
          allowedDelta: (tileY + 1) * TILE_SIZE - aabb.minY,
          hit
        };
      }
    }
  }

  return { attemptedDelta: delta, allowedDelta: delta, hit: null };
};
