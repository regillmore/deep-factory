import type { WorldAabb } from './collision';
import {
  applyHostileSlimeDamage,
  cloneHostileSlimeState,
  getHostileSlimeAabb,
  type HostileSlimeFacing,
  type HostileSlimeState
} from './hostileSlimeState';
import { getPlayerCameraFocusPoint, type PlayerState } from './playerState';

export const STARTER_SPEAR_ITEM_ID = 'spear';
export const STARTER_SPEAR_THRUST_WINDUP_SECONDS = 0.06;
export const STARTER_SPEAR_THRUST_ACTIVE_SECONDS = 0.12;
export const STARTER_SPEAR_THRUST_RECOVERY_SECONDS = 0.16;
export const DEFAULT_STARTER_SPEAR_DAMAGE = 12;
export const DEFAULT_STARTER_SPEAR_REACH = 42;
export const DEFAULT_STARTER_SPEAR_HIT_RADIUS = 8;
export const DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED = 210;

export type StarterSpearThrustPhase = 'windup' | 'active' | 'recovery';

export interface StarterSpearDirection {
  x: number;
  y: number;
}

export interface StarterSpearThrustState {
  phase: StarterSpearThrustPhase;
  secondsRemaining: number;
  direction: StarterSpearDirection;
  hitEntityIds: number[];
}

export interface StarterSpearState {
  activeThrust: StarterSpearThrustState | null;
}

export interface StarterSpearHostileSlimeTarget {
  entityId: number;
  state: HostileSlimeState;
}

export interface StarterSpearHitEvent {
  entityId: number;
  nextHostileSlimeState: HostileSlimeState;
}

export interface TryStartStarterSpearThrustResult {
  state: StarterSpearState;
  started: boolean;
}

export interface StepStarterSpearStateOptions {
  playerState: PlayerState | null;
  hostileSlimes: readonly StarterSpearHostileSlimeTarget[];
  fixedDtSeconds: number;
  damage?: number;
  reach?: number;
  hitRadius?: number;
  knockbackSpeed?: number;
}

export interface StepStarterSpearStateResult {
  state: StarterSpearState;
  hitEvents: StarterSpearHitEvent[];
}

