import { CHUNK_SIZE } from './constants';
import type { Chunk, ChunkCoord } from './types';

const LEGACY_CHUNK_SNAPSHOT_FORMAT_VERSION = 1 as const;
export const CHUNK_SNAPSHOT_FORMAT_VERSION = 2 as const;
export const CHUNK_SNAPSHOT_TILE_ORDER = 'row-major' as const;
export const CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING = 'rle-u8-pairs' as const;
export const CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING = 'index-value-pairs-u16-u8' as const;
export const CHUNK_SNAPSHOT_TILE_COUNT = CHUNK_SIZE * CHUNK_SIZE;

type DensePayloadEncoding = typeof CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING;
type SparsePayloadEncoding = typeof CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING;
type TileOrder = typeof CHUNK_SNAPSHOT_TILE_ORDER;
type ChunkSnapshotFormatVersion =
  | typeof LEGACY_CHUNK_SNAPSHOT_FORMAT_VERSION
  | typeof CHUNK_SNAPSHOT_FORMAT_VERSION;

export interface ChunkSnapshotMetadata {
  version: ChunkSnapshotFormatVersion;
  chunkSize: typeof CHUNK_SIZE;
  tileCount: typeof CHUNK_SNAPSHOT_TILE_COUNT;
  tileOrder: TileOrder;
}

export interface ResidentChunkSnapshot {
  kind: 'resident';
  coord: ChunkCoord;
  metadata: ChunkSnapshotMetadata & {
    tilePayloadEncoding: DensePayloadEncoding;
    wallPayloadEncoding?: DensePayloadEncoding;
    liquidPayloadEncoding: DensePayloadEncoding;
    lightPayloadEncoding: DensePayloadEncoding;
  };
  payload: {
    tiles: number[];
    wallIds?: number[];
    liquidLevels: number[];
    lightLevels: number[];
  };
  light: {
    dirty: boolean;
    dirtyColumnMask: number;
  };
}

export interface EditedChunkSnapshotState {
  coord: ChunkCoord;
  tileOverrides: ReadonlyMap<number, number>;
  wallOverrides: ReadonlyMap<number, number>;
  liquidLevelOverrides: ReadonlyMap<number, number>;
}

export interface EditedChunkSnapshot {
  kind: 'edited';
  coord: ChunkCoord;
  metadata: ChunkSnapshotMetadata & {
    tilePayloadEncoding: SparsePayloadEncoding;
    wallPayloadEncoding?: SparsePayloadEncoding;
    liquidPayloadEncoding: SparsePayloadEncoding;
  };
  payload: {
    tileOverrides: number[];
    wallOverrides?: number[];
    liquidLevelOverrides: number[];
  };
}

export type ChunkSnapshot = ResidentChunkSnapshot | EditedChunkSnapshot;

const createChunkSnapshotMetadata = (): ChunkSnapshotMetadata => ({
  version: CHUNK_SNAPSHOT_FORMAT_VERSION,
  chunkSize: CHUNK_SIZE,
  tileCount: CHUNK_SNAPSHOT_TILE_COUNT,
  tileOrder: CHUNK_SNAPSHOT_TILE_ORDER
});

const createEmptyChunkLayer = (): Uint8Array => new Uint8Array(CHUNK_SNAPSHOT_TILE_COUNT);

const expectFiniteInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }

  return value;
};

const expectByte = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value < 0 || value > 0xff) {
    throw new Error(`${label} must be an integer between 0 and 255`);
  }

  return value;
};

const expectBoolean = (value: boolean, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

const expectChunkCoord = (coord: ChunkCoord, label: string): ChunkCoord => ({
  x: expectFiniteInteger(coord.x, `${label}.x`),
  y: expectFiniteInteger(coord.y, `${label}.y`)
});

const expectChunkLightDirtyColumnMask = (value: number): number => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('light.dirtyColumnMask must be a non-negative integer');
  }

  return value >>> 0;
};

const expectChunkLayer = (payload: Uint8Array, label: string): Uint8Array => {
  if (payload.length !== CHUNK_SNAPSHOT_TILE_COUNT) {
    throw new Error(`${label} must contain exactly ${CHUNK_SNAPSHOT_TILE_COUNT} tiles`);
  }

  return payload;
};

const validateChunkSnapshotMetadata = (
  metadata: ChunkSnapshotMetadata,
  label: string
): ChunkSnapshotFormatVersion => {
  if (
    metadata.version !== LEGACY_CHUNK_SNAPSHOT_FORMAT_VERSION &&
    metadata.version !== CHUNK_SNAPSHOT_FORMAT_VERSION
  ) {
    throw new Error(
      `${label}.version must be ${LEGACY_CHUNK_SNAPSHOT_FORMAT_VERSION} or ` +
        `${CHUNK_SNAPSHOT_FORMAT_VERSION}, received ${String(metadata.version)}`
    );
  }
  if (metadata.chunkSize !== CHUNK_SIZE) {
    throw new Error(`${label}.chunkSize must be ${CHUNK_SIZE}, received ${String(metadata.chunkSize)}`);
  }
  if (metadata.tileCount !== CHUNK_SNAPSHOT_TILE_COUNT) {
    throw new Error(
      `${label}.tileCount must be ${CHUNK_SNAPSHOT_TILE_COUNT}, received ${String(metadata.tileCount)}`
    );
  }
  if (metadata.tileOrder !== CHUNK_SNAPSHOT_TILE_ORDER) {
    throw new Error(`${label}.tileOrder must be "${CHUNK_SNAPSHOT_TILE_ORDER}"`);
  }

  return metadata.version;
};

