import { describe, expect, it } from 'vitest';

import {
  PROCEDURAL_DIRT_TILE_ID,
  PROCEDURAL_GRASS_SURFACE_TILE_ID,
  PROCEDURAL_STONE_TILE_ID,
  resolveProceduralTerrainColumn,
  resolveProceduralTerrainTileId
} from './proceduralTerrain';

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

const resolveLargestConnectedCaveComponentSize = (
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
  it('layers sky, grass, dirt, and stone around the sampled surface', () => {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(-48);

    expect(resolveProceduralTerrainTileId(-48, surfaceTileY - 1)).toBe(0);
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY + 1)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY + dirtDepthTiles)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(resolveProceduralTerrainTileId(-48, surfaceTileY + dirtDepthTiles + 1)).toBe(
      PROCEDURAL_STONE_TILE_ID
    );
  });

  it('keeps a small underground stone overburden before cave air begins', () => {
    for (let worldX = -32; worldX <= 32; worldX += 1) {
      const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX);
      for (let worldY = surfaceTileY + 1; worldY <= surfaceTileY + dirtDepthTiles + 2; worldY += 1) {
        expect(resolveProceduralTerrainTileId(worldX, worldY)).not.toBe(0);
      }
    }
  });

  it('carves large connected cave air pockets below the surface bands', () => {
    const caveTiles = collectUndergroundCaveTileCoords();

    expect(caveTiles.length).toBeGreaterThan(0);
    expect(resolveLargestConnectedCaveComponentSize(caveTiles)).toBeGreaterThanOrEqual(64);
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
});
