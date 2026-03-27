import { describe, expect, it } from 'vitest';

import {
  PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES,
  PROCEDURAL_COPPER_ORE_TILE_ID,
  PROCEDURAL_DIRT_TILE_ID,
  PROCEDURAL_DIRT_WALL_ID,
  PROCEDURAL_GRASS_SURFACE_TILE_ID,
  PROCEDURAL_STONE_TILE_ID,
  PROCEDURAL_STONE_WALL_ID,
  resolveProceduralTerrainColumn,
  resolveProceduralTerrainTileId,
  resolveProceduralTerrainWallId
} from './proceduralTerrain';
import { GROWN_SMALL_TREE_FOOTPRINT_CELLS } from './smallTreeFootprints';
import { resolveSmallTreeGrowthStageAtAnchor } from './smallTreeAnchors';
import { getSmallTreeTileIds } from './smallTreeTiles';
import { getSurfaceFlowerTileId } from './surfaceFlowerTiles';
import { getTallGrassTileId } from './tallGrassTiles';

const collectUndergroundCaveTileCoords = (
  worldSeed = 0,
  minWorldX = -96,
  maxWorldX = 96
): Array<{ worldX: number; worldY: number }> => {
  const coords: Array<{ worldX: number; worldY: number }> = [];
  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
    const minWorldY = surfaceTileY + dirtDepthTiles + 3;
    const maxWorldY = surfaceTileY + 36;
    for (let worldY = minWorldY; worldY <= maxWorldY; worldY += 1) {
      if (resolveProceduralTerrainTileId(worldX, worldY, worldSeed) === 0) {
        coords.push({ worldX, worldY });
      }
    }
  }

  return coords;
};

const collectExposedCaveMouthColumns = (
  worldSeed = 0,
  minWorldX = -256,
  maxWorldX = 256
): Array<{ worldX: number; surfaceTileY: number; dirtDepthTiles: number; deepestAirTileY: number }> => {
  const columns: Array<{
    worldX: number;
    surfaceTileY: number;
    dirtDepthTiles: number;
    deepestAirTileY: number;
  }> = [];

  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
    if (resolveProceduralTerrainTileId(worldX, surfaceTileY, worldSeed) !== 0) {
      continue;
    }

    let deepestAirTileY = surfaceTileY;
    const maxTrackedDepthTileY = surfaceTileY + dirtDepthTiles + 24;
    while (
      deepestAirTileY < maxTrackedDepthTileY &&
      resolveProceduralTerrainTileId(worldX, deepestAirTileY + 1, worldSeed) === 0
    ) {
      deepestAirTileY += 1;
    }

    if (deepestAirTileY < surfaceTileY + dirtDepthTiles + 3) {
      continue;
    }

    columns.push({
      worldX,
      surfaceTileY,
      dirtDepthTiles,
      deepestAirTileY
    });
  }

  return columns;
};

const collectStoneWallTileCoords = (
  worldSeed = 0,
  minWorldX = -96,
  maxWorldX = 96
): Array<{ worldX: number; worldY: number }> => {
  const coords: Array<{ worldX: number; worldY: number }> = [];
  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
    const minWorldY = surfaceTileY + dirtDepthTiles + 3;
    const maxWorldY = surfaceTileY + 36;
    for (let worldY = minWorldY; worldY <= maxWorldY; worldY += 1) {
      if (resolveProceduralTerrainWallId(worldX, worldY, worldSeed) === PROCEDURAL_STONE_WALL_ID) {
        coords.push({ worldX, worldY });
      }
    }
  }

  return coords;
};

const collectDirtWallTileCoords = (
  worldSeed = 0,
  minWorldX = -96,
  maxWorldX = 96
): Array<{ worldX: number; worldY: number }> => {
  const coords: Array<{ worldX: number; worldY: number }> = [];
  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
    for (let worldY = surfaceTileY; worldY <= surfaceTileY + dirtDepthTiles; worldY += 1) {
      if (resolveProceduralTerrainWallId(worldX, worldY, worldSeed) === PROCEDURAL_DIRT_WALL_ID) {
        coords.push({ worldX, worldY });
      }
    }
  }

  return coords;
};