export const encodeChunkDenseTilePayload = (payload: Uint8Array): number[] => {
  const layer = expectChunkLayer(payload, 'payload');
  const encoded: number[] = [];

  let runValue = layer[0] ?? 0;
  let runLength = 1;
  for (let index = 1; index < layer.length; index += 1) {
    const nextValue = layer[index] ?? 0;
    if (nextValue === runValue) {
      runLength += 1;
      continue;
    }

    encoded.push(runLength, runValue);
    runValue = nextValue;
    runLength = 1;
  }

  encoded.push(runLength, runValue);
  return encoded;
};

export const decodeChunkDenseTilePayload = (
  encoded: readonly number[],
  label = 'payload'
): Uint8Array => {
  if (encoded.length % 2 !== 0) {
    throw new Error(`${label} must contain run-length/value pairs`);
  }

  const decoded = new Uint8Array(CHUNK_SNAPSHOT_TILE_COUNT);
  let writeIndex = 0;

  for (let pairIndex = 0; pairIndex < encoded.length; pairIndex += 2) {
    const runLength = expectFiniteInteger(encoded[pairIndex] ?? Number.NaN, `${label}[${pairIndex}]`);
    if (runLength <= 0) {
      throw new Error(`${label}[${pairIndex}] must be greater than 0`);
    }

    const runValue = expectByte(encoded[pairIndex + 1] ?? Number.NaN, `${label}[${pairIndex + 1}]`);
    if (writeIndex + runLength > CHUNK_SNAPSHOT_TILE_COUNT) {
      throw new Error(`${label} expands past ${CHUNK_SNAPSHOT_TILE_COUNT} tiles`);
    }

    decoded.fill(runValue, writeIndex, writeIndex + runLength);
    writeIndex += runLength;
  }

  if (writeIndex !== CHUNK_SNAPSHOT_TILE_COUNT) {
    throw new Error(`${label} expands to ${writeIndex} tiles instead of ${CHUNK_SNAPSHOT_TILE_COUNT}`);
  }

  return decoded;
};

export const encodeChunkSparseTilePayload = (entries: ReadonlyMap<number, number>): number[] => {
  const sortedEntries = Array.from(entries.entries()).sort((left, right) => left[0] - right[0]);
  const encoded: number[] = [];
  let previousTileIndex = -1;

  for (const [tileIndex, value] of sortedEntries) {
    const normalizedTileIndex = expectFiniteInteger(tileIndex, 'tileIndex');
    if (normalizedTileIndex < 0 || normalizedTileIndex >= CHUNK_SNAPSHOT_TILE_COUNT) {
      throw new Error(
        `tileIndex must be between 0 and ${CHUNK_SNAPSHOT_TILE_COUNT - 1}, received ${String(tileIndex)}`
      );
    }
    if (normalizedTileIndex === previousTileIndex) {
      throw new Error(`duplicate tileIndex ${normalizedTileIndex}`);
    }

    encoded.push(normalizedTileIndex, expectByte(value, `tileValue:${normalizedTileIndex}`));
    previousTileIndex = normalizedTileIndex;
  }

  return encoded;
};

export const decodeChunkSparseTilePayload = (
  encoded: readonly number[],
  label = 'payload'
): Map<number, number> => {
  if (encoded.length % 2 !== 0) {
    throw new Error(`${label} must contain tile-index/value pairs`);
  }

  const decoded = new Map<number, number>();
  let previousTileIndex = -1;

  for (let pairIndex = 0; pairIndex < encoded.length; pairIndex += 2) {
    const tileIndex = expectFiniteInteger(encoded[pairIndex] ?? Number.NaN, `${label}[${pairIndex}]`);
    if (tileIndex < 0 || tileIndex >= CHUNK_SNAPSHOT_TILE_COUNT) {
      throw new Error(
        `${label}[${pairIndex}] must be between 0 and ${CHUNK_SNAPSHOT_TILE_COUNT - 1}`
      );
    }
    if (tileIndex <= previousTileIndex) {
      throw new Error(`${label} tile indices must be strictly increasing`);
    }

    decoded.set(tileIndex, expectByte(encoded[pairIndex + 1] ?? Number.NaN, `${label}[${pairIndex + 1}]`));
    previousTileIndex = tileIndex;
  }

  return decoded;
};

