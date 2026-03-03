import { getPlayerAabb, type PlayerState } from '../world/playerState';

export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT = 6;
export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT * STANDALONE_PLAYER_PLACEHOLDER_VERTEX_STRIDE_FLOATS;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE = 0;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A = 1;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B = 2;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_AIRBORNE = 3;
export const STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS = 120;

const STANDALONE_PLAYER_PLACEHOLDER_WALK_SPEED_THRESHOLD = 1;

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

export const getStandalonePlayerPlaceholderPoseIndex = (state: PlayerState, elapsedMs = 0): number => {
  if (!state.grounded) {
    return STANDALONE_PLAYER_PLACEHOLDER_POSE_AIRBORNE;
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
