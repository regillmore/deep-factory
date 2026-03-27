import {
  DEFAULT_WORLD_SEED,
  normalizeWorldSeed,
  sampleWorldSeedUnitInterval
} from './worldSeed';
import { GROWN_SMALL_TREE_FOOTPRINT_CELLS } from './smallTreeFootprints';
import { evaluateSmallTreeGrowthSiteAtAnchor } from './smallTreeGrowthSite';
import { getSmallTreeTileIds } from './smallTreeTiles';
import { getSurfaceFlowerTileId } from './surfaceFlowerTiles';
import { getTallGrassTileId } from './tallGrassTiles';
import { shouldSelectSurfaceFlowerAtAnchor } from './tileHashWindow';

const SKY_TILE_ID = 0;
export const PROCEDURAL_STONE_TILE_ID = 1;
export const PROCEDURAL_GRASS_SURFACE_TILE_ID = 2;
export const PROCEDURAL_DIRT_TILE_ID = 9;
export const PROCEDURAL_COPPER_ORE_TILE_ID = 13;
export const PROCEDURAL_DIRT_WALL_ID = 1;
export const PROCEDURAL_STONE_WALL_ID = 3;
const PROCEDURAL_SURFACE_FLOWER_TILE_ID = getSurfaceFlowerTileId();
const PROCEDURAL_TALL_GRASS_TILE_ID = getTallGrassTileId();
const PROCEDURAL_SMALL_TREE_TILE_IDS = getSmallTreeTileIds();
const PROCEDURAL_SMALL_TREE_SAPLING_TILE_ID = PROCEDURAL_SMALL_TREE_TILE_IDS.sapling;

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
export const PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES = 24;
const PROCEDURAL_CAVE_MOUTH_CELL_WIDTH_TILES = 64;
const PROCEDURAL_CAVE_MOUTH_CELL_INTERVAL = 3;
const PROCEDURAL_CAVE_MOUTH_CELL_EDGE_MARGIN_TILES = 10;
const PROCEDURAL_CAVE_MOUTH_MIN_RADIUS_TILES = 2;
const PROCEDURAL_CAVE_MOUTH_MAX_RADIUS_TILES = 4;
const PROCEDURAL_CAVE_MOUTH_SURFACE_EDGE_DROP_TILES = 2;
const PROCEDURAL_CAVE_MIN_STONE_OVERBURDEN_TILES = 2;
const PROCEDURAL_PRIMARY_CAVE_CENTER_BASE_OFFSET_TILES = 12;
const PROCEDURAL_PRIMARY_CAVE_CENTER_PRIMARY_FREQUENCY = 0.037;
const PROCEDURAL_PRIMARY_CAVE_CENTER_PRIMARY_AMPLITUDE = 4.5;
const PROCEDURAL_PRIMARY_CAVE_CENTER_SECONDARY_FREQUENCY = 0.09;
const PROCEDURAL_PRIMARY_CAVE_CENTER_SECONDARY_AMPLITUDE = 2.5;
const PROCEDURAL_PRIMARY_CAVE_RADIUS_BASE_TILES = 3;
const PROCEDURAL_PRIMARY_CAVE_RADIUS_PRIMARY_FREQUENCY = 0.051;
const PROCEDURAL_PRIMARY_CAVE_RADIUS_PRIMARY_AMPLITUDE = 1.4;
const PROCEDURAL_PRIMARY_CAVE_RADIUS_SECONDARY_FREQUENCY = 0.13;
const PROCEDURAL_PRIMARY_CAVE_RADIUS_SECONDARY_AMPLITUDE = 0.8;
const PROCEDURAL_PRIMARY_CAVE_RADIUS_MIN_TILES = 2;
const PROCEDURAL_PRIMARY_CAVE_RADIUS_MAX_TILES = 5;
const PROCEDURAL_SECONDARY_CAVE_CENTER_BASE_OFFSET_TILES = 24;
const PROCEDURAL_SECONDARY_CAVE_CENTER_PRIMARY_FREQUENCY = 0.024;
const PROCEDURAL_SECONDARY_CAVE_CENTER_PRIMARY_AMPLITUDE = 5.5;
const PROCEDURAL_SECONDARY_CAVE_CENTER_SECONDARY_FREQUENCY = 0.072;
const PROCEDURAL_SECONDARY_CAVE_CENTER_SECONDARY_AMPLITUDE = 2.25;
const PROCEDURAL_SECONDARY_CAVE_RADIUS_BASE_TILES = 2;
const PROCEDURAL_SECONDARY_CAVE_RADIUS_PRIMARY_FREQUENCY = 0.041;
const PROCEDURAL_SECONDARY_CAVE_RADIUS_PRIMARY_AMPLITUDE = 1.2;
const PROCEDURAL_SECONDARY_CAVE_RADIUS_SECONDARY_FREQUENCY = 0.097;
const PROCEDURAL_SECONDARY_CAVE_RADIUS_SECONDARY_AMPLITUDE = 0.6;
const PROCEDURAL_SECONDARY_CAVE_RADIUS_MIN_TILES = 2;
const PROCEDURAL_SECONDARY_CAVE_RADIUS_MAX_TILES = 4;
const PROCEDURAL_CAVE_CENTER_PHASE_OFFSET_RANGE = 256;
const PROCEDURAL_CAVE_RADIUS_PHASE_OFFSET_RANGE = 160;
const PROCEDURAL_COPPER_ORE_MIN_STONE_DEPTH_TILES = 4;
const PROCEDURAL_COPPER_ORE_MAX_DEPTH_BELOW_DIRT_TILES = 40;
const PROCEDURAL_COPPER_ORE_CELL_WIDTH_TILES = 24;
const PROCEDURAL_COPPER_ORE_CELL_HEIGHT_TILES = 18;
const PROCEDURAL_COPPER_ORE_CELL_EDGE_MARGIN_TILES = 3;
const PROCEDURAL_COPPER_ORE_ACTIVE_CHANCE = 0.28;
const PROCEDURAL_COPPER_ORE_MIN_RADIUS_X_TILES = 2;
const PROCEDURAL_COPPER_ORE_MAX_RADIUS_X_TILES = 4;
const PROCEDURAL_COPPER_ORE_MIN_RADIUS_Y_TILES = 1;
const PROCEDURAL_COPPER_ORE_MAX_RADIUS_Y_TILES = 3;
const PROCEDURAL_SMALL_TREE_CELL_WIDTH_TILES = 16;
const PROCEDURAL_SMALL_TREE_CELL_EDGE_MARGIN_TILES = 4;
const PROCEDURAL_SMALL_TREE_ACTIVE_CHANCE = 0.4;
const PROCEDURAL_SMALL_TREE_FOOTPRINT_HALF_WIDTH_TILES = GROWN_SMALL_TREE_FOOTPRINT_CELLS.reduce(
  (maxWidth, cell) => Math.max(maxWidth, Math.abs(cell.localX)),
  0
);