interface WorldPoint {
  x: number;
  y: number;
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

const cloneStarterSpearDirection = (direction: StarterSpearDirection): StarterSpearDirection => ({
  x: direction.x,
  y: direction.y
});

const normalizeStarterSpearDirection = (
  direction: StarterSpearDirection,
  label: string
): StarterSpearDirection => {
  const x = expectFiniteNumber(direction.x, `${label}.x`);
  const y = expectFiniteNumber(direction.y, `${label}.y`);
  const magnitude = Math.hypot(x, y);
  if (magnitude <= DIRECTION_EPSILON) {
    throw new Error(`${label} magnitude must be greater than 0`);
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
};

const cloneStarterSpearThrustState = (
  thrust: StarterSpearThrustState | null
): StarterSpearThrustState | null =>
  thrust === null
    ? null
    : {
        phase: thrust.phase,
        secondsRemaining: thrust.secondsRemaining,
        direction: cloneStarterSpearDirection(thrust.direction),
        hitEntityIds: [...thrust.hitEntityIds]
      };

const createStarterSpearThrustState = (
  direction: StarterSpearDirection
): StarterSpearThrustState => ({
  phase: 'windup',
  secondsRemaining: STARTER_SPEAR_THRUST_WINDUP_SECONDS,
  direction: normalizeStarterSpearDirection(direction, 'direction'),
  hitEntityIds: []
});

const expandWorldAabb = (aabb: WorldAabb, padding: number): WorldAabb => ({
  minX: aabb.minX - padding,
  minY: aabb.minY - padding,
  maxX: aabb.maxX + padding,
  maxY: aabb.maxY + padding
});

const doesLineSegmentIntersectAabb = (
  start: WorldPoint,
  end: WorldPoint,
  aabb: WorldAabb
): boolean => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  let minTime = 0;
  let maxTime = 1;

  const updateAxisRange = (
    delta: number,
    startAxis: number,
    minAxis: number,
    maxAxis: number
  ): boolean => {
    if (Math.abs(delta) <= DIRECTION_EPSILON) {
      return startAxis >= minAxis && startAxis <= maxAxis;
    }

    const inverseDelta = 1 / delta;
    let axisEnterTime = (minAxis - startAxis) * inverseDelta;
    let axisExitTime = (maxAxis - startAxis) * inverseDelta;
    if (axisEnterTime > axisExitTime) {
      [axisEnterTime, axisExitTime] = [axisExitTime, axisEnterTime];
    }

    minTime = Math.max(minTime, axisEnterTime);
    maxTime = Math.min(maxTime, axisExitTime);
    return minTime <= maxTime;
  };

  return (
    updateAxisRange(deltaX, start.x, aabb.minX, aabb.maxX) &&
    updateAxisRange(deltaY, start.y, aabb.minY, aabb.maxY)
  );
};

const resolveStarterSpearKnockbackFacing = (
  slimeState: HostileSlimeState,
  direction: StarterSpearDirection
): HostileSlimeFacing => {
  if (direction.x < -DIRECTION_EPSILON) {
    return 'left';
  }
  if (direction.x > DIRECTION_EPSILON) {
    return 'right';
  }
  return slimeState.facing;
};

const applyStarterSpearHit = (
  slimeState: HostileSlimeState,
  direction: StarterSpearDirection,
  knockbackSpeed: number,
  damage: number
): HostileSlimeState => {
  const nextState = cloneHostileSlimeState(slimeState);
  nextState.velocity = {
    x: direction.x * knockbackSpeed,
    y: direction.y * knockbackSpeed
  };
  nextState.grounded = false;
  nextState.facing = resolveStarterSpearKnockbackFacing(slimeState, direction);
  nextState.launchKind = null;
  return applyHostileSlimeDamage(nextState, damage);
};

const resolveStarterSpearHitEvents = (
  playerState: PlayerState,
  thrust: StarterSpearThrustState,
  hostileSlimes: readonly StarterSpearHostileSlimeTarget[],
  damage: number,
  reach: number,
  hitRadius: number,
  knockbackSpeed: number
): StarterSpearHitEvent[] => {
  const start = getPlayerCameraFocusPoint(playerState);
  const end = {
    x: start.x + thrust.direction.x * reach,
    y: start.y + thrust.direction.y * reach
  };
  const hitEvents: StarterSpearHitEvent[] = [];

  for (const hostileSlime of hostileSlimes) {
    if (thrust.hitEntityIds.includes(hostileSlime.entityId)) {
      continue;
    }
    if (
      !doesLineSegmentIntersectAabb(
        start,
        end,
        expandWorldAabb(getHostileSlimeAabb(hostileSlime.state), hitRadius)
      )
    ) {
      continue;
    }

    thrust.hitEntityIds.push(hostileSlime.entityId);
    hitEvents.push({
      entityId: hostileSlime.entityId,
      nextHostileSlimeState: applyStarterSpearHit(
        hostileSlime.state,
        thrust.direction,
        knockbackSpeed,
        damage
      )
    });
  }

  return hitEvents;
};

export const createStarterSpearState = (): StarterSpearState => ({
  activeThrust: null
});

export const cloneStarterSpearState = (state: StarterSpearState): StarterSpearState => ({
  activeThrust: cloneStarterSpearThrustState(state.activeThrust)
});

export const tryStartStarterSpearThrust = (
  state: StarterSpearState,
  direction: StarterSpearDirection
): TryStartStarterSpearThrustResult => {
  if (state.activeThrust !== null) {
    return {
      state: cloneStarterSpearState(state),
      started: false
    };
  }

  return {
    state: {
      activeThrust: createStarterSpearThrustState(direction)
    },
    started: true
  };
};

export const stepStarterSpearState = (
  state: StarterSpearState,
  options: StepStarterSpearStateOptions
): StepStarterSpearStateResult => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const damage = expectPositiveFiniteNumber(
    options.damage ?? DEFAULT_STARTER_SPEAR_DAMAGE,
    'options.damage'
  );
  const reach = expectPositiveFiniteNumber(
    options.reach ?? DEFAULT_STARTER_SPEAR_REACH,
    'options.reach'
  );
  const hitRadius = expectNonNegativeFiniteNumber(
    options.hitRadius ?? DEFAULT_STARTER_SPEAR_HIT_RADIUS,
    'options.hitRadius'
  );
  const knockbackSpeed = expectPositiveFiniteNumber(
    options.knockbackSpeed ?? DEFAULT_STARTER_SPEAR_KNOCKBACK_SPEED,
    'options.knockbackSpeed'
  );

