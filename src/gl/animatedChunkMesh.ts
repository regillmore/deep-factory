import {
  TILE_METADATA,
  resolveAnimatedLiquidRenderVariantFrameIndexAtElapsedMs,
  resolveAnimatedLiquidRenderVariantFrameUvRect,
  resolveAnimatedTileRenderFrameIndexAtElapsedMs,
  resolveAnimatedTileRenderFrameUvRect
} from '../world/tileMetadata';
import type { TileMetadataRegistry, TileUvRect } from '../world/tileMetadata';
import {
  CHUNK_MESH_FLOATS_PER_VERTEX,
  CHUNK_MESH_UV_FLOAT_OFFSET,
  type AnimatedTileQuad
} from '../world/mesher';

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

const setTileQuadUvRect = (
  vertices: Float32Array,
  vertexFloatOffset: number,
  uvRect: TileUvRect
): void => {
  const { u0, v0, u1, v1 } = uvRect;
  const vertex0UvOffset = vertexFloatOffset + CHUNK_MESH_UV_FLOAT_OFFSET;
  const vertex1UvOffset = vertex0UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex2UvOffset = vertex1UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex3UvOffset = vertex2UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex4UvOffset = vertex3UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;
  const vertex5UvOffset = vertex4UvOffset + CHUNK_MESH_FLOATS_PER_VERTEX;

  vertices[vertex0UvOffset] = u0;
  vertices[vertex0UvOffset + 1] = v0;
  vertices[vertex1UvOffset] = u1;
  vertices[vertex1UvOffset + 1] = v0;
  vertices[vertex2UvOffset] = u1;
  vertices[vertex2UvOffset + 1] = v1;
  vertices[vertex3UvOffset] = u0;
  vertices[vertex3UvOffset + 1] = v0;
  vertices[vertex4UvOffset] = u1;
  vertices[vertex4UvOffset + 1] = v1;
  vertices[vertex5UvOffset] = u0;
  vertices[vertex5UvOffset + 1] = v1;
};

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

    setTileQuadUvRect(animatedMesh.vertices, animatedTile.vertexFloatOffset, uvRect);
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
