import { TILE_SIZE } from './constants';
import type { PlayerSpawnPoint, PlayerSpawnSearchOptions } from './playerSpawn';
import type { PlayerState } from './playerState';
import {
  createHostileSlimeStateFromSpawn,
  DEFAULT_HOSTILE_SLIME_HEIGHT,
  DEFAULT_HOSTILE_SLIME_WIDTH,
  type HostileSlimeState
} from './hostileSlimeState';

export interface HostileSlimeSpawnerState {
  ticksUntilNextSpawn: number;
  nextWindowIndex: number;
}

export interface HostileSlimeSpawnWindowTarget {
  index: number;
  offsetTiles: number;
}

export interface ActiveHostileSlimeEntry<TId = number> {
  id: TId;
  state: Pick<HostileSlimeState, 'position'>;
}

export interface HostileSlimeSpawnSearch {
  (options: PlayerSpawnSearchOptions): PlayerSpawnPoint | null;
}

export interface StepHostileSlimeSpawnerOptions<TId = number> {
  playerState: Pick<PlayerState, 'position'>;
  activeSlimes?: ReadonlyArray<ActiveHostileSlimeEntry<TId>>;
  spawnerState?: HostileSlimeSpawnerState;
  findSpawnPoint: HostileSlimeSpawnSearch;
  maxActiveSlimes?: number;
  spawnIntervalTicks?: number;
  keepBandHorizontalTiles?: number;
  keepBandVerticalTiles?: number;
  windowOffsetsTiles?: ReadonlyArray<number>;
  windowHorizontalSearchTiles?: number;
  windowVerticalSearchTiles?: number;
}

export interface HostileSlimeSpawnStepResult<TId = number> {
  nextSpawnerState: HostileSlimeSpawnerState;
  spawnState: HostileSlimeState | null;
  despawnIds: TId[];
}

export const DEFAULT_HOSTILE_SLIME_MAX_ACTIVE = 2;
export const DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS = 120;
export const DEFAULT_HOSTILE_SLIME_KEEP_BAND_HORIZONTAL_TILES = 28;
export const DEFAULT_HOSTILE_SLIME_KEEP_BAND_VERTICAL_TILES = 14;
export const DEFAULT_HOSTILE_SLIME_WINDOW_OFFSETS_TILES = [12, -12, 18, -18] as const;
export const DEFAULT_HOSTILE_SLIME_WINDOW_HORIZONTAL_SEARCH_TILES = 3;
export const DEFAULT_HOSTILE_SLIME_WINDOW_VERTICAL_SEARCH_TILES = 8;

const expectPositiveInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return value;
};

const expectNonNegativeInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return value;
};

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const normalizeWindowOffsetsTiles = (windowOffsetsTiles: ReadonlyArray<number>): number[] => {
  if (windowOffsetsTiles.length === 0) {
    throw new Error('windowOffsetsTiles must contain at least one offset');
  }

  return windowOffsetsTiles.map((offset, index) => {
    if (!Number.isInteger(offset)) {
      throw new Error(`windowOffsetsTiles[${index}] must be an integer`);
    }
    return offset;
  });
};

export const resolveHostileSlimeSpawnWindowTarget = (
  nextWindowIndex: number,
  windowOffsetsTiles: ReadonlyArray<number> = DEFAULT_HOSTILE_SLIME_WINDOW_OFFSETS_TILES
): HostileSlimeSpawnWindowTarget => {
  const normalizedWindowOffsetsTiles = normalizeWindowOffsetsTiles(windowOffsetsTiles);
  const normalizedIndex =
    expectNonNegativeInteger(nextWindowIndex, 'nextWindowIndex') %
    normalizedWindowOffsetsTiles.length;

  return {
    index: normalizedIndex,
    offsetTiles: normalizedWindowOffsetsTiles[normalizedIndex] ?? 0
  };
};

const resolvePlayerTileX = (playerState: Pick<PlayerState, 'position'>): number =>
  Math.floor(expectFiniteNumber(playerState.position.x, 'playerState.position.x') / TILE_SIZE);

const resolvePlayerTileY = (playerState: Pick<PlayerState, 'position'>): number =>
  Math.floor(expectFiniteNumber(playerState.position.y, 'playerState.position.y') / TILE_SIZE);

