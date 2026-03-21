import { describe, expect, it } from 'vitest';

import {
  GROWN_SMALL_TREE_FOOTPRINT_CELLS,
  PLANTED_SMALL_TREE_FOOTPRINT_CELLS,
  type SmallTreeFootprintCell
} from './smallTreeFootprints';
import {
  applySmallTreeGrowthStageAtAnchor,
  clearSmallTreeGrowthStageAtAnchor,
  replaceSmallTreeGrowthStageAtAnchor,
  type SmallTreeMutableWorldView
} from './smallTreeFootprintWrites';
import { getSmallTreeTileIds } from './smallTreeTiles';

interface SmallTreeWorldTile {
  tileX: number;
  tileY: number;
  tileId: number;
}

interface TestSmallTreeMutableWorldView extends SmallTreeMutableWorldView {
  getWrittenTiles(): SmallTreeWorldTile[];
}

const createTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

const createTestSmallTreeMutableWorldView = (
  initialTiles: readonly SmallTreeWorldTile[] = []
): TestSmallTreeMutableWorldView => {
  const tiles = new Map<string, number>(
    initialTiles.map((tile) => [createTileKey(tile.tileX, tile.tileY), tile.tileId])
  );

  return {
    getTile: (worldTileX, worldTileY) => tiles.get(createTileKey(worldTileX, worldTileY)) ?? 0,
    setTile: (worldTileX, worldTileY, tileId) => {
      const key = createTileKey(worldTileX, worldTileY);
      const previousTileId = tiles.get(key) ?? 0;
      if (previousTileId === tileId) {
        return false;
      }

      if (tileId === 0) {
        tiles.delete(key);
      } else {
        tiles.set(key, tileId);
      }

      return true;
    },
    getWrittenTiles: () =>
      Array.from(tiles.entries())
        .map(([key, tileId]) => {
          const [rawTileX, rawTileY] = key.split(',');
          return {
            tileX: Number(rawTileX),
            tileY: Number(rawTileY),
            tileId
          };
        })
        .sort((left, right) => left.tileY - right.tileY || left.tileX - right.tileX)
  };
};

const createFootprintTiles = (
  anchorTileX: number,
  anchorTileY: number,
  footprintCells: readonly Readonly<SmallTreeFootprintCell>[],
  overrideTileId?: number
): SmallTreeWorldTile[] => {
  const tileIds = getSmallTreeTileIds();

  return footprintCells.map((cell) => ({
    tileX: anchorTileX + cell.localX,
    tileY: anchorTileY + cell.localY,
    tileId: overrideTileId ?? tileIds[cell.tileKind]
  }));
};

