import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE, MAX_LIGHT_LEVEL } from './constants';
import { recomputeSunlightFromExposedChunkTops } from './sunlight';
import { getTileEmissiveLightLevel, parseTileMetadataRegistry } from './tileMetadata';
import { TileWorld } from './world';

const localLightColumnBit = (localX: number): number => (1 << localX) >>> 0;
const emissiveTestRegistry = parseTileMetadataRegistry({
  tiles: [
    {
      id: 0,
      name: 'empty',
      gameplay: { solid: false, blocksLight: false }
    },
    {
      id: 1,
      name: 'solid',
      gameplay: { solid: true, blocksLight: true },
      render: { atlasIndex: 0 }
    },
    {
      id: 2,
      name: 'debug_light',
      gameplay: { solid: false, blocksLight: false, emissiveLight: 12 },
      render: { atlasIndex: 1 }
    }
  ]
});

describe('recomputeSunlightFromExposedChunkTops', () => {
  it('propagates sunlight downward from exposed chunk tops and lights the first blocking tile', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -1);

    world.setTile(0, -32, 0);
    world.setTile(0, -31, 0);
    world.setTile(0, -30, 1);
    world.setTile(0, -29, 0);
    world.setTile(0, 0, 0);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(2);
    expect(world.getLightLevel(0, -32)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -31)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -30)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -29)).toBe(0);
    expect(world.getLightLevel(0, 0)).toBe(0);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('keeps lower chunks unlit when a loaded chunk above blocks sunlight after the blocker receives sunlight', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -2);
    world.ensureChunk(0, -1);

    world.setTile(0, -34, 0);
    world.setTile(0, -33, 1);
    world.setTile(0, -32, 0);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(3);
    expect(world.getLightLevel(0, -34)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -33)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -32)).toBe(0);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('lights blocking stacked solids that are laterally adjacent to sunlit air without lighting tiles behind them', () => {
    const world = new TileWorld(0);

    for (let worldTileY = 0; worldTileY <= 4; worldTileY += 1) {
      world.setTile(1, worldTileY, 0);
      world.setTile(0, worldTileY, 1);
      world.setTile(-1, worldTileY, 1);
    }

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(2);
    expect(world.getLightLevel(0, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, 1)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, 4)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(-1, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(-1, 1)).toBe(0);
    expect(world.getLightLevel(-1, 4)).toBe(0);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('lights a lower middle solid beneath a hovering blocker after horizontal sunlight transport relights the gap air', () => {
    const world = new TileWorld(0);

    for (const worldTileX of [-1, 0, 1]) {
      for (const worldTileY of [-2, -1, 0, 1, 2]) {
        world.setTile(worldTileX, worldTileY, 0);
      }
    }

    world.setTile(0, 0, 1);
    world.setTile(-1, 2, 1);
    world.setTile(0, 2, 1);
    world.setTile(1, 2, 1);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(4);
    expect(world.getLightLevel(0, 1)).toBe(0);
    expect(world.getLightLevel(0, 2)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('clears stale lower-row solid-face sunlight as a one-tile-gap roof is built one tile at a time', () => {
    const world = new TileWorld(0);
    const rowStartWorldTileX = 4;
    const rowEndWorldTileX = 13;
    const lowerRowWorldTileY = -20;
    const gapWorldTileY = lowerRowWorldTileY - 1;
    const roofWorldTileY = lowerRowWorldTileY - 2;

    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      world.setTile(worldTileX, lowerRowWorldTileY, 1);
      world.setTile(worldTileX, gapWorldTileY, 0);
      world.setTile(worldTileX, roofWorldTileY, 0);
    }

    recomputeSunlightFromExposedChunkTops(world);
    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      expect(world.getLightLevel(worldTileX, lowerRowWorldTileY)).toBe(MAX_LIGHT_LEVEL);
    }

    for (let worldTileX = rowStartWorldTileX; worldTileX <= rowEndWorldTileX; worldTileX += 1) {
      world.setTile(worldTileX, roofWorldTileY, 1);
      recomputeSunlightFromExposedChunkTops(world);
    }

    expect(world.getLightLevel(rowStartWorldTileX, lowerRowWorldTileY)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(rowEndWorldTileX, lowerRowWorldTileY)).toBe(MAX_LIGHT_LEVEL);
    for (let worldTileX = rowStartWorldTileX + 1; worldTileX < rowEndWorldTileX; worldTileX += 1) {
      expect(world.getLightLevel(worldTileX, lowerRowWorldTileY)).toBe(0);
    }
  });

  it('recomputes only chunk columns that contain dirty resident light chunks', () => {
    const world = new TileWorld(1);

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    world.invalidateChunkLight(1, 0);

    expect(world.getLightLevel(CHUNK_SIZE, -32)).toBe(7);
    expect(world.getLightLevel(0, -32)).toBe(7);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(3);
    expect(world.getLightLevel(CHUNK_SIZE, -32)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, -32)).toBe(7);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('returns early when no resident chunks are dirty', () => {
    const world = new TileWorld(0);

    for (const coord of world.getDirtyLightChunkCoords()) {
      world.markChunkLightClean(coord.x, coord.y);
    }

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(0);
  });

  it('recomputes only dirty local sunlight columns within a dirty resident chunk column', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -1);

    world.setTile(0, -32, 0);
    world.setTile(1, -32, 0);

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    world.invalidateChunkLightColumns(0, 0, localLightColumnBit(0));

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(2);
    expect(world.getLightLevel(0, -32)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(1, -32)).toBe(7);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('transports sunlight across neighboring chunkX columns after edge edits dirty both boundary columns', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -1);
    world.ensureChunk(1, -1);
    world.ensureChunk(1, 0);

    const sourceWorldTileX = CHUNK_SIZE - 1;
    const neighboringWorldTileX = CHUNK_SIZE;

    for (let worldTileY = -CHUNK_SIZE; worldTileY <= 0; worldTileY += 1) {
      world.setTile(sourceWorldTileX, worldTileY, 0);
    }
    world.setTile(sourceWorldTileX, 0, 1);
    world.setTile(neighboringWorldTileX, -1, 1);
    world.setTile(neighboringWorldTileX, 0, 0);

    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(neighboringWorldTileX, 0)).toBe(0);
    expect(world.getDirtyLightChunkCount()).toBe(0);

    expect(world.setTile(sourceWorldTileX, 0, 0)).toBe(true);

    expect(world.getDirtyLightChunkCoords()).toEqual(
      expect.arrayContaining([
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: -1 },
        { x: 1, y: 0 }
      ])
    );
    expect(world.getDirtyLightChunkCount()).toBe(4);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world);

    expect(recomputedChunkCount).toBe(4);
    expect(world.getLightLevel(neighboringWorldTileX, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('lights boundary-adjacent solid tiles when horizontal transport relights edge air columns', () => {
    const world = new TileWorld(0);
    world.ensureChunk(0, -1);
    world.ensureChunk(1, -1);
    world.ensureChunk(1, 0);

    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const rightInteriorWorldTileX = CHUNK_SIZE + 1;
    const probeWorldTileY = 0;
    const rowAboveWorldTileY = -1;

    for (let worldTileY = -CHUNK_SIZE; worldTileY <= probeWorldTileY; worldTileY += 1) {
      world.setTile(leftBoundaryWorldTileX, worldTileY, 0);
    }
    world.setTile(leftBoundaryWorldTileX, probeWorldTileY, 1);
    world.setTile(rightBoundaryWorldTileX, rowAboveWorldTileY, 1);
    world.setTile(rightBoundaryWorldTileX, probeWorldTileY, 0);
    world.setTile(rightInteriorWorldTileX, rowAboveWorldTileY, 1);
    world.setTile(rightInteriorWorldTileX, probeWorldTileY, 1);

    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(rightBoundaryWorldTileX, probeWorldTileY)).toBe(0);
    expect(world.getLightLevel(rightInteriorWorldTileX, probeWorldTileY)).toBe(0);

    expect(world.setTile(leftBoundaryWorldTileX, probeWorldTileY, 0)).toBe(true);
    expect(recomputeSunlightFromExposedChunkTops(world)).toBe(4);
    expect(world.getLightLevel(rightBoundaryWorldTileX, probeWorldTileY)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(rightInteriorWorldTileX, probeWorldTileY)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('updates transported sunlight symmetrically when non-emissive boundary blockers toggle on either side', () => {
    const createBoundaryWorld = (): TileWorld => {
      const world = new TileWorld(0);
      world.ensureChunk(0, -1);
      world.ensureChunk(1, -1);
      world.ensureChunk(1, 0);
      return world;
    };
    const expectedDirtyBoundaryChunks = expect.arrayContaining([
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: -1 },
      { x: 1, y: 0 }
    ]);
    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;

    const leftToRightWorld = createBoundaryWorld();
    for (let worldTileY = -CHUNK_SIZE; worldTileY <= 0; worldTileY += 1) {
      leftToRightWorld.setTile(leftBoundaryWorldTileX, worldTileY, 0);
    }
    leftToRightWorld.setTile(leftBoundaryWorldTileX, 0, 1);
    leftToRightWorld.setTile(rightBoundaryWorldTileX, -1, 1);
    leftToRightWorld.setTile(rightBoundaryWorldTileX, 0, 0);

    recomputeSunlightFromExposedChunkTops(leftToRightWorld);
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, 0)).toBe(0);

    expect(leftToRightWorld.setTile(leftBoundaryWorldTileX, 0, 0)).toBe(true);
    expect(leftToRightWorld.getDirtyLightChunkCoords()).toEqual(expectedDirtyBoundaryChunks);
    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(4);

    expect(recomputeSunlightFromExposedChunkTops(leftToRightWorld)).toBe(4);
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(0);

    const rightToLeftWorld = createBoundaryWorld();
    for (let worldTileY = -CHUNK_SIZE; worldTileY <= 0; worldTileY += 1) {
      rightToLeftWorld.setTile(rightBoundaryWorldTileX, worldTileY, 0);
    }
    rightToLeftWorld.setTile(rightBoundaryWorldTileX, 0, 1);
    rightToLeftWorld.setTile(leftBoundaryWorldTileX, -1, 1);
    rightToLeftWorld.setTile(leftBoundaryWorldTileX, 0, 0);

    recomputeSunlightFromExposedChunkTops(rightToLeftWorld);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, 0)).toBe(0);

    expect(rightToLeftWorld.setTile(rightBoundaryWorldTileX, 0, 0)).toBe(true);
    expect(rightToLeftWorld.getDirtyLightChunkCoords()).toEqual(expectedDirtyBoundaryChunks);
    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(4);

    expect(recomputeSunlightFromExposedChunkTops(rightToLeftWorld)).toBe(4);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(0);
  });

  it('updates transported sunlight in the loaded chunk row below while invalidating adjacent non-boundary columns when a boundary-corner blocker toggles on either side', () => {
    const createCornerBoundaryWorld = (): TileWorld => {
      const world = new TileWorld(0);
      world.ensureChunk(1, 0);
      world.ensureChunk(0, 1);
      world.ensureChunk(1, 1);
      return world;
    };
    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const leftNonBoundaryWorldTileX = CHUNK_SIZE - 2;
    const rightNonBoundaryWorldTileX = CHUNK_SIZE + 1;
    const cornerWorldTileY = CHUNK_SIZE - 1;
    const rowBelowWorldTileY = CHUNK_SIZE;
    const staleCleanColumnLightLevel = 7;
    const leftBoundaryColumnMask = (localLightColumnBit(CHUNK_SIZE - 2) | localLightColumnBit(CHUNK_SIZE - 1)) >>> 0;
    const rightBoundaryColumnMask = (localLightColumnBit(0) | localLightColumnBit(1)) >>> 0;
    const expectedDirtyBoundaryAndRowBelowChunks = expect.arrayContaining([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ]);
    const initializeCornerColumns = (world: TileWorld): void => {
      for (let worldTileY = 0; worldTileY <= cornerWorldTileY; worldTileY += 1) {
        world.setTile(leftBoundaryWorldTileX, worldTileY, 0);
        world.setTile(rightBoundaryWorldTileX, worldTileY, 0);
      }
      world.setTile(leftBoundaryWorldTileX, rowBelowWorldTileY, 0);
      world.setTile(rightBoundaryWorldTileX, rowBelowWorldTileY, 0);
    };
    const primeCleanStaleLighting = (world: TileWorld): void => {
      for (const chunk of world.getChunks()) {
        world.fillChunkLight(chunk.coord.x, chunk.coord.y, staleCleanColumnLightLevel);
        world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
      }
    };

    const leftToRightWorld = createCornerBoundaryWorld();
    initializeCornerColumns(leftToRightWorld);
    leftToRightWorld.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    leftToRightWorld.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);
    primeCleanStaleLighting(leftToRightWorld);

    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(0);
    expect(leftToRightWorld.getLightLevel(leftBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(leftToRightWorld.getLightLevel(leftNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(leftToRightWorld.getLightLevel(rightNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );

    expect(leftToRightWorld.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    expect(leftToRightWorld.getDirtyLightChunkCoords()).toEqual(
      expectedDirtyBoundaryAndRowBelowChunks
    );
    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(4);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(0, 0)).toBe(leftBoundaryColumnMask);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(0, 1)).toBe(leftBoundaryColumnMask);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(1, 0)).toBe(rightBoundaryColumnMask);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(1, 1)).toBe(rightBoundaryColumnMask);
    expect(leftToRightWorld.getLightLevel(leftBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);
    expect(leftToRightWorld.getLightLevel(leftNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);
    expect(leftToRightWorld.getLightLevel(rightNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);

    expect(recomputeSunlightFromExposedChunkTops(leftToRightWorld)).toBe(4);
    expect(leftToRightWorld.getLightLevel(leftBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getLightLevel(leftNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getLightLevel(rightNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(0);

    const rightToLeftWorld = createCornerBoundaryWorld();
    initializeCornerColumns(rightToLeftWorld);
    rightToLeftWorld.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    rightToLeftWorld.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);
    primeCleanStaleLighting(rightToLeftWorld);

    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(0);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(rightToLeftWorld.getLightLevel(rightBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(rightToLeftWorld.getLightLevel(leftNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(rightToLeftWorld.getLightLevel(rightNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );

    expect(rightToLeftWorld.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    expect(rightToLeftWorld.getDirtyLightChunkCoords()).toEqual(
      expectedDirtyBoundaryAndRowBelowChunks
    );
    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(4);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(0, 0)).toBe(leftBoundaryColumnMask);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(0, 1)).toBe(leftBoundaryColumnMask);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(1, 0)).toBe(rightBoundaryColumnMask);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(1, 1)).toBe(rightBoundaryColumnMask);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);
    expect(rightToLeftWorld.getLightLevel(rightBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);
    expect(rightToLeftWorld.getLightLevel(leftNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);
    expect(rightToLeftWorld.getLightLevel(rightNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(0);

    expect(recomputeSunlightFromExposedChunkTops(rightToLeftWorld)).toBe(4);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getLightLevel(rightBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getLightLevel(leftNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getLightLevel(rightNonBoundaryWorldTileX, rowBelowWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(0);
  });

  it('updates transported sunlight in the loaded chunk row above while invalidating adjacent non-boundary columns when a boundary-corner top blocker toggles on either side', () => {
    const createTopCornerBoundaryWorld = (): TileWorld => {
      const world = new TileWorld(0);
      world.ensureChunk(0, -1);
      world.ensureChunk(1, -1);
      world.ensureChunk(1, 0);
      return world;
    };
    const leftBoundaryWorldTileX = CHUNK_SIZE - 1;
    const rightBoundaryWorldTileX = CHUNK_SIZE;
    const leftNonBoundaryWorldTileX = CHUNK_SIZE - 2;
    const rightNonBoundaryWorldTileX = CHUNK_SIZE + 1;
    const cornerWorldTileY = 0;
    const rowAboveWorldTileY = -1;
    const shadowBlockerWorldTileY = -2;
    const staleCleanColumnLightLevel = 7;
    const leftBoundaryColumnMask = (localLightColumnBit(CHUNK_SIZE - 2) | localLightColumnBit(CHUNK_SIZE - 1)) >>> 0;
    const rightBoundaryColumnMask = (localLightColumnBit(0) | localLightColumnBit(1)) >>> 0;
    const expectedDirtyBoundaryAndRowAboveChunks = expect.arrayContaining([
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    const initializeTopCornerColumns = (world: TileWorld, shadowSide: 'left' | 'right'): void => {
      for (let worldTileY = -CHUNK_SIZE; worldTileY <= cornerWorldTileY; worldTileY += 1) {
        world.setTile(leftBoundaryWorldTileX, worldTileY, 0);
        world.setTile(rightBoundaryWorldTileX, worldTileY, 0);
      }

      if (shadowSide === 'left') {
        world.setTile(leftBoundaryWorldTileX, shadowBlockerWorldTileY, 1);
      } else {
        world.setTile(rightBoundaryWorldTileX, shadowBlockerWorldTileY, 1);
      }
    };
    const primeCleanStaleLighting = (world: TileWorld): void => {
      for (const chunk of world.getChunks()) {
        world.fillChunkLight(chunk.coord.x, chunk.coord.y, staleCleanColumnLightLevel);
        world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
      }
    };

    const leftToRightWorld = createTopCornerBoundaryWorld();
    initializeTopCornerColumns(leftToRightWorld, 'left');
    leftToRightWorld.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    leftToRightWorld.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);
    primeCleanStaleLighting(leftToRightWorld);

    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(0);
    expect(leftToRightWorld.getLightLevel(leftBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(leftToRightWorld.getLightLevel(leftNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(leftToRightWorld.getLightLevel(rightNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );

    expect(leftToRightWorld.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    expect(leftToRightWorld.getDirtyLightChunkCoords()).toEqual(
      expectedDirtyBoundaryAndRowAboveChunks
    );
    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(4);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(0, -1)).toBe(leftBoundaryColumnMask);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(0, 0)).toBe(leftBoundaryColumnMask);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(1, -1)).toBe(rightBoundaryColumnMask);
    expect(leftToRightWorld.getChunkLightDirtyColumnMask(1, 0)).toBe(rightBoundaryColumnMask);
    expect(leftToRightWorld.getLightLevel(leftBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);
    expect(leftToRightWorld.getLightLevel(leftNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);
    expect(leftToRightWorld.getLightLevel(rightNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);

    expect(recomputeSunlightFromExposedChunkTops(leftToRightWorld)).toBe(4);
    expect(leftToRightWorld.getLightLevel(leftBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getLightLevel(rightBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getLightLevel(leftNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getLightLevel(rightNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(leftToRightWorld.getDirtyLightChunkCount()).toBe(0);

    const rightToLeftWorld = createTopCornerBoundaryWorld();
    initializeTopCornerColumns(rightToLeftWorld, 'right');
    rightToLeftWorld.setTile(leftBoundaryWorldTileX, cornerWorldTileY, 1);
    rightToLeftWorld.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 1);
    primeCleanStaleLighting(rightToLeftWorld);

    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(0);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(rightToLeftWorld.getLightLevel(rightBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(rightToLeftWorld.getLightLevel(leftNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );
    expect(rightToLeftWorld.getLightLevel(rightNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      staleCleanColumnLightLevel
    );

    expect(rightToLeftWorld.setTile(rightBoundaryWorldTileX, cornerWorldTileY, 0)).toBe(true);
    expect(rightToLeftWorld.getDirtyLightChunkCoords()).toEqual(
      expectedDirtyBoundaryAndRowAboveChunks
    );
    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(4);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(0, -1)).toBe(leftBoundaryColumnMask);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(0, 0)).toBe(leftBoundaryColumnMask);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(1, -1)).toBe(rightBoundaryColumnMask);
    expect(rightToLeftWorld.getChunkLightDirtyColumnMask(1, 0)).toBe(rightBoundaryColumnMask);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);
    expect(rightToLeftWorld.getLightLevel(rightBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);
    expect(rightToLeftWorld.getLightLevel(leftNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);
    expect(rightToLeftWorld.getLightLevel(rightNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(0);

    expect(recomputeSunlightFromExposedChunkTops(rightToLeftWorld)).toBe(4);
    expect(rightToLeftWorld.getLightLevel(leftBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getLightLevel(rightBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getLightLevel(leftNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getLightLevel(rightNonBoundaryWorldTileX, rowAboveWorldTileY)).toBe(
      MAX_LIGHT_LEVEL
    );
    expect(rightToLeftWorld.getDirtyLightChunkCount()).toBe(0);
  });

  it('merges local emissive falloff over the sunlight base field', () => {
    const world = new TileWorld(0);

    for (const worldTileX of [0, 1, 2, 3]) {
      world.setTile(worldTileX, 0, 1);
    }
    world.setTile(1, 1, 2);
    world.setTile(0, 1, 0);
    world.setTile(2, 1, 0);
    world.setTile(3, 1, 0);
    world.setTile(1, 2, 0);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world, emissiveTestRegistry);

    expect(recomputedChunkCount).toBe(1);
    expect(world.getLightLevel(1, 1)).toBe(12);
    expect(world.getLightLevel(2, 1)).toBe(11);
    expect(world.getLightLevel(3, 1)).toBe(10);
    expect(world.getLightLevel(1, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('keeps blocking tiles beside emissive-lit air visibly lit while blocking emissive propagation behind them', () => {
    const world = new TileWorld(0);
    const tunnelWorldTileY = 1;
    const emissiveWorldTileX = 1;
    const blockerWorldTileX = 2;
    const shadowedProbeWorldTileX = 3;

    for (let worldTileX = 0; worldTileX <= 4; worldTileX += 1) {
      world.setTile(worldTileX, tunnelWorldTileY - 1, 1);
      world.setTile(worldTileX, tunnelWorldTileY, 0);
      world.setTile(worldTileX, tunnelWorldTileY + 1, 1);
    }
    world.setTile(emissiveWorldTileX, tunnelWorldTileY, 2);
    world.setTile(blockerWorldTileX, tunnelWorldTileY, 1);

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world, emissiveTestRegistry);

    expect(recomputedChunkCount).toBe(1);
    expect(world.getLightLevel(emissiveWorldTileX, tunnelWorldTileY)).toBe(12);
    expect(world.getLightLevel(blockerWorldTileX, tunnelWorldTileY)).toBe(11);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('lights boundary blockers from adjacent-chunk emissive air while keeping tiles behind those blockers shadowed on both sides', () => {
    const tunnelWorldTileY = 1;
    const tunnelStartWorldTileX = CHUNK_SIZE - 2;
    const tunnelEndWorldTileX = CHUNK_SIZE + 2;

    const initializeBoundaryTunnel = (world: TileWorld): void => {
      for (let worldTileX = tunnelStartWorldTileX; worldTileX <= tunnelEndWorldTileX; worldTileX += 1) {
        world.setTile(worldTileX, tunnelWorldTileY - 1, 1);
        world.setTile(worldTileX, tunnelWorldTileY, 0);
        world.setTile(worldTileX, tunnelWorldTileY + 1, 1);
      }
    };

    const blockerAtLocalX0World = new TileWorld(0);
    initializeBoundaryTunnel(blockerAtLocalX0World);
    blockerAtLocalX0World.setTile(CHUNK_SIZE - 1, tunnelWorldTileY, 2);
    blockerAtLocalX0World.setTile(CHUNK_SIZE, tunnelWorldTileY, 1);

    recomputeSunlightFromExposedChunkTops(blockerAtLocalX0World, emissiveTestRegistry);
    expect(blockerAtLocalX0World.getLightLevel(CHUNK_SIZE, tunnelWorldTileY)).toBe(11);
    expect(blockerAtLocalX0World.getLightLevel(CHUNK_SIZE + 1, tunnelWorldTileY)).toBe(0);

    const blockerAtLocalXMaxWorld = new TileWorld(0);
    initializeBoundaryTunnel(blockerAtLocalXMaxWorld);
    blockerAtLocalXMaxWorld.setTile(CHUNK_SIZE, tunnelWorldTileY, 2);
    blockerAtLocalXMaxWorld.setTile(CHUNK_SIZE - 1, tunnelWorldTileY, 1);

    recomputeSunlightFromExposedChunkTops(blockerAtLocalXMaxWorld, emissiveTestRegistry);
    expect(blockerAtLocalXMaxWorld.getLightLevel(CHUNK_SIZE - 1, tunnelWorldTileY)).toBe(11);
    expect(blockerAtLocalXMaxWorld.getLightLevel(CHUNK_SIZE - 2, tunnelWorldTileY)).toBe(0);
  });

  it('applies clean-column emissive sources when a neighboring column is recomputed', () => {
    const world = new TileWorld(0);

    world.setTile(0, 0, 1);
    world.setTile(1, 0, 1);
    world.setTile(0, 1, 0);
    world.setTile(1, 1, 2);

    recomputeSunlightFromExposedChunkTops(world, emissiveTestRegistry);
    expect(world.getLightLevel(0, 1)).toBe(11);

    world.fillChunkLight(0, 0, 0);
    world.markChunkLightClean(0, 0);
    world.invalidateChunkLightColumns(0, 0, localLightColumnBit(0));

    const recomputedChunkCount = recomputeSunlightFromExposedChunkTops(world, emissiveTestRegistry);

    expect(recomputedChunkCount).toBe(1);
    expect(world.getLightLevel(0, 1)).toBe(11);
    expect(world.getDirtyLightChunkCount()).toBe(0);
  });

  it('updates neighboring-column shadowed light when a non-emissive blocker near an emissive source toggles', () => {
    const world = new TileWorld(1);
    const tunnelWorldTileY = 1;
    const tunnelStartWorldTileX = CHUNK_SIZE - 2;
    const tunnelEndWorldTileX = CHUNK_SIZE + 4;
    const emissiveWorldTileX = CHUNK_SIZE - 1;
    const blockerWorldTileX = CHUNK_SIZE + 1;
    const shadowedProbeWorldTileX = CHUNK_SIZE + 3;
    const emissiveTileId = 6;
    const expectedUnblockedLightLevel =
      getTileEmissiveLightLevel(emissiveTileId) -
      Math.abs(shadowedProbeWorldTileX - emissiveWorldTileX);

    for (let worldTileX = tunnelStartWorldTileX; worldTileX <= tunnelEndWorldTileX; worldTileX += 1) {
      world.setTile(worldTileX, tunnelWorldTileY - 1, 1);
      world.setTile(worldTileX, tunnelWorldTileY, 0);
      world.setTile(worldTileX, tunnelWorldTileY + 1, 1);
    }
    world.setTile(emissiveWorldTileX, tunnelWorldTileY, emissiveTileId);

    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(
      expectedUnblockedLightLevel
    );

    world.setTile(blockerWorldTileX, tunnelWorldTileY, 1);
    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);

    world.setTile(blockerWorldTileX, tunnelWorldTileY, 0);
    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(
      expectedUnblockedLightLevel
    );
  });

  it('keeps neighboring boundary columns shadowed after a blocker toggle when the adjacent chunk unloads and streams back in', () => {
    const world = new TileWorld(0);
    const tunnelWorldTileY = -20;
    const tunnelStartWorldTileX = CHUNK_SIZE - 2;
    const tunnelEndWorldTileX = CHUNK_SIZE + 3;
    const emissiveWorldTileX = CHUNK_SIZE - 1;
    const boundaryBlockerWorldTileX = CHUNK_SIZE;
    const rightInteriorWorldTileX = CHUNK_SIZE + 1;
    const shadowedProbeWorldTileX = CHUNK_SIZE + 2;
    const emissiveTileId = 6;
    const emissiveLightLevel = getTileEmissiveLightLevel(emissiveTileId);
    const expectedOpenProbeLightLevel =
      emissiveLightLevel - Math.abs(shadowedProbeWorldTileX - emissiveWorldTileX);

    for (let worldTileX = tunnelStartWorldTileX; worldTileX <= tunnelEndWorldTileX; worldTileX += 1) {
      world.setTile(worldTileX, tunnelWorldTileY - 1, 1);
      world.setTile(worldTileX, tunnelWorldTileY, 0);
      world.setTile(worldTileX, tunnelWorldTileY + 1, 1);
    }
    world.setTile(emissiveWorldTileX, tunnelWorldTileY, emissiveTileId);

    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(
      expectedOpenProbeLightLevel
    );

    expect(world.setTile(boundaryBlockerWorldTileX, tunnelWorldTileY, 1)).toBe(true);
    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(rightInteriorWorldTileX, tunnelWorldTileY)).toBe(0);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);

    world.pruneChunksOutside({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });
    expect(world.getChunkCount()).toBe(1);

    world.ensureChunk(1, -1);
    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(rightInteriorWorldTileX, tunnelWorldTileY)).toBe(0);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);
  });

  it('keeps a streamed-back dirty boundary blocker at emissive falloff instead of full sunlight when the adjacent emissive source column stays clean', () => {
    const world = new TileWorld(0);
    const tunnelWorldTileY = -20;
    const tunnelStartWorldTileX = CHUNK_SIZE - 2;
    const tunnelEndWorldTileX = CHUNK_SIZE + 2;
    const emissiveWorldTileX = CHUNK_SIZE - 1;
    const boundaryBlockerWorldTileX = CHUNK_SIZE;
    const shadowedProbeWorldTileX = CHUNK_SIZE + 1;
    const emissiveTileId = 6;
    const expectedBoundaryBlockerLightLevel =
      getTileEmissiveLightLevel(emissiveTileId) -
      Math.abs(boundaryBlockerWorldTileX - emissiveWorldTileX);

    for (let worldTileX = tunnelStartWorldTileX; worldTileX <= tunnelEndWorldTileX; worldTileX += 1) {
      world.setTile(worldTileX, tunnelWorldTileY - 1, 1);
      world.setTile(worldTileX, tunnelWorldTileY, 0);
      world.setTile(worldTileX, tunnelWorldTileY + 1, 1);
    }
    world.setTile(emissiveWorldTileX, tunnelWorldTileY, emissiveTileId);
    world.setTile(boundaryBlockerWorldTileX, tunnelWorldTileY, 1);

    recomputeSunlightFromExposedChunkTops(world);
    expect(world.getLightLevel(boundaryBlockerWorldTileX, tunnelWorldTileY)).toBe(
      expectedBoundaryBlockerLightLevel
    );
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);

    world.pruneChunksOutside({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });
    expect(world.getChunkCount()).toBe(1);

    world.ensureChunk(1, -1);
    recomputeSunlightFromExposedChunkTops(world);

    expect(world.getLightLevel(boundaryBlockerWorldTileX, tunnelWorldTileY)).toBe(
      expectedBoundaryBlockerLightLevel
    );
    expect(world.getLightLevel(boundaryBlockerWorldTileX, tunnelWorldTileY)).not.toBe(MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(shadowedProbeWorldTileX, tunnelWorldTileY)).toBe(0);
  });
});
