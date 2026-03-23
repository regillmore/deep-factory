import type { WorldAabb } from './collision';
import { TILE_SIZE } from './constants';
import {
  applyHostileSlimeDamage,
  cloneHostileSlimeState,
  getHostileSlimeAabb,
  type HostileSlimeFacing,
  type HostileSlimeState
} from './hostileSlimeState';
import { spendPlayerMana } from './playerMana';
import {
  clonePlayerState,
  getPlayerCameraFocusPoint,
  type PlayerState
} from './playerState';
import { isTileSolid, TILE_METADATA, type TileMetadataRegistry } from './tileMetadata';

export const STARTER_WAND_ITEM_ID = 'wand';
export const DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS = 0.35;
export const DEFAULT_STARTER_WAND_MANA_COST = 5;
export const DEFAULT_STARTER_WAND_FIREBOLT_SPEED = 240;
export const DEFAULT_STARTER_WAND_FIREBOLT_RADIUS = 4;
export const DEFAULT_STARTER_WAND_FIREBOLT_LIFETIME_SECONDS = 1.2;
export const DEFAULT_STARTER_WAND_FIREBOLT_DAMAGE = 12;
export const DEFAULT_STARTER_WAND_FIREBOLT_KNOCKBACK_SPEED = 150;

export interface StarterWandWorldPoint {
  x: number;
  y: number;
}

export interface StarterWandDirection {
  x: number;
  y: number;
}

export interface StarterWandCooldownState {
  secondsRemaining: number;
}

export interface StarterWandFireboltState {
  position: StarterWandWorldPoint;
  velocity: StarterWandDirection;
  radius: number;
  secondsRemaining: number;
}

export interface StarterWandHostileSlimeTarget {
  entityId: number;
  state: HostileSlimeState;
}

export interface TryUseStarterWandOptions {
  cooldownSeconds?: number;
  manaCost?: number;
  fireboltSpeed?: number;
  fireboltRadius?: number;
  fireboltLifetimeSeconds?: number;
}

export interface TryUseStarterWandResult {
  nextPlayerState: PlayerState;
  nextCooldownState: StarterWandCooldownState;
  fireboltState: StarterWandFireboltState | null;
  castStarted: boolean;
  blockedReason: 'cooldown' | 'dead' | 'insufficient-mana' | null;
}

export interface StarterWandFireboltTerrainHitEvent {
  kind: 'terrain';
  worldTileX: number;
  worldTileY: number;
  tileId: number;
}

export interface StarterWandFireboltHostileSlimeHitEvent {
  kind: 'hostile-slime';
  entityId: number;
  direction: StarterWandDirection;
  damage: number;
  knockbackSpeed: number;
}

export type StarterWandFireboltHitEvent =
  | StarterWandFireboltTerrainHitEvent
  | StarterWandFireboltHostileSlimeHitEvent;

export interface StepStarterWandFireboltStateOptions {
  world: {
    getTile: (worldTileX: number, worldTileY: number) => number;
  };
  hostileSlimes: readonly StarterWandHostileSlimeTarget[];
  fixedDtSeconds: number;
  damage?: number;
  knockbackSpeed?: number;
  registry?: TileMetadataRegistry;
}

export interface StepStarterWandFireboltStateResult {
  nextState: StarterWandFireboltState | null;
  hitEvent: StarterWandFireboltHitEvent | null;
}

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
  direction: StarterWandDirection;
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

const cloneStarterWandWorldPoint = (
  point: StarterWandWorldPoint
): StarterWandWorldPoint => ({
  x: point.x,
  y: point.y
});

const cloneStarterWandDirection = (
  direction: StarterWandDirection
): StarterWandDirection => ({
  x: direction.x,
  y: direction.y
});

