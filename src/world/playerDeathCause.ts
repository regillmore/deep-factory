export type PlayerDeathCauseSource =
  | 'fall'
  | 'drowning'
  | 'lava'
  | 'bomb-blast'
  | 'hostile-contact'
  | 'unknown';

export interface PlayerDeathCauseCandidate {
  source: Exclude<PlayerDeathCauseSource, 'unknown'>;
  damageApplied: number;
}

export interface ResolvedPlayerDeathCause {
  source: PlayerDeathCauseSource;
  damageApplied: number;
}

export interface PlayerDeathWorldTile {
  x: number;
  y: number;
}

export interface PlayerDeathCauseEvent extends ResolvedPlayerDeathCause {
  playerWorldTile: PlayerDeathWorldTile;
}

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const expectFiniteInteger = (value: number, label: string): number => {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be a finite integer`);
  }

  return value;
};

const normalizeDamageApplied = (damageApplied: number, label: string): number =>
  Math.max(0, Math.round(expectNonNegativeFiniteNumber(damageApplied, label)));

const clonePlayerDeathWorldTile = (
  playerWorldTile: PlayerDeathWorldTile,
  label: string
): PlayerDeathWorldTile => ({
  x: expectFiniteInteger(playerWorldTile.x, `${label}.x`),
  y: expectFiniteInteger(playerWorldTile.y, `${label}.y`)
});

export const resolvePlayerDeathCauseFromDamageSequence = (
  previousHealth: number,
  nextHealth: number,
  candidates: readonly PlayerDeathCauseCandidate[]
): ResolvedPlayerDeathCause | null => {
  const startingHealth = expectNonNegativeFiniteNumber(previousHealth, 'previousHealth');
  const endingHealth = expectNonNegativeFiniteNumber(nextHealth, 'nextHealth');
  if (!(startingHealth > 0) || endingHealth > 0) {
    return null;
  }

  let remainingHealth = startingHealth;
  for (const candidate of candidates) {
    const damageApplied = normalizeDamageApplied(
      candidate.damageApplied,
      `candidates[${candidate.source}].damageApplied`
    );
    if (damageApplied <= 0) {
      continue;
    }

    remainingHealth = Math.max(0, remainingHealth - damageApplied);
    if (remainingHealth <= 0) {
      return {
        source: candidate.source,
        damageApplied
      };
    }
  }

  const totalDamageApplied = Math.max(0, Math.round(startingHealth - endingHealth));
  if (totalDamageApplied <= 0) {
    return null;
  }

  return {
    source: 'unknown',
    damageApplied: totalDamageApplied
  };
};

export const createPlayerDeathCauseEvent = (
  resolvedDeathCause: ResolvedPlayerDeathCause | null,
  playerWorldTile: PlayerDeathWorldTile | null | undefined
): PlayerDeathCauseEvent | null => {
  if (resolvedDeathCause === null) {
    return null;
  }
  if (playerWorldTile === null || playerWorldTile === undefined) {
    throw new Error('playerWorldTile is required when creating a death cause event');
  }

  return {
    source: resolvedDeathCause.source,
    damageApplied: normalizeDamageApplied(
      resolvedDeathCause.damageApplied,
      'resolvedDeathCause.damageApplied'
    ),
    playerWorldTile: clonePlayerDeathWorldTile(playerWorldTile, 'playerWorldTile')
  };
};
