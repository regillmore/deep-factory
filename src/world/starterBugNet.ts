import type { WorldAabb } from './collision';
import { getPassiveBunnyAabb, type PassiveBunnyFacing, type PassiveBunnyState } from './passiveBunnyState';
import { getPlayerAabb, type PlayerState } from './playerState';

export const STARTER_BUG_NET_ITEM_ID = 'bug-net';
export const BUNNY_ITEM_ID = 'bunny';
export const STARTER_BUG_NET_SWING_WINDUP_SECONDS = 0.08;
export const STARTER_BUG_NET_SWING_ACTIVE_SECONDS = 0.1;
export const STARTER_BUG_NET_SWING_RECOVERY_SECONDS = 0.14;
export const DEFAULT_STARTER_BUG_NET_REACH = 26;
export const DEFAULT_STARTER_BUG_NET_FRONT_OVERLAP = 2;
export const DEFAULT_STARTER_BUG_NET_VERTICAL_INSET = 4;

export type StarterBugNetSwingPhase = 'windup' | 'active' | 'recovery';

export interface StarterBugNetSwingState {
  phase: StarterBugNetSwingPhase;
  secondsRemaining: number;
  facing: PassiveBunnyFacing;
  capturedEntityId: number | null;
}

export interface StarterBugNetState {
  activeSwing: StarterBugNetSwingState | null;
}

export interface StarterBugNetPassiveBunnyTarget {
  entityId: number;
  state: PassiveBunnyState;
}

export interface StarterBugNetCaptureEvent {
  entityId: number;
}

export interface TryStartStarterBugNetSwingResult {
  state: StarterBugNetState;
  started: boolean;
}

export interface StepStarterBugNetStateOptions {
  playerState: PlayerState | null;
  passiveBunnies: readonly StarterBugNetPassiveBunnyTarget[];
  fixedDtSeconds: number;
  reach?: number;
  frontOverlap?: number;
  verticalInset?: number;
}

export interface StepStarterBugNetStateResult {
  state: StarterBugNetState;
  captureEvents: StarterBugNetCaptureEvent[];
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

const cloneStarterBugNetSwingState = (
  swing: StarterBugNetSwingState | null
): StarterBugNetSwingState | null =>
  swing === null
    ? null
    : {
        phase: swing.phase,
        secondsRemaining: swing.secondsRemaining,
        facing: swing.facing,
        capturedEntityId: swing.capturedEntityId
      };

const cloneStarterBugNetState = (state: StarterBugNetState): StarterBugNetState => ({
  activeSwing: cloneStarterBugNetSwingState(state.activeSwing)
});

const createStarterBugNetSwingState = (
  facing: PassiveBunnyFacing
): StarterBugNetSwingState => ({
  phase: 'windup',
  secondsRemaining: STARTER_BUG_NET_SWING_WINDUP_SECONDS,
  facing,
  capturedEntityId: null
});

const doesAabbOverlap = (left: WorldAabb, right: WorldAabb): boolean =>
  left.minX < right.maxX &&
  left.maxX > right.minX &&
  left.minY < right.maxY &&
  left.maxY > right.minY;

const createStarterBugNetHitbox = (
  playerState: PlayerState,
  facing: PassiveBunnyFacing,
  reach: number,
  frontOverlap: number,
  verticalInset: number
): WorldAabb => {
  const playerAabb = getPlayerAabb(playerState);
  const minY = playerAabb.minY + verticalInset;
  const maxY = playerAabb.maxY - verticalInset;
  if (facing === 'left') {
    return {
      minX: playerAabb.minX - reach,
      maxX: playerAabb.minX + frontOverlap,
      minY,
      maxY
    };
  }

  return {
    minX: playerAabb.maxX - frontOverlap,
    maxX: playerAabb.maxX + reach,
    minY,
    maxY
  };
};

const getDistanceSquaredToPlayer = (
  playerState: PlayerState,
  passiveBunnyState: PassiveBunnyState
): number => {
  const deltaX = passiveBunnyState.position.x - playerState.position.x;
  const deltaY = passiveBunnyState.position.y - playerState.position.y;
  return deltaX * deltaX + deltaY * deltaY;
};

const resolveStarterBugNetCaptureEvent = (
  playerState: PlayerState,
  swing: StarterBugNetSwingState,
  passiveBunnies: readonly StarterBugNetPassiveBunnyTarget[],
  reach: number,
  frontOverlap: number,
  verticalInset: number
): StarterBugNetCaptureEvent | null => {
  if (swing.capturedEntityId !== null) {
    return null;
  }

  const hitbox = createStarterBugNetHitbox(
    playerState,
    swing.facing,
    reach,
    frontOverlap,
    verticalInset
  );
  const captureCandidate = passiveBunnies
    .filter((passiveBunny) => doesAabbOverlap(hitbox, getPassiveBunnyAabb(passiveBunny.state)))
    .map((passiveBunny) => ({
      entityId: passiveBunny.entityId,
      distanceSquared: getDistanceSquaredToPlayer(playerState, passiveBunny.state)
    }))
    .sort((left, right) => {
      if (left.distanceSquared !== right.distanceSquared) {
        return left.distanceSquared - right.distanceSquared;
      }

      return left.entityId - right.entityId;
    })[0];

  return captureCandidate === undefined ? null : { entityId: captureCandidate.entityId };
};

const resolveActiveSwingCapture = (
  playerState: PlayerState,
  swing: StarterBugNetSwingState,
  passiveBunnies: readonly StarterBugNetPassiveBunnyTarget[],
  reach: number,
  frontOverlap: number,
  verticalInset: number
): StarterBugNetCaptureEvent[] => {
  const captureEvent = resolveStarterBugNetCaptureEvent(
    playerState,
    swing,
    passiveBunnies,
    reach,
    frontOverlap,
    verticalInset
  );
  if (captureEvent === null) {
    return [];
  }

  swing.capturedEntityId = captureEvent.entityId;
  return [captureEvent];
};

export const createStarterBugNetState = (): StarterBugNetState => ({
  activeSwing: null
});

export const tryStartStarterBugNetSwing = (
  state: StarterBugNetState,
  facing: PassiveBunnyFacing
): TryStartStarterBugNetSwingResult => {
  if (state.activeSwing !== null) {
    return {
      state: cloneStarterBugNetState(state),
      started: false
    };
  }

  return {
    state: {
      activeSwing: createStarterBugNetSwingState(facing)
    },
    started: true
  };
};

export const stepStarterBugNetState = (
  state: StarterBugNetState,
  options: StepStarterBugNetStateOptions
): StepStarterBugNetStateResult => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const reach = expectNonNegativeFiniteNumber(
    options.reach ?? DEFAULT_STARTER_BUG_NET_REACH,
    'options.reach'
  );
  const frontOverlap = expectNonNegativeFiniteNumber(
    options.frontOverlap ?? DEFAULT_STARTER_BUG_NET_FRONT_OVERLAP,
    'options.frontOverlap'
  );
  const verticalInset = expectNonNegativeFiniteNumber(
    options.verticalInset ?? DEFAULT_STARTER_BUG_NET_VERTICAL_INSET,
    'options.verticalInset'
  );

