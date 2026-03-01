import type { WorldAabb } from './collision';

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

export const DEFAULT_PLAYER_WIDTH = 12;
export const DEFAULT_PLAYER_HEIGHT = 28;
const DEFAULT_PLAYER_FACING: PlayerFacing = 'right';

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
