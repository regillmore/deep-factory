import type {
  AuthoritativeReplicationBaselineApplyEntityCounts,
  AuthoritativeReplicationBaselineApplyMetadata,
  AuthoritativeReplicationBaselineApplySummary
} from './replicationBaselineSummary';

export interface AuthoritativeClientResyncDiagnostics {
  lastAppliedBaseline: AuthoritativeReplicationBaselineApplyMetadata | null;
  totals: AuthoritativeReplicationBaselineApplyEntityCounts;
}

export interface AccumulateAuthoritativeClientResyncDiagnosticsOptions {
  diagnostics?: AuthoritativeClientResyncDiagnostics;
  baselineSummary: AuthoritativeReplicationBaselineApplySummary;
}

const createAuthoritativeReplicationBaselineApplyEntityCounts =
  (): AuthoritativeReplicationBaselineApplyEntityCounts => ({
    spawned: 0,
    updated: 0,
    removed: 0
  });

const accumulateAuthoritativeReplicationBaselineApplyEntityCounts = (
  totals: AuthoritativeReplicationBaselineApplyEntityCounts,
  summary: AuthoritativeReplicationBaselineApplyEntityCounts
): AuthoritativeReplicationBaselineApplyEntityCounts => ({
  spawned: totals.spawned + summary.spawned,
  updated: totals.updated + summary.updated,
  removed: totals.removed + summary.removed
});

export const createAuthoritativeClientResyncDiagnostics =
  (): AuthoritativeClientResyncDiagnostics => ({
    lastAppliedBaseline: null,
    totals: createAuthoritativeReplicationBaselineApplyEntityCounts()
  });

export const accumulateAuthoritativeClientResyncDiagnostics = ({
  diagnostics,
  baselineSummary
}: AccumulateAuthoritativeClientResyncDiagnosticsOptions): AuthoritativeClientResyncDiagnostics => {
  const previousDiagnostics = diagnostics ?? createAuthoritativeClientResyncDiagnostics();

  return {
    lastAppliedBaseline: {
      tick: baselineSummary.baseline.tick,
      entityCount: baselineSummary.baseline.entityCount
    },
    totals: accumulateAuthoritativeReplicationBaselineApplyEntityCounts(
      previousDiagnostics.totals,
      baselineSummary.entities
    )
  };
};
