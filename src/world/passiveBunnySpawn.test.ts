import { describe, expect, it } from 'vitest';

import { findPlayerSpawnPoint } from './playerSpawn';
import { createPlayerState } from './playerState';
import { resolveProceduralTerrainColumn } from './proceduralTerrain';
import { STARTER_PLATFORM_TILE_ID } from './starterPlatformPlacement';
import { createPassiveBunnyState, DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS } from './passiveBunnyState';
import { getSmallTreeTileIds } from './smallTreeTiles';
import { TileWorld } from './world';
import {
  createPassiveBunnySpawnerState,
  DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS,
  DEFAULT_PASSIVE_BUNNY_WINDOW_OFFSETS_TILES,
  resolvePassiveBunnySpawnWindowTarget,
  stepPassiveBunnySpawner
} from './passiveBunnySpawn';

const setTiles = (
  world: TileWorld,
  minTileX: number,
  minTileY: number,
  maxTileX: number,
  maxTileY: number,
  tileId: number
): void => {
  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      world.setTile(tileX, tileY, tileId);
    }
  }
};

const createFlatSurfaceWorld = (): TileWorld => {
  const world = new TileWorld(0);
  setTiles(world, -48, -16, 48, 16, 0);
  setTiles(world, -48, 0, 48, 0, 3);
  return world;
};

const createCrowdedPassiveBunnyEntries = (
  anchorTileXs: ReadonlyArray<number>
): Array<{ id: number; state: ReturnType<typeof createPassiveBunnyState> }> =>
  anchorTileXs.map((anchorTileX, index) => ({
    id: index + 1,
    state: createPassiveBunnyState({
      position: {
        x: anchorTileX * 16 + 8,
        y: 0
      }
    })
  }));

