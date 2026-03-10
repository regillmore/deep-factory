import {
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED,
  AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED,
  type AuthoritativeReplicationBatchFilterDiagnostic
} from './replicationBatchFilter';
import { CHUNK_TILE_DIFF_MESSAGE_KIND } from './protocol';

export interface AuthoritativeReplicationBatchFilterStagedMetadata {
  tick: number;
}

export interface AuthoritativeReplicationBatchFilterStatusCounters {
  dropped: number;
  trimmed: number;
  forwarded: number;
}

export interface AuthoritativeReplicationBatchFilterSummary {
  staged: AuthoritativeReplicationBatchFilterStagedMetadata | null;
  chunks: AuthoritativeReplicationBatchFilterStatusCounters;
  entities: AuthoritativeReplicationBatchFilterStatusCounters;
}

const createAuthoritativeReplicationBatchFilterStatusCounters =
  (): AuthoritativeReplicationBatchFilterStatusCounters => ({
    dropped: 0,
    trimmed: 0,
    forwarded: 0
  });

const resolveAuthoritativeReplicationBatchFilterSummaryTick = (
  tick: number | null,
  diagnostic: AuthoritativeReplicationBatchFilterDiagnostic
): number => {
  if (tick === null) {
    return diagnostic.tick;
  }

  if (diagnostic.tick !== tick) {
    throw new Error(
      `Expected one staged tick in authoritative batch-filter diagnostics but received ${diagnostic.tick} after ${tick}.`
    );
  }

  return tick;
};

export const summarizeAuthoritativeReplicationBatchFilterDiagnostics = (
  diagnostics?: Iterable<AuthoritativeReplicationBatchFilterDiagnostic>
): AuthoritativeReplicationBatchFilterSummary => {
  const summary: AuthoritativeReplicationBatchFilterSummary = {
    staged: null,
    chunks: createAuthoritativeReplicationBatchFilterStatusCounters(),
    entities: createAuthoritativeReplicationBatchFilterStatusCounters()
  };

  for (const diagnostic of diagnostics ?? []) {
    const tick = resolveAuthoritativeReplicationBatchFilterSummaryTick(
      summary.staged?.tick ?? null,
      diagnostic
    );
    summary.staged = {
      tick
    };

    const counters =
      diagnostic.kind === CHUNK_TILE_DIFF_MESSAGE_KIND ? summary.chunks : summary.entities;

    if (diagnostic.filterStatus === AUTHORITATIVE_REPLICATION_FILTER_STATUS_DROPPED) {
      counters.dropped += 1;
      continue;
    }

    counters.forwarded += 1;

    if (diagnostic.filterStatus === AUTHORITATIVE_REPLICATION_FILTER_STATUS_TRIMMED) {
      counters.trimmed += 1;
    }
  }

  return summary;
};
