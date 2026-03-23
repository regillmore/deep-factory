import type {
  AuthoritativeReplicationBaselineApplyEntityCounts,
  AuthoritativeReplicationBaselineApplyLastAppliedMetadata,
  AuthoritativeReplicationBaselineApplySummary,
  AuthoritativeReplicationBaselineApplyTotals
} from './replicationBaselineSummary';

export interface AuthoritativeClientResyncDiagnostics {
  lastAppliedBaseline: AuthoritativeReplicationBaselineApplyLastAppliedMetadata | null;
  totals: AuthoritativeReplicationBaselineApplyTotals;
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

const createAuthoritativeReplicationBaselineApplyTotals =
  (): AuthoritativeReplicationBaselineApplyTotals => ({
    replacedTiles: 0,
    replacedWalls: 0,
    ...createAuthoritativeReplicationBaselineApplyEntityCounts()
  });

const accumulateAuthoritativeReplicationBaselineApplyTotals = (
  totals: AuthoritativeReplicationBaselineApplyTotals,
  summary: AuthoritativeReplicationBaselineApplySummary
): AuthoritativeReplicationBaselineApplyTotals => ({
  replacedTiles: totals.replacedTiles + summary.world.replacedTiles,
  replacedWalls: totals.replacedWalls + summary.world.replacedWalls,
  spawned: totals.spawned + summary.entities.spawned,
  updated: totals.updated + summary.entities.updated,
  removed: totals.removed + summary.entities.removed
});

export const createAuthoritativeClientResyncDiagnostics =
  (): AuthoritativeClientResyncDiagnostics => ({
    lastAppliedBaseline: null,
    totals: createAuthoritativeReplicationBaselineApplyTotals()
  });

export const accumulateAuthoritativeClientResyncDiagnostics = ({
  diagnostics,
  baselineSummary
}: AccumulateAuthoritativeClientResyncDiagnosticsOptions): AuthoritativeClientResyncDiagnostics => {
  const previousDiagnostics = diagnostics ?? createAuthoritativeClientResyncDiagnostics();
  const {
    baseline: { tick, entityCount },
    world: { replacedTiles, replacedWalls }
  } = baselineSummary;

  return {
    lastAppliedBaseline: {
      tick,
      entityCount,
      replacedTiles,
      replacedWalls
    },
    totals: accumulateAuthoritativeReplicationBaselineApplyTotals(
      previousDiagnostics.totals,
      baselineSummary
    )
  };
};