export interface ProceduralTerrainColumn {
  surfaceTileY: number;
  dirtDepthTiles: number;
}

export interface ProceduralTerrainLayers {
  tileId: number;
  wallId: number;
}

interface ProceduralTerrainSeedProfile {
  surfaceBaseTileY: number;
  broadWavePhaseOffset: number;
  rollingWavePhaseOffset: number;
  detailWavePhaseOffset: number;
  dirtPrimaryPhaseOffset: number;
  dirtSecondaryPhaseOffset: number;
  primaryCaveCenterPrimaryPhaseOffset: number;
  primaryCaveCenterSecondaryPhaseOffset: number;
  primaryCaveRadiusPrimaryPhaseOffset: number;
  primaryCaveRadiusSecondaryPhaseOffset: number;
  secondaryCaveCenterPrimaryPhaseOffset: number;
  secondaryCaveCenterSecondaryPhaseOffset: number;
  secondaryCaveRadiusPrimaryPhaseOffset: number;
  secondaryCaveRadiusSecondaryPhaseOffset: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const proceduralTerrainSeedProfiles = new Map<number, ProceduralTerrainSeedProfile>();
const proceduralPlantedSmallTreeAnchorByCellPairCaches = new Map<
  number,
  Map<number, { anchorTileX: number; anchorTileY: number } | null>
>();

const sampleSineWave = (
  worldX: number,
  frequency: number,
  amplitude: number,
  phaseOffset: number
): number => Math.sin((worldX + phaseOffset) * frequency) * amplitude;

const sampleSeededSignedRange = (worldSeed: number, salt: number, magnitude: number): number =>
  (sampleWorldSeedUnitInterval(worldSeed, salt) * 2 - 1) * magnitude;

const mixProceduralFeatureSalt = (featureIndex: number, salt: number): number =>
  (Math.imul(featureIndex | 0, 0x9e3779b1) ^ salt) >>> 0;

const sampleSeededFeatureUnitInterval = (worldSeed: number, featureIndex: number, salt: number): number =>
  sampleWorldSeedUnitInterval(worldSeed, mixProceduralFeatureSalt(featureIndex, salt));

const mixProceduralGridFeatureIndex = (cellX: number, cellY: number): number =>
  (Math.imul(cellX | 0, 0x1f123bb5) ^ Math.imul(cellY | 0, 0x6c8e9cf5)) >>> 0;

const sampleSeededGridFeatureUnitInterval = (
  worldSeed: number,
  cellX: number,
  cellY: number,
  salt: number
): number =>
  sampleSeededFeatureUnitInterval(worldSeed, mixProceduralGridFeatureIndex(cellX, cellY), salt);

const isProceduralCaveMouthCellActive = (worldSeed: number, mouthCellIndex: number): boolean => {
  const activeCellPhase = Math.floor(
    sampleWorldSeedUnitInterval(worldSeed, 0x5b48e729) * PROCEDURAL_CAVE_MOUTH_CELL_INTERVAL
  );
  const normalizedIntervalOffset =
    ((mouthCellIndex - activeCellPhase) % PROCEDURAL_CAVE_MOUTH_CELL_INTERVAL) +
    PROCEDURAL_CAVE_MOUTH_CELL_INTERVAL;

  return normalizedIntervalOffset % PROCEDURAL_CAVE_MOUTH_CELL_INTERVAL === 0;
};

const isProceduralGrassSurfaceAtColumn = (
  worldX: number,
  surfaceTileY: number,
  dirtDepthTiles: number,
  seedProfile: ProceduralTerrainSeedProfile,
  worldSeed: number
): boolean =>
  !isProceduralCaveMouthAir(
    worldX,
    surfaceTileY,
    surfaceTileY,
    dirtDepthTiles,
    seedProfile,
    worldSeed
  );

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
          dirtSecondaryPhaseOffset: -13,
          primaryCaveCenterPrimaryPhaseOffset: 37,
          primaryCaveCenterSecondaryPhaseOffset: -91,
          primaryCaveRadiusPrimaryPhaseOffset: 58,
          primaryCaveRadiusSecondaryPhaseOffset: -22,
          secondaryCaveCenterPrimaryPhaseOffset: 141,
          secondaryCaveCenterSecondaryPhaseOffset: -73,
          secondaryCaveRadiusPrimaryPhaseOffset: 84,
          secondaryCaveRadiusSecondaryPhaseOffset: -46
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
          ),
          primaryCaveCenterPrimaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x4b8f0c21,
            PROCEDURAL_CAVE_CENTER_PHASE_OFFSET_RANGE
          ),
          primaryCaveCenterSecondaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x9ec38154,
            PROCEDURAL_CAVE_CENTER_PHASE_OFFSET_RANGE
          ),
          primaryCaveRadiusPrimaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x57a1dfe8,
            PROCEDURAL_CAVE_RADIUS_PHASE_OFFSET_RANGE
          ),
          primaryCaveRadiusSecondaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x13d49b72,
            PROCEDURAL_CAVE_RADIUS_PHASE_OFFSET_RANGE
          ),
          secondaryCaveCenterPrimaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0xa40f7b65,
            PROCEDURAL_CAVE_CENTER_PHASE_OFFSET_RANGE
          ),
          secondaryCaveCenterSecondaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x2e7dca19,
            PROCEDURAL_CAVE_CENTER_PHASE_OFFSET_RANGE
          ),
          secondaryCaveRadiusPrimaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0x7b2c54ae,
            PROCEDURAL_CAVE_RADIUS_PHASE_OFFSET_RANGE
          ),
          secondaryCaveRadiusSecondaryPhaseOffset: sampleSeededSignedRange(
            normalizedWorldSeed,
            0xd18eb304,
            PROCEDURAL_CAVE_RADIUS_PHASE_OFFSET_RANGE
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

const resolveProceduralPrimaryCaveCenterTileY = (
  worldX: number,
  surfaceTileY: number,
  seedProfile: ProceduralTerrainSeedProfile
): number =>
  surfaceTileY +
  PROCEDURAL_PRIMARY_CAVE_CENTER_BASE_OFFSET_TILES +
  sampleSineWave(
    worldX,
    PROCEDURAL_PRIMARY_CAVE_CENTER_PRIMARY_FREQUENCY,
    PROCEDURAL_PRIMARY_CAVE_CENTER_PRIMARY_AMPLITUDE,
    seedProfile.primaryCaveCenterPrimaryPhaseOffset
  ) +
  sampleSineWave(
    worldX,
    PROCEDURAL_PRIMARY_CAVE_CENTER_SECONDARY_FREQUENCY,
    PROCEDURAL_PRIMARY_CAVE_CENTER_SECONDARY_AMPLITUDE,
    seedProfile.primaryCaveCenterSecondaryPhaseOffset
  );

const resolveProceduralPrimaryCaveRadiusTiles = (
  worldX: number,
  seedProfile: ProceduralTerrainSeedProfile
): number =>
  clamp(
    PROCEDURAL_PRIMARY_CAVE_RADIUS_BASE_TILES +
      Math.round(
        sampleSineWave(
          worldX,
          PROCEDURAL_PRIMARY_CAVE_RADIUS_PRIMARY_FREQUENCY,
          PROCEDURAL_PRIMARY_CAVE_RADIUS_PRIMARY_AMPLITUDE,
          seedProfile.primaryCaveRadiusPrimaryPhaseOffset
        ) +
          sampleSineWave(
            worldX,
            PROCEDURAL_PRIMARY_CAVE_RADIUS_SECONDARY_FREQUENCY,
            PROCEDURAL_PRIMARY_CAVE_RADIUS_SECONDARY_AMPLITUDE,
            seedProfile.primaryCaveRadiusSecondaryPhaseOffset
          )
      ),
    PROCEDURAL_PRIMARY_CAVE_RADIUS_MIN_TILES,
    PROCEDURAL_PRIMARY_CAVE_RADIUS_MAX_TILES
  );

const resolveProceduralSecondaryCaveCenterTileY = (
  worldX: number,
  surfaceTileY: number,
  seedProfile: ProceduralTerrainSeedProfile
): number =>
  surfaceTileY +
  PROCEDURAL_SECONDARY_CAVE_CENTER_BASE_OFFSET_TILES +
  sampleSineWave(
    worldX,
    PROCEDURAL_SECONDARY_CAVE_CENTER_PRIMARY_FREQUENCY,
    PROCEDURAL_SECONDARY_CAVE_CENTER_PRIMARY_AMPLITUDE,
    seedProfile.secondaryCaveCenterPrimaryPhaseOffset
  ) +
  sampleSineWave(
    worldX,
    PROCEDURAL_SECONDARY_CAVE_CENTER_SECONDARY_FREQUENCY,
    PROCEDURAL_SECONDARY_CAVE_CENTER_SECONDARY_AMPLITUDE,
    seedProfile.secondaryCaveCenterSecondaryPhaseOffset
  );

const resolveProceduralSecondaryCaveRadiusTiles = (
  worldX: number,
  seedProfile: ProceduralTerrainSeedProfile
): number =>
  clamp(
    PROCEDURAL_SECONDARY_CAVE_RADIUS_BASE_TILES +
      Math.round(
        sampleSineWave(
          worldX,
          PROCEDURAL_SECONDARY_CAVE_RADIUS_PRIMARY_FREQUENCY,
          PROCEDURAL_SECONDARY_CAVE_RADIUS_PRIMARY_AMPLITUDE,
          seedProfile.secondaryCaveRadiusPrimaryPhaseOffset
        ) +
          sampleSineWave(
            worldX,
            PROCEDURAL_SECONDARY_CAVE_RADIUS_SECONDARY_FREQUENCY,
            PROCEDURAL_SECONDARY_CAVE_RADIUS_SECONDARY_AMPLITUDE,
            seedProfile.secondaryCaveRadiusSecondaryPhaseOffset
          )
      ),
    PROCEDURAL_SECONDARY_CAVE_RADIUS_MIN_TILES,
    PROCEDURAL_SECONDARY_CAVE_RADIUS_MAX_TILES
  );

const isProceduralCaveMouthAir = (
  worldX: number,
  worldY: number,
  surfaceTileY: number,
  dirtDepthTiles: number,
  seedProfile: ProceduralTerrainSeedProfile,
  worldSeed: number
): boolean => {
  const mouthCellIndex = Math.floor(worldX / PROCEDURAL_CAVE_MOUTH_CELL_WIDTH_TILES);
  if (!isProceduralCaveMouthCellActive(worldSeed, mouthCellIndex)) {
    return false;
  }

  const cellStartTileX = mouthCellIndex * PROCEDURAL_CAVE_MOUTH_CELL_WIDTH_TILES;
  const mouthCenterRangeTiles =
    PROCEDURAL_CAVE_MOUTH_CELL_WIDTH_TILES - PROCEDURAL_CAVE_MOUTH_CELL_EDGE_MARGIN_TILES * 2;
  const mouthCenterTileX =
    cellStartTileX +
    PROCEDURAL_CAVE_MOUTH_CELL_EDGE_MARGIN_TILES +
    Math.floor(
      sampleSeededFeatureUnitInterval(worldSeed, mouthCellIndex, 0x8f0c13d4) * mouthCenterRangeTiles
    );
  const mouthRadiusTiles =
    PROCEDURAL_CAVE_MOUTH_MIN_RADIUS_TILES +
    Math.floor(
      sampleSeededFeatureUnitInterval(worldSeed, mouthCellIndex, 0xd9a74c21) *
        (PROCEDURAL_CAVE_MOUTH_MAX_RADIUS_TILES - PROCEDURAL_CAVE_MOUTH_MIN_RADIUS_TILES + 1)
    );
  if (
    Math.abs(mouthCenterTileX) - mouthRadiusTiles <=
    PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES
  ) {
    return false;
  }

  const horizontalDistanceFromMouthCenter = Math.abs(worldX - mouthCenterTileX);
  if (horizontalDistanceFromMouthCenter > mouthRadiusTiles) {
    return false;
  }

  const mouthSurfaceInsetTiles = Math.ceil(
    (horizontalDistanceFromMouthCenter / Math.max(mouthRadiusTiles, 1)) *
      PROCEDURAL_CAVE_MOUTH_SURFACE_EDGE_DROP_TILES
  );
  if (worldY < surfaceTileY + mouthSurfaceInsetTiles) {
    return false;
  }

  const minimumConnectedMouthBottomTileY =
    surfaceTileY + dirtDepthTiles + 1 + PROCEDURAL_CAVE_MIN_STONE_OVERBURDEN_TILES;
  const primaryCaveTopTileY = Math.ceil(
    resolveProceduralPrimaryCaveCenterTileY(worldX, surfaceTileY, seedProfile) -
      resolveProceduralPrimaryCaveRadiusTiles(worldX, seedProfile)
  );

  return worldY <= Math.max(primaryCaveTopTileY, minimumConnectedMouthBottomTileY);
};

const isProceduralUndergroundCaveAir = (
  worldX: number,
  worldY: number,
  surfaceTileY: number,
  dirtDepthTiles: number,
  seedProfile: ProceduralTerrainSeedProfile
): boolean => {
  const minimumCaveTileY =
    surfaceTileY + dirtDepthTiles + 1 + PROCEDURAL_CAVE_MIN_STONE_OVERBURDEN_TILES;
  if (worldY < minimumCaveTileY) {
    return false;
  }

  const primaryCaveCenterTileY = resolveProceduralPrimaryCaveCenterTileY(
    worldX,
    surfaceTileY,
    seedProfile
  );
  const primaryCaveRadiusTiles = resolveProceduralPrimaryCaveRadiusTiles(worldX, seedProfile);
  if (Math.abs(worldY - primaryCaveCenterTileY) <= primaryCaveRadiusTiles) {
    return true;
  }

  const secondaryCaveCenterTileY = resolveProceduralSecondaryCaveCenterTileY(
    worldX,
    surfaceTileY,
    seedProfile
  );
  const secondaryCaveRadiusTiles = resolveProceduralSecondaryCaveRadiusTiles(worldX, seedProfile);
  return Math.abs(worldY - secondaryCaveCenterTileY) <= secondaryCaveRadiusTiles;
};

const hasProceduralCopperOreInCell = (
  worldX: number,
  worldY: number,
  cellX: number,
  cellY: number,
  worldSeed: number
): boolean => {
  if (
    sampleSeededGridFeatureUnitInterval(worldSeed, cellX, cellY, 0x6b851d47) >=
    PROCEDURAL_COPPER_ORE_ACTIVE_CHANCE
  ) {
    return false;
  }

  const cellStartTileX = cellX * PROCEDURAL_COPPER_ORE_CELL_WIDTH_TILES;
  const cellStartTileY = cellY * PROCEDURAL_COPPER_ORE_CELL_HEIGHT_TILES;
  const centerTileX =
    cellStartTileX +
    PROCEDURAL_COPPER_ORE_CELL_EDGE_MARGIN_TILES +
    Math.floor(
      sampleSeededGridFeatureUnitInterval(worldSeed, cellX, cellY, 0x87d31a59) *
        (PROCEDURAL_COPPER_ORE_CELL_WIDTH_TILES - PROCEDURAL_COPPER_ORE_CELL_EDGE_MARGIN_TILES * 2)
    );
  const centerTileY =
    cellStartTileY +
    PROCEDURAL_COPPER_ORE_CELL_EDGE_MARGIN_TILES +
    Math.floor(
      sampleSeededGridFeatureUnitInterval(worldSeed, cellX, cellY, 0x3141592b) *
        (PROCEDURAL_COPPER_ORE_CELL_HEIGHT_TILES - PROCEDURAL_COPPER_ORE_CELL_EDGE_MARGIN_TILES * 2)
    );
  const radiusXTiles =
    PROCEDURAL_COPPER_ORE_MIN_RADIUS_X_TILES +
    Math.floor(
      sampleSeededGridFeatureUnitInterval(worldSeed, cellX, cellY, 0x2c1b3f85) *
        (PROCEDURAL_COPPER_ORE_MAX_RADIUS_X_TILES - PROCEDURAL_COPPER_ORE_MIN_RADIUS_X_TILES + 1)
    );
  const radiusYTiles =
    PROCEDURAL_COPPER_ORE_MIN_RADIUS_Y_TILES +
    Math.floor(
      sampleSeededGridFeatureUnitInterval(worldSeed, cellX, cellY, 0x4d6e7f91) *
        (PROCEDURAL_COPPER_ORE_MAX_RADIUS_Y_TILES - PROCEDURAL_COPPER_ORE_MIN_RADIUS_Y_TILES + 1)
    );

  if (
    Math.abs(centerTileX) - radiusXTiles <=
    PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES
  ) {
    return false;
  }

  const normalizedX = (worldX - centerTileX) / Math.max(radiusXTiles, 1);
  const normalizedY = (worldY - centerTileY) / Math.max(radiusYTiles, 1);
  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
};

const isProceduralCopperOre = (
  worldX: number,
  worldY: number,
  surfaceTileY: number,
  dirtDepthTiles: number,
  worldSeed: number
): boolean => {
  if (Math.abs(worldX) <= PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES) {
    return false;
  }

  const minimumOreTileY = surfaceTileY + dirtDepthTiles + PROCEDURAL_COPPER_ORE_MIN_STONE_DEPTH_TILES;
  const maximumOreTileY =
    surfaceTileY + dirtDepthTiles + PROCEDURAL_COPPER_ORE_MAX_DEPTH_BELOW_DIRT_TILES;
  if (worldY < minimumOreTileY || worldY > maximumOreTileY) {
    return false;
  }

  const cellX = Math.floor(worldX / PROCEDURAL_COPPER_ORE_CELL_WIDTH_TILES);
  const cellY = Math.floor(worldY / PROCEDURAL_COPPER_ORE_CELL_HEIGHT_TILES);
  for (let candidateCellY = cellY - 1; candidateCellY <= cellY + 1; candidateCellY += 1) {
    for (let candidateCellX = cellX - 1; candidateCellX <= cellX + 1; candidateCellX += 1) {
      if (hasProceduralCopperOreInCell(worldX, worldY, candidateCellX, candidateCellY, worldSeed)) {
        return true;
      }
    }
  }

  return false;
};

const isProceduralSmallTreeCellActive = (worldSeed: number, smallTreeCellIndex: number): boolean =>
  sampleSeededFeatureUnitInterval(worldSeed, smallTreeCellIndex, 0x60d44d31) <
  PROCEDURAL_SMALL_TREE_ACTIVE_CHANCE;

const resolveProceduralSmallTreeAnchorTileX = (
  worldSeed: number,
  smallTreeCellIndex: number
): number => {
  const cellStartTileX = smallTreeCellIndex * PROCEDURAL_SMALL_TREE_CELL_WIDTH_TILES;
  const anchorRangeTiles =
    PROCEDURAL_SMALL_TREE_CELL_WIDTH_TILES - PROCEDURAL_SMALL_TREE_CELL_EDGE_MARGIN_TILES * 2;

  return (
    cellStartTileX +
    PROCEDURAL_SMALL_TREE_CELL_EDGE_MARGIN_TILES +
    Math.floor(
      sampleSeededFeatureUnitInterval(worldSeed, smallTreeCellIndex, 0x7b1c4f29) * anchorRangeTiles
    )
  );
};

const isProceduralGrownSmallTreeAnchor = (
  anchorTileX: number,
  anchorTileY: number,
  worldSeed: number
): boolean => {
  if (
    Math.abs(anchorTileX) - PROCEDURAL_SMALL_TREE_FOOTPRINT_HALF_WIDTH_TILES <=
    PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES
  ) {
    return false;
  }

  const smallTreeCellIndex = Math.floor(anchorTileX / PROCEDURAL_SMALL_TREE_CELL_WIDTH_TILES);
  if (!isProceduralSmallTreeCellActive(worldSeed, smallTreeCellIndex)) {
    return false;
  }

  if (resolveProceduralSmallTreeAnchorTileX(worldSeed, smallTreeCellIndex) !== anchorTileX) {
    return false;
  }

  const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(anchorTileX, worldSeed);
  if (anchorTileY !== surfaceTileY) {
    return false;
  }

  const seedProfile = resolveProceduralTerrainSeedProfile(worldSeed);
  return isProceduralGrassSurfaceAtColumn(
    anchorTileX,
    surfaceTileY,
    dirtDepthTiles,
    seedProfile,
    worldSeed
  );
};

const resolveProceduralGrownSmallTreeTileId = (
  worldX: number,
  worldY: number,
  worldSeed: number
): number | null => {
  for (const cell of GROWN_SMALL_TREE_FOOTPRINT_CELLS) {
    const anchorTileX = worldX - cell.localX;
    const anchorTileY = worldY - cell.localY;
    if (!isProceduralGrownSmallTreeAnchor(anchorTileX, anchorTileY, worldSeed)) {
      continue;
    }

    return PROCEDURAL_SMALL_TREE_TILE_IDS[cell.tileKind];
  }

  return null;
};

const isProceduralSmallTreeFootprintOutsideProtectedOriginCorridor = (anchorTileX: number): boolean =>
  Math.abs(anchorTileX) - PROCEDURAL_SMALL_TREE_FOOTPRINT_HALF_WIDTH_TILES >
  PROCEDURAL_CAVE_MOUTH_PROTECTED_ORIGIN_HALF_WIDTH_TILES;

const resolveProceduralBaseTerrainLayers = (
  worldX: number,
  worldY: number,
  worldSeed = DEFAULT_WORLD_SEED
): ProceduralTerrainLayers => {
  const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
  const resolveSubsurfaceWallId = (): number =>
    worldY <= surfaceTileY + dirtDepthTiles ? PROCEDURAL_DIRT_WALL_ID : PROCEDURAL_STONE_WALL_ID;
  const seedProfile = resolveProceduralTerrainSeedProfile(worldSeed);
  if (worldY < surfaceTileY) {
    return {
      tileId: SKY_TILE_ID,
      wallId: 0
    };
  }

  const isCaveMouthAir = isProceduralCaveMouthAir(
    worldX,
    worldY,
    surfaceTileY,
    dirtDepthTiles,
    seedProfile,
    worldSeed
  );
  if (isCaveMouthAir) {
    return {
      tileId: SKY_TILE_ID,
      wallId: resolveSubsurfaceWallId()
    };
  }
  if (worldY === surfaceTileY) {
    return {
      tileId: PROCEDURAL_GRASS_SURFACE_TILE_ID,
      wallId: 0
    };
  }
  if (worldY <= surfaceTileY + dirtDepthTiles) {
    return {
      tileId: PROCEDURAL_DIRT_TILE_ID,
      wallId: PROCEDURAL_DIRT_WALL_ID
    };
  }
  if (isProceduralUndergroundCaveAir(worldX, worldY, surfaceTileY, dirtDepthTiles, seedProfile)) {
    return {
      tileId: SKY_TILE_ID,
      wallId: PROCEDURAL_STONE_WALL_ID
    };
  }
  if (isProceduralCopperOre(worldX, worldY, surfaceTileY, dirtDepthTiles, worldSeed)) {
    return {
      tileId: PROCEDURAL_COPPER_ORE_TILE_ID,
      wallId: PROCEDURAL_STONE_WALL_ID
    };
  }

  return {
    tileId: PROCEDURAL_STONE_TILE_ID,
    wallId: PROCEDURAL_STONE_WALL_ID
  };
};

const createProceduralBaseAndGrownSmallTreeWorldView = (worldSeed: number) => ({
  getTile: (worldTileX: number, worldTileY: number): number => {
    const grownSmallTreeTileId = resolveProceduralGrownSmallTreeTileId(worldTileX, worldTileY, worldSeed);
    if (grownSmallTreeTileId !== null) {
      return grownSmallTreeTileId;
    }

    return resolveProceduralBaseTerrainLayers(worldTileX, worldTileY, worldSeed).tileId;
  }
});

const resolveProceduralPlantedSmallTreeAnchorAtTileX = (
  candidateAnchorTileX: number,
  worldSeed: number,
  worldView = createProceduralBaseAndGrownSmallTreeWorldView(worldSeed)
): { anchorTileX: number; anchorTileY: number } | null => {
  if (!isProceduralSmallTreeFootprintOutsideProtectedOriginCorridor(candidateAnchorTileX)) {
    return null;
  }

  const { surfaceTileY } = resolveProceduralTerrainColumn(candidateAnchorTileX, worldSeed);
  const growthSite = evaluateSmallTreeGrowthSiteAtAnchor(worldView, candidateAnchorTileX, surfaceTileY);
  if (
    !growthSite.hasGrassAnchor ||
    growthSite.currentGrowthStage !== null ||
    !growthSite.hasUnobstructedGrowthSpace
  ) {
    return null;
  }

  return {
    anchorTileX: candidateAnchorTileX,
    anchorTileY: surfaceTileY
  };
};

const resolveProceduralPlantedSmallTreeAnchorBetweenGrownTrees = (
  leftGrownAnchorTileX: number,
  rightGrownAnchorTileX: number,
  worldSeed: number
): { anchorTileX: number; anchorTileY: number } | null => {
  const minCandidateTileX = leftGrownAnchorTileX + 1;
  const maxCandidateTileX = rightGrownAnchorTileX - 1;
  if (minCandidateTileX > maxCandidateTileX) {
    return null;
  }

  const midpointTileX = Math.floor((leftGrownAnchorTileX + rightGrownAnchorTileX) / 2);
  const worldView = createProceduralBaseAndGrownSmallTreeWorldView(worldSeed);
  const maxOffset = Math.max(midpointTileX - minCandidateTileX, maxCandidateTileX - midpointTileX);

  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const leftCandidateTileX = midpointTileX - offset;
    if (leftCandidateTileX >= minCandidateTileX) {
      const plantedAnchor = resolveProceduralPlantedSmallTreeAnchorAtTileX(
        leftCandidateTileX,
        worldSeed,
        worldView
      );
      if (plantedAnchor !== null) {
        return plantedAnchor;
      }
    }

    if (offset === 0) {
      continue;
    }

    const rightCandidateTileX = midpointTileX + offset;
    if (rightCandidateTileX > maxCandidateTileX) {
      continue;
    }

    const plantedAnchor = resolveProceduralPlantedSmallTreeAnchorAtTileX(
      rightCandidateTileX,
      worldSeed,
      worldView
    );
    if (plantedAnchor !== null) {
      return plantedAnchor;
    }
  }

  return null;
};