const collectCopperOreTileCoords = (
  worldSeed = 0,
  minWorldX = -256,
  maxWorldX = 256
): Array<{ worldX: number; worldY: number }> => {
  const coords: Array<{ worldX: number; worldY: number }> = [];

  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
    const minWorldY = surfaceTileY + dirtDepthTiles + 4;
    const maxWorldY = surfaceTileY + dirtDepthTiles + 40;
    for (let worldY = minWorldY; worldY <= maxWorldY; worldY += 1) {
      if (resolveProceduralTerrainTileId(worldX, worldY, worldSeed) === PROCEDURAL_COPPER_ORE_TILE_ID) {
        coords.push({ worldX, worldY });
      }
    }
  }

  return coords;
};

const collectSurfaceFlowerTileCoords = (
  worldSeed = 0,
  minWorldX = -256,
  maxWorldX = 256
): Array<{ worldX: number; worldY: number }> => {
  const coords: Array<{ worldX: number; worldY: number }> = [];
  const surfaceFlowerTileId = getSurfaceFlowerTileId();

  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldX, worldSeed);
    const flowerTileY = surfaceTileY - 1;
    if (resolveProceduralTerrainTileId(worldX, flowerTileY, worldSeed) !== surfaceFlowerTileId) {
      continue;
    }

    coords.push({
      worldX,
      worldY: flowerTileY
    });
  }

  return coords;
};

const collectTallGrassTileCoords = (
  worldSeed = 0,
  minWorldX = -256,
  maxWorldX = 256
): Array<{ worldX: number; worldY: number }> => {
  const coords: Array<{ worldX: number; worldY: number }> = [];
  const tallGrassTileId = getTallGrassTileId();

  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldX, worldSeed);
    const tallGrassTileY = surfaceTileY - 1;
    if (resolveProceduralTerrainTileId(worldX, tallGrassTileY, worldSeed) !== tallGrassTileId) {
      continue;
    }

    coords.push({
      worldX,
      worldY: tallGrassTileY
    });
  }

  return coords;
};

const collectProceduralGrownSmallTreeAnchors = (
  worldSeed = 0,
  minWorldX = -256,
  maxWorldX = 256
): Array<{ anchorTileX: number; anchorTileY: number }> => {
  const proceduralWorldView = {
    getTile: (worldTileX: number, worldTileY: number) =>
      resolveProceduralTerrainTileId(worldTileX, worldTileY, worldSeed)
  };
  const anchors: Array<{ anchorTileX: number; anchorTileY: number }> = [];

  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldX, worldSeed);
    if (resolveSmallTreeGrowthStageAtAnchor(proceduralWorldView, worldX, surfaceTileY) !== 'grown') {
      continue;
    }

    anchors.push({
      anchorTileX: worldX,
      anchorTileY: surfaceTileY
    });
  }

  return anchors;
};

const collectProceduralPlantedSmallTreeAnchors = (
  worldSeed = 0,
  minWorldX = -256,
  maxWorldX = 256
): Array<{ anchorTileX: number; anchorTileY: number }> => {
  const proceduralWorldView = {
    getTile: (worldTileX: number, worldTileY: number) =>
      resolveProceduralTerrainTileId(worldTileX, worldTileY, worldSeed)
  };
  const anchors: Array<{ anchorTileX: number; anchorTileY: number }> = [];

  for (let worldX = minWorldX; worldX <= maxWorldX; worldX += 1) {
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldX, worldSeed);
    if (resolveSmallTreeGrowthStageAtAnchor(proceduralWorldView, worldX, surfaceTileY) !== 'planted') {
      continue;
    }

    anchors.push({
      anchorTileX: worldX,
      anchorTileY: surfaceTileY
    });
  }

  return anchors;
};