const resolveFacingTowardsPlayer = (
  spawnPoint: PlayerSpawnPoint,
  playerState: Pick<PlayerState, 'position'>
): HostileSlimeState['facing'] => (spawnPoint.x <= playerState.position.x ? 'right' : 'left');

const isOutsideKeepBand = (
  playerState: Pick<PlayerState, 'position'>,
  slimeState: Pick<HostileSlimeState, 'position'>,
  keepBandHorizontalTiles: number,
  keepBandVerticalTiles: number
): boolean =>
  Math.abs(slimeState.position.x - playerState.position.x) > keepBandHorizontalTiles * TILE_SIZE ||
  Math.abs(slimeState.position.y - playerState.position.y) > keepBandVerticalTiles * TILE_SIZE;

const collectHostileSlimeDespawnIds = <TId>(
  playerState: Pick<PlayerState, 'position'>,
  activeSlimes: ReadonlyArray<ActiveHostileSlimeEntry<TId>>,
  keepBandHorizontalTiles: number,
  keepBandVerticalTiles: number
): TId[] => {
  const despawnIds: TId[] = [];
  for (const slime of activeSlimes) {
    if (
      isOutsideKeepBand(
        playerState,
        slime.state,
        keepBandHorizontalTiles,
        keepBandVerticalTiles
      )
    ) {
      despawnIds.push(slime.id);
    }
  }
  return despawnIds;
};

const resolveSpawnSearchOptions = (
  playerState: Pick<PlayerState, 'position'>,
  windowOffsetTiles: number,
  windowHorizontalSearchTiles: number,
  windowVerticalSearchTiles: number
): PlayerSpawnSearchOptions => ({
  width: DEFAULT_HOSTILE_SLIME_WIDTH,
  height: DEFAULT_HOSTILE_SLIME_HEIGHT,
  originTileX: resolvePlayerTileX(playerState) + windowOffsetTiles,
  originTileY: resolvePlayerTileY(playerState),
  maxHorizontalOffsetTiles: windowHorizontalSearchTiles,
  maxVerticalOffsetTiles: windowVerticalSearchTiles
});

const findNextHostileSlimeSpawnState = (
  playerState: Pick<PlayerState, 'position'>,
  nextWindowIndex: number,
  findSpawnPoint: HostileSlimeSpawnSearch,
  windowOffsetsTiles: ReadonlyArray<number>,
  windowHorizontalSearchTiles: number,
  windowVerticalSearchTiles: number
): Pick<HostileSlimeSpawnStepResult<never>, 'spawnState'> & Pick<HostileSlimeSpawnerState, 'nextWindowIndex'> => {
  const normalizedOffsets = normalizeWindowOffsetsTiles(windowOffsetsTiles);
  const startWindowIndex = nextWindowIndex % normalizedOffsets.length;

  for (let offsetIndex = 0; offsetIndex < normalizedOffsets.length; offsetIndex += 1) {
    const windowIndex = (startWindowIndex + offsetIndex) % normalizedOffsets.length;
    const spawnPoint = findSpawnPoint(
      resolveSpawnSearchOptions(
        playerState,
        normalizedOffsets[windowIndex] ?? 0,
        windowHorizontalSearchTiles,
        windowVerticalSearchTiles
      )
    );
    if (spawnPoint === null) {
      continue;
    }

    return {
      spawnState: createHostileSlimeStateFromSpawn(spawnPoint, {
        facing: resolveFacingTowardsPlayer(spawnPoint, playerState)
      }),
      nextWindowIndex: (windowIndex + 1) % normalizedOffsets.length
    };
  }

  return {
    spawnState: null,
    nextWindowIndex: (startWindowIndex + 1) % normalizedOffsets.length
  };
};

export const createHostileSlimeSpawnerState = (
  spawnIntervalTicks = DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS
): HostileSlimeSpawnerState => ({
  ticksUntilNextSpawn: expectPositiveInteger(spawnIntervalTicks, 'spawnIntervalTicks'),
  nextWindowIndex: 0
});

