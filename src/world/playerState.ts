import { doesAabbOverlapSolid, sweepAabbAlongAxis, type SolidTileCollision, type WorldAabb } from './collision';
import { TILE_METADATA } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
import type { TileWorld } from './world';

export type PlayerFacing = 'left' | 'right';

export interface PlayerVector {
  x: number;
  y: number;
}

export interface PlayerSize {
  width: number;
  height: number;
}

export interface PlayerState {
  position: PlayerVector;
  velocity: PlayerVector;
  size: PlayerSize;
  grounded: boolean;
  facing: PlayerFacing;
}

export interface PlayerSpawnPlacement {
  x: number;
  y: number;
  aabb: WorldAabb;
}

export interface CreatePlayerStateOptions {
  position?: Partial<PlayerVector>;
  velocity?: Partial<PlayerVector>;
  size?: Partial<PlayerSize>;
  grounded?: boolean;
  facing?: PlayerFacing;
}

export interface PlayerMovementIntent {
  moveX?: number;
  jumpPressed?: boolean;
}

export interface StepPlayerStateWithGravityOptions {
  gravityAcceleration?: number;
  maxFallSpeed?: number;
}

export interface StepPlayerStateOptions extends StepPlayerStateWithGravityOptions {
  maxWalkSpeed?: number;
  groundAcceleration?: number;
  airAcceleration?: number;
  groundDeceleration?: number;
  jumpSpeed?: number;
}

export const DEFAULT_PLAYER_WIDTH = 12;
export const DEFAULT_PLAYER_HEIGHT = 28;
export const DEFAULT_PLAYER_GRAVITY_ACCELERATION = 1800;
export const DEFAULT_PLAYER_MAX_FALL_SPEED = 720;
export const DEFAULT_PLAYER_MAX_WALK_SPEED = 180;
export const DEFAULT_PLAYER_GROUND_ACCELERATION = 1800;
export const DEFAULT_PLAYER_AIR_ACCELERATION = 900;
export const DEFAULT_PLAYER_GROUND_DECELERATION = 2400;
export const DEFAULT_PLAYER_JUMP_SPEED = 520;
const DEFAULT_PLAYER_FACING: PlayerFacing = 'right';
const GROUND_SUPPORT_PROBE_DISTANCE = 1;

const expectFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectPositiveFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }

  return value;
};

const expectNonNegativeFiniteNumber = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }

  return value;
};

const buildVector = (vector: Partial<PlayerVector> | undefined, label: string): PlayerVector => ({
  x: expectFiniteNumber(vector?.x ?? 0, `${label}.x`),
  y: expectFiniteNumber(vector?.y ?? 0, `${label}.y`)
});

const buildSize = (size: Partial<PlayerSize> | undefined): PlayerSize => ({
  width: expectPositiveFiniteNumber(size?.width ?? DEFAULT_PLAYER_WIDTH, 'size.width'),
  height: expectPositiveFiniteNumber(size?.height ?? DEFAULT_PLAYER_HEIGHT, 'size.height')
});

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const moveTowards = (current: number, target: number, maxDelta: number): number => {
  if (current < target) {
    return Math.min(current + maxDelta, target);
  }
  if (current > target) {
    return Math.max(current - maxDelta, target);
  }

  return target;
};

const normalizeMoveXIntent = (moveX: number | undefined): number =>
  clampNumber(expectFiniteNumber(moveX ?? 0, 'intent.moveX'), -1, 1);

const resolveFacingFromHorizontalVelocity = (
  currentFacing: PlayerFacing,
  horizontalVelocity: number
): PlayerFacing => {
  if (horizontalVelocity < 0) {
    return 'left';
  }
  if (horizontalVelocity > 0) {
    return 'right';
  }

  return currentFacing;
};

const buildSpawnSize = (aabb: WorldAabb): PlayerSize => ({
  width: expectPositiveFiniteNumber(aabb.maxX - aabb.minX, 'spawn.aabb.width'),
  height: expectPositiveFiniteNumber(aabb.maxY - aabb.minY, 'spawn.aabb.height')
});

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
  const supportSweep = sweepAabbAlongAxis(world, aabb, 'y', GROUND_SUPPORT_PROBE_DISTANCE, registry);
  if (supportSweep.allowedDelta !== 0 || supportSweep.hit === null) {
    return null;
  }

  return supportSweep.hit;
};

const resolveHorizontalVelocityFromIntent = (
  currentVelocityX: number,
  moveX: number,
  grounded: boolean,
  fixedDtSeconds: number,
  maxWalkSpeed: number,
  groundAcceleration: number,
  airAcceleration: number,
  groundDeceleration: number
): number => {
  if (moveX !== 0) {
    const acceleration = grounded ? groundAcceleration : airAcceleration;
    return moveTowards(currentVelocityX, moveX * maxWalkSpeed, acceleration * fixedDtSeconds);
  }
  if (!grounded) {
    return currentVelocityX;
  }

  return moveTowards(currentVelocityX, 0, groundDeceleration * fixedDtSeconds);
};

export const createPlayerState = (options: CreatePlayerStateOptions = {}): PlayerState => {
  const velocity = buildVector(options.velocity, 'velocity');
  const facing = options.facing ?? resolveFacingFromHorizontalVelocity(DEFAULT_PLAYER_FACING, velocity.x);

  return {
    position: buildVector(options.position, 'position'),
    velocity,
    size: buildSize(options.size),
    grounded: (options.grounded ?? false) && velocity.y === 0,
    facing
  };
};

