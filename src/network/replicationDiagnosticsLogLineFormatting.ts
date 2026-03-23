import {
  createAuthoritativeClientReplicationDiagnosticsAggregate,
  type AuthoritativeClientReplicationDiagnosticsAggregate
} from './replicationDiagnosticsAggregate';
import type {
  AuthoritativeReplicationBaselineApplyLastAppliedMetadata,
  AuthoritativeReplicationBaselineApplyTotals
} from './replicationBaselineSummary';
import type { AuthoritativeReplicationBatchFilterStatusCounters } from './replicationBatchFilterSummary';
import {
  createAuthoritativeClientReplicationDiagnosticsLogPayload,
  type AuthoritativeClientReplicationDiagnosticsLogPayload
} from './replicationDiagnosticsLogPayload';
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
  replacedTiles,
  replacedWalls,
  spawned,
  updated,
  removed
}: AuthoritativeReplicationBaselineApplyTotals): string =>
  `replacedTiles=${replacedTiles} | replacedWalls=${replacedWalls} | spawned=${spawned} | updated=${updated} | removed=${removed}`;

export const formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines = (
  aggregate: AuthoritativeClientReplicationDiagnosticsAggregate = createAuthoritativeClientReplicationDiagnosticsAggregate()
): string[] => [
  `Aggregate: clients=${aggregate.clientCount}`,
  `AggregateReplayChunks: ${formatAuthoritativeClientReplicationDiagnosticsReplayCounters(aggregate.replay.chunks)}`,
  `AggregateReplayEntities: ${formatAuthoritativeClientReplicationDiagnosticsReplayCounters(aggregate.replay.entities)}`,
  `AggregateSendChunks: ${formatAuthoritativeClientReplicationDiagnosticsSendCounters(aggregate.send.chunks)}`,
  `AggregateSendEntities: ${formatAuthoritativeClientReplicationDiagnosticsSendCounters(aggregate.send.entities)}`,
  `AggregateResync: ${formatAuthoritativeClientReplicationDiagnosticsResyncCounters(aggregate.resync)}`
];

const formatAuthoritativeClientReplicationDiagnosticsLastAppliedBaselineMetadata = ({
  tick,
  entityCount,
  replacedTiles,
  replacedWalls
}: AuthoritativeReplicationBaselineApplyLastAppliedMetadata): string =>
  `tick=${tick} | entityCount=${entityCount} | replacedTiles=${replacedTiles} | replacedWalls=${replacedWalls}`;

const formatAuthoritativeClientReplicationDiagnosticsLastAppliedBaseline = (
  entry: AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry
): string =>
  entry.snapshot.resync.lastAppliedBaseline === null
    ? 'n/a'
    : formatAuthoritativeClientReplicationDiagnosticsLastAppliedBaselineMetadata(
        entry.snapshot.resync.lastAppliedBaseline
      );

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

export const formatAuthoritativeClientReplicationDiagnosticsLogLines = (
  payload: AuthoritativeClientReplicationDiagnosticsLogPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload()
): string[] => {
  const lines = [
    'ReplicationDiagnostics',
    ...formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines(payload.aggregate),
    payload.clients.length === 0 ? 'Clients: none' : 'Clients:'
  ];

  for (const client of payload.clients) {
    lines.push(...formatAuthoritativeClientReplicationDiagnosticsLogClientLines(client));
  }

  return lines;
};
