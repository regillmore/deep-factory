import {
  createAuthoritativeClientReplicationDiagnosticsLogPayload,
  type AuthoritativeClientReplicationDiagnosticsLogPayload
} from './replicationDiagnosticsLogPayload';
import {
  formatAuthoritativeClientReplicationDiagnosticsLogClientLines,
  formatAuthoritativeClientReplicationDiagnosticsReplayCounters,
  formatAuthoritativeClientReplicationDiagnosticsResyncCounters,
  formatAuthoritativeClientReplicationDiagnosticsSendCounters
} from './replicationDiagnosticsLogLineFormatting';

export const formatAuthoritativeClientReplicationDiagnosticsLogPayload = (
  payload: AuthoritativeClientReplicationDiagnosticsLogPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload()
): string => {
  const lines = [
    'ReplicationDiagnostics',
    `Aggregate: clients=${payload.aggregate.clientCount}`,
    `AggregateReplayChunks: ${formatAuthoritativeClientReplicationDiagnosticsReplayCounters(payload.aggregate.replay.chunks)}`,
    `AggregateReplayEntities: ${formatAuthoritativeClientReplicationDiagnosticsReplayCounters(payload.aggregate.replay.entities)}`,
    `AggregateSendChunks: ${formatAuthoritativeClientReplicationDiagnosticsSendCounters(payload.aggregate.send.chunks)}`,
    `AggregateSendEntities: ${formatAuthoritativeClientReplicationDiagnosticsSendCounters(payload.aggregate.send.entities)}`,
    `AggregateResync: ${formatAuthoritativeClientReplicationDiagnosticsResyncCounters(payload.aggregate.resync)}`,
    payload.clients.length === 0 ? 'Clients: none' : 'Clients:'
  ];

  for (const client of payload.clients) {
    lines.push(...formatAuthoritativeClientReplicationDiagnosticsLogClientLines(client));
  }

  return lines.join('\n');
};
