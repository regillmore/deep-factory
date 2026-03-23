import { CHUNK_SIZE } from '../world/constants';
import { chunkKey } from '../world/chunkMath';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  CHUNK_WALL_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  PLAYER_INPUT_MESSAGE_KIND
} from './protocol';
import type {
  ChunkTileDiffMessage,
  ChunkWallDiffMessage,
  EntitySnapshotEntry,
  EntitySnapshotMessage,
  NetworkMessage
} from './protocol';

export interface ChunkTileStateReplayTarget {
  setTileState(worldTileX: number, worldTileY: number, tileId: number, liquidLevel: number): boolean;
}

export interface ChunkWallStateReplayTarget {
  setWall(worldTileX: number, worldTileY: number, wallId: number): boolean;
}

export type ChunkWorldStateReplayTarget = ChunkTileStateReplayTarget & ChunkWallStateReplayTarget;

export const AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK = 'duplicate-tick' as const;
export const AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK = 'stale-tick' as const;

export type AuthoritativeReplaySkipReason =
  | typeof AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK
  | typeof AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK;

type ChunkReplayMessageKind =
  | typeof CHUNK_TILE_DIFF_MESSAGE_KIND
  | typeof CHUNK_WALL_DIFF_MESSAGE_KIND;

interface ChunkReplayGuardState {
  tick: number;
  appliedKinds: number;
}

const CHUNK_REPLAY_KIND_BIT_TILE = 1 << 0;
const CHUNK_REPLAY_KIND_BIT_WALL = 1 << 1;

export interface EntitySnapshotReplayResult {
  kind: typeof ENTITY_SNAPSHOT_MESSAGE_KIND;
  tick: number;
  entityCount: number;
  spawnedEntityIds: number[];
  updatedEntityIds: number[];
  removedEntityIds: number[];
}

export interface SkippedEntitySnapshotReplayResult {
  kind: typeof ENTITY_SNAPSHOT_MESSAGE_KIND;
  tick: number;
  skipped: true;
  reason: AuthoritativeReplaySkipReason;
  lastAppliedTick: number;
  receivedEntityCount: number;
}

export interface EntitySnapshotReplayTarget {
  applyEntitySnapshotMessage(message: EntitySnapshotMessage): EntitySnapshotReplayResult;
}

export interface ReplicatedNetworkStateReplayTarget {
  world: ChunkWorldStateReplayTarget;
  entities: EntitySnapshotReplayTarget;
}

export interface ChunkTileDiffReplayResult {
  kind: typeof CHUNK_TILE_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkTileDiffMessage['chunk'];
  appliedTileCount: number;
  changedTileCount: number;
}

export interface SkippedChunkTileDiffReplayResult {
  kind: typeof CHUNK_TILE_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkTileDiffMessage['chunk'];
  skipped: true;
  reason: AuthoritativeReplaySkipReason;
  lastAppliedTick: number;
  receivedTileCount: number;
}

export interface ChunkWallDiffReplayResult {
  kind: typeof CHUNK_WALL_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkWallDiffMessage['chunk'];
  appliedWallCount: number;
  changedWallCount: number;
}

export interface SkippedChunkWallDiffReplayResult {
  kind: typeof CHUNK_WALL_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkWallDiffMessage['chunk'];
  skipped: true;
  reason: AuthoritativeReplaySkipReason;
  lastAppliedTick: number;
  receivedWallCount: number;
}

export type ReplicatedNetworkStateMessage =
  | ChunkTileDiffMessage
  | ChunkWallDiffMessage
  | EntitySnapshotMessage;

export type ReplicatedNetworkStateReplayResult =
  | ChunkTileDiffReplayResult
  | ChunkWallDiffReplayResult
  | EntitySnapshotReplayResult;

export type AuthoritativeEntitySnapshotReplayResult =
  | EntitySnapshotReplayResult
  | SkippedEntitySnapshotReplayResult;

export type AuthoritativeChunkTileDiffReplayResult =
  | ChunkTileDiffReplayResult
  | SkippedChunkTileDiffReplayResult;

export type AuthoritativeChunkWallDiffReplayResult =
  | ChunkWallDiffReplayResult
  | SkippedChunkWallDiffReplayResult;

