import { describe, expect, it } from 'vitest';

import { createAnimatedChunkMeshState, applyAnimatedChunkMeshFrameAtElapsedMs } from './animatedChunkMesh';
import { atlasIndexToUvRect, parseTileMetadataRegistry } from '../world/tileMetadata';

const toFloat32 = (value: number): number => Math.fround(value);

const createSingleQuadVertices = (atlasIndex: number, lightLevel = 7): Float32Array => {
  const { u0, v0, u1, v1 } = atlasIndexToUvRect(atlasIndex);
  return new Float32Array([
    0,
    0,
    u0,
    v0,
    lightLevel,
    16,
    0,
    u1,
    v0,
    lightLevel,
    16,
    16,
    u1,
    v1,
    lightLevel,
    0,
    0,
    u0,
    v0,
    lightLevel,
    16,
    16,
    u1,
    v1,
    lightLevel,
    0,
    16,
    u0,
    v1,
    lightLevel
  ]);
};

const expectSingleQuadLiquidUv = (
  vertices: Float32Array,
  atlasIndex: number,
  topHeights: { topLeft: number; topRight: number }
): void => {
  const { u0, v0, u1, v1 } = atlasIndexToUvRect(atlasIndex);
  const bottomLeftV = v0 + (v1 - v0) * topHeights.topLeft;
  const bottomRightV = v0 + (v1 - v0) * topHeights.topRight;

  expect(Array.from(vertices.slice(2, 4))).toEqual([toFloat32(u0), toFloat32(v0)]);
  expect(Array.from(vertices.slice(7, 9))).toEqual([toFloat32(u1), toFloat32(v0)]);
  expect(Array.from(vertices.slice(12, 14))).toEqual([toFloat32(u1), toFloat32(bottomRightV)]);
  expect(Array.from(vertices.slice(17, 19))).toEqual([toFloat32(u0), toFloat32(v0)]);
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
    expect(Array.from(vertices.slice(2, 4))).toEqual([
      toFloat32(atlasIndexToUvRect(15).u0),
      toFloat32(atlasIndexToUvRect(15).v0)
    ]);
    expect(Array.from(vertices.slice(27, 29))).toEqual([
      toFloat32(atlasIndexToUvRect(15).u0),
      toFloat32(atlasIndexToUvRect(15).v1)
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
    expect(Array.from(vertices.slice(2, 4))).toEqual([
      toFloat32(atlasIndexToUvRect(14).u0),
      toFloat32(atlasIndexToUvRect(14).v0)
    ]);
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
    expect(Array.from(vertices.slice(2, 4))).toEqual([
      toFloat32(atlasIndexToUvRect(15).u0),
      toFloat32(atlasIndexToUvRect(15).v0)
    ]);

    expect(applyAnimatedChunkMeshFrameAtElapsedMs(animatedMesh, 360, registry)).toEqual({
      changedQuadCount: 1,
      changedLiquidQuadCount: 1
    });
    expect(animatedMesh.animatedTiles[0]?.frameIndex).toBe(0);
    expect(Array.from(vertices.slice(27, 29))).toEqual([
      toFloat32(atlasIndexToUvRect(14).u0),
      toFloat32(atlasIndexToUvRect(14).v1)
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
