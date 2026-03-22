import { chunkKey, toTileIndex, worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';
import type { ChunkCoord } from '../world/types';
import { createChunkWallDiffMessage } from './protocol';
import type { ChunkWallDiffMessage } from './protocol';

const MAX_U8_VALUE = 0xff;

type RecordLike = Record<string, unknown>;

export interface AuthoritativeWallEdit {
  worldTileX: number;
  worldTileY: number;
  previousWallId: number;
  wallId: number;
}

export interface CreateAuthoritativeChunkWallDiffMessagesOptions {
  tick: number;
  edits?: Iterable<AuthoritativeWallEdit>;
}

interface NormalizedAuthoritativeWallEdit extends AuthoritativeWallEdit {
  worldTileX: number;
  worldTileY: number;
  previousWallId: number;
  wallId: number;
}

interface BatchedWallEditState {
  tileIndex: number;
  worldTileX: number;
  worldTileY: number;
  previousWallId: number;
  wallId: number;
}

interface BatchedChunkWallEditState {
  chunk: ChunkCoord;
  wallsByIndex: Map<number, BatchedWallEditState>;
}

const isRecord = (value: unknown): value is RecordLike => typeof value === 'object' && value !== null;

const compareChunkCoords = (left: ChunkCoord, right: ChunkCoord): number =>
  left.y - right.y || left.x - right.x;

const expectFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const expectInteger = (value: unknown, label: string): number => {
  const normalizedValue = expectFiniteNumber(value, label);
  if (!Number.isInteger(normalizedValue)) {
    throw new Error(`${label} must be an integer`);
  }

  return normalizedValue;
};

const expectByte = (value: unknown, label: string): number => {
  const normalizedValue = expectInteger(value, label);
  if (normalizedValue < 0 || normalizedValue > MAX_U8_VALUE) {
    throw new Error(`${label} must be between 0 and ${MAX_U8_VALUE}`);
  }

  return normalizedValue;
};

const normalizeAuthoritativeWallEdit = (
  value: AuthoritativeWallEdit,
  label: string
): NormalizedAuthoritativeWallEdit => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    worldTileX: expectInteger(value.worldTileX, `${label}.worldTileX`),
    worldTileY: expectInteger(value.worldTileY, `${label}.worldTileY`),
    previousWallId: expectByte(value.previousWallId, `${label}.previousWallId`),
    wallId: expectByte(value.wallId, `${label}.wallId`)
  };
};

export const createAuthoritativeChunkWallDiffMessages = ({
  tick,
  edits
}: CreateAuthoritativeChunkWallDiffMessagesOptions): ChunkWallDiffMessage[] => {
  const tickValue = expectInteger(tick, 'tick');
  if (tickValue < 0) {
    throw new Error('tick must be a non-negative integer');
  }

  const chunkStatesByKey = new Map<string, BatchedChunkWallEditState>();
  let editIndex = 0;

  for (const editValue of edits ?? []) {
    const edit = normalizeAuthoritativeWallEdit(editValue, `edits[${editIndex}]`);
    const { chunkX, chunkY } = worldToChunkCoord(edit.worldTileX, edit.worldTileY);
    const { localX, localY } = worldToLocalTile(edit.worldTileX, edit.worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const normalizedChunkKey = chunkKey(chunkX, chunkY);
    const chunkState = chunkStatesByKey.get(normalizedChunkKey) ?? {
      chunk: {
        x: chunkX,
        y: chunkY
      },
      wallsByIndex: new Map<number, BatchedWallEditState>()
    };

    const existingWallState = chunkState.wallsByIndex.get(tileIndex);
    if (existingWallState) {
      if (existingWallState.wallId !== edit.previousWallId) {
        throw new Error(
          `edits[${editIndex}] previous state must match the prior same-tick result at world tile (${edit.worldTileX}, ${edit.worldTileY})`
        );
      }

      existingWallState.wallId = edit.wallId;
    } else {
      chunkState.wallsByIndex.set(tileIndex, {
        tileIndex,
        worldTileX: edit.worldTileX,
        worldTileY: edit.worldTileY,
        previousWallId: edit.previousWallId,
        wallId: edit.wallId
      });
    }

    chunkStatesByKey.set(normalizedChunkKey, chunkState);
    editIndex += 1;
  }

  return Array.from(chunkStatesByKey.values())
    .sort((left, right) => compareChunkCoords(left.chunk, right.chunk))
    .flatMap((chunkState) => {
      const walls = Array.from(chunkState.wallsByIndex.values())
        .filter((wallState) => wallState.previousWallId !== wallState.wallId)
        .sort((left, right) => left.tileIndex - right.tileIndex)
        .map((wallState) => ({
          tileIndex: wallState.tileIndex,
          wallId: wallState.wallId
        }));

      if (walls.length === 0) {
        return [];
      }

      return [
        createChunkWallDiffMessage({
          tick: tickValue,
          chunk: chunkState.chunk,
          walls
        })
      ];
    });
};
