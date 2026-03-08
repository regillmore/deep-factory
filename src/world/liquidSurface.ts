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

export interface LiquidSurfaceVisibleFramePercentages {
  visibleLeftPercentage: number;
  visibleRightPercentage: number;
}

export interface LiquidSurfaceCoveragePercentageTotals {
  leftTotalPercentage: number;
  rightTotalPercentage: number;
}

export interface LiquidSurfaceCroppedFrameRemainders {
  remainderLeftV: number;
  remainderRightV: number;
}

export interface LiquidSurfaceCroppedFramePercentages {
  remainderLeftPercentage: number;
  remainderRightPercentage: number;
}

export interface LiquidSurfaceBottomAtlasPixelRows {
  bottomLeftPixelY: number;
  bottomRightPixelY: number;
}

export interface LiquidSurfaceVisibleFrameAtlasPixelHeights {
  visibleLeftPixelHeight: number;
  visibleRightPixelHeight: number;
}

export interface LiquidSurfaceCoverageAtlasPixelHeightTotals {
  leftTotalPixelHeight: number;
  rightTotalPixelHeight: number;
}

export interface LiquidSurfaceCroppedFrameAtlasPixelHeights {
  remainderLeftPixelHeight: number;
  remainderRightPixelHeight: number;
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

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
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

export const resolveLiquidSurfaceFrameHeightV = (uvRect: Pick<TileUvRect, 'v0' | 'v1'>): number =>
  Math.max(0, resolveLiquidSurfaceFrameBottomV(uvRect) - resolveLiquidSurfaceFrameTopV(uvRect));

export const resolveLiquidSurfaceFrameAtlasPixelHeight = (
  atlasHeight: number,
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>
): number =>
  Math.max(
    0,
    resolveLiquidSurfaceFrameBottomAtlasPixelRow(atlasHeight, uvRect) -
      resolveLiquidSurfaceFrameTopAtlasPixelRow(atlasHeight, uvRect)
  );

export const resolveLiquidSurfaceVisibleFrameHeights = (
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceVisibleFrameHeights => {
  const topV = resolveLiquidSurfaceFrameTopV(uvRect);
  const frameHeightV = resolveLiquidSurfaceFrameHeightV(uvRect);

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

export const resolveLiquidSurfaceVisibleFramePercentages = (
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceVisibleFramePercentages => {
  const frameHeightV = resolveLiquidSurfaceFrameHeightV(uvRect);
  if (frameHeightV <= 0) {
    return {
      visibleLeftPercentage: 0,
      visibleRightPercentage: 0
    };
  }

  const visibleFrameHeights = resolveLiquidSurfaceVisibleFrameHeights(uvRect, bottomVCrops);
  return {
    visibleLeftPercentage: clampPercentage((visibleFrameHeights.visibleLeftV / frameHeightV) * 100),
    visibleRightPercentage: clampPercentage((visibleFrameHeights.visibleRightV / frameHeightV) * 100)
  };
};

export const resolveLiquidSurfaceCoveragePercentageTotals = (
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceCoveragePercentageTotals => {
  const visibleFramePercentages = resolveLiquidSurfaceVisibleFramePercentages(uvRect, bottomVCrops);
  const croppedFramePercentages = resolveLiquidSurfaceCroppedFramePercentages(uvRect, bottomVCrops);

  return {
    leftTotalPercentage: clampPercentage(
      visibleFramePercentages.visibleLeftPercentage + croppedFramePercentages.remainderLeftPercentage
    ),
    rightTotalPercentage: clampPercentage(
      visibleFramePercentages.visibleRightPercentage + croppedFramePercentages.remainderRightPercentage
    )
  };
};

export const resolveLiquidSurfaceCroppedFrameRemainders = (
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceCroppedFrameRemainders => {
  const frameBottomV = resolveLiquidSurfaceFrameBottomV(uvRect);
  const frameHeightV = resolveLiquidSurfaceFrameHeightV(uvRect);

  return {
    remainderLeftV: Math.min(
      frameHeightV,
      Math.max(0, frameBottomV - clampNormalizedLiquidHeight(bottomVCrops.bottomLeftV))
    ),
    remainderRightV: Math.min(
      frameHeightV,
      Math.max(0, frameBottomV - clampNormalizedLiquidHeight(bottomVCrops.bottomRightV))
    )
  };
};

export const resolveLiquidSurfaceCroppedFramePercentages = (
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceCroppedFramePercentages => {
  const frameHeightV = resolveLiquidSurfaceFrameHeightV(uvRect);
  if (frameHeightV <= 0) {
    return {
      remainderLeftPercentage: 0,
      remainderRightPercentage: 0
    };
  }

  const croppedFrameRemainders = resolveLiquidSurfaceCroppedFrameRemainders(uvRect, bottomVCrops);
  return {
    remainderLeftPercentage: clampPercentage(
      (croppedFrameRemainders.remainderLeftV / frameHeightV) * 100
    ),
    remainderRightPercentage: clampPercentage(
      (croppedFrameRemainders.remainderRightV / frameHeightV) * 100
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
  const framePixelHeight = resolveLiquidSurfaceFrameAtlasPixelHeight(atlasHeight, uvRect);

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

export const resolveLiquidSurfaceCoverageAtlasPixelHeightTotals = (
  atlasHeight: number,
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceCoverageAtlasPixelHeightTotals => {
  const visiblePixelHeights = resolveLiquidSurfaceVisibleFrameAtlasPixelHeights(
    atlasHeight,
    uvRect,
    bottomVCrops
  );
  const croppedPixelHeights = resolveLiquidSurfaceCroppedFrameAtlasPixelHeights(
    atlasHeight,
    uvRect,
    bottomVCrops
  );
  const framePixelHeight = resolveLiquidSurfaceFrameAtlasPixelHeight(atlasHeight, uvRect);

  return {
    leftTotalPixelHeight: Math.min(
      framePixelHeight,
      Math.max(
        0,
        visiblePixelHeights.visibleLeftPixelHeight + croppedPixelHeights.remainderLeftPixelHeight
      )
    ),
    rightTotalPixelHeight: Math.min(
      framePixelHeight,
      Math.max(
        0,
        visiblePixelHeights.visibleRightPixelHeight + croppedPixelHeights.remainderRightPixelHeight
      )
    )
  };
};

export const resolveLiquidSurfaceCroppedFrameAtlasPixelHeights = (
  atlasHeight: number,
  uvRect: Pick<TileUvRect, 'v0' | 'v1'>,
  bottomVCrops: LiquidSurfaceBottomVCrops
): LiquidSurfaceCroppedFrameAtlasPixelHeights => {
  const bottomPixelRows = resolveLiquidSurfaceBottomAtlasPixelRows(atlasHeight, bottomVCrops);
  const frameBottomPixelY = resolveLiquidSurfaceFrameBottomAtlasPixelRow(atlasHeight, uvRect);
  const framePixelHeight = resolveLiquidSurfaceFrameAtlasPixelHeight(atlasHeight, uvRect);

  return {
    remainderLeftPixelHeight: Math.min(
      framePixelHeight,
      Math.max(0, frameBottomPixelY - bottomPixelRows.bottomLeftPixelY)
    ),
    remainderRightPixelHeight: Math.min(
      framePixelHeight,
      Math.max(0, frameBottomPixelY - bottomPixelRows.bottomRightPixelY)
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
