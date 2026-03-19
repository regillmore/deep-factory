import {
  DEFAULT_WORLD_SEED,
  normalizeWorldSeed,
  sampleWorldSeedUnitInterval
} from './worldSeed';

const SKY_TILE_ID = 0;
export const PROCEDURAL_STONE_TILE_ID = 1;
export const PROCEDURAL_GRASS_SURFACE_TILE_ID = 2;
export const PROCEDURAL_DIRT_TILE_ID = 9;

const PROCEDURAL_SURFACE_BASE_TILE_Y = -2;
const PROCEDURAL_SURFACE_BROAD_WAVE_FREQUENCY = 0.045;
const PROCEDURAL_SURFACE_BROAD_WAVE_AMPLITUDE = 5;
const PROCEDURAL_SURFACE_ROLLING_WAVE_FREQUENCY = 0.11;
const PROCEDURAL_SURFACE_ROLLING_WAVE_AMPLITUDE = 2.5;
const PROCEDURAL_SURFACE_DETAIL_WAVE_FREQUENCY = 0.22;
const PROCEDURAL_SURFACE_DETAIL_WAVE_AMPLITUDE = 1.25;

const PROCEDURAL_DIRT_DEPTH_BASE_TILES = 4;
const PROCEDURAL_DIRT_DEPTH_MIN_TILES = 2;
const PROCEDURAL_DIRT_DEPTH_MAX_TILES = 6;
const PROCEDURAL_DIRT_DEPTH_PRIMARY_FREQUENCY = 0.08;
const PROCEDURAL_DIRT_DEPTH_PRIMARY_AMPLITUDE = 1.2;
const PROCEDURAL_DIRT_DEPTH_SECONDARY_FREQUENCY = 0.17;
const PROCEDURAL_DIRT_DEPTH_SECONDARY_AMPLITUDE = 0.6;
const PROCEDURAL_SURFACE_BASE_TILE_Y_SEED_VARIATION = 4;
const PROCEDURAL_SURFACE_PHASE_OFFSET_RANGE = 192;
const PROCEDURAL_DIRT_PHASE_OFFSET_RANGE = 128;

export interface ProceduralTerrainColumn {
  surfaceTileY: number;
  dirtDepthTiles: number;
}

interface ProceduralTerrainSeedProfile {
  surfaceBaseTileY: number;
  broadWavePhaseOffset: number;
  rollingWavePhaseOffset: number;
  detailWavePhaseOffset: number;
  dirtPrimaryPhaseOffset: number;
  dirtSecondaryPhaseOffset: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const proceduralTerrainSeedProfiles = new Map<number, ProceduralTerrainSeedProfile>();

const sampleSineWave = (
  worldX: number,
  frequency: number,
  amplitude: number,
  phaseOffset: number
): number => Math.sin((worldX + phaseOffset) * frequency) * amplitude;

const sampleSeededSignedRange = (worldSeed: number, salt: number, magnitude: number): number =>
  (sampleWorldSeedUnitInterval(worldSeed, salt) * 2 - 1) * magnitude;

const resolveProceduralTerrainSeedProfile = (worldSeed: number): ProceduralTerrainSeedProfile => {
  const normalizedWorldSeed = normalizeWorldSeed(worldSeed);
  const existingProfile = proceduralTerrainSeedProfiles.get(normalizedWorldSeed);
  if (existingProfile) {
    return existingProfile;
  }

  const nextProfile: ProceduralTerrainSeedProfile =
    normalizedWorldSeed === DEFAULT_WORLD_SEED
      ? {
          surfaceBaseTileY: PROCEDURAL_SURFACE_BASE_TILE_Y,
          broadWavePhaseOffset: 0,
          rollingWavePhaseOffset: 11,
          detailWavePhaseOffset: -7,
          dirtPrimaryPhaseOffset: 23,
          dirtSecondaryPhaseOffset: -13
        }
      : {
          surfaceBaseTileY:
            PROCEDURAL_SURFACE_BASE_TILE_Y +
            Math.round(
              sampleSeededSignedRange(
                normalizedWorldSeed,
                0x41f25c2d,
                PROCEDURAL_SURFACE_BASE_TILE_Y_SEED_VARIATION
              )
            ),
          broadWavePhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x8f1bbcdc,
            PROCEDURAL_SURFACE_PHASE_OFFSET_RANGE
          ),
          rollingWavePhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x5d0f2b6a,
            PROCEDURAL_SURFACE_PHASE_OFFSET_RANGE
          ),
          detailWavePhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x93d76547,
            PROCEDURAL_SURFACE_PHASE_OFFSET_RANGE
          ),
          dirtPrimaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x2d98f14b,
            PROCEDURAL_DIRT_PHASE_OFFSET_RANGE
          ),
          dirtSecondaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0xc6ef3721,
            PROCEDURAL_DIRT_PHASE_OFFSET_RANGE
          )
        };

  proceduralTerrainSeedProfiles.set(normalizedWorldSeed, nextProfile);
  return nextProfile;
};

