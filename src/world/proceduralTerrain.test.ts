import { describe, expect, it } from 'vitest';

import {
  PROCEDURAL_DIRT_TILE_ID,
  PROCEDURAL_GRASS_SURFACE_TILE_ID,
  PROCEDURAL_STONE_TILE_ID,
  resolveProceduralTerrainColumn,
  resolveProceduralTerrainTileId
} from './proceduralTerrain';

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
});
