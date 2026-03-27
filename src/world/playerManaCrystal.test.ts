import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import {
  DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP,
  DEFAULT_MANA_CRYSTAL_MAX_MANA_INCREASE,
  tryUsePlayerManaCrystal
} from './playerManaCrystal';

describe('playerManaCrystal', () => {
  it('raises max mana and fills current mana by the granted amount', () => {
    const useResult = tryUsePlayerManaCrystal(
      createPlayerState({
        maxMana: 20,
        mana: 6
      })
    );

    expect(useResult).toEqual({
      nextPlayerState: createPlayerState({
        maxMana: 20 + DEFAULT_MANA_CRYSTAL_MAX_MANA_INCREASE,
        mana: 6 + DEFAULT_MANA_CRYSTAL_MAX_MANA_INCREASE
      }),
      consumed: true,
      manaIncreaseApplied: DEFAULT_MANA_CRYSTAL_MAX_MANA_INCREASE,
      blockedReason: null
    });
  });

  it('clamps the granted increase at the mana cap and blocks later use at the cap', () => {
    const clampedUseResult = tryUsePlayerManaCrystal(
      createPlayerState({
        maxMana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP - 10,
        mana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP - 17
      })
    );
    const blockedUseResult = tryUsePlayerManaCrystal(clampedUseResult.nextPlayerState);

    expect(clampedUseResult).toEqual({
      nextPlayerState: createPlayerState({
        maxMana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP,
        mana: DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP - 7
      }),
      consumed: true,
      manaIncreaseApplied: 10,
      blockedReason: null
    });
    expect(blockedUseResult).toEqual({
      nextPlayerState: clampedUseResult.nextPlayerState,
      consumed: false,
      manaIncreaseApplied: 0,
      blockedReason: 'max-mana-cap'
    });
  });

  it('blocks use on dead players without changing mana', () => {
    const useResult = tryUsePlayerManaCrystal(
      createPlayerState({
        health: 0,
        mana: 10
      })
    );

    expect(useResult).toEqual({
      nextPlayerState: createPlayerState({
        health: 0,
        mana: 10
      }),
      consumed: false,
      manaIncreaseApplied: 0,
      blockedReason: 'dead'
    });
  });
});
