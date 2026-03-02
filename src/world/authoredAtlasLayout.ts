export interface AuthoredAtlasRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AuthoredAtlasUvRect {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export const AUTHORED_ATLAS_WIDTH = 64;
export const AUTHORED_ATLAS_HEIGHT = 64;

// Keep authored regions explicit so atlas-index resolution does not depend on a synthetic grid.
export const AUTHORED_ATLAS_REGIONS: readonly AuthoredAtlasRegion[] = [
  { x: 0, y: 0, width: 16, height: 16 },
  { x: 16, y: 0, width: 16, height: 16 },
  { x: 32, y: 0, width: 16, height: 16 },
  { x: 48, y: 0, width: 16, height: 16 },
  { x: 0, y: 16, width: 16, height: 16 },
  { x: 16, y: 16, width: 16, height: 16 },
  { x: 32, y: 16, width: 16, height: 16 },
  { x: 48, y: 16, width: 16, height: 16 },
  { x: 0, y: 32, width: 16, height: 16 },
  { x: 16, y: 32, width: 16, height: 16 },
  { x: 32, y: 32, width: 16, height: 16 },
  { x: 48, y: 32, width: 16, height: 16 },
  { x: 0, y: 48, width: 16, height: 16 },
  { x: 16, y: 48, width: 16, height: 16 },
  { x: 32, y: 48, width: 16, height: 16 },
  { x: 48, y: 48, width: 16, height: 16 }
] as const;

export const AUTHORED_ATLAS_REGION_COUNT = AUTHORED_ATLAS_REGIONS.length;

// Document reserved or blank committed slots here so asset regressions can distinguish drift from intent.
export const AUTHORED_ATLAS_INTENTIONALLY_UNUSED_REGION_REASONS: Readonly<Record<number, string>> =
  Object.freeze({});

export const AUTHORED_ATLAS_UV_RECTS: readonly AuthoredAtlasUvRect[] = AUTHORED_ATLAS_REGIONS.map(
  (region) => ({
    u0: region.x / AUTHORED_ATLAS_WIDTH,
    v0: region.y / AUTHORED_ATLAS_HEIGHT,
    u1: (region.x + region.width) / AUTHORED_ATLAS_WIDTH,
    v1: (region.y + region.height) / AUTHORED_ATLAS_HEIGHT
  })
);

export const getAuthoredAtlasRegionUvRect = (
  atlasIndex: number
): AuthoredAtlasUvRect | null => {
  if (!Number.isInteger(atlasIndex) || atlasIndex < 0 || atlasIndex >= AUTHORED_ATLAS_REGION_COUNT) {
    return null;
  }

  return AUTHORED_ATLAS_UV_RECTS[atlasIndex] ?? null;
};

export const getAuthoredAtlasRegion = (atlasIndex: number): AuthoredAtlasRegion | null => {
  if (!Number.isInteger(atlasIndex) || atlasIndex < 0 || atlasIndex >= AUTHORED_ATLAS_REGION_COUNT) {
    return null;
  }

  return AUTHORED_ATLAS_REGIONS[atlasIndex] ?? null;
};
