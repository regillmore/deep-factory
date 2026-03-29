import { type DroppedItemState } from '../world/droppedItem';
import { type EntityRenderStateSnapshot } from '../world/entityRegistry';
import {
  resolveInterpolatedEntityWorldPosition,
  type EntityWorldPosition
} from '../world/entityRenderInterpolation';
import { MAX_LIGHT_LEVEL, TILE_SIZE } from '../world/constants';
import { getPlayerCameraFocusPoint } from '../world/playerState';
import { type StandalonePlayerRenderState } from '../world/standalonePlayerRenderState';
import type { TileWorld } from '../world/world';

export const GRAPPLING_HOOK_TETHER_PLACEHOLDER_VERTEX_STRIDE_FLOATS = 4;
export const GRAPPLING_HOOK_TETHER_PLACEHOLDER_VERTEX_COUNT = 6;
export const GRAPPLING_HOOK_TETHER_PLACEHOLDER_VERTEX_FLOAT_COUNT =
  GRAPPLING_HOOK_TETHER_PLACEHOLDER_VERTEX_COUNT *
  GRAPPLING_HOOK_TETHER_PLACEHOLDER_VERTEX_STRIDE_FLOATS;
export const GRAPPLING_HOOK_TETHER_PLACEHOLDER_THICKNESS = 2;

const GRAPPLING_HOOK_TETHER_PLACEHOLDER_HALF_THICKNESS =
  GRAPPLING_HOOK_TETHER_PLACEHOLDER_THICKNESS * 0.5;
const GRAPPLING_HOOK_TETHER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES = 1;
const GRAPPLING_HOOK_TETHER_LENGTH_EPSILON = 1e-6;

interface TileRange {
  min: number;
  max: number;
}

export interface GrapplingHookTetherPlaceholderEndpoints {
  playerWorldPoint: EntityWorldPosition;
  hookWorldPoint: EntityWorldPosition;
}

export interface GrapplingHookTetherPlaceholderNearbyLightSourceTile {
  x: number;
  y: number;
}

export interface GrapplingHookTetherPlaceholderNearbyLightSample {
  level: number;
  sourceTile: GrapplingHookTetherPlaceholderNearbyLightSourceTile | null;
}

const clampGrapplingHookTetherPlaceholderLightLevel = (lightLevel: number): number =>
  Math.max(0, Math.min(MAX_LIGHT_LEVEL, Math.floor(lightLevel)));

const getExpandedTileRange = (min: number, max: number): TileRange | null => {
  const expandedMin = min - GRAPPLING_HOOK_TETHER_PLACEHOLDER_HALF_THICKNESS;
  const expandedMax = max + GRAPPLING_HOOK_TETHER_PLACEHOLDER_HALF_THICKNESS;
  if (expandedMax < expandedMin) {
    return null;
  }

  return {
    min: Math.floor(expandedMin / TILE_SIZE),
    max: Math.ceil(expandedMax / TILE_SIZE) - 1
  };
};

export const resolveInterpolatedGrapplingHookTetherPlaceholderEndpoints = (
  standalonePlayerSnapshot: EntityRenderStateSnapshot<StandalonePlayerRenderState>,
  grapplingHookSnapshot: EntityRenderStateSnapshot<DroppedItemState>,
  renderAlpha: number
): GrapplingHookTetherPlaceholderEndpoints => {
  const playerRenderPosition = resolveInterpolatedEntityWorldPosition(
    standalonePlayerSnapshot,
    renderAlpha
  );
  const hookWorldPoint = resolveInterpolatedEntityWorldPosition(grapplingHookSnapshot, renderAlpha);

  return {
    playerWorldPoint: getPlayerCameraFocusPoint({
      ...standalonePlayerSnapshot.current,
      position: playerRenderPosition
    }),
    hookWorldPoint
  };
};

