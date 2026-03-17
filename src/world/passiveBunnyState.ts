import type { WorldAabb } from './collision';
import type { PlayerSpawnPoint } from './playerSpawn';

export type PassiveBunnyFacing = 'left' | 'right';

export interface PassiveBunnyVector {
  x: number;
  y: number;
}

export interface PassiveBunnySize {
  width: number;
  height: number;
}

export interface PassiveBunnyState {
  position: PassiveBunnyVector;
  velocity: PassiveBunnyVector;
  size: PassiveBunnySize;
  grounded: boolean;
  facing: PassiveBunnyFacing;
  hopCooldownTicksRemaining: number;
}

export interface CreatePassiveBunnyStateOptions {
  position?: Partial<PassiveBunnyVector>;
  velocity?: Partial<PassiveBunnyVector>;
  size?: Partial<PassiveBunnySize>;
  grounded?: boolean;
  facing?: PassiveBunnyFacing;
  hopCooldownTicksRemaining?: number;
}

export interface CreatePassiveBunnyStateFromSpawnOptions {
  facing?: PassiveBunnyFacing;
}

export const DEFAULT_PASSIVE_BUNNY_WIDTH = 14;
export const DEFAULT_PASSIVE_BUNNY_HEIGHT = 18;
export const DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS = 48;
const DEFAULT_PASSIVE_BUNNY_FACING: PassiveBunnyFacing = 'right';

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
  vector: Partial<PassiveBunnyVector> | undefined,
  label: string
): PassiveBunnyVector => ({
  x: expectFiniteNumber(vector?.x ?? 0, `${label}.x`),
  y: expectFiniteNumber(vector?.y ?? 0, `${label}.y`)
});

const buildSize = (size: Partial<PassiveBunnySize> | undefined): PassiveBunnySize => ({
  width: expectPositiveFiniteNumber(size?.width ?? DEFAULT_PASSIVE_BUNNY_WIDTH, 'size.width'),
  height: expectPositiveFiniteNumber(size?.height ?? DEFAULT_PASSIVE_BUNNY_HEIGHT, 'size.height')
});

const buildHopCooldownTicksRemaining = (value: number | undefined): number =>
  expectNonNegativeInteger(
    value ?? DEFAULT_PASSIVE_BUNNY_HOP_INTERVAL_TICKS,
    'hopCooldownTicksRemaining'
  );

const buildSpawnSize = (aabb: WorldAabb): PassiveBunnySize => ({
  width: expectPositiveFiniteNumber(aabb.maxX - aabb.minX, 'spawn.aabb.width'),
  height: expectPositiveFiniteNumber(aabb.maxY - aabb.minY, 'spawn.aabb.height')
});

export const createPassiveBunnyState = (
  options: CreatePassiveBunnyStateOptions = {}
): PassiveBunnyState => ({
  position: buildVector(options.position, 'position'),
  velocity: buildVector(options.velocity, 'velocity'),
  size: buildSize(options.size),
  grounded: options.grounded ?? true,
  facing: options.facing ?? DEFAULT_PASSIVE_BUNNY_FACING,
  hopCooldownTicksRemaining: buildHopCooldownTicksRemaining(options.hopCooldownTicksRemaining)
});

export const createPassiveBunnyStateFromSpawn = (
  spawn: PlayerSpawnPoint,
  options: CreatePassiveBunnyStateFromSpawnOptions = {}
): PassiveBunnyState =>
  createPassiveBunnyState({
    position: {
      x: expectFiniteNumber(spawn.x, 'spawn.x'),
      y: expectFiniteNumber(spawn.y, 'spawn.y')
    },
    size: buildSpawnSize(spawn.aabb),
    grounded: true,
    facing: options.facing ?? DEFAULT_PASSIVE_BUNNY_FACING
  });

export const clonePassiveBunnyState = (state: PassiveBunnyState): PassiveBunnyState => ({
  position: { ...state.position },
  velocity: { ...state.velocity },
  size: { ...state.size },
  grounded: state.grounded,
  facing: state.facing,
  hopCooldownTicksRemaining: state.hopCooldownTicksRemaining
});

export const getPassiveBunnyAabb = (state: PassiveBunnyState): WorldAabb => {
  const halfWidth = state.size.width * 0.5;
  return {
    minX: state.position.x - halfWidth,
    minY: state.position.y - state.size.height,
    maxX: state.position.x + halfWidth,
    maxY: state.position.y
  };
};
