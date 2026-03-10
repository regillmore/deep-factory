import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND
} from './protocol';
import type { ChunkTileDiffMessage, EntitySnapshotMessage } from './protocol';
import type { AuthoritativeReplicatedStateBatchMessage } from './replicationStaging';
import {
  filterChunkTileDiffMessageByInterestSet,
  filterEntitySnapshotMessageByInterestSet,
  type ClientInterestMessageFilterInterestSet
} from './snapshotFilter';

export const AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED = 'dropped' as const;
export const AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT = 'kept' as const;
export const AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED = 'trimmed' as const;

export type AuthoritativeReplicationFilterStatus =
  | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED
  | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT
  | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED;

export interface FilterAuthoritativeReplicatedStateBatchOptions {
  interestSet: ClientInterestMessageFilterInterestSet;
  messages?: Iterable<AuthoritativeReplicatedStateBatchMessage>;
}

export interface DroppedChunkTileDiffBatchFilterDiagnostic {
  kind: typeof CHUNK_TILE_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkTileDiffMessage['chunk'];
  filterStatus: typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED;
  receivedTileCount: number;
  forwardedTileCount: 0;
}

export interface ForwardedChunkTileDiffBatchFilterDiagnostic {
  kind: typeof CHUNK_TILE_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkTileDiffMessage['chunk'];
  filterStatus: typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT;
  receivedTileCount: number;
  forwardedTileCount: number;
}

export interface ForwardedEntitySnapshotBatchFilterDiagnostic {
  kind: typeof ENTITY_SNAPSHOT_MESSAGE_KIND;
  tick: number;
  filterStatus:
    | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT
    | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED;
  receivedEntityCount: number;
  forwardedEntityCount: number;
}

export type AuthoritativeReplicationBatchFilterDiagnostic =
  | DroppedChunkTileDiffBatchFilterDiagnostic
  | ForwardedChunkTileDiffBatchFilterDiagnostic
  | ForwardedEntitySnapshotBatchFilterDiagnostic;

export interface FilterAuthoritativeReplicatedStateBatchResult {
  forwardedMessages: AuthoritativeReplicatedStateBatchMessage[];
  diagnostics: AuthoritativeReplicationBatchFilterDiagnostic[];
}

const filterChunkTileDiffBatchMessage = (
  message: ChunkTileDiffMessage,
  interestSet: ClientInterestMessageFilterInterestSet
): {
  forwardedMessage: ChunkTileDiffMessage | null;
  diagnostic:
    | DroppedChunkTileDiffBatchFilterDiagnostic
    | ForwardedChunkTileDiffBatchFilterDiagnostic;
} => {
  const forwardedMessage = filterChunkTileDiffMessageByInterestSet(message, interestSet);

  if (forwardedMessage === null) {
    return {
      forwardedMessage: null,
      diagnostic: {
        kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
        tick: message.tick,
        chunk: {
          x: message.chunk.x,
          y: message.chunk.y
        },
        filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
        receivedTileCount: message.tiles.length,
        forwardedTileCount: 0
      }
    };
  }

  return {
    forwardedMessage,
    diagnostic: {
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: message.tick,
      chunk: {
        x: message.chunk.x,
        y: message.chunk.y
      },
      filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
      receivedTileCount: message.tiles.length,
      forwardedTileCount: forwardedMessage.tiles.length
    }
  };
};

const filterEntitySnapshotBatchMessage = (
  message: EntitySnapshotMessage,
  interestSet: ClientInterestMessageFilterInterestSet
): {
  forwardedMessage: EntitySnapshotMessage;
  diagnostic: ForwardedEntitySnapshotBatchFilterDiagnostic;
} => {
  const forwardedMessage = filterEntitySnapshotMessageByInterestSet(message, interestSet);

  return {
    forwardedMessage,
    diagnostic: {
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: message.tick,
      filterStatus:
        forwardedMessage.entities.length === message.entities.length
          ? AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT
          : AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
      receivedEntityCount: message.entities.length,
      forwardedEntityCount: forwardedMessage.entities.length
    }
  };
};

const filterAuthoritativeReplicatedStateBatchMessage = (
  message: AuthoritativeReplicatedStateBatchMessage,
  interestSet: ClientInterestMessageFilterInterestSet
): {
  forwardedMessage: AuthoritativeReplicatedStateBatchMessage | null;
  diagnostic: AuthoritativeReplicationBatchFilterDiagnostic;
} => {
  switch (message.kind) {
    case CHUNK_TILE_DIFF_MESSAGE_KIND:
      return filterChunkTileDiffBatchMessage(message, interestSet);
    case ENTITY_SNAPSHOT_MESSAGE_KIND:
      return filterEntitySnapshotBatchMessage(message, interestSet);
  }
};

export const filterAuthoritativeReplicatedStateBatchByInterestSet = ({
  interestSet,
  messages
}: FilterAuthoritativeReplicatedStateBatchOptions): FilterAuthoritativeReplicatedStateBatchResult => {
  const forwardedMessages: AuthoritativeReplicatedStateBatchMessage[] = [];
  const diagnostics: AuthoritativeReplicationBatchFilterDiagnostic[] = [];

  for (const message of messages ?? []) {
    const result = filterAuthoritativeReplicatedStateBatchMessage(message, interestSet);
    diagnostics.push(result.diagnostic);
    if (result.forwardedMessage !== null) {
      forwardedMessages.push(result.forwardedMessage);
    }
  }

  return {
    forwardedMessages,
    diagnostics
  };
};
