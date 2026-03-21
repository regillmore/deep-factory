import { describe, expect, it } from 'vitest';

import { ACORN_ITEM_ID, evaluateAcornPlantingAtAnchor, tryPlantAcornAtAnchor } from './acornPlanting';
import { PROCEDURAL_DIRT_TILE_ID, PROCEDURAL_GRASS_SURFACE_TILE_ID } from './proceduralTerrain';
import { createPlayerState } from './playerState';
import { getSmallTreeTileIds } from './smallTreeTiles';

interface AcornPlantingWorldTile {
  tileX: number;
  tileY: number;
  tileId: number;
}

const createTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

const createAcornPlantingWorld = (tiles: readonly AcornPlantingWorldTile[]) => {
  const tileMap = new Map<string, number>(
    tiles.map((tile) => [createTileKey(tile.tileX, tile.tileY), tile.tileId])
  );

  return {
    getTile(worldTileX: number, worldTileY: number): number {
      return tileMap.get(createTileKey(worldTileX, worldTileY)) ?? 0;
    },
    setTile(worldTileX: number, worldTileY: number, tileId: number): boolean {
      const key = createTileKey(worldTileX, worldTileY);
      const previousTileId = tileMap.get(key) ?? 0;
      if (previousTileId === tileId) {
        return false;
      }

      if (tileId === 0) {
        tileMap.delete(key);
      } else {
        tileMap.set(key, tileId);
      }
      return true;
    }
  };
};

describe('acornPlanting', () => {
  it('pins the shared acorn hotbar item id', () => {
    expect(ACORN_ITEM_ID).toBe('acorn');
  });

  it('allows planting on a grass anchor within the shared hotbar reach', () => {
    const world = createAcornPlantingWorld([
      { tileX: 2, tileY: 0, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID }
    ]);
    const playerState = createPlayerState({
      position: { x: 40, y: 0 },
      grounded: true
    });

    expect(evaluateAcornPlantingAtAnchor(world, playerState, 2, 0)).toEqual({
      placementRangeWithinReach: true,
      site: {
        anchorTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
        hasGrassAnchor: true,
        currentGrowthStage: null,
        blockedGrowthTiles: [],
        hasUnobstructedGrowthSpace: true,
        canPlant: true,
        canGrow: false
      },
      canPlant: true
    });
  });

  it('rejects planting outside the shared hotbar reach even when the anchor stays grass', () => {
    const world = createAcornPlantingWorld([
      { tileX: 8, tileY: 0, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID }
    ]);
    const playerState = createPlayerState({
      position: { x: 8, y: 0 },
      grounded: true
    });

    expect(evaluateAcornPlantingAtAnchor(world, playerState, 8, 0)).toEqual({
      placementRangeWithinReach: false,
      site: {
        anchorTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
        hasGrassAnchor: true,
        currentGrowthStage: null,
        blockedGrowthTiles: [],
        hasUnobstructedGrowthSpace: true,
        canPlant: true,
        canGrow: false
      },
      canPlant: false
    });
  });

  it('writes a planted sapling above the grass anchor when an acorn is planted successfully', () => {
    const world = createAcornPlantingWorld([
      { tileX: -1, tileY: 3, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID }
    ]);
    const playerState = createPlayerState({
      position: { x: -8, y: 48 },
      grounded: true
    });
    const tileIds = getSmallTreeTileIds();

    const result = tryPlantAcornAtAnchor(world, playerState, -1, 3);

    expect(result).toEqual({
      planted: true,
      evaluation: {
        placementRangeWithinReach: true,
        site: {
          anchorTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
          hasGrassAnchor: true,
          currentGrowthStage: null,
          blockedGrowthTiles: [],
          hasUnobstructedGrowthSpace: true,
          canPlant: true,
          canGrow: false
        },
        canPlant: true
      },
      writes: [
        {
          worldTileX: -1,
          worldTileY: 2,
          previousTileId: 0,
          tileId: tileIds.sapling
        }
      ]
    });
    expect(world.getTile(-1, 3)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(world.getTile(-1, 2)).toBe(tileIds.sapling);
  });

  it('leaves non-grass anchors unchanged when an acorn planting request is invalid', () => {
    const world = createAcornPlantingWorld([
      { tileX: 1, tileY: 2, tileId: PROCEDURAL_DIRT_TILE_ID }
    ]);
    const playerState = createPlayerState({
      position: { x: 24, y: 48 },
      grounded: true
    });

    expect(tryPlantAcornAtAnchor(world, playerState, 1, 2)).toEqual({
      planted: false,
      evaluation: {
        placementRangeWithinReach: true,
        site: {
          anchorTileId: PROCEDURAL_DIRT_TILE_ID,
          hasGrassAnchor: false,
          currentGrowthStage: null,
          blockedGrowthTiles: [],
          hasUnobstructedGrowthSpace: true,
          canPlant: false,
          canGrow: false
        },
        canPlant: false
      },
      writes: []
    });
    expect(world.getTile(1, 2)).toBe(PROCEDURAL_DIRT_TILE_ID);
  });
});
