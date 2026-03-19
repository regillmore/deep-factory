export const DEFAULT_WORLD_SEED = 0;
export const MAX_WORLD_SEED = 0xffffffff;
const WORLD_SEED_MODULUS = 0x100000000;

export const normalizeWorldSeed = (worldSeed: number): number => {
  if (!Number.isInteger(worldSeed) || worldSeed < 0 || worldSeed > MAX_WORLD_SEED) {
    throw new Error(`worldSeed must be an integer between 0 and ${MAX_WORLD_SEED}`);
  }

  return worldSeed >>> 0;
};

export const createRandomWorldSeed = (random: () => number = Math.random): number => {
  const randomValue = random();
  if (typeof randomValue !== 'number' || !Number.isFinite(randomValue)) {
    throw new Error('random must return a finite number');
  }
  if (randomValue < 0 || randomValue >= 1) {
    throw new Error('random must return a number greater than or equal to 0 and less than 1');
  }

  return Math.floor(randomValue * WORLD_SEED_MODULUS) >>> 0;
};

export const sampleWorldSeedUnitInterval = (worldSeed: number, salt: number): number => {
  let value = (normalizeWorldSeed(worldSeed) ^ normalizeWorldSeed(salt)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value / WORLD_SEED_MODULUS;
};
