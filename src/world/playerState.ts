import { MAX_LIQUID_LEVEL, TILE_SIZE } from './constants';
import { doesAabbOverlapSolid, sweepAabbAlongAxis, type SolidTileCollision, type WorldAabb } from './collision';
import { getTileLiquidKind, isTileClimbable, TILE_METADATA } from './tileMetadata';
import type { TileMetadataRegistry } from './tileMetadata';
import type { TileWorld } from './world';

export type PlayerFacing = 'left' | 'right';
export type PlayerWallContactSide = 'left' | 'right';

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
  health: number;
  breathSecondsRemaining: number;
  lavaDamageTickSecondsRemaining: number;
  drowningDamageTickSecondsRemaining: number;
  fallDamageRecoverySecondsRemaining: number;
  hostileContactInvulnerabilitySecondsRemaining: number;
}

export interface PlayerCollisionContacts {
  support: SolidTileCollision | null;
  wall: PlayerWallCollision | null;
  ceiling: SolidTileCollision | null;
}

export interface PlayerWallCollision extends SolidTileCollision {
  side: PlayerWallContactSide;
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
  health?: number;
  breathSecondsRemaining?: number;
  lavaDamageTickSecondsRemaining?: number;
  drowningDamageTickSecondsRemaining?: number;
  fallDamageRecoverySecondsRemaining?: number;
  hostileContactInvulnerabilitySecondsRemaining?: number;
}

