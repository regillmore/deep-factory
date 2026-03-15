import { clonePlayerState, DEFAULT_PLAYER_MAX_HEALTH, type PlayerState } from './playerState';

export const HEALING_POTION_ITEM_ID = 'healing-potion';
export const DEFAULT_HEALING_POTION_HEAL_AMOUNT = 30;
export const DEFAULT_HEALING_POTION_USE_COOLDOWN_SECONDS = 2;

export interface PlayerHealingPotionCooldownState {
  secondsRemaining: number;
}

export interface PlayerHealingPotionOptions {
  healAmount?: number;
  cooldownSeconds?: number;
  maxPlayerHealth?: number;
}

export interface TryUsePlayerHealingPotionResult {
  nextPlayerState: PlayerState;
  nextCooldownState: PlayerHealingPotionCooldownState;
  consumed: boolean;
  healedAmount: number;
  blockedReason: 'cooldown' | 'dead' | 'full-health' | null;
}

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return value;
};

const resolvePlayerHealingPotionOptions = (
  options: PlayerHealingPotionOptions
): Required<PlayerHealingPotionOptions> => ({
  healAmount: expectPositiveFiniteNumber(
    options.healAmount ?? DEFAULT_HEALING_POTION_HEAL_AMOUNT,
    'options.healAmount'
  ),
  cooldownSeconds: expectNonNegativeFiniteNumber(
    options.cooldownSeconds ?? DEFAULT_HEALING_POTION_USE_COOLDOWN_SECONDS,
    'options.cooldownSeconds'
  ),
  maxPlayerHealth: expectPositiveFiniteNumber(
    options.maxPlayerHealth ?? DEFAULT_PLAYER_MAX_HEALTH,
    'options.maxPlayerHealth'
  )
});

export const createPlayerHealingPotionCooldownState = (
  secondsRemaining = 0
): PlayerHealingPotionCooldownState => ({
  secondsRemaining: expectNonNegativeFiniteNumber(secondsRemaining, 'secondsRemaining')
});

export const clonePlayerHealingPotionCooldownState = (
  state: PlayerHealingPotionCooldownState
): PlayerHealingPotionCooldownState => ({
  secondsRemaining: state.secondsRemaining
});

export const stepPlayerHealingPotionCooldownState = (
  state: PlayerHealingPotionCooldownState,
  fixedDtSeconds: number
): PlayerHealingPotionCooldownState => ({
  secondsRemaining: Math.max(
    0,
    state.secondsRemaining - expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds')
  )
});

export const tryUsePlayerHealingPotion = (
  playerState: PlayerState,
  cooldownState: PlayerHealingPotionCooldownState,
  options: PlayerHealingPotionOptions = {}
): TryUsePlayerHealingPotionResult => {
  const resolvedOptions = resolvePlayerHealingPotionOptions(options);
  const nextPlayerState = clonePlayerState(playerState);
  const nextCooldownState = clonePlayerHealingPotionCooldownState(cooldownState);

  if (playerState.health <= 0) {
    return {
      nextPlayerState,
      nextCooldownState,
      consumed: false,
      healedAmount: 0,
      blockedReason: 'dead'
    };
  }

  if (cooldownState.secondsRemaining > 0) {
    return {
      nextPlayerState,
      nextCooldownState,
      consumed: false,
      healedAmount: 0,
      blockedReason: 'cooldown'
    };
  }

  const missingHealth = Math.max(0, resolvedOptions.maxPlayerHealth - playerState.health);
  if (missingHealth <= 0) {
    return {
      nextPlayerState,
      nextCooldownState,
      consumed: false,
      healedAmount: 0,
      blockedReason: 'full-health'
    };
  }

  const healedAmount = Math.min(resolvedOptions.healAmount, missingHealth);
  nextPlayerState.health = Math.min(
    resolvedOptions.maxPlayerHealth,
    playerState.health + healedAmount
  );
  nextCooldownState.secondsRemaining = resolvedOptions.cooldownSeconds;

  return {
    nextPlayerState,
    nextCooldownState,
    consumed: true,
    healedAmount,
    blockedReason: null
  };
};
