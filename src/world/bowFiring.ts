import { getPlayerCameraFocusPoint, type PlayerState } from './playerState';

export const BOW_ITEM_ID = 'bow';
export const ARROW_ITEM_ID = 'arrow';
export const DEFAULT_BOW_ARROW_SPEED = 360;
export const DEFAULT_BOW_ARROW_RADIUS = 3;
export const DEFAULT_BOW_ARROW_LIFETIME_SECONDS = 1.2;

export interface BowWorldPoint {
  x: number;
  y: number;
}

export interface BowVelocity {
  x: number;
  y: number;
}

export interface ArrowProjectileState {
  position: BowWorldPoint;
  velocity: BowVelocity;
  radius: number;
  secondsRemaining: number;
}

export interface CreateArrowProjectileStateFromBowFireOptions {
  speed?: number;
  radius?: number;
  lifetimeSeconds?: number;
}

export interface StepArrowProjectileStateOptions {
  fixedDtSeconds: number;
}

const DIRECTION_EPSILON = 1e-6;

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

const cloneBowWorldPoint = (point: BowWorldPoint): BowWorldPoint => ({
  x: expectFiniteNumber(point.x, 'point.x'),
  y: expectFiniteNumber(point.y, 'point.y')
});

const cloneBowVelocity = (velocity: BowVelocity): BowVelocity => ({
  x: expectFiniteNumber(velocity.x, 'velocity.x'),
  y: expectFiniteNumber(velocity.y, 'velocity.y')
});

const createBowFacingFallbackDirection = (
  playerState: Pick<PlayerState, 'facing'>
): BowVelocity => ({
  x: playerState.facing === 'left' ? -1 : 1,
  y: 0
});

const resolveBowFireDirection = (
  playerState: PlayerState,
  targetWorldPoint: BowWorldPoint
): BowVelocity => {
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const normalizedTargetWorldPoint = {
    x: expectFiniteNumber(targetWorldPoint.x, 'targetWorldPoint.x'),
    y: expectFiniteNumber(targetWorldPoint.y, 'targetWorldPoint.y')
  };
  const deltaX = normalizedTargetWorldPoint.x - originWorldPoint.x;
  const deltaY = normalizedTargetWorldPoint.y - originWorldPoint.y;
  const magnitude = Math.hypot(deltaX, deltaY);
  if (magnitude <= DIRECTION_EPSILON) {
    return createBowFacingFallbackDirection(playerState);
  }

  return {
    x: deltaX / magnitude,
    y: deltaY / magnitude
  };
};

export const createArrowProjectileState = (
  state: ArrowProjectileState
): ArrowProjectileState => ({
  position: cloneBowWorldPoint(state.position),
  velocity: cloneBowVelocity(state.velocity),
  radius: expectPositiveFiniteNumber(state.radius, 'state.radius'),
  secondsRemaining: expectNonNegativeFiniteNumber(
    state.secondsRemaining,
    'state.secondsRemaining'
  )
});

export const cloneArrowProjectileState = (
  state: ArrowProjectileState
): ArrowProjectileState => createArrowProjectileState(state);

export const createArrowProjectileStateFromBowFire = (
  playerState: PlayerState,
  targetWorldPoint: BowWorldPoint,
  options: CreateArrowProjectileStateFromBowFireOptions = {}
): ArrowProjectileState => {
  const speed = expectPositiveFiniteNumber(
    options.speed ?? DEFAULT_BOW_ARROW_SPEED,
    'options.speed'
  );
  const radius = expectPositiveFiniteNumber(
    options.radius ?? DEFAULT_BOW_ARROW_RADIUS,
    'options.radius'
  );
  const lifetimeSeconds = expectPositiveFiniteNumber(
    options.lifetimeSeconds ?? DEFAULT_BOW_ARROW_LIFETIME_SECONDS,
    'options.lifetimeSeconds'
  );
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const direction = resolveBowFireDirection(playerState, targetWorldPoint);

  return createArrowProjectileState({
    position: originWorldPoint,
    velocity: {
      x: direction.x * speed,
      y: direction.y * speed
    },
    radius,
    secondsRemaining: lifetimeSeconds
  });
};

export const stepArrowProjectileState = (
  state: ArrowProjectileState,
  options: StepArrowProjectileStateOptions
): ArrowProjectileState | null => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  if (state.secondsRemaining <= 0) {
    return null;
  }

  const stepSeconds = Math.min(state.secondsRemaining, fixedDtSeconds);
  const nextState = createArrowProjectileState({
    position: {
      x: state.position.x + state.velocity.x * stepSeconds,
      y: state.position.y + state.velocity.y * stepSeconds
    },
    velocity: state.velocity,
    radius: state.radius,
    secondsRemaining: Math.max(0, state.secondsRemaining - fixedDtSeconds)
  });

  return nextState.secondsRemaining > 0 ? nextState : null;
};
