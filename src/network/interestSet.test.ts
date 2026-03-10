import { describe, expect, it } from 'vitest';

import {
  calculateClientInterestSet,
  diffClientInterestSets,
  resolveViewportWorldBounds
} from './interestSet';

describe('resolveViewportWorldBounds', () => {
  it('derives world-space viewport edges from the camera center, zoom, and canvas size', () => {
    expect(
      resolveViewportWorldBounds({
        x: 256,
        y: -128,
        zoom: 2,
        viewportWidthPx: 512,
        viewportHeightPx: 256
      })
    ).toEqual({
      minX: 128,
      minY: -192,
      maxX: 384,
      maxY: -64
    });
  });
});

describe('calculateClientInterestSet', () => {
  it('builds padded chunk relevance and sorted entity ids from a client viewport', () => {
    const interestSet = calculateClientInterestSet({
      viewport: {
        x: 0,
        y: 0,
        zoom: 2,
        viewportWidthPx: 512,
        viewportHeightPx: 512
      },
      chunkPaddingChunks: 1,
      entityPaddingWorld: 64,
      entities: [
        {
          id: 7,
          position: {
            x: 191,
            y: 0
          }
        },
        {
          id: 2,
          position: {
            x: -192,
            y: -192
          }
        },
        {
          id: 5,
          position: {
            x: 193,
            y: 0
          }
        }
      ]
    });

    expect(interestSet.visibleWorldBounds).toEqual({
      minX: -128,
      minY: -128,
      maxX: 128,
      maxY: 128
    });
    expect(interestSet.entityWorldBounds).toEqual({
      minX: -192,
      minY: -192,
      maxX: 192,
      maxY: 192
    });
    expect(interestSet.visibleChunkBounds).toEqual({
      minChunkX: -1,
      minChunkY: -1,
      maxChunkX: 0,
      maxChunkY: 0
    });
    expect(interestSet.chunkBounds).toEqual({
      minChunkX: -2,
      minChunkY: -2,
      maxChunkX: 1,
      maxChunkY: 1
    });
    expect(interestSet.chunks).toEqual([
      { x: -2, y: -2 },
      { x: -1, y: -2 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
      { x: -2, y: -1 },
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
      { x: -2, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 1 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ]);
    expect(interestSet.entityIds).toEqual([2, 7]);
  });

  it('rejects duplicate entity candidates so interest membership stays unambiguous', () => {
    expect(() =>
      calculateClientInterestSet({
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
          viewportWidthPx: 128,
          viewportHeightPx: 128
        },
        entities: [
          {
            id: 4,
            position: {
              x: 0,
              y: 0
            }
          },
          {
            id: 4,
            position: {
              x: 32,
              y: 32
            }
          }
        ]
      })
    ).toThrow('entities must not contain duplicate id 4');
  });

  it('rejects invalid padding and viewport inputs before building relevance bounds', () => {
    expect(() =>
      calculateClientInterestSet({
        viewport: {
          x: 0,
          y: 0,
          zoom: 0,
          viewportWidthPx: 128,
          viewportHeightPx: 128
        }
      })
    ).toThrow('viewport.zoom must be greater than 0');

    expect(() =>
      calculateClientInterestSet({
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
          viewportWidthPx: 128,
          viewportHeightPx: 128
        },
        chunkPaddingChunks: -1
      })
    ).toThrow('chunkPaddingChunks must be a non-negative integer');
  });
});

describe('diffClientInterestSets', () => {
  it('reports deterministic chunk and entity enters and exits between interest snapshots', () => {
    const previous = calculateClientInterestSet({
      viewport: {
        x: 0,
        y: 0,
        zoom: 2,
        viewportWidthPx: 512,
        viewportHeightPx: 512
      },
      entities: [
        {
          id: 8,
          position: {
            x: -64,
            y: 0
          }
        },
        {
          id: 3,
          position: {
            x: 544,
            y: 0
          }
        }
      ]
    });

    const next = calculateClientInterestSet({
      viewport: {
        x: 512,
        y: 0,
        zoom: 2,
        viewportWidthPx: 512,
        viewportHeightPx: 512
      },
      entities: [
        {
          id: 8,
          position: {
            x: -64,
            y: 0
          }
        },
        {
          id: 3,
          position: {
            x: 544,
            y: 0
          }
        }
      ]
    });

    expect(diffClientInterestSets(previous, next)).toEqual({
      enteredChunks: [
        { x: 1, y: -1 },
        { x: 1, y: 0 }
      ],
      exitedChunks: [
        { x: -1, y: -1 },
        { x: -1, y: 0 }
      ],
      enteredEntityIds: [3],
      exitedEntityIds: [8]
    });
  });
});