export type AuthoritativeReplicatedNetworkStateReplayResult =
  | AuthoritativeChunkTileDiffReplayResult
  | AuthoritativeChunkWallDiffReplayResult
  | AuthoritativeEntitySnapshotReplayResult;

export interface AuthoritativeReplicatedNetworkStateReplayTarget {
  world: ChunkWorldStateReplayTarget;
  entities: ReplicatedEntitySnapshotStore;
}

export type AuthoritativeReplicatedStateBaselineReplacement<T> = (
  target: AuthoritativeReplicatedNetworkStateReplayTarget
) => T;

const resolveAuthoritativeReplaySkipReason = (
  lastAppliedTick: number | null,
  nextTick: number
): AuthoritativeReplaySkipReason | null => {
  if (lastAppliedTick === null || nextTick > lastAppliedTick) {
    return null;
  }
  if (nextTick === lastAppliedTick) {
    return AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK;
  }

  return AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK;
};

const resolveChunkReplayKindBit = (kind: ChunkReplayMessageKind): number => {
  switch (kind) {
    case CHUNK_TILE_DIFF_MESSAGE_KIND:
      return CHUNK_REPLAY_KIND_BIT_TILE;
    case CHUNK_WALL_DIFF_MESSAGE_KIND:
      return CHUNK_REPLAY_KIND_BIT_WALL;
  }
};

const resolveAuthoritativeChunkReplaySkipReason = (
  lastAppliedState: ChunkReplayGuardState | null,
  kind: ChunkReplayMessageKind,
  nextTick: number
): AuthoritativeReplaySkipReason | null => {
  if (lastAppliedState === null || nextTick > lastAppliedState.tick) {
    return null;
  }
  if (nextTick < lastAppliedState.tick) {
    return AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK;
  }

  return (lastAppliedState.appliedKinds & resolveChunkReplayKindBit(kind)) !== 0
    ? AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK
    : null;
};

const createUpdatedChunkReplayGuardState = (
  previousState: ChunkReplayGuardState | null,
  kind: ChunkReplayMessageKind,
  tick: number
): ChunkReplayGuardState => {
  const appliedKinds = resolveChunkReplayKindBit(kind);
  if (previousState === null || tick > previousState.tick) {
    return {
      tick,
      appliedKinds
    };
  }

  return {
    tick,
    appliedKinds: previousState.appliedKinds | appliedKinds
  };
};

const cloneEntitySnapshotEntry = (entry: EntitySnapshotEntry): EntitySnapshotEntry => ({
  id: entry.id,
  kind: entry.kind,
  position: {
    x: entry.position.x,
    y: entry.position.y
  },
  velocity: {
    x: entry.velocity.x,
    y: entry.velocity.y
  },
  state: {
    ...entry.state
  }
});

export class ReplicatedEntitySnapshotStore implements EntitySnapshotReplayTarget {
  private entities = new Map<number, EntitySnapshotEntry>();
  private lastAppliedTick: number | null = null;

  resetReplayGuard(): void {
    this.lastAppliedTick = null;
  }

