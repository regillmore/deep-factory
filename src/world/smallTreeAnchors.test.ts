import { describe, expect, it } from 'vitest';

import {
  GROWN_SMALL_TREE_FOOTPRINT_CELLS,
  PLANTED_SMALL_TREE_FOOTPRINT_CELLS,
  type SmallTreeFootprintCell
} from './smallTreeFootprints';
import {
  resolveSmallTreeAnchorFromSampledTile,
  resolveSmallTreeGrowthStageAtAnchor,
  type SmallTreeAnchorWorldView
} from './smallTreeAnchors';
import { getSmallTreeTileIds } from './smallTreeTiles';

interface SmallTreeWorldTile {
  tileX: number;
  tileY: number;
  tileId: number;
}

const createTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

const createSmallTreeWorldView = (
  tiles: readonly SmallTreeWorldTile[]
): SmallTreeAnchorWorldView => {
  const tileMap = new Map<string, number>(
    tiles.map((tile) => [createTileKey(tile.tileX, tile.tileY), tile.tileId])
  );

  return {
    getTile: (worldTileX, worldTileY) => tileMap.get(createTileKey(worldTileX, worldTileY)) ?? 0
  };
};

const createFootprintTiles = (
  anchorTileX: number,
  anchorTileY: number,
  footprintCells: readonly Readonly<SmallTreeFootprintCell>[]
): SmallTreeWorldTile[] => {
  const tileIds = getSmallTreeTileIds();
  return footprintCells.map((cell) => ({
    tileX: anchorTileX + cell.localX,
    tileY: anchorTileY + cell.localY,
    tileId: tileIds[cell.tileKind]
  }));
};

describe('smallTreeAnchors', () => {
  it('detects planted and grown small-tree stages at their planted-base anchors', () => {
    const plantedWorld = createSmallTreeWorldView(createFootprintTiles(4, -7, PLANTED_SMALL_TREE_FOOTPRINT_CELLS));
    const grownWorld = createSmallTreeWorldView(createFootprintTiles(-3, 9, GROWN_SMALL_TREE_FOOTPRINT_CELLS));

    expect(resolveSmallTreeGrowthStageAtAnchor(plantedWorld, 4, -7)).toBe('planted');
    expect(resolveSmallTreeGrowthStageAtAnchor(grownWorld, -3, 9)).toBe('grown');
  });

  it('rejects incomplete grown-tree footprints at the planted-base anchor', () => {
    const incompleteGrownWorld = createSmallTreeWorldView(
      createFootprintTiles(11, -4, GROWN_SMALL_TREE_FOOTPRINT_CELLS).filter(
        (tile) => !(tile.tileX === 12 && tile.tileY === -6)
      )
    );

    expect(resolveSmallTreeGrowthStageAtAnchor(incompleteGrownWorld, 11, -4)).toBeNull();
  });

  it('resolves a planted sapling tile back to its own planted-base anchor', () => {
    const world = createSmallTreeWorldView(createFootprintTiles(-6, 3, PLANTED_SMALL_TREE_FOOTPRINT_CELLS));

    expect(resolveSmallTreeAnchorFromSampledTile(world, -6, 3)).toEqual({
      anchorTileX: -6,
      anchorTileY: 3,
      growthStage: 'planted'
    });
  });

  it('resolves any grown canopy or trunk hit back to the canonical planted-base anchor', () => {
    const anchorTileX = 8;
    const anchorTileY = -12;
    const world = createSmallTreeWorldView(
      createFootprintTiles(anchorTileX, anchorTileY, GROWN_SMALL_TREE_FOOTPRINT_CELLS)
    );

    for (const cell of GROWN_SMALL_TREE_FOOTPRINT_CELLS) {
      expect(
        resolveSmallTreeAnchorFromSampledTile(
          world,
          anchorTileX + cell.localX,
          anchorTileY + cell.localY
        )
      ).toEqual({
        anchorTileX,
        anchorTileY,
        growthStage: 'grown'
      });
    }
  });

  it('rejects stray or incomplete sampled tree tiles that do not belong to a full anchored tree', () => {
    const tileIds = getSmallTreeTileIds();
    const world = createSmallTreeWorldView([
      { tileX: 2, tileY: 1, tileId: tileIds.trunk },
      { tileX: 3, tileY: 1, tileId: tileIds.leaf },
      { tileX: -4, tileY: -2, tileId: 1 }
    ]);

    expect(resolveSmallTreeAnchorFromSampledTile(world, 2, 1)).toBeNull();
    expect(resolveSmallTreeAnchorFromSampledTile(world, 3, 1)).toBeNull();
    expect(resolveSmallTreeAnchorFromSampledTile(world, -4, -2)).toBeNull();
  });
});
