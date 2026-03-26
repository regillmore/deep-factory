import { describe, expect, it } from 'vitest';

import { decodeResidentChunkSnapshot, encodeResidentChunkSnapshot } from './chunkSnapshot';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL, MAX_LIQUID_LEVEL } from './constants';
import type { ChunkBounds } from './chunkMath';
import { toTileIndex } from './chunkMath';
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
import { STARTER_TORCH_TILE_ID } from './starterTorchPlacement';
import { STARTER_WORKBENCH_TILE_ID } from './starterWorkbenchPlacement';
import { STARTER_FURNACE_TILE_ID } from './starterFurnacePlacement';
import { STARTER_ANVIL_TILE_ID } from './starterAnvilPlacement';
import { getSmallTreeTileIds } from './smallTreeTiles';
import { getTallGrassTileId } from './tallGrassTiles';
import { getTileEmissiveLightLevel, isTileSolid, parseTileMetadataRegistry } from './tileMetadata';
import { didTileLightingStateChange, resolveLiquidStepPhaseSummary, TileWorld } from './world';
import type { TileEditEvent, WallEditEvent } from './world';

const ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK = 0xffffffff >>> 0;
const SOLID_TEST_TILE_ID = 3;
const NON_SOLID_TEST_TILE_ID = 4;
const WATER_TILE_ID = 7;
const LAVA_TILE_ID = 8;
const localLightColumnBit = (localX: number): number => (1 << localX) >>> 0;
const localLightColumnRangeMask = (startLocalX: number, endLocalX: number): number => {
  let mask = 0;
  for (let localX = startLocalX; localX <= endLocalX; localX += 1) {
    mask = (mask | localLightColumnBit(localX)) >>> 0;
  }
  return mask;
};
const findFirstProceduralCaveTile = (
  worldSeed = 0,
  minWorldX = CHUNK_SIZE + 1,
  maxWorldX = CHUNK_SIZE * 3
): { worldTileX: number; worldTileY: number } | null => {
  for (let worldTileX = minWorldX; worldTileX <= maxWorldX; worldTileX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    for (let worldTileY = surfaceTileY + dirtDepthTiles + 3; worldTileY <= surfaceTileY + 36; worldTileY += 1) {
      if (resolveProceduralTerrainTileId(worldTileX, worldTileY, worldSeed) === 0) {
        return {
          worldTileX,
          worldTileY
        };
      }
    }
  }

  return null;
};

const findFirstProceduralStoneWallTile = (
  worldSeed = 0,
  minWorldX = CHUNK_SIZE + 1,
  maxWorldX = CHUNK_SIZE * 8
): { worldTileX: number; worldTileY: number } | null => {
  for (let worldTileX = minWorldX; worldTileX <= maxWorldX; worldTileX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    for (let worldTileY = surfaceTileY + dirtDepthTiles + 3; worldTileY <= surfaceTileY + 36; worldTileY += 1) {
      if (resolveProceduralTerrainWallId(worldTileX, worldTileY, worldSeed) === PROCEDURAL_STONE_WALL_ID) {
        return {
          worldTileX,
          worldTileY
        };
      }
    }
  }

  return null;
};

const findFirstProceduralExposedCaveMouthColumn = (
  worldSeed = 0,
  minWorldX = -CHUNK_SIZE * 8,
  maxWorldX = CHUNK_SIZE * 8
): { worldTileX: number; surfaceTileY: number; deepestAirTileY: number } | null => {
  for (let worldTileX = minWorldX; worldTileX <= maxWorldX; worldTileX += 1) {
    if (Math.abs(worldTileX) <= PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES) {
      continue;
    }

    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    if (resolveProceduralTerrainTileId(worldTileX, surfaceTileY, worldSeed) !== 0) {
      continue;
    }

    let deepestAirTileY = surfaceTileY;
    const maxTrackedDepthTileY = surfaceTileY + dirtDepthTiles + 24;
    while (
      deepestAirTileY < maxTrackedDepthTileY &&
      resolveProceduralTerrainTileId(worldTileX, deepestAirTileY + 1, worldSeed) === 0
    ) {
      deepestAirTileY += 1;
    }

    if (deepestAirTileY >= surfaceTileY + dirtDepthTiles + 3) {
      return {
        worldTileX,
        surfaceTileY,
        deepestAirTileY
      };
    }
  }

  return null;
};

const findFirstProceduralCopperOreTile = (
  worldSeed = 0,
  minWorldX = PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES + 1,
  maxWorldX = CHUNK_SIZE * 8
): { worldTileX: number; worldTileY: number } | null => {
  for (let worldTileX = minWorldX; worldTileX <= maxWorldX; worldTileX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    for (let worldTileY = surfaceTileY + dirtDepthTiles + 4; worldTileY <= surfaceTileY + dirtDepthTiles + 40; worldTileY += 1) {
      if (resolveProceduralTerrainTileId(worldTileX, worldTileY, worldSeed) === PROCEDURAL_COPPER_ORE_TILE_ID) {
        return {
          worldTileX,
          worldTileY
        };
      }
    }
  }

  return null;
};

const findFirstProceduralDirtBelowSolidCoverAdjacentToGrass = (
  worldSeed = 0,
  minWorldX = -CHUNK_SIZE * 4,
  maxWorldX = CHUNK_SIZE * 4
): { worldTileX: number; worldTileY: number } | null => {
  for (let worldTileX = minWorldX; worldTileX <= maxWorldX; worldTileX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    for (let worldTileY = surfaceTileY; worldTileY <= surfaceTileY + dirtDepthTiles + 1; worldTileY += 1) {
      if (resolveProceduralTerrainTileId(worldTileX, worldTileY, worldSeed) !== PROCEDURAL_DIRT_TILE_ID) {
        continue;
      }
      if (!isTileSolid(resolveProceduralTerrainTileId(worldTileX, worldTileY - 1, worldSeed))) {
        continue;
      }
      if (
        resolveProceduralTerrainTileId(worldTileX - 1, worldTileY, worldSeed) !==
          PROCEDURAL_GRASS_SURFACE_TILE_ID &&
        resolveProceduralTerrainTileId(worldTileX + 1, worldTileY, worldSeed) !==
          PROCEDURAL_GRASS_SURFACE_TILE_ID
      ) {
        continue;
      }

      return {
        worldTileX,
        worldTileY
      };
    }
  }

  return null;
};