const PROCEDURAL_GROWN_SMALL_TREE_FOOTPRINT_HALF_WIDTH_TILES = GROWN_SMALL_TREE_FOOTPRINT_CELLS.reduce(
  (maxWidth, cell) => Math.max(maxWidth, Math.abs(cell.localX)),
  0
);

const resolveLargestConnectedComponentSize = (
  coords: ReadonlyArray<{ worldX: number; worldY: number }>
): number => {
  const remaining = new Set(coords.map(({ worldX, worldY }) => `${worldX},${worldY}`));
  let largestComponentSize = 0;

  while (remaining.size > 0) {
    const startKey = remaining.values().next().value as string | undefined;
    if (startKey === undefined) {
      break;
    }

    const queue = [startKey];
    remaining.delete(startKey);
    let componentSize = 0;

    while (queue.length > 0) {
      const currentKey = queue.shift();
      if (currentKey === undefined) {
        continue;
      }

      componentSize += 1;
      const [rawWorldX, rawWorldY] = currentKey.split(',');
      const worldX = Number(rawWorldX);
      const worldY = Number(rawWorldY);
      for (const neighbor of [
        `${worldX - 1},${worldY}`,
        `${worldX + 1},${worldY}`,
        `${worldX},${worldY - 1}`,
        `${worldX},${worldY + 1}`
      ]) {
        if (!remaining.has(neighbor)) {
          continue;
        }

        remaining.delete(neighbor);
        queue.push(neighbor);
      }
    }

    largestComponentSize = Math.max(largestComponentSize, componentSize);
  }

  return largestComponentSize;
};

describe('resolveProceduralTerrainColumn', () => {
  it('locks the rolling surface profile to deterministic sample heights', () => {
    expect(
      [-64, -48, -32, -16, 0, 16, 32, 48, 64].map((worldX) => ({
        worldX,
        column: resolveProceduralTerrainColumn(worldX)
      }))
    ).toEqual([
      { worldX: -64, column: { surfaceTileY: -2, dirtDepthTiles: 4 } },
      { worldX: -48, column: { surfaceTileY: -4, dirtDepthTiles: 3 } },
      { worldX: -32, column: { surfaceTileY: -10, dirtDepthTiles: 3 } },
      { worldX: -16, column: { surfaceTileY: -5, dirtDepthTiles: 5 } },
      { worldX: 0, column: { surfaceTileY: -1, dirtDepthTiles: 5 } },
      { worldX: 16, column: { surfaceTileY: 3, dirtDepthTiles: 4 } },
      { worldX: 32, column: { surfaceTileY: 0, dirtDepthTiles: 3 } },
      { worldX: 48, column: { surfaceTileY: 3, dirtDepthTiles: 3 } },
      { worldX: 64, column: { surfaceTileY: 2, dirtDepthTiles: 5 } }
    ]);
  });

  it('keeps adjacent surface steps bounded for rolling traversal-friendly terrain', () => {
    let previousSurfaceTileY = resolveProceduralTerrainColumn(-256).surfaceTileY;
    for (let worldX = -255; worldX <= 256; worldX += 1) {
      const currentSurfaceTileY = resolveProceduralTerrainColumn(worldX).surfaceTileY;
      expect(Math.abs(currentSurfaceTileY - previousSurfaceTileY)).toBeLessThanOrEqual(1);
      previousSurfaceTileY = currentSurfaceTileY;
    }
  });

  it('derives deterministic but seed-varying columns from nonzero world seeds', () => {
    const seededSamples = [-64, -48, -32, -16, 0, 16, 32, 48, 64].map((worldX) => ({
      worldX,
      column: resolveProceduralTerrainColumn(worldX, 0x12345678)
    }));

    expect(seededSamples).toEqual(
      [-64, -48, -32, -16, 0, 16, 32, 48, 64].map((worldX) => ({
        worldX,
        column: resolveProceduralTerrainColumn(worldX, 0x12345678)
      }))
    );
    expect(seededSamples).not.toEqual(
      [-64, -48, -32, -16, 0, 16, 32, 48, 64].map((worldX) => ({
        worldX,
        column: resolveProceduralTerrainColumn(worldX, 0)
      }))
    );
  });

  it('keeps seeded adjacent surface steps bounded for traversal-friendly terrain', () => {
    let previousSurfaceTileY = resolveProceduralTerrainColumn(-256, 0x12345678).surfaceTileY;
    for (let worldX = -255; worldX <= 256; worldX += 1) {
      const currentSurfaceTileY = resolveProceduralTerrainColumn(worldX, 0x12345678).surfaceTileY;
      expect(Math.abs(currentSurfaceTileY - previousSurfaceTileY)).toBeLessThanOrEqual(1);
      previousSurfaceTileY = currentSurfaceTileY;
    }
  });
});