const resolveProceduralPlantedSmallTreeAnchorForCellPairUncached = (
  leftSmallTreeCellIndex: number,
  worldSeed: number
): { anchorTileX: number; anchorTileY: number } | null => {
  const rightSmallTreeCellIndex = leftSmallTreeCellIndex + 1;
  const leftGrownAnchorTileX = resolveProceduralSmallTreeAnchorTileX(worldSeed, leftSmallTreeCellIndex);
  const rightGrownAnchorTileX = resolveProceduralSmallTreeAnchorTileX(worldSeed, rightSmallTreeCellIndex);
  const leftGrownAnchorTileY = resolveProceduralTerrainColumn(leftGrownAnchorTileX, worldSeed).surfaceTileY;
  const rightGrownAnchorTileY = resolveProceduralTerrainColumn(rightGrownAnchorTileX, worldSeed).surfaceTileY;

  if (!isProceduralGrownSmallTreeAnchor(leftGrownAnchorTileX, leftGrownAnchorTileY, worldSeed)) {
    return null;
  }
  if (!isProceduralGrownSmallTreeAnchor(rightGrownAnchorTileX, rightGrownAnchorTileY, worldSeed)) {
    return null;
  }

  return resolveProceduralPlantedSmallTreeAnchorBetweenGrownTrees(
    leftGrownAnchorTileX,
    rightGrownAnchorTileX,
    worldSeed
  );
};

