import {
  createEntitySnapshotMessage,
  type ChunkTileDiffMessage,
  type EntitySnapshotMessage
} from './protocol';
import { AuthoritativeTileEditCapture } from './tileEditCapture';

export type AuthoritativeReplicatedStateBatchMessage =
  | ChunkTileDiffMessage
  | EntitySnapshotMessage;

export interface StageAuthoritativeReplicatedStateBatchOptions {
  tick: number;
  tileEditCapture: AuthoritativeTileEditCapture;
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
  entitySnapshotMessage
}: StageAuthoritativeReplicatedStateBatchOptions): AuthoritativeReplicatedStateBatchMessage[] => {
  const stagedEntitySnapshotMessage = cloneEntitySnapshotMessageForTick(tick, entitySnapshotMessage);
  const chunkDiffMessages = tileEditCapture.drainChunkDiffMessages(tick);

  return [...chunkDiffMessages, stagedEntitySnapshotMessage];
};
