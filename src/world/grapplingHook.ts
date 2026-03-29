import { TILE_SIZE } from './constants';
import type { CollisionWorldView } from './collision';
import {
  clonePlayerState,
  getPlayerCameraFocusPoint,
  movePlayerStateWithCollisions,
  type PlayerState
} from './playerState';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const GRAPPLING_HOOK_ITEM_ID = 'grappling-hook';
export const DEFAULT_GRAPPLING_HOOK_SPEED = 540;
export const DEFAULT_GRAPPLING_HOOK_RADIUS = 4;
export const DEFAULT_GRAPPLING_HOOK_MAX_RANGE = TILE_SIZE * 20;
export const DEFAULT_GRAPPLING_HOOK_PULL_SPEED = DEFAULT_GRAPPLING_HOOK_SPEED;
export const DEFAULT_GRAPPLING_HOOK_RELEASE_DISTANCE = DEFAULT_GRAPPLING_HOOK_RADIUS;

export interface GrapplingHookWorldPoint {
  x: number;
  y: number;
}

export interface GrapplingHookVelocity {
  x: number;
  y: number;
}

export interface GrapplingHookLatchedTile {
  worldTileX: number;
  worldTileY: number;
  tileId: number;
}

export interface IdleGrapplingHookState {
  kind: 'idle';
}

export interface FiredGrapplingHookState {
  kind: 'fired';
  phase: 'in-flight' | 'latched';
  originWorldPoint: GrapplingHookWorldPoint;
  targetWorldPoint: GrapplingHookWorldPoint;
  hookWorldPoint: GrapplingHookWorldPoint;
  velocity: GrapplingHookVelocity;
  radius: number;
  maxRange: number;
  travelledDistance: number;
  latchedTile: GrapplingHookLatchedTile | null;
}

export type GrapplingHookState = IdleGrapplingHookState | FiredGrapplingHookState;

export interface TryFireGrapplingHookOptions {
  speed?: number;
  radius?: number;
  maxRange?: number;
}

export interface TryFireGrapplingHookResult {
  nextState: GrapplingHookState;
  hookFired: boolean;
  blockedReason: 'active-hook' | 'dead' | null;
}

export interface StepGrapplingHookStateOptions {
  fixedDtSeconds: number;
  world?: {
    getTile: (worldTileX: number, worldTileY: number) => number;
  };
  registry?: TileMetadataRegistry;
}

export interface StepGrapplingHookStateResult {
  nextState: GrapplingHookState;
}

export interface StepLatchedGrapplingHookTraversalOptions {
  fixedDtSeconds: number;
  world: CollisionWorldView;
  pullSpeed?: number;
  releaseDistance?: number;
}

export interface StepLatchedGrapplingHookTraversalResult {
  nextPlayerState: PlayerState;
  nextHookState: GrapplingHookState;
  detachedReason: 'reached-anchor' | null;
}

export interface GrapplingHookAnchorTileEdit {
  worldTileX: number;
  worldTileY: number;
  tileId: number;
}

export interface GrapplingHookAimRangeEvaluation {
  originWorldPoint: GrapplingHookWorldPoint;
  targetWorldPoint: GrapplingHookWorldPoint;
  distance: number;
  maxRange: number;
  withinRange: boolean;
}

export interface GrapplingHookPreviewTargetEvaluation extends GrapplingHookAimRangeEvaluation {
  targetSolid: boolean;
  latchReady: boolean;
}

const DIRECTION_EPSILON = 1e-6;

interface SegmentIntersectionResult {
  time: number;
}

