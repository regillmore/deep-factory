import {
  TILE_METADATA,
  resolveAnimatedTileRenderFrameIndexAtElapsedMs,
  resolveAnimatedTileRenderFrameUvRect
} from '../world/tileMetadata';
import type { TileMetadataRegistry, TileUvRect } from '../world/tileMetadata';
import type { AnimatedTileQuad } from '../world/mesher';

export interface AnimatedChunkTileState extends AnimatedTileQuad {
  frameIndex: number;
}

export interface AnimatedChunkMeshState {
  vertices: Float32Array;
  animatedTiles: AnimatedChunkTileState[];
}

const setTileQuadUvRect = (
  vertices: Float32Array,
  vertexFloatOffset: number,
  uvRect: TileUvRect
): void => {
  const { u0, v0, u1, v1 } = uvRect;

  vertices[vertexFloatOffset + 2] = u0;
  vertices[vertexFloatOffset + 3] = v0;
  vertices[vertexFloatOffset + 6] = u1;
  vertices[vertexFloatOffset + 7] = v0;
  vertices[vertexFloatOffset + 10] = u1;
  vertices[vertexFloatOffset + 11] = v1;
  vertices[vertexFloatOffset + 14] = u0;
  vertices[vertexFloatOffset + 15] = v0;
  vertices[vertexFloatOffset + 18] = u1;
  vertices[vertexFloatOffset + 19] = v1;
  vertices[vertexFloatOffset + 22] = u0;
  vertices[vertexFloatOffset + 23] = v1;
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
      frameIndex: 0
    }))
  };
};

export const applyAnimatedChunkMeshFrameAtElapsedMs = (
  animatedMesh: AnimatedChunkMeshState,
  elapsedMs: number,
  registry: TileMetadataRegistry = TILE_METADATA
): boolean => {
  let changed = false;

  for (const animatedTile of animatedMesh.animatedTiles) {
    const nextFrameIndex = resolveAnimatedTileRenderFrameIndexAtElapsedMs(
      animatedTile.tileId,
      elapsedMs,
      registry
    );
    if (nextFrameIndex === null || nextFrameIndex === animatedTile.frameIndex) {
      continue;
    }

    const uvRect = resolveAnimatedTileRenderFrameUvRect(animatedTile.tileId, nextFrameIndex, registry);
    if (!uvRect) {
      continue;
    }

    setTileQuadUvRect(animatedMesh.vertices, animatedTile.vertexFloatOffset, uvRect);
    animatedTile.frameIndex = nextFrameIndex;
    changed = true;
  }

  return changed;
};