export const encodeResidentChunkSnapshot = (chunk: Chunk): ResidentChunkSnapshot => ({
  kind: 'resident',
  coord: expectChunkCoord(chunk.coord, 'coord'),
  metadata: {
    ...createChunkSnapshotMetadata(),
    tilePayloadEncoding: CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING,
    wallPayloadEncoding: CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING,
    liquidPayloadEncoding: CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING,
    lightPayloadEncoding: CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING
  },
  payload: {
    tiles: encodeChunkDenseTilePayload(chunk.tiles),
    wallIds: encodeChunkDenseTilePayload(chunk.wallIds),
    liquidLevels: encodeChunkDenseTilePayload(chunk.liquidLevels),
    lightLevels: encodeChunkDenseTilePayload(chunk.lightLevels)
  },
  light: {
    dirty: chunk.lightDirty,
    dirtyColumnMask: expectChunkLightDirtyColumnMask(chunk.lightDirtyColumnMask)
  }
});

export const decodeResidentChunkSnapshot = (snapshot: ResidentChunkSnapshot): Chunk => {
  expectChunkCoord(snapshot.coord, 'coord');
  const version = validateChunkSnapshotMetadata(snapshot.metadata, 'metadata');
  if (snapshot.metadata.tilePayloadEncoding !== CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING) {
    throw new Error(
      `metadata.tilePayloadEncoding must be "${CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING}"`
    );
  }
  if (
    version === CHUNK_SNAPSHOT_FORMAT_VERSION &&
    snapshot.metadata.wallPayloadEncoding !== CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING
  ) {
    throw new Error(
      `metadata.wallPayloadEncoding must be "${CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING}"`
    );
  }
  if (snapshot.metadata.liquidPayloadEncoding !== CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING) {
    throw new Error(
      `metadata.liquidPayloadEncoding must be "${CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING}"`
    );
  }
  if (snapshot.metadata.lightPayloadEncoding !== CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING) {
    throw new Error(
      `metadata.lightPayloadEncoding must be "${CHUNK_SNAPSHOT_DENSE_PAYLOAD_ENCODING}"`
    );
  }

  return {
    coord: {
      x: snapshot.coord.x,
      y: snapshot.coord.y
    },
    tiles: decodeChunkDenseTilePayload(snapshot.payload.tiles, 'payload.tiles'),
    wallIds:
      version === CHUNK_SNAPSHOT_FORMAT_VERSION
        ? decodeChunkDenseTilePayload(snapshot.payload.wallIds ?? [], 'payload.wallIds')
        : createEmptyChunkLayer(),
    liquidLevels: decodeChunkDenseTilePayload(snapshot.payload.liquidLevels, 'payload.liquidLevels'),
    lightLevels: decodeChunkDenseTilePayload(snapshot.payload.lightLevels, 'payload.lightLevels'),
    lightDirty: expectBoolean(snapshot.light.dirty, 'light.dirty'),
    lightDirtyColumnMask: expectChunkLightDirtyColumnMask(snapshot.light.dirtyColumnMask)
  };
};

export const encodeEditedChunkSnapshot = (state: EditedChunkSnapshotState): EditedChunkSnapshot => ({
  kind: 'edited',
  coord: expectChunkCoord(state.coord, 'coord'),
  metadata: {
    ...createChunkSnapshotMetadata(),
    tilePayloadEncoding: CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING,
    wallPayloadEncoding: CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING,
    liquidPayloadEncoding: CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING
  },
  payload: {
    tileOverrides: encodeChunkSparseTilePayload(state.tileOverrides),
    wallOverrides: encodeChunkSparseTilePayload(state.wallOverrides),
    liquidLevelOverrides: encodeChunkSparseTilePayload(state.liquidLevelOverrides)
  }
});

export const decodeEditedChunkSnapshot = (
  snapshot: EditedChunkSnapshot
): EditedChunkSnapshotState => {
  expectChunkCoord(snapshot.coord, 'coord');
  const version = validateChunkSnapshotMetadata(snapshot.metadata, 'metadata');
  if (snapshot.metadata.tilePayloadEncoding !== CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING) {
    throw new Error(
      `metadata.tilePayloadEncoding must be "${CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING}"`
    );
  }
  if (
    version === CHUNK_SNAPSHOT_FORMAT_VERSION &&
    snapshot.metadata.wallPayloadEncoding !== CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING
  ) {
    throw new Error(
      `metadata.wallPayloadEncoding must be "${CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING}"`
    );
  }
  if (snapshot.metadata.liquidPayloadEncoding !== CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING) {
    throw new Error(
      `metadata.liquidPayloadEncoding must be "${CHUNK_SNAPSHOT_SPARSE_PAYLOAD_ENCODING}"`
    );
  }

  return {
    coord: {
      x: snapshot.coord.x,
      y: snapshot.coord.y
    },
    tileOverrides: decodeChunkSparseTilePayload(snapshot.payload.tileOverrides, 'payload.tileOverrides'),
    wallOverrides:
      version === CHUNK_SNAPSHOT_FORMAT_VERSION
        ? decodeChunkSparseTilePayload(snapshot.payload.wallOverrides ?? [], 'payload.wallOverrides')
        : new Map<number, number>(),
    liquidLevelOverrides: decodeChunkSparseTilePayload(
      snapshot.payload.liquidLevelOverrides,
      'payload.liquidLevelOverrides'
    )
  };
};