describe('passiveBunnySpawn', () => {
  it('normalizes the next deterministic spawn-window index into its tile-offset target', () => {
    expect(
      resolvePassiveBunnySpawnWindowTarget(DEFAULT_PASSIVE_BUNNY_WINDOW_OFFSETS_TILES.length + 2)
    ).toEqual({
      index: 2,
      offsetTiles: DEFAULT_PASSIVE_BUNNY_WINDOW_OFFSETS_TILES[2]
    });

    expect(resolvePassiveBunnySpawnWindowTarget(5, [6, -3] as const)).toEqual({
      index: 1,
      offsetTiles: -3
    });
  });

  it('spawns from the next deterministic surface window once the fixed-step cooldown elapses', () => {
    const world = createFlatSurfaceWorld();
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    let spawnerState = createPassiveBunnySpawnerState(2);

    const firstStep = stepPassiveBunnySpawner({
      playerState,
      spawnerState,
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options),
      spawnIntervalTicks: 2
    });

    expect(firstStep.spawnState).toBeNull();
    expect(firstStep.despawnIds).toEqual([]);
    expect(firstStep.nextSpawnerState).toEqual({
      ticksUntilNextSpawn: 1,
      nextWindowIndex: 0
    });

    spawnerState = firstStep.nextSpawnerState;

    const secondStep = stepPassiveBunnySpawner({
      playerState,
      spawnerState,
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options),
      spawnIntervalTicks: 2
    });

    expect(secondStep.spawnState).toEqual({
      position: { x: 136, y: 0 },
      velocity: { x: 0, y: 0 },
      size: { width: 14, height: 18 },
      grounded: true,
      facing: 'right',
      hopCooldownTicksRemaining: DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS
    });
    expect(secondStep.despawnIds).toEqual([]);
    expect(secondStep.nextSpawnerState).toEqual({
      ticksUntilNextSpawn: 2,
      nextWindowIndex: 1
    });
  });

  it('falls forward through later windows when the current deterministic window is blocked', () => {
    const world = createFlatSurfaceWorld();
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });

    setTiles(world, 5, -18, 10, 8, 3);

    const result = stepPassiveBunnySpawner({
      playerState,
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState?.position).toEqual({ x: -120, y: 0 });
    expect(result.spawnState?.facing).toBe('left');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(2);
  });

  it('keeps natural bunny spawns on the surface even when the player is underground', () => {
    const world = new TileWorld(0);
    const windowAnchorTileX = 8;
    const { surfaceTileY } = resolveProceduralTerrainColumn(windowAnchorTileX, world.getWorldSeed());
    const undergroundStandingTileY = surfaceTileY + 8;

    setTiles(world, windowAnchorTileX - 2, surfaceTileY + 1, windowAnchorTileX + 2, undergroundStandingTileY - 1, 0);
    setTiles(world, windowAnchorTileX - 2, undergroundStandingTileY, windowAnchorTileX + 2, undergroundStandingTileY, 3);

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: undergroundStandingTileY * 16 }
      }),
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState?.position).toEqual({
      x: 136,
      y: surfaceTileY * 16
    });
    expect(result.spawnState?.facing).toBe('right');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(1);
  });

  it('falls back within the current deterministic window when the nearest landing lacks open sky above it', () => {
    const world = createFlatSurfaceWorld();
    world.setTile(8, -8, 3);

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: 0 }
      }),
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options),
      hasOpenSkyAbove: (worldTileX, standingTileY) => world.hasOpenSkyAbove(worldTileX, standingTileY)
    });

    expect(result.spawnState?.position).toEqual({ x: 120, y: 0 });
    expect(result.spawnState?.facing).toBe('right');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(1);
  });

  it('keeps the current deterministic landing when only non-solid foliage sits above it', () => {
    const world = createFlatSurfaceWorld();
    const treeTileIds = getSmallTreeTileIds();
    world.setTile(8, -8, treeTileIds.leaf);

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: 0 }
      }),
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options),
      hasOpenSkyAbove: (worldTileX, standingTileY) => world.hasOpenSkyAbove(worldTileX, standingTileY)
    });

    expect(result.spawnState?.position).toEqual({ x: 136, y: 0 });
    expect(result.spawnState?.facing).toBe('right');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(1);
  });

  it('treats a placed platform floor as valid support in the current deterministic spawn window', () => {
    const world = new TileWorld(0);
    setTiles(world, -48, -16, 48, 16, 0);
    world.setTile(8, 0, STARTER_PLATFORM_TILE_ID);

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: 0 }
      }),
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState?.position).toEqual({ x: 136, y: 0 });
    expect(result.spawnState?.facing).toBe('right');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(1);
  });

  it('falls back within the current deterministic window when the nearest candidate is crowded', () => {
    const world = createFlatSurfaceWorld();

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: 0 }
      }),
      activeBunnies: createCrowdedPassiveBunnyEntries([8]),
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState?.position).toEqual({ x: 120, y: 0 });
    expect(result.spawnState?.facing).toBe('right');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(1);
  });

  it('falls forward into a later deterministic window when only that window has a placed platform floor', () => {
    const world = new TileWorld(0);
    setTiles(world, -48, -16, 48, 16, 0);
    world.setTile(-8, 0, STARTER_PLATFORM_TILE_ID);

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: 0 }
      }),
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState?.position).toEqual({ x: -120, y: 0 });
    expect(result.spawnState?.facing).toBe('left');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(2);
  });

  it('falls forward into a later deterministic window when the current window is fully crowded', () => {
    const world = createFlatSurfaceWorld();

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: 0 }
      }),
      activeBunnies: createCrowdedPassiveBunnyEntries([6, 7, 8, 9, 10]),
      maxActiveBunnies: 6,
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState?.position).toEqual({ x: -120, y: 0 });
    expect(result.spawnState?.facing).toBe('left');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(2);
  });

  it('skips spawning when every deterministic window candidate is crowded', () => {
    const world = createFlatSurfaceWorld();

    const result = stepPassiveBunnySpawner({
      playerState: createPlayerState({
        position: { x: 8, y: 0 }
      }),
      activeBunnies: createCrowdedPassiveBunnyEntries([
        -16,
        -15,
        -14,
        -13,
        -12,
        -10,
        -9,
        -8,
        -7,
        -6,
        6,
        7,
        8,
        9,
        10,
        12,
        13,
        14,
        15,
        16
      ]),
      maxActiveBunnies: 21,
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState).toBeNull();
    expect(result.nextSpawnerState).toEqual({
      ticksUntilNextSpawn: DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS,
      nextWindowIndex: 1
    });
  });

  it('despawns bunnies outside the keep band while keeping nearby bunnies active', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });

    const result = stepPassiveBunnySpawner({
      playerState,
      activeBunnies: [
        {
          id: 1,
          state: createPassiveBunnyState({
            position: { x: 8 + 16 * 4, y: 0 }
          })
        },
        {
          id: 2,
          state: createPassiveBunnyState({
            position: { x: 8 + 16 * 32, y: 0 }
          })
        },
        {
          id: 3,
          state: createPassiveBunnyState({
            position: { x: 8, y: 16 * 16 }
          })
        }
      ],
      spawnerState: createPassiveBunnySpawnerState(DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS),
      findSpawnPoint: () => null,
      spawnIntervalTicks: DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS
    });

    expect(result.spawnState).toBeNull();
    expect(result.despawnIds).toEqual([2, 3]);
    expect(result.nextSpawnerState).toEqual({
      ticksUntilNextSpawn: DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS - 1,
      nextWindowIndex: 0
    });
  });

  it('allows a replacement spawn on the same fixed step after a far bunny is despawned', () => {
    const world = createFlatSurfaceWorld();
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });

    const result = stepPassiveBunnySpawner({
      playerState,
      activeBunnies: [
        {
          id: 11,
          state: createPassiveBunnyState({
            position: { x: 8 + 16 * 4, y: 0 }
          })
        },
        {
          id: 12,
          state: createPassiveBunnyState({
            position: { x: 8 + 16 * 32, y: 0 }
          })
        }
      ],
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.despawnIds).toEqual([12]);
    expect(result.spawnState?.position).toEqual({ x: 136, y: 0 });
    expect(result.nextSpawnerState).toEqual({
      ticksUntilNextSpawn: DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS,
      nextWindowIndex: 1
    });
  });
});
