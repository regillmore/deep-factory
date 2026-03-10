import type {
  AuthoritativeReplicationDispatchStatusCounters,
  AuthoritativeReplicationDispatchSummary
} from './replicationDispatchSummary';

export interface AuthoritativeReplicationProcessedTickMetadata {
  tick: number;
}

export interface AuthoritativeClientReplicationDiagnostics {
  lastProcessed: AuthoritativeReplicationProcessedTickMetadata | null;
  totals: AuthoritativeReplicationDispatchSummary;
}

export interface AccumulateAuthoritativeClientReplicationDiagnosticsOptions {
  diagnostics?: AuthoritativeClientReplicationDiagnostics;
  tick: number;
  dispatchSummary: AuthoritativeReplicationDispatchSummary;
}

const createAuthoritativeReplicationDispatchStatusCounters =
  (): AuthoritativeReplicationDispatchStatusCounters => ({
    dropped: 0,
    trimmed: 0,
    applied: 0,
    skipped: 0
  });

const createAuthoritativeReplicationDispatchSummary =
  (): AuthoritativeReplicationDispatchSummary => ({
    chunks: createAuthoritativeReplicationDispatchStatusCounters(),
    entities: createAuthoritativeReplicationDispatchStatusCounters()
  });

const accumulateAuthoritativeReplicationDispatchStatusCounters = (
  totals: AuthoritativeReplicationDispatchStatusCounters,
  summary: AuthoritativeReplicationDispatchStatusCounters
): AuthoritativeReplicationDispatchStatusCounters => ({
  dropped: totals.dropped + summary.dropped,
  trimmed: totals.trimmed + summary.trimmed,
  applied: totals.applied + summary.applied,
  skipped: totals.skipped + summary.skipped
});

export const createAuthoritativeClientReplicationDiagnostics =
  (): AuthoritativeClientReplicationDiagnostics => ({
    lastProcessed: null,
    totals: createAuthoritativeReplicationDispatchSummary()
  });

export const accumulateAuthoritativeClientReplicationDiagnostics = ({
  diagnostics,
  tick,
  dispatchSummary
}: AccumulateAuthoritativeClientReplicationDiagnosticsOptions): AuthoritativeClientReplicationDiagnostics => {
  const previousDiagnostics =
    diagnostics ?? createAuthoritativeClientReplicationDiagnostics();

  return {
    lastProcessed: {
      tick
    },
    totals: {
      chunks: accumulateAuthoritativeReplicationDispatchStatusCounters(
        previousDiagnostics.totals.chunks,
        dispatchSummary.chunks
      ),
      entities: accumulateAuthoritativeReplicationDispatchStatusCounters(
        previousDiagnostics.totals.entities,
        dispatchSummary.entities
      )
    }
  };
};
