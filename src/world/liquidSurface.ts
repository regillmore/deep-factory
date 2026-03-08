import { MAX_LIQUID_LEVEL } from './constants';

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

const clampLiquidFillLevel = (fillLevel: number): number => {
  if (!Number.isFinite(fillLevel)) {
    return 0;
  }

  return Math.min(MAX_LIQUID_LEVEL, Math.max(0, fillLevel));
};

const toNormalizedLiquidFillHeight = (fillLevel: number): number => fillLevel / MAX_LIQUID_LEVEL;

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
  if (centerLevel <= 0) {
    return { topLeft: 0, topRight: 0 };
  }

  const northLevel = clampLiquidFillLevel(levels.north);
  if (northLevel > 0) {
    return { topLeft: 1, topRight: 1 };
  }

  const westLevel = clampLiquidFillLevel(levels.west);
  const eastLevel = clampLiquidFillLevel(levels.east);
  return {
    topLeft: resolveExposedLiquidCornerHeight(centerLevel, westLevel),
    topRight: resolveExposedLiquidCornerHeight(centerLevel, eastLevel)
  };
};
