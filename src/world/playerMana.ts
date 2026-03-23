import {
  clonePlayerState,
  DEFAULT_PLAYER_MANA_REGEN_DELAY_SECONDS,
  DEFAULT_PLAYER_MANA_REGEN_TICK_INTERVAL_SECONDS,
  type PlayerState
} from './playerState';

export interface SpendPlayerManaOptions {
  manaCost?: number;
  regenDelaySeconds?: number;
  regenTickIntervalSeconds?: number;
}

export interface SpendPlayerManaResult {
  nextPlayerState: PlayerState;
  spent: boolean;
  blockedReason: 'dead' | 'insufficient-mana' | null;
}

export interface StepPlayerManaRegenerationOptions {
  regenTickIntervalSeconds?: number;
}

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return normalizedValue;
};

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return normalizedValue;
};

export const spendPlayerMana = (
  playerState: PlayerState,
  options: SpendPlayerManaOptions = {}
): SpendPlayerManaResult => {
  const manaCost = expectPositiveFiniteNumber(options.manaCost ?? 1, 'options.manaCost');
  const regenDelaySeconds = expectNonNegativeFiniteNumber(
    options.regenDelaySeconds ?? DEFAULT_PLAYER_MANA_REGEN_DELAY_SECONDS,
    'options.regenDelaySeconds'
  );
  const regenTickIntervalSeconds = expectPositiveFiniteNumber(
    options.regenTickIntervalSeconds ?? DEFAULT_PLAYER_MANA_REGEN_TICK_INTERVAL_SECONDS,
    'options.regenTickIntervalSeconds'
  );
  const nextPlayerState = clonePlayerState(playerState);

  if (playerState.health <= 0) {
    return {
      nextPlayerState,
      spent: false,
      blockedReason: 'dead'
    };
  }

  if (playerState.mana < manaCost) {
    return {
      nextPlayerState,
      spent: false,
      blockedReason: 'insufficient-mana'
    };
  }

  nextPlayerState.mana = Math.max(0, playerState.mana - manaCost);
  nextPlayerState.manaRegenDelaySecondsRemaining = regenDelaySeconds;
  nextPlayerState.manaRegenTickSecondsRemaining = regenTickIntervalSeconds;
  return {
    nextPlayerState,
    spent: true,
    blockedReason: null
  };
};

export const stepPlayerManaRegeneration = (
  playerState: PlayerState,
  fixedDtSeconds: number,
  options: StepPlayerManaRegenerationOptions = {}
): PlayerState => {
  const fixedDt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const regenTickIntervalSeconds = expectPositiveFiniteNumber(
    options.regenTickIntervalSeconds ?? DEFAULT_PLAYER_MANA_REGEN_TICK_INTERVAL_SECONDS,
    'options.regenTickIntervalSeconds'
  );
  const nextPlayerState = clonePlayerState(playerState);
  if (fixedDt <= 0 || playerState.health <= 0 || playerState.mana >= playerState.maxMana) {
    nextPlayerState.mana = Math.min(playerState.mana, playerState.maxMana);
    return nextPlayerState;
  }

  let remainingDt = fixedDt;
  let delaySecondsRemaining = playerState.manaRegenDelaySecondsRemaining;
  if (delaySecondsRemaining > 0) {
    const elapsedDelaySeconds = Math.min(delaySecondsRemaining, remainingDt);
    delaySecondsRemaining = Math.max(0, delaySecondsRemaining - elapsedDelaySeconds);
    remainingDt = Math.max(0, remainingDt - elapsedDelaySeconds);
  }

  let mana = playerState.mana;
  let manaRegenTickSecondsRemaining = playerState.manaRegenTickSecondsRemaining;
  if (delaySecondsRemaining <= 0 && remainingDt > 0) {
    if (manaRegenTickSecondsRemaining <= 0) {
      manaRegenTickSecondsRemaining = regenTickIntervalSeconds;
    }

    while (remainingDt > 0 && mana < playerState.maxMana) {
      if (remainingDt < manaRegenTickSecondsRemaining) {
        manaRegenTickSecondsRemaining -= remainingDt;
        remainingDt = 0;
        break;
      }

      remainingDt -= manaRegenTickSecondsRemaining;
      mana = Math.min(playerState.maxMana, mana + 1);
      manaRegenTickSecondsRemaining = regenTickIntervalSeconds;
    }
  }

  nextPlayerState.mana = mana;
  nextPlayerState.manaRegenDelaySecondsRemaining = delaySecondsRemaining;
  nextPlayerState.manaRegenTickSecondsRemaining = manaRegenTickSecondsRemaining;
  return nextPlayerState;
};