const findFirstProceduralChunkTopDirtBelowSolidCoverAdjacentToGrass = (
  worldSeed = 0,
  minWorldX = -CHUNK_SIZE * 4,
  maxWorldX = CHUNK_SIZE * 4
): { worldTileX: number; worldTileY: number } | null => {
  for (let worldTileX = minWorldX; worldTileX <= maxWorldX; worldTileX += 1) {
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    for (let worldTileY = surfaceTileY; worldTileY <= surfaceTileY + dirtDepthTiles + 1; worldTileY += 1) {
      const normalizedLocalY = ((worldTileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      if (normalizedLocalY !== 0) {
        continue;
      }
      if (resolveProceduralTerrainTileId(worldTileX, worldTileY, worldSeed) !== PROCEDURAL_DIRT_TILE_ID) {
        continue;
      }
      if (!isTileSolid(resolveProceduralTerrainTileId(worldTileX, worldTileY - 1, worldSeed))) {
        continue;
      }
      if (
        resolveProceduralTerrainTileId(worldTileX - 1, worldTileY, worldSeed) !==
          PROCEDURAL_GRASS_SURFACE_TILE_ID &&
        resolveProceduralTerrainTileId(worldTileX + 1, worldTileY, worldSeed) !==
          PROCEDURAL_GRASS_SURFACE_TILE_ID
      ) {
        continue;
      }

      return {
        worldTileX,
        worldTileY
      };
    }
  }

  return null;
};

describe('resolveLiquidStepPhaseSummary', () => {
  it('derives none, downward, sideways, and both from split transfer counts', () => {
    expect(
      resolveLiquidStepPhaseSummary({
        downwardActiveChunksScanned: 3,
        sidewaysCandidateChunksScanned: 5,
        sidewaysPairsTested: 2048,
        downwardTransfersApplied: 0,
        sidewaysTransfersApplied: 0
      })
    ).toBe('none');

    expect(
      resolveLiquidStepPhaseSummary({
        downwardActiveChunksScanned: 1,
        sidewaysCandidateChunksScanned: 1,
        sidewaysPairsTested: 512,
        downwardTransfersApplied: 1,
        sidewaysTransfersApplied: 0
      })
    ).toBe('downward');

    expect(
      resolveLiquidStepPhaseSummary({
        downwardActiveChunksScanned: 1,
        sidewaysCandidateChunksScanned: 3,
        sidewaysPairsTested: 1504,
        downwardTransfersApplied: 0,
        sidewaysTransfersApplied: 1
      })
    ).toBe('sideways');

    expect(
      resolveLiquidStepPhaseSummary({
        downwardActiveChunksScanned: 1,
        sidewaysCandidateChunksScanned: 1,
        sidewaysPairsTested: 512,
        downwardTransfersApplied: 1,
        sidewaysTransfersApplied: 1
      })
    ).toBe('both');
  });
});

describe('TileWorld', () => {
  it('prunes chunks outside retained bounds', () => {
    const world = new TileWorld(1);
    const retainBounds: ChunkBounds = { minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 };

    const removed = world.pruneChunksOutside(retainBounds);

    expect(removed).toBe(8);
    expect(world.getChunkCount()).toBe(1);
    expect(Array.from(world.getChunks()).map((chunk) => chunk.coord)).toEqual([{ x: 0, y: 0 }]);
    expect(world.getDirtyLightChunkCoords()).toEqual([{ x: 0, y: 0 }]);
    expect(world.getDirtyLightChunkCount()).toBe(1);
  });

  it('sets tiles and emits edit metadata', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];
    const previousTileId = world.getTile(-1, 0);

    world.onTileEdited((event) => {
      events.push(event);
    });

    const changed = world.setTile(-1, 0, 3);

    expect(changed).toBe(true);
    expect(world.getTile(-1, 0)).toBe(3);
    expect(events).toEqual([
      {
        worldTileX: -1,
        worldTileY: 0,
        chunkX: -1,
        chunkY: 0,
        localX: CHUNK_SIZE - 1,
        localY: 0,
        previousTileId,
        previousLiquidLevel: 0,
        tileId: 3,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      }
    ]);
  });

  it('emits separate wall-only edit metadata without reusing tile-edit notifications', () => {
    const world = new TileWorld(0);
    const tileEvents: TileEditEvent[] = [];
    const wallEvents: WallEditEvent[] = [];
    const worldTileX = -1;
    const worldTileY = 0;
    const previousTileId = world.getTile(worldTileX, worldTileY);
    const previousWallId = world.getWall(worldTileX, worldTileY);

    world.onTileEdited((event) => {
      tileEvents.push(event);
    });
    world.onWallEdited((event) => {
      wallEvents.push(event);
    });

    expect(world.setWall(worldTileX, worldTileY, 7, 'debug-history')).toBe(true);
    expect(world.setWall(worldTileX, worldTileY, 7, 'debug-history')).toBe(false);

    expect(world.getTile(worldTileX, worldTileY)).toBe(previousTileId);
    expect(world.getWall(worldTileX, worldTileY)).toBe(7);
    expect(tileEvents).toEqual([]);
    expect(wallEvents).toEqual([
      {
        worldTileX,
        worldTileY,
        chunkX: -1,
        chunkY: 0,
        localX: CHUNK_SIZE - 1,
        localY: 0,
        previousWallId,
        wallId: 7,
        editOrigin: 'debug-history'
      }
    ]);
  });

  it('preserves debug-break origin on a neighboring torch support-collapse follow-up edit', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];

    world.setTile(1, 0, 0);
    world.setTile(0, 1, 0);
    world.setTile(1, 1, 0);
    world.setTile(2, 1, 0);
    world.setTile(1, 2, 1);
    expect(world.setTile(1, 1, STARTER_TORCH_TILE_ID)).toBe(true);

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTile(1, 2, 0, 'debug-break')).toBe(true);

    expect(world.getTile(1, 1)).toBe(0);
    expect(events).toEqual([
      {
        worldTileX: 1,
        worldTileY: 2,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 2,
        previousTileId: 1,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'debug-break'
      },
      {
        worldTileX: 1,
        worldTileY: 1,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 1,
        previousTileId: STARTER_TORCH_TILE_ID,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'debug-break'
      }
    ]);
  });

  it('clears an unsupported placed workbench and emits a second edit when its ground support breaks', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];

    world.setTile(1, 1, 0);
    world.setTile(1, 2, 1);
    expect(world.setTile(1, 1, STARTER_WORKBENCH_TILE_ID)).toBe(true);

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTile(1, 2, 0)).toBe(true);

    expect(world.getTile(1, 1)).toBe(0);
    expect(events).toEqual([
      {
        worldTileX: 1,
        worldTileY: 2,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 2,
        previousTileId: 1,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      },
      {
        worldTileX: 1,
        worldTileY: 1,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 1,
        previousTileId: STARTER_WORKBENCH_TILE_ID,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      }
    ]);
  });

  it('clears an unsupported placed furnace and emits a second edit when its ground support breaks', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];

    world.setTile(1, 1, 0);
    world.setTile(1, 2, 1);
    expect(world.setTile(1, 1, STARTER_FURNACE_TILE_ID)).toBe(true);

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTile(1, 2, 0)).toBe(true);

    expect(world.getTile(1, 1)).toBe(0);
    expect(events).toEqual([
      {
        worldTileX: 1,
        worldTileY: 2,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 2,
        previousTileId: 1,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      },
      {
        worldTileX: 1,
        worldTileY: 1,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 1,
        previousTileId: STARTER_FURNACE_TILE_ID,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      }
    ]);
  });

  it('clears an unsupported placed anvil and emits a second edit when its ground support breaks', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];

    world.setTile(1, 1, 0);
    world.setTile(1, 2, 1);
    expect(world.setTile(1, 1, STARTER_ANVIL_TILE_ID)).toBe(true);

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTile(1, 2, 0)).toBe(true);

    expect(world.getTile(1, 1)).toBe(0);
    expect(events).toEqual([
      {
        worldTileX: 1,
        worldTileY: 2,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 2,
        previousTileId: 1,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      },
      {
        worldTileX: 1,
        worldTileY: 1,
        chunkX: 0,
        chunkY: 0,
        localX: 1,
        localY: 1,
        previousTileId: STARTER_ANVIL_TILE_ID,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      }
    ]);
  });

  it('clears a planted small tree and emits a second edit when its grass support anchor is replaced', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];
    const treeTileIds = getSmallTreeTileIds();

    expect(world.setTile(4, 2, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(world.setTile(4, 1, treeTileIds.sapling)).toBe(true);

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTile(4, 2, PROCEDURAL_DIRT_TILE_ID)).toBe(true);

    expect(world.getTile(4, 2)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(world.getTile(4, 1)).toBe(0);
    expect(events).toEqual([
      {
        worldTileX: 4,
        worldTileY: 2,
        chunkX: 0,
        chunkY: 0,
        localX: 4,
        localY: 2,
        previousTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
        previousLiquidLevel: 0,
        tileId: PROCEDURAL_DIRT_TILE_ID,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      },
      {
        worldTileX: 4,
        worldTileY: 1,
        chunkX: 0,
        chunkY: 0,
        localX: 4,
        localY: 1,
        previousTileId: treeTileIds.sapling,
        previousLiquidLevel: 0,
        tileId: 0,
        liquidLevel: 0,
        editOrigin: 'gameplay'
      }
    ]);
  });

  it('clears a grown small tree from snapshots once its grass support anchor is removed', () => {
    const source = new TileWorld(0);
    const loaded = new TileWorld(0);
    const treeTileIds = getSmallTreeTileIds();

    expect(source.setTile(7, 3, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(source.setTile(7, 2, treeTileIds.trunk)).toBe(true);
    expect(source.setTile(7, 1, treeTileIds.trunk)).toBe(true);
    expect(source.setTile(6, 0, treeTileIds.leaf)).toBe(true);
    expect(source.setTile(7, 0, treeTileIds.leaf)).toBe(true);
    expect(source.setTile(8, 0, treeTileIds.leaf)).toBe(true);

    expect(source.setTile(7, 3, 0)).toBe(true);

    expect(source.getTile(7, 2)).toBe(0);
    expect(source.getTile(7, 1)).toBe(0);
    expect(source.getTile(6, 0)).toBe(0);
    expect(source.getTile(7, 0)).toBe(0);
    expect(source.getTile(8, 0)).toBe(0);

    loaded.loadSnapshot(source.createSnapshot());

    expect(loaded.getTile(7, 3)).toBe(0);
    expect(loaded.getTile(7, 2)).toBe(0);
    expect(loaded.getTile(7, 1)).toBe(0);
    expect(loaded.getTile(6, 0)).toBe(0);
    expect(loaded.getTile(7, 0)).toBe(0);
    expect(loaded.getTile(8, 0)).toBe(0);
  });

  it('reverts grass to dirt when a solid tile is placed directly above it', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];
    const worldTileX = 0;
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX);
    const coverTileY = surfaceTileY - 1;

    expect(world.getTile(worldTileX, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(world.getTile(worldTileX, coverTileY)).toBe(0);

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTile(worldTileX, coverTileY, SOLID_TEST_TILE_ID)).toBe(true);

    expect(world.getTile(worldTileX, coverTileY)).toBe(SOLID_TEST_TILE_ID);
    expect(world.getTile(worldTileX, surfaceTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      worldTileX,
      worldTileY: coverTileY,
      previousTileId: 0,
      tileId: SOLID_TEST_TILE_ID,
      editOrigin: 'gameplay'
    });
    expect(events[1]).toMatchObject({
      worldTileX,
      worldTileY: surfaceTileY,
      previousTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
      tileId: PROCEDURAL_DIRT_TILE_ID,
      editOrigin: 'gameplay'
    });
  });

  it('keeps grass intact when a non-solid tile is placed directly above it', () => {
    const world = new TileWorld(0);
    const worldTileX = 0;
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX);
    const coverTileY = surfaceTileY - 1;

    expect(world.getTile(worldTileX, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(world.setTile(worldTileX, coverTileY, NON_SOLID_TEST_TILE_ID)).toBe(true);

    expect(world.getTile(worldTileX, coverTileY)).toBe(NON_SOLID_TEST_TILE_ID);
    expect(world.getTile(worldTileX, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
  });

  it('clears tall grass once its grass support anchor is removed', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const anchorTileY = -12;
    const coverTileY = anchorTileY - 1;

    expect(world.setTile(worldTileX, anchorTileY, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(world.setTile(worldTileX, coverTileY, getTallGrassTileId())).toBe(true);

    expect(world.setTile(worldTileX, anchorTileY, PROCEDURAL_DIRT_TILE_ID)).toBe(true);

    expect(world.getTile(worldTileX, anchorTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(world.getTile(worldTileX, coverTileY)).toBe(0);
  });

  it('stores tall-grass cleanup overrides without forcing the cover chunk resident', () => {
    const world = new TileWorld(0);
    const worldTileX = CHUNK_SIZE + 1;
    const anchorTileY = 0;
    const coverTileY = -1;

    expect(world.getTile(worldTileX, anchorTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(world.setTile(worldTileX, coverTileY, getTallGrassTileId())).toBe(true);
    expect(world.hasChunk(1, 0)).toBe(true);
    expect(world.hasChunk(1, -1)).toBe(true);

    expect(
      world.pruneChunksOutside({
        minChunkX: 1,
        minChunkY: 0,
        maxChunkX: 1,
        maxChunkY: 0
      })
    ).toBeGreaterThan(0);
    expect(world.hasChunk(1, 0)).toBe(true);
    expect(world.hasChunk(1, -1)).toBe(false);

    expect(world.setTile(worldTileX, anchorTileY, PROCEDURAL_DIRT_TILE_ID)).toBe(true);
    expect(world.hasChunk(1, -1)).toBe(false);

    world.ensureChunk(1, -1);
    expect(world.getTile(worldTileX, coverTileY)).toBe(0);
  });

  it('does not immediately regrow exposed dirt when non-solid cover replaces solid cover above it', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];
    const coveredDirt = findFirstProceduralDirtBelowSolidCoverAdjacentToGrass();
    expect(coveredDirt).not.toBeNull();
    const { worldTileX, worldTileY } = coveredDirt!;
    const coverTileY = worldTileY - 1;

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(world.setTile(worldTileX, coverTileY, SOLID_TEST_TILE_ID)).toBe(true);
    expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    events.length = 0;

    expect(world.setTile(worldTileX, coverTileY, NON_SOLID_TEST_TILE_ID)).toBe(true);

    expect(world.getTile(worldTileX, coverTileY)).toBe(NON_SOLID_TEST_TILE_ID);
    expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(events).toEqual([
      expect.objectContaining({
        worldTileX,
        worldTileY: coverTileY,
        previousTileId: SOLID_TEST_TILE_ID,
        tileId: NON_SOLID_TEST_TILE_ID,
        editOrigin: 'gameplay'
      })
    ]);
  });

  for (const [liquidTileId, liquidLabel] of [
    [WATER_TILE_ID, 'water'],
    [LAVA_TILE_ID, 'lava']
  ] as const) {
    it(`does not immediately regrow exposed dirt while ${liquidLabel} replaces solid cover above it`, () => {
      const world = new TileWorld(0);
      const coveredDirt = findFirstProceduralDirtBelowSolidCoverAdjacentToGrass();
      expect(coveredDirt).not.toBeNull();
      const { worldTileX, worldTileY } = coveredDirt!;
      const coverTileY = worldTileY - 1;

      expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);

      expect(world.setTile(worldTileX, coverTileY, liquidTileId)).toBe(true);

      expect(world.getTile(worldTileX, coverTileY)).toBe(liquidTileId);
      expect(world.getLiquidLevel(worldTileX, coverTileY)).toBe(MAX_LIQUID_LEVEL);
      expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    });

    it(`does not immediately regrow exposed dirt once direct-cover ${liquidLabel} fully clears`, () => {
      const world = new TileWorld(0);
      const coveredDirt = findFirstProceduralDirtBelowSolidCoverAdjacentToGrass();
      expect(coveredDirt).not.toBeNull();
      const { worldTileX, worldTileY } = coveredDirt!;
      const coverTileY = worldTileY - 1;

      expect(world.setTile(worldTileX, coverTileY, liquidTileId)).toBe(true);
      expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);

      expect(
        world.setTileState(worldTileX, coverTileY, liquidTileId, MAX_LIQUID_LEVEL / 2)
      ).toBe(true);
      expect(world.getLiquidLevel(worldTileX, coverTileY)).toBe(MAX_LIQUID_LEVEL / 2);
      expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);

      expect(world.setTile(worldTileX, coverTileY, 0)).toBe(true);

      expect(world.getTile(worldTileX, coverTileY)).toBe(0);
      expect(world.getLiquidLevel(worldTileX, coverTileY)).toBe(0);
      expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    });
  }

  it('does not store immediate grass-spread overrides without forcing the target chunk resident', () => {
    const world = new TileWorld(0);
    const coveredDirt = findFirstProceduralChunkTopDirtBelowSolidCoverAdjacentToGrass(
      0,
      CHUNK_SIZE,
      CHUNK_SIZE * 8
    );
    expect(coveredDirt).not.toBeNull();
    const { worldTileX, worldTileY } = coveredDirt!;
    const coverTileY = worldTileY - 1;
    const dirtChunkX = Math.floor(worldTileX / CHUNK_SIZE);
    const dirtChunkY = Math.floor(worldTileY / CHUNK_SIZE);
    const coverChunkY = Math.floor(coverTileY / CHUNK_SIZE);

    expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(isTileSolid(world.getTile(worldTileX, coverTileY))).toBe(true);
    expect(world.setTile(worldTileX, coverTileY, SOLID_TEST_TILE_ID)).toBe(true);

    expect(
      world.pruneChunksOutside({
        minChunkX: dirtChunkX,
        minChunkY: coverChunkY,
        maxChunkX: dirtChunkX,
        maxChunkY: coverChunkY
      })
    ).toBeGreaterThan(0);
    expect(world.hasChunk(dirtChunkX, coverChunkY)).toBe(true);
    expect(world.hasChunk(dirtChunkX, dirtChunkY)).toBe(false);

    expect(world.setTile(worldTileX, coverTileY, NON_SOLID_TEST_TILE_ID)).toBe(true);
    expect(world.hasChunk(dirtChunkX, dirtChunkY)).toBe(false);

    world.ensureChunk(dirtChunkX, dirtChunkY);
    expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
  });

  for (const [liquidTileId, liquidLabel] of [
    [WATER_TILE_ID, 'water'],
    [LAVA_TILE_ID, 'lava']
  ] as const) {
    it(`does not store immediate grass-spread overrides without forcing the target chunk resident when ${liquidLabel} cover clears`, () => {
      const world = new TileWorld(0);
      const coveredDirt = findFirstProceduralChunkTopDirtBelowSolidCoverAdjacentToGrass(
        0,
        CHUNK_SIZE,
        CHUNK_SIZE * 8
      );
      expect(coveredDirt).not.toBeNull();
      const { worldTileX, worldTileY } = coveredDirt!;
      const coverTileY = worldTileY - 1;
      const dirtChunkX = Math.floor(worldTileX / CHUNK_SIZE);
      const dirtChunkY = Math.floor(worldTileY / CHUNK_SIZE);
      const coverChunkY = Math.floor(coverTileY / CHUNK_SIZE);

      expect(world.setTile(worldTileX, coverTileY, liquidTileId)).toBe(true);
      expect(
        world.pruneChunksOutside({
          minChunkX: dirtChunkX,
          minChunkY: coverChunkY,
          maxChunkX: dirtChunkX,
          maxChunkY: coverChunkY
        })
      ).toBeGreaterThan(0);
      expect(world.hasChunk(dirtChunkX, coverChunkY)).toBe(true);
      expect(world.hasChunk(dirtChunkX, dirtChunkY)).toBe(false);

      expect(
        world.setTileState(worldTileX, coverTileY, liquidTileId, MAX_LIQUID_LEVEL / 2)
      ).toBe(true);
      expect(world.hasChunk(dirtChunkX, dirtChunkY)).toBe(false);
      expect(world.setTile(worldTileX, coverTileY, 0)).toBe(true);
      expect(world.hasChunk(dirtChunkX, dirtChunkY)).toBe(false);

      world.ensureChunk(dirtChunkX, dirtChunkY);
      expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    });
  }

  it('does not immediately regrow a placed dirt tile in sky when grass is written beside it', () => {
    const world = new TileWorld(0);
    const grassTileX = 6;
    const dirtTileX = grassTileX + 1;
    const worldTileY = -20;

    expect(world.setTile(dirtTileX, worldTileY, PROCEDURAL_DIRT_TILE_ID)).toBe(true);
    expect(world.setTile(grassTileX, worldTileY, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);

    expect(world.getTile(dirtTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
  });

  it('does not immediately regrow exposed dirt when non-solid cover above changes without a solidness transition', () => {
    const world = new TileWorld(0);
    const coveredDirt = findFirstProceduralDirtBelowSolidCoverAdjacentToGrass();
    expect(coveredDirt).not.toBeNull();
    const { worldTileX, worldTileY } = coveredDirt!;
    const coverTileY = worldTileY - 1;

    expect(isTileSolid(world.getTile(worldTileX, coverTileY))).toBe(true);
    expect(world.setTile(worldTileX, coverTileY, NON_SOLID_TEST_TILE_ID)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, PROCEDURAL_DIRT_TILE_ID)).toBe(false);
    expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);

    expect(world.setTile(worldTileX, coverTileY, 0)).toBe(true);

    expect(world.getTile(worldTileX, worldTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
  });

  it('stores buried-grass dirt overrides without forcing the chunk below a bottom-row solid edit resident', () => {
    const world = new TileWorld(0);
    const worldTileX = CHUNK_SIZE + 1;
    const coverTileY = -1;
    const buriedGrassTileY = 0;

    expect(resolveProceduralTerrainTileId(worldTileX, buriedGrassTileY)).toBe(
      PROCEDURAL_GRASS_SURFACE_TILE_ID
    );
    world.ensureChunk(1, -1);
    expect(world.hasChunk(1, 0)).toBe(false);

    expect(world.setTile(worldTileX, coverTileY, SOLID_TEST_TILE_ID)).toBe(true);
    expect(world.hasChunk(1, 0)).toBe(false);

    world.ensureChunk(1, 0);
    expect(world.getTile(worldTileX, buriedGrassTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
  });

  it('clears the rest of a grown small tree before solid cover buries its grass anchor', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];
    const treeTileIds = getSmallTreeTileIds();
    const anchorTileX = 7;
    const anchorTileY = 3;

    expect(world.setTile(anchorTileX, anchorTileY, PROCEDURAL_GRASS_SURFACE_TILE_ID)).toBe(true);
    expect(world.setTile(anchorTileX, anchorTileY - 1, treeTileIds.trunk)).toBe(true);
    expect(world.setTile(anchorTileX, anchorTileY - 2, treeTileIds.trunk)).toBe(true);
    expect(world.setTile(anchorTileX - 1, anchorTileY - 3, treeTileIds.leaf)).toBe(true);
    expect(world.setTile(anchorTileX, anchorTileY - 3, treeTileIds.leaf)).toBe(true);
    expect(world.setTile(anchorTileX + 1, anchorTileY - 3, treeTileIds.leaf)).toBe(true);

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTile(anchorTileX, anchorTileY - 1, SOLID_TEST_TILE_ID)).toBe(true);

    expect(world.getTile(anchorTileX, anchorTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(world.getTile(anchorTileX, anchorTileY - 1)).toBe(SOLID_TEST_TILE_ID);
    expect(world.getTile(anchorTileX, anchorTileY - 2)).toBe(0);
    expect(world.getTile(anchorTileX - 1, anchorTileY - 3)).toBe(0);
    expect(world.getTile(anchorTileX, anchorTileY - 3)).toBe(0);
    expect(world.getTile(anchorTileX + 1, anchorTileY - 3)).toBe(0);
    expect(
      events.map((event) => ({
        worldTileX: event.worldTileX,
        worldTileY: event.worldTileY,
        previousTileId: event.previousTileId,
        tileId: event.tileId
      }))
    ).toEqual([
      {
        worldTileX: anchorTileX,
        worldTileY: anchorTileY - 1,
        previousTileId: treeTileIds.trunk,
        tileId: 0
      },
      {
        worldTileX: anchorTileX,
        worldTileY: anchorTileY - 2,
        previousTileId: treeTileIds.trunk,
        tileId: 0
      },
      {
        worldTileX: anchorTileX - 1,
        worldTileY: anchorTileY - 3,
        previousTileId: treeTileIds.leaf,
        tileId: 0
      },
      {
        worldTileX: anchorTileX,
        worldTileY: anchorTileY - 3,
        previousTileId: treeTileIds.leaf,
        tileId: 0
      },
      {
        worldTileX: anchorTileX + 1,
        worldTileY: anchorTileY - 3,
        previousTileId: treeTileIds.leaf,
        tileId: 0
      },
      {
        worldTileX: anchorTileX,
        worldTileY: anchorTileY - 1,
        previousTileId: 0,
        tileId: SOLID_TEST_TILE_ID
      },
      {
        worldTileX: anchorTileX,
        worldTileY: anchorTileY,
        previousTileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
        tileId: PROCEDURAL_DIRT_TILE_ID
      }
    ]);
  });

  it('applies explicit tile state and still emits edit metadata when only liquid changes', () => {
    const world = new TileWorld(0);
    const events: TileEditEvent[] = [];

    world.onTileEdited((event) => {
      events.push(event);
    });

    expect(world.setTileState(0, 0, WATER_TILE_ID, MAX_LIQUID_LEVEL)).toBe(true);
    events.length = 0;

    expect(world.setTileState(0, 0, WATER_TILE_ID, MAX_LIQUID_LEVEL / 2)).toBe(true);
    expect(world.getTile(0, 0)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(0, 0)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(events).toEqual([
      {
        worldTileX: 0,
        worldTileY: 0,
        chunkX: 0,
        chunkY: 0,
        localX: 0,
        localY: 0,
        previousTileId: WATER_TILE_ID,
        previousLiquidLevel: MAX_LIQUID_LEVEL,
        tileId: WATER_TILE_ID,
        liquidLevel: MAX_LIQUID_LEVEL / 2,
        editOrigin: 'gameplay'
      }
    ]);

    expect(world.setTileState(0, 0, WATER_TILE_ID, MAX_LIQUID_LEVEL / 2)).toBe(false);
  });

  it('reapplies edited tiles when a pruned chunk streams back in', () => {
    const world = new TileWorld(0);
    const editedTileId = 5;

    world.setTile(0, 0, editedTileId);

    expect(world.pruneChunksOutside({ minChunkX: 1, minChunkY: 1, maxChunkX: 1, maxChunkY: 1 })).toBe(1);
    expect(world.getChunkCount()).toBe(0);
    expect(world.getTile(0, 0)).toBe(editedTileId);
    expect(world.getChunkCount()).toBe(1);
  });

  it('stores background walls separately from foreground tiles and reapplies them when a pruned chunk streams back in', () => {
    const world = new TileWorld(0);
    const editedTileId = 5;
    const editedWallId = 9;

    world.setTile(0, 0, editedTileId);
    world.setWall(0, 0, editedWallId);

    expect(world.pruneChunksOutside({ minChunkX: 1, minChunkY: 1, maxChunkX: 1, maxChunkY: 1 })).toBe(1);
    expect(world.getChunkCount()).toBe(0);
    expect(world.getTile(0, 0)).toBe(editedTileId);
    expect(world.getWall(0, 0)).toBe(editedWallId);
    expect(world.getChunkCount()).toBe(1);
  });

  it('drops stored chunk overrides when an edited tile is reset to its procedural value', () => {
    const world = new TileWorld(0);
    const proceduralTileId = world.getTile(0, 0);

    world.setTile(0, 0, 5);
    world.setTile(0, 0, proceduralTileId);

    expect(world.pruneChunksOutside({ minChunkX: 1, minChunkY: 1, maxChunkX: 1, maxChunkY: 1 })).toBe(1);
    expect(world.getTile(0, 0)).toBe(proceduralTileId);
  });

  it('drops stored wall overrides when an edited background wall is reset to empty', () => {
    const world = new TileWorld(0);

    world.setWall(0, 0, 5);
    world.setWall(0, 0, 0);

    expect(world.pruneChunksOutside({ minChunkX: 1, minChunkY: 1, maxChunkX: 1, maxChunkY: 1 })).toBe(1);
    expect(world.getWall(0, 0)).toBe(0);
  });

  it('creates sorted world snapshots for resident chunks and pruned edited chunks', () => {
    const world = new TileWorld(0);

    world.ensureChunk(1, 0);
    world.ensureChunk(-1, -1);
    expect(world.setTile(CHUNK_SIZE * 2, 0, WATER_TILE_ID)).toBe(true);
    expect(world.setTile(-CHUNK_SIZE * 2, 0, 6)).toBe(true);
    expect(
      world.pruneChunksOutside({ minChunkX: -1, minChunkY: -1, maxChunkX: 1, maxChunkY: 0 })
    ).toBe(2);

    const snapshot = world.createSnapshot();

    expect(snapshot.worldSeed).toBe(0);
    expect(snapshot.residentChunks.map((chunk) => chunk.coord)).toEqual([
      { x: -1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    expect(snapshot.editedChunks.map((chunk) => chunk.coord)).toEqual([
      { x: -2, y: 0 },
      { x: 2, y: 0 }
    ]);
    expect(snapshot.editedChunks[0]?.payload.tileOverrides).toEqual([0, 6]);
    expect(snapshot.editedChunks[0]?.payload.liquidLevelOverrides).toEqual([]);
    expect(snapshot.editedChunks[1]?.payload.tileOverrides).toEqual([0, WATER_TILE_ID]);
    expect(snapshot.editedChunks[1]?.payload.liquidLevelOverrides).toEqual([0, MAX_LIQUID_LEVEL]);
  });

  it('round-trips resident and pruned edited background walls through world snapshots', () => {
    const source = new TileWorld(0);
    const loaded = new TileWorld(0);
    const residentWallWorldTileX = 1;
    const residentWallWorldTileY = 0;
    const prunedWallWorldTileX = CHUNK_SIZE * 2;
    const prunedWallWorldTileY = 0;

    source.ensureChunk(1, 0);
    expect(source.setWall(residentWallWorldTileX, residentWallWorldTileY, 7)).toBe(true);
    expect(source.setWall(prunedWallWorldTileX, prunedWallWorldTileY, 4)).toBe(true);
    expect(source.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 1, maxChunkY: 0 })).toBe(1);

    const snapshot = source.createSnapshot();

    expect(snapshot.residentChunks.map((chunk) => chunk.coord)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    const decodedResidentWalls = decodeResidentChunkSnapshot(snapshot.residentChunks[0]!).wallIds;
    expect(decodedResidentWalls[toTileIndex(1, 0)]).toBe(7);
    expect(Array.from(decodedResidentWalls).some((wallId) => wallId === PROCEDURAL_STONE_WALL_ID)).toBe(
      true
    );
    expect(snapshot.editedChunks).toHaveLength(2);
    expect(snapshot.editedChunks.map((chunk) => chunk.coord)).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 }
    ]);
    expect(snapshot.editedChunks[0]?.payload.wallOverrides).toEqual([1, 7]);
    expect(snapshot.editedChunks[1]?.payload.wallOverrides).toEqual([0, 4]);

    loaded.loadSnapshot(snapshot);

    expect(loaded.getWall(residentWallWorldTileX, residentWallWorldTileY)).toBe(7);
    expect(loaded.getWall(prunedWallWorldTileX, prunedWallWorldTileY)).toBe(4);
    expect(loaded.getTile(residentWallWorldTileX, residentWallWorldTileY)).toBe(
      source.getTile(residentWallWorldTileX, residentWallWorldTileY)
    );
    expect(loaded.getTile(prunedWallWorldTileX, prunedWallWorldTileY)).toBe(
      source.getTile(prunedWallWorldTileX, prunedWallWorldTileY)
    );
  });

  it('stores liquid fill levels for liquid tiles and clears them when the tile becomes non-liquid', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const worldTileY = -20;

    world.ensureChunk(0, -1);

    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);
    expect(world.getTile(worldTileX, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(MAX_LIQUID_LEVEL);

    expect(world.setTile(worldTileX, worldTileY, 0)).toBe(true);
    expect(world.getTile(worldTileX, worldTileY)).toBe(0);
    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(0);
  });

  it('flows liquid downward before sideways within the fixed-step simulation', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const worldTileY = -20;

    world.ensureChunk(0, -1);
    expect(world.setTile(worldTileX + 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getTile(worldTileX, worldTileY)).toBe(0);
    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(0);
    expect(world.getTile(worldTileX, worldTileY + 1)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, worldTileY + 1)).toBe(MAX_LIQUID_LEVEL);
  });

  it('reports active-liquid chunk bounds and shrinks them when edge chunks clear', () => {
    const world = new TileWorld(0);
    const leftWorldTileX = -4;
    const leftWorldTileY = -20;
    const rightWorldTileX = CHUNK_SIZE + 4;
    const rightWorldTileY = 4;

    expect(world.getActiveLiquidChunkBounds()).toBeNull();
    expect(world.setTile(leftWorldTileX, leftWorldTileY, WATER_TILE_ID)).toBe(true);
    expect(world.setTile(rightWorldTileX, rightWorldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.getActiveLiquidChunkCount()).toBe(2);
    expect(world.getActiveLiquidChunkBounds()).toEqual({
      minChunkX: -1,
      minChunkY: -1,
      maxChunkX: 1,
      maxChunkY: 0
    });

    expect(world.setTile(rightWorldTileX, rightWorldTileY, 0)).toBe(true);
    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.getActiveLiquidChunkBounds()).toEqual({
      minChunkX: -1,
      minChunkY: -1,
      maxChunkX: -1,
      maxChunkY: -1
    });

    expect(world.setTile(leftWorldTileX, leftWorldTileY, 0)).toBe(true);
    expect(world.getActiveLiquidChunkCount()).toBe(0);
    expect(world.getActiveLiquidChunkBounds()).toBeNull();
  });

  it('reports last-step sideways candidate-band bounds separately from awake-liquid bounds', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const worldTileY = -20;

    world.ensureChunk(-1, -1);
    world.ensureChunk(0, -1);
    world.ensureChunk(1, -1);
    expect(world.setTile(worldTileX - 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.getActiveLiquidChunkBounds()).toEqual({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastSidewaysLiquidCandidateChunkBounds()).toEqual({
      minChunkX: -1,
      minChunkY: -1,
      maxChunkX: 1,
      maxChunkY: -1
    });
    expect(world.getActiveLiquidChunkBounds()).toEqual({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });
  });

  it('records phase-owned liquid scan coverage and transfer counts for the last fixed step', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const worldTileY = -20;

    world.ensureChunk(0, -1);
    expect(world.setTile(worldTileX + 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getLastLiquidSimulationStats()).toEqual({
      downwardActiveChunksScanned: 1,
      sidewaysCandidateChunksScanned: 1,
      sidewaysPairsTested: 512,
      downwardTransfersApplied: 1,
      sidewaysTransfersApplied: 0
    });
  });

  it('skips liquid simulation work when no resident chunk contains liquid', () => {
    const world = new TileWorld(1);

    expect(world.getActiveLiquidChunkCount()).toBe(0);
    expect(world.getActiveLiquidChunkBounds()).toBeNull();
    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastSidewaysLiquidCandidateChunkBounds()).toBeNull();
    expect(world.getLastLiquidSimulationStats()).toEqual({
      downwardActiveChunksScanned: 0,
      sidewaysCandidateChunksScanned: 0,
      sidewaysPairsTested: 0,
      downwardTransfersApplied: 0,
      sidewaysTransfersApplied: 0
    });
    expect(world.createSnapshot().liquidSimulationTick).toBe(1);
  });

  it('keeps active-liquid chunk membership aligned after liquid transfers move fluid into a new chunk and sleeps it after two quiet ticks', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const sourceWorldTileY = -33;
    const targetWorldTileY = sourceWorldTileY + 1;

    world.ensureChunk(0, -2);
    world.ensureChunk(0, -1);
    expect(world.setTile(worldTileX - 1, targetWorldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, targetWorldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX, targetWorldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, sourceWorldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.getSleepingLiquidChunkCount()).toBe(0);
    expect(world.getSleepingLiquidChunkBounds()).toBeNull();
    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getTile(worldTileX, sourceWorldTileY)).toBe(0);
    expect(world.getLiquidLevel(worldTileX, sourceWorldTileY)).toBe(0);
    expect(world.getTile(worldTileX, targetWorldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, targetWorldTileY)).toBe(MAX_LIQUID_LEVEL);
    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.getSleepingLiquidChunkCount()).toBe(0);

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastLiquidSimulationStats().downwardActiveChunksScanned).toBeGreaterThan(0);
    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.getSleepingLiquidChunkCount()).toBe(0);

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getActiveLiquidChunkCount()).toBe(0);
    expect(world.getSleepingLiquidChunkCount()).toBe(1);
    expect(world.getActiveLiquidChunkBounds()).toBeNull();
    expect(world.getSleepingLiquidChunkBounds()).toEqual({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getSleepingLiquidChunkCount()).toBe(1);
    expect(world.getSleepingLiquidChunkBounds()).toEqual({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });
    expect(world.getLastLiquidSimulationStats()).toEqual({
      downwardActiveChunksScanned: 0,
      sidewaysCandidateChunksScanned: 0,
      sidewaysPairsTested: 0,
      downwardTransfersApplied: 0,
      sidewaysTransfersApplied: 0
    });
  });

  it('wakes a settled liquid chunk when a nearby edit reopens sideways flow', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const worldTileY = -20;

    world.ensureChunk(0, -1);
    expect(world.setTile(worldTileX - 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getActiveLiquidChunkCount()).toBe(0);
    expect(world.getSleepingLiquidChunkCount()).toBe(1);
    expect(world.getActiveLiquidChunkBounds()).toBeNull();
    expect(world.getSleepingLiquidChunkBounds()).toEqual({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });

    expect(world.setTile(worldTileX + 1, worldTileY, 0)).toBe(true);
    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.getSleepingLiquidChunkCount()).toBe(0);
    expect(world.getSleepingLiquidChunkBounds()).toBeNull();
    expect(world.getActiveLiquidChunkBounds()).toEqual({
      minChunkX: 0,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: -1
    });

    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getTile(worldTileX, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(world.getTile(worldTileX + 1, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX + 1, worldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
  });

  it('preserves same-step downward-then-sideways flow when liquid falls into a loaded chunk across a chunk boundary', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const sourceWorldTileY = -33;
    const targetWorldTileY = sourceWorldTileY + 1;

    world.ensureChunk(0, -2);
    world.ensureChunk(0, -1);
    expect(world.setTile(worldTileX, targetWorldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, targetWorldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, sourceWorldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getTile(worldTileX, sourceWorldTileY)).toBe(0);
    expect(world.getLiquidLevel(worldTileX, sourceWorldTileY)).toBe(0);
    expect(world.getTile(worldTileX, targetWorldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, targetWorldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(world.getTile(worldTileX + 1, targetWorldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX + 1, targetWorldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(world.getLastLiquidSimulationStats()).toEqual({
      downwardActiveChunksScanned: 1,
      sidewaysCandidateChunksScanned: 1,
      sidewaysPairsTested: 512,
      downwardTransfersApplied: 1,
      sidewaysTransfersApplied: 1
    });
  });

  it('spreads loaded liquid sideways across resident chunk boundaries deterministically', () => {
    const world = new TileWorld(1);
    const worldTileX = CHUNK_SIZE - 1;
    const worldTileY = -20;

    expect(world.setTile(worldTileX - 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getLastLiquidSimulationStats()).toEqual({
      downwardActiveChunksScanned: 1,
      sidewaysCandidateChunksScanned: 3,
      sidewaysPairsTested: 1504,
      downwardTransfersApplied: 0,
      sidewaysTransfersApplied: 1
    });

    expect(world.getTile(worldTileX, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(world.getTile(worldTileX + 1, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX + 1, worldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
  });

  it('reapplies simulated liquid levels when a pruned liquid chunk streams back in', () => {
    const world = new TileWorld(1);
    const worldTileX = CHUNK_SIZE - 1;
    const worldTileY = -20;

    expect(world.setTile(worldTileX - 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);
    world.stepLiquidSimulation();
    world.stepLiquidSimulation();

    expect(world.pruneChunksOutside({ minChunkX: -1, minChunkY: -1, maxChunkX: 0, maxChunkY: 0 })).toBeGreaterThan(0);
    expect(world.getTile(worldTileX + 1, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX + 1, worldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
  });

  it('spreads loaded liquid sideways back into the left neighboring chunk when the active liquid starts on the right side of the boundary pair', () => {
    const world = new TileWorld(1);
    const worldTileX = CHUNK_SIZE;
    const worldTileY = -20;

    expect(world.setTile(worldTileX - 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.stepLiquidSimulation()).toBe(true);

    expect(world.getTile(worldTileX - 1, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX - 1, worldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(world.getTile(worldTileX, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
  });

  it('restores active-liquid chunk membership when a pruned liquid chunk streams back in', () => {
    const world = new TileWorld(0);
    const worldTileX = CHUNK_SIZE + 4;
    const worldTileY = -20;

    world.ensureChunk(1, -1);
    expect(world.setTile(worldTileX - 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.getActiveLiquidChunkBounds()).toEqual({
      minChunkX: 1,
      minChunkY: -1,
      maxChunkX: 1,
      maxChunkY: -1
    });
    expect(world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })).toBe(1);
    expect(world.getActiveLiquidChunkCount()).toBe(0);
    expect(world.getActiveLiquidChunkBounds()).toBeNull();
    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastLiquidSimulationStats()).toEqual({
      downwardActiveChunksScanned: 0,
      sidewaysCandidateChunksScanned: 0,
      sidewaysPairsTested: 0,
      downwardTransfersApplied: 0,
      sidewaysTransfersApplied: 0
    });

    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(MAX_LIQUID_LEVEL);
    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.getActiveLiquidChunkBounds()).toEqual({
      minChunkX: 1,
      minChunkY: -1,
      maxChunkX: 1,
      maxChunkY: -1
    });
    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastLiquidSimulationStats().downwardActiveChunksScanned).toBeGreaterThan(0);
  });

  it('loads snapshots back into resident chunks, sparse edited overrides, and liquid parity', () => {
    const source = new TileWorld(0);
    const liquidWorldTileX = 1;
    const liquidWorldTileY = -20;
    const prunedEditedWorldTileX = CHUNK_SIZE + 5;

    source.ensureChunk(0, -1);
    expect(source.setTile(liquidWorldTileX - 1, liquidWorldTileY, 1)).toBe(true);
    expect(source.setTile(liquidWorldTileX, liquidWorldTileY + 1, 1)).toBe(true);
    expect(source.setTile(liquidWorldTileX + 1, liquidWorldTileY + 1, 1)).toBe(true);
    expect(source.setTile(liquidWorldTileX, liquidWorldTileY, WATER_TILE_ID)).toBe(true);
    expect(source.setTile(prunedEditedWorldTileX, liquidWorldTileY, 5)).toBe(true);

    source.fillChunkLight(0, -1, 7);
    source.markChunkLightClean(0, -1);
    source.invalidateChunkLightColumns(0, -1, localLightColumnBit(liquidWorldTileX));

    expect(source.pruneChunksOutside({ minChunkX: 0, minChunkY: -1, maxChunkX: 0, maxChunkY: 0 })).toBe(1);
    expect(source.stepLiquidSimulation()).toBe(false);

    const snapshot = source.createSnapshot();
    const loaded = new TileWorld(1);

    loaded.loadSnapshot(snapshot);

    expect(snapshot.liquidSimulationTick).toBe(1);
    expect(loaded.getWorldSeed()).toBe(0);
    expect(loaded.getChunkCount()).toBe(2);
    expect(loaded.getActiveLiquidChunkCount()).toBe(1);
    expect(loaded.isChunkLightDirty(0, -1)).toBe(true);
    expect(loaded.getChunkLightDirtyColumnMask(0, -1)).toBe(localLightColumnBit(liquidWorldTileX));
    expect(loaded.getChunkLightLevels(0, -1)[toTileIndex(liquidWorldTileX, 0)]).toBe(0);
    expect(loaded.getChunkLightLevels(0, -1)[toTileIndex(liquidWorldTileX - 1, 0)]).toBe(7);
    expect(loaded.getTile(prunedEditedWorldTileX, liquidWorldTileY)).toBe(5);

    expect(loaded.stepLiquidSimulation()).toBe(true);
    expect(loaded.getLiquidLevel(liquidWorldTileX, liquidWorldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
    expect(loaded.getLiquidLevel(liquidWorldTileX + 1, liquidWorldTileY)).toBe(MAX_LIQUID_LEVEL / 2);
  });

  it('rejects snapshots with duplicate resident chunk coordinates', () => {
    const source = new TileWorld(0);
    const residentChunkSnapshot = encodeResidentChunkSnapshot(source.ensureChunk(0, 0));
    const target = new TileWorld(0);

    expect(() =>
      target.loadSnapshot({
        worldSeed: 0,
        liquidSimulationTick: 0,
        residentChunks: [residentChunkSnapshot, residentChunkSnapshot],
        editedChunks: []
      })
    ).toThrowError(/residentChunks must not contain duplicate chunk coord 0,0/);
  });

  it('defaults missing snapshot world seeds to the legacy seed-0 terrain baseline', () => {
    const source = new TileWorld(0);
    const legacySnapshot = source.createSnapshot() as unknown as {
      liquidSimulationTick: number;
      residentChunks: ReturnType<TileWorld['createSnapshot']>['residentChunks'];
      editedChunks: ReturnType<TileWorld['createSnapshot']>['editedChunks'];
    };
    delete (legacySnapshot as { worldSeed?: number }).worldSeed;

    const loaded = new TileWorld(0, 0x12345678);
    loaded.loadSnapshot(legacySnapshot as ReturnType<TileWorld['createSnapshot']>);

    expect(loaded.getWorldSeed()).toBe(0);
    expect(loaded.getTile(0, 0)).toBe(resolveProceduralTerrainTileId(0, 0, 0));
  });

  it('keeps water and lava separated when sideways spreading resolves across neighboring cells', () => {
    const world = new TileWorld(1);
    const worldTileX = 10;
    const worldTileY = -20;

    expect(world.setTile(worldTileX, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);
    expect(world.setTile(worldTileX + 1, worldTileY, LAVA_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getTile(worldTileX, worldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(MAX_LIQUID_LEVEL);
    expect(world.getTile(worldTileX + 1, worldTileY)).toBe(LAVA_TILE_ID);
    expect(world.getLiquidLevel(worldTileX + 1, worldTileY)).toBe(MAX_LIQUID_LEVEL);
  });

  it('generates procedural terrain from the shared layered surface sampler', () => {
    const world = new TileWorld(0);
    for (const worldX of [-48, -16, 0, 17, CHUNK_SIZE + 9]) {
      const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX);
      expect(world.getTile(worldX, surfaceTileY - 1)).toBe(0);
      expect(world.getTile(worldX, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
      expect(world.getTile(worldX, surfaceTileY + 1)).toBe(PROCEDURAL_DIRT_TILE_ID);
      expect(world.getTile(worldX, surfaceTileY + dirtDepthTiles)).toBe(PROCEDURAL_DIRT_TILE_ID);
      expect(world.getTile(worldX, surfaceTileY + dirtDepthTiles + 1)).toBe(PROCEDURAL_STONE_TILE_ID);
    }
  });

  it('streams untouched carved cave air back in after pruning its chunk', () => {
    const caveTile = findFirstProceduralCaveTile();
    expect(caveTile).not.toBeNull();
    if (caveTile === null) {
      throw new Error('expected a procedural cave tile');
    }

    const world = new TileWorld(0);
    expect(world.getTile(caveTile.worldTileX, caveTile.worldTileY)).toBe(0);

    expect(world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })).toBeGreaterThan(0);
    const chunkCountAfterPrune = world.getChunkCount();

    expect(world.getTile(caveTile.worldTileX, caveTile.worldTileY)).toBe(0);
    expect(world.getChunkCount()).toBe(chunkCountAfterPrune + 1);
  });

  it('generates dirt walls behind dirt bands and stone walls deeper underground, including cave-mouth openings', () => {
    const caveTile = findFirstProceduralCaveTile();
    const caveMouthColumn = findFirstProceduralExposedCaveMouthColumn();

    expect(caveTile).not.toBeNull();
    if (caveTile === null) {
      throw new Error('expected a procedural cave tile');
    }
    expect(caveMouthColumn).not.toBeNull();
    if (caveMouthColumn === null) {
      throw new Error('expected a procedural exposed cave-mouth column');
    }

    const world = new TileWorld(0);
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(0);
    const dirtTileY = surfaceTileY + 1;
    const undergroundStoneTileY = surfaceTileY + dirtDepthTiles + 1;

    expect(world.getTile(0, dirtTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(world.getWall(0, dirtTileY)).toBe(PROCEDURAL_DIRT_WALL_ID);
    expect(world.getTile(0, undergroundStoneTileY)).toBe(PROCEDURAL_STONE_TILE_ID);
    expect(world.getWall(0, undergroundStoneTileY)).toBe(PROCEDURAL_STONE_WALL_ID);
    expect(world.getTile(caveTile.worldTileX, caveTile.worldTileY)).toBe(0);
    expect(world.getWall(caveTile.worldTileX, caveTile.worldTileY)).toBe(PROCEDURAL_STONE_WALL_ID);
    expect(world.getWall(caveMouthColumn.worldTileX, caveMouthColumn.surfaceTileY)).toBe(PROCEDURAL_DIRT_WALL_ID);
    expect(world.getWall(caveMouthColumn.worldTileX, caveMouthColumn.surfaceTileY + 1)).toBe(
      PROCEDURAL_DIRT_WALL_ID
    );
    expect(world.getWall(caveMouthColumn.worldTileX, caveMouthColumn.deepestAirTileY)).toBe(
      PROCEDURAL_STONE_WALL_ID
    );
  });

  it('reveals the procedural dirt wall when dirt is mined away', () => {
    const worldTileX = 0;
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX);
    const dirtTileY = surfaceTileY + 1;
    const world = new TileWorld(0);

    expect(world.getTile(worldTileX, dirtTileY)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(world.getWall(worldTileX, dirtTileY)).toBe(PROCEDURAL_DIRT_WALL_ID);

    expect(world.setTile(worldTileX, dirtTileY, 0)).toBe(true);

    expect(world.getTile(worldTileX, dirtTileY)).toBe(0);
    expect(world.getWall(worldTileX, dirtTileY)).toBe(PROCEDURAL_DIRT_WALL_ID);
  });

  it('reveals the procedural stone wall when underground stone is mined away', () => {
    const worldTileX = 0;
    const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldTileX);
    const undergroundStoneTileY = surfaceTileY + dirtDepthTiles + 1;
    const world = new TileWorld(0);

    expect(world.getTile(worldTileX, undergroundStoneTileY)).toBe(PROCEDURAL_STONE_TILE_ID);
    expect(world.getWall(worldTileX, undergroundStoneTileY)).toBe(PROCEDURAL_STONE_WALL_ID);

    expect(world.setTile(worldTileX, undergroundStoneTileY, 0)).toBe(true);

    expect(world.getTile(worldTileX, undergroundStoneTileY)).toBe(0);
    expect(world.getWall(worldTileX, undergroundStoneTileY)).toBe(PROCEDURAL_STONE_WALL_ID);
  });

  it('streams untouched procedural cave stone walls back in after pruning their chunk', () => {
    const caveWallTile = findFirstProceduralStoneWallTile();
    expect(caveWallTile).not.toBeNull();
    if (caveWallTile === null) {
      throw new Error('expected a procedural cave wall tile');
    }

    const world = new TileWorld(0);
    expect(world.getWall(caveWallTile.worldTileX, caveWallTile.worldTileY)).toBe(PROCEDURAL_STONE_WALL_ID);

    expect(
      world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })
    ).toBeGreaterThan(0);
    const chunkCountAfterPrune = world.getChunkCount();

    expect(world.getWall(caveWallTile.worldTileX, caveWallTile.worldTileY)).toBe(PROCEDURAL_STONE_WALL_ID);
    expect(world.getChunkCount()).toBe(chunkCountAfterPrune + 1);
  });

  it('streams untouched exposed cave-mouth air back in after pruning its chunk', () => {
    const caveMouthColumn = findFirstProceduralExposedCaveMouthColumn();
    expect(caveMouthColumn).not.toBeNull();
    if (caveMouthColumn === null) {
      throw new Error('expected a procedural exposed cave-mouth column');
    }

    const world = new TileWorld(0);
    expect(world.getTile(caveMouthColumn.worldTileX, caveMouthColumn.surfaceTileY)).toBe(0);
    expect(world.getTile(caveMouthColumn.worldTileX, caveMouthColumn.deepestAirTileY)).toBe(0);

    expect(
      world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })
    ).toBeGreaterThan(0);
    const chunkCountAfterPrune = world.getChunkCount();

    expect(world.getTile(caveMouthColumn.worldTileX, caveMouthColumn.surfaceTileY)).toBe(0);
    expect(world.getTile(caveMouthColumn.worldTileX, caveMouthColumn.deepestAirTileY)).toBe(0);
    expect(world.getChunkCount()).toBe(chunkCountAfterPrune + 1);
  });

  it('reports open sky above a cave-mouth floor that stays exposed to the surface', () => {
    const caveMouthColumn = findFirstProceduralExposedCaveMouthColumn();
    expect(caveMouthColumn).not.toBeNull();
    if (caveMouthColumn === null) {
      throw new Error('expected a procedural exposed cave-mouth column');
    }

    const world = new TileWorld(0);
    const standingTileY = caveMouthColumn.deepestAirTileY + 1;

    expect(world.getTile(caveMouthColumn.worldTileX, standingTileY)).not.toBe(0);
    expect(world.hasOpenSkyAbove(caveMouthColumn.worldTileX, standingTileY)).toBe(true);
  });

  it('ignores non-solid small-tree foliage above a surface landing when checking open sky', () => {
    const worldTileX = 0;
    const world = new TileWorld(0);
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX);
    const treeTileIds = getSmallTreeTileIds();

    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(true);
    expect(world.setTile(worldTileX, surfaceTileY - 8, treeTileIds.leaf)).toBe(true);
    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(true);
  });

  it('ignores tall grass above a surface landing when checking open sky', () => {
    const worldTileX = 0;
    const world = new TileWorld(0);
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX);

    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(true);
    expect(world.setTile(worldTileX, surfaceTileY - 1, getTallGrassTileId())).toBe(true);
    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(true);
  });

  it('still treats non-foliage non-solid cover as blocking sky above a surface landing', () => {
    const worldTileX = 0;
    const world = new TileWorld(0);
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX);

    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(true);
    expect(world.setTile(worldTileX, surfaceTileY - 8, NON_SOLID_TEST_TILE_ID)).toBe(true);
    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(false);
  });

  it('reports blocked sky above a surface landing when a roof is placed higher in that column', () => {
    const worldTileX = 0;
    const world = new TileWorld(0);
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX);

    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(true);
    expect(world.setTile(worldTileX, surfaceTileY - 8, SOLID_TEST_TILE_ID)).toBe(true);
    expect(world.hasOpenSkyAbove(worldTileX, surfaceTileY)).toBe(false);
  });

  it('persists explicit empty-wall overrides when a generated cave stone wall is cleared', () => {
    const caveWallTile = findFirstProceduralStoneWallTile();
    expect(caveWallTile).not.toBeNull();
    if (caveWallTile === null) {
      throw new Error('expected a procedural cave wall tile');
    }

    const world = new TileWorld(0);
    const clearedChunkX = Math.floor(caveWallTile.worldTileX / CHUNK_SIZE);
    const localTileX = ((caveWallTile.worldTileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localTileY = ((caveWallTile.worldTileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    expect(world.getWall(caveWallTile.worldTileX, caveWallTile.worldTileY)).toBe(PROCEDURAL_STONE_WALL_ID);
    expect(world.setWall(caveWallTile.worldTileX, caveWallTile.worldTileY, 0)).toBe(true);
    expect(world.getWall(caveWallTile.worldTileX, caveWallTile.worldTileY)).toBe(0);

    expect(world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })).toBeGreaterThan(0);

    const snapshot = world.createSnapshot();
    const clearedChunkSnapshot = snapshot.editedChunks.find((chunk) => chunk.coord.x === clearedChunkX);
    expect(clearedChunkSnapshot?.payload.wallOverrides).toEqual([toTileIndex(localTileX, localTileY), 0]);

    expect(world.getWall(caveWallTile.worldTileX, caveWallTile.worldTileY)).toBe(0);

    const loaded = new TileWorld(0);
    loaded.loadSnapshot(snapshot);
    expect(loaded.getWall(caveWallTile.worldTileX, caveWallTile.worldTileY)).toBe(0);
  });

  it('streams untouched copper-ore tiles back in after pruning their chunk', () => {
    const copperOreTile = findFirstProceduralCopperOreTile();
    expect(copperOreTile).not.toBeNull();
    if (copperOreTile === null) {
      throw new Error('expected a procedural copper ore tile');
    }

    const world = new TileWorld(0);
    expect(world.getTile(copperOreTile.worldTileX, copperOreTile.worldTileY)).toBe(
      PROCEDURAL_COPPER_ORE_TILE_ID
    );

    expect(
      world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })
    ).toBeGreaterThan(0);
    const chunkCountAfterPrune = world.getChunkCount();

    expect(world.getTile(copperOreTile.worldTileX, copperOreTile.worldTileY)).toBe(
      PROCEDURAL_COPPER_ORE_TILE_ID
    );
    expect(world.getChunkCount()).toBe(chunkCountAfterPrune + 1);
  });

  it('uses snapshot-preserved world seeds when untouched chunks stream back in', () => {
    const worldSeed = 0x12345678;
    const world = new TileWorld(0, worldSeed);
    const worldTileX = CHUNK_SIZE + 9;
    const { surfaceTileY } = resolveProceduralTerrainColumn(worldTileX, worldSeed);
    const caveTile = findFirstProceduralCaveTile(worldSeed);
    const caveWallTile = findFirstProceduralStoneWallTile(worldSeed);
    const copperOreTile = findFirstProceduralCopperOreTile(worldSeed);

    expect(caveTile).not.toBeNull();
    if (caveTile === null) {
      throw new Error('expected a seeded procedural cave tile');
    }
    expect(caveWallTile).not.toBeNull();
    if (caveWallTile === null) {
      throw new Error('expected a seeded procedural cave wall tile');
    }
    expect(copperOreTile).not.toBeNull();
    if (copperOreTile === null) {
      throw new Error('expected a seeded procedural copper ore tile');
    }

    world.ensureChunk(1, 0);
    expect(world.createSnapshot().worldSeed).toBe(worldSeed);
    expect(world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })).toBe(1);

    const loaded = new TileWorld(0);
    loaded.loadSnapshot(world.createSnapshot());

    expect(loaded.getWorldSeed()).toBe(worldSeed);
    expect(loaded.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })).toBe(0);
    expect(loaded.getTile(worldTileX, surfaceTileY)).toBe(PROCEDURAL_GRASS_SURFACE_TILE_ID);
    expect(loaded.getTile(worldTileX, surfaceTileY + 1)).toBe(PROCEDURAL_DIRT_TILE_ID);
    expect(loaded.getTile(caveTile.worldTileX, caveTile.worldTileY)).toBe(0);
    expect(loaded.getWall(caveWallTile.worldTileX, caveWallTile.worldTileY)).toBe(PROCEDURAL_STONE_WALL_ID);
    expect(loaded.getTile(copperOreTile.worldTileX, copperOreTile.worldTileY)).toBe(
      PROCEDURAL_COPPER_ORE_TILE_ID
    );
  });

  it('does not emit or change when setting the same tile value', () => {
    const world = new TileWorld(0);
    const tileId = world.getTile(0, 0);
    let editCount = 0;

    world.onTileEdited(() => {
      editCount += 1;
    });

    const changed = world.setTile(0, 0, tileId);

    expect(changed).toBe(false);
    expect(editCount).toBe(0);
  });

  it('stores per-chunk light levels and tracks resident dirty light chunks', () => {
    const world = new TileWorld(0);

    expect(world.getLightLevel(0, 0)).toBe(0);
    expect(world.isChunkLightDirty(0, 0)).toBe(true);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK);
    expect(world.getDirtyLightChunkCoords()).toEqual([{ x: 0, y: 0 }]);
    expect(world.getDirtyLightChunkCount()).toBe(1);

    world.fillChunkLight(0, 0, MAX_LIGHT_LEVEL);
    expect(world.getLightLevel(0, 0)).toBe(MAX_LIGHT_LEVEL);
    expect(world.setLightLevel(0, 0, MAX_LIGHT_LEVEL - 1)).toBe(true);
    expect(world.setLightLevel(0, 0, MAX_LIGHT_LEVEL - 1)).toBe(false);
    expect(world.getLightLevel(0, 0)).toBe(MAX_LIGHT_LEVEL - 1);

    world.markChunkLightClean(0, 0);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(0);
    expect(world.getDirtyLightChunkCoords()).toEqual([]);
    expect(world.getDirtyLightChunkCount()).toBe(0);

    expect(() => world.setLightLevel(0, 0, MAX_LIGHT_LEVEL + 1)).toThrowError(
      /lightLevel must be an integer between 0 and 15/
    );
  });

  it('invalidates loaded light chunks only when an edit changes tile lighting state', () => {
    const world = new TileWorld(1);
    const affectedChunks = [
      {
        x: 0,
        y: -1,
        expectedMask: localLightColumnRangeMask(CHUNK_SIZE - 2, CHUNK_SIZE - 1),
        clearedLocalXs: [CHUNK_SIZE - 2, CHUNK_SIZE - 1],
        untouchedLocalX: CHUNK_SIZE - 3
      },
      {
        x: 0,
        y: 0,
        expectedMask: localLightColumnRangeMask(CHUNK_SIZE - 2, CHUNK_SIZE - 1),
        clearedLocalXs: [CHUNK_SIZE - 2, CHUNK_SIZE - 1],
        untouchedLocalX: CHUNK_SIZE - 3
      },
      {
        x: 1,
        y: -1,
        expectedMask: localLightColumnRangeMask(0, 1),
        clearedLocalXs: [0, 1],
        untouchedLocalX: 2
      },
      {
        x: 1,
        y: 0,
        expectedMask: localLightColumnRangeMask(0, 1),
        clearedLocalXs: [0, 1],
        untouchedLocalX: 2
      }
    ];
    const unaffectedChunks = [
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ];

    for (const chunk of [...affectedChunks, ...unaffectedChunks]) {
      world.fillChunkLight(chunk.x, chunk.y, 7);
      world.markChunkLightClean(chunk.x, chunk.y);
    }

    expect(world.setTile(CHUNK_SIZE - 1, 0, 0)).toBe(true);

    for (const chunk of affectedChunks) {
      expect(world.isChunkLightDirty(chunk.x, chunk.y)).toBe(true);
      expect(world.getChunkLightDirtyColumnMask(chunk.x, chunk.y)).toBe(chunk.expectedMask);

      const levels = world.getChunkLightLevels(chunk.x, chunk.y);
      for (const clearedLocalX of chunk.clearedLocalXs) {
        for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
          expect(levels[toTileIndex(clearedLocalX, localY)]).toBe(0);
        }
      }

      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        expect(levels[toTileIndex(chunk.untouchedLocalX, localY)]).toBe(7);
      }
    }

    for (const chunk of unaffectedChunks) {
      expect(world.isChunkLightDirty(chunk.x, chunk.y)).toBe(false);
      expect(world.getChunkLightLevels(chunk.x, chunk.y).every((lightLevel) => lightLevel === 7)).toBe(true);
    }

    for (const chunk of affectedChunks) {
      world.markChunkLightClean(chunk.x, chunk.y);
    }

    world.fillChunkLight(0, 0, 5);
    world.markChunkLightClean(0, 0);

    expect(world.setTile(0, 0, 2)).toBe(true);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getChunkLightLevels(0, 0).every((lightLevel) => lightLevel === 5)).toBe(true);
  });

  it('widens non-emissive blocksLight edit invalidation to immediate neighboring columns for one-tile-gap blocker-face relighting', () => {
    const world = new TileWorld(0);
    const editedWorldTileX = 4;
    const editedWorldTileY = -20;
    const editedChunkY = -1;

    world.ensureChunk(0, editedChunkY);
    world.fillChunkLight(0, editedChunkY, 7);
    world.markChunkLightClean(0, editedChunkY);

    expect(world.getTile(editedWorldTileX, editedWorldTileY)).toBe(0);
    expect(world.setTile(editedWorldTileX, editedWorldTileY, 1)).toBe(true);

    expect(world.getChunkLightDirtyColumnMask(0, editedChunkY)).toBe(localLightColumnRangeMask(3, 5));

    const levels = world.getChunkLightLevels(0, editedChunkY);
    for (const clearedLocalX of [3, 4, 5]) {
      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        expect(levels[toTileIndex(clearedLocalX, localY)]).toBe(0);
      }
    }
    for (const untouchedLocalX of [2, 6]) {
      for (let localY = 0; localY < CHUNK_SIZE; localY += 1) {
        expect(levels[toTileIndex(untouchedLocalX, localY)]).toBe(7);
      }
    }
  });

  it('treats emissive gameplay changes as lighting-state changes', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 5,
          name: 'lamp_off',
          gameplay: { solid: false, blocksLight: false },
          render: { atlasIndex: 1 }
        },
        {
          id: 6,
          name: 'lamp_on',
          gameplay: { solid: false, blocksLight: false, emissiveLight: 11 },
          render: { atlasIndex: 2 }
        }
      ]
    });

    expect(didTileLightingStateChange(5, 6, registry)).toBe(true);
    expect(didTileLightingStateChange(6, 5, registry)).toBe(true);
    expect(didTileLightingStateChange(5, 0, registry)).toBe(false);
  });

  it('invalidates neighboring chunk columns when a local emissive source is edited', () => {
    const world = new TileWorld(1);
    const placedEmissiveWorldTileX = CHUNK_SIZE - 1;

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    expect(world.setTile(placedEmissiveWorldTileX, 0, 6)).toBe(true);

    const expectedSameChunkMask = localLightColumnRangeMask(CHUNK_SIZE - 13, CHUNK_SIZE - 1);
    const expectedNextChunkMask = localLightColumnRangeMask(0, 11);

    expect(world.getChunkLightDirtyColumnMask(0, -1)).toBe(expectedSameChunkMask);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(expectedSameChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, -1)).toBe(expectedNextChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, 0)).toBe(expectedNextChunkMask);
    expect(world.isChunkLightDirty(-1, 0)).toBe(false);
  });

  it('widens non-emissive blocksLight edit invalidation when nearby emissive sources can reach the edit', () => {
    const world = new TileWorld(1);
    const worldTileY = -20;
    const emissiveTileId = 6;
    const emissiveRange = getTileEmissiveLightLevel(emissiveTileId);
    const emissiveWorldTileX = CHUNK_SIZE - 1;
    const blockerWorldTileX = CHUNK_SIZE + 2;

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    expect(world.setTile(emissiveWorldTileX, worldTileY, emissiveTileId)).toBe(true);

    for (const chunk of world.getChunks()) {
      world.fillChunkLight(chunk.coord.x, chunk.coord.y, 7);
      world.markChunkLightClean(chunk.coord.x, chunk.coord.y);
    }

    expect(world.getTile(blockerWorldTileX, worldTileY)).toBe(0);
    expect(world.setTile(blockerWorldTileX, worldTileY, 1)).toBe(true);

    const expectedPreviousChunkMask = localLightColumnRangeMask(
      CHUNK_SIZE + 2 - emissiveRange,
      CHUNK_SIZE - 1
    );
    const expectedEditedChunkMask = localLightColumnRangeMask(
      0,
      Math.min(CHUNK_SIZE - 1, 2 + emissiveRange)
    );

    expect(world.getChunkLightDirtyColumnMask(0, -1)).toBe(expectedPreviousChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, -1)).toBe(expectedEditedChunkMask);
    expect(world.getChunkLightDirtyColumnMask(1, -1)).not.toBe(localLightColumnBit(2));
    expect(world.isChunkLightDirty(-1, -1)).toBe(false);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.isChunkLightDirty(1, 0)).toBe(false);
  });

  it('tracks and clears chunk light dirtiness per local sunlight column', () => {
    const world = new TileWorld(0);
    const firstColumnMask = localLightColumnBit(3);
    const secondColumnMask = localLightColumnBit(8);

    world.fillChunkLight(0, 0, 9);
    world.markChunkLightClean(0, 0);

    world.invalidateChunkLightColumns(0, 0, firstColumnMask);
    expect(world.isChunkLightDirty(0, 0)).toBe(true);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(firstColumnMask);

    const levelsAfterFirstInvalidation = world.getChunkLightLevels(0, 0);
    expect(levelsAfterFirstInvalidation[toTileIndex(3, 0)]).toBe(0);
    expect(levelsAfterFirstInvalidation[toTileIndex(4, 0)]).toBe(9);

    world.invalidateChunkLightColumns(0, 0, secondColumnMask);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe((firstColumnMask | secondColumnMask) >>> 0);

    world.markChunkLightColumnsClean(0, 0, firstColumnMask);
    expect(world.isChunkLightDirty(0, 0)).toBe(true);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(secondColumnMask);

    world.markChunkLightColumnsClean(0, 0, secondColumnMask);
    expect(world.isChunkLightDirty(0, 0)).toBe(false);
    expect(world.getChunkLightDirtyColumnMask(0, 0)).toBe(0);
  });

  it('samples cardinal and diagonal neighbors across chunk boundaries', () => {
    const world = new TileWorld(0);

    world.setTile(0, 0, 11);
    world.setTile(0, -1, 12);
    world.setTile(1, -1, 13);
    world.setTile(1, 0, 20);
    world.setTile(1, 1, 15);
    world.setTile(0, 1, 16);
    world.setTile(-1, 1, 17);
    world.setTile(-1, 0, 18);
    world.setTile(-1, -1, 19);

    const sampled = world.sampleTileNeighborhood(0, 0);

    expect(sampled).toEqual({
      center: 11,
      north: 12,
      northEast: 13,
      east: 20,
      southEast: 15,
      south: 16,
      southWest: 17,
      west: 18,
      northWest: 19
    });

    expect(world.sampleLocalTileNeighborhood(0, 0, 0, 0)).toEqual(sampled);

    const scratch = {
      center: -1,
      north: -1,
      northEast: -1,
      east: -1,
      southEast: -1,
      south: -1,
      southWest: -1,
      west: -1,
      northWest: -1
    };
    expect(world.sampleLocalTileNeighborhoodInto(0, 0, 0, 0, scratch)).toBe(scratch);
    expect(scratch).toEqual(sampled);
  });
});
