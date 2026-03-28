import { describe, expect, it } from 'vitest';

import { DEFAULT_THROWN_BOMB_BLAST_RADIUS } from './bombThrowing';
import {
  createBombDetonationFlashState,
  createBombDetonationFlashStateFromBlast,
  DEFAULT_BOMB_DETONATION_FLASH_DURATION_SECONDS,
  stepBombDetonationFlashState
} from './bombDetonationFlash';

describe('bombDetonationFlash', () => {
  it('creates a detonation flash state from the resolved blast event', () => {
    expect(
      createBombDetonationFlashStateFromBlast({
        position: { x: 40, y: -24 },
        blastRadius: DEFAULT_THROWN_BOMB_BLAST_RADIUS
      })
    ).toEqual({
      position: { x: 40, y: -24 },
      radius: DEFAULT_THROWN_BOMB_BLAST_RADIUS,
      secondsRemaining: DEFAULT_BOMB_DETONATION_FLASH_DURATION_SECONDS,
      durationSeconds: DEFAULT_BOMB_DETONATION_FLASH_DURATION_SECONDS
    });
  });

  it('returns a cloned state when stepped with a zero fixed dt', () => {
    const state = createBombDetonationFlashState({
      position: { x: 24, y: 12 },
      radius: 18
    });

    const steppedState = stepBombDetonationFlashState(state, 0);

    expect(steppedState).toEqual(state);
    expect(steppedState).not.toBe(state);
  });

  it('decrements seconds remaining until the flash expires deterministically', () => {
    const state = createBombDetonationFlashState({
      position: { x: 24, y: 12 },
      radius: 18,
      durationSeconds: 0.05
    });

    const firstStep = stepBombDetonationFlashState(state, 1 / 60);
    expect(firstStep).toEqual({
      position: { x: 24, y: 12 },
      radius: 18,
      secondsRemaining: 0.05 - 1 / 60,
      durationSeconds: 0.05
    });

    const secondStep = stepBombDetonationFlashState(firstStep!, 1 / 60);
    expect(secondStep?.position).toEqual({ x: 24, y: 12 });
    expect(secondStep?.radius).toBe(18);
    expect(secondStep?.durationSeconds).toBe(0.05);
    expect(secondStep?.secondsRemaining).toBeCloseTo(0.05 - 2 / 60, 10);

    expect(stepBombDetonationFlashState(secondStep!, 1 / 60)).toBeNull();
  });
});