const normalizeStarterWandDirection = (
  direction: StarterWandDirection,
  label: string
): StarterWandDirection => {
  const x = expectFiniteNumber(direction.x, `${label}.x`);
  const y = expectFiniteNumber(direction.y, `${label}.y`);
  const magnitude = Math.hypot(x, y);
  if (magnitude <= DIRECTION_EPSILON) {
    throw new Error(`${label} magnitude must be greater than 0`);
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
};

const createStarterWandFacingFallbackDirection = (
  playerState: Pick<PlayerState, 'facing'>
): StarterWandDirection => ({
  x: playerState.facing === 'left' ? -1 : 1,
  y: 0
});

const resolveStarterWandCastDirection = (
  playerState: PlayerState,
  targetWorldPoint: StarterWandWorldPoint
): StarterWandDirection => {
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const normalizedTargetWorldPoint = {
    x: expectFiniteNumber(targetWorldPoint.x, 'targetWorldPoint.x'),
    y: expectFiniteNumber(targetWorldPoint.y, 'targetWorldPoint.y')
  };
  const deltaX = normalizedTargetWorldPoint.x - originWorldPoint.x;
  const deltaY = normalizedTargetWorldPoint.y - originWorldPoint.y;
  const magnitude = Math.hypot(deltaX, deltaY);

  if (magnitude <= DIRECTION_EPSILON) {
    return createStarterWandFacingFallbackDirection(playerState);
  }

  return {
    x: deltaX / magnitude,
    y: deltaY / magnitude
  };
};

const createStarterWandFireboltStateFromCast = (
  playerState: PlayerState,
  targetWorldPoint: StarterWandWorldPoint,
  fireboltSpeed: number,
  fireboltRadius: number,
  fireboltLifetimeSeconds: number
): StarterWandFireboltState => {
  const originWorldPoint = getPlayerCameraFocusPoint(playerState);
  const direction = resolveStarterWandCastDirection(playerState, targetWorldPoint);
  return createStarterWandFireboltState({
    position: originWorldPoint,
    velocity: {
      x: direction.x * fireboltSpeed,
      y: direction.y * fireboltSpeed
    },
    radius: fireboltRadius,
    secondsRemaining: fireboltLifetimeSeconds
  });
};

const expandWorldAabb = (aabb: WorldAabb, padding: number): WorldAabb => ({
  minX: aabb.minX - padding,
  minY: aabb.minY - padding,
  maxX: aabb.maxX + padding,
  maxY: aabb.maxY + padding
});

const resolveSegmentIntersectionTimeWithAabb = (
  start: StarterWandWorldPoint,
  end: StarterWandWorldPoint,
  aabb: WorldAabb
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
    !updateAxisRange(deltaX, start.x, aabb.minX, aabb.maxX) ||
    !updateAxisRange(deltaY, start.y, aabb.minY, aabb.maxY)
  ) {
    return null;
  }

  return {
    time: minTime
  };
};

const resolveStarterWandFireboltFacing = (
  currentFacing: HostileSlimeFacing,
  direction: StarterWandDirection
): HostileSlimeFacing => {
  if (direction.x < -DIRECTION_EPSILON) {
    return 'left';
  }
  if (direction.x > DIRECTION_EPSILON) {
    return 'right';
  }

  return currentFacing;
};

const getTravelTargetWorldPoint = (
  state: StarterWandFireboltState,
  fixedDtSeconds: number
): StarterWandWorldPoint => ({
  x: state.position.x + state.velocity.x * fixedDtSeconds,
  y: state.position.y + state.velocity.y * fixedDtSeconds
});

const resolveWorldTileBoundsForSegment = (
  start: StarterWandWorldPoint,
  end: StarterWandWorldPoint,
  radius: number
): { minTileX: number; maxTileX: number; minTileY: number; maxTileY: number } => ({
  minTileX: Math.floor((Math.min(start.x, end.x) - radius) / TILE_SIZE),
  maxTileX: Math.ceil((Math.max(start.x, end.x) + radius) / TILE_SIZE) - 1,
  minTileY: Math.floor((Math.min(start.y, end.y) - radius) / TILE_SIZE),
  maxTileY: Math.ceil((Math.max(start.y, end.y) + radius) / TILE_SIZE) - 1
});

