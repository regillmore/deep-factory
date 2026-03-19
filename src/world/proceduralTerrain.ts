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

export interface ProceduralTerrainColumn {
  surfaceTileY: number;
  dirtDepthTiles: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const sampleSineWave = (
  worldX: number,
  frequency: number,
  amplitude: number,
  phaseOffset: number
): number => Math.sin((worldX + phaseOffset) * frequency) * amplitude;

export const resolveProceduralTerrainColumn = (worldX: number): ProceduralTerrainColumn => {
  const surfaceTileY =
    Math.round(
      PROCEDURAL_SURFACE_BASE_TILE_Y +
        sampleSineWave(
          worldX,
          PROCEDURAL_SURFACE_BROAD_WAVE_FREQUENCY,
          PROCEDURAL_SURFACE_BROAD_WAVE_AMPLITUDE,
          0
        ) +
        sampleSineWave(
          worldX,
          PROCEDURAL_SURFACE_ROLLING_WAVE_FREQUENCY,
          PROCEDURAL_SURFACE_ROLLING_WAVE_AMPLITUDE,
          11
        ) +
        sampleSineWave(
          worldX,
          PROCEDURAL_SURFACE_DETAIL_WAVE_FREQUENCY,
          PROCEDURAL_SURFACE_DETAIL_WAVE_AMPLITUDE,
          -7
        )
    ) || 0;

  const dirtDepthTiles = clamp(
    PROCEDURAL_DIRT_DEPTH_BASE_TILES +
      Math.round(
        sampleSineWave(
          worldX,
          PROCEDURAL_DIRT_DEPTH_PRIMARY_FREQUENCY,
          PROCEDURAL_DIRT_DEPTH_PRIMARY_AMPLITUDE,
          23
        ) +
          sampleSineWave(
            worldX,
            PROCEDURAL_DIRT_DEPTH_SECONDARY_FREQUENCY,
            PROCEDURAL_DIRT_DEPTH_SECONDARY_AMPLITUDE,
            -13
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

export const resolveProceduralTerrainTileId = (worldX: number, worldY: number): number => {
  const { surfaceTileY, dirtDepthTiles } = resolveProceduralTerrainColumn(worldX);
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