  getLastAppliedTick(): number | null {
    return this.lastAppliedTick;
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getEntity(entityId: number): EntitySnapshotEntry | null {
    const entity = this.entities.get(entityId);
    return entity ? cloneEntitySnapshotEntry(entity) : null;
  }

  getEntities(): EntitySnapshotEntry[] {
    return Array.from(this.entities.values(), (entity) => cloneEntitySnapshotEntry(entity));
  }

  applyEntitySnapshotMessage(message: EntitySnapshotMessage): EntitySnapshotReplayResult {
    const nextEntities = new Map<number, EntitySnapshotEntry>();
    const spawnedEntityIds: number[] = [];
    const updatedEntityIds: number[] = [];

    for (const entry of message.entities) {
      nextEntities.set(entry.id, cloneEntitySnapshotEntry(entry));
      if (this.entities.has(entry.id)) {
        updatedEntityIds.push(entry.id);
      } else {
        spawnedEntityIds.push(entry.id);
      }
    }

    const removedEntityIds: number[] = [];
    for (const entityId of this.entities.keys()) {
      if (!nextEntities.has(entityId)) {
        removedEntityIds.push(entityId);
      }
    }

    this.entities = nextEntities;
    this.lastAppliedTick = message.tick;

    return {
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: message.tick,
      entityCount: message.entities.length,
      spawnedEntityIds,
      updatedEntityIds,
      removedEntityIds
    };
  }

  replayEntitySnapshotMessage(message: EntitySnapshotMessage): AuthoritativeEntitySnapshotReplayResult {
    const skipReason = resolveAuthoritativeReplaySkipReason(this.lastAppliedTick, message.tick);
    if (skipReason !== null) {
      const lastAppliedTick = this.lastAppliedTick;
      return {
        kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
        tick: message.tick,
        skipped: true,
        reason: skipReason,
        lastAppliedTick: lastAppliedTick as number,
        receivedEntityCount: message.entities.length
      };
    }

    return this.applyEntitySnapshotMessage(message);
  }
}

export const isReplicatedNetworkStateMessage = (
  message: NetworkMessage
): message is ReplicatedNetworkStateMessage =>
  message.kind === CHUNK_TILE_DIFF_MESSAGE_KIND ||
  message.kind === CHUNK_WALL_DIFF_MESSAGE_KIND ||
  message.kind === ENTITY_SNAPSHOT_MESSAGE_KIND;

export const applyChunkTileDiffMessage = (
  target: ChunkTileStateReplayTarget,
  message: ChunkTileDiffMessage
): ChunkTileDiffReplayResult => {
  let changedTileCount = 0;
  for (const tile of message.tiles) {
    const localX = tile.tileIndex % CHUNK_SIZE;
    const localY = Math.floor(tile.tileIndex / CHUNK_SIZE);
    const worldTileX = message.chunk.x * CHUNK_SIZE + localX;
    const worldTileY = message.chunk.y * CHUNK_SIZE + localY;
    if (target.setTileState(worldTileX, worldTileY, tile.tileId, tile.liquidLevel)) {
      changedTileCount += 1;
    }
  }

  return {
    kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
    tick: message.tick,
    chunk: {
      x: message.chunk.x,
      y: message.chunk.y
    },
    appliedTileCount: message.tiles.length,
    changedTileCount
  };
};

export const applyChunkWallDiffMessage = (
  target: ChunkWallStateReplayTarget,
  message: ChunkWallDiffMessage
): ChunkWallDiffReplayResult => {
  let changedWallCount = 0;
  for (const wall of message.walls) {
    const localX = wall.tileIndex % CHUNK_SIZE;
    const localY = Math.floor(wall.tileIndex / CHUNK_SIZE);
    const worldTileX = message.chunk.x * CHUNK_SIZE + localX;
    const worldTileY = message.chunk.y * CHUNK_SIZE + localY;
    if (target.setWall(worldTileX, worldTileY, wall.wallId)) {
      changedWallCount += 1;
    }
  }

  return {
    kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
    tick: message.tick,
    chunk: {
      x: message.chunk.x,
      y: message.chunk.y
    },
    appliedWallCount: message.walls.length,
    changedWallCount
  };
};

export const applyReplicatedNetworkStateMessage = (
  target: ReplicatedNetworkStateReplayTarget,
  message: ReplicatedNetworkStateMessage | NetworkMessage
): ReplicatedNetworkStateReplayResult => {
  switch (message.kind) {
    case CHUNK_TILE_DIFF_MESSAGE_KIND:
      return applyChunkTileDiffMessage(target.world, message);
    case CHUNK_WALL_DIFF_MESSAGE_KIND:
      return applyChunkWallDiffMessage(target.world, message);
    case ENTITY_SNAPSHOT_MESSAGE_KIND:
      return target.entities.applyEntitySnapshotMessage(message);
    case PLAYER_INPUT_MESSAGE_KIND:
      throw new Error('player-input messages do not replay authoritative world or entity state');
  }
};

export class AuthoritativeReplicatedNetworkStateReplayer {
  private lastAppliedChunkReplayStateByKey = new Map<string, ChunkReplayGuardState>();

  constructor(private readonly target: AuthoritativeReplicatedNetworkStateReplayTarget) {}

  replaceAuthoritativeBaseline<T>(
    replaceBaseline: AuthoritativeReplicatedStateBaselineReplacement<T>
  ): T {
    const result = replaceBaseline(this.target);
    this.resetReplayGuards();
    return result;
  }

