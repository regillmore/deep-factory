import type { EntityRenderStateSnapshot } from './entityRegistry';

export interface EntityWorldPosition {
  x: number;
  y: number;
}

export interface EntityRenderStateWithWorldPosition {
  position: EntityWorldPosition;
}

const clampInterpolationAlpha = (alpha: number): number => {
  if (!Number.isFinite(alpha)) {
    throw new Error('alpha must be a finite number');
  }

  return Math.min(1, Math.max(0, alpha));
};

const interpolateNumber = (start: number, end: number, alpha: number): number =>
  start + (end - start) * alpha;

export const resolveInterpolatedEntityWorldPosition = <
  TRenderState extends EntityRenderStateWithWorldPosition
>(
  snapshot: EntityRenderStateSnapshot<TRenderState>,
  alpha: number
): EntityWorldPosition => {
  const clampedAlpha = clampInterpolationAlpha(alpha);

  return {
    x: interpolateNumber(snapshot.previous.position.x, snapshot.current.position.x, clampedAlpha),
    y: interpolateNumber(snapshot.previous.position.y, snapshot.current.position.y, clampedAlpha)
  };
};