  const nextState = cloneStarterSpearState(state);
  if (options.playerState === null) {
    nextState.activeThrust = null;
    return {
      state: nextState,
      hitEvents: []
    };
  }

  let activeThrust = nextState.activeThrust;
  if (activeThrust === null) {
    return {
      state: nextState,
      hitEvents: []
    };
  }

  let remainingDtSeconds = fixedDtSeconds;
  let didResolveActiveHitsThisStep = false;
  const hitEvents: StarterSpearHitEvent[] = [];
  while (activeThrust !== null && remainingDtSeconds > 0) {
    if (activeThrust.phase === 'windup') {
      if (remainingDtSeconds < activeThrust.secondsRemaining) {
        activeThrust.secondsRemaining -= remainingDtSeconds;
        remainingDtSeconds = 0;
        break;
      }

      remainingDtSeconds -= activeThrust.secondsRemaining;
      activeThrust = {
        phase: 'active',
        secondsRemaining: STARTER_SPEAR_THRUST_ACTIVE_SECONDS,
        direction: cloneStarterSpearDirection(activeThrust.direction),
        hitEntityIds: [...activeThrust.hitEntityIds]
      };
      nextState.activeThrust = activeThrust;
      continue;
    }

    if (activeThrust.phase === 'active') {
      if (!didResolveActiveHitsThisStep) {
        hitEvents.push(
          ...resolveStarterSpearHitEvents(
            options.playerState,
            activeThrust,
            options.hostileSlimes,
            damage,
            reach,
            hitRadius,
            knockbackSpeed
          )
        );
        didResolveActiveHitsThisStep = true;
      }

      if (remainingDtSeconds < activeThrust.secondsRemaining) {
        activeThrust.secondsRemaining -= remainingDtSeconds;
        remainingDtSeconds = 0;
        break;
      }

      remainingDtSeconds -= activeThrust.secondsRemaining;
      activeThrust = {
        phase: 'recovery',
        secondsRemaining: STARTER_SPEAR_THRUST_RECOVERY_SECONDS,
        direction: cloneStarterSpearDirection(activeThrust.direction),
        hitEntityIds: [...activeThrust.hitEntityIds]
      };
      nextState.activeThrust = activeThrust;
      continue;
    }

    if (remainingDtSeconds < activeThrust.secondsRemaining) {
      activeThrust.secondsRemaining -= remainingDtSeconds;
      remainingDtSeconds = 0;
      break;
    }

    remainingDtSeconds -= activeThrust.secondsRemaining;
    activeThrust = null;
    nextState.activeThrust = null;
  }

  if (
    activeThrust !== null &&
    activeThrust.phase === 'active' &&
    !didResolveActiveHitsThisStep &&
    fixedDtSeconds > 0
  ) {
    hitEvents.push(
      ...resolveStarterSpearHitEvents(
        options.playerState,
        activeThrust,
        options.hostileSlimes,
        damage,
        reach,
        hitRadius,
        knockbackSpeed
      )
    );
  }

  nextState.activeThrust = activeThrust;
  return {
    state: nextState,
    hitEvents
  };
};
