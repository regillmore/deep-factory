import { describe, expect, it } from 'vitest';

import { MAX_LIGHT_LEVEL } from '../world/constants';
import { createThrownBombState } from '../world/bombThrowing';
import {
  buildThrownBombPlaceholderVertices,
  getThrownBombPlaceholderNearbyLightSample
} from './thrownBombPlaceholder';

describe('thrownBombPlaceholder', () => {
  it('builds a quad around the thrown-bomb radius', () => {
    const thrownBombState = createThrownBombState({
      position: { x: 20, y: 12 },
      velocity: { x: 30, y: -10 },
      radius: 6,
      secondsRemaining: 0.5
    });

    expect(Array.from(buildThrownBombPlaceholderVertices(thrownBombState))).toEqual([
      14,
      6,
      0,
      0,
      26,
      6,
      1,
      0,
      26,
      18,
      1,
      1,
      14,
      6,
      0,
      0,
      26,
      18,
      1,
      1,
      14,
      18,
      0,
      1
    ]);
  });

  it('samples the brightest nearby world light around the thrown bomb', () => {
    const thrownBombState = createThrownBombState({
      position: { x: 20, y: 12 },
      velocity: { x: 30, y: -10 },
      radius: 6,
      secondsRemaining: 0.5
    });
    const world = {
      getLightLevel: (tileX: number, tileY: number) => {
        if (tileX === 1 && tileY === 1) {
          return MAX_LIGHT_LEVEL;
        }
        return 0;
      }
    };

    expect(getThrownBombPlaceholderNearbyLightSample(world, thrownBombState)).toEqual({
      level: MAX_LIGHT_LEVEL,
      sourceTile: { x: 1, y: 1 }
    });
  });
});
