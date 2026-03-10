import { CHUNK_SIZE } from '../world/constants';
import { chunkKey } from '../world/chunkMath';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  PLAYER_INPUT_MESSAGE_KIND
} from './protocol';
import type {
  ChunkTileDiffMessage,
  EntitySnapshotEntry,
  EntitySnapshotMessage,
  NetworkMessage
} from './protocol';

export interface ChunkTileStateReplayTarget {
  setTileState(worldTileX: number, worldTileY: number, tileId: number, liquidLevel: number): boolean;
}

export const AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK = 'duplicate-tick' as const;
export const AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK = 'stale-tick' as const;

export type AuthoritativeReplaySkipReason =
  | typeof AUTHORITATIVE_REPLAY_SKIP_REASON_DUPLICATE_TICK
  | typeof AUTHORITATIVE_REPLAY_SKIP_REASON_STALE_TICK;

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
  world: ChunkTileStateReplayTarget;
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

export type ReplicatedNetworkStateMessage = ChunkTileDiffMessage | EntitySnapshotMessage;

export type ReplicatedNetworkStateReplayResult =
  | ChunkTileDiffReplayResult
  | EntitySnapshotReplayResult;

export type AuthoritativeEntitySnapshotReplayResult =
  | EntitySnapshotReplayResult
  | SkippedEntitySnapshotReplayResult;

export type AuthoritativeChunkTileDiffReplayResult =
  | ChunkTileDiffReplayResult
  | SkippedChunkTileDiffReplayResult;

export type AuthoritativeReplicatedNetworkStateReplayResult =
  | AuthoritativeChunkTileDiffReplayResult
  | AuthoritativeEntitySnapshotReplayResult;

export interface AuthoritativeReplicatedNetworkStateReplayTarget {
  world: ChunkTileStateReplayTarget;
  entities: ReplicatedEntitySnapshotStore;
}

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
): message is ReplicatedNetworkStateMessage => message.kind !== PLAYER_INPUT_MESSAGE_KIND;

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

export const applyReplicatedNetworkStateMessage = (
  target: ReplicatedNetworkStateReplayTarget,
  message: ReplicatedNetworkStateMessage | NetworkMessage
): ReplicatedNetworkStateReplayResult => {
  switch (message.kind) {
    case CHUNK_TILE_DIFF_MESSAGE_KIND:
      return applyChunkTileDiffMessage(target.world, message);
    case ENTITY_SNAPSHOT_MESSAGE_KIND:
      return target.entities.applyEntitySnapshotMessage(message);
    case PLAYER_INPUT_MESSAGE_KIND:
      throw new Error('player-input messages do not replay authoritative world or entity state');
  }
};

export class AuthoritativeReplicatedNetworkStateReplayer {
  private lastAppliedChunkTickByKey = new Map<string, number>();

  constructor(private readonly target: AuthoritativeReplicatedNetworkStateReplayTarget) {}

  resetReplayGuards(): void {
    this.lastAppliedChunkTickByKey.clear();
    this.target.entities.resetReplayGuard();
  }

  getLastAppliedChunkTick(chunk: ChunkTileDiffMessage['chunk']): number | null {
    return this.lastAppliedChunkTickByKey.get(chunkKey(chunk.x, chunk.y)) ?? null;
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
      case ENTITY_SNAPSHOT_MESSAGE_KIND:
        return this.target.entities.replayEntitySnapshotMessage(message);
      case PLAYER_INPUT_MESSAGE_KIND:
        throw new Error('player-input messages do not replay authoritative world or entity state');
    }
  }

  private applyChunkTileDiffMessage(
    message: ChunkTileDiffMessage
  ): AuthoritativeChunkTileDiffReplayResult {
    const normalizedChunkKey = chunkKey(message.chunk.x, message.chunk.y);
    const lastAppliedTick = this.lastAppliedChunkTickByKey.get(normalizedChunkKey) ?? null;
    const skipReason = resolveAuthoritativeReplaySkipReason(lastAppliedTick, message.tick);
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
        lastAppliedTick: lastAppliedTick as number,
        receivedTileCount: message.tiles.length
      };
    }

    const result = applyChunkTileDiffMessage(this.target.world, message);
    this.lastAppliedChunkTickByKey.set(normalizedChunkKey, message.tick);
    return result;
  }
}
