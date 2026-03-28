import { describe, expect, it } from 'vitest';

import { MAX_LIGHT_LEVEL } from '../world/constants';
import { createThrownBombState } from '../world/bombThrowing';
import {
  buildThrownBombPlaceholderVertices,
  getThrownBombPlaceholderNearbyLightSample,
  resolveThrownBombFuseWarningVisuals
} from './thrownBombPlaceholder';

describe('thrownBombPlaceholder', () => {
  const bombPalette = {
    baseColor: [0.19, 0.2, 0.24] as const,
    accentColor: [0.88, 0.36, 0.18] as const
  };

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

  it('keeps the default palette and light floor before the fuse warning window', () => {
    const thrownBombState = createThrownBombState({
      position: { x: 20, y: 12 },
      velocity: { x: 30, y: -10 },
      radius: 6,
      secondsRemaining: 1
    });

    expect(resolveThrownBombFuseWarningVisuals(thrownBombState, bombPalette)).toEqual({
      blinkActive: false,
      minimumLightFactor: 0.45,
      baseColor: [0.19, 0.2, 0.24],
      accentColor: [0.88, 0.36, 0.18]
    });
  });

  it('switches between slow and fast fuse-warning blink states as detonation approaches', () => {
    expect(
      resolveThrownBombFuseWarningVisuals(
        createThrownBombState({
          position: { x: 20, y: 12 },
          velocity: { x: 30, y: -10 },
          radius: 6,
          secondsRemaining: 0.74
        }),
        bombPalette
      )
    ).toEqual({
      blinkActive: true,
      minimumLightFactor: 0.85,
      baseColor: [0.52, 0.16, 0.08],
      accentColor: [1, 0.95, 0.68]
    });

    expect(
      resolveThrownBombFuseWarningVisuals(
        createThrownBombState({
          position: { x: 20, y: 12 },
          velocity: { x: 30, y: -10 },
          radius: 6,
          secondsRemaining: 0.59
        }),
        bombPalette
      )
    ).toEqual({
      blinkActive: false,
      minimumLightFactor: 0.45,
      baseColor: [0.19, 0.2, 0.24],
      accentColor: [0.88, 0.36, 0.18]
    });

    expect(
      resolveThrownBombFuseWarningVisuals(
        createThrownBombState({
          position: { x: 20, y: 12 },
          velocity: { x: 30, y: -10 },
          radius: 6,
          secondsRemaining: 0.29
        }),
        bombPalette
      )
    ).toEqual({
      blinkActive: true,
      minimumLightFactor: 0.85,
      baseColor: [0.52, 0.16, 0.08],
      accentColor: [1, 0.95, 0.68]
    });

    expect(
      resolveThrownBombFuseWarningVisuals(
        createThrownBombState({
          position: { x: 20, y: 12 },
          velocity: { x: 30, y: -10 },
          radius: 6,
          secondsRemaining: 0.22
        }),
        bombPalette
      )
    ).toEqual({
      blinkActive: false,
      minimumLightFactor: 0.45,
      baseColor: [0.19, 0.2, 0.24],
      accentColor: [0.88, 0.36, 0.18]
    });
  });
});
