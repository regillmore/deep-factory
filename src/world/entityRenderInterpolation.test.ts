import { describe, expect, it } from 'vitest';

import type { EntityRenderStateSnapshot } from './entityRegistry';
import { resolveInterpolatedEntityWorldPosition } from './entityRenderInterpolation';

interface TestRenderState {
  position: {
    x: number;
    y: number;
  };
  frame: number;
}

const createSnapshot = (): EntityRenderStateSnapshot<TestRenderState> => ({
  previous: {
    position: {
      x: -4,
      y: 8
    },
    frame: 0
  },
  current: {
    position: {
      x: 12,
      y: -16
    },
    frame: 1
  }
});

describe('resolveInterpolatedEntityWorldPosition', () => {
  it('clamps alpha below zero to the previous snapshot position', () => {
    const snapshot = createSnapshot();

    expect(resolveInterpolatedEntityWorldPosition(snapshot, -0.5)).toEqual({
      x: -4,
      y: 8
    });
  });

  it('blends previous and current world positions for intermediate alpha', () => {
    const snapshot = createSnapshot();

    expect(resolveInterpolatedEntityWorldPosition(snapshot, 0.25)).toEqual({
      x: 0,
      y: 2
    });
  });

  it('clamps alpha above one to the current snapshot position', () => {
    const snapshot = createSnapshot();

    expect(resolveInterpolatedEntityWorldPosition(snapshot, 2)).toEqual({
      x: 12,
      y: -16
    });
  });

  it('returns a detached blended position without mutating snapshot state', () => {
    const snapshot = createSnapshot();

    const blendedPosition = resolveInterpolatedEntityWorldPosition(snapshot, 0.5);

    expect(blendedPosition).toEqual({
      x: 4,
      y: -4
    });
    expect(blendedPosition).not.toBe(snapshot.previous.position);
    expect(blendedPosition).not.toBe(snapshot.current.position);
    expect(snapshot).toEqual(createSnapshot());
  });

  it('rejects non-finite interpolation alpha', () => {
    const snapshot = createSnapshot();

    expect(() => resolveInterpolatedEntityWorldPosition(snapshot, Number.NaN)).toThrow(
      'alpha must be a finite number'
    );
  });
});
