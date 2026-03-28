import { describe, expect, it } from 'vitest';

import { MAX_LIGHT_LEVEL } from '../world/constants';
import { createBombDetonationFlashState } from '../world/bombDetonationFlash';
import {
  buildBombDetonationFlashPlaceholderVertices,
  getBombDetonationFlashPlaceholderNearbyLightSample
} from './bombDetonationFlashPlaceholder';

describe('bombDetonationFlashPlaceholder', () => {
  it('builds a quad around the detonation flash radius', () => {
    const flashState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12
    });

    expect(Array.from(buildBombDetonationFlashPlaceholderVertices(flashState))).toEqual([
      20,
      8,
      0,
      0,
      44,
      8,
      1,
      0,
      44,
      32,
      1,
      1,
      20,
      8,
      0,
      0,
      44,
      32,
      1,
      1,
      20,
      32,
      0,
      1
    ]);
  });

  it('samples the brightest nearby world light around the detonation flash', () => {
    const flashState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12
    });
    const world = {
      getLightLevel: (tileX: number, tileY: number) => {
        if (tileX === 2 && tileY === 1) {
          return MAX_LIGHT_LEVEL;
        }

        return 0;
      }
    };

    expect(getBombDetonationFlashPlaceholderNearbyLightSample(world, flashState)).toEqual({
      level: MAX_LIGHT_LEVEL,
      sourceTile: { x: 2, y: 1 }
    });
  });
});
