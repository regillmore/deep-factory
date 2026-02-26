import { describe, expect, it } from 'vitest';

import { runDebugFloodFill, type DebugFloodFillTileBounds } from './debugFloodFill';

interface TestGrid {
  width: number;
  height: number;
  tiles: number[][];
}

const createGrid = (rows: number[][]): TestGrid => ({
  width: rows[0]?.length ?? 0,
  height: rows.length,
  tiles: rows.map((row) => [...row])
});

const fullGridBounds = (grid: TestGrid): DebugFloodFillTileBounds => ({
  minTileX: 0,
  minTileY: 0,
  maxTileX: Math.max(0, grid.width - 1),
  maxTileY: Math.max(0, grid.height - 1)
});

const runFloodFillOnGrid = (
  grid: TestGrid,
  startTileX: number,
  startTileY: number,
  replacementTileId: number,
  bounds = fullGridBounds(grid)
) => {
  const filledTiles: Array<[number, number]> = [];
  const result = runDebugFloodFill({
    startTileX,
    startTileY,
    replacementTileId,
    bounds,
    readTile: (worldTileX, worldTileY) => grid.tiles[worldTileY]![worldTileX]!,
    visitFilledTile: (worldTileX, worldTileY) => {
      grid.tiles[worldTileY]![worldTileX] = replacementTileId;
      filledTiles.push([worldTileX, worldTileY]);
    }
  });
  return { result, filledTiles };
};

describe('runDebugFloodFill', () => {
  it('fills a 4-connected region and excludes diagonal-only matches', () => {
    const grid = createGrid([
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1]
    ]);

    const { result, filledTiles } = runFloodFillOnGrid(grid, 1, 1, 2);

    expect(result).toEqual({ targetTileId: 1, filledTileCount: 1 });
    expect(filledTiles).toEqual([[1, 1]]);
    expect(grid.tiles).toEqual([
      [1, 0, 1],
      [0, 2, 0],
      [1, 0, 1]
    ]);
  });

  it('fills the connected region within bounds and does not spill across a wall', () => {
    const grid = createGrid([
      [1, 1, 1, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1]
    ]);

    const { result } = runFloodFillOnGrid(grid, 0, 0, 7);

    expect(result).toEqual({ targetTileId: 1, filledTileCount: 14 });
    expect(grid.tiles).toEqual([
      [7, 7, 7, 0, 7],
      [7, 0, 7, 0, 7],
      [7, 0, 0, 0, 7],
      [7, 7, 7, 7, 7]
    ]);
  });

  it('respects explicit tile bounds to avoid expanding outside the resident area', () => {
    const grid = createGrid([
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0]
    ]);

    const { result } = runFloodFillOnGrid(grid, 2, 2, 9, {
      minTileX: 2,
      minTileY: 1,
      maxTileX: 3,
      maxTileY: 3
    });

    expect(result).toEqual({ targetTileId: 1, filledTileCount: 6 });
    expect(grid.tiles).toEqual([
      [0, 0, 0, 0, 0],
      [0, 1, 9, 9, 0],
      [0, 1, 9, 9, 0],
      [0, 1, 9, 9, 0],
      [0, 0, 0, 0, 0]
    ]);
  });

  it('returns no-op when replacement matches the start tile ID', () => {
    const grid = createGrid([
      [2, 2],
      [2, 0]
    ]);

    const { result, filledTiles } = runFloodFillOnGrid(grid, 0, 0, 2);

    expect(result).toEqual({ targetTileId: 2, filledTileCount: 0 });
    expect(filledTiles).toEqual([]);
    expect(grid.tiles).toEqual([
      [2, 2],
      [2, 0]
    ]);
  });

  it('returns no-op when the start tile is outside the fill bounds', () => {
    const grid = createGrid([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ]);

    const { result, filledTiles } = runFloodFillOnGrid(grid, 0, 0, 5, {
      minTileX: 1,
      minTileY: 1,
      maxTileX: 2,
      maxTileY: 2
    });

    expect(result).toEqual({ targetTileId: null, filledTileCount: 0 });
    expect(filledTiles).toEqual([]);
  });
});