describe('smallTreeFootprintWrites', () => {
  it('applies a planted sapling footprint at the planted-base anchor', () => {
    const tileIds = getSmallTreeTileIds();
    const world = createTestSmallTreeMutableWorldView([{ tileX: 9, tileY: 2, tileId: 41 }]);

    const result = applySmallTreeGrowthStageAtAnchor(world, 4, -7, 'planted');

    expect(result).toEqual({
      changed: true,
      writes: [
        {
          worldTileX: 4,
          worldTileY: -7,
          previousTileId: 0,
          tileId: tileIds.sapling
        }
      ]
    });
    expect(world.getWrittenTiles()).toEqual([
      { tileX: 4, tileY: -7, tileId: tileIds.sapling },
      { tileX: 9, tileY: 2, tileId: 41 }
    ]);
  });

  it('applies the grown-tree footprint in canonical order and overwrites occupied target cells', () => {
    const overwriteTileId = 91;
    const tileIds = getSmallTreeTileIds();
    const anchorTileX = -3;
    const anchorTileY = 6;
    const world = createTestSmallTreeMutableWorldView([
      ...createFootprintTiles(anchorTileX, anchorTileY, GROWN_SMALL_TREE_FOOTPRINT_CELLS, overwriteTileId),
      { tileX: 8, tileY: 8, tileId: 77 }
    ]);

    const result = applySmallTreeGrowthStageAtAnchor(world, anchorTileX, anchorTileY, 'grown');

    expect(result).toEqual({
      changed: true,
      writes: [
        {
          worldTileX: -3,
          worldTileY: 6,
          previousTileId: overwriteTileId,
          tileId: tileIds.trunk
        },
        {
          worldTileX: -3,
          worldTileY: 5,
          previousTileId: overwriteTileId,
          tileId: tileIds.trunk
        },
        {
          worldTileX: -4,
          worldTileY: 4,
          previousTileId: overwriteTileId,
          tileId: tileIds.leaf
        },
        {
          worldTileX: -3,
          worldTileY: 4,
          previousTileId: overwriteTileId,
          tileId: tileIds.leaf
        },
        {
          worldTileX: -2,
          worldTileY: 4,
          previousTileId: overwriteTileId,
          tileId: tileIds.leaf
        }
      ]
    });
    expect(world.getWrittenTiles()).toEqual([
      { tileX: -4, tileY: 4, tileId: tileIds.leaf },
      { tileX: -3, tileY: 4, tileId: tileIds.leaf },
      { tileX: -2, tileY: 4, tileId: tileIds.leaf },
      { tileX: -3, tileY: 5, tileId: tileIds.trunk },
      { tileX: -3, tileY: 6, tileId: tileIds.trunk },
      { tileX: 8, tileY: 8, tileId: 77 }
    ]);
  });

  it('replaces a planted sapling footprint with the grown tree footprint', () => {
    const tileIds = getSmallTreeTileIds();
    const anchorTileX = 12;
    const anchorTileY = -9;
    const world = createTestSmallTreeMutableWorldView(
      createFootprintTiles(anchorTileX, anchorTileY, PLANTED_SMALL_TREE_FOOTPRINT_CELLS)
    );

    const result = replaceSmallTreeGrowthStageAtAnchor(
      world,
      anchorTileX,
      anchorTileY,
      'planted',
      'grown'
    );

    expect(result).toEqual({
      changed: true,
      writes: [
        {
          worldTileX: 12,
          worldTileY: -9,
          previousTileId: tileIds.sapling,
          tileId: tileIds.trunk
        },
        {
          worldTileX: 12,
          worldTileY: -10,
          previousTileId: 0,
          tileId: tileIds.trunk
        },
        {
          worldTileX: 11,
          worldTileY: -11,
          previousTileId: 0,
          tileId: tileIds.leaf
        },
        {
          worldTileX: 12,
          worldTileY: -11,
          previousTileId: 0,
          tileId: tileIds.leaf
        },
        {
          worldTileX: 13,
          worldTileY: -11,
          previousTileId: 0,
          tileId: tileIds.leaf
        }
      ]
    });
    expect(world.getWrittenTiles()).toEqual([
      { tileX: 11, tileY: -11, tileId: tileIds.leaf },
      { tileX: 12, tileY: -11, tileId: tileIds.leaf },
      { tileX: 13, tileY: -11, tileId: tileIds.leaf },
      { tileX: 12, tileY: -10, tileId: tileIds.trunk },
      { tileX: 12, tileY: -9, tileId: tileIds.trunk }
    ]);
  });

  it('replaces a grown tree with a planted sapling and clears prior-only canopy cells', () => {
    const tileIds = getSmallTreeTileIds();
    const anchorTileX = 1;
    const anchorTileY = 3;
    const world = createTestSmallTreeMutableWorldView([
      ...createFootprintTiles(anchorTileX, anchorTileY, GROWN_SMALL_TREE_FOOTPRINT_CELLS),
      { tileX: 9, tileY: 9, tileId: 55 }
    ]);

    const result = replaceSmallTreeGrowthStageAtAnchor(
      world,
      anchorTileX,
      anchorTileY,
      'grown',
      'planted'
    );

    expect(result).toEqual({
      changed: true,
      writes: [
        {
          worldTileX: 1,
          worldTileY: 3,
          previousTileId: tileIds.trunk,
          tileId: tileIds.sapling
        },
        {
          worldTileX: 1,
          worldTileY: 2,
          previousTileId: tileIds.trunk,
          tileId: 0
        },
        {
          worldTileX: 0,
          worldTileY: 1,
          previousTileId: tileIds.leaf,
          tileId: 0
        },
        {
          worldTileX: 1,
          worldTileY: 1,
          previousTileId: tileIds.leaf,
          tileId: 0
        },
        {
          worldTileX: 2,
          worldTileY: 1,
          previousTileId: tileIds.leaf,
          tileId: 0
        }
      ]
    });
    expect(world.getWrittenTiles()).toEqual([
      { tileX: 1, tileY: 3, tileId: tileIds.sapling },
      { tileX: 9, tileY: 9, tileId: 55 }
    ]);
  });

  it('clears the full prior grown footprint for future tree-break cleanup', () => {
    const tileIds = getSmallTreeTileIds();
    const anchorTileX = -8;
    const anchorTileY = 4;
    const world = createTestSmallTreeMutableWorldView(
      createFootprintTiles(anchorTileX, anchorTileY, GROWN_SMALL_TREE_FOOTPRINT_CELLS)
    );

    const result = clearSmallTreeGrowthStageAtAnchor(world, anchorTileX, anchorTileY, 'grown');

    expect(result).toEqual({
      changed: true,
      writes: [
        {
          worldTileX: -8,
          worldTileY: 4,
          previousTileId: tileIds.trunk,
          tileId: 0
        },
        {
          worldTileX: -8,
          worldTileY: 3,
          previousTileId: tileIds.trunk,
          tileId: 0
        },
        {
          worldTileX: -9,
          worldTileY: 2,
          previousTileId: tileIds.leaf,
          tileId: 0
        },
        {
          worldTileX: -8,
          worldTileY: 2,
          previousTileId: tileIds.leaf,
          tileId: 0
        },
        {
          worldTileX: -7,
          worldTileY: 2,
          previousTileId: tileIds.leaf,
          tileId: 0
        }
      ]
    });
    expect(world.getWrittenTiles()).toEqual([]);
  });
});