export interface PlayerMovementIntent {
  moveX?: number;
  jumpPressed?: boolean;
  climbY?: number;
  ropeDropHeld?: boolean;
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
  ropeClimbSpeed?: number;
  ropeCenteringSpeed?: number;
  maxBreathSeconds?: number;
  breathRecoveryPerSecond?: number;
  waterBuoyancyAcceleration?: number;
  waterHorizontalDragPerSecond?: number;
  waterVerticalDragPerSecond?: number;
  drowningDamagePerTick?: number;
  drowningDamageTickIntervalSeconds?: number;
  lavaDamagePerTick?: number;
  lavaDamageTickIntervalSeconds?: number;
  fallDamageSafeLandingSpeed?: number;
  fallDamageSpeedPerHealth?: number;
  fallDamageRecoverySeconds?: number;
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
export const DEFAULT_PLAYER_ROPE_CLIMB_SPEED = 120;
export const DEFAULT_PLAYER_ROPE_CENTERING_SPEED = 24;
export const DEFAULT_PLAYER_MAX_HEALTH = 100;
export const DEFAULT_PLAYER_MAX_BREATH_SECONDS = 8;
export const DEFAULT_PLAYER_BREATH_RECOVERY_PER_SECOND = 4;
export const DEFAULT_PLAYER_WATER_BUOYANCY_ACCELERATION = 2400;
export const DEFAULT_PLAYER_WATER_HORIZONTAL_DRAG_PER_SECOND = 4;
export const DEFAULT_PLAYER_WATER_VERTICAL_DRAG_PER_SECOND = 2;
export const DEFAULT_PLAYER_DROWNING_DAMAGE_PER_TICK = 10;
export const DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS = 1;
export const DEFAULT_PLAYER_LAVA_DAMAGE_PER_TICK = 25;
export const DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS = 0.5;
export const DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED = 600;
export const DEFAULT_PLAYER_FALL_DAMAGE_SPEED_PER_HEALTH = 4;
export const DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS = 0.35;
export const DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS = 0;
const DEFAULT_PLAYER_FACING: PlayerFacing = 'right';
const COLLISION_CONTACT_PROBE_DISTANCE = 1;
const AABB_INTERSECTION_EPSILON = 1e-6;
const PLAYER_BREATH_SAMPLE_HEIGHT_RATIO = 0.25;
const DROWNING_DAMAGE_MIN_HEALTH = 0;
const FALL_DAMAGE_MIN_HEALTH = 0;

interface PlayerLiquidOverlapState {
  waterSubmergedFraction: number;
  waterBreathSubmergedFraction: number;
  lavaSubmergedFraction: number;
}

interface PlayerClimbableTileQueryWorld {
  getTile(worldTileX: number, worldTileY: number): number;
}

interface AabbOverlappingClimbableTileInfo {
  tileX: number;
  highestTileY: number;
  lowestTileY: number;
  centerX: number;
}

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

const buildHealth = (health: number | undefined): number =>
  expectNonNegativeFiniteNumber(health ?? DEFAULT_PLAYER_MAX_HEALTH, 'health');

const buildBreathSecondsRemaining = (value: number | undefined): number =>
  expectNonNegativeFiniteNumber(value ?? DEFAULT_PLAYER_MAX_BREATH_SECONDS, 'breathSecondsRemaining');

const buildLavaDamageTickSecondsRemaining = (value: number | undefined): number =>
  expectNonNegativeFiniteNumber(
    value ?? DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
    'lavaDamageTickSecondsRemaining'
  );

const buildDrowningDamageTickSecondsRemaining = (value: number | undefined): number =>
  expectNonNegativeFiniteNumber(
    value ?? DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
    'drowningDamageTickSecondsRemaining'
  );

const buildFallDamageRecoverySecondsRemaining = (value: number | undefined): number =>
  expectNonNegativeFiniteNumber(value ?? 0, 'fallDamageRecoverySecondsRemaining');

const buildHostileContactInvulnerabilitySecondsRemaining = (value: number | undefined): number =>
  expectNonNegativeFiniteNumber(
    value ?? DEFAULT_PLAYER_HOSTILE_CONTACT_INVULNERABILITY_SECONDS,
    'hostileContactInvulnerabilitySecondsRemaining'
  );

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const applyLinearDrag = (
  velocity: number,
  dragPerSecond: number,
  submergedFraction: number,
  fixedDtSeconds: number
): number => velocity / (1 + dragPerSecond * submergedFraction * fixedDtSeconds);

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

const normalizeClimbYIntent = (climbY: number | undefined): number =>
  clampNumber(expectFiniteNumber(climbY ?? 0, 'intent.climbY'), -1, 1);

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

const getPlayerBreathSampleAabb = (state: PlayerState): WorldAabb => {
  const aabb = getPlayerAabb(state);
  const sampleHeight = state.size.height * PLAYER_BREATH_SAMPLE_HEIGHT_RATIO;

  return {
    minX: aabb.minX,
    minY: aabb.minY,
    maxX: aabb.maxX,
    maxY: Math.min(aabb.maxY, aabb.minY + sampleHeight)
  };
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

const getAabbContact = (
  world: TileWorld,
  aabb: WorldAabb,
  axis: 'x' | 'y',
  delta: number,
  registry: TileMetadataRegistry
): SolidTileCollision | null => {
  const sweep = sweepAabbAlongAxis(world, aabb, axis, delta, registry);
  if (sweep.allowedDelta !== 0 || sweep.hit === null) {
    return null;
  }

  return sweep.hit;
};

const getGroundSupport = (
  world: TileWorld,
  aabb: WorldAabb,
  registry: TileMetadataRegistry
): SolidTileCollision | null =>
  getAabbContact(world, aabb, 'y', COLLISION_CONTACT_PROBE_DISTANCE, registry);

const getWallContactSideFromProbeDelta = (probeDelta: number): PlayerWallContactSide =>
  probeDelta < 0 ? 'left' : 'right';

const getWallContact = (
  world: TileWorld,
  aabb: WorldAabb,
  probeDelta: number,
  registry: TileMetadataRegistry
): PlayerWallCollision | null => {
  const collision = getAabbContact(world, aabb, 'x', probeDelta, registry);
  if (collision === null) {
    return null;
  }

  return {
    ...collision,
    side: getWallContactSideFromProbeDelta(probeDelta)
  };
};

const getPreferredWallContactProbeDelta = (state: PlayerState): number => {
  if (state.velocity.x < 0) {
    return -COLLISION_CONTACT_PROBE_DISTANCE;
  }
  if (state.velocity.x > 0) {
    return COLLISION_CONTACT_PROBE_DISTANCE;
  }
  if (state.facing === 'left') {
    return -COLLISION_CONTACT_PROBE_DISTANCE;
  }

  return COLLISION_CONTACT_PROBE_DISTANCE;
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

const samplePlayerLiquidOverlapState = (
  world: TileWorld,
  state: PlayerState,
  registry: TileMetadataRegistry
): PlayerLiquidOverlapState => {
  const aabb = getPlayerAabb(state);
  const breathSampleAabb = getPlayerBreathSampleAabb(state);
  const playerArea = state.size.width * state.size.height;
  const breathSampleArea =
    Math.max(0, breathSampleAabb.maxX - breathSampleAabb.minX) *
    Math.max(0, breathSampleAabb.maxY - breathSampleAabb.minY);
  if (playerArea <= 0) {
    return {
      waterSubmergedFraction: 0,
      waterBreathSubmergedFraction: 0,
      lavaSubmergedFraction: 0
    };
  }

  const minTileX = Math.floor(aabb.minX / TILE_SIZE);
  const maxTileX = Math.floor((aabb.maxX - AABB_INTERSECTION_EPSILON) / TILE_SIZE);
  const minTileY = Math.floor(aabb.minY / TILE_SIZE);
  const maxTileY = Math.floor((aabb.maxY - AABB_INTERSECTION_EPSILON) / TILE_SIZE);
  let waterOverlapArea = 0;
  let waterBreathOverlapArea = 0;
  let lavaOverlapArea = 0;

  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    const tileWorldMinY = tileY * TILE_SIZE;
    const tileWorldMaxY = tileWorldMinY + TILE_SIZE;

    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      const tileId = world.getTile(tileX, tileY);
      const liquidKind = getTileLiquidKind(tileId, registry);
      if (liquidKind === null) {
        continue;
      }

      const liquidLevel = world.getLiquidLevel(tileX, tileY);
      if (liquidLevel <= 0) {
        continue;
      }

      const tileWorldMinX = tileX * TILE_SIZE;
      const tileWorldMaxX = tileWorldMinX + TILE_SIZE;
      const liquidFillHeight = (liquidLevel / MAX_LIQUID_LEVEL) * TILE_SIZE;
      const liquidWorldMinY = tileWorldMaxY - liquidFillHeight;
      const overlapWidth = Math.min(aabb.maxX, tileWorldMaxX) - Math.max(aabb.minX, tileWorldMinX);
      const overlapHeight = Math.min(aabb.maxY, tileWorldMaxY) - Math.max(aabb.minY, liquidWorldMinY);
      if (overlapWidth <= 0 || overlapHeight <= 0) {
        continue;
      }

      const overlapArea = overlapWidth * overlapHeight;
      if (liquidKind === 'water') {
        waterOverlapArea += overlapArea;
        if (breathSampleArea > 0) {
          const breathOverlapWidth =
            Math.min(breathSampleAabb.maxX, tileWorldMaxX) -
            Math.max(breathSampleAabb.minX, tileWorldMinX);
          const breathOverlapHeight =
            Math.min(breathSampleAabb.maxY, tileWorldMaxY) -
            Math.max(breathSampleAabb.minY, liquidWorldMinY);
          if (breathOverlapWidth > 0 && breathOverlapHeight > 0) {
            waterBreathOverlapArea += breathOverlapWidth * breathOverlapHeight;
          }
        }
      } else {
        lavaOverlapArea += overlapArea;
      }
    }
  }

  return {
    waterSubmergedFraction: clampNumber(waterOverlapArea / playerArea, 0, 1),
    waterBreathSubmergedFraction:
      breathSampleArea <= 0 ? 0 : clampNumber(waterBreathOverlapArea / breathSampleArea, 0, 1),
    lavaSubmergedFraction: clampNumber(lavaOverlapArea / playerArea, 0, 1)
  };
};

const getAabbOverlappingClimbableTileInfo = (
  world: PlayerClimbableTileQueryWorld,
  aabb: WorldAabb,
  registry: TileMetadataRegistry
): AabbOverlappingClimbableTileInfo | null => {
  const climbTileX = Math.floor(((aabb.minX + aabb.maxX) * 0.5) / TILE_SIZE);
  const minTileY = Math.floor(aabb.minY / TILE_SIZE);
  const maxTileY = Math.floor((aabb.maxY - AABB_INTERSECTION_EPSILON) / TILE_SIZE);
  let highestTileY: number | null = null;
  let lowestTileY: number | null = null;

  for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
    if (isTileClimbable(world.getTile(climbTileX, tileY), registry)) {
      highestTileY ??= tileY;
      lowestTileY = tileY;
    }
  }

