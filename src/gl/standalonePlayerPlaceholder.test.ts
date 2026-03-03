import { describe, expect, it } from 'vitest';

import { createPlayerState } from '../world/playerState';
import {
  buildStandalonePlayerPlaceholderVertices,
  getStandalonePlayerPlaceholderFacingSign,
  getStandalonePlayerPlaceholderPoseIndex,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_AIRBORNE,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B,
  STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS
} from './standalonePlayerPlaceholder';

describe('standalonePlayerPlaceholder', () => {
  it('builds a quad from the standalone player world-space AABB', () => {
    const state = createPlayerState({
      position: { x: 10, y: 32 },
      size: { width: 12, height: 28 }
    });

    expect(Array.from(buildStandalonePlayerPlaceholderVertices(state))).toEqual([
      4,
      4,
      0,
      0,
      16,
      4,
      1,
      0,
      16,
      32,
      1,
      1,
      4,
      4,
      0,
      0,
      16,
      32,
      1,
      1,
      4,
      32,
      0,
      1
    ]);
  });

  it('maps player facing into a shader-friendly sign', () => {
    expect(getStandalonePlayerPlaceholderFacingSign(createPlayerState({ facing: 'right' }))).toBe(1);
    expect(getStandalonePlayerPlaceholderFacingSign(createPlayerState({ facing: 'left' }))).toBe(-1);
  });

  it('maps grounded idle and airborne state into placeholder poses', () => {
    expect(getStandalonePlayerPlaceholderPoseIndex(createPlayerState({ grounded: true }))).toBe(
      STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE
    );
    expect(getStandalonePlayerPlaceholderPoseIndex(createPlayerState({ grounded: false }))).toBe(
      STANDALONE_PLAYER_PLACEHOLDER_POSE_AIRBORNE
    );
  });

  it('alternates grounded walk placeholder poses while horizontal movement is active', () => {
    const state = createPlayerState({
      grounded: true,
      velocity: { x: 60, y: 0 }
    });

    expect(getStandalonePlayerPlaceholderPoseIndex(state, 0)).toBe(
      STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A
    );
    expect(
      getStandalonePlayerPlaceholderPoseIndex(state, STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS)
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B);
  });
});