interface GrapplingHookTerrainLatchCandidate extends SegmentIntersectionResult {
  worldTileX: number;
  worldTileY: number;
  tileId: number;
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

const cloneGrapplingHookWorldPoint = (
  point: GrapplingHookWorldPoint
): GrapplingHookWorldPoint => ({
  x: expectFiniteNumber(point.x, 'point.x'),
  y: expectFiniteNumber(point.y, 'point.y')
});

const cloneGrapplingHookVelocity = (
  velocity: GrapplingHookVelocity
): GrapplingHookVelocity => ({
  x: expectFiniteNumber(velocity.x, 'velocity.x'),
  y: expectFiniteNumber(velocity.y, 'velocity.y')
});

const cloneGrapplingHookLatchedTile = (
  latchedTile: GrapplingHookLatchedTile
): GrapplingHookLatchedTile => ({
  worldTileX: Math.trunc(expectFiniteNumber(latchedTile.worldTileX, 'latchedTile.worldTileX')),
  worldTileY: Math.trunc(expectFiniteNumber(latchedTile.worldTileY, 'latchedTile.worldTileY')),
  tileId: Math.trunc(expectFiniteNumber(latchedTile.tileId, 'latchedTile.tileId'))
});

const createGrapplingHookFacingFallbackDirection = (
  playerState: Pick<PlayerState, 'facing'>
): GrapplingHookVelocity => ({
  x: playerState.facing === 'left' ? -1 : 1,
  y: 0
});

const resolveGrapplingHookFireDirection = (
  playerState: PlayerState,
  targetWorldPoint: GrapplingHookWorldPoint
): GrapplingHookVelocity => {
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const normalizedTargetWorldPoint = cloneGrapplingHookWorldPoint(targetWorldPoint);
  const deltaX = normalizedTargetWorldPoint.x - originWorldPoint.x;
  const deltaY = normalizedTargetWorldPoint.y - originWorldPoint.y;
  const magnitude = Math.hypot(deltaX, deltaY);
  if (magnitude <= DIRECTION_EPSILON) {
    return createGrapplingHookFacingFallbackDirection(playerState);
  }

  return {
    x: deltaX / magnitude,
    y: deltaY / magnitude
  };
};

const expandWorldBounds = (
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  padding: number
): { minX: number; minY: number; maxX: number; maxY: number } => ({
  minX: minX - padding,
  minY: minY - padding,
  maxX: maxX + padding,
  maxY: maxY + padding
});

const resolveSegmentIntersectionTimeWithBounds = (
  start: GrapplingHookWorldPoint,
  end: GrapplingHookWorldPoint,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): SegmentIntersectionResult | null => {
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

  if (
    !updateAxisRange(deltaX, start.x, bounds.minX, bounds.maxX) ||
    !updateAxisRange(deltaY, start.y, bounds.minY, bounds.maxY)
  ) {
    return null;
  }

  return {
    time: minTime
  };
};

const resolveWorldTileBoundsForSegment = (
  start: GrapplingHookWorldPoint,
  end: GrapplingHookWorldPoint,
  radius: number
): { minTileX: number; maxTileX: number; minTileY: number; maxTileY: number } => ({
  minTileX: Math.floor((Math.min(start.x, end.x) - radius) / TILE_SIZE),
  maxTileX: Math.ceil((Math.max(start.x, end.x) + radius) / TILE_SIZE) - 1,
  minTileY: Math.floor((Math.min(start.y, end.y) - radius) / TILE_SIZE),
  maxTileY: Math.ceil((Math.max(start.y, end.y) + radius) / TILE_SIZE) - 1
});

const resolveSegmentPointAtTime = (
  start: GrapplingHookWorldPoint,
  end: GrapplingHookWorldPoint,
  time: number
): GrapplingHookWorldPoint => {
  const normalizedTime = expectFiniteNumber(time, 'time');
  return {
    x: start.x + (end.x - start.x) * normalizedTime,
    y: start.y + (end.y - start.y) * normalizedTime
  };
};

const resolveGrapplingHookTerrainLatch = (
  state: FiredGrapplingHookState,
  nextPosition: GrapplingHookWorldPoint,
  world: NonNullable<StepGrapplingHookStateOptions['world']>,
  registry: TileMetadataRegistry
): GrapplingHookTerrainLatchCandidate | null => {
  const bounds = resolveWorldTileBoundsForSegment(
    state.hookWorldPoint,
    nextPosition,
    state.radius
  );
  let bestHit: GrapplingHookTerrainLatchCandidate | null = null;

  for (let worldTileY = bounds.minTileY; worldTileY <= bounds.maxTileY; worldTileY += 1) {
    for (let worldTileX = bounds.minTileX; worldTileX <= bounds.maxTileX; worldTileX += 1) {
      const tileId = world.getTile(worldTileX, worldTileY);
      if (!isTileSolid(tileId, registry)) {
        continue;
      }

      const hit = resolveSegmentIntersectionTimeWithBounds(
        state.hookWorldPoint,
        nextPosition,
        expandWorldBounds(
          worldTileX * TILE_SIZE,
          worldTileY * TILE_SIZE,
          (worldTileX + 1) * TILE_SIZE,
          (worldTileY + 1) * TILE_SIZE,
          state.radius
        )
      );
      if (hit === null) {
        continue;
      }

      if (
        bestHit === null ||
        hit.time < bestHit.time - DIRECTION_EPSILON ||
        (Math.abs(hit.time - bestHit.time) <= DIRECTION_EPSILON &&
          (worldTileY < bestHit.worldTileY ||
            (worldTileY === bestHit.worldTileY && worldTileX < bestHit.worldTileX)))
      ) {
        bestHit = {
          time: hit.time,
          worldTileX,
          worldTileY,
          tileId
        };
      }
    }
  }

  return bestHit;
};

const createStoppedPlayerState = (state: PlayerState): PlayerState => {
  const clonedState = clonePlayerState(state);
  return {
    ...clonedState,
    velocity: {
      x: 0,
      y: 0
    }
  };
};

const resolveDistanceBetweenGrapplingHookTargetAndPlayerFocus = (
  playerState: PlayerState,
  targetWorldPoint: GrapplingHookWorldPoint
): { deltaX: number; deltaY: number; distance: number } => {
  const playerFocusPoint = getPlayerCameraFocusPoint(playerState);
  const deltaX = targetWorldPoint.x - playerFocusPoint.x;
  const deltaY = targetWorldPoint.y - playerFocusPoint.y;
  return {
    deltaX,
    deltaY,
    distance: Math.hypot(deltaX, deltaY)
  };
};

export const createIdleGrapplingHookState = (): GrapplingHookState => ({
  kind: 'idle'
});

export const createGrapplingHookState = (
  state: GrapplingHookState = createIdleGrapplingHookState()
): GrapplingHookState => {
  if (state.kind === 'idle') {
    return createIdleGrapplingHookState();
  }

  const latchedTile =
    state.latchedTile === null ? null : cloneGrapplingHookLatchedTile(state.latchedTile);
  if (state.phase === 'latched' && latchedTile === null) {
    throw new Error('latched grappling-hook states require latchedTile');
  }
  if (state.phase === 'in-flight' && latchedTile !== null) {
    throw new Error('in-flight grappling-hook states cannot carry latchedTile');
  }

  return {
    kind: 'fired',
    phase: state.phase,
    originWorldPoint: cloneGrapplingHookWorldPoint(state.originWorldPoint),
    targetWorldPoint: cloneGrapplingHookWorldPoint(state.targetWorldPoint),
    hookWorldPoint: cloneGrapplingHookWorldPoint(state.hookWorldPoint),
    velocity: cloneGrapplingHookVelocity(state.velocity),
    radius: expectPositiveFiniteNumber(state.radius, 'state.radius'),
    maxRange: expectPositiveFiniteNumber(state.maxRange, 'state.maxRange'),
    travelledDistance: expectNonNegativeFiniteNumber(
      state.travelledDistance,
      'state.travelledDistance'
    ),
    latchedTile
  };
};

export const cloneGrapplingHookState = (state: GrapplingHookState): GrapplingHookState =>
  createGrapplingHookState(state);

export const clearGrapplingHookState = (): GrapplingHookState => createIdleGrapplingHookState();

export const isGrapplingHookActive = (state: GrapplingHookState): boolean => state.kind !== 'idle';

export const isGrapplingHookLatched = (
  state: GrapplingHookState
): state is FiredGrapplingHookState => state.kind === 'fired' && state.phase === 'latched';

export const evaluateGrapplingHookAimRange = (
  playerState: PlayerState,
  targetWorldPoint: GrapplingHookWorldPoint,
  options: Pick<TryFireGrapplingHookOptions, 'maxRange'> = {}
): GrapplingHookAimRangeEvaluation => {
  const maxRange = expectPositiveFiniteNumber(
    options.maxRange ?? DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
    'options.maxRange'
  );
  const normalizedTargetWorldPoint = cloneGrapplingHookWorldPoint(targetWorldPoint);
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const distanceToTarget = resolveDistanceBetweenGrapplingHookTargetAndPlayerFocus(
    playerState,
    normalizedTargetWorldPoint
  );

  return {
    originWorldPoint,
    targetWorldPoint: normalizedTargetWorldPoint,
    distance: distanceToTarget.distance,
    maxRange,
    withinRange: distanceToTarget.distance <= maxRange + DIRECTION_EPSILON
  };
};

export const evaluateGrapplingHookPreviewTarget = (
  playerState: PlayerState,
  targetWorldPoint: GrapplingHookWorldPoint,
  targetTileId: number,
  options: Pick<TryFireGrapplingHookOptions, 'maxRange'> & {
    registry?: TileMetadataRegistry;
  } = {}
): GrapplingHookPreviewTargetEvaluation => {
  const rangeEvaluation = evaluateGrapplingHookAimRange(playerState, targetWorldPoint, {
    maxRange: options.maxRange
  });
  const targetSolid = isTileSolid(targetTileId, options.registry ?? TILE_METADATA);

  return {
    ...rangeEvaluation,
    targetSolid,
    latchReady: rangeEvaluation.withinRange && targetSolid
  };
};

export const shouldDetachLatchedGrapplingHookForTileEdit = (
  grapplingHookState: GrapplingHookState,
  tileEdit: GrapplingHookAnchorTileEdit,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  if (!isGrapplingHookLatched(grapplingHookState) || grapplingHookState.latchedTile === null) {
    return false;
  }

  if (
    tileEdit.worldTileX !== grapplingHookState.latchedTile.worldTileX ||
    tileEdit.worldTileY !== grapplingHookState.latchedTile.worldTileY
  ) {
    return false;
  }

  return !isTileSolid(tileEdit.tileId, registry);
};

export const stepLatchedGrapplingHookTraversal = (
  playerState: PlayerState,
  grapplingHookState: GrapplingHookState,
  options: StepLatchedGrapplingHookTraversalOptions
): StepLatchedGrapplingHookTraversalResult => {
  const clonedPlayerState = clonePlayerState(playerState);
  const clonedHookState = cloneGrapplingHookState(grapplingHookState);
  if (!isGrapplingHookLatched(grapplingHookState)) {
    return {
      nextPlayerState: clonedPlayerState,
      nextHookState: clonedHookState,
      detachedReason: null
    };
  }

  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const pullSpeed = expectPositiveFiniteNumber(
    options.pullSpeed ?? DEFAULT_GRAPPLING_HOOK_PULL_SPEED,
    'options.pullSpeed'
  );
  const releaseDistance = expectNonNegativeFiniteNumber(
    options.releaseDistance ?? DEFAULT_GRAPPLING_HOOK_RELEASE_DISTANCE,
    'options.releaseDistance'
  );
  if (fixedDtSeconds <= 0) {
    return {
      nextPlayerState: clonedPlayerState,
      nextHookState: clonedHookState,
      detachedReason: null
    };
  }

  const initialAnchorDistance = resolveDistanceBetweenGrapplingHookTargetAndPlayerFocus(
    playerState,
    grapplingHookState.hookWorldPoint
  );
  if (initialAnchorDistance.distance <= releaseDistance + DIRECTION_EPSILON) {
    return {
      nextPlayerState: createStoppedPlayerState(playerState),
      nextHookState: clearGrapplingHookState(),
      detachedReason: 'reached-anchor'
    };
  }

  const stepDistance = Math.min(pullSpeed * fixedDtSeconds, initialAnchorDistance.distance);
  if (stepDistance <= DIRECTION_EPSILON) {
    return {
      nextPlayerState: clonedPlayerState,
      nextHookState: clonedHookState,
      detachedReason: null
    };
  }

  const stepSpeed = stepDistance / fixedDtSeconds;
  const pulledPlayerState = movePlayerStateWithCollisions(
    options.world,
    {
      ...clonePlayerState(playerState),
      velocity: {
        x: (initialAnchorDistance.deltaX / initialAnchorDistance.distance) * stepSpeed,
        y: (initialAnchorDistance.deltaY / initialAnchorDistance.distance) * stepSpeed
      }
    },
    fixedDtSeconds
  );
  const remainingAnchorDistance = resolveDistanceBetweenGrapplingHookTargetAndPlayerFocus(
    pulledPlayerState,
    grapplingHookState.hookWorldPoint
  );
  if (remainingAnchorDistance.distance <= releaseDistance + DIRECTION_EPSILON) {
    return {
      nextPlayerState: createStoppedPlayerState(pulledPlayerState),
      nextHookState: clearGrapplingHookState(),
      detachedReason: 'reached-anchor'
    };
  }

  return {
    nextPlayerState: pulledPlayerState,
    nextHookState: createGrapplingHookState(grapplingHookState),
    detachedReason: null
  };
};

export const createFiredGrapplingHookStateFromUse = (
  playerState: PlayerState,
  targetWorldPoint: GrapplingHookWorldPoint,
  options: TryFireGrapplingHookOptions = {}
): GrapplingHookState => {
  const speed = expectPositiveFiniteNumber(
    options.speed ?? DEFAULT_GRAPPLING_HOOK_SPEED,
    'options.speed'
  );
  const radius = expectPositiveFiniteNumber(
    options.radius ?? DEFAULT_GRAPPLING_HOOK_RADIUS,
    'options.radius'
  );
  const maxRange = expectPositiveFiniteNumber(
    options.maxRange ?? DEFAULT_GRAPPLING_HOOK_MAX_RANGE,
    'options.maxRange'
  );
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const direction = resolveGrapplingHookFireDirection(playerState, targetWorldPoint);

  return createGrapplingHookState({
    kind: 'fired',
    phase: 'in-flight',
    originWorldPoint,
    targetWorldPoint: cloneGrapplingHookWorldPoint(targetWorldPoint),
    hookWorldPoint: originWorldPoint,
    velocity: {
      x: direction.x * speed,
      y: direction.y * speed
    },
    radius,
    maxRange,
    travelledDistance: 0,
    latchedTile: null
  });
};

export const tryFireGrapplingHook = (
  playerState: PlayerState,
  grapplingHookState: GrapplingHookState,
  targetWorldPoint: GrapplingHookWorldPoint,
  options: TryFireGrapplingHookOptions = {}
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
    nextState: createFiredGrapplingHookStateFromUse(playerState, targetWorldPoint, options),
    hookFired: true,
    blockedReason: null
  };
};

