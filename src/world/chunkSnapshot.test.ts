import { describe, expect, it } from 'vitest';

import { CHUNK_SIZE } from './constants';
import {
  CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING,
  CHUNK_SNAPSHOT_FORMAT_VERSION,
  CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING,
  CHUNK_SNAPSHOT_TILE_COUNT,
  CHUNK_SNAPSHOT_TILE_ORDER,
  decodeChunkDenseTilePayload,
  decodeChunkSparseTilePayload,
  decodeEditedChunkSnapshot,
  decodeResidentChunkSnapshot,
  encodeChunkDenseTilePayload,
  encodeEditedChunkSnapshot,
  encodeResidentChunkSnapshot
} from './chunkSnapshot';
import type { Chunk } from './types';

const createFilledLayer = (segments: Array<{ start: number; length: number; value: number }>): Uint8Array => {
  const layer = new Uint8Array(CHUNK_SNAPSHOT_TILE_COUNT);
  for (const segment of segments) {
    layer.fill(segment.value, segment.start, segment.start + segment.length);
  }
  return layer;
};

describe('chunkSnapshot', () => {
  it('round-trips a resident chunk through explicit versioned metadata and dense payload encodings', () => {
    const chunk: Chunk = {
      coord: { x: -2, y: 3 },
      tiles: createFilledLayer([
        { start: 0, length: 128, value: 2 },
        { start: 128, length: 16, value: 7 },
        { start: 144, length: CHUNK_SNAPSHOT_TILE_COUNT - 144, value: 1 }
      ]),
      liquidLevels: createFilledLayer([
        { start: 128, length: 8, value: 8 },
        { start: 136, length: 8, value: 4 }
      ]),
      lightLevels: createFilledLayer([
        { start: 0, length: 32, value: 15 },
        { start: 32, length: 32, value: 12 },
        { start: 64, length: CHUNK_SNAPSHOT_TILE_COUNT - 64, value: 3 }
      ]),
      lightDirty: true,
      lightDirtyColumnMask: 0x0000ffff
    };

    const snapshot = encodeResidentChunkSnapshot(chunk);

    expect(snapshot).toEqual({
      kind: 'resident',
      coord: { x: -2, y: 3 },
      metadata: {
        version: CHUNK_SNAPSHOT_FORMAT_VERSION,
        chunkSize: CHUNK_SIZE,
        tileCount: CHUNK_SNAPSHOT_TILE_COUNT,
        tileOrder: CHUNK_SNAPSHOT_TILE_ORDER,
        tilePayloadEncoding: CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING,
        liquidPayloadEncoding: CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING,
        lightPayloadEncoding: CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING
      },
      payload: {
        tiles: [128, 2, 16, 7, 880, 1],
        liquidLevels: [128, 0, 8, 8, 8, 4, 880, 0],
        lightLevels: [32, 15, 32, 12, 960, 3]
      },
      light: {
        dirty: true,
        dirtyColumnMask: 0x0000ffff
      }
    });

    const decoded = decodeResidentChunkSnapshot(snapshot);

    expect(decoded).toEqual(chunk);
    expect(decoded).not.toBe(chunk);
    expect(decoded.tiles).not.toBe(chunk.tiles);
    expect(decoded.liquidLevels).not.toBe(chunk.liquidLevels);
    expect(decoded.lightLevels).not.toBe(chunk.lightLevels);
  });

  it('round-trips sparse edited chunk overrides through sorted index/value payloads', () => {
    const state = {
      coord: { x: 4, y: -1 },
      tileOverrides: new Map([
        [1023, 7],
        [1, 2],
        [32, 9]
      ]),
      liquidLevelOverrides: new Map([
        [32, 8],
        [33, 4]
      ])
    };

    const snapshot = encodeEditedChunkSnapshot(state);

    expect(snapshot).toEqual({
      kind: 'edited',
      coord: { x: 4, y: -1 },
      metadata: {
        version: CHUNK_SNAPSHOT_FORMAT_VERSION,
        chunkSize: CHUNK_SIZE,
        tileCount: CHUNK_SNAPSHOT_TILE_COUNT,
        tileOrder: CHUNK_SNAPSHOT_TILE_ORDER,
        tilePayloadEncoding: CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING,
        liquidPayloadEncoding: CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING
      },
      payload: {
        tileOverrides: [1, 2, 32, 9, 1023, 7],
        liquidLevelOverrides: [32, 8, 33, 4]
      }
    });

    const decoded = decodeEditedChunkSnapshot(snapshot);

    expect(decoded.coord).toEqual({ x: 4, y: -1 });
    expect(Array.from(decoded.tileOverrides.entries())).toEqual([
      [1, 2],
      [32, 9],
      [1023, 7]
    ]);
    expect(Array.from(decoded.liquidLevelOverrides.entries())).toEqual([
      [32, 8],
      [33, 4]
    ]);
    expect(decoded.tileOverrides).not.toBe(state.tileOverrides);
    expect(decoded.liquidLevelOverrides).not.toBe(state.liquidLevelOverrides);
  });

  it('rejects resident snapshots whose metadata version does not match the current format', () => {
    const snapshot = encodeResidentChunkSnapshot({
      coord: { x: 0, y: 0 },
      tiles: new Uint8Array(CHUNK_SNAPSHOT_TILE_COUNT),
      liquidLevels: new Uint8Array(CHUNK_SNAPSHOT_TILE_COUNT),
      lightLevels: new Uint8Array(CHUNK_SNAPSHOT_TILE_COUNT),
      lightDirty: false,
      lightDirtyColumnMask: 0
    });

    expect(() =>
      decodeResidentChunkSnapshot({
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          version: 99
        }
      } as unknown as ReturnType<typeof encodeResidentChunkSnapshot>)
    ).toThrowError(/metadata\.version must be 1, received 99/);
  });

  it('rejects dense payloads that do not expand to the full chunk tile count', () => {
    expect(() => decodeChunkDenseTilePayload([CHUNK_SNAPSHOT_TILE_COUNT - 1, 3], 'payload.tiles')).toThrowError(
      /payload\.tiles expands to 1023 tiles instead of 1024/
    );
  });

  it('rejects sparse payloads whose indices are not strictly increasing', () => {
    expect(() => decodeChunkSparseTilePayload([4, 1, 4, 2], 'payload.tileOverrides')).toThrowError(
      /payload\.tileOverrides tile indices must be strictly increasing/
    );
  });

  it('encodes dense payload runs deterministically for repeated tile values', () => {
    const layer = createFilledLayer([
      { start: 0, length: 3, value: 1 },
      { start: 3, length: 2, value: 2 },
      { start: 5, length: CHUNK_SNAPSHOT_TILE_COUNT - 5, value: 1 }
    ]);

    expect(encodeChunkDenseTilePayload(layer)).toEqual([3, 1, 2, 2, 1019, 1]);
  });
});
