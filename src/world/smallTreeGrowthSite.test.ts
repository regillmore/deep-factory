import { describe, expect, it } from 'vitest';

import { PROCEDURAL_DIRT_TILE_ID, PROCEDURAL_GRASS_SURFACE_TILE_ID } from './proceduralTerrain';
import {
  GROWN_SMALL_TREE_FOOTPRINT_CELLS,
  PLANTED_SMALL_TREE_FOOTPRINT_CELLS,
  type SmallTreeFootprintCell
} from './smallTreeFootprints';
import {
  evaluateSmallTreeGrowthSiteAtAnchor,
  type SmallTreeGrowthSiteWorldView
} from './smallTreeGrowthSite';
import { getSmallTreeTileIds } from './smallTreeTiles';
import { parseTileMetadataRegistry, type TileMetadataRegistry } from './tileMetadata';

interface SmallTreeWorldTile {
  tileX: number;
  tileY: number;
  tileId: number;
}

const createTileKey = (tileX: number, tileY: number): string => `${tileX},${tileY}`;

const createSmallTreeWorldView = (
  tiles: readonly SmallTreeWorldTile[]
): SmallTreeGrowthSiteWorldView => {
  const tileMap = new Map<string, number>(tiles.map((tile) => [createTileKey(tile.tileX, tile.tileY), tile.tileId]));

  return {
    getTile: (worldTileX, worldTileY) => tileMap.get(createTileKey(worldTileX, worldTileY)) ?? 0
  };
};

const createFootprintTiles = (
  anchorTileX: number,
  anchorTileY: number,
  footprintCells: readonly Readonly<SmallTreeFootprintCell>[],
  registry?: TileMetadataRegistry
): SmallTreeWorldTile[] => {
  const tileIds = getSmallTreeTileIds(registry);
  return footprintCells.map((cell) => ({
    tileX: anchorTileX + cell.localX,
    tileY: anchorTileY + cell.localY,
    tileId: tileIds[cell.tileKind]
  }));
};

