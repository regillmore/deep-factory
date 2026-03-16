import { clonePlayerState, type PlayerState } from './playerState';

export const HEART_CRYSTAL_ITEM_ID = 'heart-crystal';
export const DEFAULT_HEART_CRYSTAL_MAX_HEALTH_INCREASE = 20;
export const DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP = 400;

export interface PlayerHeartCrystalOptions {
  maxHealthIncrease?: number;
  maxHealthCap?: number;
}

export interface TryUsePlayerHeartCrystalResult {
  nextPlayerState: PlayerState;
  consumed: boolean;
  healthIncreaseApplied: number;
  blockedReason: 'dead' | 'max-health-cap' | null;
}

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return value;
};

const resolvePlayerHeartCrystalOptions = (
  options: PlayerHeartCrystalOptions
): Required<PlayerHeartCrystalOptions> => ({
  maxHealthIncrease: expectPositiveFiniteNumber(
    options.maxHealthIncrease ?? DEFAULT_HEART_CRYSTAL_MAX_HEALTH_INCREASE,
    'options.maxHealthIncrease'
  ),
  maxHealthCap: expectPositiveFiniteNumber(
    options.maxHealthCap ?? DEFAULT_HEART_CRYSTAL_MAX_HEALTH_CAP,
    'options.maxHealthCap'
  )
});

export const tryUsePlayerHeartCrystal = (
  playerState: PlayerState,
  options: PlayerHeartCrystalOptions = {}
): TryUsePlayerHeartCrystalResult => {
  const resolvedOptions = resolvePlayerHeartCrystalOptions(options);
  const nextPlayerState = clonePlayerState(playerState);

  if (playerState.health <= 0) {
    return {
      nextPlayerState,
      consumed: false,
      healthIncreaseApplied: 0,
      blockedReason: 'dead'
    };
  }

  if (playerState.maxHealth >= resolvedOptions.maxHealthCap) {
    return {
      nextPlayerState,
      consumed: false,
      healthIncreaseApplied: 0,
      blockedReason: 'max-health-cap'
    };
  }

  const healthIncreaseApplied = Math.min(
    resolvedOptions.maxHealthIncrease,
    resolvedOptions.maxHealthCap - playerState.maxHealth
  );
  nextPlayerState.maxHealth = playerState.maxHealth + healthIncreaseApplied;
  nextPlayerState.health = Math.min(
    nextPlayerState.maxHealth,
    playerState.health + healthIncreaseApplied
  );

  return {
    nextPlayerState,
    consumed: true,
    healthIncreaseApplied,
    blockedReason: null
  };
};
