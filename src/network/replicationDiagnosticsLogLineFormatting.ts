import type { AuthoritativeReplicationBaselineApplyEntityCounts } from './replicationBaselineSummary';
import type { AuthoritativeReplicationBatchFilterStatusCounters } from './replicationBatchFilterSummary';
import type { AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry } from './replicationDiagnosticsRegistrySnapshot';
import type { AuthoritativeReplicationDispatchStatusCounters } from './replicationDispatchSummary';

export const formatAuthoritativeClientReplicationDiagnosticsReplayCounters = ({
  dropped,
  trimmed,
  applied,
  skipped
}: AuthoritativeReplicationDispatchStatusCounters): string =>
  `dropped=${dropped} | trimmed=${trimmed} | applied=${applied} | skipped=${skipped}`;

export const formatAuthoritativeClientReplicationDiagnosticsSendCounters = ({
  dropped,
  trimmed,
  forwarded
}: AuthoritativeReplicationBatchFilterStatusCounters): string =>
  `dropped=${dropped} | trimmed=${trimmed} | forwarded=${forwarded}`;

export const formatAuthoritativeClientReplicationDiagnosticsResyncCounters = ({
  spawned,
  updated,
  removed
}: AuthoritativeReplicationBaselineApplyEntityCounts): string =>
  `spawned=${spawned} | updated=${updated} | removed=${removed}`;

const formatAuthoritativeClientReplicationDiagnosticsLastAppliedBaseline = (
  entry: AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry
): string =>
  entry.snapshot.resync.lastAppliedBaseline === null
    ? 'n/a'
    : `tick=${entry.snapshot.resync.lastAppliedBaseline.tick} | entityCount=${entry.snapshot.resync.lastAppliedBaseline.entityCount}`;

export const formatAuthoritativeClientReplicationDiagnosticsLogClientLines = (
  entry: AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry
): string[] => [
  `Client: ${entry.clientId}`,
  `  ReplayLastProcessed: ${entry.snapshot.replay.lastProcessed?.tick ?? 'n/a'}`,
  `  ReplayChunks: ${formatAuthoritativeClientReplicationDiagnosticsReplayCounters(entry.snapshot.replay.totals.chunks)}`,
  `  ReplayEntities: ${formatAuthoritativeClientReplicationDiagnosticsReplayCounters(entry.snapshot.replay.totals.entities)}`,
  `  SendLastStaged: ${entry.snapshot.send.lastStaged?.tick ?? 'n/a'}`,
  `  SendChunks: ${formatAuthoritativeClientReplicationDiagnosticsSendCounters(entry.snapshot.send.totals.chunks)}`,
  `  SendEntities: ${formatAuthoritativeClientReplicationDiagnosticsSendCounters(entry.snapshot.send.totals.entities)}`,
  `  ResyncLastAppliedBaseline: ${formatAuthoritativeClientReplicationDiagnosticsLastAppliedBaseline(entry)}`,
  `  ResyncTotals: ${formatAuthoritativeClientReplicationDiagnosticsResyncCounters(entry.snapshot.resync.totals)}`
];
