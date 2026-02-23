import type { TileNeighborhood } from './world';

export const AUTOTILE_DIRECTIONS = [
  'north',
  'northEast',
  'east',
  'southEast',
  'south',
  'southWest',
  'west',
  'northWest'
] as const;

export type AutotileDirection = (typeof AUTOTILE_DIRECTIONS)[number];

export const AUTOTILE_DIRECTION_BITS: Record<AutotileDirection, number> = {
  north: 1 << 0,
  northEast: 1 << 1,
  east: 1 << 2,
  southEast: 1 << 3,
  south: 1 << 4,
  southWest: 1 << 5,
  west: 1 << 6,
  northWest: 1 << 7
};

export type AutotileAdjacencyPredicate = (
  centerTileId: number,
  neighborTileId: number,
  direction: AutotileDirection
) => boolean;

const defaultAdjacencyPredicate: AutotileAdjacencyPredicate = (centerTileId, neighborTileId) =>
  centerTileId !== 0 && neighborTileId === centerTileId;

export const buildAutotileAdjacencyMask = (
  neighborhood: TileNeighborhood,
  isConnected: AutotileAdjacencyPredicate = defaultAdjacencyPredicate
): number => {
  let mask = 0;
  const centerTileId = neighborhood.center;

  for (const direction of AUTOTILE_DIRECTIONS) {
    if (isConnected(centerTileId, neighborhood[direction], direction)) {
      mask |= AUTOTILE_DIRECTION_BITS[direction];
    }
  }

  return mask;
};

export const normalizeAutotileAdjacencyMask = (mask: number): number => {
  let normalized = mask & 0xff;

  const north = (normalized & AUTOTILE_DIRECTION_BITS.north) !== 0;
  const east = (normalized & AUTOTILE_DIRECTION_BITS.east) !== 0;
  const south = (normalized & AUTOTILE_DIRECTION_BITS.south) !== 0;
  const west = (normalized & AUTOTILE_DIRECTION_BITS.west) !== 0;

  if (!(north && east)) normalized &= ~AUTOTILE_DIRECTION_BITS.northEast;
  if (!(south && east)) normalized &= ~AUTOTILE_DIRECTION_BITS.southEast;
  if (!(south && west)) normalized &= ~AUTOTILE_DIRECTION_BITS.southWest;
  if (!(north && west)) normalized &= ~AUTOTILE_DIRECTION_BITS.northWest;

  return normalized;
};
