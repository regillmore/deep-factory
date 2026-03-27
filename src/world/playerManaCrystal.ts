import { clonePlayerState, type PlayerState } from './playerState';

export const MANA_CRYSTAL_ITEM_ID = 'mana-crystal';
export const DEFAULT_MANA_CRYSTAL_MAX_MANA_INCREASE = 20;
export const DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP = 200;

export interface PlayerManaCrystalOptions {
  maxManaIncrease?: number;
  maxManaCap?: number;
}

export interface TryUsePlayerManaCrystalResult {
  nextPlayerState: PlayerState;
  consumed: boolean;
  manaIncreaseApplied: number;
  blockedReason: 'dead' | 'max-mana-cap' | null;
}

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return value;
};

const resolvePlayerManaCrystalOptions = (
  options: PlayerManaCrystalOptions
): Required<PlayerManaCrystalOptions> => ({
  maxManaIncrease: expectPositiveFiniteNumber(
    options.maxManaIncrease ?? DEFAULT_MANA_CRYSTAL_MAX_MANA_INCREASE,
    'options.maxManaIncrease'
  ),
  maxManaCap: expectPositiveFiniteNumber(
    options.maxManaCap ?? DEFAULT_MANA_CRYSTAL_MAX_MANA_CAP,
    'options.maxManaCap'
  )
});

export const tryUsePlayerManaCrystal = (
  playerState: PlayerState,
  options: PlayerManaCrystalOptions = {}
): TryUsePlayerManaCrystalResult => {
  const resolvedOptions = resolvePlayerManaCrystalOptions(options);
  const nextPlayerState = clonePlayerState(playerState);

  if (playerState.health <= 0) {
    return {
      nextPlayerState,
      consumed: false,
      manaIncreaseApplied: 0,
      blockedReason: 'dead'
    };
  }

  if (playerState.maxMana >= resolvedOptions.maxManaCap) {
    return {
      nextPlayerState,
      consumed: false,
      manaIncreaseApplied: 0,
      blockedReason: 'max-mana-cap'
    };
  }

  const manaIncreaseApplied = Math.min(
    resolvedOptions.maxManaIncrease,
    resolvedOptions.maxManaCap - playerState.maxMana
  );
  nextPlayerState.maxMana = playerState.maxMana + manaIncreaseApplied;
  nextPlayerState.mana = Math.min(nextPlayerState.maxMana, playerState.mana + manaIncreaseApplied);

  return {
    nextPlayerState,
    consumed: true,
    manaIncreaseApplied,
    blockedReason: null
  };
};
