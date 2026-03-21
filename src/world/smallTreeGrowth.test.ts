import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './constants';
import { PROCEDURAL_DIRT_TILE_ID, PROCEDURAL_GRASS_SURFACE_TILE_ID } from './proceduralTerrain';
import {
  collectTrackedPlantedSmallTreeAnchorsFromWorldSnapshot,
  createSmallTreeGrowthState,
  isSmallTreeGrowthTrackedAnchorResident,
  resolveSmallTreeGrowthWindowIndex,
  stepSmallTreeGrowth,
  type SmallTreeGrowthTrackedAnchor
} from './smallTreeGrowth';
import { getSmallTreeTileIds } from './smallTreeTiles';
import { TileWorld } from './world';

interface SmallTreeWorldTile {
  tileX: number;
  tileY: number;
  tileId: number;
}

const createTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

const createSmallTreeWorldView = (tiles: readonly SmallTreeWorldTile[]) => {
  const tileMap = new Map<string, number>(
    tiles.map((tile) => [createTileKey(tile.tileX, tile.tileY), tile.tileId])
  );

  return {
    getTile: (worldTileX: number, worldTileY: number) =>
      tileMap.get(createTileKey(worldTileX, worldTileY)) ?? 0,
    setTile: (worldTileX: number, worldTileY: number, tileId: number) => {
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

describe('smallTreeGrowth', () => {
  it('round-robins deterministic growth windows across tracked planted anchors', () => {
    const tileIds = getSmallTreeTileIds();
    const world = createSmallTreeWorldView([
      { tileX: 0, tileY: 0, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
      { tileX: 0, tileY: -1, tileId: tileIds.sapling },
      { tileX: 3, tileY: 0, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
      { tileX: 3, tileY: -1, tileId: tileIds.sapling }
    ]);
    const trackedAnchors: SmallTreeGrowthTrackedAnchor[] = [
      { anchorTileX: 0, anchorTileY: 0 },
      { anchorTileX: 3, anchorTileY: 0 }
    ];
    let growthState = createSmallTreeGrowthState(2);

    const firstTick = stepSmallTreeGrowth({
      world,
      growthState,
      trackedAnchors,
      growthIntervalTicks: 2,
      windowCount: 2
    });
    expect(firstTick.grownAnchors).toEqual([]);
    expect(firstTick.nextGrowthState).toEqual({
      ticksUntilNextGrowth: 1,
      nextWindowIndex: 0
    });

    growthState = firstTick.nextGrowthState;
    const secondTick = stepSmallTreeGrowth({
      world,
      growthState,
      trackedAnchors,
      growthIntervalTicks: 2,
      windowCount: 2
    });
    expect(secondTick.grownAnchors.map((anchor) => [anchor.anchorTileX, anchor.anchorTileY])).toEqual([
      [0, 0]
    ]);
    expect(world.getTile(0, -1)).toBe(tileIds.trunk);
    expect(world.getTile(0, -2)).toBe(tileIds.trunk);
    expect(world.getTile(-1, -3)).toBe(tileIds.leaf);
    expect(world.getTile(1, -3)).toBe(tileIds.leaf);
    expect(world.getTile(3, -1)).toBe(tileIds.sapling);

    growthState = secondTick.nextGrowthState;
    growthState = stepSmallTreeGrowth({
      world,
      growthState,
      trackedAnchors,
      growthIntervalTicks: 2,
      windowCount: 2
    }).nextGrowthState;
    const fourthTick = stepSmallTreeGrowth({
      world,
      growthState,
      trackedAnchors,
      growthIntervalTicks: 2,
      windowCount: 2
    });
    expect(fourthTick.grownAnchors.map((anchor) => [anchor.anchorTileX, anchor.anchorTileY])).toEqual([
      [3, 0]
    ]);
    expect(world.getTile(3, -1)).toBe(tileIds.trunk);
    expect(world.getTile(3, -2)).toBe(tileIds.trunk);
    expect(world.getTile(4, -3)).toBe(tileIds.leaf);
  });

  it('keeps blocked saplings planted until a later deterministic growth check clears the obstruction', () => {
    const tileIds = getSmallTreeTileIds();
    const world = createSmallTreeWorldView([
      { tileX: 4, tileY: 2, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
      { tileX: 4, tileY: 1, tileId: tileIds.sapling },
      { tileX: 4, tileY: 0, tileId: PROCEDURAL_DIRT_TILE_ID }
    ]);

    const blockedStep = stepSmallTreeGrowth({
      world,
      growthState: createSmallTreeGrowthState(1),
      trackedAnchors: [{ anchorTileX: 4, anchorTileY: 2 }],
      growthIntervalTicks: 1,
      windowCount: 1
    });
    expect(blockedStep.grownAnchors).toEqual([]);
    expect(world.getTile(4, 1)).toBe(tileIds.sapling);

    expect(world.setTile(4, 0, 0)).toBe(true);
    const grownStep = stepSmallTreeGrowth({
      world,
      growthState: blockedStep.nextGrowthState,
      trackedAnchors: [{ anchorTileX: 4, anchorTileY: 2 }],
      growthIntervalTicks: 1,
      windowCount: 1
    });
    expect(grownStep.grownAnchors.map((anchor) => [anchor.anchorTileX, anchor.anchorTileY])).toEqual([
      [4, 2]
    ]);
    expect(world.getTile(4, 1)).toBe(tileIds.trunk);
    expect(world.getTile(4, 0)).toBe(tileIds.trunk);
  });

  it('does not read or write the world on due ticks when no planted saplings are tracked', () => {
    let getTileCallCount = 0;
    let setTileCallCount = 0;

    const growthStep = stepSmallTreeGrowth({
      world: {
        getTile: () => {
          getTileCallCount += 1;
          return 0;
        },
        setTile: () => {
          setTileCallCount += 1;
          return false;
        }
      },
      growthState: createSmallTreeGrowthState(1),
      trackedAnchors: [],
      growthIntervalTicks: 1,
      windowCount: 4
    });

    expect(getTileCallCount).toBe(0);
    expect(setTileCallCount).toBe(0);
    expect(growthStep.grownAnchors).toEqual([]);
    expect(growthStep.nextGrowthState).toEqual({
      ticksUntilNextGrowth: 1,
      nextWindowIndex: 1
    });
  });

  it('rebuilds tracked planted sapling anchors from resident and edited world snapshots', () => {
    const tileIds = getSmallTreeTileIds();
    const world = new TileWorld(0);
    const editedAnchorTileX = CHUNK_SIZE * 3 + 1;

    world.setTile(1, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(world.setTile(1, -1, tileIds.sapling)).toBe(true);
    world.setTile(editedAnchorTileX, 0, PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(world.setTile(editedAnchorTileX, -1, tileIds.sapling)).toBe(true);
    expect(
      world.pruneChunksOutside({
        minChunkX: 0,
        minChunkY: -1,
        maxChunkX: 0,
        maxChunkY: 0
      })
    ).toBeGreaterThan(0);

    expect(collectTrackedPlantedSmallTreeAnchorsFromWorldSnapshot(world.createSnapshot())).toEqual([
      { anchorTileX: 1, anchorTileY: 0 },
      { anchorTileX: editedAnchorTileX, anchorTileY: 0 }
    ]);
  });

  it('requires the full small-tree growth footprint to stay resident before a tracked anchor can grow', () => {
    const trackedAnchor = {
      anchorTileX: CHUNK_SIZE - 1,
      anchorTileY: 0
    };
    const residentChunkKeys = new Set<string>(['0,-1', '0,0', '1,0']);

    expect(
      isSmallTreeGrowthTrackedAnchorResident(
        trackedAnchor,
        (chunkX, chunkY) => residentChunkKeys.has(createTileKey(chunkX, chunkY))
      )
    ).toBe(false);

    residentChunkKeys.add('1,-1');
    expect(
      isSmallTreeGrowthTrackedAnchorResident(
        trackedAnchor,
        (chunkX, chunkY) => residentChunkKeys.has(createTileKey(chunkX, chunkY))
      )
    ).toBe(true);
  });

  it('hashes anchor coordinates into a stable non-negative growth window index', () => {
    expect(resolveSmallTreeGrowthWindowIndex(0, 0, 4)).toBe(0);
    expect(resolveSmallTreeGrowthWindowIndex(1, 0, 4)).toBe(1);
    expect(resolveSmallTreeGrowthWindowIndex(-7, 3, 4)).toBeGreaterThanOrEqual(0);
    expect(resolveSmallTreeGrowthWindowIndex(-7, 3, 4)).toBeLessThan(4);
  });
});
