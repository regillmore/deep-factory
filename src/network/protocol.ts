import { CHUNK_SIZE, MAX_LIQUID_LEVEL } from '../world/constants';
import type { PlayerMovementIntent } from '../world/playerState';
import type { ChunkCoord } from '../world/types';

export const NETWORK_PROTOCOL_VERSION = 1 as const;
export const NETWORK_CHUNK_TILE_ORDER = 'row-major' as const;
export const NETWORK_CHUNK_TILE_COUNT = CHUNK_SIZE * CHUNK_SIZE;
export const PLAYER_INPUT_MESSAGE_KIND = 'player-input' as const;
export const CHUNK_TILE_DIFF_MESSAGE_KIND = 'chunk-tile-diff' as const;
export const ENTITY_SNAPSHOT_MESSAGE_KIND = 'entity-snapshot' as const;

type NetworkMessageVersion = typeof NETWORK_PROTOCOL_VERSION;
type NetworkChunkTileOrder = typeof NETWORK_CHUNK_TILE_ORDER;

const MAX_U8_VALUE = 0xff;

type RecordLike = Record<string, unknown>;

export type NetworkMessageKind =
  | typeof PLAYER_INPUT_MESSAGE_KIND
  | typeof CHUNK_TILE_DIFF_MESSAGE_KIND
  | typeof ENTITY_SNAPSHOT_MESSAGE_KIND;

export type NetworkScalar = string | number | boolean | null;

export interface NetworkVector2 {
  x: number;
  y: number;
}

interface NetworkMessageBase {
  version: NetworkMessageVersion;
  tick: number;
}

export interface SerializedPlayerInput {
  moveX: -1 | 0 | 1;
  jumpPressed: boolean;
}

export interface PlayerInputMessage extends NetworkMessageBase {
  kind: typeof PLAYER_INPUT_MESSAGE_KIND;
  input: SerializedPlayerInput;
}

export interface ChunkTileDiffEntry {
  tileIndex: number;
  tileId: number;
  liquidLevel: number;
}

export interface ChunkTileDiffMessage extends NetworkMessageBase {
  kind: typeof CHUNK_TILE_DIFF_MESSAGE_KIND;
  chunk: ChunkCoord;
  tileOrder: NetworkChunkTileOrder;
  tiles: ChunkTileDiffEntry[];
}

export interface EntitySnapshotState {
  [key: string]: NetworkScalar;
}

export interface EntitySnapshotEntry {
  id: number;
  kind: string;
  position: NetworkVector2;
  velocity: NetworkVector2;
  state: EntitySnapshotState;
}

export interface EntitySnapshotMessage extends NetworkMessageBase {
  kind: typeof ENTITY_SNAPSHOT_MESSAGE_KIND;
  entities: EntitySnapshotEntry[];
}

export type NetworkMessage = PlayerInputMessage | ChunkTileDiffMessage | EntitySnapshotMessage;

export interface CreatePlayerInputMessageOptions {
  tick: number;
  intent?: PlayerMovementIntent;
}

export interface CreateChunkTileDiffMessageOptions {
  tick: number;
  chunk: ChunkCoord;
  tiles?: Iterable<ChunkTileDiffEntry>;
}

export interface CreateEntitySnapshotMessageOptions {
  tick: number;
  entities?: Iterable<EntitySnapshotEntry>;
}

const isRecord = (value: unknown): value is RecordLike => typeof value === 'object' && value !== null;

const expectFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectNonNegativeInteger = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return normalizedValue;
};

const expectInteger = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (!Number.isInteger(normalizedValue)) {
    throw new Error(`${label} must be an integer`);
  }

  return normalizedValue;
};

const expectBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

const expectNonEmptyString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value;
};

const expectByte = (value: unknown, label: string): number => {
  const normalizedValue = expectNonNegativeInteger(value, label);
  if (normalizedValue > MAX_U8_VALUE) {
    throw new Error(`${label} must be between 0 and ${MAX_U8_VALUE}`);
  }

  return normalizedValue;
};

const normalizeMoveX = (value: number | undefined): -1 | 0 | 1 => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return -1;
  }
  if (value > 0) {
    return 1;
  }

  return 0;
};

const expectMoveX = (value: unknown, label: string): -1 | 0 | 1 => {
  const normalizedValue = expectInteger(value, label);
  if (normalizedValue !== -1 && normalizedValue !== 0 && normalizedValue !== 1) {
    throw new Error(`${label} must be -1, 0, or 1`);
  }

  return normalizedValue;
};

const normalizeChunkCoord = (value: unknown, label: string): ChunkCoord => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    x: expectInteger(value.x, `${label}.x`),
    y: expectInteger(value.y, `${label}.y`)
  };
};

const normalizeVector2 = (value: unknown, label: string): NetworkVector2 => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    x: expectFiniteNumber(value.x, `${label}.x`),
    y: expectFiniteNumber(value.y, `${label}.y`)
  };
};

