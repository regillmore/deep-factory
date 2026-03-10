import type { AppliedAuthoritativeReplicatedStateBaselineResult } from './replicationBaseline';

export interface AuthoritativeReplicationBaselineApplyMetadata {
  tick: number;
  entityCount: number;
}

export interface AuthoritativeReplicationBaselineApplyEntityCounts {
  spawned: number;
  updated: number;
  removed: number;
}

export interface AuthoritativeReplicationBaselineApplySummary {
  baseline: AuthoritativeReplicationBaselineApplyMetadata;
  entities: AuthoritativeReplicationBaselineApplyEntityCounts;
}

export const summarizeAppliedAuthoritativeReplicatedStateBaseline = <T>(
  result: AppliedAuthoritativeReplicatedStateBaselineResult<T>
): AuthoritativeReplicationBaselineApplySummary => {
  const { entityReplacementSummary } = result;

  return {
    baseline: {
      tick: entityReplacementSummary.tick,
      entityCount: entityReplacementSummary.entityCount
    },
    entities: {
      spawned: entityReplacementSummary.spawnedEntityIds.length,
      updated: entityReplacementSummary.updatedEntityIds.length,
      removed: entityReplacementSummary.removedEntityIds.length
    }
  };
};
