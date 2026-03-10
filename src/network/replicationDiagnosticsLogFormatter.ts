import {
  createAuthoritativeClientReplicationDiagnosticsLogPayload,
  type AuthoritativeClientReplicationDiagnosticsLogPayload
} from './replicationDiagnosticsLogPayload';
import type { AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry } from './replicationDiagnosticsRegistrySnapshot';

const formatReplayCounters = ({
  dropped,
  trimmed,
  applied,
  skipped
}: {
  dropped: number;
  trimmed: number;
  applied: number;
  skipped: number;
}): string =>
  `dropped=${dropped} | trimmed=${trimmed} | applied=${applied} | skipped=${skipped}`;

const formatSendCounters = ({
  dropped,
  trimmed,
  forwarded
}: {
  dropped: number;
  trimmed: number;
  forwarded: number;
}): string => `dropped=${dropped} | trimmed=${trimmed} | forwarded=${forwarded}`;

const formatResyncCounters = ({
  spawned,
  updated,
  removed
}: {
  spawned: number;
  updated: number;
  removed: number;
}): string => `spawned=${spawned} | updated=${updated} | removed=${removed}`;

const formatClientLines = ({
  clientId,
  snapshot
}: AuthoritativeClientReplicationDiagnosticsRegistrySnapshotEntry): string[] => [
  `Client: ${clientId}`,
  `  ReplayLastProcessed: ${snapshot.replay.lastProcessed?.tick ?? 'n/a'}`,
  `  ReplayChunks: ${formatReplayCounters(snapshot.replay.totals.chunks)}`,
  `  ReplayEntities: ${formatReplayCounters(snapshot.replay.totals.entities)}`,
  `  SendLastStaged: ${snapshot.send.lastStaged?.tick ?? 'n/a'}`,
  `  SendChunks: ${formatSendCounters(snapshot.send.totals.chunks)}`,
  `  SendEntities: ${formatSendCounters(snapshot.send.totals.entities)}`,
  `  ResyncLastAppliedBaseline: ${
    snapshot.resync.lastAppliedBaseline === null
      ? 'n/a'
      : `tick=${snapshot.resync.lastAppliedBaseline.tick} | entityCount=${snapshot.resync.lastAppliedBaseline.entityCount}`
  }`,
  `  ResyncTotals: ${formatResyncCounters(snapshot.resync.totals)}`
];

export const formatAuthoritativeClientReplicationDiagnosticsLogPayload = (
  payload: AuthoritativeClientReplicationDiagnosticsLogPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload()
): string => {
  const lines = [
    'ReplicationDiagnostics',
    `Aggregate: clients=${payload.aggregate.clientCount}`,
    `AggregateReplayChunks: ${formatReplayCounters(payload.aggregate.replay.chunks)}`,
    `AggregateReplayEntities: ${formatReplayCounters(payload.aggregate.replay.entities)}`,
    `AggregateSendChunks: ${formatSendCounters(payload.aggregate.send.chunks)}`,
    `AggregateSendEntities: ${formatSendCounters(payload.aggregate.send.entities)}`,
    `AggregateResync: ${formatResyncCounters(payload.aggregate.resync)}`,
    payload.clients.length === 0 ? 'Clients: none' : 'Clients:'
  ];

  for (const client of payload.clients) {
    lines.push(...formatClientLines(client));
  }

  return lines.join('\n');
};
