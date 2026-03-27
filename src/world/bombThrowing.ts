import {
  getPlayerCameraFocusPoint,
  type PlayerState
} from './playerState';

export const BOMB_ITEM_ID = 'bomb';
export const DEFAULT_THROWN_BOMB_SPEED = 180;
export const DEFAULT_THROWN_BOMB_RADIUS = 6;
export const DEFAULT_THROWN_BOMB_FUSE_SECONDS = 1.5;
export const DEFAULT_THROWN_BOMB_GRAVITY = 480;

export interface ThrownBombWorldPoint {
  x: number;
  y: number;
}

export interface ThrownBombVelocity {
  x: number;
  y: number;
}

export interface ThrownBombState {
  position: ThrownBombWorldPoint;
  velocity: ThrownBombVelocity;
  radius: number;
  secondsRemaining: number;
}

export interface CreateThrownBombStateFromThrowOptions {
  speed?: number;
  radius?: number;
  fuseSeconds?: number;
}

export interface StepThrownBombStateOptions {
  fixedDtSeconds: number;
  gravity?: number;
}

const DIRECTION_EPSILON = 1e-6;

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

const cloneThrownBombWorldPoint = (
  point: ThrownBombWorldPoint
): ThrownBombWorldPoint => ({
  x: expectFiniteNumber(point.x, 'point.x'),
  y: expectFiniteNumber(point.y, 'point.y')
});

const cloneThrownBombVelocity = (
  velocity: ThrownBombVelocity
): ThrownBombVelocity => ({
  x: expectFiniteNumber(velocity.x, 'velocity.x'),
  y: expectFiniteNumber(velocity.y, 'velocity.y')
});

const resolveThrownBombDirection = (
  playerState: PlayerState,
  targetWorldPoint: ThrownBombWorldPoint
): ThrownBombVelocity => {
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const normalizedTargetWorldPoint = {
    x: expectFiniteNumber(targetWorldPoint.x, 'targetWorldPoint.x'),
    y: expectFiniteNumber(targetWorldPoint.y, 'targetWorldPoint.y')
  };
  const deltaX = normalizedTargetWorldPoint.x - originWorldPoint.x;
  const deltaY = normalizedTargetWorldPoint.y - originWorldPoint.y;
  const magnitude = Math.hypot(deltaX, deltaY);

  if (magnitude <= DIRECTION_EPSILON) {
    return {
      x: playerState.facing === 'left' ? -1 : 1,
      y: 0
    };
  }

  return {
    x: deltaX / magnitude,
    y: deltaY / magnitude
  };
};

export const createThrownBombState = (
  options: Pick<ThrownBombState, 'position' | 'velocity' | 'radius' | 'secondsRemaining'>
): ThrownBombState => ({
  position: cloneThrownBombWorldPoint(options.position),
  velocity: cloneThrownBombVelocity(options.velocity),
  radius: expectPositiveFiniteNumber(options.radius, 'options.radius'),
  secondsRemaining: expectPositiveFiniteNumber(
    options.secondsRemaining,
    'options.secondsRemaining'
  )
});

export const cloneThrownBombState = (
  state: ThrownBombState
): ThrownBombState => ({
  position: cloneThrownBombWorldPoint(state.position),
  velocity: cloneThrownBombVelocity(state.velocity),
  radius: state.radius,
  secondsRemaining: state.secondsRemaining
});

export const createThrownBombStateFromThrow = (
  playerState: PlayerState,
  targetWorldPoint: ThrownBombWorldPoint,
  options: CreateThrownBombStateFromThrowOptions = {}
): ThrownBombState => {
  const speed = expectPositiveFiniteNumber(
    options.speed ?? DEFAULT_THROWN_BOMB_SPEED,
    'options.speed'
  );
  const radius = expectPositiveFiniteNumber(
    options.radius ?? DEFAULT_THROWN_BOMB_RADIUS,
    'options.radius'
  );
  const fuseSeconds = expectPositiveFiniteNumber(
    options.fuseSeconds ?? DEFAULT_THROWN_BOMB_FUSE_SECONDS,
    'options.fuseSeconds'
  );
  const position = getPlayerCameraFocusPoint(playerState);
  const direction = resolveThrownBombDirection(playerState, targetWorldPoint);

  return createThrownBombState({
    position,
    velocity: {
      x: direction.x * speed,
      y: direction.y * speed
    },
    radius,
    secondsRemaining: fuseSeconds
  });
};

export const stepThrownBombState = (
  state: ThrownBombState,
  options: StepThrownBombStateOptions
): ThrownBombState | null => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const gravity = expectFiniteNumber(
    options.gravity ?? DEFAULT_THROWN_BOMB_GRAVITY,
    'options.gravity'
  );

  if (fixedDtSeconds <= 0) {
    return cloneThrownBombState(state);
  }

  const nextSecondsRemaining = Math.max(0, state.secondsRemaining - fixedDtSeconds);
  if (nextSecondsRemaining <= 0) {
    return null;
  }

  const nextVelocity = {
    x: state.velocity.x,
    y: state.velocity.y + gravity * fixedDtSeconds
  };

  return {
    position: {
      x: state.position.x + nextVelocity.x * fixedDtSeconds,
      y: state.position.y + nextVelocity.y * fixedDtSeconds
    },
    velocity: nextVelocity,
    radius: state.radius,
    secondsRemaining: nextSecondsRemaining
  };
};
