import {
  sweepAabbAlongAxis,
  type CollisionWorldView,
  type WorldAabb
} from './collision';
import { TILE_SIZE } from './constants';
import {
  applyHostileSlimeDamage,
  cloneHostileSlimeState,
  getHostileSlimeAabb,
  type HostileSlimeFacing,
  type HostileSlimeState
} from './hostileSlimeState';
import {
  getPlayerCameraFocusPoint,
  type PlayerState
} from './playerState';
import {
  evaluateStarterPickaxeMiningTarget,
  type StarterPickaxeMiningTargetLayer,
  type StarterPickaxeMiningWorldView
} from './starterPickaxeMining';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const BOMB_ITEM_ID = 'bomb';
export const DEFAULT_THROWN_BOMB_SPEED = 180;
export const DEFAULT_THROWN_BOMB_RADIUS = 6;
export const DEFAULT_THROWN_BOMB_FUSE_SECONDS = 1.5;
export const DEFAULT_THROWN_BOMB_GRAVITY = 480;
export const DEFAULT_THROWN_BOMB_BLAST_RADIUS = TILE_SIZE * 2;
export const DEFAULT_THROWN_BOMB_BLAST_DAMAGE = 20;
export const DEFAULT_THROWN_BOMB_BLAST_KNOCKBACK_SPEED = 220;
export const DEFAULT_THROWN_BOMB_BOUNCE_RESTITUTION = 0.55;
export const DEFAULT_THROWN_BOMB_MIN_BOUNCE_SPEED = 36;

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

export interface ThrownBombBlastEvent {
  position: ThrownBombWorldPoint;
  blastRadius: number;
  damage: number;
  knockbackSpeed: number;
}

export interface ThrownBombBlastHostileSlimeTarget {
  entityId: number;
  state: HostileSlimeState;
}

export interface ThrownBombBlastHostileSlimeHitEvent {
  entityId: number;
  direction: ThrownBombVelocity;
  damage: number;
  knockbackSpeed: number;
}

export interface ThrownBombBlastBreakTarget {
  worldTileX: number;
  worldTileY: number;
  targetLayer: StarterPickaxeMiningTargetLayer;
  targetId: number;
}

export interface StepThrownBombStateOptions {
  fixedDtSeconds: number;
  world?: CollisionWorldView;
  gravity?: number;
  blastRadius?: number;
  damage?: number;
  knockbackSpeed?: number;
  bounceRestitution?: number;
  minimumBounceSpeed?: number;
  registry?: TileMetadataRegistry;
}

export interface StepThrownBombStateResult {
  nextState: ThrownBombState | null;
  blastEvent: ThrownBombBlastEvent | null;
}

