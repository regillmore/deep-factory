import {
  sweepAabbAlongAxis,
  type SolidTileCollision,
  type WorldAabb
} from './collision';
import { TILE_SIZE } from './constants';
import type { PlayerState } from './playerState';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';
import type { TileWorld } from './world';
import {
  DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
  getHostileSlimeAabb,
  type HostileSlimeFacing,
  type HostileSlimeState
} from './hostileSlimeState';

export interface StepHostileSlimeStateOptions {
  gravityAcceleration?: number;
  maxFallSpeed?: number;
  hopHorizontalSpeed?: number;
  hopVerticalSpeed?: number;
  stepHopHorizontalSpeed?: number;
  stepHopVerticalSpeed?: number;
  hopIntervalTicks?: number;
  maxStepUpHeight?: number;
  turnDeadZoneDistance?: number;
}

export const DEFAULT_HOSTILE_SLIME_GRAVITY_ACCELERATION = 1800;
export const DEFAULT_HOSTILE_SLIME_MAX_FALL_SPEED = 720;
export const DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED = 120;
export const DEFAULT_HOSTILE_SLIME_HOP_VERTICAL_SPEED = 360;
export const DEFAULT_HOSTILE_SLIME_STEP_HOP_HORIZONTAL_SPEED = 72;
export const DEFAULT_HOSTILE_SLIME_STEP_HOP_VERTICAL_SPEED = 240;
export const DEFAULT_HOSTILE_SLIME_MAX_STEP_UP_HEIGHT = TILE_SIZE;
export const DEFAULT_HOSTILE_SLIME_TURN_DEAD_ZONE_DISTANCE = TILE_SIZE * 0.5;

const COLLISION_CONTACT_PROBE_DISTANCE = 1;

interface MoveHostileSlimeStateResult {
  nextState: HostileSlimeState;
  horizontalWallHitSide: HostileSlimeFacing | null;
}

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return value;
};

const expectPositiveInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return value;
};

const expectNonNegativeInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return value;
};

const offsetAabb = (aabb: WorldAabb, deltaX: number, deltaY: number): WorldAabb => ({
  minX: aabb.minX + deltaX,
  minY: aabb.minY + deltaY,
  maxX: aabb.maxX + deltaX,
  maxY: aabb.maxY + deltaY
});

const getGroundSupport = (
  world: TileWorld,
  aabb: WorldAabb,
  registry: TileMetadataRegistry
): SolidTileCollision | null => {
  const sweep = sweepAabbAlongAxis(world, aabb, 'y', COLLISION_CONTACT_PROBE_DISTANCE, registry);
  if (sweep.allowedDelta !== 0 || sweep.hit === null) {
    return null;
  }

  return sweep.hit;
};

const resolveFacingTowardsPlayer = (
  currentFacing: HostileSlimeFacing,
  slimeX: number,
  playerX: number,
  deadZoneDistance: number
): HostileSlimeFacing => {
  if (playerX < slimeX - deadZoneDistance) {
    return 'left';
  }
  if (playerX > slimeX + deadZoneDistance) {
    return 'right';
  }

  return currentFacing;
};

const resolveStepHopLaunchLift = (
  world: TileWorld,
  initialAabb: WorldAabb,
  obstacleProbeDelta: number,
  stepHopHorizontalDelta: number,
  maxStepUpHeight: number,
  registry: TileMetadataRegistry
): number => {
  if (obstacleProbeDelta === 0 || stepHopHorizontalDelta === 0 || maxStepUpHeight <= 0) {
    return 0;
  }

  const obstacleProbeSweep = sweepAabbAlongAxis(
    world,
    initialAabb,
    'x',
    obstacleProbeDelta,
    registry
  );
  if (obstacleProbeSweep.hit === null) {
    return 0;
  }

  const upwardClearanceSweep = sweepAabbAlongAxis(
    world,
    initialAabb,
    'y',
    -maxStepUpHeight,
    registry
  );
  const maxClearancePixels = Math.max(0, Math.floor(-upwardClearanceSweep.allowedDelta));

  for (let stepUpHeight = 1; stepUpHeight <= maxClearancePixels; stepUpHeight += 1) {
    const raisedAabb = offsetAabb(initialAabb, 0, -stepUpHeight);
    const retryHorizontalSweep = sweepAabbAlongAxis(
      world,
      raisedAabb,
      'x',
      stepHopHorizontalDelta,
      registry
    );
    if (retryHorizontalSweep.hit === null) {
      return stepUpHeight;
    }
  }

  return 0;
};

