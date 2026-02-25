import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './constants';
import {
  AUTOTILE_DIRECTION_BITS,
  TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK,
  buildAutotileAdjacencyMask,
  normalizeAutotileAdjacencyMask,
  resolveTerrainAutotileVariantIndex,
  TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT
} from './autotile';
import { TileWorld } from './world';
import type { TileNeighborhood } from './world';

const resolveTerrainAutotileVariantIndexBitwiseBaseline = (normalizedMask: number): number => {
  let cardinalMask = 0;
  const mask = normalizedMask & 0xff;

  if (mask & AUTOTILE_DIRECTION_BITS.north) cardinalMask |= 1 << 0;
  if (mask & AUTOTILE_DIRECTION_BITS.east) cardinalMask |= 1 << 1;
  if (mask & AUTOTILE_DIRECTION_BITS.south) cardinalMask |= 1 << 2;
  if (mask & AUTOTILE_DIRECTION_BITS.west) cardinalMask |= 1 << 3;

  return cardinalMask;
};

describe('autotile adjacency mask', () => {
  it('uses a clockwise bit layout starting at north', () => {
    expect(AUTOTILE_DIRECTION_BITS).toEqual({
      north: 1,
      northEast: 2,
      east: 4,
      southEast: 8,
      south: 16,
      southWest: 32,
      west: 64,
      northWest: 128
    });
  });

  it('builds a mask from same-tile neighbors by default', () => {
    const neighborhood: TileNeighborhood = {
      center: 3,
      north: 3,
      northEast: 8,
      east: 3,
      southEast: 0,
      south: 3,
      southWest: 2,
      west: 0,
      northWest: 3
    };

    const mask = buildAutotileAdjacencyMask(neighborhood);

    expect(mask).toBe(
      AUTOTILE_DIRECTION_BITS.north |
        AUTOTILE_DIRECTION_BITS.east |
        AUTOTILE_DIRECTION_BITS.south |
        AUTOTILE_DIRECTION_BITS.northWest
    );
  });

  it('supports custom connectivity predicates', () => {
    const neighborhood: TileNeighborhood = {
      center: 9,
      north: 0,
      northEast: 4,
      east: 0,
      southEast: 6,
      south: 7,
      southWest: 0,
      west: 2,
      northWest: 0
    };

    const mask = buildAutotileAdjacencyMask(neighborhood, (_center, neighborTileId) => neighborTileId !== 0);

    expect(mask).toBe(
      AUTOTILE_DIRECTION_BITS.northEast |
        AUTOTILE_DIRECTION_BITS.southEast |
        AUTOTILE_DIRECTION_BITS.south |
        AUTOTILE_DIRECTION_BITS.west
    );
  });

  it('works with neighborhoods sampled across chunk boundaries', () => {
    const world = new TileWorld(0);
    const centerTileId = 21;

    world.setTile(0, 0, centerTileId);
    world.setTile(0, -1, centerTileId);
    world.setTile(1, -1, centerTileId + 1);
    world.setTile(1, 0, centerTileId);
    world.setTile(1, 1, centerTileId);
    world.setTile(0, 1, centerTileId + 1);
    world.setTile(-1, 1, centerTileId);
    world.setTile(-1, 0, centerTileId + 1);
    world.setTile(-1, -1, centerTileId);

    const neighborhood = world.sampleLocalTileNeighborhood(0, 0, 0, 0);
    const mask = buildAutotileAdjacencyMask(neighborhood);

    expect(mask).toBe(
      AUTOTILE_DIRECTION_BITS.north |
        AUTOTILE_DIRECTION_BITS.east |
        AUTOTILE_DIRECTION_BITS.southEast |
        AUTOTILE_DIRECTION_BITS.southWest |
        AUTOTILE_DIRECTION_BITS.northWest
    );

    const edgeNeighborhood = world.sampleLocalTileNeighborhood(0, 0, CHUNK_SIZE - 1, CHUNK_SIZE - 1);
    expect(edgeNeighborhood.center).toBe(world.getTile(CHUNK_SIZE - 1, CHUNK_SIZE - 1));
  });

  it('normalizes corner bits using cardinal corner-gating rules', () => {
    const {
      north,
      northEast,
      east,
      southEast,
      south,
      southWest,
      west,
      northWest
    } = AUTOTILE_DIRECTION_BITS;

    const cases: Array<{ label: string; input: number; expected: number }> = [
      {
        label: 'removes unsupported isolated diagonal corners',
        input: northEast | southWest,
        expected: 0
      },
      {
        label: 'keeps all corners when all supporting cardinals are present',
        input: north | east | south | west | northEast | southEast | southWest | northWest,
        expected: north | east | south | west | northEast | southEast | southWest | northWest
      },
      {
        label: 'drops corner when one supporting cardinal is missing',
        input: north | northEast | southEast | east,
        expected: north | east | northEast
      },
      {
        label: 'preserves valid corners and unrelated cardinals',
        input: north | east | northEast | south | west,
        expected: north | east | northEast | south | west
      }
    ];

    for (const testCase of cases) {
      expect(normalizeAutotileAdjacencyMask(testCase.input), testCase.label).toBe(testCase.expected);
    }
  });

  it('normalizes masks built from neighborhood sampling for terrain-style corner gating', () => {
    const neighborhood: TileNeighborhood = {
      center: 5,
      north: 0,
      northEast: 5,
      east: 5,
      southEast: 5,
      south: 0,
      southWest: 5,
      west: 5,
      northWest: 5
    };

    const rawMask = buildAutotileAdjacencyMask(neighborhood);
    const normalizedMask = normalizeAutotileAdjacencyMask(rawMask);

    expect(rawMask).toBe(
      AUTOTILE_DIRECTION_BITS.northEast |
        AUTOTILE_DIRECTION_BITS.east |
        AUTOTILE_DIRECTION_BITS.southEast |
        AUTOTILE_DIRECTION_BITS.southWest |
        AUTOTILE_DIRECTION_BITS.west |
        AUTOTILE_DIRECTION_BITS.northWest
    );
    expect(normalizedMask).toBe(AUTOTILE_DIRECTION_BITS.east | AUTOTILE_DIRECTION_BITS.west);
  });

  it('resolves normalized masks into 16 placeholder atlas variants using NESW cardinal bits', () => {
    const { north, east, south, west } = AUTOTILE_DIRECTION_BITS;

    const cases: Array<{ label: string; mask: number; expectedVariant: number }> = [
      { label: 'isolated', mask: 0, expectedVariant: 0 },
      { label: 'north', mask: north, expectedVariant: 1 },
      { label: 'east', mask: east, expectedVariant: 2 },
      { label: 'south', mask: south, expectedVariant: 4 },
      { label: 'west', mask: west, expectedVariant: 8 },
      { label: 'north+east', mask: north | east, expectedVariant: 3 },
      { label: 'south+west', mask: south | west, expectedVariant: 12 },
      { label: 'all cardinals', mask: north | east | south | west, expectedVariant: 15 }
    ];

    for (const testCase of cases) {
      expect(resolveTerrainAutotileVariantIndex(testCase.mask), testCase.label).toBe(
        testCase.expectedVariant
      );
    }
  });

  it('collapses diagonal corner differences into the same placeholder variant bucket', () => {
    const { north, northEast, east, southEast, south, west, northWest } = AUTOTILE_DIRECTION_BITS;

    const withoutCorners = resolveTerrainAutotileVariantIndex(north | east);
    const withValidCorner = resolveTerrainAutotileVariantIndex(north | east | northEast);
    const withMultipleCorners = resolveTerrainAutotileVariantIndex(
      north | east | south | west | northEast | southEast | northWest
    );

    expect(withoutCorners).toBe(3);
    expect(withValidCorner).toBe(withoutCorners);
    expect(withMultipleCorners).toBe(15);
  });

  it('precomputes a 256-entry normalized-mask lookup matching the legacy bitwise placeholder mapping', () => {
    expect(TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK).toHaveLength(256);

    for (let normalizedMask = 0; normalizedMask < 256; normalizedMask += 1) {
      const expectedVariant = resolveTerrainAutotileVariantIndexBitwiseBaseline(normalizedMask);

      expect(
        TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_BY_NORMALIZED_ADJACENCY_MASK[normalizedMask],
        `lookup entry ${normalizedMask}`
      ).toBe(expectedVariant);
      expect(resolveTerrainAutotileVariantIndex(normalizedMask), `resolver entry ${normalizedMask}`).toBe(
        expectedVariant
      );
    }
  });

  it('matches the 4x4 placeholder atlas capacity', () => {
    expect(TERRAIN_AUTOTILE_PLACEHOLDER_VARIANT_COUNT).toBe(16);
  });
});
