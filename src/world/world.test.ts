import { describe, expect, it } from 'vitest';

import { encodeResidentChunkSnapshot } from './chunkSnapshot';
import { CHUNK_SIZE, MAX_LIGHT_LEVEL, MAX_LIQUID_LEVEL } from './constants';
import type { ChunkBounds } from './chunkMath';
import { toTileIndex } from './chunkMath';
import { getTileEmissiveLightLevel, parseTileMetadataRegistry } from './tileMetadata';
import { didTileLightingStateChange, TileWorld } from './world';
import type { TileEditEvent } from './world';

const ALL_LOCAL_LIGHT_COLUMNS_DIRTY_MASK = 0xffffffff >>> 0;
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
        tileId: 3
      }
    ]);
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

  it('drops stored chunk overrides when an edited tile is reset to its procedural value', () => {
    const world = new TileWorld(0);
    const proceduralTileId = world.getTile(0, 0);

    world.setTile(0, 0, 5);
    world.setTile(0, 0, proceduralTileId);

    expect(world.pruneChunksOutside({ minChunkX: 1, minChunkY: 1, maxChunkX: 1, maxChunkY: 1 })).toBe(1);
    expect(world.getTile(0, 0)).toBe(proceduralTileId);
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

  it('records liquid-step scan, horizontal-pair, and applied-transfer counts for the last fixed step', () => {
    const world = new TileWorld(0);
    const worldTileX = 4;
    const worldTileY = -20;

    world.ensureChunk(0, -1);
    expect(world.setTile(worldTileX + 1, worldTileY + 1, 1)).toBe(true);
    expect(world.setTile(worldTileX, worldTileY, WATER_TILE_ID)).toBe(true);

    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getLastLiquidSimulationStats()).toEqual({
      residentChunksScanned: 2,
      horizontalPairsTested: 1024,
      transfersApplied: 1
    });
  });

  it('skips liquid simulation work when no resident chunk contains liquid', () => {
    const world = new TileWorld(1);

    expect(world.getActiveLiquidChunkCount()).toBe(0);
    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastLiquidSimulationStats()).toEqual({
      residentChunksScanned: 0,
      horizontalPairsTested: 0,
      transfersApplied: 0
    });
    expect(world.createSnapshot().liquidSimulationTick).toBe(1);
  });

  it('keeps active-liquid chunk membership aligned after liquid transfers move fluid into a new chunk', () => {
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
    expect(world.stepLiquidSimulation()).toBe(true);
    expect(world.getTile(worldTileX, sourceWorldTileY)).toBe(0);
    expect(world.getLiquidLevel(worldTileX, sourceWorldTileY)).toBe(0);
    expect(world.getTile(worldTileX, targetWorldTileY)).toBe(WATER_TILE_ID);
    expect(world.getLiquidLevel(worldTileX, targetWorldTileY)).toBe(MAX_LIQUID_LEVEL);
    expect(world.getActiveLiquidChunkCount()).toBe(1);

    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastLiquidSimulationStats().residentChunksScanned).toBeGreaterThan(0);
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
    expect(world.pruneChunksOutside({ minChunkX: 0, minChunkY: 0, maxChunkX: 0, maxChunkY: 0 })).toBe(1);
    expect(world.getActiveLiquidChunkCount()).toBe(0);
    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastLiquidSimulationStats()).toEqual({
      residentChunksScanned: 0,
      horizontalPairsTested: 0,
      transfersApplied: 0
    });

    expect(world.getLiquidLevel(worldTileX, worldTileY)).toBe(MAX_LIQUID_LEVEL);
    expect(world.getActiveLiquidChunkCount()).toBe(1);
    expect(world.stepLiquidSimulation()).toBe(false);
    expect(world.getLastLiquidSimulationStats().residentChunksScanned).toBeGreaterThan(0);
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
        liquidSimulationTick: 0,
        residentChunks: [residentChunkSnapshot, residentChunkSnapshot],
        editedChunks: []
      })
    ).toThrowError(/residentChunks must not contain duplicate chunk coord 0,0/);
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

  it('generates procedural terrain with sky above and ground below in +Y-down world space', () => {
    const world = new TileWorld(0);
    const worldX = 0;
    const heightAtX = -2; // floor(sin(0 * 0.2) * 3) - 2

    expect(world.getTile(worldX, heightAtX - 1)).toBe(0);
    expect(world.getTile(worldX, heightAtX)).toBe(2);
    expect(world.getTile(worldX, heightAtX + 1)).toBe(1);
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
    world.setTile(1, 0, 14);
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
      east: 14,
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