  if (highestTileY === null || lowestTileY === null) {
    return null;
  }

  return {
    tileX: climbTileX,
    highestTileY,
    lowestTileY,
    centerX: climbTileX * TILE_SIZE + TILE_SIZE * 0.5
  };
};

const getAabbOverlappingClimbableTileCenterX = (
  world: PlayerClimbableTileQueryWorld,
  aabb: WorldAabb,
  registry: TileMetadataRegistry
): number | null => {
  const climbableTileInfo = getAabbOverlappingClimbableTileInfo(world, aabb, registry);
  return climbableTileInfo?.centerX ?? null;
};

const isAabbOverlappingClimbableTile = (
  world: PlayerClimbableTileQueryWorld,
  aabb: WorldAabb,
  registry: TileMetadataRegistry
): boolean => getAabbOverlappingClimbableTileCenterX(world, aabb, registry) !== null;

const isPlayerOverlappingClimbableTile = (
  world: PlayerClimbableTileQueryWorld,
  state: PlayerState,
  registry: TileMetadataRegistry
): boolean => isAabbOverlappingClimbableTile(world, getPlayerAabb(state), registry);

const resolveRopeDropCatchBottomY = (
  world: PlayerClimbableTileQueryWorld,
  climbableTileInfo: AabbOverlappingClimbableTileInfo | null,
  registry: TileMetadataRegistry
): number | null => {
  if (climbableTileInfo === null) {
    return null;
  }

  const nextTileY = climbableTileInfo.lowestTileY + 1;
  if (isTileClimbable(world.getTile(climbableTileInfo.tileX, nextTileY), registry)) {
    return null;
  }

  return nextTileY * TILE_SIZE;
};

