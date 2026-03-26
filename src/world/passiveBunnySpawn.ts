import { TILE_SIZE } from './constants';
import type { WorldAabb } from './collision';
import type { PlayerSpawnPoint, PlayerSpawnSearchOptions } from './playerSpawn';
import type { PlayerState } from './playerState';
import {
  createPassiveBunnyStateFromSpawn,
  DEFAULT_PASSIVE_BUNNY_HEIGHT,
  DEFAULT_PASSIVE_BUNNY_WIDTH,
  getPassiveBunnyAabb,
  type PassiveBunnyState
} from './passiveBunnyState';

export interface PassiveBunnySpawnerState {
  ticksUntilNextSpawn: number;
  nextWindowIndex: number;
}

export interface PassiveBunnySpawnWindowTarget {
  index: number;
  offsetTiles: number;
}

export interface ActivePassiveBunnyEntry<TId = number> {
  id: TId;
  state: Pick<PassiveBunnyState, 'position' | 'size'>;
}

export interface PassiveBunnySpawnSearch {
  (options: PlayerSpawnSearchOptions): PlayerSpawnPoint | null;
}

export interface PassiveBunnyOpenSkyCheck {
  (worldTileX: number, standingTileY: number): boolean;
}

export interface StepPassiveBunnySpawnerOptions<TId = number> {
  playerState: Pick<PlayerState, 'position'>;
  activeBunnies?: ReadonlyArray<ActivePassiveBunnyEntry<TId>>;
  spawnerState?: PassiveBunnySpawnerState;
  findSpawnPoint: PassiveBunnySpawnSearch;
  hasOpenSkyAbove?: PassiveBunnyOpenSkyCheck;
  maxActiveBunnies?: number;
  spawnIntervalTicks?: number;
  keepBandHorizontalTiles?: number;
  keepBandVerticalTiles?: number;
  windowOffsetsTiles?: ReadonlyArray<number>;
  windowHorizontalSearchTiles?: number;
  windowVerticalSearchTiles?: number;
}

export interface PassiveBunnySpawnStepResult<TId = number> {
  nextSpawnerState: PassiveBunnySpawnerState;
  spawnState: PassiveBunnyState | null;
  despawnIds: TId[];
}

export const DEFAULT_PASSIVE_BUNNY_MAX_ACTIVE = 2;
export const DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS = 360;
export const DEFAULT_PASSIVE_BUNNY_KEEP_BAND_HORIZONTAL_TILES = 24;
export const DEFAULT_PASSIVE_BUNNY_KEEP_BAND_VERTICAL_TILES = 12;
export const DEFAULT_PASSIVE_BUNNY_WINDOW_OFFSETS_TILES = [8, -8, 14, -14] as const;
export const DEFAULT_PASSIVE_BUNNY_WINDOW_HORIZONTAL_SEARCH_TILES = 2;
export const DEFAULT_PASSIVE_BUNNY_WINDOW_VERTICAL_SEARCH_TILES = 6;

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

