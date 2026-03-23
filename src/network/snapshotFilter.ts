import { chunkKey } from '../world/chunkMath';
import type { ClientInterestSet } from './interestSet';
import {
  CHUNK_TILE_DIFF_MESSAGE_KIND,
  ENTITY_SNAPSHOT_MESSAGE_KIND,
  createChunkTileDiffMessage,
  createChunkWallDiffMessage,
  createEntitySnapshotMessage
} from './protocol';
import type { ChunkTileDiffMessage, ChunkWallDiffMessage, EntitySnapshotMessage } from './protocol';

export type ClientInterestMessageFilterInterestSet = Pick<ClientInterestSet, 'chunks' | 'entityIds'>;

export type InterestScopedReplicatedNetworkStateMessage =
  | ChunkTileDiffMessage
  | EntitySnapshotMessage;

interface ClientInterestMembershipSets {
  relevantChunkKeys: Set<string>;
  relevantEntityIds: Set<number>;
}

const createClientInterestMembershipSets = (
  interestSet: ClientInterestMessageFilterInterestSet
): ClientInterestMembershipSets => ({
  relevantChunkKeys: new Set(
    interestSet.chunks.map((chunkCoord) => chunkKey(chunkCoord.x, chunkCoord.y))
  ),
  relevantEntityIds: new Set(interestSet.entityIds)
});

const filterChunkTileDiffMessageWithMembership = (
  message: ChunkTileDiffMessage,
  membership: ClientInterestMembershipSets
): ChunkTileDiffMessage | null => {
  if (!membership.relevantChunkKeys.has(chunkKey(message.chunk.x, message.chunk.y))) {
    return null;
  }

  return createChunkTileDiffMessage({
    tick: message.tick,
    chunk: message.chunk,
    tiles: message.tiles
  });
};

const filterChunkWallDiffMessageWithMembership = (
  message: ChunkWallDiffMessage,
  membership: ClientInterestMembershipSets
): ChunkWallDiffMessage | null => {
  if (!membership.relevantChunkKeys.has(chunkKey(message.chunk.x, message.chunk.y))) {
    return null;
  }

  return createChunkWallDiffMessage({
    tick: message.tick,
    chunk: message.chunk,
    walls: message.walls
  });
};

const filterEntitySnapshotMessageWithMembership = (
  message: EntitySnapshotMessage,
  membership: ClientInterestMembershipSets
): EntitySnapshotMessage =>
  createEntitySnapshotMessage({
    tick: message.tick,
    entities: message.entities.filter((entity) => membership.relevantEntityIds.has(entity.id))
  });

export const filterChunkTileDiffMessageByInterestSet = (
  message: ChunkTileDiffMessage,
  interestSet: ClientInterestMessageFilterInterestSet
): ChunkTileDiffMessage | null =>
  filterChunkTileDiffMessageWithMembership(message, createClientInterestMembershipSets(interestSet));

export const filterChunkWallDiffMessageByInterestSet = (
  message: ChunkWallDiffMessage,
  interestSet: ClientInterestMessageFilterInterestSet
): ChunkWallDiffMessage | null =>
  filterChunkWallDiffMessageWithMembership(message, createClientInterestMembershipSets(interestSet));

export const filterEntitySnapshotMessageByInterestSet = (
  message: EntitySnapshotMessage,
  interestSet: ClientInterestMessageFilterInterestSet
): EntitySnapshotMessage =>
  filterEntitySnapshotMessageWithMembership(message, createClientInterestMembershipSets(interestSet));

export const filterReplicatedNetworkStateMessageByInterestSet = (
  message: InterestScopedReplicatedNetworkStateMessage,
  interestSet: ClientInterestMessageFilterInterestSet
): InterestScopedReplicatedNetworkStateMessage | null => {
  const membership = createClientInterestMembershipSets(interestSet);

  switch (message.kind) {
    case CHUNK_TILE_DIFF_MESSAGE_KIND:
      return filterChunkTileDiffMessageWithMembership(message, membership);
    case ENTITY_SNAPSHOT_MESSAGE_KIND:
      return filterEntitySnapshotMessageWithMembership(message, membership);
  }
};