export interface ResolveThrownBombBlastBreakTargetsOptions {
  world: StarterPickaxeMiningWorldView;
  registry?: TileMetadataRegistry;
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

const cloneThrownBombBlastEvent = (
  event: ThrownBombBlastEvent
): ThrownBombBlastEvent => ({
  position: cloneThrownBombWorldPoint(event.position),
  blastRadius: expectPositiveFiniteNumber(event.blastRadius, 'event.blastRadius'),
  damage: expectPositiveFiniteNumber(event.damage, 'event.damage'),
  knockbackSpeed: expectPositiveFiniteNumber(event.knockbackSpeed, 'event.knockbackSpeed')
});

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const offsetWorldAabb = (aabb: WorldAabb, deltaX: number, deltaY: number): WorldAabb => ({
  minX: aabb.minX + deltaX,
  minY: aabb.minY + deltaY,
  maxX: aabb.maxX + deltaX,
  maxY: aabb.maxY + deltaY
});

const doesThrownBombBlastOverlapAabb = (
  blastPosition: ThrownBombWorldPoint,
  blastRadius: number,
  aabb: { minX: number; minY: number; maxX: number; maxY: number }
): boolean => {
  const nearestX = clampNumber(blastPosition.x, aabb.minX, aabb.maxX);
  const nearestY = clampNumber(blastPosition.y, aabb.minY, aabb.maxY);
  const deltaX = blastPosition.x - nearestX;
  const deltaY = blastPosition.y - nearestY;
  return deltaX * deltaX + deltaY * deltaY <= blastRadius * blastRadius;
};

const getThrownBombAabb = (
  state: Pick<ThrownBombState, 'position' | 'radius'>,
  position: ThrownBombWorldPoint = state.position
): WorldAabb => ({
  minX: position.x - state.radius,
  minY: position.y - state.radius,
  maxX: position.x + state.radius,
  maxY: position.y + state.radius
});

const resolveBouncedVelocityComponent = (
  velocityComponent: number,
  bounceRestitution: number,
  minimumBounceSpeed: number
): number => {
  const bouncedVelocityComponent = -velocityComponent * bounceRestitution;
  return Math.abs(bouncedVelocityComponent) <= minimumBounceSpeed ? 0 : bouncedVelocityComponent;
};

const stepThrownBombTravelWithTerrainCollision = (
  state: ThrownBombState,
  nextVelocity: ThrownBombVelocity,
  travelDtSeconds: number,
  world: CollisionWorldView,
  registry: TileMetadataRegistry,
  bounceRestitution: number,
  minimumBounceSpeed: number
): Pick<ThrownBombState, 'position' | 'velocity'> => {
  const initialAabb = getThrownBombAabb(state);
  const horizontalSweep = sweepAabbAlongAxis(
    world,
    initialAabb,
    'x',
    nextVelocity.x * travelDtSeconds,
    registry
  );
  const positionAfterHorizontalSweep = {
    x: state.position.x + horizontalSweep.allowedDelta,
    y: state.position.y
  };
  const nextBouncedVelocity = cloneThrownBombVelocity(nextVelocity);
  if (horizontalSweep.hit !== null) {
    nextBouncedVelocity.x = resolveBouncedVelocityComponent(
      nextVelocity.x,
      bounceRestitution,
      minimumBounceSpeed
    );
  }

  const verticalSweep = sweepAabbAlongAxis(
    world,
    offsetWorldAabb(initialAabb, horizontalSweep.allowedDelta, 0),
    'y',
    nextVelocity.y * travelDtSeconds,
    registry
  );
  if (verticalSweep.hit !== null) {
    nextBouncedVelocity.y = resolveBouncedVelocityComponent(
      nextVelocity.y,
      bounceRestitution,
      minimumBounceSpeed
    );
  }

  return {
    position: {
      x: positionAfterHorizontalSweep.x,
      y: state.position.y + verticalSweep.allowedDelta
    },
    velocity: nextBouncedVelocity
  };
};

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

const resolveThrownBombBlastKnockbackFacing = (
  currentFacing: HostileSlimeFacing,
  direction: ThrownBombVelocity
): HostileSlimeFacing => {
  if (direction.x < -DIRECTION_EPSILON) {
    return 'left';
  }
  if (direction.x > DIRECTION_EPSILON) {
    return 'right';
  }

  return currentFacing;
};

const resolveThrownBombBlastDirection = (
  blastPosition: ThrownBombWorldPoint,
  slimeState: HostileSlimeState
): ThrownBombVelocity => {
  const slimeAabb = getHostileSlimeAabb(slimeState);
  const slimeCenterX = (slimeAabb.minX + slimeAabb.maxX) * 0.5;
  const slimeCenterY = (slimeAabb.minY + slimeAabb.maxY) * 0.5;
  const deltaX = slimeCenterX - blastPosition.x;
  const deltaY = slimeCenterY - blastPosition.y;
  const magnitude = Math.hypot(deltaX, deltaY);

  if (magnitude <= DIRECTION_EPSILON) {
    return {
      x: 0,
      y: -1
    };
  }

  return {
    x: deltaX / magnitude,
    y: deltaY / magnitude
  };
};

const doesThrownBombBlastOverlapHostileSlime = (
  blastPosition: ThrownBombWorldPoint,
  blastRadius: number,
  slimeState: HostileSlimeState
): boolean => doesThrownBombBlastOverlapAabb(blastPosition, blastRadius, getHostileSlimeAabb(slimeState));

const resolveThrownBombBlastTileBounds = (
  blastEvent: ThrownBombBlastEvent
): { minTileX: number; maxTileX: number; minTileY: number; maxTileY: number } => ({
  minTileX: Math.floor((blastEvent.position.x - blastEvent.blastRadius) / TILE_SIZE),
  maxTileX: Math.ceil((blastEvent.position.x + blastEvent.blastRadius) / TILE_SIZE) - 1,
  minTileY: Math.floor((blastEvent.position.y - blastEvent.blastRadius) / TILE_SIZE),
  maxTileY: Math.ceil((blastEvent.position.y + blastEvent.blastRadius) / TILE_SIZE) - 1
});

export const resolveThrownBombBlastHostileSlimeHitEvents = (
  blastEvent: ThrownBombBlastEvent,
  hostileSlimes: readonly ThrownBombBlastHostileSlimeTarget[]
): ThrownBombBlastHostileSlimeHitEvent[] => {
  const normalizedBlastEvent = cloneThrownBombBlastEvent(blastEvent);
  const hitEvents: ThrownBombBlastHostileSlimeHitEvent[] = [];

  for (const hostileSlime of hostileSlimes) {
    if (
      !doesThrownBombBlastOverlapHostileSlime(
        normalizedBlastEvent.position,
        normalizedBlastEvent.blastRadius,
        hostileSlime.state
      )
    ) {
      continue;
    }

    hitEvents.push({
      entityId: hostileSlime.entityId,
      direction: resolveThrownBombBlastDirection(
        normalizedBlastEvent.position,
        hostileSlime.state
      ),
      damage: normalizedBlastEvent.damage,
      knockbackSpeed: normalizedBlastEvent.knockbackSpeed
    });
  }

  return hitEvents;
};

export const resolveThrownBombBlastBreakTargets = (
  blastEvent: ThrownBombBlastEvent,
  options: ResolveThrownBombBlastBreakTargetsOptions
): ThrownBombBlastBreakTarget[] => {
  const normalizedBlastEvent = cloneThrownBombBlastEvent(blastEvent);
  const registry = options.registry ?? TILE_METADATA;
  const bounds = resolveThrownBombBlastTileBounds(normalizedBlastEvent);
  const breakTargets: ThrownBombBlastBreakTarget[] = [];

  for (let worldTileY = bounds.minTileY; worldTileY <= bounds.maxTileY; worldTileY += 1) {
    for (let worldTileX = bounds.minTileX; worldTileX <= bounds.maxTileX; worldTileX += 1) {
      if (
        !doesThrownBombBlastOverlapAabb(
          normalizedBlastEvent.position,
          normalizedBlastEvent.blastRadius,
          {
            minX: worldTileX * TILE_SIZE,
            minY: worldTileY * TILE_SIZE,
            maxX: (worldTileX + 1) * TILE_SIZE,
            maxY: (worldTileY + 1) * TILE_SIZE
          }
        )
      ) {
        continue;
      }

      const evaluation = evaluateStarterPickaxeMiningTarget(
        options.world,
        null,
        worldTileX,
        worldTileY,
        registry
      );
      if (!evaluation.breakableTarget || evaluation.targetLayer === null) {
        continue;
      }

      breakTargets.push({
        worldTileX,
        worldTileY,
        targetLayer: evaluation.targetLayer,
        targetId: evaluation.targetId
      });
    }
  }

  return breakTargets;
};

export const applyThrownBombBlastHitToHostileSlime = (
  slimeState: HostileSlimeState,
  hitEvent: ThrownBombBlastHostileSlimeHitEvent
): HostileSlimeState => {
  const nextState = cloneHostileSlimeState(slimeState);
  nextState.velocity = {
    x: hitEvent.direction.x * hitEvent.knockbackSpeed,
    y: hitEvent.direction.y * hitEvent.knockbackSpeed
  };
  nextState.grounded = false;
  nextState.facing = resolveThrownBombBlastKnockbackFacing(
    slimeState.facing,
    hitEvent.direction
  );
  nextState.launchKind = null;
  return applyHostileSlimeDamage(nextState, hitEvent.damage);
};

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
): StepThrownBombStateResult => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const gravity = expectFiniteNumber(
    options.gravity ?? DEFAULT_THROWN_BOMB_GRAVITY,
    'options.gravity'
  );
  const blastRadius = expectPositiveFiniteNumber(
    options.blastRadius ?? DEFAULT_THROWN_BOMB_BLAST_RADIUS,
    'options.blastRadius'
  );
  const damage = expectPositiveFiniteNumber(
    options.damage ?? DEFAULT_THROWN_BOMB_BLAST_DAMAGE,
    'options.damage'
  );
  const knockbackSpeed = expectPositiveFiniteNumber(
    options.knockbackSpeed ?? DEFAULT_THROWN_BOMB_BLAST_KNOCKBACK_SPEED,
    'options.knockbackSpeed'
  );
  const bounceRestitution = expectNonNegativeFiniteNumber(
    options.bounceRestitution ?? DEFAULT_THROWN_BOMB_BOUNCE_RESTITUTION,
    'options.bounceRestitution'
  );
  const minimumBounceSpeed = expectNonNegativeFiniteNumber(
    options.minimumBounceSpeed ?? DEFAULT_THROWN_BOMB_MIN_BOUNCE_SPEED,
    'options.minimumBounceSpeed'
  );
  const registry = options.registry ?? TILE_METADATA;

  if (fixedDtSeconds <= 0) {
    return {
      nextState: cloneThrownBombState(state),
      blastEvent: null
    };
  }

  const travelDtSeconds = Math.min(fixedDtSeconds, state.secondsRemaining);
  const nextVelocity = {
    x: state.velocity.x,
    y: state.velocity.y + gravity * travelDtSeconds
  };
  const steppedTravelState =
    options.world === undefined
      ? {
          position: {
            x: state.position.x + nextVelocity.x * travelDtSeconds,
            y: state.position.y + nextVelocity.y * travelDtSeconds
          },
          velocity: nextVelocity
        }
      : stepThrownBombTravelWithTerrainCollision(
          state,
          nextVelocity,
          travelDtSeconds,
          options.world,
          registry,
          bounceRestitution,
          minimumBounceSpeed
        );
  const nextSecondsRemaining = Math.max(0, state.secondsRemaining - fixedDtSeconds);

  if (nextSecondsRemaining <= 0) {
    return {
      nextState: null,
      blastEvent: {
        position: steppedTravelState.position,
        blastRadius,
        damage,
        knockbackSpeed
      }
    };
  }

  return {
    nextState: {
      position: steppedTravelState.position,
      velocity: steppedTravelState.velocity,
      radius: state.radius,
      secondsRemaining: nextSecondsRemaining
    },
    blastEvent: null
  };
};
