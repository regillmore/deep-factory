import { describe, expect, it } from 'vitest';

import { MAX_LIGHT_LEVEL } from '../world/constants';
import { createPlayerState } from '../world/playerState';
import { TileWorld } from '../world/world';
import {
  buildStandalonePlayerPlaceholderVertices,
  getStandalonePlayerPlaceholderFacingSign,
  getStandalonePlayerPlaceholderNearbyLightFactor,
  getStandalonePlayerPlaceholderNearbyLightLevel,
  getStandalonePlayerPlaceholderNearbyLightSample,
  getStandalonePlayerPlaceholderPoseLabel,
  getStandalonePlayerPlaceholderPoseLabelFromIndex,
  getStandalonePlayerPlaceholderRenderFacingSign,
  getStandalonePlayerPlaceholderPoseIndex,
  STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE,
  STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE,
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

  it('can build placeholder geometry from an overridden render position', () => {
    const state = createPlayerState({
      position: { x: 10, y: 32 },
      size: { width: 12, height: 28 }
    });

    expect(
      Array.from(
        buildStandalonePlayerPlaceholderVertices(state, {
          x: 40,
          y: 56
        })
      )
    ).toEqual([
      34,
      28,
      0,
      0,
      46,
      28,
      1,
      0,
      46,
      56,
      1,
      1,
      34,
      28,
      0,
      0,
      46,
      56,
      1,
      1,
      34,
      56,
      0,
      1
    ]);
  });

  it('maps player facing into a shader-friendly sign', () => {
    expect(getStandalonePlayerPlaceholderFacingSign(createPlayerState({ facing: 'right' }))).toBe(1);
    expect(getStandalonePlayerPlaceholderFacingSign(createPlayerState({ facing: 'left' }))).toBe(-1);
  });

  it('maps grounded idle, jump-rise, and fall state into placeholder poses', () => {
    expect(getStandalonePlayerPlaceholderPoseIndex(createPlayerState({ grounded: true }))).toBe(
      STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE
    );
    expect(
      getStandalonePlayerPlaceholderPoseIndex(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: -60 }
        }),
        {}
      )
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE);
    expect(
      getStandalonePlayerPlaceholderPoseIndex(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: 60 }
        }),
        {}
      )
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL);
    expect(
      getStandalonePlayerPlaceholderPoseIndex(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: 0 }
        }),
        {}
      )
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL);
  });

  it('maps airborne wall contact into a dedicated wall-slide pose', () => {
    expect(
      getStandalonePlayerPlaceholderPoseIndex(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: -60 }
        }),
        {
          wallContact: { tileX: 1, tileY: -1, tileId: 3, side: 'right' }
        }
      )
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE);
  });

  it('mirrors the wall-slide placeholder away from the blocking wall side', () => {
    expect(
      getStandalonePlayerPlaceholderRenderFacingSign(
        createPlayerState({ facing: 'right' }),
        STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE,
        { tileX: 1, tileY: -1, tileId: 3, side: 'right' }
      )
    ).toBe(-1);

    expect(
      getStandalonePlayerPlaceholderRenderFacingSign(
        createPlayerState({ facing: 'left' }),
        STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE,
        { tileX: -1, tileY: -1, tileId: 3, side: 'left' }
      )
    ).toBe(1);
  });

  it('maps airborne ceiling contact into a dedicated ceiling-bonk pose', () => {
    expect(
      getStandalonePlayerPlaceholderPoseIndex(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: 0 }
        }),
        {
          wallContact: { tileX: 1, tileY: -1, tileId: 3, side: 'right' },
          ceilingContact: { tileX: 0, tileY: -2, tileId: 4 }
        }
      )
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK);
  });

  it('can keep the ceiling-bonk pose latched briefly after contact clears', () => {
    expect(
      getStandalonePlayerPlaceholderPoseIndex(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: 60 }
        }),
        {
          ceilingBonkActive: true,
          elapsedMs: STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS - 1
        }
      )
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK);

    expect(
      getStandalonePlayerPlaceholderPoseIndex(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: 60 }
        }),
        {}
      )
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL);
  });

  it('alternates grounded walk placeholder poses while horizontal movement is active', () => {
    const state = createPlayerState({
      grounded: true,
      velocity: { x: 60, y: 0 }
    });

    expect(getStandalonePlayerPlaceholderPoseIndex(state, { elapsedMs: 0 })).toBe(
      STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A
    );
    expect(
      getStandalonePlayerPlaceholderPoseIndex(state, {
        elapsedMs: STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS
      })
    ).toBe(STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B);
  });

  it('maps pose indices into stable debug labels', () => {
    expect(
      getStandalonePlayerPlaceholderPoseLabelFromIndex(STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_IDLE)
    ).toBe('grounded-idle');
    expect(
      getStandalonePlayerPlaceholderPoseLabelFromIndex(STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_A)
    ).toBe('grounded-walk-a');
    expect(
      getStandalonePlayerPlaceholderPoseLabelFromIndex(STANDALONE_PLAYER_PLACEHOLDER_POSE_GROUNDED_WALK_B)
    ).toBe('grounded-walk-b');
    expect(
      getStandalonePlayerPlaceholderPoseLabelFromIndex(STANDALONE_PLAYER_PLACEHOLDER_POSE_JUMP_RISE)
    ).toBe('jump-rise');
    expect(getStandalonePlayerPlaceholderPoseLabelFromIndex(STANDALONE_PLAYER_PLACEHOLDER_POSE_FALL)).toBe(
      'fall'
    );
    expect(
      getStandalonePlayerPlaceholderPoseLabelFromIndex(STANDALONE_PLAYER_PLACEHOLDER_POSE_WALL_SLIDE)
    ).toBe('wall-slide');
    expect(
      getStandalonePlayerPlaceholderPoseLabelFromIndex(STANDALONE_PLAYER_PLACEHOLDER_POSE_CEILING_BONK)
    ).toBe('ceiling-bonk');
  });

  it('derives a pose label from the same state and renderer options used for placeholder animation', () => {
    expect(
      getStandalonePlayerPlaceholderPoseLabel(
        createPlayerState({
          grounded: false,
          velocity: { x: 0, y: 60 }
        }),
        {
          ceilingBonkActive: true,
          elapsedMs: STANDALONE_PLAYER_PLACEHOLDER_CEILING_BONK_HOLD_DURATION_MS - 1
        }
      )
    ).toBe('ceiling-bonk');

    expect(
      getStandalonePlayerPlaceholderPoseLabel(
        createPlayerState({
          grounded: true,
          velocity: { x: 60, y: 0 }
        }),
        {
          elapsedMs: STANDALONE_PLAYER_PLACEHOLDER_WALK_FRAME_DURATION_MS
        }
      )
    ).toBe('grounded-walk-b');
  });

  it('samples the brightest nearby light tile around the player AABB', () => {
    const world = new TileWorld(0);
    const state = createPlayerState({
      position: { x: 24, y: 32 },
      size: { width: 12, height: 28 }
    });
    expect(world.setLightLevel(1, 0, 5)).toBe(true);
    expect(world.setLightLevel(2, 2, 11)).toBe(true);

    expect(getStandalonePlayerPlaceholderNearbyLightSample(world, state)).toEqual({
      level: 11,
      sourceTile: { x: 2, y: 2 }
    });
    expect(getStandalonePlayerPlaceholderNearbyLightLevel(world, state)).toBe(11);
  });

  it('normalizes nearby player light to the same 0..1 lighting scale as world tiles', () => {
    const world = new TileWorld(0);
    const state = createPlayerState({
      position: { x: 24, y: 32 },
      size: { width: 12, height: 28 }
    });
    expect(world.setLightLevel(2, 2, MAX_LIGHT_LEVEL)).toBe(true);

    expect(getStandalonePlayerPlaceholderNearbyLightFactor(world, state)).toBe(1);
  });
});