export const isPlayerRopeDropActive = (
  world: PlayerClimbableTileQueryWorld,
  state: PlayerState,
  ropeDropHeld: boolean,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  if (!ropeDropHeld) {
    return false;
  }

  const climbableTileInfo = getAabbOverlappingClimbableTileInfo(world, getPlayerAabb(state), registry);
  if (climbableTileInfo === null) {
    return false;
  }

  const ropeDropCatchBottomY = resolveRopeDropCatchBottomY(world, climbableTileInfo, registry);
  return ropeDropCatchBottomY === null || state.position.y < ropeDropCatchBottomY;
};

const recoverBreathSecondsRemaining = (
  breathSecondsRemaining: number,
  fixedDtSeconds: number,
  maxBreathSeconds: number,
  breathRecoveryPerSecond: number
): number =>
  Math.min(maxBreathSeconds, breathSecondsRemaining + breathRecoveryPerSecond * fixedDtSeconds);

const resolveBreathStepState = ({
  health,
  breathSecondsRemaining,
  drowningDamageTickSecondsRemaining,
  waterBreathSubmergedFraction,
  fixedDtSeconds,
  maxBreathSeconds,
  breathRecoveryPerSecond,
  drowningDamagePerTick,
  drowningDamageTickIntervalSeconds
}: {
  health: number;
  breathSecondsRemaining: number;
  drowningDamageTickSecondsRemaining: number;
  waterBreathSubmergedFraction: number;
  fixedDtSeconds: number;
  maxBreathSeconds: number;
  breathRecoveryPerSecond: number;
  drowningDamagePerTick: number;
  drowningDamageTickIntervalSeconds: number;
}): Pick<PlayerState, 'health' | 'breathSecondsRemaining' | 'drowningDamageTickSecondsRemaining'> => {
  if (waterBreathSubmergedFraction <= 0) {
    return {
      health,
      breathSecondsRemaining: recoverBreathSecondsRemaining(
        breathSecondsRemaining,
        fixedDtSeconds,
        maxBreathSeconds,
        breathRecoveryPerSecond
      ),
      drowningDamageTickSecondsRemaining: drowningDamageTickIntervalSeconds
    };
  }

  const remainingBreathSeconds = Math.max(0, breathSecondsRemaining - fixedDtSeconds);
  if (remainingBreathSeconds > 0) {
    return {
      health,
      breathSecondsRemaining: remainingBreathSeconds,
      drowningDamageTickSecondsRemaining: drowningDamageTickIntervalSeconds
    };
  }

  let remainingHealth = health;
  let remainingTickSeconds =
    breathSecondsRemaining > 0
      ? drowningDamageTickIntervalSeconds
      : drowningDamageTickSecondsRemaining;
  let remainingDt = Math.max(0, fixedDtSeconds - Math.max(0, breathSecondsRemaining));

  while (remainingDt > 0 && remainingHealth > DROWNING_DAMAGE_MIN_HEALTH) {
    if (remainingTickSeconds > remainingDt) {
      remainingTickSeconds -= remainingDt;
      remainingDt = 0;
      continue;
    }

    remainingDt -= remainingTickSeconds;
    remainingHealth = Math.max(DROWNING_DAMAGE_MIN_HEALTH, remainingHealth - drowningDamagePerTick);
    remainingTickSeconds = drowningDamageTickIntervalSeconds;
  }

  return {
    health: remainingHealth,
    breathSecondsRemaining: 0,
    drowningDamageTickSecondsRemaining: remainingTickSeconds
  };
};