const moveHostileSlimeStateWithCollisions = (
  world: TileWorld,
  state: HostileSlimeState,
  fixedDtSeconds: number,
  registry: TileMetadataRegistry
): MoveHostileSlimeStateResult => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const initialAabb = getHostileSlimeAabb(state);
  const horizontalSweep = sweepAabbAlongAxis(world, initialAabb, 'x', state.velocity.x * dt, registry);
  const afterHorizontalAabb = offsetAabb(initialAabb, horizontalSweep.allowedDelta, 0);
  const verticalSweep = sweepAabbAlongAxis(world, afterHorizontalAabb, 'y', state.velocity.y * dt, registry);
  const finalAabb = offsetAabb(afterHorizontalAabb, 0, verticalSweep.allowedDelta);
  const groundSupport = getGroundSupport(world, finalAabb, registry);

  return {
    nextState: {
      position: {
        x: (finalAabb.minX + finalAabb.maxX) * 0.5,
        y: finalAabb.maxY
      },
      velocity: {
        x: horizontalSweep.hit === null ? state.velocity.x : 0,
        y: verticalSweep.hit === null ? state.velocity.y : 0
      },
      size: {
        width: state.size.width,
        height: state.size.height
      },
      grounded: groundSupport !== null,
      facing: state.facing,
      hopCooldownTicksRemaining: state.hopCooldownTicksRemaining
    },
    horizontalWallHitSide:
      horizontalSweep.hit === null ? null : horizontalSweep.attemptedDelta < 0 ? 'left' : 'right'
  };
};