export const stepHostileSlimeSpawner = <TId = number>({
  playerState,
  activeSlimes = [],
  spawnerState = createHostileSlimeSpawnerState(),
  findSpawnPoint,
  maxActiveSlimes = DEFAULT_HOSTILE_SLIME_MAX_ACTIVE,
  spawnIntervalTicks = DEFAULT_HOSTILE_SLIME_SPAWN_INTERVAL_TICKS,
  keepBandHorizontalTiles = DEFAULT_HOSTILE_SLIME_KEEP_BAND_HORIZONTAL_TILES,
  keepBandVerticalTiles = DEFAULT_HOSTILE_SLIME_KEEP_BAND_VERTICAL_TILES,
  windowOffsetsTiles = DEFAULT_HOSTILE_SLIME_WINDOW_OFFSETS_TILES,
  windowHorizontalSearchTiles = DEFAULT_HOSTILE_SLIME_WINDOW_HORIZONTAL_SEARCH_TILES,
  windowVerticalSearchTiles = DEFAULT_HOSTILE_SLIME_WINDOW_VERTICAL_SEARCH_TILES
}: StepHostileSlimeSpawnerOptions<TId>): HostileSlimeSpawnStepResult<TId> => {
  const normalizedSpawnIntervalTicks = expectPositiveInteger(
    spawnIntervalTicks,
    'spawnIntervalTicks'
  );
  const normalizedKeepBandHorizontalTiles = expectPositiveInteger(
    keepBandHorizontalTiles,
    'keepBandHorizontalTiles'
  );
  const normalizedKeepBandVerticalTiles = expectPositiveInteger(
    keepBandVerticalTiles,
    'keepBandVerticalTiles'
  );
  const normalizedWindowHorizontalSearchTiles = expectNonNegativeInteger(
    windowHorizontalSearchTiles,
    'windowHorizontalSearchTiles'
  );
  const normalizedWindowVerticalSearchTiles = expectNonNegativeInteger(
    windowVerticalSearchTiles,
    'windowVerticalSearchTiles'
  );
  const normalizedMaxActiveSlimes = expectPositiveInteger(maxActiveSlimes, 'maxActiveSlimes');
  const normalizedTicksUntilNextSpawn = expectPositiveInteger(
    spawnerState.ticksUntilNextSpawn,
    'spawnerState.ticksUntilNextSpawn'
  );
  const normalizedNextWindowIndex = expectNonNegativeInteger(
    spawnerState.nextWindowIndex,
    'spawnerState.nextWindowIndex'
  );
  const normalizedWindowOffsetsTiles = normalizeWindowOffsetsTiles(windowOffsetsTiles);
  const despawnIds = collectHostileSlimeDespawnIds(
    playerState,
    activeSlimes,
    normalizedKeepBandHorizontalTiles,
    normalizedKeepBandVerticalTiles
  );
  const activeCountAfterDespawns = activeSlimes.length - despawnIds.length;
  const decrementedTicksUntilNextSpawn = normalizedTicksUntilNextSpawn - 1;
  if (decrementedTicksUntilNextSpawn > 0) {
    return {
      nextSpawnerState: {
        ticksUntilNextSpawn: decrementedTicksUntilNextSpawn,
        nextWindowIndex: normalizedNextWindowIndex % normalizedWindowOffsetsTiles.length
      },
      spawnState: null,
      despawnIds
    };
  }

  if (activeCountAfterDespawns >= normalizedMaxActiveSlimes) {
    return {
      nextSpawnerState: {
        ticksUntilNextSpawn: normalizedSpawnIntervalTicks,
        nextWindowIndex: normalizedNextWindowIndex % normalizedWindowOffsetsTiles.length
      },
      spawnState: null,
      despawnIds
    };
  }

  const spawnResult = findNextHostileSlimeSpawnState(
    playerState,
    normalizedNextWindowIndex,
    findSpawnPoint,
    normalizedWindowOffsetsTiles,
    normalizedWindowHorizontalSearchTiles,
    normalizedWindowVerticalSearchTiles
  );

  return {
    nextSpawnerState: {
      ticksUntilNextSpawn: normalizedSpawnIntervalTicks,
      nextWindowIndex: spawnResult.nextWindowIndex
    },
    spawnState: spawnResult.spawnState,
    despawnIds
  };
};
