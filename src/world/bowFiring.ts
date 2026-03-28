import { TILE_SIZE } from './constants';
import {
  applyHostileSlimeDamage,
  cloneHostileSlimeState,
  getHostileSlimeAabb,
  type HostileSlimeFacing,
  type HostileSlimeState
} from './hostileSlimeState';
import { getPlayerCameraFocusPoint, type PlayerState } from './playerState';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const BOW_ITEM_ID = 'bow';
export const ARROW_ITEM_ID = 'arrow';
export const DEFAULT_BOW_DRAW_COOLDOWN_SECONDS = 0.4;
export const DEFAULT_BOW_ARROW_SPEED = 360;
export const DEFAULT_BOW_ARROW_RADIUS = 3;
export const DEFAULT_BOW_ARROW_LIFETIME_SECONDS = 1.2;
export const DEFAULT_BOW_ARROW_DAMAGE = 10;
export const DEFAULT_BOW_ARROW_KNOCKBACK_SPEED = 150;

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

export interface ArrowProjectileHostileSlimeTarget {
  entityId: number;
  state: HostileSlimeState;
}

export interface ArrowProjectileTerrainHitEvent {
  kind: 'terrain';
  position: BowWorldPoint;
  worldTileX: number;
  worldTileY: number;
  tileId: number;
}

export interface ArrowProjectileHostileSlimeHitEvent {
  kind: 'hostile-slime';
  position: BowWorldPoint;
  entityId: number;
  direction: BowVelocity;
  damage: number;
  knockbackSpeed: number;
}

export type ArrowProjectileHitEvent =
  | ArrowProjectileTerrainHitEvent
  | ArrowProjectileHostileSlimeHitEvent;

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
  hostileSlimes?: readonly ArrowProjectileHostileSlimeTarget[];
  damage?: number;
  knockbackSpeed?: number;
  registry?: TileMetadataRegistry;
}

export interface StepArrowProjectileStateResult {
  nextState: ArrowProjectileState | null;
  hitEvent: ArrowProjectileHitEvent | null;
}

const DIRECTION_EPSILON = 1e-6;

interface SegmentIntersectionResult {
  time: number;
}

interface TerrainHitCandidate extends SegmentIntersectionResult {
  worldTileX: number;
  worldTileY: number;
  tileId: number;
}