describe('smallTreeGrowthSite', () => {
  it('treats only grass anchors as plantable sites', () => {
    const grassWorld = createSmallTreeWorldView([
      { tileX: 4, tileY: -7, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID }
    ]);
    const dirtWorld = createSmallTreeWorldView([{ tileX: 4, tileY: -7, tileId: PROCEDURAL_DIRT_TILE_ID }]);

    expect(evaluateSmallTreeGrowthSiteAtAnchor(grassWorld, 4, -7)).toEqual({
      anchorTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
      hasGrassAnchor: true,
      currentGrowthStage: null,
      blockedGrowthTiles: [],
      hasUnobstructedGrowthSpace: true,
      canPlant: true,
      canGrow: false
    });
    expect(evaluateSmallTreeGrowthSiteAtAnchor(dirtWorld, 4, -7)).toEqual({
      anchorTileId: PROCEDURAL_DIRT_TILE_ID,
      hasGrassAnchor: false,
      currentGrowthStage: null,
      blockedGrowthTiles: [],
      hasUnobstructedGrowthSpace: true,
      canPlant: false,
      canGrow: false
    });
  });

  it('allows a planted sapling to grow when the above-anchor grown footprint stays empty', () => {
    const anchorTileX = -3;
    const anchorTileY = 6;
    const world = createSmallTreeWorldView([
      { tileX: anchorTileX, tileY: anchorTileY, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
      ...createFootprintTiles(anchorTileX, anchorTileY, PLANTED_SMALL_TREE_FOOTPRINT_CELLS)
    ]);

    expect(evaluateSmallTreeGrowthSiteAtAnchor(world, anchorTileX, anchorTileY)).toEqual({
      anchorTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
      hasGrassAnchor: true,
      currentGrowthStage: 'planted',
      blockedGrowthTiles: [],
      hasUnobstructedGrowthSpace: true,
      canPlant: false,
      canGrow: true
    });
  });

  it('blocks planted saplings from growing once their grass support anchor is lost', () => {
    const anchorTileX = 5;
    const anchorTileY = -4;
    const world = createSmallTreeWorldView([
      { tileX: anchorTileX, tileY: anchorTileY, tileId: PROCEDURAL_DIRT_TILE_ID },
      ...createFootprintTiles(anchorTileX, anchorTileY, PLANTED_SMALL_TREE_FOOTPRINT_CELLS)
    ]);

    expect(evaluateSmallTreeGrowthSiteAtAnchor(world, anchorTileX, anchorTileY)).toEqual({
      anchorTileId: PROCEDURAL_DIRT_TILE_ID,
      hasGrassAnchor: false,
      currentGrowthStage: 'planted',
      blockedGrowthTiles: [],
      hasUnobstructedGrowthSpace: true,
      canPlant: false,
      canGrow: false
    });
  });

  it('reports deterministic above-anchor obstructions before planted-to-grown replacement', () => {
    const anchorTileX = 8;
    const anchorTileY = -12;
    const world = createSmallTreeWorldView([
      { tileX: anchorTileX, tileY: anchorTileY, tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID },
      ...createFootprintTiles(anchorTileX, anchorTileY, PLANTED_SMALL_TREE_FOOTPRINT_CELLS),
      { tileX: anchorTileX - 1, tileY: anchorTileY - 3, tileId: 91 },
      { tileX: anchorTileX, tileY: anchorTileY - 2, tileId: 1 },
      { tileX: anchorTileX + 5, tileY: anchorTileY + 5, tileId: 77 }
    ]);

    expect(evaluateSmallTreeGrowthSiteAtAnchor(world, anchorTileX, anchorTileY)).toEqual({
      anchorTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
      hasGrassAnchor: true,
      currentGrowthStage: 'planted',
      blockedGrowthTiles: [
        {
          worldTileX: anchorTileX,
          worldTileY: anchorTileY - 2,
          tileId: 1
        },
        {
          worldTileX: anchorTileX - 1,
          worldTileY: anchorTileY - 3,
          tileId: 91
        }
      ],
      hasUnobstructedGrowthSpace: false,
      canPlant: false,
      canGrow: false
    });
  });

  it('resolves grass and small-tree tile ids by name from a provided registry', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 4,
          name: 'small_tree_leaf',
          render: { atlasIndex: 25 }
        },
        {
          id: 5,
          name: 'grass_surface',
          render: { atlasIndex: 1 }
        },
        {
          id: 11,
          name: 'small_tree_sapling',
          render: { atlasIndex: 23 }
        },
        {
          id: 23,
          name: 'small_tree_trunk',
          render: { atlasIndex: 24 }
        }
      ]
    });
    const plantableWorld = createSmallTreeWorldView([{ tileX: 2, tileY: 9, tileId: 5 }]);
    const plantedWorld = createSmallTreeWorldView([
      { tileX: 2, tileY: 9, tileId: 5 },
      ...createFootprintTiles(2, 9, PLANTED_SMALL_TREE_FOOTPRINT_CELLS, registry)
    ]);
    const grownWorld = createSmallTreeWorldView([
      { tileX: -6, tileY: 4, tileId: 5 },
      ...createFootprintTiles(-6, 4, GROWN_SMALL_TREE_FOOTPRINT_CELLS, registry)
    ]);

    expect(evaluateSmallTreeGrowthSiteAtAnchor(plantableWorld, 2, 9, registry)).toEqual({
      anchorTileId: 5,
      hasGrassAnchor: true,
      currentGrowthStage: null,
      blockedGrowthTiles: [],
      hasUnobstructedGrowthSpace: true,
      canPlant: true,
      canGrow: false
    });
    expect(evaluateSmallTreeGrowthSiteAtAnchor(plantedWorld, 2, 9, registry)).toMatchObject({
      anchorTileId: 5,
      hasGrassAnchor: true,
      currentGrowthStage: 'planted',
      canPlant: false,
      canGrow: true
    });
    expect(evaluateSmallTreeGrowthSiteAtAnchor(grownWorld, -6, 4, registry)).toEqual({
      anchorTileId: 5,
      hasGrassAnchor: true,
      currentGrowthStage: 'grown',
      blockedGrowthTiles: [
        {
          worldTileX: -6,
          worldTileY: 3,
          tileId: 23
        },
        {
          worldTileX: -6,
          worldTileY: 2,
          tileId: 23
        },
        {
          worldTileX: -7,
          worldTileY: 1,
          tileId: 4
        },
        {
          worldTileX: -6,
          worldTileY: 1,
          tileId: 4
        },
        {
          worldTileX: -5,
          worldTileY: 1,
          tileId: 4
        }
      ],
      hasUnobstructedGrowthSpace: false,
      canPlant: false,
      canGrow: false
    });
  });
});
