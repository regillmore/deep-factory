import { describe, expect, it } from 'vitest';

import { createPlayerState } from '../world/playerState';
import {
  buildStandalonePlayerPlaceholderVertices,
  getStandalonePlayerPlaceholderFacingSign
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
});
