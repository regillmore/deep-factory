export type DebugBreakTargetLayer = 'tile' | 'wall';

export interface DebugBreakTargetWorldView {
  getTile(worldTileX: number, worldTileY: number): number;
  getWall(worldTileX: number, worldTileY: number): number;
}

export interface DebugBreakTargetEvaluation {
  tileX: number;
  tileY: number;
  tileId: number;
  wallId: number;
  targetLayer: DebugBreakTargetLayer | null;
  targetId: number;
  breakableTarget: boolean;
}

export interface DebugBreakPreviewTarget {
  tileX: number;
  tileY: number;
  targetLayer: DebugBreakTargetLayer;
}

const resolveDebugBreakTarget = (
  tileId: number,
  wallId: number
): Pick<DebugBreakTargetEvaluation, 'targetLayer' | 'targetId' | 'breakableTarget'> => {
  if (tileId !== 0) {
    return {
      targetLayer: 'tile',
      targetId: tileId,
      breakableTarget: true
    };
  }

  if (wallId !== 0) {
    return {
      targetLayer: 'wall',
      targetId: wallId,
      breakableTarget: true
    };
  }

  return {
    targetLayer: null,
    targetId: 0,
    breakableTarget: false
  };
};

export const evaluateDebugBreakTarget = (
  world: DebugBreakTargetWorldView,
  worldTileX: number,
  worldTileY: number
): DebugBreakTargetEvaluation => {
  const tileId = world.getTile(worldTileX, worldTileY);
  const wallId = world.getWall(worldTileX, worldTileY);
  const { targetLayer, targetId, breakableTarget } = resolveDebugBreakTarget(tileId, wallId);
  return {
    tileX: worldTileX,
    tileY: worldTileY,
    tileId,
    wallId,
    targetLayer,
    targetId,
    breakableTarget
  };
};

export const resolveDebugBreakPreviewTarget = (
  world: DebugBreakTargetWorldView,
  worldTileX: number,
  worldTileY: number
): DebugBreakPreviewTarget | null => {
  const evaluation = evaluateDebugBreakTarget(world, worldTileX, worldTileY);
  if (!evaluation.breakableTarget || evaluation.targetLayer === null) {
    return null;
  }

  return {
    tileX: worldTileX,
    tileY: worldTileY,
    targetLayer: evaluation.targetLayer
  };
};

export const collectDebugBreakPreviewTargets = (
  world: DebugBreakTargetWorldView,
  walk: (visit: (worldTileX: number, worldTileY: number) => void) => void
): DebugBreakPreviewTarget[] => {
  const targets: DebugBreakPreviewTarget[] = [];
  const visitedKeys = new Set<string>();
  walk((worldTileX, worldTileY) => {
    const key = `${worldTileX},${worldTileY}`;
    if (visitedKeys.has(key)) {
      return;
    }
    visitedKeys.add(key);

    const target = resolveDebugBreakPreviewTarget(world, worldTileX, worldTileY);
    if (target === null) {
      return;
    }
    targets.push(target);
  });
  return targets;
};
