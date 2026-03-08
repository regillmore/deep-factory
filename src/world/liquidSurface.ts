import { MAX_LIQUID_LEVEL } from './constants';
import {
  areLiquidRenderNeighborsConnected,
  TILE_METADATA,
  type TileMetadataRegistry
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

export type LiquidSurfaceBranchKind = 'empty' | 'north-covered' | 'exposed';

const clampLiquidFillLevel = (fillLevel: number): number => {
  if (!Number.isFinite(fillLevel)) {
    return 0;
  }

  return Math.min(MAX_LIQUID_LEVEL, Math.max(0, fillLevel));
};

const toNormalizedLiquidFillHeight = (fillLevel: number): number => fillLevel / MAX_LIQUID_LEVEL;

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

export const resolveConnectedLiquidNeighborLevel = (
  centerTileId: number,
  neighborTileId: number,
  neighborLevel: number,
  tileMetadataRegistry: TileMetadataRegistry = TILE_METADATA
): number =>
  areLiquidRenderNeighborsConnected(centerTileId, neighborTileId, tileMetadataRegistry)
    ? neighborLevel
    : 0;
