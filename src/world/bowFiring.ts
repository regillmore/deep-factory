import { TILE_SIZE } from './constants';
import { getPlayerCameraFocusPoint, type PlayerState } from './playerState';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const BOW_ITEM_ID = 'bow';
export const ARROW_ITEM_ID = 'arrow';
export const DEFAULT_BOW_DRAW_COOLDOWN_SECONDS = 0.4;
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

export interface BowDrawCooldownState {
  secondsRemaining: number;
}

export interface ArrowProjectileState {
  position: BowWorldPoint;
  velocity: BowVelocity;
  radius: number;
  secondsRemaining: number;
}

export interface TryFireBowOptions extends CreateArrowProjectileStateFromBowFireOptions {
  cooldownSeconds?: number;
}

export interface TryFireBowResult {
  nextCooldownState: BowDrawCooldownState;
  arrowProjectileState: ArrowProjectileState | null;
  shotStarted: boolean;
  blockedReason: 'cooldown' | 'dead' | 'no-ammo' | null;
}

export interface CreateArrowProjectileStateFromBowFireOptions {
  speed?: number;
  radius?: number;
  lifetimeSeconds?: number;
}

export interface StepArrowProjectileStateOptions {
  fixedDtSeconds: number;
  world?: {
    getTile: (worldTileX: number, worldTileY: number) => number;
  };
  registry?: TileMetadataRegistry;
}

const DIRECTION_EPSILON = 1e-6;

interface SegmentIntersectionResult {
  time: number;
}

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
  start: BowWorldPoint,
  end: BowWorldPoint,
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
  start: BowWorldPoint,
  end: BowWorldPoint,
  radius: number
): { minTileX: number; maxTileX: number; minTileY: number; maxTileY: number } => ({
  minTileX: Math.floor((Math.min(start.x, end.x) - radius) / TILE_SIZE),
  maxTileX: Math.ceil((Math.max(start.x, end.x) + radius) / TILE_SIZE) - 1,
  minTileY: Math.floor((Math.min(start.y, end.y) - radius) / TILE_SIZE),
  maxTileY: Math.ceil((Math.max(start.y, end.y) + radius) / TILE_SIZE) - 1
});

const doesArrowProjectileHitSolidTerrain = (
  state: ArrowProjectileState,
  nextPosition: BowWorldPoint,
  world: NonNullable<StepArrowProjectileStateOptions['world']>,
  registry: TileMetadataRegistry
): boolean => {
  const bounds = resolveWorldTileBoundsForSegment(state.position, nextPosition, state.radius);

  for (let worldTileY = bounds.minTileY; worldTileY <= bounds.maxTileY; worldTileY += 1) {
    for (let worldTileX = bounds.minTileX; worldTileX <= bounds.maxTileX; worldTileX += 1) {
      const tileId = world.getTile(worldTileX, worldTileY);
      if (!isTileSolid(tileId, registry)) {
        continue;
      }

      const hit = resolveSegmentIntersectionTimeWithBounds(
        state.position,
        nextPosition,
        expandWorldBounds(
          worldTileX * TILE_SIZE,
          worldTileY * TILE_SIZE,
          (worldTileX + 1) * TILE_SIZE,
          (worldTileY + 1) * TILE_SIZE,
          state.radius
        )
      );
      if (hit !== null) {
        return true;
      }
    }
  }

  return false;
};

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

export const createBowDrawCooldownState = (
  secondsRemaining = 0
): BowDrawCooldownState => ({
  secondsRemaining: expectNonNegativeFiniteNumber(secondsRemaining, 'secondsRemaining')
});

export const cloneBowDrawCooldownState = (
  state: BowDrawCooldownState
): BowDrawCooldownState => ({
  secondsRemaining: expectNonNegativeFiniteNumber(
    state.secondsRemaining,
    'state.secondsRemaining'
  )
});

export const stepBowDrawCooldownState = (
  state: BowDrawCooldownState,
  fixedDtSeconds: number
): BowDrawCooldownState => ({
  secondsRemaining: Math.max(
    0,
    state.secondsRemaining - expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds')
  )
});

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

export const tryFireBow = (
  playerState: PlayerState,
  cooldownState: BowDrawCooldownState,
  carriedArrowCount: number,
  targetWorldPoint: BowWorldPoint,
  options: TryFireBowOptions = {}
): TryFireBowResult => {
  const normalizedCarriedArrowCount = expectNonNegativeFiniteNumber(
    carriedArrowCount,
    'carriedArrowCount'
  );
  const cooldownSeconds = expectNonNegativeFiniteNumber(
    options.cooldownSeconds ?? DEFAULT_BOW_DRAW_COOLDOWN_SECONDS,
    'options.cooldownSeconds'
  );
  const nextCooldownState = cloneBowDrawCooldownState(cooldownState);

  if (playerState.health <= 0) {
    return {
      nextCooldownState,
      arrowProjectileState: null,
      shotStarted: false,
      blockedReason: 'dead'
    };
  }

  if (cooldownState.secondsRemaining > 0) {
    return {
      nextCooldownState,
      arrowProjectileState: null,
      shotStarted: false,
      blockedReason: 'cooldown'
    };
  }

  if (normalizedCarriedArrowCount <= 0) {
    return {
      nextCooldownState,
      arrowProjectileState: null,
      shotStarted: false,
      blockedReason: 'no-ammo'
    };
  }

  nextCooldownState.secondsRemaining = cooldownSeconds;
  return {
    nextCooldownState,
    arrowProjectileState: createArrowProjectileStateFromBowFire(
      playerState,
      targetWorldPoint,
      options
    ),
    shotStarted: true,
    blockedReason: null
  };
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
  if (fixedDtSeconds <= 0) {
    return cloneArrowProjectileState(state);
  }

  const stepSeconds = Math.min(state.secondsRemaining, fixedDtSeconds);
  const nextPosition = {
    x: state.position.x + state.velocity.x * stepSeconds,
    y: state.position.y + state.velocity.y * stepSeconds
  };
  const registry = options.registry ?? TILE_METADATA;
  if (
    options.world !== undefined &&
    doesArrowProjectileHitSolidTerrain(state, nextPosition, options.world, registry)
  ) {
    return null;
  }

  const nextState = createArrowProjectileState({
    position: nextPosition,
    velocity: state.velocity,
    radius: state.radius,
    secondsRemaining: Math.max(0, state.secondsRemaining - fixedDtSeconds)
  });

  return nextState.secondsRemaining > 0 ? nextState : null;
};