const resolveProceduralPlantedSmallTreeAnchorForCellPair = (
  leftSmallTreeCellIndex: number,
  worldSeed: number
): { anchorTileX: number; anchorTileY: number } | null => {
  const normalizedWorldSeed = normalizeWorldSeed(worldSeed);
  let seedCache = proceduralPlantedSmallTreeAnchorByCellPairCaches.get(normalizedWorldSeed);
  if (!seedCache) {
    seedCache = new Map();
    proceduralPlantedSmallTreeAnchorByCellPairCaches.set(normalizedWorldSeed, seedCache);
  }

  if (seedCache.has(leftSmallTreeCellIndex)) {
    return seedCache.get(leftSmallTreeCellIndex) ?? null;
  }

  const resolvedAnchor = resolveProceduralPlantedSmallTreeAnchorForCellPairUncached(
    leftSmallTreeCellIndex,
    normalizedWorldSeed
  );
  seedCache.set(leftSmallTreeCellIndex, resolvedAnchor);
  return resolvedAnchor;
};

const resolveProceduralPlantedSmallTreeTileId = (
  worldX: number,
  worldY: number,
  worldSeed: number
): number | null => {
  const cellIndex = Math.floor(worldX / PROCEDURAL_SMALL_TREE_CELL_WIDTH_TILES);
  for (
    let leftSmallTreeCellIndex = cellIndex - 2;
    leftSmallTreeCellIndex <= cellIndex + 1;
    leftSmallTreeCellIndex += 1
  ) {
    const plantedAnchor = resolveProceduralPlantedSmallTreeAnchorForCellPair(
      leftSmallTreeCellIndex,
      worldSeed
    );
    if (plantedAnchor === null) {
      continue;
    }
    if (plantedAnchor.anchorTileX !== worldX || plantedAnchor.anchorTileY - 1 !== worldY) {
      continue;
    }

    return PROCEDURAL_SMALL_TREE_SAPLING_TILE_ID;
  }

  return null;
};

