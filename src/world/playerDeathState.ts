export interface PlayerDeathState {
  respawnSecondsRemaining: number;
}

export const DEFAULT_PLAYER_DEATH_RESPAWN_SECONDS = 1;
export const DEFAULT_PLAYER_RESPAWN_INVULNERABILITY_SECONDS = 1;

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

export const createPlayerDeathState = (
  respawnSecondsRemaining: number = DEFAULT_PLAYER_DEATH_RESPAWN_SECONDS
): PlayerDeathState => ({
  respawnSecondsRemaining: expectNonNegativeFiniteNumber(
    respawnSecondsRemaining,
    'respawnSecondsRemaining'
  )
});

export const clonePlayerDeathState = (state: PlayerDeathState): PlayerDeathState => ({
  respawnSecondsRemaining: expectNonNegativeFiniteNumber(
    state.respawnSecondsRemaining,
    'state.respawnSecondsRemaining'
  )
});

export const stepPlayerDeathState = (
  state: PlayerDeathState,
  fixedDtSeconds: number
): PlayerDeathState => ({
  respawnSecondsRemaining: Math.max(
    0,
    expectNonNegativeFiniteNumber(state.respawnSecondsRemaining, 'state.respawnSecondsRemaining') -
      expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds')
  )
});

export const isPlayerDeathStateRespawnReady = (state: PlayerDeathState): boolean =>
  expectNonNegativeFiniteNumber(state.respawnSecondsRemaining, 'state.respawnSecondsRemaining') <= 0;