const resolveStarterWandFireboltTerrainHit = (
  state: StarterWandFireboltState,
  nextPosition: StarterWandWorldPoint,
  world: StepStarterWandFireboltStateOptions['world'],
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

      const hit = resolveSegmentIntersectionTimeWithAabb(
        state.position,
        nextPosition,
        expandWorldAabb(
          {
            minX: worldTileX * TILE_SIZE,
            minY: worldTileY * TILE_SIZE,
            maxX: (worldTileX + 1) * TILE_SIZE,
            maxY: (worldTileY + 1) * TILE_SIZE
          },
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

const resolveStarterWandFireboltHostileSlimeHit = (
  state: StarterWandFireboltState,
  nextPosition: StarterWandWorldPoint,
  hostileSlimes: readonly StarterWandHostileSlimeTarget[]
): HostileSlimeHitCandidate | null => {
  let bestHit: HostileSlimeHitCandidate | null = null;
  const normalizedDirection = normalizeStarterWandDirection(state.velocity, 'state.velocity');

  for (const hostileSlime of hostileSlimes) {
    const hit = resolveSegmentIntersectionTimeWithAabb(
      state.position,
      nextPosition,
      expandWorldAabb(getHostileSlimeAabb(hostileSlime.state), state.radius)
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

export const createStarterWandCooldownState = (
  secondsRemaining = 0
): StarterWandCooldownState => ({
  secondsRemaining: expectNonNegativeFiniteNumber(secondsRemaining, 'secondsRemaining')
});

export const cloneStarterWandCooldownState = (
  state: StarterWandCooldownState
): StarterWandCooldownState => ({
  secondsRemaining: state.secondsRemaining
});

export const stepStarterWandCooldownState = (
  state: StarterWandCooldownState,
  fixedDtSeconds: number
): StarterWandCooldownState => ({
  secondsRemaining: Math.max(
    0,
    state.secondsRemaining - expectNonNegativeFiniteNumber(fixedDtSeconds, 'fixedDtSeconds')
  )
});

export const createStarterWandFireboltState = (
  options: Pick<
    StarterWandFireboltState,
    'position' | 'velocity' | 'radius' | 'secondsRemaining'
  >
): StarterWandFireboltState => ({
  position: cloneStarterWandWorldPoint(options.position),
  velocity: cloneStarterWandDirection(options.velocity),
  radius: expectPositiveFiniteNumber(options.radius, 'options.radius'),
  secondsRemaining: expectPositiveFiniteNumber(
    options.secondsRemaining,
    'options.secondsRemaining'
  )
});

export const cloneStarterWandFireboltState = (
  state: StarterWandFireboltState
): StarterWandFireboltState => ({
  position: cloneStarterWandWorldPoint(state.position),
  velocity: cloneStarterWandDirection(state.velocity),
  radius: state.radius,
  secondsRemaining: state.secondsRemaining
});

export const tryUseStarterWand = (
  playerState: PlayerState,
  cooldownState: StarterWandCooldownState,
  targetWorldPoint: StarterWandWorldPoint,
  options: TryUseStarterWandOptions = {}
): TryUseStarterWandResult => {
  const cooldownSeconds = expectNonNegativeFiniteNumber(
    options.cooldownSeconds ?? DEFAULT_STARTER_WAND_CAST_COOLDOWN_SECONDS,
    'options.cooldownSeconds'
  );
  const manaCost = expectPositiveFiniteNumber(
    options.manaCost ?? DEFAULT_STARTER_WAND_MANA_COST,
    'options.manaCost'
  );
  const fireboltSpeed = expectPositiveFiniteNumber(
    options.fireboltSpeed ?? DEFAULT_STARTER_WAND_FIREBOLT_SPEED,
    'options.fireboltSpeed'
  );
  const fireboltRadius = expectPositiveFiniteNumber(
    options.fireboltRadius ?? DEFAULT_STARTER_WAND_FIREBOLT_RADIUS,
    'options.fireboltRadius'
  );
  const fireboltLifetimeSeconds = expectPositiveFiniteNumber(
    options.fireboltLifetimeSeconds ?? DEFAULT_STARTER_WAND_FIREBOLT_LIFETIME_SECONDS,
    'options.fireboltLifetimeSeconds'
  );
  const nextCooldownState = cloneStarterWandCooldownState(cooldownState);
  const nextPlayerState = clonePlayerState(playerState);

  if (playerState.health <= 0) {
    return {
      nextPlayerState,
      nextCooldownState,
      fireboltState: null,
      castStarted: false,
      blockedReason: 'dead'
    };
  }

  if (cooldownState.secondsRemaining > 0) {
    return {
      nextPlayerState,
      nextCooldownState,
      fireboltState: null,
      castStarted: false,
      blockedReason: 'cooldown'
    };
  }

  const manaSpendResult = spendPlayerMana(playerState, {
    manaCost
  });
  if (!manaSpendResult.spent) {
    return {
      nextPlayerState: manaSpendResult.nextPlayerState,
      nextCooldownState,
      fireboltState: null,
      castStarted: false,
      blockedReason: manaSpendResult.blockedReason
    };
  }

  nextCooldownState.secondsRemaining = cooldownSeconds;
  return {
    nextPlayerState: manaSpendResult.nextPlayerState,
    nextCooldownState,
    fireboltState: createStarterWandFireboltStateFromCast(
      manaSpendResult.nextPlayerState,
      targetWorldPoint,
      fireboltSpeed,
      fireboltRadius,
      fireboltLifetimeSeconds
    ),
    castStarted: true,
    blockedReason: null
  };
};

export const applyStarterWandFireboltHitToHostileSlime = (
  slimeState: HostileSlimeState,
  hitEvent: StarterWandFireboltHostileSlimeHitEvent
): HostileSlimeState => {
  const nextState = cloneHostileSlimeState(slimeState);
  nextState.velocity = {
    x: hitEvent.direction.x * hitEvent.knockbackSpeed,
    y: hitEvent.direction.y * hitEvent.knockbackSpeed
  };
  nextState.grounded = false;
  nextState.facing = resolveStarterWandFireboltFacing(
    slimeState.facing,
    hitEvent.direction
  );
  nextState.launchKind = null;
  return applyHostileSlimeDamage(nextState, hitEvent.damage);
};

export const stepStarterWandFireboltState = (
  state: StarterWandFireboltState,
  options: StepStarterWandFireboltStateOptions
): StepStarterWandFireboltStateResult => {
  const fixedDtSeconds = expectNonNegativeFiniteNumber(
    options.fixedDtSeconds,
    'options.fixedDtSeconds'
  );
  const damage = expectPositiveFiniteNumber(
    options.damage ?? DEFAULT_STARTER_WAND_FIREBOLT_DAMAGE,
    'options.damage'
  );
  const knockbackSpeed = expectPositiveFiniteNumber(
    options.knockbackSpeed ?? DEFAULT_STARTER_WAND_FIREBOLT_KNOCKBACK_SPEED,
    'options.knockbackSpeed'
  );
  const registry = options.registry ?? TILE_METADATA;

  if (fixedDtSeconds <= 0) {
    return {
      nextState: cloneStarterWandFireboltState(state),
      hitEvent: null
    };
  }

  const nextPosition = getTravelTargetWorldPoint(state, fixedDtSeconds);
  const terrainHit = resolveStarterWandFireboltTerrainHit(state, nextPosition, options.world, registry);
  const hostileSlimeHit = resolveStarterWandFireboltHostileSlimeHit(
    state,
    nextPosition,
    options.hostileSlimes
  );

  if (
    terrainHit !== null &&
    (hostileSlimeHit === null || terrainHit.time <= hostileSlimeHit.time + DIRECTION_EPSILON)
  ) {
    return {
      nextState: null,
      hitEvent: {
        kind: 'terrain',
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
        entityId: hostileSlimeHit.entityId,
        direction: hostileSlimeHit.direction,
        damage,
        knockbackSpeed
      }
    };
  }

  const secondsRemaining = Math.max(0, state.secondsRemaining - fixedDtSeconds);
  if (secondsRemaining <= 0) {
    return {
      nextState: null,
      hitEvent: null
    };
  }

  return {
    nextState: {
      position: nextPosition,
      velocity: cloneStarterWandDirection(state.velocity),
      radius: state.radius,
      secondsRemaining
    },
    hitEvent: null
  };
};
