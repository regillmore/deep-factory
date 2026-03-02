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

export const TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT = 16;

// Placeholder terrain variants still occupy a 4x4 block inside the authored atlas,
// so we currently compress the normalized 8-neighbor mask into a 4-bit cardinal
// mask (N/E/S/W) for variant selection.
const resolveTerrainAutotileVariantIndexBitwise = (normalizedMask: number): number => {
  let cardinalMask = 0;
  const mask = normalizedMask & 0xff;

  if (mask & AUTOTILE_DIRECTION_BITS.north) cardinalMask |= 1 << 0;
  if (mask & AUTOTILE_DIRECTION_BITS.east) cardinalMask |= 1 << 1;
  if (mask & AUTOTILE_DIRECTION_BITS.south) cardinalMask |= 1 << 2;
  if (mask & AUTOTILE_DIRECTION_BITS.west) cardinalMask |= 1 << 3;

  return cardinalMask;
};

const buildTerrainAutotilePlaceholderVariantLookup = (): Uint8Array => {
  const lookup = new Uint8Array(256);
  for (let normalizedAdjacencyMask = 0; normalizedAdjacencyMask < lookup.length; normalizedAdjacencyMask += 1) {
    lookup[normalizedAdjacencyMask] =
      resolveTerrainAutotileVariantIndexBitwise(normalizedAdjacencyMask);
  }
  return lookup;
};

export const TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK =
  buildTerrainAutotilePlaceholderVariantLookup();

export const resolveTerrainAutotileVariantIndex = (normalizedMask: number): number =>
  TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK[normalizedMask & 0xff] ?? 0;
