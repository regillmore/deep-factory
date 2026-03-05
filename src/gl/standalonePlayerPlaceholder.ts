import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import { getPlayerAabb, type PlayerCollisionContacts, type PlayerState } from '../world/playerState';
import type { TileWorld } from '../world/world';

export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT = 6;
export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT * STANDALONE_PLAYER_PLACEHOLDER_VERTEX_STRIDE_FLOATS;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE = 0;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A = 1;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B = 2;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE = 3;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL = 4;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE = 5;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK = 6;
export const STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS = 120;
export const STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS = 96;

const STANDALONE_PLAYER_PLACEHOLDER_WALK_SPEED_THRESHOLD = 1;
const STANDALONE_PLAYER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;

interface TileRange {
  min: number;
  max: number;
}

const clampStandalonePlayerPlaceholderLightLevel = (lightLevel: number): number =>
  Math.max(0, Math.min(MAX_LIGHT_LEVEL, Math.floor(lightLevel)));

const getOverlappingTileRange = (min: number, max: number): TileRange | null => {
  if (max <= min) {
    return null;
  }

  return {
    min: Math.floor(min / TILE_SIZE),
    max: Math.ceil(max / TILE_SIZE) - 1
  };
};

export interface StandalonePlayerPlaceholderPoseOptions {
  elapsedMs?: number;
  wallContact?: PlayerCollisionContacts['wall'] | null;
  ceilingContact?: PlayerCollisionContacts['ceiling'] | null;
  ceilingBonkActive?: boolean;
}

export type StandalonePlayerPlaceholderPoseLabel =
  | 'grounded-idle'
  | 'grounded-walk-a'
  | 'grounded-walk-b'
  | 'jump-rise'
  | 'fall'
  | 'wall-slide'
  | 'ceiling-bonk';

export const buildStandalonePlayerPlaceholderVertices = (state: PlayerState): Float32Array => {
  const aabb = getPlayerAabb(state);

  return new Float32Array([
    aabb.minX,
    aabb.minY,
    0,
    0,
    aabb.maxX,
    aabb.minY,
    1,
    0,
    aabb.maxX,
    aabb.maxY,
    1,
    1,
    aabb.minX,
    aabb.minY,
    0,
    0,
    aabb.maxX,
    aabb.maxY,
    1,
    1,
    aabb.minX,
    aabb.maxY,
    0,
    1
  ]);
};

export const getStandalonePlayerPlaceholderFacingSign = (state: PlayerState): number =>
  state.facing === 'left' ? -1 : 1;

const getStandalonePlayerPlaceholderWallSlideFacingSign = (
  wallContact: NonNullable<PlayerCollisionContacts['wall']>
): number => (wallContact.side === 'left' ? 1 : -1);

export const getStandalonePlayerPlaceholderPoseIndex = (
  state: PlayerState,
  options: StandalonePlayerPlaceholderPoseOptions = {}
): number => {
  const wallContact = options.wallContact ?? null;
  const ceilingContact = options.ceilingContact ?? null;
  const ceilingBonkActive = options.ceilingBonkActive ?? ceilingContact !== null;
  const elapsedMs = options.elapsedMs ?? 0;

  if (!state.grounded) {
    if (ceilingBonkActive) {
      return STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK;
    }

    if (wallContact !== null) {
      return STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE;
    }

    return state.velocity.y < 0
      ? STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE
      : STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL;
  }

  if (Math.abs(state.velocity.x) < STANDALONE_PLAYER_PLACEHOLDER_WALK_SPEED_THRESHOLD) {
    return STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE;
  }

  const normalizedElapsedMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const walkFrameIndex =
    Math.floor(normalizedElapsedMs / STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS) % 2;
  return walkFrameIndex === 0
    ? STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A
    : STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B;
};

export const getStandalonePlayerPlaceholderPoseLabelFromIndex = (
  poseIndex: number
): StandalonePlayerPlaceholderPoseLabel => {
  if (poseIndex === STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE) {
    return 'grounded-idle';
  }
  if (poseIndex === STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A) {
    return 'grounded-walk-a';
  }
  if (poseIndex === STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B) {
    return 'grounded-walk-b';
  }
  if (poseIndex === STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE) {
    return 'jump-rise';
  }
  if (poseIndex === STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL) {
    return 'fall';
  }
  if (poseIndex === STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE) {
    return 'wall-slide';
  }
  return 'ceiling-bonk';
};

export const getStandalonePlayerPlaceholderPoseLabel = (
  state: PlayerState,
  options: StandalonePlayerPlaceholderPoseOptions = {}
): StandalonePlayerPlaceholderPoseLabel =>
  getStandalonePlayerPlaceholderPoseLabelFromIndex(getStandalonePlayerPlaceholderPoseIndex(state, options));

export const getStandalonePlayerPlaceholderRenderFacingSign = (
  state: PlayerState,
  poseIndex: number,
  wallContact: PlayerCollisionContacts['wall'] | null = null
): number => {
  if (poseIndex === STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE && wallContact !== null) {
    return getStandalonePlayerPlaceholderWallSlideFacingSign(wallContact);
  }

  return getStandalonePlayerPlaceholderFacingSign(state);
};

export const getStandalonePlayerPlaceholderNearbyLightLevel = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: PlayerState
): number => {
  const aabb = getPlayerAabb(state);
  const xRange = getOverlappingTileRange(aabb.minX, aabb.maxX);
  const yRange = getOverlappingTileRange(aabb.minY, aabb.maxY);
  if (!xRange || !yRange) {
    return 0;
  }

  let maxNearbyLightLevel = 0;
  for (
    let tileY = yRange.min - STANDALONE_PLAYER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + STANDALONE_PLAYER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - STANDALONE_PLAYER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + STANDALONE_PLAYER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      maxNearbyLightLevel = Math.max(maxNearbyLightLevel, world.getLightLevel(tileX, tileY));
      if (maxNearbyLightLevel >= MAX_LIGHT_LEVEL) {
        return MAX_LIGHT_LEVEL;
      }
    }
  }

  return clampStandalonePlayerPlaceholderLightLevel(maxNearbyLightLevel);
};

export const getStandalonePlayerPlaceholderNearbyLightFactor = (
  world: Pick<TileWorld, 'getLightLevel'>,
  state: PlayerState
): number => getStandalonePlayerPlaceholderNearbyLightLevel(world, state) / MAX_LIGHT_LEVEL;
