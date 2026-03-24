import { describe, expect, it } from 'vitest';

import { createAnimatedChunkMeshState, applyAnimatedChunkMeshFrameAtElapsedMs } from './animatedChunkMesh';
import { AUTHORED_ATLAS_HEIGHT, AUTHORED_ATLAS_WIDTH } from '../world/authoredAtlasLayout';
import { insetTileUvRectForAtlasSampling, setChunkMeshTileQuadUvRect } from '../world/mesher';
import { atlasIndexToUvRect, parseTileMetadataRegistry } from '../world/tileMetadata';

const toFloat32 = (value: number): number => Math.fround(value);
const authoredUvRectFromPixels = (x0: number, y0: number, x1: number, y1: number) => ({
  u0: x0 / AUTHORED_ATLAS_WIDTH,
  v0: y0 / AUTHORED_ATLAS_HEIGHT,
  u1: x1 / AUTHORED_ATLAS_WIDTH,
  v1: y1 / AUTHORED_ATLAS_HEIGHT
});
const sampledUvRect = (uvRect: { u0: number; v0: number; u1: number; v1: number }) =>
  insetTileUvRectForAtlasSampling(uvRect);
const sampledAtlasUvRect = (atlasIndex: number) =>
  insetTileUvRectForAtlasSampling(atlasIndexToUvRect(atlasIndex));

const createSingleQuadVerticesFromUvRect = (
  uvRect: { u0: number; v0: number; u1: number; v1: number },
  lightLevel = 7
): Float32Array => {
  const vertices = new Float32Array([
    0,
    0,
    0,
    0,
    lightLevel,
    16,
    0,
    0,
    0,
    lightLevel,
    16,
    16,
    0,
    0,
    lightLevel,
    0,
    0,
    0,
    0,
    lightLevel,
    16,
    16,
    0,
    0,
    lightLevel,
    0,
    16,
    0,
    0,
    lightLevel
  ]);
  setChunkMeshTileQuadUvRect(vertices, 0, uvRect);
  return vertices;
};

const createSingleQuadVertices = (atlasIndex: number, lightLevel = 7): Float32Array =>
  createSingleQuadVerticesFromUvRect(atlasIndexToUvRect(atlasIndex), lightLevel);

const expectSingleQuadUv = (
  vertices: Float32Array,
  uvRect: { u0: number; v0: number; u1: number; v1: number }
): void => {
  const sampled = sampledUvRect(uvRect);
  expect(Array.from(vertices.slice(2, 4))).toEqual([toFloat32(sampled.u0), toFloat32(sampled.v0)]);
  expect(Array.from(vertices.slice(27, 29))).toEqual([toFloat32(sampled.u0), toFloat32(sampled.v1)]);
};

const expectSingleQuadLiquidUv = (
  vertices: Float32Array,
  atlasIndex: number,
  topHeights: { topLeft: number; topRight: number }
): void => {
  const { u0, v0, u1, v1 } = sampledAtlasUvRect(atlasIndex);
  const bottomLeftV = v0 + (v1 - v0) * topHeights.topLeft;
  const bottomRightV = v0 + (v1 - v0) * topHeights.topRight;

  expect(Array.from(vertices.slice(22, 24))).toEqual([toFloat32(u1), toFloat32(bottomRightV)]);
  expect(Array.from(vertices.slice(27, 29))).toEqual([toFloat32(u0), toFloat32(bottomLeftV)]);
};