const resolveLavaDamageStepState = (
  health: number,
  lavaDamageTickSecondsRemaining: number,
  lavaSubmergedFraction: number,
  fixedDtSeconds: number,
  lavaDamagePerTick: number,
  lavaDamageTickIntervalSeconds: number
): Pick<PlayerState, 'health' | 'lavaDamageTickSecondsRemaining'> => {
  if (lavaSubmergedFraction <= 0) {
    return {
      health,
      lavaDamageTickSecondsRemaining: lavaDamageTickIntervalSeconds
    };
  }

  let remainingHealth = health;
  let remainingTickSeconds = lavaDamageTickSecondsRemaining;
  let remainingDt = fixedDtSeconds;

  while (remainingDt > 0 && remainingHealth > 0) {
    if (remainingTickSeconds > remainingDt) {
      remainingTickSeconds -= remainingDt;
      remainingDt = 0;
      continue;
    }

    remainingDt -= remainingTickSeconds;
    remainingHealth = Math.max(0, remainingHealth - lavaDamagePerTick);
    remainingTickSeconds = lavaDamageTickIntervalSeconds;
  }

  return {
    health: remainingHealth,
    lavaDamageTickSecondsRemaining: remainingTickSeconds
  };
};

const advanceFallDamageRecoverySecondsRemaining = (
  fallDamageRecoverySecondsRemaining: number,
  fixedDtSeconds: number
): number => Math.max(0, fallDamageRecoverySecondsRemaining - fixedDtSeconds);

const advanceHostileContactInvulnerabilitySecondsRemaining = (
  hostileContactInvulnerabilitySecondsRemaining: number,
  fixedDtSeconds: number
): number =>
  Math.max(
    0,
    expectNonNegativeFiniteNumber(
      hostileContactInvulnerabilitySecondsRemaining,
      'state.hostileContactInvulnerabilitySecondsRemaining'
    ) - fixedDtSeconds
  );

const resolveFallDamageStepState = ({
  previousGrounded,
  nextGrounded,
  impactSpeed,
  health,
  fallDamageRecoverySecondsRemaining,
  fixedDtSeconds,
  fallDamageSafeLandingSpeed,
  fallDamageSpeedPerHealth,
  fallDamageRecoverySeconds
}: {
  previousGrounded: boolean;
  nextGrounded: boolean;
  impactSpeed: number;
  health: number;
  fallDamageRecoverySecondsRemaining: number;
  fixedDtSeconds: number;
  fallDamageSafeLandingSpeed: number;
  fallDamageSpeedPerHealth: number;
  fallDamageRecoverySeconds: number;
}): Pick<PlayerState, 'health' | 'fallDamageRecoverySecondsRemaining'> => {
  const nextRecoverySecondsRemaining = advanceFallDamageRecoverySecondsRemaining(
    fallDamageRecoverySecondsRemaining,
    fixedDtSeconds
  );
  if (
    previousGrounded ||
    !nextGrounded ||
    impactSpeed <= fallDamageSafeLandingSpeed ||
    nextRecoverySecondsRemaining > 0 ||
    health <= FALL_DAMAGE_MIN_HEALTH
  ) {
    return {
      health,
      fallDamageRecoverySecondsRemaining: nextRecoverySecondsRemaining
    };
  }

  const damage = Math.max(1, Math.ceil((impactSpeed - fallDamageSafeLandingSpeed) / fallDamageSpeedPerHealth));
  return {
    health: Math.max(FALL_DAMAGE_MIN_HEALTH, health - damage),
    fallDamageRecoverySecondsRemaining: fallDamageRecoverySeconds
  };
};

