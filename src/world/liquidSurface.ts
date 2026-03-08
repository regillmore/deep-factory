import { MAX_LIQUID_LEVEL } from './constants';
import {
  areLiquidRenderNeighborsConnected,
  TILE_METADATA,
  type TileMetadataRegistry,
  type TileUvRect
} from './tileMetadata';

export interface LiquidSurfaceLevelNeighborhood {
  center: number;
  north: number;
  east: number;
  west: number;
}

export interface LiquidSurfaceTopHeights {
  topLeft: number;
  topRight: number;
}

export interface LiquidSurfaceBottomVCrops {
  bottomLeftV: number;
  bottomRightV: number;
}

export interface LiquidSurfaceVisibleFrameHeights {
  visibleLeftV: number;
  visibleRightV: number;
}

export interface LiquidSurfaceBottomAtlasPixelRows {
  bottomLeftPixelY: number;
  bottomRightPixelY: number;
}

export interface LiquidSurfaceVisibleFrameAtlasPixelHeights {
  visibleLeftPixelHeight: number;
  visibleRightPixelHeight: number;
}

export type LiquidSurfaceBranchKind = 'empty' | 'north-covered' | 'exposed';

const clampLiquidFillLevel = (fillLevel: number): number => {
  if (!Number.isFinite(fillLevel)) {
    return 0;
  }

  return Math.min(MAX_LIQUID_LEVEL, Math.max(0, fillLevel));
};

const toNormalizedLiquidFillHeight = (fillLevel: number): number => fillLevel / MAX_LIQUID_LEVEL;

const clampNormalizedLiquidHeight = (height: number): number => {
  if (!Number.isFinite(height)) {
    return 0;
  }

  return Math.min(1, Math.max(0, height));
};

const resolveLiquidSurfaceBranchKindFromClampedLevels = (
  centerLevel: number,
  northLevel: number
): LiquidSurfaceBranchKind => {
  if (centerLevel <= 0) {
    return 'empty';
  }
  if (northLevel > 0) {
    return 'north-covered';
  }
  return 'exposed';
};

const resolveExposedLiquidCornerHeight = (centerLevel: number, sideLevel: number): number => {
  if (sideLevel <= 0) {
    return toNormalizedLiquidFillHeight(centerLevel);
  }

  // Shared boundary corners blend halfway toward the neighboring same-kind fill level.
  return toNormalizedLiquidFillHeight((centerLevel + sideLevel) * 0.5);
};

export const resolveLiquidSurfaceTopHeights = (
  levels: LiquidSurfaceLevelNeighborhood
): LiquidSurfaceTopHeights => {
  const centerLevel = clampLiquidFillLevel(levels.center);
  const northLevel = clampLiquidFillLevel(levels.north);
  const branchKind = resolveLiquidSurfaceBranchKindFromClampedLevels(centerLevel, northLevel);
  if (branchKind === 'empty') {
    return { topLeft: 0, topRight: 0 };
  }
  if (branchKind === 'north-covered') {
    return { topLeft: 1, topRight: 1 };
  }

  const westLevel = clampLiquidFillLevel(levels.west);
  const eastLevel = clampLiquidFillLevel(levels.east);
  return {
    topLeft: resolveExposedLiquidCornerHeight(centerLevel, westLevel),
    topRight: resolveExposedLiquidCornerHeight(centerLevel, eastLevel)
  };
};

export const resolveLiquidSurfaceBranchKind = (
  levels: LiquidSurfaceLevelNeighborhood
): LiquidSurfaceBranchKind =>
  resolveLiquidSurfaceBranchKindFromClampedLevels(
    clampLiquidFillLevel(levels.center),
    clampLiquidFillLevel(levels.north)
  );

export const resolveLiquidSurfaceBottomVCrops = (
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  topHeights: LiquidSurfaceTopHeights
): LiquidSurfaceBottomVCrops => ({
  bottomLeftV:
    uvRect.v0 + (uvRect.v1 - uvRect.v0) * clampNormalizedLiquidHeight(topHeights.topLeft),
  bottomRightV:
    uvRect.v0 + (uvRect.v1 - uvRect.v0) * clampNormalizedLiquidHeight(topHeights.topRight)
});

export const resolveLiquidSurfaceFrameTopV = (uvRect: Pick<TileUvRect, 'v0'>): number =>
  clampNormalizedLiquidHeight(uvRect.v0);

export const resolveLiquidSurfaceFrameTopAtlasPixelRow = (
  atlasHeight: number,
  uvRect: Pick<TileUvRect, 'v0'>
): number => resolveLiquidSurfaceFrameTopV(uvRect) * atlasHeight;

export const resolveLiquidSurfaceFrameBottomV = (uvRect: Pick<TileUvRect, 'v1'>): number =>
  clampNormalizedLiquidHeight(uvRect.v1);

export const resolveLiquidSurfaceFrameBottomAtlasPixelRow = (
  atlasHeight: number,
  uvRect: Pick<TileUvRect, 'v1'>
): number => resolveLiquidSurfaceFrameBottomV(uvRect) * atlasHeight;

export const resolveLiquidSurfaceVisibleFrameHeights = (
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceVisibleFrameHeights => {
  const topV = resolveLiquidSurfaceFrameTopV(uvRect);
  const frameBottomV = resolveLiquidSurfaceFrameBottomV(uvRect);
  const frameHeightV = Math.max(0, frameBottomV - topV);

  return {
    visibleLeftV: Math.min(
      frameHeightV,
      Math.max(0, clampNormalizedLiquidHeight(bottomVCrops.bottomLeftV) - topV)
    ),
    visibleRightV: Math.min(
      frameHeightV,
      Math.max(0, clampNormalizedLiquidHeight(bottomVCrops.bottomRightV) - topV)
    )
  };
};

export const resolveLiquidSurfaceBottomAtlasPixelRows = (
  atlasHeight: number,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceBottomAtlasPixelRows => ({
  bottomLeftPixelY: clampNormalizedLiquidHeight(bottomVCrops.bottomLeftV) * atlasHeight,
  bottomRightPixelY: clampNormalizedLiquidHeight(bottomVCrops.bottomRightV) * atlasHeight
});

export const resolveLiquidSurfaceVisibleFrameAtlasPixelHeights = (
  atlasHeight: number,
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceVisibleFrameAtlasPixelHeights => {
  const bottomPixelRows = resolveLiquidSurfaceBottomAtlasPixelRows(atlasHeight, bottomVCrops);
  const topPixelY = resolveLiquidSurfaceFrameTopAtlasPixelRow(atlasHeight, uvRect);
  const frameBottomPixelY = resolveLiquidSurfaceFrameBottomAtlasPixelRow(atlasHeight, uvRect);
  const framePixelHeight = Math.max(0, frameBottomPixelY - topPixelY);

  return {
    visibleLeftPixelHeight: Math.min(
      framePixelHeight,
      Math.max(0, bottomPixelRows.bottomLeftPixelY - topPixelY)
    ),
    visibleRightPixelHeight: Math.min(
      framePixelHeight,
      Math.max(0, bottomPixelRows.bottomRightPixelY - topPixelY)
    )
  };
};

export const resolveConnectedLiquidNeighborLevel = (
  centerTileId: number,
  neighborTileId: number,
  neighborLevel: number,
  tileMetadataRegistry: TileMetadataRegistry = TILE_METADATA
): number =>
  areLiquidRenderNeighborsConnected(centerTileId, neighborTileId, tileMetadataRegistry)
    ? neighborLevel
    : 0;
