import {
  TILE_METADATA,
  resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameUvRect,
  resolveAnimatedTileRenderFrameIndexAtElapsedMs,
  resolveAnimatedTileRenderFrameUvRect
} from '../world/tileMetadata';
import type { TileMetadataRegistry } from '../world/tileMetadata';
import { setChunkMeshTileQuadUvRect, type AnimatedTileQuad } from '../world/mesher';

export interface AnimatedChunkTileState extends AnimatedTileQuad {
  frameIndex: number;
}

export interface AnimatedChunkMeshState {
  vertices: Float32Array;
  animatedTiles: AnimatedChunkTileState[];
}

export interface AnimatedChunkMeshFrameApplyResult {
  changedQuadCount: number;
  changedLiquidQuadCount: number;
}

export const createAnimatedChunkMeshState = (
  vertices: Float32Array,
  animatedTileQuads: readonly AnimatedTileQuad[]
): AnimatedChunkMeshState | null => {
  if (animatedTileQuads.length === 0) {
    return null;
  }

  return {
    vertices,
    animatedTiles: animatedTileQuads.map((quad) => ({
      tileId: quad.tileId,
      vertexFloatOffset: quad.vertexFloatOffset,
      liquidCardinalMask: quad.liquidCardinalMask,
      liquidTopHeights: quad.liquidTopHeights,
      frameIndex: 0
    }))
  };
};

export const applyAnimatedChunkMeshFrameAtElapsedMs = (
  animatedMesh: AnimatedChunkMeshState,
  elapsedMs: number,
  registry: TileMetadataRegistry = TILE_METADATA
): AnimatedChunkMeshFrameApplyResult => {
  let changedTileCount = 0;
  let changedLiquidTileCount = 0;

  for (const animatedTile of animatedMesh.animatedTiles) {
    const nextFrameIndex =
      animatedTile.liquidCardinalMask === undefined
        ? resolveAnimatedTileRenderFrameIndexAtElapsedMs(animatedTile.tileId, elapsedMs, registry)
        : resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs(
            animatedTile.tileId,
            animatedTile.liquidCardinalMask,
            elapsedMs,
            registry
          );
    if (nextFrameIndex === null || nextFrameIndex === animatedTile.frameIndex) {
      continue;
    }

    const uvRect =
      animatedTile.liquidCardinalMask === undefined
        ? resolveAnimatedTileRenderFrameUvRect(animatedTile.tileId, nextFrameIndex, registry)
        : resolveAnimatedLiquidRenderVariantFrameUvRect(
            animatedTile.tileId,
            animatedTile.liquidCardinalMask,
            nextFrameIndex,
            registry
          );
    if (!uvRect) {
      continue;
    }

    setChunkMeshTileQuadUvRect(
      animatedMesh.vertices,
      animatedTile.vertexFloatOffset,
      uvRect,
      animatedTile.liquidTopHeights ?? null
    );
    animatedTile.frameIndex = nextFrameIndex;
    changedTileCount += 1;
    if (animatedTile.liquidCardinalMask !== undefined) {
      changedLiquidTileCount += 1;
    }
  }

  return {
    changedQuadCount: changedTileCount,
    changedLiquidQuadCount: changedLiquidTileCount
  };
};
