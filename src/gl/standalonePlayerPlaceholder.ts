import { getPlayerAabb, type PlayerCollisionContacts, type PlayerState } from '../world/playerState';

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

const STANDALONE_PLAYER_PLACEHOLDER_WALK_SPEED_THRESHOLD = 1;

export interface StandalonePlayerPlaceholderPoseOptions {
  elapsedMs?: number;
  wallContact?: PlayerCollisionContacts['wall'] | null;
  ceilingContact?: PlayerCollisionContacts['ceiling'] | null;
}

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

export const getStandalonePlayerPlaceholderPoseIndex = (
  state: PlayerState,
  options: StandalonePlayerPlaceholderPoseOptions = {}
): number => {
  const wallContact = options.wallContact ?? null;
  const ceilingContact = options.ceilingContact ?? null;
  const elapsedMs = options.elapsedMs ?? 0;

  if (!state.grounded) {
    if (ceilingContact !== null) {
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