export const resolvePassiveBunnySpawnWindowTarget = (
  nextWindowIndex: number,
  windowOffsetsTiles: ReadonlyArray<number> = DEFAULT_PASSIVE_BUNNY_WINDOW_OFFSETS_TILES
): PassiveBunnySpawnWindowTarget => {
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

const resolveFacingAwayFromPlayer = (
  spawnPoint: PlayerSpawnPoint,
  playerState: Pick<PlayerState, 'position'>
): PassiveBunnyState['facing'] => (spawnPoint.x <= playerState.position.x ? 'left' : 'right');

const doAabbsOverlap = (left: WorldAabb, right: WorldAabb): boolean =>
  left.minX < right.maxX &&
  left.maxX > right.minX &&
  left.minY < right.maxY &&
  left.maxY > right.minY;

const isOutsideKeepBand = (
  playerState: Pick<PlayerState, 'position'>,
  bunnyState: Pick<PassiveBunnyState, 'position'>,
  keepBandHorizontalTiles: number,
  keepBandVerticalTiles: number
): boolean =>
  Math.abs(bunnyState.position.x - playerState.position.x) > keepBandHorizontalTiles * TILE_SIZE ||
  Math.abs(bunnyState.position.y - playerState.position.y) > keepBandVerticalTiles * TILE_SIZE;

const collectPassiveBunnyDespawnIds = <TId>(
  playerState: Pick<PlayerState, 'position'>,
  activeBunnies: ReadonlyArray<ActivePassiveBunnyEntry<TId>>,
  keepBandHorizontalTiles: number,
  keepBandVerticalTiles: number
): TId[] => {
  const despawnIds: TId[] = [];
  for (const bunny of activeBunnies) {
    if (
      isOutsideKeepBand(
        playerState,
        bunny.state,
        keepBandHorizontalTiles,
        keepBandVerticalTiles
      )
    ) {
      despawnIds.push(bunny.id);
    }
  }
  return despawnIds;
};

const resolveSpawnSearchOptions = (
  playerState: Pick<PlayerState, 'position'>,
  windowOffsetTiles: number,
  windowHorizontalSearchTiles: number,
  windowVerticalSearchTiles: number,
  activeBunnyAabbs: ReadonlyArray<WorldAabb>,
  hasOpenSkyAbove: PassiveBunnyOpenSkyCheck | undefined
): PlayerSpawnSearchOptions => ({
  width: DEFAULT_PASSIVE_BUNNY_WIDTH,
  height: DEFAULT_PASSIVE_BUNNY_HEIGHT,
  originTileX: resolvePlayerTileX(playerState) + windowOffsetTiles,
  maxHorizontalOffsetTiles: windowHorizontalSearchTiles,
  maxVerticalOffsetTiles: windowVerticalSearchTiles,
  allowOneWayPlatformSupport: true,
  isCandidateSpawnAllowed:
    activeBunnyAabbs.length === 0 && hasOpenSkyAbove === undefined
      ? undefined
      : (spawnPoint) => {
          if (
            activeBunnyAabbs.some((activeBunnyAabb) =>
              doAabbsOverlap(spawnPoint.aabb, activeBunnyAabb)
            )
          ) {
            return false;
          }

          return hasOpenSkyAbove === undefined
            ? true
            : hasOpenSkyAbove(spawnPoint.anchorTileX, spawnPoint.standingTileY);
        }
});

const findNextPassiveBunnySpawnState = <TId>(
  playerState: Pick<PlayerState, 'position'>,
  nextWindowIndex: number,
  activeBunnies: ReadonlyArray<ActivePassiveBunnyEntry<TId>>,
  findSpawnPoint: PassiveBunnySpawnSearch,
  hasOpenSkyAbove: PassiveBunnyOpenSkyCheck | undefined,
  windowOffsetsTiles: ReadonlyArray<number>,
  windowHorizontalSearchTiles: number,
  windowVerticalSearchTiles: number
): Pick<PassiveBunnySpawnStepResult<never>, 'spawnState'> &
  Pick<PassiveBunnySpawnerState, 'nextWindowIndex'> => {
  const normalizedOffsets = normalizeWindowOffsetsTiles(windowOffsetsTiles);
  const startWindowIndex = nextWindowIndex % normalizedOffsets.length;
  const activeBunnyAabbs = activeBunnies.map((activeBunny) => getPassiveBunnyAabb(activeBunny.state));

  for (let offsetIndex = 0; offsetIndex < normalizedOffsets.length; offsetIndex += 1) {
    const windowIndex = (startWindowIndex + offsetIndex) % normalizedOffsets.length;
    const spawnPoint = findSpawnPoint(
      resolveSpawnSearchOptions(
        playerState,
        normalizedOffsets[windowIndex] ?? 0,
        windowHorizontalSearchTiles,
        windowVerticalSearchTiles,
        activeBunnyAabbs,
        hasOpenSkyAbove
      )
    );
    if (spawnPoint === null) {
      continue;
    }

    return {
      spawnState: createPassiveBunnyStateFromSpawn(spawnPoint, {
        facing: resolveFacingAwayFromPlayer(spawnPoint, playerState)
      }),
      nextWindowIndex: (windowIndex + 1) % normalizedOffsets.length
    };
  }

  return {
    spawnState: null,
    nextWindowIndex: (startWindowIndex + 1) % normalizedOffsets.length
  };
};

export const createPassiveBunnySpawnerState = (
  spawnIntervalTicks = DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS
): PassiveBunnySpawnerState => ({
  ticksUntilNextSpawn: expectPositiveInteger(spawnIntervalTicks, 'spawnIntervalTicks'),
  nextWindowIndex: 0
});

export const stepPassiveBunnySpawner = <TId = number>({
  playerState,
  activeBunnies = [],
  spawnerState = createPassiveBunnySpawnerState(),
  findSpawnPoint,
  hasOpenSkyAbove,
  maxActiveBunnies = DEFAULT_PASSIVE_BUNNY_MAX_ACTIVE,
  spawnIntervalTicks = DEFAULT_PASSIVE_BUNNY_SPAWN_INTERVAL_TICKS,
  keepBandHorizontalTiles = DEFAULT_PASSIVE_BUNNY_KEEP_BAND_HORIZONTAL_TILES,
  keepBandVerticalTiles = DEFAULT_PASSIVE_BUNNY_KEEP_BAND_VERTICAL_TILES,
  windowOffsetsTiles = DEFAULT_PASSIVE_BUNNY_WINDOW_OFFSETS_TILES,
  windowHorizontalSearchTiles = DEFAULT_PASSIVE_BUNNY_WINDOW_HORIZONTAL_SEARCH_TILES,
  windowVerticalSearchTiles = DEFAULT_PASSIVE_BUNNY_WINDOW_VERTICAL_SEARCH_TILES
}: StepPassiveBunnySpawnerOptions<TId>): PassiveBunnySpawnStepResult<TId> => {
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
  const normalizedMaxActiveBunnies = expectPositiveInteger(
    maxActiveBunnies,
    'maxActiveBunnies'
  );
  const normalizedTicksUntilNextSpawn = expectPositiveInteger(
    spawnerState.ticksUntilNextSpawn,
    'spawnerState.ticksUntilNextSpawn'
  );
  const normalizedNextWindowIndex = expectNonNegativeInteger(
    spawnerState.nextWindowIndex,
    'spawnerState.nextWindowIndex'
  );
  const normalizedWindowOffsetsTiles = normalizeWindowOffsetsTiles(windowOffsetsTiles);
  const despawnIds = collectPassiveBunnyDespawnIds(
    playerState,
    activeBunnies,
    normalizedKeepBandHorizontalTiles,
    normalizedKeepBandVerticalTiles
  );
  const activeCountAfterDespawns = activeBunnies.length - despawnIds.length;
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

  if (activeCountAfterDespawns >= normalizedMaxActiveBunnies) {
    return {
      nextSpawnerState: {
        ticksUntilNextSpawn: normalizedSpawnIntervalTicks,
        nextWindowIndex: normalizedNextWindowIndex % normalizedWindowOffsetsTiles.length
      },
      spawnState: null,
      despawnIds
    };
  }

  const spawnResult = findNextPassiveBunnySpawnState(
    playerState,
    normalizedNextWindowIndex,
    activeBunnies,
    findSpawnPoint,
    hasOpenSkyAbove,
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
