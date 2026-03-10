import { MAX_LIQUID_LEVEL } from '../world/constants';
import { chunkKey, toTileIndex, worldToChunkCoord, worldToLocalTile } from '../world/chunkMath';
import type { ChunkCoord } from '../world/types';
import { createChunkTileDiffMessage } from './protocol';
import type { ChunkTileDiffMessage } from './protocol';

const MAX_U8_VALUE = 0xff;

type RecordLike = Record<string, unknown>;

export interface AuthoritativeTileEdit {
  worldTileX: number;
  worldTileY: number;
  previousTileId: number;
  previousLiquidLevel: number;
  tileId: number;
  liquidLevel: number;
}

export interface CreateAuthoritativeChunkDiffMessagesOptions {
  tick: number;
  edits?: Iterable<AuthoritativeTileEdit>;
}

interface NormalizedAuthoritativeTileEdit extends AuthoritativeTileEdit {
  worldTileX: number;
  worldTileY: number;
  previousTileId: number;
  previousLiquidLevel: number;
  tileId: number;
  liquidLevel: number;
}

interface BatchedTileEditState {
  tileIndex: number;
  worldTileX: number;
  worldTileY: number;
  previousTileId: number;
  previousLiquidLevel: number;
  tileId: number;
  liquidLevel: number;
}

interface BatchedChunkTileEditState {
  chunk: ChunkCoord;
  tilesByIndex: Map<number, BatchedTileEditState>;
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

const expectLiquidLevel = (value: unknown, label: string): number => {
  const normalizedValue = expectByte(value, label);
  if (normalizedValue > MAX_LIQUID_LEVEL) {
    throw new Error(`${label} must be between 0 and ${MAX_LIQUID_LEVEL}`);
  }

  return normalizedValue;
};

const normalizeAuthoritativeTileEdit = (
  value: AuthoritativeTileEdit,
  label: string
): NormalizedAuthoritativeTileEdit => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    worldTileX: expectInteger(value.worldTileX, `${label}.worldTileX`),
    worldTileY: expectInteger(value.worldTileY, `${label}.worldTileY`),
    previousTileId: expectByte(value.previousTileId, `${label}.previousTileId`),
    previousLiquidLevel: expectLiquidLevel(
      value.previousLiquidLevel,
      `${label}.previousLiquidLevel`
    ),
    tileId: expectByte(value.tileId, `${label}.tileId`),
    liquidLevel: expectLiquidLevel(value.liquidLevel, `${label}.liquidLevel`)
  };
};

export const createAuthoritativeChunkDiffMessages = ({
  tick,
  edits
}: CreateAuthoritativeChunkDiffMessagesOptions): ChunkTileDiffMessage[] => {
  const tickValue = expectInteger(tick, 'tick');
  if (tickValue < 0) {
    throw new Error('tick must be a non-negative integer');
  }

  const chunkStatesByKey = new Map<string, BatchedChunkTileEditState>();
  let editIndex = 0;

  for (const editValue of edits ?? []) {
    const edit = normalizeAuthoritativeTileEdit(editValue, `edits[${editIndex}]`);
    const { chunkX, chunkY } = worldToChunkCoord(edit.worldTileX, edit.worldTileY);
    const { localX, localY } = worldToLocalTile(edit.worldTileX, edit.worldTileY);
    const tileIndex = toTileIndex(localX, localY);
    const normalizedChunkKey = chunkKey(chunkX, chunkY);
    const chunkState = chunkStatesByKey.get(normalizedChunkKey) ?? {
      chunk: {
        x: chunkX,
        y: chunkY
      },
      tilesByIndex: new Map<number, BatchedTileEditState>()
    };

    const existingTileState = chunkState.tilesByIndex.get(tileIndex);
    if (existingTileState) {
      if (
        existingTileState.tileId !== edit.previousTileId ||
        existingTileState.liquidLevel !== edit.previousLiquidLevel
      ) {
        throw new Error(
          `edits[${editIndex}] previous state must match the prior same-tick result at world tile (${edit.worldTileX}, ${edit.worldTileY})`
        );
      }

      existingTileState.tileId = edit.tileId;
      existingTileState.liquidLevel = edit.liquidLevel;
    } else {
      chunkState.tilesByIndex.set(tileIndex, {
        tileIndex,
        worldTileX: edit.worldTileX,
        worldTileY: edit.worldTileY,
        previousTileId: edit.previousTileId,
        previousLiquidLevel: edit.previousLiquidLevel,
        tileId: edit.tileId,
        liquidLevel: edit.liquidLevel
      });
    }

    chunkStatesByKey.set(normalizedChunkKey, chunkState);
    editIndex += 1;
  }

  return Array.from(chunkStatesByKey.values())
    .sort((left, right) => compareChunkCoords(left.chunk, right.chunk))
    .flatMap((chunkState) => {
      const tiles = Array.from(chunkState.tilesByIndex.values())
        .filter(
          (tileState) =>
            tileState.previousTileId !== tileState.tileId ||
            tileState.previousLiquidLevel !== tileState.liquidLevel
        )
        .sort((left, right) => left.tileIndex - right.tileIndex)
        .map((tileState) => ({
          tileIndex: tileState.tileIndex,
          tileId: tileState.tileId,
          liquidLevel: tileState.liquidLevel
        }));

      if (tiles.length === 0) {
        return [];
      }

      return [
        createChunkTileDiffMessage({
          tick: tickValue,
          chunk: chunkState.chunk,
          tiles
        })
      ];
    });
};
