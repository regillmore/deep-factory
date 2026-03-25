import type { WorldAabb } from './collision';
import { evaluatePlayerHotbarTilePlacementRange } from './playerHotbarPlacementRange';
import {
  findPlayerSpawnPoint,
  type PlayerSpawnPoint,
  type PlayerSpawnWorldView
} from './playerSpawn';
import {
  createPassiveBunnyStateFromSpawn,
  DEFAULT_PASSIVE_BUNNY_HEIGHT,
  DEFAULT_PASSIVE_BUNNY_WIDTH,
  getPassiveBunnyAabb,
  type PassiveBunnyState
} from './passiveBunnyState';
import type { PlayerState } from './playerState';

export interface PassiveBunnyReleaseEvaluation {
  placementRangeWithinReach: boolean;
  spawnState: PassiveBunnyState | null;
  landingTile: PassiveBunnyReleaseLandingTile | null;
  canRelease: boolean;
}

export interface PassiveBunnyReleaseLandingTile {
  tileX: number;
  tileY: number;
}

export type PassiveBunnyReleaseActiveBunny = Pick<PassiveBunnyState, 'position' | 'size'>;

export interface EvaluatePassiveBunnyReleaseOptions {
  horizontalSearchTiles?: number;
  verticalSearchTiles?: number;
  maxPlacementDistance?: number;
  activeBunnies?: ReadonlyArray<PassiveBunnyReleaseActiveBunny>;
}

export const DEFAULT_PASSIVE_BUNNY_RELEASE_HORIZONTAL_SEARCH_TILES = 2;
export const DEFAULT_PASSIVE_BUNNY_RELEASE_VERTICAL_SEARCH_TILES = 4;

const resolvePassiveBunnyReleaseFacing = (
  spawnState: Pick<PassiveBunnyState, 'position'>,
  playerState: Pick<PlayerState, 'position'>
): PassiveBunnyState['facing'] =>
  spawnState.position.x <= playerState.position.x ? 'left' : 'right';

const resolvePassiveBunnyReleaseLandingTile = (
  spawnPoint: Pick<PlayerSpawnPoint, 'anchorTileX' | 'standingTileY'>
): PassiveBunnyReleaseLandingTile => ({
  tileX: spawnPoint.anchorTileX,
  tileY: spawnPoint.standingTileY - 1
});

const doAabbsOverlap = (left: WorldAabb, right: WorldAabb): boolean =>
  left.minX < right.maxX &&
  left.maxX > right.minX &&
  left.minY < right.maxY &&
  left.maxY > right.minY;

export const evaluatePassiveBunnyRelease = (
  world: PlayerSpawnWorldView,
  playerState: Pick<PlayerState, 'position' | 'size'>,
  worldTileX: number,
  worldTileY: number,
  options: EvaluatePassiveBunnyReleaseOptions = {}
): PassiveBunnyReleaseEvaluation => {
  const activeBunnyAabbs = (options.activeBunnies ?? []).map((activeBunny) =>
    getPassiveBunnyAabb(activeBunny)
  );
  const placementRange = evaluatePlayerHotbarTilePlacementRange(
    playerState,
    worldTileX,
    worldTileY,
    options.maxPlacementDistance
  );
  if (!placementRange.withinRange) {
    return {
      placementRangeWithinReach: false,
      spawnState: null,
      landingTile: null,
      canRelease: false
    };
  }

  const spawnPoint = findPlayerSpawnPoint(world, {
    width: DEFAULT_PASSIVE_BUNNY_WIDTH,
    height: DEFAULT_PASSIVE_BUNNY_HEIGHT,
    originTileX: worldTileX,
    originTileY: worldTileY,
    allowOneWayPlatformSupport: true,
    maxHorizontalOffsetTiles:
      options.horizontalSearchTiles ?? DEFAULT_PASSIVE_BUNNY_RELEASE_HORIZONTAL_SEARCH_TILES,
    maxVerticalOffsetTiles:
      options.verticalSearchTiles ?? DEFAULT_PASSIVE_BUNNY_RELEASE_VERTICAL_SEARCH_TILES,
    isCandidateSpawnAllowed:
      activeBunnyAabbs.length === 0
        ? undefined
        : (spawnPoint) =>
            !activeBunnyAabbs.some((activeBunnyAabb) =>
              doAabbsOverlap(spawnPoint.aabb, activeBunnyAabb)
            )
  });
  if (spawnPoint === null) {
    return {
      placementRangeWithinReach: true,
      spawnState: null,
      landingTile: null,
      canRelease: false
    };
  }

  const spawnState = createPassiveBunnyStateFromSpawn(spawnPoint, {
    facing: resolvePassiveBunnyReleaseFacing(
      {
        position: {
          x: spawnPoint.x,
          y: spawnPoint.y
        }
      },
      playerState
    )
  });

  return {
    placementRangeWithinReach: true,
    spawnState,
    landingTile: resolvePassiveBunnyReleaseLandingTile(spawnPoint),
    canRelease: true
  };
};
