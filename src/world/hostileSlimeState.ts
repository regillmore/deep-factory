import type { WorldAabb } from './collision';
import type { PlayerSpawnPoint } from './playerSpawn';

export type HostileSlimeFacing = 'left' | 'right';

export interface HostileSlimeVector {
  x: number;
  y: number;
}

export interface HostileSlimeSize {
  width: number;
  height: number;
}

export interface HostileSlimeState {
  position: HostileSlimeVector;
  velocity: HostileSlimeVector;
  size: HostileSlimeSize;
  grounded: boolean;
  facing: HostileSlimeFacing;
  hopCooldownTicksRemaining: number;
}

export interface CreateHostileSlimeStateOptions {
  position?: Partial<HostileSlimeVector>;
  velocity?: Partial<HostileSlimeVector>;
  size?: Partial<HostileSlimeSize>;
  grounded?: boolean;
  facing?: HostileSlimeFacing;
  hopCooldownTicksRemaining?: number;
}

export interface CreateHostileSlimeStateFromSpawnOptions {
  facing?: HostileSlimeFacing;
}

export const DEFAULT_HOSTILE_SLIME_WIDTH = 20;
export const DEFAULT_HOSTILE_SLIME_HEIGHT = 12;
export const DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS = 24;
const DEFAULT_HOSTILE_SLIME_FACING: HostileSlimeFacing = 'left';

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

const expectNonNegativeInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return value;
};

const buildVector = (
  vector: Partial<HostileSlimeVector> | undefined,
  label: string
): HostileSlimeVector => ({
  x: expectFiniteNumber(vector?.x ?? 0, `${label}.x`),
  y: expectFiniteNumber(vector?.y ?? 0, `${label}.y`)
});

const buildSize = (size: Partial<HostileSlimeSize> | undefined): HostileSlimeSize => ({
  width: expectPositiveFiniteNumber(size?.width ?? DEFAULT_HOSTILE_SLIME_WIDTH, 'size.width'),
  height: expectPositiveFiniteNumber(size?.height ?? DEFAULT_HOSTILE_SLIME_HEIGHT, 'size.height')
});

const buildHopCooldownTicksRemaining = (value: number | undefined): number =>
  expectNonNegativeInteger(
    value ?? DEFAULT_HOSTILE_SLIME_HOP_INTERVAL_TICKS,
    'hopCooldownTicksRemaining'
  );

const buildSpawnSize = (aabb: WorldAabb): HostileSlimeSize => ({
  width: expectPositiveFiniteNumber(aabb.maxX - aabb.minX, 'spawn.aabb.width'),
  height: expectPositiveFiniteNumber(aabb.maxY - aabb.minY, 'spawn.aabb.height')
});

export const createHostileSlimeState = (
  options: CreateHostileSlimeStateOptions = {}
): HostileSlimeState => ({
  position: buildVector(options.position, 'position'),
  velocity: buildVector(options.velocity, 'velocity'),
  size: buildSize(options.size),
  grounded: options.grounded ?? true,
  facing: options.facing ?? DEFAULT_HOSTILE_SLIME_FACING,
  hopCooldownTicksRemaining: buildHopCooldownTicksRemaining(options.hopCooldownTicksRemaining)
});

export const createHostileSlimeStateFromSpawn = (
  spawn: PlayerSpawnPoint,
  options: CreateHostileSlimeStateFromSpawnOptions = {}
): HostileSlimeState =>
  createHostileSlimeState({
    position: {
      x: expectFiniteNumber(spawn.x, 'spawn.x'),
      y: expectFiniteNumber(spawn.y, 'spawn.y')
    },
    size: buildSpawnSize(spawn.aabb),
    grounded: true,
    facing: options.facing ?? DEFAULT_HOSTILE_SLIME_FACING
  });

export const cloneHostileSlimeState = (state: HostileSlimeState): HostileSlimeState => ({
  position: { ...state.position },
  velocity: { ...state.velocity },
  size: { ...state.size },
  grounded: state.grounded,
  facing: state.facing,
  hopCooldownTicksRemaining: state.hopCooldownTicksRemaining
});

export const getHostileSlimeAabb = (state: HostileSlimeState): WorldAabb => {
  const halfWidth = state.size.width * 0.5;
  return {
    minX: state.position.x - halfWidth,
    minY: state.position.y - state.size.height,
    maxX: state.position.x + halfWidth,
    maxY: state.position.y
  };
};
