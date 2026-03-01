import { getPlayerAabb, type PlayerState } from '../world/playerState';

export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT = 6;
export const STANDALONE_PLAYER_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  STANDALONE_PLAYER_PLACEHOLDER_VERTEX_COUNT * STANDALONE_PLAYER_PLACEHOLDER_VERTEX_STRIDE_FLOATS;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED = 0;
export const STANDALONE_PLAYER_PLACEHOLDER_POSE_AIRBORNE = 1;

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

export const getStandalonePlayerPlaceholderPoseIndex = (state: PlayerState): number =>
  state.grounded ? STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED : STANDALONE_PLAYER_PLACEHOLDER_POSE_AIRBORNE;