export const createPlayerState = (options: CreatePlayerStateOptions = {}): PlayerState => {
  const velocity = buildVector(options.velocity, 'velocity');
  const facing = options.facing ?? resolveFacingFromHorizontalVelocity(DEFAULT_PLAYER_FACING, velocity.x);

  return {
    position: buildVector(options.position, 'position'),
    velocity,
    size: buildSize(options.size),
    grounded: (options.grounded ?? false) && velocity.y === 0,
    facing,
    health: buildHealth(options.health),
    breathSecondsRemaining: buildBreathSecondsRemaining(options.breathSecondsRemaining),
    lavaDamageTickSecondsRemaining: buildLavaDamageTickSecondsRemaining(
      options.lavaDamageTickSecondsRemaining
    ),
    drowningDamageTickSecondsRemaining: buildDrowningDamageTickSecondsRemaining(
      options.drowningDamageTickSecondsRemaining
    ),
    fallDamageRecoverySecondsRemaining: buildFallDamageRecoverySecondsRemaining(
      options.fallDamageRecoverySecondsRemaining
    ),
    hostileContactInvulnerabilitySecondsRemaining:
      buildHostileContactInvulnerabilitySecondsRemaining(
        options.hostileContactInvulnerabilitySecondsRemaining
      )
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

export const clonePlayerState = (state: PlayerState): PlayerState => ({
  position: {
    x: state.position.x,
    y: state.position.y
  },
  velocity: {
    x: state.velocity.x,
    y: state.velocity.y
  },
  size: {
    width: state.size.width,
    height: state.size.height
  },
  grounded: state.grounded,
  facing: state.facing,
  health: state.health,
  breathSecondsRemaining: state.breathSecondsRemaining,
  lavaDamageTickSecondsRemaining: state.lavaDamageTickSecondsRemaining,
  drowningDamageTickSecondsRemaining: state.drowningDamageTickSecondsRemaining,
  fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
  hostileContactInvulnerabilitySecondsRemaining: state.hostileContactInvulnerabilitySecondsRemaining
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

  return createPlayerStateFromSpawn(spawn, {
    facing: state.facing,
    health: state.health,
    breathSecondsRemaining: state.breathSecondsRemaining,
    lavaDamageTickSecondsRemaining: state.lavaDamageTickSecondsRemaining,
    drowningDamageTickSecondsRemaining: state.drowningDamageTickSecondsRemaining,
    fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
    hostileContactInvulnerabilitySecondsRemaining: state.hostileContactInvulnerabilitySecondsRemaining
  });
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

export const getPlayerCameraFocusPoint = (state: PlayerState): PlayerVector => ({
  x: state.position.x,
  y: state.position.y - state.size.height * 0.5
});

export const getPlayerCollisionContacts = (
  world: TileWorld,
  state: PlayerState,
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerCollisionContacts => {
  const aabb = getPlayerAabb(state);
  const preferredWallProbeDelta = getPreferredWallContactProbeDelta(state);

  return {
    support: getGroundSupport(world, aabb, registry),
    wall: getWallContact(world, aabb, preferredWallProbeDelta, registry) ??
      getWallContact(world, aabb, -preferredWallProbeDelta, registry),
    ceiling: getAabbContact(world, aabb, 'y', -COLLISION_CONTACT_PROBE_DISTANCE, registry)
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
    facing,
    health: state.health,
    breathSecondsRemaining: state.breathSecondsRemaining,
    lavaDamageTickSecondsRemaining: state.lavaDamageTickSecondsRemaining,
    drowningDamageTickSecondsRemaining: state.drowningDamageTickSecondsRemaining,
    fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
    hostileContactInvulnerabilitySecondsRemaining: state.hostileContactInvulnerabilitySecondsRemaining
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
    facing,
    health: state.health,
    breathSecondsRemaining: state.breathSecondsRemaining,
    lavaDamageTickSecondsRemaining: state.lavaDamageTickSecondsRemaining,
    drowningDamageTickSecondsRemaining: state.drowningDamageTickSecondsRemaining,
    fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
    hostileContactInvulnerabilitySecondsRemaining: state.hostileContactInvulnerabilitySecondsRemaining
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
  const climbY = normalizeClimbYIntent(intent.climbY);
  const ropeDropHeld = intent.ropeDropHeld === true;
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
  const ropeClimbSpeed = expectNonNegativeFiniteNumber(
    options.ropeClimbSpeed ?? DEFAULT_PLAYER_ROPE_CLIMB_SPEED,
    'options.ropeClimbSpeed'
  );
  const ropeCenteringSpeed = expectNonNegativeFiniteNumber(
    options.ropeCenteringSpeed ?? DEFAULT_PLAYER_ROPE_CENTERING_SPEED,
    'options.ropeCenteringSpeed'
  );
  const maxBreathSeconds = expectPositiveFiniteNumber(
    options.maxBreathSeconds ?? DEFAULT_PLAYER_MAX_BREATH_SECONDS,
    'options.maxBreathSeconds'
  );
  const breathRecoveryPerSecond = expectNonNegativeFiniteNumber(
    options.breathRecoveryPerSecond ?? DEFAULT_PLAYER_BREATH_RECOVERY_PER_SECOND,
    'options.breathRecoveryPerSecond'
  );
  const waterBuoyancyAcceleration = expectNonNegativeFiniteNumber(
    options.waterBuoyancyAcceleration ?? DEFAULT_PLAYER_WATER_BUOYANCY_ACCELERATION,
    'options.waterBuoyancyAcceleration'
  );
  const waterHorizontalDragPerSecond = expectNonNegativeFiniteNumber(
    options.waterHorizontalDragPerSecond ?? DEFAULT_PLAYER_WATER_HORIZONTAL_DRAG_PER_SECOND,
    'options.waterHorizontalDragPerSecond'
  );
  const waterVerticalDragPerSecond = expectNonNegativeFiniteNumber(
    options.waterVerticalDragPerSecond ?? DEFAULT_PLAYER_WATER_VERTICAL_DRAG_PER_SECOND,
    'options.waterVerticalDragPerSecond'
  );
  const drowningDamagePerTick = expectNonNegativeFiniteNumber(
    options.drowningDamagePerTick ?? DEFAULT_PLAYER_DROWNING_DAMAGE_PER_TICK,
    'options.drowningDamagePerTick'
  );
  const drowningDamageTickIntervalSeconds = expectPositiveFiniteNumber(
    options.drowningDamageTickIntervalSeconds ?? DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
    'options.drowningDamageTickIntervalSeconds'
  );
  const lavaDamagePerTick = expectNonNegativeFiniteNumber(
    options.lavaDamagePerTick ?? DEFAULT_PLAYER_LAVA_DAMAGE_PER_TICK,
    'options.lavaDamagePerTick'
  );
  const lavaDamageTickIntervalSeconds = expectPositiveFiniteNumber(
    options.lavaDamageTickIntervalSeconds ?? DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
    'options.lavaDamageTickIntervalSeconds'
  );
  const fallDamageSafeLandingSpeed = expectNonNegativeFiniteNumber(
    options.fallDamageSafeLandingSpeed ?? DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED,
    'options.fallDamageSafeLandingSpeed'
  );
  const fallDamageSpeedPerHealth = expectPositiveFiniteNumber(
    options.fallDamageSpeedPerHealth ?? DEFAULT_PLAYER_FALL_DAMAGE_SPEED_PER_HEALTH,
    'options.fallDamageSpeedPerHealth'
  );
  const fallDamageRecoverySeconds = expectNonNegativeFiniteNumber(
    options.fallDamageRecoverySeconds ?? DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS,
    'options.fallDamageRecoverySeconds'
  );
  const hostileContactInvulnerabilitySecondsRemaining =
    advanceHostileContactInvulnerabilitySecondsRemaining(
      state.hostileContactInvulnerabilitySecondsRemaining,
      dt
    );
  const liquidOverlapState = samplePlayerLiquidOverlapState(world, state, registry);
  const overlappingClimbableTile = isPlayerOverlappingClimbableTile(world, state, registry);
  const applyRopeHorizontalBraking = overlappingClimbableTile && moveX === 0 && !ropeDropHeld;
  let velocityX = resolveHorizontalVelocityFromIntent(
    state.velocity.x,
    moveX,
    state.grounded || applyRopeHorizontalBraking,
    dt,
    maxWalkSpeed,
    groundAcceleration,
    airAcceleration,
    groundDeceleration
  );
  let velocityY = state.velocity.y;
  let grounded = state.grounded;
  let activelyOverlappingClimbableTile = overlappingClimbableTile;
  let ropeCenteringApplied = false;
  let ropeDropCatchBottomY: number | null = null;
  const shouldJumpOffRope =
    overlappingClimbableTile && !ropeDropHeld && intent.jumpPressed === true && moveX !== 0;

  if (overlappingClimbableTile) {
    const initialAabb = getPlayerAabb(state);
    const horizontalSweep = sweepAabbAlongAxis(world, initialAabb, 'x', velocityX * dt, registry);
    const afterHorizontalAabb = offsetAabb(initialAabb, horizontalSweep.allowedDelta, 0);
    const activelyOverlappingClimbableTileInfo = getAabbOverlappingClimbableTileInfo(
      world,
      afterHorizontalAabb,
      registry
    );

    // Check rope overlap after the same horizontal sweep order used by collisions so sideways
    // detaches resume gravity immediately instead of holding for one sticky extra tick.
    activelyOverlappingClimbableTile = activelyOverlappingClimbableTileInfo !== null;

    if (
      activelyOverlappingClimbableTile &&
      moveX === 0 &&
      activelyOverlappingClimbableTileInfo !== null &&
      !ropeDropHeld
    ) {
      const centeredPositionX = moveTowards(
        (afterHorizontalAabb.minX + afterHorizontalAabb.maxX) * 0.5,
        activelyOverlappingClimbableTileInfo.centerX,
        ropeCenteringSpeed * dt
      );
      velocityX = (centeredPositionX - state.position.x) / dt;
      ropeCenteringApplied = centeredPositionX !== state.position.x;
    }

    if (ropeDropHeld) {
      ropeDropCatchBottomY = resolveRopeDropCatchBottomY(
        world,
        activelyOverlappingClimbableTileInfo,
        registry
      );
    }
  }

  if (shouldJumpOffRope) {
    // A fresh jump press with horizontal input should release rope hold immediately, even when
    // the same tick's horizontal movement has not yet cleared the rope column.
    activelyOverlappingClimbableTile = false;
    velocityY = -jumpSpeed;
    grounded = false;
  } else if (intent.jumpPressed === true && grounded && !(activelyOverlappingClimbableTile && climbY < 0)) {
    velocityY = -jumpSpeed;
    grounded = false;
  }

  if (activelyOverlappingClimbableTile && !ropeDropHeld) {
    grounded = false;
    if (climbY < 0) {
      velocityY = -ropeClimbSpeed;
    } else if (climbY > 0) {
      velocityY = ropeClimbSpeed;
    } else {
      velocityY = 0;
    }
  } else {
    velocityY = Math.min(velocityY + gravityAcceleration * dt, maxFallSpeed);
    if (liquidOverlapState.waterSubmergedFraction > 0) {
      velocityY -= waterBuoyancyAcceleration * liquidOverlapState.waterSubmergedFraction * dt;
      velocityX = applyLinearDrag(
        velocityX,
        waterHorizontalDragPerSecond,
        liquidOverlapState.waterSubmergedFraction,
        dt
      );
      velocityY = applyLinearDrag(
        velocityY,
        waterVerticalDragPerSecond,
        liquidOverlapState.waterSubmergedFraction,
        dt
      );
    }
  }

  const lavaDamageStepState = resolveLavaDamageStepState(
    state.health,
    state.lavaDamageTickSecondsRemaining,
    liquidOverlapState.lavaSubmergedFraction,
    dt,
    lavaDamagePerTick,
    lavaDamageTickIntervalSeconds
  );
  const breathStepState = resolveBreathStepState({
    health: lavaDamageStepState.health,
    breathSecondsRemaining: state.breathSecondsRemaining,
    drowningDamageTickSecondsRemaining: state.drowningDamageTickSecondsRemaining,
    waterBreathSubmergedFraction: liquidOverlapState.waterBreathSubmergedFraction,
    fixedDtSeconds: dt,
    maxBreathSeconds,
    breathRecoveryPerSecond,
    drowningDamagePerTick,
    drowningDamageTickIntervalSeconds
  });

  let steppedPlayerState = movePlayerStateWithCollisions(
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
      facing: state.facing,
      health: breathStepState.health,
      breathSecondsRemaining: breathStepState.breathSecondsRemaining,
      lavaDamageTickSecondsRemaining: lavaDamageStepState.lavaDamageTickSecondsRemaining,
      drowningDamageTickSecondsRemaining: breathStepState.drowningDamageTickSecondsRemaining,
      fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
      hostileContactInvulnerabilitySecondsRemaining
    },
    dt,
    registry
  );

  if (ropeDropCatchBottomY !== null && steppedPlayerState.position.y > ropeDropCatchBottomY) {
    steppedPlayerState = {
      ...steppedPlayerState,
      position: {
        x: steppedPlayerState.position.x,
        y: ropeDropCatchBottomY
      },
      velocity: {
        x: steppedPlayerState.velocity.x,
        y: 0
      }
    };
  }

  const fallDamageStepState = resolveFallDamageStepState({
    previousGrounded: state.grounded,
    nextGrounded: steppedPlayerState.grounded,
    impactSpeed: Math.max(0, velocityY),
    health: steppedPlayerState.health,
    fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
    fixedDtSeconds: dt,
    fallDamageSafeLandingSpeed,
    fallDamageSpeedPerHealth,
    fallDamageRecoverySeconds
  });

  return {
    ...steppedPlayerState,
    facing: ropeCenteringApplied ? state.facing : steppedPlayerState.facing,
    health: fallDamageStepState.health,
    fallDamageRecoverySecondsRemaining: fallDamageStepState.fallDamageRecoverySecondsRemaining
  };
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
