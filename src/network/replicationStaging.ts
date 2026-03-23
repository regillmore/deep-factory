import {
  createEntitySnapshotMessage,
  type ChunkWallDiffMessage,
  type ChunkTileDiffMessage,
  type EntitySnapshotMessage
} from './protocol';
import { AuthoritativeTileEditCapture } from './tileEditCapture';
import { AuthoritativeWallEditCapture } from './wallEditCapture';

export type AuthoritativeReplicatedStateBatchMessage =
  | ChunkTileDiffMessage
  | ChunkWallDiffMessage
  | EntitySnapshotMessage;

export interface StageAuthoritativeReplicatedStateBatchOptions {
  tick: number;
  tileEditCapture: AuthoritativeTileEditCapture;
  wallEditCapture?: AuthoritativeWallEditCapture;
  entitySnapshotMessage: EntitySnapshotMessage;
}

const cloneEntitySnapshotMessageForTick = (
  tick: number,
  message: EntitySnapshotMessage
): EntitySnapshotMessage => {
  if (message.tick !== tick) {
    throw new Error(
      `entitySnapshotMessage.tick ${message.tick} must match staged tick ${tick}`
    );
  }

  return createEntitySnapshotMessage({
    tick: message.tick,
    entities: message.entities
  });
};

export const stageAuthoritativeReplicatedStateBatch = ({
  tick,
  tileEditCapture,
  wallEditCapture,
  entitySnapshotMessage
}: StageAuthoritativeReplicatedStateBatchOptions): AuthoritativeReplicatedStateBatchMessage[] => {
  const stagedEntitySnapshotMessage = cloneEntitySnapshotMessageForTick(tick, entitySnapshotMessage);
  const chunkTileDiffMessages = tileEditCapture.drainChunkDiffMessages(tick);
  const chunkWallDiffMessages = wallEditCapture?.drainChunkWallDiffMessages(tick) ?? [];

  return [...chunkTileDiffMessages, ...chunkWallDiffMessages, stagedEntitySnapshotMessage];
};
