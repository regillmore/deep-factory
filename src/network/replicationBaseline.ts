import type { EntitySnapshotMessage } from './protocol';
import { AuthoritativeReplicatedNetworkStateReplayer } from './stateReplay';
import type {
  ChunkWorldStateReplayTarget,
  EntitySnapshotReplayResult
} from './stateReplay';

export type AuthoritativeWorldBaselineReplacement<T> = (world: ChunkWorldStateReplayTarget) => T;

export interface ApplyAuthoritativeReplicatedStateBaselineOptions<T> {
  replayer: AuthoritativeReplicatedNetworkStateReplayer;
  replaceWorld: AuthoritativeWorldBaselineReplacement<T>;
  entitySnapshotBaseline: EntitySnapshotMessage;
}

export interface AppliedAuthoritativeReplicatedStateBaselineResult<T> {
  worldReplacementResult: T;
  entityReplacementSummary: EntitySnapshotReplayResult;
}

export const applyAuthoritativeReplicatedStateBaseline = <T>({
  replayer,
  replaceWorld,
  entitySnapshotBaseline
}: ApplyAuthoritativeReplicatedStateBaselineOptions<T>): AppliedAuthoritativeReplicatedStateBaselineResult<T> =>
  replayer.replaceAuthoritativeBaseline((target) => {
    const worldReplacementResult = replaceWorld(target.world);
    const entityReplacementSummary = target.entities.applyEntitySnapshotMessage(
      entitySnapshotBaseline
    );

    return {
      worldReplacementResult,
      entityReplacementSummary
    };
  });
