export type PlayerDeathCauseSource =
  | 'fall'
  | 'drowning'
  | 'lava'
  | 'hostile-contact'
  | 'unknown';

export interface PlayerDeathCauseCandidate {
  source: Exclude<PlayerDeathCauseSource, 'unknown'>;
  damageApplied: number;
}

export interface PlayerDeathCauseEvent {
  source: PlayerDeathCauseSource;
  damageApplied: number;
}

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const normalizeDamageApplied = (damageApplied: number, label: string): number =>
  Math.max(0, Math.round(expectNonNegativeFiniteNumber(damageApplied, label)));

export const resolvePlayerDeathCauseFromDamageSequence = (
  previousHealth: number,
  nextHealth: number,
  candidates: readonly PlayerDeathCauseCandidate[]
): PlayerDeathCauseEvent | null => {
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
