import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import {
  DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP,
  DEFAULT_HEART_CRYSTAL_MAX_HEALTH_INCREASE,
  tryUsePlayerHeartCrystal
} from './playerHeartCrystal';

describe('playerHeartCrystal', () => {
  it('raises max health and fills current health by the granted amount', () => {
    const useResult = tryUsePlayerHeartCrystal(createPlayerState({ health: 55 }));

    expect(useResult).toEqual({
      nextPlayerState: createPlayerState({
        maxHealth: 100 + DEFAULT_HEART_CRYSTAL_MAX_HEALTH_INCREASE,
        health: 55 + DEFAULT_HEART_CRYSTAL_MAX_HEALTH_INCREASE
      }),
      consumed: true,
      healthIncreaseApplied: DEFAULT_HEART_CRYSTAL_MAX_HEALTH_INCREASE,
      blockedReason: null
    });
  });

  it('clamps the granted increase at the health cap and blocks later use at the cap', () => {
    const clampedUseResult = tryUsePlayerHeartCrystal(
      createPlayerState({
        maxHealth: DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP - 10,
        health: DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP - 20
      })
    );
    const blockedUseResult = tryUsePlayerHeartCrystal(clampedUseResult.nextPlayerState);

    expect(clampedUseResult).toEqual({
      nextPlayerState: createPlayerState({
        maxHealth: DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP,
        health: DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP - 10
      }),
      consumed: true,
      healthIncreaseApplied: 10,
      blockedReason: null
    });
    expect(blockedUseResult).toEqual({
      nextPlayerState: clampedUseResult.nextPlayerState,
      consumed: false,
      healthIncreaseApplied: 0,
      blockedReason: 'max-health-cap'
    });
  });

  it('blocks use on dead players without changing health', () => {
    const useResult = tryUsePlayerHeartCrystal(
      createPlayerState({
        health: 0
      })
    );

    expect(useResult).toEqual({
      nextPlayerState: createPlayerState({
        health: 0
      }),
      consumed: false,
      healthIncreaseApplied: 0,
      blockedReason: 'dead'
    });
  });
});