  resetReplayGuards(): void {
    this.lastAppliedChunkReplayStateByKey.clear();
    this.target.entities.resetReplayGuard();
  }

  getLastAppliedChunkTick(chunk: ChunkTileDiffMessage['chunk']): number | null {
    return this.getLastAppliedChunkReplayState(chunk)?.tick ?? null;
  }

  getLastAppliedEntityTick(): number | null {
    return this.target.entities.getLastAppliedTick();
  }

  applyMessage(
    message: ReplicatedNetworkStateMessage | NetworkMessage
  ): AuthoritativeReplicatedNetworkStateReplayResult {
    switch (message.kind) {
      case CHUNK_TILE_DIFF_MESSAGE_KIND:
        return this.applyChunkTileDiffMessage(message);
      case CHUNK_WALL_DIFF_MESSAGE_KIND:
        return this.applyChunkWallDiffMessage(message);
      case ENTITY_SNAPSHOT_MESSAGE_KIND:
        return this.target.entities.replayEntitySnapshotMessage(message);
      case PLAYER_INPUT_MESSAGE_KIND:
        throw new Error('player-input messages do not replay authoritative world or entity state');
    }
  }

  private getLastAppliedChunkReplayState(
    chunk: ChunkTileDiffMessage['chunk'] | ChunkWallDiffMessage['chunk']
  ): ChunkReplayGuardState | null {
    return this.lastAppliedChunkReplayStateByKey.get(chunkKey(chunk.x, chunk.y)) ?? null;
  }

  private markChunkReplayApplied(
    chunk: ChunkTileDiffMessage['chunk'] | ChunkWallDiffMessage['chunk'],
    kind: ChunkReplayMessageKind,
    tick: number
  ): void {
    const normalizedChunkKey = chunkKey(chunk.x, chunk.y);
    const previousState = this.lastAppliedChunkReplayStateByKey.get(normalizedChunkKey) ?? null;
    this.lastAppliedChunkReplayStateByKey.set(
      normalizedChunkKey,
      createUpdatedChunkReplayGuardState(previousState, kind, tick)
    );
  }

  private applyChunkTileDiffMessage(
    message: ChunkTileDiffMessage
  ): AuthoritativeChunkTileDiffReplayResult {
    const lastAppliedState = this.getLastAppliedChunkReplayState(message.chunk);
    const skipReason = resolveAuthoritativeChunkReplaySkipReason(
      lastAppliedState,
      CHUNK_TILE_DIFF_MESSAGE_KIND,
      message.tick
    );
    if (skipReason !== null) {
      return {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        tick: message.tick,
        chunk: {
          x: message.chunk.x,
          y: message.chunk.y
        },
        skipped: true,
        reason: skipReason,
        lastAppliedTick: lastAppliedState!.tick,
        receivedTileCount: message.tiles.length
      };
    }

    const result = applyChunkTileDiffMessage(this.target.world, message);
    this.markChunkReplayApplied(message.chunk, CHUNK_TILE_DIFF_MESSAGE_KIND, message.tick);
    return result;
  }

  private applyChunkWallDiffMessage(
    message: ChunkWallDiffMessage
  ): AuthoritativeChunkWallDiffReplayResult {
    const lastAppliedState = this.getLastAppliedChunkReplayState(message.chunk);
    const skipReason = resolveAuthoritativeChunkReplaySkipReason(
      lastAppliedState,
      CHUNK_WALL_DIFF_MESSAGE_KIND,
      message.tick
    );
    if (skipReason !== null) {
      return {
        kind: CHUNK_WALL_DIFF_MESSAGE_KIND,
        tick: message.tick,
        chunk: {
          x: message.chunk.x,
          y: message.chunk.y
        },
        skipped: true,
        reason: skipReason,
        lastAppliedTick: lastAppliedState!.tick,
        receivedWallCount: message.walls.length
      };
    }

    const result = applyChunkWallDiffMessage(this.target.world, message);
    this.markChunkReplayApplied(message.chunk, CHUNK_WALL_DIFF_MESSAGE_KIND, message.tick);
    return result;
  }
}
