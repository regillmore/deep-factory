import { CHUNK_SIZE } from '../world/constants';
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

export interface EntitySnapshotReplayResult {
  kind: typeof ENTITY_SNAPSHOT_MESSAGE_KIND;
  tick: number;
  entityCount: number;
  spawnedEntityIds: number[];
  updatedEntityIds: number[];
  removedEntityIds: number[];
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

export type ReplicatedNetworkStateMessage = ChunkTileDiffMessage | EntitySnapshotMessage;

export type ReplicatedNetworkStateReplayResult =
  | ChunkTileDiffReplayResult
  | EntitySnapshotReplayResult;

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