const normalizeChunkTileDiffEntry = (value: unknown, label: string): ChunkTileDiffEntry => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  const tileIndex = expectNonNegativeInteger(value.tileIndex, `${label}.tileIndex`);
  if (tileIndex >= NETWORK_CHUNK_TILE_COUNT) {
    throw new Error(`${label}.tileIndex must be below ${NETWORK_CHUNK_TILE_COUNT}`);
  }

  const liquidLevel = expectByte(value.liquidLevel, `${label}.liquidLevel`);
  if (liquidLevel > MAX_LIQUID_LEVEL) {
    throw new Error(`${label}.liquidLevel must be between 0 and ${MAX_LIQUID_LEVEL}`);
  }

  return {
    tileIndex,
    tileId: expectByte(value.tileId, `${label}.tileId`),
    liquidLevel
  };
};

const normalizeScalar = (value: unknown, label: string): NetworkScalar => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return expectFiniteNumber(value, label);
  }

  throw new Error(`${label} must be a string, finite number, boolean, or null`);
};

const normalizeEntitySnapshotState = (value: unknown, label: string): EntitySnapshotState => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  const normalizedEntries = Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .map(
      (key): [string, NetworkScalar] => [key, normalizeScalar(value[key], `${label}.${key}`)]
    );

  return Object.fromEntries(normalizedEntries);
};

const normalizeEntitySnapshotEntry = (value: unknown, label: string): EntitySnapshotEntry => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    id: expectNonNegativeInteger(value.id, `${label}.id`),
    kind: expectNonEmptyString(value.kind, `${label}.kind`),
    position: normalizeVector2(value.position, `${label}.position`),
    velocity: normalizeVector2(value.velocity, `${label}.velocity`),
    state: normalizeEntitySnapshotState(value.state ?? {}, `${label}.state`)
  };
};

const normalizeStrictlyIncreasingChunkTileDiffEntries = (
  value: unknown,
  label: string
): ChunkTileDiffEntry[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  const normalizedEntries: ChunkTileDiffEntry[] = [];
  let previousTileIndex = -1;
  for (const [index, entryValue] of value.entries()) {
    const entry = normalizeChunkTileDiffEntry(entryValue, `${label}[${index}]`);
    if (entry.tileIndex <= previousTileIndex) {
      throw new Error(`${label} tile indices must be strictly increasing`);
    }
    previousTileIndex = entry.tileIndex;
    normalizedEntries.push(entry);
  }

  return normalizedEntries;
};

const normalizeSortedChunkTileDiffEntries = (
  entries: Iterable<ChunkTileDiffEntry> | undefined
): ChunkTileDiffEntry[] => {
  const normalizedEntries = Array.from(entries ?? [], (entry, index) =>
    normalizeChunkTileDiffEntry(entry, `tiles[${index}]`)
  ).sort((left, right) => left.tileIndex - right.tileIndex);

  let previousTileIndex = -1;
  for (const entry of normalizedEntries) {
    if (entry.tileIndex === previousTileIndex) {
      throw new Error(`tiles must not contain duplicate tileIndex ${entry.tileIndex}`);
    }
    previousTileIndex = entry.tileIndex;
  }

  return normalizedEntries;
};

const normalizeStrictlyIncreasingEntitySnapshotEntries = (
  value: unknown,
  label: string
): EntitySnapshotEntry[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  const normalizedEntries: EntitySnapshotEntry[] = [];
  let previousEntityId = -1;
  for (const [index, entryValue] of value.entries()) {
    const entry = normalizeEntitySnapshotEntry(entryValue, `${label}[${index}]`);
    if (entry.id <= previousEntityId) {
      throw new Error(`${label} entity ids must be strictly increasing`);
    }
    previousEntityId = entry.id;
    normalizedEntries.push(entry);
  }

  return normalizedEntries;
};

const normalizeSortedEntitySnapshotEntries = (
  entities: Iterable<EntitySnapshotEntry> | undefined
): EntitySnapshotEntry[] => {
  const normalizedEntries = Array.from(entities ?? [], (entity, index) =>
    normalizeEntitySnapshotEntry(entity, `entities[${index}]`)
  ).sort((left, right) => left.id - right.id);

  let previousEntityId = -1;
  for (const entry of normalizedEntries) {
    if (entry.id === previousEntityId) {
      throw new Error(`entities must not contain duplicate id ${entry.id}`);
    }
    previousEntityId = entry.id;
  }

  return normalizedEntries;
};

export const createPlayerInputMessage = ({
  tick,
  intent = {}
}: CreatePlayerInputMessageOptions): PlayerInputMessage => ({
  kind: PLAYER_INPUT_MESSAGE_KIND,
  version: NETWORK_PROTOCOL_VERSION,
  tick: expectNonNegativeInteger(tick, 'tick'),
  input: {
    moveX: normalizeMoveX(intent.moveX),
    jumpPressed: intent.jumpPressed === true
  }
});

