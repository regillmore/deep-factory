import { getPlayerCameraFocusPoint, type PlayerState } from './playerState';

export const GRAPPLING_HOOK_ITEM_ID = 'grappling-hook';

export interface GrapplingHookWorldPoint {
  x: number;
  y: number;
}

export interface IdleGrapplingHookState {
  kind: 'idle';
}

export interface FiredGrapplingHookState {
  kind: 'fired';
  originWorldPoint: GrapplingHookWorldPoint;
  targetWorldPoint: GrapplingHookWorldPoint;
}

export type GrapplingHookState = IdleGrapplingHookState | FiredGrapplingHookState;

export interface TryFireGrapplingHookResult {
  nextState: GrapplingHookState;
  hookFired: boolean;
  blockedReason: 'active-hook' | 'dead' | null;
}

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const cloneGrapplingHookWorldPoint = (
  point: GrapplingHookWorldPoint
): GrapplingHookWorldPoint => ({
  x: expectFiniteNumber(point.x, 'point.x'),
  y: expectFiniteNumber(point.y, 'point.y')
});

export const createIdleGrapplingHookState = (): GrapplingHookState => ({
  kind: 'idle'
});

export const createGrapplingHookState = (
  state: GrapplingHookState = createIdleGrapplingHookState()
): GrapplingHookState => {
  if (state.kind === 'idle') {
    return createIdleGrapplingHookState();
  }

  return {
    kind: 'fired',
    originWorldPoint: cloneGrapplingHookWorldPoint(state.originWorldPoint),
    targetWorldPoint: cloneGrapplingHookWorldPoint(state.targetWorldPoint)
  };
};

export const cloneGrapplingHookState = (state: GrapplingHookState): GrapplingHookState =>
  createGrapplingHookState(state);

export const clearGrapplingHookState = (): GrapplingHookState => createIdleGrapplingHookState();

export const isGrapplingHookActive = (state: GrapplingHookState): boolean => state.kind !== 'idle';

export const createFiredGrapplingHookStateFromUse = (
  playerState: PlayerState,
  targetWorldPoint: GrapplingHookWorldPoint
): GrapplingHookState => ({
  kind: 'fired',
  originWorldPoint: getPlayerCameraFocusPoint(playerState),
  targetWorldPoint: cloneGrapplingHookWorldPoint(targetWorldPoint)
});

export const tryFireGrapplingHook = (
  playerState: PlayerState,
  grapplingHookState: GrapplingHookState,
  targetWorldPoint: GrapplingHookWorldPoint
): TryFireGrapplingHookResult => {
  if (playerState.health <= 0) {
    return {
      nextState: cloneGrapplingHookState(grapplingHookState),
      hookFired: false,
      blockedReason: 'dead'
    };
  }

  if (isGrapplingHookActive(grapplingHookState)) {
    return {
      nextState: cloneGrapplingHookState(grapplingHookState),
      hookFired: false,
      blockedReason: 'active-hook'
    };
  }

  return {
    nextState: createFiredGrapplingHookStateFromUse(playerState, targetWorldPoint),
    hookFired: true,
    blockedReason: null
  };
};
