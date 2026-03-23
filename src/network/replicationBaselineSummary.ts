import type {
  AppliedAuthoritativeReplicatedStateBaselineResult,
  AuthoritativeReplicationBaselineWorldReplacementCounts
} from './replicationBaseline';

export interface AuthoritativeReplicationBaselineApplyMetadata {
  tick: number;
  entityCount: number;
}

export type AuthoritativeReplicationBaselineApplyWorldCounts =
  AuthoritativeReplicationBaselineWorldReplacementCounts;

export interface AuthoritativeReplicationBaselineApplyEntityCounts {
  spawned: number;
  updated: number;
  removed: number;
}

export interface AuthoritativeReplicationBaselineApplyTotals
  extends AuthoritativeReplicationBaselineApplyWorldCounts,
    AuthoritativeReplicationBaselineApplyEntityCounts {}

export interface AuthoritativeReplicationBaselineApplySummary {
  baseline: AuthoritativeReplicationBaselineApplyMetadata;
  world: AuthoritativeReplicationBaselineApplyWorldCounts;
  entities: AuthoritativeReplicationBaselineApplyEntityCounts;
}

export const summarizeAppliedAuthoritativeReplicatedStateBaseline = (
  result: AppliedAuthoritativeReplicatedStateBaselineResult
): AuthoritativeReplicationBaselineApplySummary => {
  const { worldReplacementCounts, entityReplacementSummary } = result;

  return {
    baseline: {
      tick: entityReplacementSummary.tick,
      entityCount: entityReplacementSummary.entityCount
    },
    world: {
      replacedTiles: worldReplacementCounts.replacedTiles,
      replacedWalls: worldReplacementCounts.replacedWalls
    },
    entities: {
      spawned: entityReplacementSummary.spawnedEntityIds.length,
      updated: entityReplacementSummary.updatedEntityIds.length,
      removed: entityReplacementSummary.removedEntityIds.length
    }
  };
};
