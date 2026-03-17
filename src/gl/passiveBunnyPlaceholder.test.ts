import { describe, expect, it } from 'vitest';

import { createPassiveBunnyState } from '../world/passiveBunnyState';
import { TileWorld } from '../world/world';
import {
  buildPassiveBunnyPlaceholderVertices,
  getPassiveBunnyPlaceholderFacingSign,
  getPassiveBunnyPlaceholderNearbyLightSample
} from './passiveBunnyPlaceholder';

describe('passiveBunnyPlaceholder', () => {
  it('builds a quad from the passive bunny world-space AABB', () => {
    const state = createPassiveBunnyState({
      position: { x: 40, y: 32 }
    });

    expect(Array.from(buildPassiveBunnyPlaceholderVertices(state))).toEqual([
      33,
      14,
      0,
      0,
      47,
      14,
      1,
      0,
      47,
      32,
      1,
      1,
      33,
      14,
      0,
      0,
      47,
      32,
      1,
      1,
      33,
      32,
      0,
      1
    ]);
  });

  it('can build bunny placeholder geometry from an overridden render position', () => {
    const state = createPassiveBunnyState({
      position: { x: 40, y: 32 }
    });

    expect(
      Array.from(
        buildPassiveBunnyPlaceholderVertices(state, {
          x: -24,
          y: -8
        })
      )
    ).toEqual([
      -31,
      -26,
      0,
      0,
      -17,
      -26,
      1,
      0,
      -17,
      -8,
      1,
      1,
      -31,
      -26,
      0,
      0,
      -17,
      -8,
      1,
      1,
      -31,
      -8,
      0,
      1
    ]);
  });

  it('maps bunny facing into a shader-friendly sign', () => {
    expect(getPassiveBunnyPlaceholderFacingSign(createPassiveBunnyState({ facing: 'right' }))).toBe(1);
    expect(getPassiveBunnyPlaceholderFacingSign(createPassiveBunnyState({ facing: 'left' }))).toBe(-1);
  });

  it('samples the brightest nearby light tile around the bunny AABB', () => {
    const world = new TileWorld(0);
    const state = createPassiveBunnyState({
      position: { x: 40, y: 32 }
    });
    expect(world.setLightLevel(2, 0, 7)).toBe(true);
    expect(world.setLightLevel(3, 2, 11)).toBe(true);

    expect(getPassiveBunnyPlaceholderNearbyLightSample(world, state)).toEqual({
      level: 11,
      sourceTile: { x: 3, y: 2 }
    });
  });
});
