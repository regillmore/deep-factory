import {
  isSolidAt,
  sweepAabbAlongAxis,
  type SolidTileCollision,
  type WorldAabb
} from './collision';
import { TILE_SIZE } from './constants';
import { TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';
import type { TileWorld } from './world';
import {
  DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS,
  getPassiveBunnyAabb,
  type PassiveBunnyFacing,
  type PassiveBunnyState
} from './passiveBunnyState';

export interface StepPassiveBunnyStateOptions {
  gravityAcceleration?: number;
  maxFallSpeed?: number;
  hopHorizontalSpeed?: number;
  hopVerticalSpeed?: number;
  hopIntervalTicks?: number;
}

export const DEFAULT_PASSIVE_BUNNY_GRAVITY_ACCELERATION = 1800;
export const DEFAULT_PASSIVE_BUNNY_MAX_FALL_SPEED = 720;
export const DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED = 72;
export const DEFAULT_PASSIVE_BUNNY_HOP_VERTICAL_SPEED = 300;

const COLLISION_CONTACT_PROBE_DISTANCE = 1;
const GROUND_TURN_WALL_PROBE_DISTANCE = 2;

interface MovePassiveBunnyStateResult {
  nextState: PassiveBunnyState;
  horizontalWallHitSide: PassiveBunnyFacing | null;
}

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

const flipFacing = (facing: PassiveBunnyFacing): PassiveBunnyFacing =>
  facing === 'left' ? 'right' : 'left';

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

const isGroundMissingAhead = (
  world: TileWorld,
  state: PassiveBunnyState,
  facing: PassiveBunnyFacing,
  registry: TileMetadataRegistry
): boolean => {
  const halfWidth = state.size.width * 0.5;
  const facingSign = facing === 'left' ? -1 : 1;
  const supportProbeTileX = Math.floor((state.position.x + facingSign * (halfWidth + 1)) / TILE_SIZE);
  const supportProbeTileY = Math.floor((state.position.y + 1) / TILE_SIZE);
  return !isSolidAt(world, supportProbeTileX, supportProbeTileY, registry);
};

const shouldTurnAroundOnGround = (
  world: TileWorld,
  state: PassiveBunnyState,
  facing: PassiveBunnyFacing,
  registry: TileMetadataRegistry
): boolean => {
  const aabb = getPassiveBunnyAabb(state);
  const wallProbeDelta =
    facing === 'left' ? -GROUND_TURN_WALL_PROBE_DISTANCE : GROUND_TURN_WALL_PROBE_DISTANCE;
  const wallProbeSweep = sweepAabbAlongAxis(world, aabb, 'x', wallProbeDelta, registry);
  return wallProbeSweep.hit !== null || isGroundMissingAhead(world, state, facing, registry);
};

const movePassiveBunnyStateWithCollisions = (
  world: TileWorld,
  state: PassiveBunnyState,
  fixedDtSeconds: number,
  registry: TileMetadataRegistry
): MovePassiveBunnyStateResult => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const initialAabb = getPassiveBunnyAabb(state);
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

export const stepPassiveBunnyState = (
  world: TileWorld,
  state: PassiveBunnyState,
  fixedDtSeconds: number,
  options: StepPassiveBunnyStateOptions = {},
  registry: TileMetadataRegistry = TILE_METADATA
): PassiveBunnyState => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const gravityAcceleration = expectNonNegativeFiniteNumber(
    options.gravityAcceleration ?? DEFAULT_PASSIVE_BUNNY_GRAVITY_ACCELERATION,
    'options.gravityAcceleration'
  );
  const maxFallSpeed = expectNonNegativeFiniteNumber(
    options.maxFallSpeed ?? DEFAULT_PASSIVE_BUNNY_MAX_FALL_SPEED,
    'options.maxFallSpeed'
  );
  const hopHorizontalSpeed = expectPositiveFiniteNumber(
    options.hopHorizontalSpeed ?? DEFAULT_PASSIVE_BUNNY_HOP_HORIZONTAL_SPEED,
    'options.hopHorizontalSpeed'
  );
  const hopVerticalSpeed = expectPositiveFiniteNumber(
    options.hopVerticalSpeed ?? DEFAULT_PASSIVE_BUNNY_HOP_VERTICAL_SPEED,
    'options.hopVerticalSpeed'
  );
  const hopIntervalTicks = expectPositiveInteger(
    options.hopIntervalTicks ?? DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS,
    'options.hopIntervalTicks'
  );
  let facing = state.facing;
  let velocityX = state.velocity.x;
  let velocityY = state.velocity.y;
  let grounded = state.grounded;
  let hopCooldownTicksRemaining = expectNonNegativeInteger(
    state.hopCooldownTicksRemaining,
    'state.hopCooldownTicksRemaining'
  );

  if (grounded) {
    velocityX = 0;
    velocityY = 0;
    if (shouldTurnAroundOnGround(world, state, facing, registry)) {
      facing = flipFacing(facing);
    }
    if (hopCooldownTicksRemaining > 0) {
      hopCooldownTicksRemaining -= 1;
    }
    if (hopCooldownTicksRemaining === 0) {
      if (shouldTurnAroundOnGround(world, state, facing, registry)) {
        hopCooldownTicksRemaining = hopIntervalTicks;
      } else {
        const facingSign = facing === 'left' ? -1 : 1;
        grounded = false;
        velocityX = facingSign * hopHorizontalSpeed;
        velocityY = -hopVerticalSpeed;
        hopCooldownTicksRemaining = hopIntervalTicks;
      }
    }
  }

  if (!grounded) {
    velocityY = Math.min(velocityY + gravityAcceleration * dt, maxFallSpeed);
  }

  const movedState = movePassiveBunnyStateWithCollisions(
    world,
    {
      position: { ...state.position },
      velocity: {
        x: velocityX,
        y: velocityY
      },
      size: { ...state.size },
      grounded,
      facing,
      hopCooldownTicksRemaining
    },
    dt,
    registry
  );
  const nextState: PassiveBunnyState = {
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
  }

  return nextState;
};