export const resolveProceduralTerrainTileId = (
  worldX: number,
  worldY: number,
  worldSeed = DEFAULT_WORLD_SEED
): number => resolveProceduralTerrainLayers(worldX, worldY, worldSeed).tileId;

export const resolveProceduralTerrainWallId = (
  worldX: number,
  worldY: number,
  worldSeed = DEFAULT_WORLD_SEED
): number => resolveProceduralTerrainLayers(worldX, worldY, worldSeed).wallId;

export const resolveProceduralTerrainLayers = (
  worldX: number,
  worldY: number,
  worldSeed = DEFAULT_WORLD_SEED
): ProceduralTerrainLayers => {
  const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX, worldSeed);
  const baseLayers = resolveProceduralBaseTerrainLayers(worldX, worldY, worldSeed);
  const proceduralSmallTreeTileId = resolveProceduralGrownSmallTreeTileId(worldX, worldY, worldSeed);
  if (proceduralSmallTreeTileId !== null) {
    return {
      tileId: proceduralSmallTreeTileId,
      wallId: 0
    };
  }

  const proceduralPlantedSmallTreeTileId = resolveProceduralPlantedSmallTreeTileId(
    worldX,
    worldY,
    worldSeed
  );
  if (proceduralPlantedSmallTreeTileId !== null) {
    return {
      tileId: proceduralPlantedSmallTreeTileId,
      wallId: 0
    };
  }

  const seedProfile = resolveProceduralTerrainSeedProfile(worldSeed);
  const hasProceduralGrassSurface = isProceduralGrassSurfaceAtColumn(
    worldX,
    surfaceTileY,
    dirtDepthTiles,
    seedProfile,
    worldSeed
  );
  if (
    worldY === surfaceTileY - 1 &&
    hasProceduralGrassSurface
  ) {
    return {
      tileId: shouldSelectSurfaceFlowerAtAnchor(worldX, surfaceTileY)
        ? PROCEDURAL_SURFACE_FLOWER_TILE_ID
        : PROCEDURAL_TALL_GRASS_TILE_ID,
      wallId: 0
    };
  }

  return baseLayers;
};
