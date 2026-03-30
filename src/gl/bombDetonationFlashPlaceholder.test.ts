import { describe, expect, it } from 'vitest';

import { MAX_LIGHT_LEVEL } from '../world/constants';
import { createBombDetonationFlashState } from '../world/bombDetonationFlash';
import {
  buildBombDetonationFlashPlaceholderVertices,
  getBombDetonationFlashPlaceholderNearbyLightSample,
  resolveBombDetonationFlashPlaceholderRenderRadius,
  resolveBombDetonationFlashPlaceholderVisuals
} from './bombDetonationFlashPlaceholder';

const toRoundedFloatArray = (values: Float32Array): number[] =>
  Array.from(values, (value) => Number(value.toFixed(4)));

describe('bombDetonationFlashPlaceholder', () => {
  it('builds a full-size quad around the detonation flash radius at ignition', () => {
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

  it('contracts the detonation flash render radius toward a smaller ember core over the fixed-step lifetime', () => {
    const startState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12,
      durationSeconds: 0.2,
      secondsRemaining: 0.2
    });
    const midpointState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12,
      durationSeconds: 0.2,
      secondsRemaining: 0.1
    });
    const endState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12,
      durationSeconds: 0.2,
      secondsRemaining: 0
    });

    expect(resolveBombDetonationFlashPlaceholderRenderRadius(startState)).toBeCloseTo(12, 10);
    expect(resolveBombDetonationFlashPlaceholderRenderRadius(midpointState)).toBeCloseTo(8.1, 10);
    expect(resolveBombDetonationFlashPlaceholderRenderRadius(endState)).toBeCloseTo(4.2, 10);

    expect(toRoundedFloatArray(buildBombDetonationFlashPlaceholderVertices(midpointState))).toEqual([
      23.9,
      11.9,
      0,
      0,
      40.1,
      11.9,
      1,
      0,
      40.1,
      28.1,
      1,
      1,
      23.9,
      11.9,
      0,
      0,
      40.1,
      28.1,
      1,
      1,
      23.9,
      28.1,
      0,
      1
    ]);
    expect(toRoundedFloatArray(buildBombDetonationFlashPlaceholderVertices(endState))).toEqual([
      27.8,
      15.8,
      0,
      0,
      36.2,
      15.8,
      1,
      0,
      36.2,
      24.2,
      1,
      1,
      27.8,
      15.8,
      0,
      0,
      36.2,
      24.2,
      1,
      1,
      27.8,
      24.2,
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

  it('ramps bomb flash visuals from ignition to ember over the fixed-step lifetime', () => {
    const startState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12,
      durationSeconds: 0.2,
      secondsRemaining: 0.2
    });
    const midpointState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12,
      durationSeconds: 0.2,
      secondsRemaining: 0.1
    });
    const endState = createBombDetonationFlashState({
      position: { x: 32, y: 20 },
      radius: 12,
      durationSeconds: 0.2,
      secondsRemaining: 0
    });

    expect(resolveBombDetonationFlashPlaceholderVisuals(startState)).toEqual({
      progressNormalized: 0,
      minimumLightFactor: 0.8,
      alpha: 1,
      baseColor: [1, 0.56, 0.18],
      accentColor: [1, 0.94, 0.7]
    });

    const midpointVisuals = resolveBombDetonationFlashPlaceholderVisuals(midpointState);
    expect(midpointVisuals.progressNormalized).toBe(0.5);
    expect(midpointVisuals.minimumLightFactor).toBeCloseTo(0.575, 10);
    expect(midpointVisuals.alpha).toBeCloseTo(0.625, 10);
    expect(midpointVisuals.baseColor[0]).toBeCloseTo(0.7, 10);
    expect(midpointVisuals.baseColor[1]).toBeCloseTo(0.33, 10);
    expect(midpointVisuals.baseColor[2]).toBeCloseTo(0.1, 10);
    expect(midpointVisuals.accentColor[0]).toBeCloseTo(1, 10);
    expect(midpointVisuals.accentColor[1]).toBeCloseTo(0.68, 10);
    expect(midpointVisuals.accentColor[2]).toBeCloseTo(0.41, 10);

    const endVisuals = resolveBombDetonationFlashPlaceholderVisuals(endState);
    expect(endVisuals.progressNormalized).toBe(1);
    expect(endVisuals.minimumLightFactor).toBeCloseTo(0.35, 10);
    expect(endVisuals.alpha).toBeCloseTo(0.25, 10);
    expect(endVisuals.baseColor[0]).toBeCloseTo(0.4, 10);
    expect(endVisuals.baseColor[1]).toBeCloseTo(0.1, 10);
    expect(endVisuals.baseColor[2]).toBeCloseTo(0.02, 10);
    expect(endVisuals.accentColor[0]).toBeCloseTo(1, 10);
    expect(endVisuals.accentColor[1]).toBeCloseTo(0.42, 10);
    expect(endVisuals.accentColor[2]).toBeCloseTo(0.12, 10);
  });
});
