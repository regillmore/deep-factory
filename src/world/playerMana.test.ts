import { describe, expect, it } from 'vitest';

import { createPlayerState } from './playerState';
import { spendPlayerMana, stepPlayerManaRegeneration } from './playerMana';

describe('playerMana', () => {
  it('spends mana, resets the regen delay, and resets the next regen tick interval', () => {
    const useResult = spendPlayerMana(
      createPlayerState({
        maxMana: 40,
        mana: 23,
        manaRegenDelaySecondsRemaining: 0.1,
        manaRegenTickSecondsRemaining: 0.05
      }),
      {
        manaCost: 5,
        regenDelaySeconds: 1.25,
        regenTickIntervalSeconds: 0.3
      }
    );

    expect(useResult).toEqual({
      nextPlayerState: createPlayerState({
        maxMana: 40,
        mana: 18,
        manaRegenDelaySecondsRemaining: 1.25,
        manaRegenTickSecondsRemaining: 0.3
      }),
      spent: true,
      blockedReason: null
    });
  });

  it('blocks mana spends when the player is dead or the current mana is too low', () => {
    expect(
      spendPlayerMana(
        createPlayerState({
          mana: 10,
          health: 0
        }),
        {
          manaCost: 5
        }
      )
    ).toEqual({
      nextPlayerState: createPlayerState({
        mana: 10,
        health: 0
      }),
      spent: false,
      blockedReason: 'dead'
    });

    expect(
      spendPlayerMana(
        createPlayerState({
          mana: 4
        }),
        {
          manaCost: 5
        }
      )
    ).toEqual({
      nextPlayerState: createPlayerState({
        mana: 4
      }),
      spent: false,
      blockedReason: 'insufficient-mana'
    });
  });

  it('waits through the regen delay, then restores one mana per regen tick and clamps at max mana', () => {
    const exhaustedManaState = createPlayerState({
      maxMana: 5,
      mana: 2,
      manaRegenDelaySecondsRemaining: 0.5,
      manaRegenTickSecondsRemaining: 0.25
    });

    const delayOnly = stepPlayerManaRegeneration(exhaustedManaState, 0.25, {
      regenTickIntervalSeconds: 0.25
    });
    expect(delayOnly).toEqual(
      createPlayerState({
        maxMana: 5,
        mana: 2,
        manaRegenDelaySecondsRemaining: 0.25,
        manaRegenTickSecondsRemaining: 0.25
      })
    );

    const firstTick = stepPlayerManaRegeneration(delayOnly, 0.25, {
      regenTickIntervalSeconds: 0.25
    });
    expect(firstTick).toEqual(
      createPlayerState({
        maxMana: 5,
        mana: 2,
        manaRegenDelaySecondsRemaining: 0,
        manaRegenTickSecondsRemaining: 0.25
      })
    );

    const clampedFull = stepPlayerManaRegeneration(firstTick, 1, {
      regenTickIntervalSeconds: 0.25
    });
    expect(clampedFull).toEqual(
      createPlayerState({
        maxMana: 5,
        mana: 5,
        manaRegenDelaySecondsRemaining: 0,
        manaRegenTickSecondsRemaining: 0.25
      })
    );
  });

  it('does not regenerate mana while the player is dead', () => {
    const deadPlayerState = createPlayerState({
      health: 0,
      maxMana: 20,
      mana: 6,
      manaRegenDelaySecondsRemaining: 0,
      manaRegenTickSecondsRemaining: 0.1
    });

    expect(stepPlayerManaRegeneration(deadPlayerState, 1)).toEqual(deadPlayerState);
  });
});
