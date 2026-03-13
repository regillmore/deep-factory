import { describe, expect, it } from 'vitest';

import { TileWorld } from '../world/world';
import { createHostileSlimeState } from '../world/hostileSlimeState';
import {
  buildHostileSlimePlaceholderVertices,
  getHostileSlimePlaceholderFacingSign,
  getHostileSlimePlaceholderNearbyLightSample
} from './hostileSlimePlaceholder';

describe('hostileSlimePlaceholder', () => {
  it('builds a quad from the hostile slime world-space AABB', () => {
    const state = createHostileSlimeState({
      position: { x: 40, y: 32 }
    });

    expect(Array.from(buildHostileSlimePlaceholderVertices(state))).toEqual([
      30,
      20,
      0,
      0,
      50,
      20,
      1,
      0,
      50,
      32,
      1,
      1,
      30,
      20,
      0,
      0,
      50,
      32,
      1,
      1,
      30,
      32,
      0,
      1
    ]);
  });

  it('can build slime placeholder geometry from an overridden render position', () => {
    const state = createHostileSlimeState({
      position: { x: 40, y: 32 }
    });

    expect(
      Array.from(
        buildHostileSlimePlaceholderVertices(state, {
          x: -24,
          y: -8
        })
      )
    ).toEqual([
      -34,
      -20,
      0,
      0,
      -14,
      -20,
      1,
      0,
      -14,
      -8,
      1,
      1,
      -34,
      -20,
      0,
      0,
      -14,
      -8,
      1,
      1,
      -34,
      -8,
      0,
      1
    ]);
  });

  it('maps slime facing into a shader-friendly sign', () => {
    expect(getHostileSlimePlaceholderFacingSign(createHostileSlimeState({ facing: 'right' }))).toBe(1);
    expect(getHostileSlimePlaceholderFacingSign(createHostileSlimeState({ facing: 'left' }))).toBe(-1);
  });

  it('samples the brightest nearby light tile around the slime AABB', () => {
    const world = new TileWorld(0);
    const state = createHostileSlimeState({
      position: { x: 40, y: 32 }
    });
    expect(world.setLightLevel(2, 1, 7)).toBe(true);
    expect(world.setLightLevel(3, 2, 11)).toBe(true);

    expect(getHostileSlimePlaceholderNearbyLightSample(world, state)).toEqual({
      level: 11,
      sourceTile: { x: 3, y: 2 }
    });
  });
});
