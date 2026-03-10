import type { AuthoritativeReplicationBaselineApplyEntityCounts } from './replicationBaselineSummary';
import type { AuthoritativeReplicationBatchFilterStatusCounters } from './replicationBatchFilterSummary';
import type { AuthoritativeClientReplicationDiagnosticsRegistrySnapshot } from './replicationDiagnosticsRegistrySnapshot';
import type {
  AuthoritativeReplicationDispatchStatusCounters,
  AuthoritativeReplicationDispatchSummary
} from './replicationDispatchSummary';
import type { AuthoritativeClientSendDiagnosticsTotals } from './replicationSendDiagnostics';

export interface AuthoritativeClientReplicationDiagnosticsAggregate {
  clientCount: number;
  replay: AuthoritativeReplicationDispatchSummary;
  send: AuthoritativeClientSendDiagnosticsTotals;
  resync: AuthoritativeReplicationBaselineApplyEntityCounts;
}

const createAuthoritativeReplicationDispatchStatusCounters =
  (): AuthoritativeReplicationDispatchStatusCounters => ({
    dropped: 0,
    trimmed: 0,
    applied: 0,
    skipped: 0
  });

const createAuthoritativeReplicationBatchFilterStatusCounters =
  (): AuthoritativeReplicationBatchFilterStatusCounters => ({
    dropped: 0,
    trimmed: 0,
    forwarded: 0
  });

const createAuthoritativeReplicationBaselineApplyEntityCounts =
  (): AuthoritativeReplicationBaselineApplyEntityCounts => ({
    spawned: 0,
    updated: 0,
    removed: 0
  });

export const createAuthoritativeClientReplicationDiagnosticsAggregate = (
  snapshotEntries: AuthoritativeClientReplicationDiagnosticsRegistrySnapshot = []
): AuthoritativeClientReplicationDiagnosticsAggregate => {
  const aggregate: AuthoritativeClientReplicationDiagnosticsAggregate = {
    clientCount: 0,
    replay: {
      chunks: createAuthoritativeReplicationDispatchStatusCounters(),
      entities: createAuthoritativeReplicationDispatchStatusCounters()
    },
    send: {
      chunks: createAuthoritativeReplicationBatchFilterStatusCounters(),
      entities: createAuthoritativeReplicationBatchFilterStatusCounters()
    },
    resync: createAuthoritativeReplicationBaselineApplyEntityCounts()
  };

  for (const { snapshot } of snapshotEntries) {
    aggregate.clientCount += 1;

    aggregate.replay.chunks.dropped += snapshot.replay.totals.chunks.dropped;
    aggregate.replay.chunks.trimmed += snapshot.replay.totals.chunks.trimmed;
    aggregate.replay.chunks.applied += snapshot.replay.totals.chunks.applied;
    aggregate.replay.chunks.skipped += snapshot.replay.totals.chunks.skipped;
    aggregate.replay.entities.dropped += snapshot.replay.totals.entities.dropped;
    aggregate.replay.entities.trimmed += snapshot.replay.totals.entities.trimmed;
    aggregate.replay.entities.applied += snapshot.replay.totals.entities.applied;
    aggregate.replay.entities.skipped += snapshot.replay.totals.entities.skipped;

    aggregate.send.chunks.dropped += snapshot.send.totals.chunks.dropped;
    aggregate.send.chunks.trimmed += snapshot.send.totals.chunks.trimmed;
    aggregate.send.chunks.forwarded += snapshot.send.totals.chunks.forwarded;
    aggregate.send.entities.dropped += snapshot.send.totals.entities.dropped;
    aggregate.send.entities.trimmed += snapshot.send.totals.entities.trimmed;
    aggregate.send.entities.forwarded += snapshot.send.totals.entities.forwarded;

    aggregate.resync.spawned += snapshot.resync.totals.spawned;
    aggregate.resync.updated += snapshot.resync.totals.updated;
    aggregate.resync.removed += snapshot.resync.totals.removed;
  }

  return aggregate;
};