interface HostileSlimeHitCandidate extends SegmentIntersectionResult {
  entityId: number;
  direction: BowVelocity;
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

const normalizeBowVelocity = (velocity: BowVelocity, label: string): BowVelocity => {
  const normalizedVelocity = cloneBowVelocity(velocity);
  const magnitude = Math.hypot(normalizedVelocity.x, normalizedVelocity.y);
  if (magnitude <= DIRECTION_EPSILON) {
    throw new Error(`${label} magnitude must be greater than 0`);
  }

  return {
    x: normalizedVelocity.x / magnitude,
    y: normalizedVelocity.y / magnitude
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

const resolveSegmentPointAtTime = (
  start: BowWorldPoint,
  end: BowWorldPoint,
  time: number
): BowWorldPoint => {
  const normalizedTime = expectFiniteNumber(time, 'time');
  return {
    x: start.x + (end.x - start.x) * normalizedTime,
    y: start.y + (end.y - start.y) * normalizedTime
  };
};

const resolveArrowProjectileTerrainHit = (
  state: ArrowProjectileState,
  nextPosition: BowWorldPoint,
  world: NonNullable<StepArrowProjectileStateOptions['world']>,
  registry: TileMetadataRegistry
): TerrainHitCandidate | null => {
  const bounds = resolveWorldTileBoundsForSegment(state.position, nextPosition, state.radius);
  let bestHit: TerrainHitCandidate | null = null;

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

const resolveBowArrowHitFacing = (
  currentFacing: HostileSlimeFacing,
  direction: BowVelocity
): HostileSlimeFacing => {
  if (direction.x < -DIRECTION_EPSILON) {
    return 'left';
  }
  if (direction.x > DIRECTION_EPSILON) {
    return 'right';
  }

  return currentFacing;
};

const resolveArrowProjectileHostileSlimeHit = (
  state: ArrowProjectileState,
  nextPosition: BowWorldPoint,
  hostileSlimes: readonly ArrowProjectileHostileSlimeTarget[]
): HostileSlimeHitCandidate | null => {
  let bestHit: HostileSlimeHitCandidate | null = null;
  const normalizedDirection = normalizeBowVelocity(state.velocity, 'state.velocity');

  for (const hostileSlime of hostileSlimes) {
    const slimeAabb = getHostileSlimeAabb(hostileSlime.state);
    const hit = resolveSegmentIntersectionTimeWithBounds(
      state.position,
      nextPosition,
      expandWorldBounds(
        slimeAabb.minX,
        slimeAabb.minY,
        slimeAabb.maxX,
        slimeAabb.maxY,
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
        hostileSlime.entityId < bestHit.entityId)
    ) {
      bestHit = {
        time: hit.time,
        entityId: hostileSlime.entityId,
        direction: normalizedDirection
      };
    }
  }

  return bestHit;
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

export const applyArrowProjectileHitToHostileSlime = (
  slimeState: HostileSlimeState,
  hitEvent: ArrowProjectileHostileSlimeHitEvent
): HostileSlimeState => {
  const nextState = cloneHostileSlimeState(slimeState);
  nextState.velocity = {
    x: hitEvent.direction.x * hitEvent.knockbackSpeed,
    y: hitEvent.direction.y * hitEvent.knockbackSpeed
  };
  nextState.grounded = false;
  nextState.facing = resolveBowArrowHitFacing(slimeState.facing, hitEvent.direction);
  nextState.launchKind = null;
  return applyHostileSlimeDamage(nextState, hitEvent.damage);
};

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
): StepArrowProjectileStateResult => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const damage = expectPositiveFiniteNumber(
    options.damage ?? DEFAULT_BOW_ARROW_DAMAGE,
    'options.damage'
  );
  const knockbackSpeed = expectPositiveFiniteNumber(
    options.knockbackSpeed ?? DEFAULT_BOW_ARROW_KNOCKBACK_SPEED,
    'options.knockbackSpeed'
  );
  if (state.secondsRemaining <= 0) {
    return {
      nextState: null,
      hitEvent: null
    };
  }
  if (fixedDtSeconds <= 0) {
    return {
      nextState: cloneArrowProjectileState(state),
      hitEvent: null
    };
  }

  const stepSeconds = Math.min(state.secondsRemaining, fixedDtSeconds);
  const nextPosition = {
    x: state.position.x + state.velocity.x * stepSeconds,
    y: state.position.y + state.velocity.y * stepSeconds
  };
  const registry = options.registry ?? TILE_METADATA;
  const terrainHit =
    options.world === undefined
      ? null
      : resolveArrowProjectileTerrainHit(state, nextPosition, options.world, registry);
  const hostileSlimeHit = resolveArrowProjectileHostileSlimeHit(
    state,
    nextPosition,
    options.hostileSlimes ?? []
  );

  if (
    terrainHit !== null &&
    (hostileSlimeHit === null || terrainHit.time <= hostileSlimeHit.time + DIRECTION_EPSILON)
  ) {
    return {
      nextState: null,
      hitEvent: {
        kind: 'terrain',
        position: resolveSegmentPointAtTime(state.position, nextPosition, terrainHit.time),
        worldTileX: terrainHit.worldTileX,
        worldTileY: terrainHit.worldTileY,
        tileId: terrainHit.tileId
      }
    };
  }

  if (hostileSlimeHit !== null) {
    return {
      nextState: null,
      hitEvent: {
        kind: 'hostile-slime',
        position: resolveSegmentPointAtTime(state.position, nextPosition, hostileSlimeHit.time),
        entityId: hostileSlimeHit.entityId,
        direction: hostileSlimeHit.direction,
        damage,
        knockbackSpeed
      }
    };
  }

  const nextState = createArrowProjectileState({
    position: nextPosition,
    velocity: state.velocity,
    radius: state.radius,
    secondsRemaining: Math.max(0, state.secondsRemaining - fixedDtSeconds)
  });

  return {
    nextState: nextState.secondsRemaining > 0 ? nextState : null,
    hitEvent: null
  };
};