export const stepGrapplingHookState = (
  state: GrapplingHookState,
  options: StepGrapplingHookStateOptions
): StepGrapplingHookStateResult => {
  if (state.kind === 'idle') {
    return {
      nextState: createIdleGrapplingHookState()
    };
  }

  if (state.phase === 'latched') {
    return {
      nextState: createGrapplingHookState(state)
    };
  }

  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  if (fixedDtSeconds <= 0) {
    return {
      nextState: createGrapplingHookState(state)
    };
  }

  const speed = Math.hypot(state.velocity.x, state.velocity.y);
  if (speed <= DIRECTION_EPSILON) {
    return {
      nextState: clearGrapplingHookState()
    };
  }

  const remainingRange = Math.max(0, state.maxRange - state.travelledDistance);
  if (remainingRange <= DIRECTION_EPSILON) {
    return {
      nextState: clearGrapplingHookState()
    };
  }

  const stepDistance = Math.min(speed * fixedDtSeconds, remainingRange);
  const stepTimeSeconds = stepDistance / speed;
  const nextPosition = {
    x: state.hookWorldPoint.x + state.velocity.x * stepTimeSeconds,
    y: state.hookWorldPoint.y + state.velocity.y * stepTimeSeconds
  };
  const registry = options.registry ?? TILE_METADATA;
  const terrainLatch =
    options.world === undefined
      ? null
      : resolveGrapplingHookTerrainLatch(state, nextPosition, options.world, registry);
  if (terrainLatch !== null) {
    return {
      nextState: createGrapplingHookState({
        ...state,
        phase: 'latched',
        hookWorldPoint: resolveSegmentPointAtTime(
          state.hookWorldPoint,
          nextPosition,
          terrainLatch.time
        ),
        travelledDistance: state.travelledDistance + stepDistance * terrainLatch.time,
        velocity: {
          x: 0,
          y: 0
        },
        latchedTile: {
          worldTileX: terrainLatch.worldTileX,
          worldTileY: terrainLatch.worldTileY,
          tileId: terrainLatch.tileId
        }
      })
    };
  }

  const nextTravelledDistance = state.travelledDistance + stepDistance;
  if (nextTravelledDistance >= state.maxRange - DIRECTION_EPSILON) {
    return {
      nextState: clearGrapplingHookState()
    };
  }

  return {
    nextState: createGrapplingHookState({
      ...state,
      hookWorldPoint: nextPosition,
      travelledDistance: nextTravelledDistance
    })
  };
};
