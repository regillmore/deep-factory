import type {
  AuthoritativeReplicationBatchFilterStagedMetadata,
  AuthoritativeReplicationBatchFilterStatusCounters,
  AuthoritativeReplicationBatchFilterSummary
} from './replicationBatchFilterSummary';

export interface AuthoritativeClientSendDiagnosticsTotals {
  chunks: AuthoritativeReplicationBatchFilterStatusCounters;
  entities: AuthoritativeReplicationBatchFilterStatusCounters;
}

export interface AuthoritativeClientSendDiagnostics {
  lastStaged: AuthoritativeReplicationBatchFilterStagedMetadata | null;
  totals: AuthoritativeClientSendDiagnosticsTotals;
}

export interface AccumulateAuthoritativeClientSendDiagnosticsOptions {
  diagnostics?: AuthoritativeClientSendDiagnostics;
  batchFilterSummary: AuthoritativeReplicationBatchFilterSummary;
}

const createAuthoritativeReplicationBatchFilterStatusCounters =
  (): AuthoritativeReplicationBatchFilterStatusCounters => ({
    dropped: 0,
    trimmed: 0,
    forwarded: 0
  });

const createAuthoritativeClientSendDiagnosticsTotals =
  (): AuthoritativeClientSendDiagnosticsTotals => ({
    chunks: createAuthoritativeReplicationBatchFilterStatusCounters(),
    entities: createAuthoritativeReplicationBatchFilterStatusCounters()
  });

const accumulateAuthoritativeReplicationBatchFilterStatusCounters = (
  totals: AuthoritativeReplicationBatchFilterStatusCounters,
  summary: AuthoritativeReplicationBatchFilterStatusCounters
): AuthoritativeReplicationBatchFilterStatusCounters => ({
  dropped: totals.dropped + summary.dropped,
  trimmed: totals.trimmed + summary.trimmed,
  forwarded: totals.forwarded + summary.forwarded
});

const cloneAuthoritativeReplicationBatchFilterStagedMetadata = (
  staged: AuthoritativeReplicationBatchFilterStagedMetadata | null
): AuthoritativeReplicationBatchFilterStagedMetadata | null =>
  staged === null
    ? null
    : {
        tick: staged.tick
      };

export const createAuthoritativeClientSendDiagnostics =
  (): AuthoritativeClientSendDiagnostics => ({
    lastStaged: null,
    totals: createAuthoritativeClientSendDiagnosticsTotals()
  });

export const accumulateAuthoritativeClientSendDiagnostics = ({
  diagnostics,
  batchFilterSummary
}: AccumulateAuthoritativeClientSendDiagnosticsOptions): AuthoritativeClientSendDiagnostics => {
  const previousDiagnostics = diagnostics ?? createAuthoritativeClientSendDiagnostics();

  return {
    lastStaged:
      cloneAuthoritativeReplicationBatchFilterStagedMetadata(batchFilterSummary.staged) ??
      cloneAuthoritativeReplicationBatchFilterStagedMetadata(previousDiagnostics.lastStaged),
    totals: {
      chunks: accumulateAuthoritativeReplicationBatchFilterStatusCounters(
        previousDiagnostics.totals.chunks,
        batchFilterSummary.chunks
      ),
      entities: accumulateAuthoritativeReplicationBatchFilterStatusCounters(
        previousDiagnostics.totals.entities,
        batchFilterSummary.entities
      )
    }
  };
};
