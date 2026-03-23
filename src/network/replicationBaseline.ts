import type { EntitySnapshotMessage } from './protocol';
import { AuthoritativeReplicatedNetworkStateReplayer } from './stateReplay';
import type {
  ChunkWorldStateReplayTarget,
  EntitySnapshotReplayResult
} from './stateReplay';

export interface AuthoritativeReplicationBaselineWorldReplacementCounts {
  replacedTiles: number;
  replacedWalls: number;
}

export type AuthoritativeWorldBaselineReplacement = (
  world: ChunkWorldStateReplayTarget
) => AuthoritativeReplicationBaselineWorldReplacementCounts;

export interface ApplyAuthoritativeReplicatedStateBaselineOptions {
  replayer: AuthoritativeReplicatedNetworkStateReplayer;
  replaceWorld: AuthoritativeWorldBaselineReplacement;
  entitySnapshotBaseline: EntitySnapshotMessage;
}

export interface AppliedAuthoritativeReplicatedStateBaselineResult {
  worldReplacementCounts: AuthoritativeReplicationBaselineWorldReplacementCounts;
  entityReplacementSummary: EntitySnapshotReplayResult;
}

export const applyAuthoritativeReplicatedStateBaseline = ({
  replayer,
  replaceWorld,
  entitySnapshotBaseline
}: ApplyAuthoritativeReplicatedStateBaselineOptions): AppliedAuthoritativeReplicatedStateBaselineResult =>
  replayer.replaceAuthoritativeBaseline((target) => {
    const worldReplacementCounts = replaceWorld(target.world);
    const entityReplacementSummary = target.entities.applyEntitySnapshotMessage(
      entitySnapshotBaseline
    );

    return {
      worldReplacementCounts,
      entityReplacementSummary
    };
  });