export const createPlayerStateFromSpawn = (
  spawn: PlayerSpawnPlacement,
  options: Omit<CreatePlayerStateOptions, 'position' | 'size' | 'grounded'> = {}
): PlayerState =>
  createPlayerState({
    ...options,
    position: {
      x: expectFiniteNumber(spawn.x, 'spawn.x'),
      y: expectFiniteNumber(spawn.y, 'spawn.y')
    },
    size: buildSpawnSize(spawn.aabb),
    grounded: true
  });

export const respawnPlayerStateAtSpawnIfEmbeddedInSolid = (
  world: TileWorld,
  state: PlayerState,
  spawn: PlayerSpawnPlacement | null,
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerState => {
  if (!doesAabbOverlapSolid(world, getPlayerAabb(state), registry) || spawn === null) {
    return state;
  }

  return createPlayerStateFromSpawn(spawn, { facing: state.facing });
};

export const getPlayerAabb = (state: PlayerState): WorldAabb => {
  const halfWidth = state.size.width * 0.5;

  return {
    minX: state.position.x - halfWidth,
    minY: state.position.y - state.size.height,
    maxX: state.position.x + halfWidth,
    maxY: state.position.y
  };
};

export const integratePlayerState = (state: PlayerState, fixedDtSeconds: number): PlayerState => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const facing = resolveFacingFromHorizontalVelocity(state.facing, state.velocity.x);

  return {
    position: {
      x: state.position.x + state.velocity.x * dt,
      y: state.position.y + state.velocity.y * dt
    },
    velocity: {
      x: state.velocity.x,
      y: state.velocity.y
    },
    size: {
      width: state.size.width,
      height: state.size.height
    },
    grounded: state.grounded && state.velocity.y === 0,
    facing
  };
};

export const movePlayerStateWithCollisions = (
  world: TileWorld,
  state: PlayerState,
  fixedDtSeconds: number,
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerState => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const facing = resolveFacingFromHorizontalVelocity(state.facing, state.velocity.x);
  const initialAabb = getPlayerAabb(state);
  const horizontalSweep = sweepAabbAlongAxis(world, initialAabb, 'x', state.velocity.x * dt, registry);
  const afterHorizontalAabb = offsetAabb(initialAabb, horizontalSweep.allowedDelta, 0);
  const verticalSweep = sweepAabbAlongAxis(world, afterHorizontalAabb, 'y', state.velocity.y * dt, registry);
  const finalAabb = offsetAabb(afterHorizontalAabb, 0, verticalSweep.allowedDelta);
  const groundSupport = getGroundSupport(world, finalAabb, registry);

  return {
    position: {
      x: (finalAabb.minX + finalAabb.maxX) * 0.5,
      y: finalAabb.maxY
    },
    velocity: {
      x: horizontalSweep.hit ? 0 : state.velocity.x,
      y: verticalSweep.hit ? 0 : state.velocity.y
    },
    size: {
      width: state.size.width,
      height: state.size.height
    },
    grounded: groundSupport !== null,
    facing
  };
};

export const stepPlayerState = (
  world: TileWorld,
  state: PlayerState,
  fixedDtSeconds: number,
  intent: PlayerMovementIntent = {},
  options: StepPlayerStateOptions = {},
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerState => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const moveX = normalizeMoveXIntent(intent.moveX);
  const gravityAcceleration = expectNonNegativeFiniteNumber(
    options.gravityAcceleration ?? DEFAULT_PLAYER_GRAVITY_ACCELERATION,
    'options.gravityAcceleration'
  );
  const maxFallSpeed = expectNonNegativeFiniteNumber(
    options.maxFallSpeed ?? DEFAULT_PLAYER_MAX_FALL_SPEED,
    'options.maxFallSpeed'
  );
  const maxWalkSpeed = expectNonNegativeFiniteNumber(
    options.maxWalkSpeed ?? DEFAULT_PLAYER_MAX_WALK_SPEED,
    'options.maxWalkSpeed'
  );
  const groundAcceleration = expectNonNegativeFiniteNumber(
    options.groundAcceleration ?? DEFAULT_PLAYER_GROUND_ACCELERATION,
    'options.groundAcceleration'
  );
  const airAcceleration = expectNonNegativeFiniteNumber(
    options.airAcceleration ?? DEFAULT_PLAYER_AIR_ACCELERATION,
    'options.airAcceleration'
  );
  const groundDeceleration = expectNonNegativeFiniteNumber(
    options.groundDeceleration ?? DEFAULT_PLAYER_GROUND_DECELERATION,
    'options.groundDeceleration'
  );
  const jumpSpeed = expectNonNegativeFiniteNumber(options.jumpSpeed ?? DEFAULT_PLAYER_JUMP_SPEED, 'options.jumpSpeed');
  const velocityX = resolveHorizontalVelocityFromIntent(
    state.velocity.x,
    moveX,
    state.grounded,
    dt,
    maxWalkSpeed,
    groundAcceleration,
    airAcceleration,
    groundDeceleration
  );
  let velocityY = state.velocity.y;
  let grounded = state.grounded;

  if (intent.jumpPressed === true && grounded) {
    velocityY = -jumpSpeed;
    grounded = false;
  }

  velocityY = Math.min(velocityY + gravityAcceleration * dt, maxFallSpeed);

  return movePlayerStateWithCollisions(
    world,
    {
      position: {
        x: state.position.x,
        y: state.position.y
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
      facing: state.facing
    },
    dt,
    registry
  );
};

export const stepPlayerStateWithGravity = (
  world: TileWorld,
  state: PlayerState,
  fixedDtSeconds: number,
  options: StepPlayerStateWithGravityOptions = {},
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerState =>
  stepPlayerState(
    world,
    state,
    fixedDtSeconds,
    {},
    {
      ...options,
      groundDeceleration: 0
    },
    registry
  );