  const nextState = cloneStarterBugNetState(state);
  if (options.playerState === null) {
    nextState.activeSwing = null;
    return {
      state: nextState,
      captureEvents: []
    };
  }

  let activeSwing = nextState.activeSwing;
  if (activeSwing === null) {
    return {
      state: nextState,
      captureEvents: []
    };
  }

  let remainingDtSeconds = fixedDtSeconds;
  let didResolveActiveCaptureThisStep = false;
  const captureEvents: StarterBugNetCaptureEvent[] = [];
  while (activeSwing !== null && remainingDtSeconds > 0) {
    if (activeSwing.phase === 'windup') {
      if (remainingDtSeconds < activeSwing.secondsRemaining) {
        activeSwing.secondsRemaining -= remainingDtSeconds;
        remainingDtSeconds = 0;
        break;
      }

      remainingDtSeconds -= activeSwing.secondsRemaining;
      activeSwing = {
        phase: 'active',
        secondsRemaining: STARTER_BUG_NET_SWING_ACTIVE_SECONDS,
        facing: activeSwing.facing,
        capturedEntityId: activeSwing.capturedEntityId
      };
      nextState.activeSwing = activeSwing;
      continue;
    }

    if (activeSwing.phase === 'active') {
      if (!didResolveActiveCaptureThisStep) {
        captureEvents.push(
          ...resolveActiveSwingCapture(
            options.playerState,
            activeSwing,
            options.passiveBunnies,
            reach,
            frontOverlap,
            verticalInset
          )
        );
        didResolveActiveCaptureThisStep = true;
      }

      if (remainingDtSeconds < activeSwing.secondsRemaining) {
        activeSwing.secondsRemaining -= remainingDtSeconds;
        remainingDtSeconds = 0;
        break;
      }

      remainingDtSeconds -= activeSwing.secondsRemaining;
      activeSwing = {
        phase: 'recovery',
        secondsRemaining: STARTER_BUG_NET_SWING_RECOVERY_SECONDS,
        facing: activeSwing.facing,
        capturedEntityId: activeSwing.capturedEntityId
      };
      nextState.activeSwing = activeSwing;
      continue;
    }

    if (remainingDtSeconds < activeSwing.secondsRemaining) {
      activeSwing.secondsRemaining -= remainingDtSeconds;
      remainingDtSeconds = 0;
      break;
    }

    remainingDtSeconds -= activeSwing.secondsRemaining;
    activeSwing = null;
    nextState.activeSwing = null;
  }

  if (
    activeSwing !== null &&
    activeSwing.phase === 'active' &&
    !didResolveActiveCaptureThisStep &&
    fixedDtSeconds > 0
  ) {
    captureEvents.push(
      ...resolveActiveSwingCapture(
        options.playerState,
        activeSwing,
        options.passiveBunnies,
        reach,
        frontOverlap,
        verticalInset
      )
    );
  }

  nextState.activeSwing = activeSwing;
  return {
    state: nextState,
    captureEvents
  };
};