export const createChunkTileDiffMessage = ({
  tick,
  chunk,
  tiles
}: CreateChunkTileDiffMessageOptions): ChunkTileDiffMessage => ({
  kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
  version: NETWORK_PROTOCOL_VERSION,
  tick: expectNonNegativeInteger(tick, 'tick'),
  chunk: normalizeChunkCoord(chunk, 'chunk'),
  tileOrder: NETWORK_CHUNK_TILE_ORDER,
  tiles: normalizeSortedChunkTileDiffEntries(tiles)
});

export const createEntitySnapshotMessage = ({
  tick,
  entities
}: CreateEntitySnapshotMessageOptions): EntitySnapshotMessage => ({
  kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
  version: NETWORK_PROTOCOL_VERSION,
  tick: expectNonNegativeInteger(tick, 'tick'),
  entities: normalizeSortedEntitySnapshotEntries(entities)
});

export const decodePlayerInputMessage = (value: unknown): PlayerInputMessage => {
  if (!isRecord(value)) {
    throw new Error('player input message must be an object');
  }
  if (value.kind !== PLAYER_INPUT_MESSAGE_KIND) {
    throw new Error(`player input message kind must be "${PLAYER_INPUT_MESSAGE_KIND}"`);
  }
  if (value.version !== NETWORK_PROTOCOL_VERSION) {
    throw new Error(`player input message version must be ${NETWORK_PROTOCOL_VERSION}`);
  }
  if (!isRecord(value.input)) {
    throw new Error('player input message input must be an object');
  }

  return {
    kind: PLAYER_INPUT_MESSAGE_KIND,
    version: NETWORK_PROTOCOL_VERSION,
    tick: expectNonNegativeInteger(value.tick, 'tick'),
    input: {
      moveX: expectMoveX(value.input.moveX, 'input.moveX'),
      jumpPressed: expectBoolean(value.input.jumpPressed, 'input.jumpPressed')
    }
  };
};

export const decodeChunkTileDiffMessage = (value: unknown): ChunkTileDiffMessage => {
  if (!isRecord(value)) {
    throw new Error('chunk tile diff message must be an object');
  }
  if (value.kind !== CHUNK_TILE_DIFF_MESSAGE_KIND) {
    throw new Error(`chunk tile diff message kind must be "${CHUNK_TILE_DIFF_MESSAGE_KIND}"`);
  }
  if (value.version !== NETWORK_PROTOCOL_VERSION) {
    throw new Error(`chunk tile diff message version must be ${NETWORK_PROTOCOL_VERSION}`);
  }
  if (value.tileOrder !== NETWORK_CHUNK_TILE_ORDER) {
    throw new Error(`chunk tile diff message tileOrder must be "${NETWORK_CHUNK_TILE_ORDER}"`);
  }

  return {
    kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
    version: NETWORK_PROTOCOL_VERSION,
    tick: expectNonNegativeInteger(value.tick, 'tick'),
    chunk: normalizeChunkCoord(value.chunk, 'chunk'),
    tileOrder: NETWORK_CHUNK_TILE_ORDER,
    tiles: normalizeStrictlyIncreasingChunkTileDiffEntries(value.tiles, 'tiles')
  };
};

export const decodeEntitySnapshotMessage = (value: unknown): EntitySnapshotMessage => {
  if (!isRecord(value)) {
    throw new Error('entity snapshot message must be an object');
  }
  if (value.kind !== ENTITY_SNAPSHOT_MESSAGE_KIND) {
    throw new Error(`entity snapshot message kind must be "${ENTITY_SNAPSHOT_MESSAGE_KIND}"`);
  }
  if (value.version !== NETWORK_PROTOCOL_VERSION) {
    throw new Error(`entity snapshot message version must be ${NETWORK_PROTOCOL_VERSION}`);
  }

  return {
    kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
    version: NETWORK_PROTOCOL_VERSION,
    tick: expectNonNegativeInteger(value.tick, 'tick'),
    entities: normalizeStrictlyIncreasingEntitySnapshotEntries(value.entities, 'entities')
  };
};

export const decodeNetworkMessage = (value: unknown): NetworkMessage => {
  if (!isRecord(value)) {
    throw new Error('network message must be an object');
  }

  switch (value.kind) {
    case PLAYER_INPUT_MESSAGE_KIND:
      return decodePlayerInputMessage(value);
    case CHUNK_TILE_DIFF_MESSAGE_KIND:
      return decodeChunkTileDiffMessage(value);
    case ENTITY_SNAPSHOT_MESSAGE_KIND:
      return decodeEntitySnapshotMessage(value);
    default:
      throw new Error(`unsupported network message kind ${String(value.kind)}`);
  }
};
