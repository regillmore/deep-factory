import { describe, expect, it } from 'vitest';

import { MAX_LIGHT_LEVEL } from '../world/constants';
import { createStarterWandFireboltState } from '../world/starterWand';
import {
  buildFireboltPlaceholderVertices,
  getFireboltPlaceholderNearbyLightSample
} from './fireboltPlaceholder';

describe('fireboltPlaceholder', () => {
  it('builds a quad around the firebolt radius', () => {
    const fireboltState = createStarterWandFireboltState({
      position: { x: 20, y: 12 },
      velocity: { x: 30, y: -10 },
      radius: 4,
      secondsRemaining: 0.5
    });

    expect(Array.from(buildFireboltPlaceholderVertices(fireboltState))).toEqual([
      16,
      8,
      0,
      0,
      24,
      8,
      1,
      0,
      24,
      16,
      1,
      1,
      16,
      8,
      0,
      0,
      24,
      16,
      1,
      1,
      16,
      16,
      0,
      1
    ]);
  });

  it('samples the brightest nearby world light around the firebolt', () => {
    const fireboltState = createStarterWandFireboltState({
      position: { x: 20, y: 12 },
      velocity: { x: 30, y: -10 },
      radius: 4,
      secondsRemaining: 0.5
    });
    const world = {
      getLightLevel: (tileX: number, tileY: number) => {
        if (tileX === 1 && tileY === 0) {
          return MAX_LIGHT_LEVEL;
        }
        return 0;
      }
    };

    expect(getFireboltPlaceholderNearbyLightSample(world, fireboltState)).toEqual({
      level: MAX_LIGHT_LEVEL,
      sourceTile: { x: 1, y: 0 }
    });
  });
});
