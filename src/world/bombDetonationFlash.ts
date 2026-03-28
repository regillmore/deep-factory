import type { ThrownBombBlastEvent, ThrownBombWorldPoint } from './bombThrowing';

export const DEFAULT_BOMB_DETONATION_FLASH_DURATION_SECONDS = 0.18;

const BOMB_DETONATION_FLASH_EXPIRY_EPSILON_SECONDS = 1e-9;

export interface BombDetonationFlashState {
  position: ThrownBombWorldPoint;
  radius: number;
  secondsRemaining: number;
  durationSeconds: number;
}

export interface CreateBombDetonationFlashStateOptions {
  position: ThrownBombWorldPoint;
  radius: number;
  secondsRemaining?: number;
  durationSeconds?: number;
}

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return normalizedValue;
};

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (normalizedValue <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return normalizedValue;
};

const cloneBombDetonationFlashWorldPoint = (
  point: ThrownBombWorldPoint
): ThrownBombWorldPoint => ({
  x: expectFiniteNumber(point.x, 'point.x'),
  y: expectFiniteNumber(point.y, 'point.y')
});

export const createBombDetonationFlashState = (
  options: CreateBombDetonationFlashStateOptions
): BombDetonationFlashState => {
  const durationSeconds = expectPositiveFiniteNumber(
    options.durationSeconds ?? DEFAULT_BOMB_DETONATION_FLASH_DURATION_SECONDS,
    'options.durationSeconds'
  );
  const secondsRemaining = expectNonNegativeFiniteNumber(
    options.secondsRemaining ?? durationSeconds,
    'options.secondsRemaining'
  );
  if (secondsRemaining > durationSeconds) {
    throw new Error(
      'options.secondsRemaining must be less than or equal to options.durationSeconds'
    );
  }

  return {
    position: cloneBombDetonationFlashWorldPoint(options.position),
    radius: expectPositiveFiniteNumber(options.radius, 'options.radius'),
    secondsRemaining,
    durationSeconds
  };
};

export const createBombDetonationFlashStateFromBlast = (
  blastEvent: Pick<ThrownBombBlastEvent, 'position' | 'blastRadius'>,
  options: Pick<CreateBombDetonationFlashStateOptions, 'durationSeconds'> = {}
): BombDetonationFlashState =>
  createBombDetonationFlashState({
    position: blastEvent.position,
    radius: blastEvent.blastRadius,
    durationSeconds: options.durationSeconds
  });

export const cloneBombDetonationFlashState = (
  state: BombDetonationFlashState
): BombDetonationFlashState => ({
  position: cloneBombDetonationFlashWorldPoint(state.position),
  radius: expectPositiveFiniteNumber(state.radius, 'state.radius'),
  secondsRemaining: expectNonNegativeFiniteNumber(
    state.secondsRemaining,
    'state.secondsRemaining'
  ),
  durationSeconds: expectPositiveFiniteNumber(state.durationSeconds, 'state.durationSeconds')
});

export const stepBombDetonationFlashState = (
  state: BombDetonationFlashState,
  fixedDtSeconds: number
): BombDetonationFlashState | null => {
  const normalizedFixedDtSeconds = expectNonNegativeFiniteNumber(
    fixedDtSeconds,
    'fixedDtSeconds'
  );
  if (normalizedFixedDtSeconds <= 0) {
    return cloneBombDetonationFlashState(state);
  }

  const nextState = cloneBombDetonationFlashState(state);
  nextState.secondsRemaining = Math.max(0, nextState.secondsRemaining - normalizedFixedDtSeconds);
  return nextState.secondsRemaining <= BOMB_DETONATION_FLASH_EXPIRY_EPSILON_SECONDS
    ? null
    : nextState;
};