export const resolveProceduralTerrainColumn = (
  worldX: number,
  worldSeed = DEFAULT_WORLD_SEED
): ProceduralTerrainColumn => {
  const seedProfile = resolveProceduralTerrainSeedProfile(worldSeed);
  const surfaceTileY =
    Math.round(
      seedProfile.surfaceBaseTileY +
        sampleSineWave(
          worldX,
          PROCEDURAL_SURFACE_BROAD_WAVE_FREQUENCY,
          PROCEDURAL_SURFACE_BROAD_WAVE_AMPLITUDE,
          seedProfile.broadWavePhaseOffset
        ) +
        sampleSineWave(
          worldX,
          PROCEDURAL_SURFACE_ROLLING_WAVE_FREQUENCY,
          PROCEDURAL_SURFACE_ROLLING_WAVE_AMPLITUDE,
          seedProfile.rollingWavePhaseOffset
        ) +
        sampleSineWave(
          worldX,
          PROCEDURAL_SURFACE_DETAIL_WAVE_FREQUENCY,
          PROCEDURAL_SURFACE_DETAIL_WAVE_AMPLITUDE,
          seedProfile.detailWavePhaseOffset
        )
    ) || 0;

  const dirtDepthTiles = clamp(
    PROCEDURAL_DIRT_DEPTH_BASE_TILES +
      Math.round(
        sampleSineWave(
          worldX,
          PROCEDURAL_DIRT_DEPTH_PRIMARY_FREQUENCY,
          PROCEDURAL_DIRT_DEPTH_PRIMARY_AMPLITUDE,
          seedProfile.dirtPrimaryPhaseOffset
        ) +
          sampleSineWave(
            worldX,
            PROCEDURAL_DIRT_DEPTH_SECONDARY_FREQUENCY,
            PROCEDURAL_DIRT_DEPTH_SECONDARY_AMPLITUDE,
            seedProfile.dirtSecondaryPhaseOffset
          )
      ),
    PROCEDURAL_DIRT_DEPTH_MIN_TILES,
    PROCEDURAL_DIRT_DEPTH_MAX_TILES
  );

  return {
    surfaceTileY,
    dirtDepthTiles
  };
};

export const resolveProceduralTerrainTileId = (
  worldX: number,
  worldY: number,
  worldSeed = DEFAULT_WORLD_SEED
): number => {
  const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
  if (worldY < surfaceTileY) {
    return SKY_TILE_ID;
  }
  if (worldY === surfaceTileY) {
    return PROCEDURAL_GRASS_SURFACE_TILE_ID;
  }
  if (worldY <= surfaceTileY + dirtDepthTiles) {
    return PROCEDURAL_DIRT_TILE_ID;
  }
  return PROCEDURAL_STONE_TILE_ID;
};