describe('resolveProceduralTerrainTileId', () => {
  it('layers surface cover, grass, dirt, and stone around the sampled surface', () => {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(-48);
    const coverTileId = resolveProceduralTerrainTileId(-48, surfaceTileY - 1);
    const smallTreeTileIds = getSmallTreeTileIds();

    expect([
      getTallGrassTileId(),
      getSurfaceFlowerTileId(),
      smallTreeTileIds.sapling,
      smallTreeTileIds.trunk
    ]).toContain(
      coverTileId
    );
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY + 1)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY + dirtDepthTiles)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY + dirtDepthTiles + 1)).toBe(
      PROCEDURAL_STONE_TILE_ID
    );
  });

  it('keeps the protected origin corridor surface-supported above the cave bands', () => {
    for (
      let worldX = -PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES;
      worldX <= PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES;
      worldX += 1
    ) {
      const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX);
      expect(resolveProceduralTerrainTileId(worldX, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
      for (let worldY = surfaceTileY + 1; worldY <= surfaceTileY + dirtDepthTiles + 2; worldY += 1) {
        expect(resolveProceduralTerrainTileId(worldX, worldY)).not.toBe(0);
      }
    }
  });

  it('opens occasional surface-connected cave mouths outside the protected origin corridor', () => {
    const mouthColumns = collectExposedCaveMouthColumns();

    expect(mouthColumns.length).toBeGreaterThan(0);
    for (const mouth of mouthColumns) {
      expect(Math.abs(mouth.worldX)).toBeGreaterThan(
        PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES
      );
      expect(mouth.deepestAirTileY).toBeGreaterThanOrEqual(
        mouth.surfaceTileY + mouth.dirtDepthTiles + 3
      );
    }
  });

  it('carves large connected cave air pockets below the surface bands', () => {
    const caveTiles = collectUndergroundCaveTileCoords();

    expect(caveTiles.length).toBeGreaterThan(0);
    expect(resolveLargestConnectedComponentSize(caveTiles)).toBeGreaterThanOrEqual(64);
    for (const caveTile of caveTiles) {
      const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(caveTile.worldX);
      expect(caveTile.worldY).toBeGreaterThanOrEqual(surfaceTileY + dirtDepthTiles + 3);
    }
  });

  it('keeps cave carving deterministic while varying the underground layout by world seed', () => {
    const seededCaves = collectUndergroundCaveTileCoords(0x12345678);

    expect(seededCaves).toEqual(collectUndergroundCaveTileCoords(0x12345678));
    expect(seededCaves).not.toEqual(collectUndergroundCaveTileCoords(0));
  });

  it('keeps cave-mouth entrances deterministic while varying their layout by world seed', () => {
    const seededMouthColumns = collectExposedCaveMouthColumns(0x12345678);

    expect(seededMouthColumns.length).toBeGreaterThan(0);
    expect(seededMouthColumns).toEqual(collectExposedCaveMouthColumns(0x12345678));
    expect(seededMouthColumns).not.toEqual(collectExposedCaveMouthColumns(0));
  });

  it('fills dirt bands with dirt walls and deeper underground with stone walls', () => {
    const caveTiles = collectUndergroundCaveTileCoords();
    const dirtWallTiles = collectDirtWallTileCoords();
    const mouthColumns = collectExposedCaveMouthColumns();

    expect(caveTiles.length).toBeGreaterThan(0);
    for (const caveTile of caveTiles) {
      const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(caveTile.worldX);
      expect(resolveProceduralTerrainTileId(caveTile.worldX, caveTile.worldY)).toBe(0);
      expect(resolveProceduralTerrainWallId(caveTile.worldX, caveTile.worldY)).toBe(PROCEDURAL_STONE_WALL_ID);
      expect(caveTile.worldY).toBeGreaterThanOrEqual(surfaceTileY + dirtDepthTiles + 3);
    }

    for (const worldX of [-16, 0, 16]) {
      const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX);
      const dirtTileY = surfaceTileY + 1;
      const undergroundStoneTileY = surfaceTileY + dirtDepthTiles + 1;
      expect(resolveProceduralTerrainTileId(worldX, dirtTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
      expect(resolveProceduralTerrainWallId(worldX, dirtTileY)).toBe(PROCEDURAL_DIRT_WALL_ID);
      expect(resolveProceduralTerrainTileId(worldX, undergroundStoneTileY)).toBe(PROCEDURAL_STONE_TILE_ID);
      expect(resolveProceduralTerrainWallId(worldX, undergroundStoneTileY)).toBe(PROCEDURAL_STONE_WALL_ID);
    }

    expect(dirtWallTiles.length).toBeGreaterThan(0);
    expect(mouthColumns.length).toBeGreaterThan(0);
    for (const mouth of mouthColumns) {
      expect(resolveProceduralTerrainWallId(mouth.worldX, mouth.surfaceTileY)).toBe(PROCEDURAL_DIRT_WALL_ID);
      expect(resolveProceduralTerrainWallId(mouth.worldX, mouth.surfaceTileY + 1)).toBe(PROCEDURAL_DIRT_WALL_ID);
      expect(resolveProceduralTerrainWallId(mouth.worldX, mouth.deepestAirTileY)).toBe(
        PROCEDURAL_STONE_WALL_ID
      );
    }
  });

  it('keeps dirt and stone wall fills deterministic while varying them by world seed', () => {
    const seededDirtWallTiles = collectDirtWallTileCoords(0x12345678);
    const seededStoneWallTiles = collectStoneWallTileCoords(0x12345678);

    expect(seededDirtWallTiles.length).toBeGreaterThan(0);
    expect(seededDirtWallTiles).toEqual(collectDirtWallTileCoords(0x12345678));
    expect(seededDirtWallTiles).not.toEqual(collectDirtWallTileCoords(0));
    expect(seededStoneWallTiles.length).toBeGreaterThan(0);
    expect(seededStoneWallTiles).toEqual(collectStoneWallTileCoords(0x12345678));
    expect(seededStoneWallTiles).not.toEqual(collectStoneWallTileCoords(0));
  });

  it('places connected copper-ore pockets only inside upper underground stone outside the protected origin corridor', () => {
    const copperOreTiles = collectCopperOreTileCoords();

    expect(copperOreTiles.length).toBeGreaterThan(0);
    expect(resolveLargestConnectedComponentSize(copperOreTiles)).toBeGreaterThanOrEqual(8);
    for (const oreTile of copperOreTiles) {
      const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(oreTile.worldX);
      expect(Math.abs(oreTile.worldX)).toBeGreaterThan(
        PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES
      );
      expect(oreTile.worldY).toBeGreaterThanOrEqual(surfaceTileY + dirtDepthTiles + 4);
      expect(oreTile.worldY).toBeLessThanOrEqual(surfaceTileY + dirtDepthTiles + 40);
    }
  });

  it('keeps copper-ore pocket layouts deterministic while varying them by world seed', () => {
    const seededCopperOreTiles = collectCopperOreTileCoords(0x12345678);

    expect(seededCopperOreTiles.length).toBeGreaterThan(0);
    expect(seededCopperOreTiles).toEqual(collectCopperOreTileCoords(0x12345678));
    expect(seededCopperOreTiles).not.toEqual(collectCopperOreTileCoords(0));
  });

  it('seeds occasional grown small-tree footprints above exposed procedural grass outside the protected origin corridor', () => {
    const tileIds = getSmallTreeTileIds();
    const grownSmallTreeAnchors = collectProceduralGrownSmallTreeAnchors();

    expect(grownSmallTreeAnchors.length).toBeGreaterThan(0);
    for (const anchor of grownSmallTreeAnchors) {
      expect(Math.abs(anchor.anchorTileX)).toBeGreaterThan(
        PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES + 1
      );
      expect(resolveProceduralTerrainTileId(anchor.anchorTileX, anchor.anchorTileY)).toBe(
        PROCEDURAL_GRASS_SURFACE_TILE_ID
      );

      for (const cell of GROWN_SMALL_TREE_FOOTPRINT_CELLS) {
        const worldX = anchor.anchorTileX + cell.localX;
        const worldY = anchor.anchorTileY + cell.localY;
        expect(resolveProceduralTerrainTileId(worldX, worldY)).toBe(tileIds[cell.tileKind]);
        expect(resolveProceduralTerrainWallId(worldX, worldY)).toBe(0);
      }
    }
  });

  it('keeps procedural grown small-tree placements deterministic while varying them by world seed', () => {
    const seededGrownSmallTrees = collectProceduralGrownSmallTreeAnchors(0x12345678);

    expect(seededGrownSmallTrees.length).toBeGreaterThan(0);
    expect(seededGrownSmallTrees).toEqual(collectProceduralGrownSmallTreeAnchors(0x12345678));
    expect(seededGrownSmallTrees).not.toEqual(collectProceduralGrownSmallTreeAnchors(0));
  });

  it('seeds planted small-tree anchors between mature procedural trees on exposed grass outside the protected origin corridor', () => {
    const tileIds = getSmallTreeTileIds();
    const grownSmallTreeAnchors = collectProceduralGrownSmallTreeAnchors(0, -512, 512);
    const plantedSmallTreeAnchors = collectProceduralPlantedSmallTreeAnchors();

    expect(plantedSmallTreeAnchors.length).toBeGreaterThan(0);
    for (const anchor of plantedSmallTreeAnchors) {
      expect(
        Math.abs(anchor.anchorTileX) - PROCEDURAL_GROWN_SMALL_TREE_FOOTPRINT_HALF_WIDTH_TILES
      ).toBeGreaterThan(PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES);
      expect(resolveProceduralTerrainTileId(anchor.anchorTileX, anchor.anchorTileY)).toBe(
        PROCEDURAL_GRASS_SURFACE_TILE_ID
      );
      expect(resolveProceduralTerrainTileId(anchor.anchorTileX, anchor.anchorTileY - 1)).toBe(
        tileIds.sapling
      );
      expect(resolveProceduralTerrainWallId(anchor.anchorTileX, anchor.anchorTileY - 1)).toBe(0);

      const leftNeighbor = [...grownSmallTreeAnchors]
        .reverse()
        .find((candidate) => candidate.anchorTileX < anchor.anchorTileX);
      const rightNeighbor = grownSmallTreeAnchors.find(
        (candidate) => candidate.anchorTileX > anchor.anchorTileX
      );

      expect(leftNeighbor).toBeDefined();
      expect(rightNeighbor).toBeDefined();
      expect(anchor.anchorTileX).toBeGreaterThan(leftNeighbor!.anchorTileX);
      expect(anchor.anchorTileX).toBeLessThan(rightNeighbor!.anchorTileX);
    }
  });

  it('keeps procedural planted small-tree anchors deterministic while varying them by world seed', () => {
    const seededPlantedSmallTrees = collectProceduralPlantedSmallTreeAnchors(0x12345678);

    expect(seededPlantedSmallTrees.length).toBeGreaterThan(0);
    expect(seededPlantedSmallTrees).toEqual(collectProceduralPlantedSmallTreeAnchors(0x12345678));
    expect(seededPlantedSmallTrees).not.toEqual(collectProceduralPlantedSmallTreeAnchors(0));
  });

  it('fills exposed procedural grass anchors not claimed by flowers, saplings, or mature trees with tall grass', () => {
    const tallGrassTileId = getTallGrassTileId();
    const surfaceFlowerTileId = getSurfaceFlowerTileId();
    const smallTreeTileIds = getSmallTreeTileIds();
    const tallGrassTiles = collectTallGrassTileCoords();

    expect(tallGrassTiles.length).toBeGreaterThan(0);
    for (let worldX = -256; worldX <= 256; worldX += 1) {
      const { surfaceTileY } = resolveProceduralTerrainColumn(worldX);
      if (resolveProceduralTerrainTileId(worldX, surfaceTileY) !== PROCEDURAL_GRASS_SURFACE_TILE_ID) {
        continue;
      }

      const coverTileId = resolveProceduralTerrainTileId(worldX, surfaceTileY - 1);
      expect([
        tallGrassTileId,
        surfaceFlowerTileId,
        smallTreeTileIds.sapling,
        smallTreeTileIds.trunk
      ]).toContain(coverTileId);
    }
    for (const tallGrassTile of tallGrassTiles) {
      const { surfaceTileY } = resolveProceduralTerrainColumn(tallGrassTile.worldX);
      expect(tallGrassTile.worldY).toBe(surfaceTileY - 1);
      expect(resolveProceduralTerrainTileId(tallGrassTile.worldX, tallGrassTile.worldY)).toBe(
        tallGrassTileId
      );
      expect(resolveProceduralTerrainWallId(tallGrassTile.worldX, tallGrassTile.worldY)).toBe(0);
      expect(resolveProceduralTerrainTileId(tallGrassTile.worldX, tallGrassTile.worldY + 1)).toBe(
        PROCEDURAL_GRASS_SURFACE_TILE_ID
      );
    }
  });

  it('keeps procedural tall-grass placements deterministic while varying them by world seed', () => {
    const seededTallGrassTiles = collectTallGrassTileCoords(0x12345678);

    expect(seededTallGrassTiles.length).toBeGreaterThan(0);
    expect(seededTallGrassTiles).toEqual(collectTallGrassTileCoords(0x12345678));
    expect(seededTallGrassTiles).not.toEqual(collectTallGrassTileCoords(0));
  });

  it('seeds occasional surface flowers above exposed procedural grass', () => {
    const surfaceFlowerTileId = getSurfaceFlowerTileId();
    const surfaceFlowerTiles = collectSurfaceFlowerTileCoords();

    expect(surfaceFlowerTiles.length).toBeGreaterThan(0);
    for (const flowerTile of surfaceFlowerTiles) {
      const { surfaceTileY } = resolveProceduralTerrainColumn(flowerTile.worldX);
      expect(flowerTile.worldY).toBe(surfaceTileY - 1);
      expect(resolveProceduralTerrainTileId(flowerTile.worldX, flowerTile.worldY)).toBe(
        surfaceFlowerTileId
      );
      expect(resolveProceduralTerrainWallId(flowerTile.worldX, flowerTile.worldY)).toBe(0);
      expect(resolveProceduralTerrainTileId(flowerTile.worldX, flowerTile.worldY + 1)).toBe(
        PROCEDURAL_GRASS_SURFACE_TILE_ID
      );
    }
  });

  it('keeps procedural surface-flower placements deterministic while varying them by world seed', () => {
    const seededSurfaceFlowers = collectSurfaceFlowerTileCoords(0x12345678);

    expect(seededSurfaceFlowers.length).toBeGreaterThan(0);
    expect(seededSurfaceFlowers).toEqual(collectSurfaceFlowerTileCoords(0x12345678));
    expect(seededSurfaceFlowers).not.toEqual(collectSurfaceFlowerTileCoords(0));
  });
});
