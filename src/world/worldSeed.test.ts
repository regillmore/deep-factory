import { describe, expect, it } from 'vitest';

import {
  createRandomWorldSeed,
  DEFAULT_WORLD_SEED,
  MAX_WORLD_SEED,
  normalizeWorldSeed,
  sampleWorldSeedUnitInterval
} from './worldSeed';

describe('normalizeWorldSeed', () => {
  it('accepts unsigned 32-bit integer seeds', () => {
    expect(normalizeWorldSeed(DEFAULT_WORLD_SEED)).toBe(0);
    expect(normalizeWorldSeed(1234567890)).toBe(1234567890);
    expect(normalizeWorldSeed(MAX_WORLD_SEED)).toBe(MAX_WORLD_SEED);
  });

  it('rejects negative, fractional, and out-of-range seeds', () => {
    expect(() => normalizeWorldSeed(-1)).toThrowError(/worldSeed must be an integer/);
    expect(() => normalizeWorldSeed(1.5)).toThrowError(/worldSeed must be an integer/);
    expect(() => normalizeWorldSeed(MAX_WORLD_SEED + 1)).toThrowError(
      /worldSeed must be an integer/
    );
  });
});

describe('createRandomWorldSeed', () => {
  it('maps deterministic random inputs into unsigned 32-bit seeds', () => {
    expect(createRandomWorldSeed(() => 0)).toBe(0);
    expect(createRandomWorldSeed(() => 0.25)).toBe(1073741824);
    expect(createRandomWorldSeed(() => 0.999999999)).toBeLessThanOrEqual(MAX_WORLD_SEED);
  });

  it('rejects invalid random outputs', () => {
    expect(() => createRandomWorldSeed(() => -0.1)).toThrowError(/random must return a number/);
    expect(() => createRandomWorldSeed(() => 1)).toThrowError(/random must return a number/);
    expect(() => createRandomWorldSeed(() => Number.NaN)).toThrowError(
      /random must return a finite number/
    );
  });
});

describe('sampleWorldSeedUnitInterval', () => {
  it('returns deterministic normalized samples for seed and salt pairs', () => {
    expect(sampleWorldSeedUnitInterval(0, 1)).toBe(sampleWorldSeedUnitInterval(0, 1));
    expect(sampleWorldSeedUnitInterval(123, 456)).toBe(sampleWorldSeedUnitInterval(123, 456));
  });

  it('changes when the world seed changes', () => {
    expect(sampleWorldSeedUnitInterval(0, 1)).not.toBe(sampleWorldSeedUnitInterval(1, 1));
  });
});