describe('animated chunk mesh helpers', () => {
  it('returns null when a chunk mesh has no animated quads', () => {
    expect(createAnimatedChunkMeshState(new Float32Array(0), [])).toBe(null);
  });

  it('patches quad UVs only when the elapsed frame advances', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 5,
          name: 'blink',
          render: {
            atlasIndex: 14,
            frames: [{ atlasIndex: 14 }, { atlasIndex: 15 }],
            frameDurationMs: 180
          }
        }
      ]
    });
    const vertices = createSingleQuadVertices(14);
    const animatedMesh = createAnimatedChunkMeshState(vertices, [{ tileId: 5, vertexFloatOffset: 0 }]);
    if (!animatedMesh) {
      throw new Error('expected animated mesh state');
    }

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 0, registry)).toEqual({
      changedQuadCount: 0,
      changedLiquidQuadCount: 0
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(0);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 179, registry)).toEqual({
      changedQuadCount: 0,
      changedLiquidQuadCount: 0
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(0);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 180, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 0
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(1);
    const frameOneUvRect = sampledAtlasUvRect(15);
    expect(Array.from(vertices.slice(2, 4))).toEqual([
      toFloat32(frameOneUvRect.u0),
      toFloat32(frameOneUvRect.v0)
    ]);
    expect(Array.from(vertices.slice(27, 29))).toEqual([
      toFloat32(frameOneUvRect.u0),
      toFloat32(frameOneUvRect.v1)
    ]);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 359, registry)).toEqual({
      changedQuadCount: 0,
      changedLiquidQuadCount: 0
    });
    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 360, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 0
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(0);
    const frameZeroUvRect = sampledAtlasUvRect(14);
    expect(Array.from(vertices.slice(2, 4))).toEqual([
      toFloat32(frameZeroUvRect.u0),
      toFloat32(frameZeroUvRect.v0)
    ]);
  });

  it('patches animated direct render uvRect quads when the elapsed frame advances', () => {
    const leafFrameZeroUvRect = authoredUvRectFromPixels(81, 17, 95, 31);
    const leafFrameOneUvRect = authoredUvRectFromPixels(82, 17, 96, 31);
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 18,
          name: 'small_tree_leaf',
          render: {
            uvRect: leafFrameZeroUvRect,
            frames: [{ uvRect: leafFrameZeroUvRect }, { uvRect: leafFrameOneUvRect }],
            frameDurationMs: 300
          }
        }
      ]
    });
    const vertices = createSingleQuadVerticesFromUvRect(leafFrameZeroUvRect);
    const animatedMesh = createAnimatedChunkMeshState(vertices, [{ tileId: 18, vertexFloatOffset: 0 }]);
    if (!animatedMesh) {
      throw new Error('expected animated mesh state');
    }

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 299, registry)).toEqual({
      changedQuadCount: 0,
      changedLiquidQuadCount: 0
    });
    expectSingleQuadUv(vertices, leafFrameZeroUvRect);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 300, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 0
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(1);
    expectSingleQuadUv(vertices, leafFrameOneUvRect);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 600, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 0
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(0);
    expectSingleQuadUv(vertices, leafFrameZeroUvRect);
  });

  it('patches liquid-variant quad UVs using the recorded liquid cardinal mask', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 7,
          name: 'water',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: Array.from({ length: 16 }, () => ({
              atlasIndex: 14,
              frames: [{ atlasIndex: 14 }, { atlasIndex: 15 }],
              frameDurationMs: 180
            }))
          }
        }
      ]
    });
    const vertices = createSingleQuadVertices(14);
    const animatedMesh = createAnimatedChunkMeshState(vertices, [
      { tileId: 7, vertexFloatOffset: 0, liquidCardinalMask: 3 }
    ]);
    if (!animatedMesh) {
      throw new Error('expected animated mesh state');
    }

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 0, registry)).toEqual({
      changedQuadCount: 0,
      changedLiquidQuadCount: 0
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(0);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 180, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 1
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(1);
    const frameOneUvRect = sampledAtlasUvRect(15);
    expect(Array.from(vertices.slice(2, 4))).toEqual([
      toFloat32(frameOneUvRect.u0),
      toFloat32(frameOneUvRect.v0)
    ]);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 360, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 1
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(0);
    const frameZeroUvRect = sampledAtlasUvRect(14);
    expect(Array.from(vertices.slice(27, 29))).toEqual([
      toFloat32(frameZeroUvRect.u0),
      toFloat32(frameZeroUvRect.v1)
    ]);
  });

  it('preserves partial-liquid top-aligned v crops when animated liquid frames advance', () => {
    const registry = parseTileMetadataRegistry({
      tiles: [
        {
          id: 0,
          name: 'empty',
          gameplay: { solid: false, blocksLight: false }
        },
        {
          id: 7,
          name: 'water',
          gameplay: { solid: false, blocksLight: false, liquidKind: 'water' },
          liquidRender: {
            connectivityGroup: 'water',
            variantRenderByCardinalMask: Array.from({ length: 16 }, () => ({
              atlasIndex: 14,
              frames: [{ atlasIndex: 14 }, { atlasIndex: 15 }],
              frameDurationMs: 180
            }))
          }
        }
      ]
    });
    const vertices = createSingleQuadVertices(14);
    const animatedMesh = createAnimatedChunkMeshState(vertices, [
      {
        tileId: 7,
        vertexFloatOffset: 0,
        liquidCardinalMask: 3,
        liquidTopHeights: {
          topLeft: 0.75,
          topRight: 0.375
        }
      }
    ]);
    if (!animatedMesh) {
      throw new Error('expected animated mesh state');
    }

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 180, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 1
    });
    expectSingleQuadLiquidUv(vertices, 15, {
      topLeft: 0.75,
      topRight: 0.375
    });

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 360, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 1
    });
    expectSingleQuadLiquidUv(vertices, 14, {
      topLeft: 0.75,
      topRight: 0.375
    });
  });
});
