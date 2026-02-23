import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './constants';
import {
  AUTOTILE_DIRECTION_BITS,
  buildAutotileAdjacencyMask,
  normalizeAutotileAdjacencyMask
} from './autotile';
import { TileWorld } from './world';
import type { TileNeighborhood } from './world';

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
});
