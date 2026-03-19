import { MAX_LIQUID_LEVEL, TILE_SIZE } from './constants';
import { doesAabbOverlapSolid, sweepAabbAlongAxis, type SolidTileCollision, type WorldAabb } from './collision';
import { getTileLiquidKind, isTileClimbable, isTileSolid, TILE_METADATA } from './tileMetadata';
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
  maxHealth: number;
  health: number;
  breathSecondsRemaining: number;
  lavaDamageTickSecondsRemaining: number;
  drowningDamageTickSecondsRemaining: number;
  fallDamageRecoverySecondsRemaining: number;
  hostileContactInvulnerabilitySecondsRemaining: number;
}

export interface PlayerWaterSubmersionTelemetry {
  headSubmergedInWater: boolean;
  waterSubmergedFraction: number;
  lavaSubmergedFraction: number;
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
  maxHealth?: number;
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
  glideHeld?: boolean;
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
  glideMaxFallSpeed?: number;
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

interface ResolvedStepPlayerStateInputs {
  dt: number;
  moveX: number;
  jumpPressed: boolean;
  climbY: number;
  ropeDropHeld: boolean;
  glideHeld: boolean;
  gravityAcceleration: number;
  maxFallSpeed: number;
  glideMaxFallSpeed: number;
  maxWalkSpeed: number;
  groundAcceleration: number;
  airAcceleration: number;
  groundDeceleration: number;
  jumpSpeed: number;
  ropeClimbSpeed: number;
  ropeCenteringSpeed: number;
  maxBreathSeconds: number;
  breathRecoveryPerSecond: number;
  waterBuoyancyAcceleration: number;
  waterHorizontalDragPerSecond: number;
  waterVerticalDragPerSecond: number;
  drowningDamagePerTick: number;
  drowningDamageTickIntervalSeconds: number;
  lavaDamagePerTick: number;
  lavaDamageTickIntervalSeconds: number;
  fallDamageSafeLandingSpeed: number;
  fallDamageSpeedPerHealth: number;
  fallDamageRecoverySeconds: number;
}

interface ResolvedPlayerStepMotionState {
  velocityX: number;
  velocityY: number;
  grounded: boolean;
  liquidOverlapState: PlayerLiquidOverlapState;
  ropeCenteringApplied: boolean;
  ropeDropCatchInfo: RopeDropCatchInfo | null;
  hostileContactInvulnerabilitySecondsRemaining: number;
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
export const DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED = 180;
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

type PlayerLiquidQueryWorld = Pick<TileWorld, 'getTile' | 'getLiquidLevel'>;

interface PlayerClimbableTileQueryWorld {
  getTile(worldTileX: number, worldTileY: number): number;
}

interface AabbOverlappingClimbableTileInfo {
  tileX: number;
  highestTileY: number;
  lowestTileY: number;
  centerX: number;
}

interface RopeDropCatchInfo {
  bottomY: number;
  solidLanding: boolean;
  slowdownTopY: number;
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

const buildMaxHealth = (maxHealth: number | undefined): number =>
  expectPositiveFiniteNumber(maxHealth ?? DEFAULT_PLAYER_MAX_HEALTH, 'maxHealth');

const buildHealth = (health: number | undefined, maxHealth: number): number => {
  const resolvedHealth = expectNonNegativeFiniteNumber(health ?? maxHealth, 'health');
  if (resolvedHealth > maxHealth) {
    throw new Error('health must be less than or equal to maxHealth');
  }

  return resolvedHealth;
};

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
  world: PlayerLiquidQueryWorld,
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

export const getPlayerWaterSubmersionTelemetry = (
  world: TileWorld,
  state: PlayerState,
  registry: TileMetadataRegistry = TILE_METADATA
): PlayerWaterSubmersionTelemetry => {
  const liquidOverlapState = samplePlayerLiquidOverlapState(world, state, registry);
  return {
    headSubmergedInWater: liquidOverlapState.waterBreathSubmergedFraction > 0,
    waterSubmergedFraction: liquidOverlapState.waterSubmergedFraction,
    lavaSubmergedFraction: liquidOverlapState.lavaSubmergedFraction
  };
};

export const getPlayerLavaDamageTickApplied = (
  world: PlayerLiquidQueryWorld,
  state: PlayerState,
  fixedDtSeconds: number,
  options: Pick<StepPlayerStateOptions, 'lavaDamagePerTick' | 'lavaDamageTickIntervalSeconds'> = {},
  registry: TileMetadataRegistry = TILE_METADATA
): number => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const lavaDamagePerTick = expectNonNegativeFiniteNumber(
    options.lavaDamagePerTick ?? DEFAULT_PLAYER_LAVA_DAMAGE_PER_TICK,
    'options.lavaDamagePerTick'
  );
  const lavaDamageTickIntervalSeconds = expectPositiveFiniteNumber(
    options.lavaDamageTickIntervalSeconds ?? DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
    'options.lavaDamageTickIntervalSeconds'
  );
  const liquidOverlapState = samplePlayerLiquidOverlapState(world, state, registry);
  return resolveLavaDamageStepState(
    state.health,
    state.lavaDamageTickSecondsRemaining,
    liquidOverlapState.lavaSubmergedFraction,
    dt,
    lavaDamagePerTick,
    lavaDamageTickIntervalSeconds
  ).damageApplied;
};

export const getPlayerDrowningDamageTickApplied = (
  world: PlayerLiquidQueryWorld,
  state: PlayerState,
  fixedDtSeconds: number,
  options: Pick<
    StepPlayerStateOptions,
    | 'maxBreathSeconds'
    | 'breathRecoveryPerSecond'
    | 'drowningDamagePerTick'
    | 'drowningDamageTickIntervalSeconds'
  > = {},
  registry: TileMetadataRegistry = TILE_METADATA
): number => {
  const dt = expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds');
  const maxBreathSeconds = expectPositiveFiniteNumber(
    options.maxBreathSeconds ?? DEFAULT_PLAYER_MAX_BREATH_SECONDS,
    'options.maxBreathSeconds'
  );
  const breathRecoveryPerSecond = expectNonNegativeFiniteNumber(
    options.breathRecoveryPerSecond ?? DEFAULT_PLAYER_BREATH_RECOVERY_PER_SECOND,
    'options.breathRecoveryPerSecond'
  );
  const drowningDamagePerTick = expectNonNegativeFiniteNumber(
    options.drowningDamagePerTick ?? DEFAULT_PLAYER_DROWNING_DAMAGE_PER_TICK,
    'options.drowningDamagePerTick'
  );
  const drowningDamageTickIntervalSeconds = expectPositiveFiniteNumber(
    options.drowningDamageTickIntervalSeconds ?? DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
    'options.drowningDamageTickIntervalSeconds'
  );
  const liquidOverlapState = samplePlayerLiquidOverlapState(world, state, registry);
  return resolveBreathStepState({
    health: state.health,
    breathSecondsRemaining: state.breathSecondsRemaining,
    drowningDamageTickSecondsRemaining: state.drowningDamageTickSecondsRemaining,
    waterBreathSubmergedFraction: liquidOverlapState.waterBreathSubmergedFraction,
    fixedDtSeconds: dt,
    maxBreathSeconds,
    breathRecoveryPerSecond,
    drowningDamagePerTick,
    drowningDamageTickIntervalSeconds
  }).damageApplied;
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

const resolveRopeDropCatchInfo = (
  world: PlayerClimbableTileQueryWorld,
  climbableTileInfo: AabbOverlappingClimbableTileInfo | null,
  registry: TileMetadataRegistry
): RopeDropCatchInfo | null => {
  if (climbableTileInfo === null) {
    return null;
  }

  let nextTileY = climbableTileInfo.lowestTileY + 1;
  let nextTileId = world.getTile(climbableTileInfo.tileX, nextTileY);
  while (isTileClimbable(nextTileId, registry)) {
    nextTileY += 1;
    nextTileId = world.getTile(climbableTileInfo.tileX, nextTileY);
  }

  const bottomY = nextTileY * TILE_SIZE;
  return {
    bottomY,
    solidLanding: isTileSolid(nextTileId, registry),
    slowdownTopY: bottomY - TILE_SIZE
  };
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

  const ropeDropCatchInfo = resolveRopeDropCatchInfo(world, climbableTileInfo, registry);
  return ropeDropCatchInfo === null || state.position.y < ropeDropCatchInfo.bottomY;
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
}): Pick<PlayerState, 'health' | 'breathSecondsRemaining' | 'drowningDamageTickSecondsRemaining'> & {
  damageApplied: number;
} => {
  if (waterBreathSubmergedFraction <= 0) {
    return {
      health,
      breathSecondsRemaining: recoverBreathSecondsRemaining(
        breathSecondsRemaining,
        fixedDtSeconds,
        maxBreathSeconds,
        breathRecoveryPerSecond
      ),
      drowningDamageTickSecondsRemaining: drowningDamageTickIntervalSeconds,
      damageApplied: 0
    };
  }

  const remainingBreathSeconds = Math.max(0, breathSecondsRemaining - fixedDtSeconds);
  if (remainingBreathSeconds > 0) {
    return {
      health,
      breathSecondsRemaining: remainingBreathSeconds,
      drowningDamageTickSecondsRemaining: drowningDamageTickIntervalSeconds,
      damageApplied: 0
    };
  }

  let remainingHealth = health;
  let remainingTickSeconds =
    breathSecondsRemaining > 0
      ? drowningDamageTickIntervalSeconds
      : drowningDamageTickSecondsRemaining;
  let remainingDt = Math.max(0, fixedDtSeconds - Math.max(0, breathSecondsRemaining));
  let damageApplied = 0;

  while (remainingDt > 0 && remainingHealth > DROWNING_DAMAGE_MIN_HEALTH) {
    if (remainingTickSeconds > remainingDt) {
      remainingTickSeconds -= remainingDt;
      remainingDt = 0;
      continue;
    }

    remainingDt -= remainingTickSeconds;
    const appliedDamage = Math.min(remainingHealth, drowningDamagePerTick);
    damageApplied += appliedDamage;
    remainingHealth = Math.max(DROWNING_DAMAGE_MIN_HEALTH, remainingHealth - appliedDamage);
    remainingTickSeconds = drowningDamageTickIntervalSeconds;
  }

  return {
    health: remainingHealth,
    breathSecondsRemaining: 0,
    drowningDamageTickSecondsRemaining: remainingTickSeconds,
    damageApplied
  };
};

const resolveLavaDamageStepState = (
  health: number,
  lavaDamageTickSecondsRemaining: number,
  lavaSubmergedFraction: number,
  fixedDtSeconds: number,
  lavaDamagePerTick: number,
  lavaDamageTickIntervalSeconds: number
): Pick<PlayerState, 'health' | 'lavaDamageTickSecondsRemaining'> & {
  damageApplied: number;
} => {
  if (lavaSubmergedFraction <= 0) {
    return {
      health,
      lavaDamageTickSecondsRemaining: lavaDamageTickIntervalSeconds,
      damageApplied: 0
    };
  }

  let remainingHealth = health;
  let remainingTickSeconds = lavaDamageTickSecondsRemaining;
  let remainingDt = fixedDtSeconds;
  let damageApplied = 0;

  while (remainingDt > 0 && remainingHealth > 0) {
    if (remainingTickSeconds > remainingDt) {
      remainingTickSeconds -= remainingDt;
      remainingDt = 0;
      continue;
    }

    remainingDt -= remainingTickSeconds;
    const appliedDamage = Math.min(remainingHealth, lavaDamagePerTick);
    damageApplied += appliedDamage;
    remainingHealth = Math.max(0, remainingHealth - appliedDamage);
    remainingTickSeconds = lavaDamageTickIntervalSeconds;
  }

  return {
    health: remainingHealth,
    lavaDamageTickSecondsRemaining: remainingTickSeconds,
    damageApplied
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

const resolveStepPlayerStateInputs = (
  fixedDtSeconds: number,
  intent: PlayerMovementIntent,
  options: StepPlayerStateOptions
): ResolvedStepPlayerStateInputs => ({
  dt: expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds'),
  moveX: normalizeMoveXIntent(intent.moveX),
  jumpPressed: intent.jumpPressed === true,
  climbY: normalizeClimbYIntent(intent.climbY),
  ropeDropHeld: intent.ropeDropHeld === true,
  glideHeld: intent.glideHeld === true,
  gravityAcceleration: expectNonNegativeFiniteNumber(
    options.gravityAcceleration ?? DEFAULT_PLAYER_GRAVITY_ACCELERATION,
    'options.gravityAcceleration'
  ),
  maxFallSpeed: expectNonNegativeFiniteNumber(
    options.maxFallSpeed ?? DEFAULT_PLAYER_MAX_FALL_SPEED,
    'options.maxFallSpeed'
  ),
  glideMaxFallSpeed: expectNonNegativeFiniteNumber(
    options.glideMaxFallSpeed ?? DEFAULT_PLAYER_GLIDE_MAX_FALL_SPEED,
    'options.glideMaxFallSpeed'
  ),
  maxWalkSpeed: expectNonNegativeFiniteNumber(
    options.maxWalkSpeed ?? DEFAULT_PLAYER_MAX_WALK_SPEED,
    'options.maxWalkSpeed'
  ),
  groundAcceleration: expectNonNegativeFiniteNumber(
    options.groundAcceleration ?? DEFAULT_PLAYER_GROUND_ACCELERATION,
    'options.groundAcceleration'
  ),
  airAcceleration: expectNonNegativeFiniteNumber(
    options.airAcceleration ?? DEFAULT_PLAYER_AIR_ACCELERATION,
    'options.airAcceleration'
  ),
  groundDeceleration: expectNonNegativeFiniteNumber(
    options.groundDeceleration ?? DEFAULT_PLAYER_GROUND_DECELERATION,
    'options.groundDeceleration'
  ),
  jumpSpeed: expectNonNegativeFiniteNumber(options.jumpSpeed ?? DEFAULT_PLAYER_JUMP_SPEED, 'options.jumpSpeed'),
  ropeClimbSpeed: expectNonNegativeFiniteNumber(
    options.ropeClimbSpeed ?? DEFAULT_PLAYER_ROPE_CLIMB_SPEED,
    'options.ropeClimbSpeed'
  ),
  ropeCenteringSpeed: expectNonNegativeFiniteNumber(
    options.ropeCenteringSpeed ?? DEFAULT_PLAYER_ROPE_CENTERING_SPEED,
    'options.ropeCenteringSpeed'
  ),
  maxBreathSeconds: expectPositiveFiniteNumber(
    options.maxBreathSeconds ?? DEFAULT_PLAYER_MAX_BREATH_SECONDS,
    'options.maxBreathSeconds'
  ),
  breathRecoveryPerSecond: expectNonNegativeFiniteNumber(
    options.breathRecoveryPerSecond ?? DEFAULT_PLAYER_BREATH_RECOVERY_PER_SECOND,
    'options.breathRecoveryPerSecond'
  ),
  waterBuoyancyAcceleration: expectNonNegativeFiniteNumber(
    options.waterBuoyancyAcceleration ?? DEFAULT_PLAYER_WATER_BUOYANCY_ACCELERATION,
    'options.waterBuoyancyAcceleration'
  ),
  waterHorizontalDragPerSecond: expectNonNegativeFiniteNumber(
    options.waterHorizontalDragPerSecond ?? DEFAULT_PLAYER_WATER_HORIZONTAL_DRAG_PER_SECOND,
    'options.waterHorizontalDragPerSecond'
  ),
  waterVerticalDragPerSecond: expectNonNegativeFiniteNumber(
    options.waterVerticalDragPerSecond ?? DEFAULT_PLAYER_WATER_VERTICAL_DRAG_PER_SECOND,
    'options.waterVerticalDragPerSecond'
  ),
  drowningDamagePerTick: expectNonNegativeFiniteNumber(
    options.drowningDamagePerTick ?? DEFAULT_PLAYER_DROWNING_DAMAGE_PER_TICK,
    'options.drowningDamagePerTick'
  ),
  drowningDamageTickIntervalSeconds: expectPositiveFiniteNumber(
    options.drowningDamageTickIntervalSeconds ?? DEFAULT_PLAYER_DROWNING_DAMAGE_TICK_INTERVAL_SECONDS,
    'options.drowningDamageTickIntervalSeconds'
  ),
  lavaDamagePerTick: expectNonNegativeFiniteNumber(
    options.lavaDamagePerTick ?? DEFAULT_PLAYER_LAVA_DAMAGE_PER_TICK,
    'options.lavaDamagePerTick'
  ),
  lavaDamageTickIntervalSeconds: expectPositiveFiniteNumber(
    options.lavaDamageTickIntervalSeconds ?? DEFAULT_PLAYER_LAVA_DAMAGE_TICK_INTERVAL_SECONDS,
    'options.lavaDamageTickIntervalSeconds'
  ),
  fallDamageSafeLandingSpeed: expectNonNegativeFiniteNumber(
    options.fallDamageSafeLandingSpeed ?? DEFAULT_PLAYER_FALL_DAMAGE_SAFE_LANDING_SPEED,
    'options.fallDamageSafeLandingSpeed'
  ),
  fallDamageSpeedPerHealth: expectPositiveFiniteNumber(
    options.fallDamageSpeedPerHealth ?? DEFAULT_PLAYER_FALL_DAMAGE_SPEED_PER_HEALTH,
    'options.fallDamageSpeedPerHealth'
  ),
  fallDamageRecoverySeconds: expectNonNegativeFiniteNumber(
    options.fallDamageRecoverySeconds ?? DEFAULT_PLAYER_FALL_DAMAGE_RECOVERY_SECONDS,
    'options.fallDamageRecoverySeconds'
  )
});

const resolvePlayerStepMotionState = (
  world: TileWorld,
  state: PlayerState,
  stepInputs: ResolvedStepPlayerStateInputs,
  registry: TileMetadataRegistry
): ResolvedPlayerStepMotionState => {
  const hostileContactInvulnerabilitySecondsRemaining =
    advanceHostileContactInvulnerabilitySecondsRemaining(
      state.hostileContactInvulnerabilitySecondsRemaining,
      stepInputs.dt
    );
  const liquidOverlapState = samplePlayerLiquidOverlapState(world, state, registry);
  const overlappingClimbableTile = isPlayerOverlappingClimbableTile(world, state, registry);
  const applyRopeHorizontalBraking =
    overlappingClimbableTile && stepInputs.moveX === 0 && !stepInputs.ropeDropHeld;
  let velocityX = resolveHorizontalVelocityFromIntent(
    state.velocity.x,
    stepInputs.moveX,
    state.grounded || applyRopeHorizontalBraking,
    stepInputs.dt,
    stepInputs.maxWalkSpeed,
    stepInputs.groundAcceleration,
    stepInputs.airAcceleration,
    stepInputs.groundDeceleration
  );
  let velocityY = state.velocity.y;
  let grounded = state.grounded;
  let activelyOverlappingClimbableTile = overlappingClimbableTile;
  let ropeCenteringApplied = false;
  let ropeDropCatchInfo: RopeDropCatchInfo | null = null;
  const shouldJumpOffRope =
    overlappingClimbableTile &&
    !stepInputs.ropeDropHeld &&
    stepInputs.jumpPressed &&
    stepInputs.moveX !== 0;

  if (overlappingClimbableTile) {
    const initialAabb = getPlayerAabb(state);
    const horizontalSweep = sweepAabbAlongAxis(
      world,
      initialAabb,
      'x',
      velocityX * stepInputs.dt,
      registry
    );
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
      stepInputs.moveX === 0 &&
      activelyOverlappingClimbableTileInfo !== null &&
      !stepInputs.ropeDropHeld
    ) {
      const centeredPositionX = moveTowards(
        (afterHorizontalAabb.minX + afterHorizontalAabb.maxX) * 0.5,
        activelyOverlappingClimbableTileInfo.centerX,
        stepInputs.ropeCenteringSpeed * stepInputs.dt
      );
      velocityX = (centeredPositionX - state.position.x) / stepInputs.dt;
      ropeCenteringApplied = centeredPositionX !== state.position.x;
    }

    if (stepInputs.ropeDropHeld) {
      ropeDropCatchInfo = resolveRopeDropCatchInfo(
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
    velocityY = -stepInputs.jumpSpeed;
    grounded = false;
  } else if (
    stepInputs.jumpPressed &&
    grounded &&
    !(activelyOverlappingClimbableTile && stepInputs.climbY < 0)
  ) {
    velocityY = -stepInputs.jumpSpeed;
    grounded = false;
  }

  if (activelyOverlappingClimbableTile && !stepInputs.ropeDropHeld) {
    grounded = false;
    if (stepInputs.climbY < 0) {
      velocityY = -stepInputs.ropeClimbSpeed;
    } else if (stepInputs.climbY > 0) {
      velocityY = stepInputs.ropeClimbSpeed;
    } else {
      velocityY = 0;
    }
  } else {
    velocityY = Math.min(velocityY + stepInputs.gravityAcceleration * stepInputs.dt, stepInputs.maxFallSpeed);
    if (liquidOverlapState.waterSubmergedFraction > 0) {
      velocityY -=
        stepInputs.waterBuoyancyAcceleration *
        liquidOverlapState.waterSubmergedFraction *
        stepInputs.dt;
      velocityX = applyLinearDrag(
        velocityX,
        stepInputs.waterHorizontalDragPerSecond,
        liquidOverlapState.waterSubmergedFraction,
        stepInputs.dt
      );
      velocityY = applyLinearDrag(
        velocityY,
        stepInputs.waterVerticalDragPerSecond,
        liquidOverlapState.waterSubmergedFraction,
        stepInputs.dt
      );
    }
    if (
      ropeDropCatchInfo?.solidLanding === true &&
      state.position.y + velocityY * stepInputs.dt > ropeDropCatchInfo.slowdownTopY
    ) {
      // Ease through the final rope tile so ground-ending rope drops never convert into
      // a hard landing when the column reaches solid ground.
      velocityY = Math.min(
        velocityY,
        stepInputs.ropeClimbSpeed,
        stepInputs.fallDamageSafeLandingSpeed
      );
    }

    if (stepInputs.glideHeld && !grounded && velocityY > 0) {
      velocityY = Math.min(velocityY, stepInputs.glideMaxFallSpeed);
    }
  }

  return {
    velocityX,
    velocityY,
    grounded,
    liquidOverlapState,
    ropeCenteringApplied,
    ropeDropCatchInfo,
    hostileContactInvulnerabilitySecondsRemaining
  };
};

export const createPlayerState = (options: CreatePlayerStateOptions = {}): PlayerState => {
  const velocity = buildVector(options.velocity, 'velocity');
  const facing = options.facing ?? resolveFacingFromHorizontalVelocity(DEFAULT_PLAYER_FACING, velocity.x);
  const maxHealth = buildMaxHealth(options.maxHealth);

  return {
    position: buildVector(options.position, 'position'),
    velocity,
    size: buildSize(options.size),
    grounded: (options.grounded ?? false) && velocity.y === 0,
    facing,
    maxHealth,
    health: buildHealth(options.health, maxHealth),
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
  maxHealth: state.maxHealth,
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
    maxHealth: state.maxHealth,
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
    maxHealth: state.maxHealth,
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
    maxHealth: state.maxHealth,
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
  const stepInputs = resolveStepPlayerStateInputs(fixedDtSeconds, intent, options);
  const stepMotionState = resolvePlayerStepMotionState(world, state, stepInputs, registry);

  const lavaDamageStepState = resolveLavaDamageStepState(
    state.health,
    state.lavaDamageTickSecondsRemaining,
    stepMotionState.liquidOverlapState.lavaSubmergedFraction,
    stepInputs.dt,
    stepInputs.lavaDamagePerTick,
    stepInputs.lavaDamageTickIntervalSeconds
  );
  const breathStepState = resolveBreathStepState({
    health: lavaDamageStepState.health,
    breathSecondsRemaining: state.breathSecondsRemaining,
    drowningDamageTickSecondsRemaining: state.drowningDamageTickSecondsRemaining,
    waterBreathSubmergedFraction: stepMotionState.liquidOverlapState.waterBreathSubmergedFraction,
    fixedDtSeconds: stepInputs.dt,
    maxBreathSeconds: stepInputs.maxBreathSeconds,
    breathRecoveryPerSecond: stepInputs.breathRecoveryPerSecond,
    drowningDamagePerTick: stepInputs.drowningDamagePerTick,
    drowningDamageTickIntervalSeconds: stepInputs.drowningDamageTickIntervalSeconds
  });

  let steppedPlayerState = movePlayerStateWithCollisions(
    world,
    {
      position: {
        x: state.position.x,
        y: state.position.y
      },
      velocity: {
        x: stepMotionState.velocityX,
        y: stepMotionState.velocityY
      },
      size: {
        width: state.size.width,
        height: state.size.height
      },
      grounded: stepMotionState.grounded,
      facing: state.facing,
      maxHealth: state.maxHealth,
      health: breathStepState.health,
      breathSecondsRemaining: breathStepState.breathSecondsRemaining,
      lavaDamageTickSecondsRemaining: lavaDamageStepState.lavaDamageTickSecondsRemaining,
      drowningDamageTickSecondsRemaining: breathStepState.drowningDamageTickSecondsRemaining,
      fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
      hostileContactInvulnerabilitySecondsRemaining:
        stepMotionState.hostileContactInvulnerabilitySecondsRemaining
    },
    stepInputs.dt,
    registry
  );

  if (
    stepMotionState.ropeDropCatchInfo !== null &&
    steppedPlayerState.position.y > stepMotionState.ropeDropCatchInfo.bottomY
  ) {
    steppedPlayerState = {
      ...steppedPlayerState,
      position: {
        x: steppedPlayerState.position.x,
        y: stepMotionState.ropeDropCatchInfo.bottomY
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
    impactSpeed: Math.max(0, stepMotionState.velocityY),
    health: steppedPlayerState.health,
    fallDamageRecoverySecondsRemaining: state.fallDamageRecoverySecondsRemaining,
    fixedDtSeconds: stepInputs.dt,
    fallDamageSafeLandingSpeed: stepInputs.fallDamageSafeLandingSpeed,
    fallDamageSpeedPerHealth: stepInputs.fallDamageSpeedPerHealth,
    fallDamageRecoverySeconds: stepInputs.fallDamageRecoverySeconds
  });

  return {
    ...steppedPlayerState,
    facing: stepMotionState.ropeCenteringApplied ? state.facing : steppedPlayerState.facing,
    health: fallDamageStepState.health,
    fallDamageRecoverySecondsRemaining: fallDamageStepState.fallDamageRecoverySecondsRemaining
  };
};

export const getPlayerLandingImpactSpeed = (
  world: TileWorld,
  state: PlayerState,
  fixedDtSeconds: number,
  intent: PlayerMovementIntent = {},
  options: StepPlayerStateOptions = {},
  registry: TileMetadataRegistry = TILE_METADATA
): number => {
  const stepInputs = resolveStepPlayerStateInputs(fixedDtSeconds, intent, options);
  const stepMotionState = resolvePlayerStepMotionState(world, state, stepInputs, registry);
  return Math.max(0, stepMotionState.velocityY);
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