export const stepHostileSlimeState = (
  world: TileWorld,
  state: HostileSlimeState,
  fixedDtSeconds: number,
  playerState: Pick<PlayerState, 'position'>,
  options: StepHostileSlimeStateOptions = {},
  registry: TileMetadataRegistry = TILE_METADATA
): HostileSlimeState => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const gravityAcceleration = expectNonNegativeFiniteNumber(
    options.gravityAcceleration ?? DEFAULT_HOSTILE_SLIME_GRAVITY_ACCELERATION,
    'options.gravityAcceleration'
  );
  const maxFallSpeed = expectNonNegativeFiniteNumber(
    options.maxFallSpeed ?? DEFAULT_HOSTILE_SLIME_MAX_FALL_SPEED,
    'options.maxFallSpeed'
  );
  const hopHorizontalSpeed = expectPositiveFiniteNumber(
    options.hopHorizontalSpeed ?? DEFAULT_HOSTILE_SLIME_HOP_HORIZONTAL_SPEED,
    'options.hopHorizontalSpeed'
  );
  const hopVerticalSpeed = expectPositiveFiniteNumber(
    options.hopVerticalSpeed ?? DEFAULT_HOSTILE_SLIME_HOP_VERTICAL_SPEED,
    'options.hopVerticalSpeed'
  );
  const stepHopHorizontalSpeed = expectPositiveFiniteNumber(
    options.stepHopHorizontalSpeed ?? DEFAULT_HOSTILE_SLIME_STEP_HOP_HORIZONTAL_SPEED,
    'options.stepHopHorizontalSpeed'
  );
  const stepHopVerticalSpeed = expectPositiveFiniteNumber(
    options.stepHopVerticalSpeed ?? DEFAULT_HOSTILE_SLIME_STEP_HOP_VERTICAL_SPEED,
    'options.stepHopVerticalSpeed'
  );
  const hopIntervalTicks = expectPositiveInteger(
    options.hopIntervalTicks ?? DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
    'options.hopIntervalTicks'
  );
  const maxStepUpHeight = expectNonNegativeFiniteNumber(
    options.maxStepUpHeight ?? DEFAULT_HOSTILE_SLIME_MAX_STEP_UP_HEIGHT,
    'options.maxStepUpHeight'
  );
  const turnDeadZoneDistance = expectNonNegativeFiniteNumber(
    options.turnDeadZoneDistance ?? DEFAULT_HOSTILE_SLIME_TURN_DEAD_ZONE_DISTANCE,
    'options.turnDeadZoneDistance'
  );
  const playerPositionX = expectFiniteNumber(playerState.position.x, 'playerState.position.x');
  let facing = state.facing;
  let velocityX = state.velocity.x;
  let velocityY = state.velocity.y;
  let grounded = state.grounded;
  let positionY = state.position.y;
  let hopCooldownTicksRemaining = expectNonNegativeInteger(
    state.hopCooldownTicksRemaining,
    'state.hopCooldownTicksRemaining'
  );

  if (grounded) {
    facing = resolveFacingTowardsPlayer(
      facing,
      expectFiniteNumber(state.position.x, 'state.position.x'),
      playerPositionX,
      turnDeadZoneDistance
    );
    velocityX = 0;
    velocityY = 0;
    if (hopCooldownTicksRemaining > 0) {
      hopCooldownTicksRemaining -= 1;
    }
    if (hopCooldownTicksRemaining === 0) {
      const facingSign = facing === 'left' ? -1 : 1;
      const initialAabb = getHostileSlimeAabb({
        position: {
          x: state.position.x,
          y: positionY
        },
        velocity: {
          x: 0,
          y: 0
        },
        size: {
          width: state.size.width,
          height: state.size.height
        },
        grounded: true,
        facing,
        hopCooldownTicksRemaining
      });
      const stepHopHorizontalDelta = facingSign * stepHopHorizontalSpeed * dt;
      const stepHopLaunchLift = resolveStepHopLaunchLift(
        world,
        initialAabb,
        facingSign * Math.max(hopHorizontalSpeed * dt, COLLISION_CONTACT_PROBE_DISTANCE),
        stepHopHorizontalDelta,
        maxStepUpHeight,
        registry
      );
      grounded = false;
      if (stepHopLaunchLift > 0) {
        positionY -= stepHopLaunchLift;
        velocityX = facingSign * stepHopHorizontalSpeed;
        velocityY = -stepHopVerticalSpeed;
      } else {
        velocityX = facingSign * hopHorizontalSpeed;
        velocityY = -hopVerticalSpeed;
      }
      hopCooldownTicksRemaining = hopIntervalTicks;
    }
  }

  if (!grounded) {
    velocityY = Math.min(velocityY + gravityAcceleration * dt, maxFallSpeed);
  }

  const movedState = moveHostileSlimeStateWithCollisions(
    world,
    {
      position: {
        x: state.position.x,
        y: positionY
      },
      velocity: {
        x: velocityX,
        y: velocityY
      },
      size: {
        width: state.size.width,
        height: state.size.height
      },
      grounded,
      facing,
      hopCooldownTicksRemaining
    },
    dt,
    registry
  );
  const nextState: HostileSlimeState = {
    ...movedState.nextState,
    hopCooldownTicksRemaining
  };

  if (movedState.horizontalWallHitSide !== null) {
    nextState.facing = movedState.horizontalWallHitSide === 'left' ? 'right' : 'left';
  }

  if (!state.grounded && nextState.grounded) {
    nextState.velocity = {
      x: 0,
      y: 0
    };
    nextState.facing = resolveFacingTowardsPlayer(
      nextState.facing,
      nextState.position.x,
      playerPositionX,
      turnDeadZoneDistance
    );
    nextState.hopCooldownTicksRemaining = hopIntervalTicks;
  }

  return nextState;
};
