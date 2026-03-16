import { describe, expect, it } from 'vitest';

import { createPlayerState, DEFAULT_PLAYER_MAX_HEALTH } from './playerState';
import {
  createPlayerHealingPotionCooldownState,
  DEFAULT_HEALING_POTION_HEAL_AMOUNT,
  DEFAULT_HEALING_POTION_USE_COOLDOWN_SECONDS,
  stepPlayerHealingPotionCooldownState,
  tryUsePlayerHealingPotion
} from './playerHealingPotion';

describe('playerHealingPotion', () => {
  it('heals the player and starts the shared potion cooldown when health is missing', () => {
    const useResult = tryUsePlayerHealingPotion(
      createPlayerState({ health: 40 }),
      createPlayerHealingPotionCooldownState()
    );

    expect(useResult).toEqual({
      nextPlayerState: createPlayerState({
        health: 40 + DEFAULT_HEALING_POTION_HEAL_AMOUNT
      }),
      nextCooldownState: createPlayerHealingPotionCooldownState(
        DEFAULT_HEALING_POTION_USE_COOLDOWN_SECONDS
      ),
      consumed: true,
      healedAmount: DEFAULT_HEALING_POTION_HEAL_AMOUNT,
      blockedReason: null
    });
  });

  it('clamps healing at max health and blocks potion use when already full', () => {
    const clampedUseResult = tryUsePlayerHealingPotion(
      createPlayerState({ health: DEFAULT_PLAYER_MAX_HEALTH - 10 }),
      createPlayerHealingPotionCooldownState()
    );
    const blockedUseResult = tryUsePlayerHealingPotion(
      clampedUseResult.nextPlayerState,
      createPlayerHealingPotionCooldownState()
    );

    expect(clampedUseResult.consumed).toBe(true);
    expect(clampedUseResult.healedAmount).toBe(10);
    expect(clampedUseResult.nextPlayerState.health).toBe(DEFAULT_PLAYER_MAX_HEALTH);
    expect(blockedUseResult).toEqual({
      nextPlayerState: clampedUseResult.nextPlayerState,
      nextCooldownState: createPlayerHealingPotionCooldownState(),
      consumed: false,
      healedAmount: 0,
      blockedReason: 'full-health'
    });
  });

  it('blocks potion use during cooldown until fixed steps drain it to zero', () => {
    const initialUseResult = tryUsePlayerHealingPotion(
      createPlayerState({ health: 30 }),
      createPlayerHealingPotionCooldownState()
    );
    const blockedWhileCoolingDown = tryUsePlayerHealingPotion(
      initialUseResult.nextPlayerState,
      initialUseResult.nextCooldownState
    );
    const cooledDownState = stepPlayerHealingPotionCooldownState(
      stepPlayerHealingPotionCooldownState(initialUseResult.nextCooldownState, 1),
      1
    );
    const useAfterCooldown = tryUsePlayerHealingPotion(
      initialUseResult.nextPlayerState,
      cooledDownState
    );

    expect(blockedWhileCoolingDown.consumed).toBe(false);
    expect(blockedWhileCoolingDown.blockedReason).toBe('cooldown');
    expect(cooledDownState).toEqual(createPlayerHealingPotionCooldownState());
    expect(useAfterCooldown.consumed).toBe(true);
    expect(useAfterCooldown.nextPlayerState.health).toBe(90);
  });

  it('heals against the upgraded player max health instead of the default baseline', () => {
    const useResult = tryUsePlayerHealingPotion(
      createPlayerState({
        maxHealth: 140,
        health: 118
      }),
      createPlayerHealingPotionCooldownState()
    );

    expect(useResult.consumed).toBe(true);
    expect(useResult.healedAmount).toBe(22);
    expect(useResult.nextPlayerState).toEqual(
      createPlayerState({
        maxHealth: 140,
        health: 140
      })
    );
  });

  it('blocks potion use on dead players without starting cooldown', () => {
    const useResult = tryUsePlayerHealingPotion(
      createPlayerState({ health: 0 }),
      createPlayerHealingPotionCooldownState()
    );

    expect(useResult).toEqual({
      nextPlayerState: createPlayerState({ health: 0 }),
      nextCooldownState: createPlayerHealingPotionCooldownState(),
      consumed: false,
      healedAmount: 0,
      blockedReason: 'dead'
    });
  });
});
