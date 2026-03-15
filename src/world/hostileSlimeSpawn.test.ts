import { describe, expect, it } from 'vitest';

import { findPlayerSpawnPoint } from './playerSpawn';
import { createPlayerState } from './playerState';
import { TileWorld } from './world';
import {
  createHostileSlimeSpawnerState,
  DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS,
  DEFAULT_HOSTILE_SLIME_WINDOW_OFFSETS_TILES,
  resolveHostileSlimeSpawnWindowTarget,
  stepHostileSlimeSpawner
} from './hostileSlimeSpawn';
import {
  createHostileSlimeState,
  DEFAULT_HOSTILE_SLIME_HEIGHT,
  DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
  DEFAULT_HOSTILE_SLIME_WIDTH
} from './hostileSlimeState';

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

describe('hostileSlimeSpawn', () => {
  it('normalizes the next deterministic spawn-window index into its tile-offset target', () => {
    expect(
      resolveHostileSlimeSpawnWindowTarget(DEFAULT_HOSTILE_SLIME_WINDOW_OFFSETS_TILES.length + 2)
    ).toEqual({
      index: 2,
      offsetTiles: DEFAULT_HOSTILE_SLIME_WINDOW_OFFSETS_TILES[2]
    });

    expect(resolveHostileSlimeSpawnWindowTarget(5, [9, -4] as const)).toEqual({
      index: 1,
      offsetTiles: -4
    });
  });

  it('spawns from the next deterministic window once the fixed-step cooldown elapses', () => {
    const world = createFlatSurfaceWorld();
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });
    let spawnerState = createHostileSlimeSpawnerState(2);

    const firstStep = stepHostileSlimeSpawner({
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

    const secondStep = stepHostileSlimeSpawner({
      playerState,
      spawnerState,
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options),
      spawnIntervalTicks: 2
    });

    expect(secondStep.spawnState).toEqual({
      position: { x: 200, y: 0 },
      velocity: { x: 0, y: 0 },
      size: {
        width: DEFAULT_HOSTILE_SLIME_WIDTH,
        height: DEFAULT_HOSTILE_SLIME_HEIGHT
      },
      grounded: true,
      facing: 'left',
      hopCooldownTicksRemaining: DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
      launchKind: null
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

    setTiles(world, 9, -12, 15, 8, 3);

    const result = stepHostileSlimeSpawner({
      playerState,
      spawnerState: {
        ticksUntilNextSpawn: 1,
        nextWindowIndex: 0
      },
      findSpawnPoint: (options) => findPlayerSpawnPoint(world, options)
    });

    expect(result.spawnState?.position).toEqual({ x: -184, y: 0 });
    expect(result.spawnState?.facing).toBe('right');
    expect(result.nextSpawnerState.nextWindowIndex).toBe(2);
  });

  it('despawns slimes outside the keep band while keeping nearby slimes active', () => {
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });

    const result = stepHostileSlimeSpawner({
      playerState,
      activeSlimes: [
        {
          id: 1,
          state: createHostileSlimeState({
            position: { x: 8 + 16 * 6, y: 0 }
          })
        },
        {
          id: 2,
          state: createHostileSlimeState({
            position: { x: 8 + 16 * 40, y: 0 }
          })
        },
        {
          id: 3,
          state: createHostileSlimeState({
            position: { x: 8, y: 16 * 20 }
          })
        }
      ],
      spawnerState: createHostileSlimeSpawnerState(DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS),
      findSpawnPoint: () => null,
      spawnIntervalTicks: DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS
    });

    expect(result.spawnState).toBeNull();
    expect(result.despawnIds).toEqual([2, 3]);
    expect(result.nextSpawnerState).toEqual({
      ticksUntilNextSpawn: DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS - 1,
      nextWindowIndex: 0
    });
  });

  it('allows a replacement spawn on the same fixed step after a far slime is despawned', () => {
    const world = createFlatSurfaceWorld();
    const playerState = createPlayerState({
      position: { x: 8, y: 0 }
    });

    const result = stepHostileSlimeSpawner({
      playerState,
      activeSlimes: [
        {
          id: 11,
          state: createHostileSlimeState({
            position: { x: 8 + 16 * 6, y: 0 }
          })
        },
        {
          id: 12,
          state: createHostileSlimeState({
            position: { x: 8 + 16 * 40, y: 0 }
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
    expect(result.spawnState?.position).toEqual({ x: 200, y: 0 });
    expect(result.nextSpawnerState).toEqual({
      ticksUntilNextSpawn: DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS,
      nextWindowIndex: 1
    });
  });
});