export const buildGrapplingHookTetherPlaceholderVertices = (
  endpoints: GrapplingHookTetherPlaceholderEndpoints
): Float32Array => {
  const deltaX = endpoints.hookWorldPoint.x - endpoints.playerWorldPoint.x;
  const deltaY = endpoints.hookWorldPoint.y - endpoints.playerWorldPoint.y;
  const tetherLength = Math.hypot(deltaX, deltaY);

  let normalX = 0;
  let normalY = GRAPPLING_HOOK_TETHER_PLACEHOLDER_HALF_THICKNESS;
  if (tetherLength > GRAPPLING_HOOK_TETHER_LENGTH_EPSILON) {
    normalX = (-deltaY / tetherLength) * GRAPPLING_HOOK_TETHER_PLACEHOLDER_HALF_THICKNESS;
    normalY = (deltaX / tetherLength) * GRAPPLING_HOOK_TETHER_PLACEHOLDER_HALF_THICKNESS;
  }

  const startLower = {
    x: endpoints.playerWorldPoint.x - normalX,
    y: endpoints.playerWorldPoint.y - normalY
  };
  const startUpper = {
    x: endpoints.playerWorldPoint.x + normalX,
    y: endpoints.playerWorldPoint.y + normalY
  };
  const endLower = {
    x: endpoints.hookWorldPoint.x - normalX,
    y: endpoints.hookWorldPoint.y - normalY
  };
  const endUpper = {
    x: endpoints.hookWorldPoint.x + normalX,
    y: endpoints.hookWorldPoint.y + normalY
  };

  return new Float32Array([
    startLower.x,
    startLower.y,
    0,
    0,
    startUpper.x,
    startUpper.y,
    0,
    1,
    endUpper.x,
    endUpper.y,
    1,
    1,
    startLower.x,
    startLower.y,
    0,
    0,
    endUpper.x,
    endUpper.y,
    1,
    1,
    endLower.x,
    endLower.y,
    1,
    0
  ]);
};

export const getGrapplingHookTetherPlaceholderNearbyLightSample = (
  world: Pick<TileWorld, 'getLightLevel'>,
  endpoints: GrapplingHookTetherPlaceholderEndpoints
): GrapplingHookTetherPlaceholderNearbyLightSample => {
  const xRange = getExpandedTileRange(
    Math.min(endpoints.playerWorldPoint.x, endpoints.hookWorldPoint.x),
    Math.max(endpoints.playerWorldPoint.x, endpoints.hookWorldPoint.x)
  );
  const yRange = getExpandedTileRange(
    Math.min(endpoints.playerWorldPoint.y, endpoints.hookWorldPoint.y),
    Math.max(endpoints.playerWorldPoint.y, endpoints.hookWorldPoint.y)
  );
  if (xRange === null || yRange === null) {
    return { level: 0, sourceTile: null };
  }

  let maxNearbyLightLevel = 0;
  let maxNearbyLightSourceTile: GrapplingHookTetherPlaceholderNearbyLightSourceTile | null = null;
  for (
    let tileY = yRange.min - GRAPPLING_HOOK_TETHER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY <= yRange.max + GRAPPLING_HOOK_TETHER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
    tileY += 1
  ) {
    for (
      let tileX = xRange.min - GRAPPLING_HOOK_TETHER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX <= xRange.max + GRAPPLING_HOOK_TETHER_PLACEHOLDER_NEARBY_LIGHT_SAMPLE_PADDING_TILES;
      tileX += 1
    ) {
      const sampledLightLevel = clampGrapplingHookTetherPlaceholderLightLevel(
        world.getLightLevel(tileX, tileY)
      );
      if (sampledLightLevel > maxNearbyLightLevel || maxNearbyLightSourceTile === null) {
        maxNearbyLightLevel = sampledLightLevel;
        maxNearbyLightSourceTile = { x: tileX, y: tileY };
      }
      if (maxNearbyLightLevel >= MAX_LIGHT_LEVEL) {
        return {
          level: MAX_LIGHT_LEVEL,
          sourceTile: maxNearbyLightSourceTile
        };
      }
    }
  }

  return {
    level: maxNearbyLightLevel,
    sourceTile: maxNearbyLightSourceTile
  };
};
