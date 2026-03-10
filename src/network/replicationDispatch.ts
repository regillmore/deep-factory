import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND
} from './protocol';
import type { ChunkTileDiffMessage, EntitySnapshotMessage } from './protocol';
import {
  filterChunkTileDiffMessageByInterestSet,
  filterEntitySnapshotMessageByInterestSet,
  type ClientInterestMessageFilterInterestSet,
  type InterestScopedReplicatedNetworkStateMessage
} from './snapshotFilter';
import { AuthoritativeReplicatedNetworkStateReplayer } from './stateReplay';
import type {
  AuthoritativeChunkTileDiffReplayResult,
  AuthoritativeEntitySnapshotReplayResult
} from './stateReplay';

export const AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED = 'dropped' as const;
export const AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT = 'kept' as const;
export const AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED = 'trimmed' as const;
export const AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED = 'applied' as const;
export const AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED = 'skipped' as const;

export type AuthoritativeReplicationDispatchFilterStatus =
  | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED
  | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT
  | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED;

export type AuthoritativeReplicationDispatchReplayStatus =
  | typeof AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED
  | typeof AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED;

export interface DispatchAuthoritativeReplicatedNetworkStateMessagesOptions {
  replayer: AuthoritativeReplicatedNetworkStateReplayer;
  interestSet: ClientInterestMessageFilterInterestSet;
  messages?: Iterable<InterestScopedReplicatedNetworkStateMessage>;
}

export interface DroppedChunkTileDiffDispatchResult {
  kind: typeof CHUNK_TILE_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkTileDiffMessage['chunk'];
  filterStatus: typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED;
  replayStatus: null;
  receivedTileCount: number;
  forwardedTileCount: 0;
}

export interface ReplayedChunkTileDiffDispatchResult {
  kind: typeof CHUNK_TILE_DIFF_MESSAGE_KIND;
  tick: number;
  chunk: ChunkTileDiffMessage['chunk'];
  filterStatus: typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT;
  replayStatus: AuthoritativeReplicationDispatchReplayStatus;
  receivedTileCount: number;
  forwardedTileCount: number;
  replayResult: AuthoritativeChunkTileDiffReplayResult;
}

export interface DroppedEntitySnapshotDispatchResult {
  kind: typeof ENTITY_SNAPSHOT_MESSAGE_KIND;
  tick: number;
  filterStatus: typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED;
  replayStatus: null;
  receivedEntityCount: number;
  forwardedEntityCount: 0;
}

export interface ReplayedEntitySnapshotDispatchResult {
  kind: typeof ENTITY_SNAPSHOT_MESSAGE_KIND;
  tick: number;
  filterStatus:
    | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT
    | typeof AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED;
  replayStatus: AuthoritativeReplicationDispatchReplayStatus;
  receivedEntityCount: number;
  forwardedEntityCount: number;
  replayResult: AuthoritativeEntitySnapshotReplayResult;
}

export type AuthoritativeReplicationDispatchResult =
  | DroppedChunkTileDiffDispatchResult
  | ReplayedChunkTileDiffDispatchResult
  | DroppedEntitySnapshotDispatchResult
  | ReplayedEntitySnapshotDispatchResult;

const resolveReplayStatus = (
  result: AuthoritativeChunkTileDiffReplayResult | AuthoritativeEntitySnapshotReplayResult
): AuthoritativeReplicationDispatchReplayStatus =>
  'skipped' in result && result.skipped === true
    ? AUTHORITATIVE_REPLICATION_REPLAY_STATUS_SKIPPED
    : AUTHORITATIVE_REPLICATION_REPLAY_STATUS_APPLIED;

const dispatchChunkTileDiffMessage = (
  replayer: AuthoritativeReplicatedNetworkStateReplayer,
  interestSet: ClientInterestMessageFilterInterestSet,
  message: ChunkTileDiffMessage
): DroppedChunkTileDiffDispatchResult | ReplayedChunkTileDiffDispatchResult => {
  const filteredMessage = filterChunkTileDiffMessageByInterestSet(message, interestSet);
  if (filteredMessage === null) {
    return {
      kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
      tick: message.tick,
      chunk: {
        x: message.chunk.x,
        y: message.chunk.y
      },
      filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
      replayStatus: null,
      receivedTileCount: message.tiles.length,
      forwardedTileCount: 0
    };
  }

  const replayResult = replayer.applyMessage(
    filteredMessage
  ) as AuthoritativeChunkTileDiffReplayResult;

  return {
    kind: CHUNK_TILE_DIFF_MESSAGE_KIND,
    tick: message.tick,
    chunk: {
      x: message.chunk.x,
      y: message.chunk.y
    },
    filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT,
    replayStatus: resolveReplayStatus(replayResult),
    receivedTileCount: message.tiles.length,
    forwardedTileCount: filteredMessage.tiles.length,
    replayResult
  };
};

const dispatchEntitySnapshotMessage = (
  replayer: AuthoritativeReplicatedNetworkStateReplayer,
  interestSet: ClientInterestMessageFilterInterestSet,
  message: EntitySnapshotMessage
): DroppedEntitySnapshotDispatchResult | ReplayedEntitySnapshotDispatchResult => {
  const filteredMessage = filterEntitySnapshotMessageByInterestSet(message, interestSet);
  if (filteredMessage === null) {
    return {
      kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
      tick: message.tick,
      filterStatus: AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
      replayStatus: null,
      receivedEntityCount: message.entities.length,
      forwardedEntityCount: 0
    };
  }

  const replayResult = replayer.applyMessage(
    filteredMessage
  ) as AuthoritativeEntitySnapshotReplayResult;

  return {
    kind: ENTITY_SNAPSHOT_MESSAGE_KIND,
    tick: message.tick,
    filterStatus:
      filteredMessage.entities.length === message.entities.length
        ? AUTHORITATIVE_REPLICATION_FILTER_STATUS_KEPT
        : AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
    replayStatus: resolveReplayStatus(replayResult),
    receivedEntityCount: message.entities.length,
    forwardedEntityCount: filteredMessage.entities.length,
    replayResult
  };
};

const dispatchAuthoritativeReplicatedNetworkStateMessage = (
  replayer: AuthoritativeReplicatedNetworkStateReplayer,
  interestSet: ClientInterestMessageFilterInterestSet,
  message: InterestScopedReplicatedNetworkStateMessage
): AuthoritativeReplicationDispatchResult => {
  switch (message.kind) {
    case CHUNK_TILE_DIFF_MESSAGE_KIND:
      return dispatchChunkTileDiffMessage(replayer, interestSet, message);
    case ENTITY_SNAPSHOT_MESSAGE_KIND:
      return dispatchEntitySnapshotMessage(replayer, interestSet, message);
  }
};

export const dispatchAuthoritativeReplicatedNetworkStateMessages = ({
  replayer,
  interestSet,
  messages
}: DispatchAuthoritativeReplicatedNetworkStateMessagesOptions): AuthoritativeReplicationDispatchResult[] =>
  Array.from(messages ?? [], (message) =>
    dispatchAuthoritativeReplicatedNetworkStateMessage(replayer, interestSet, message)
  );
