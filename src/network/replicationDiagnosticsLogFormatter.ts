import {
  createAuthoritativeClientReplicationDiagnosticsLogPayload,
  type AuthoritativeClientReplicationDiagnosticsLogPayload
} from './replicationDiagnosticsLogPayload';
import {
  formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines,
  formatAuthoritativeClientReplicationDiagnosticsLogClientLines,
} from './replicationDiagnosticsLogLineFormatting';

export const formatAuthoritativeClientReplicationDiagnosticsLogPayload = (
  payload: AuthoritativeClientReplicationDiagnosticsLogPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload()
): string => {
  const lines = [
    'ReplicationDiagnostics',
    ...formatAuthoritativeClientReplicationDiagnosticsLogAggregateLines(payload.aggregate),
    payload.clients.length === 0 ? 'Clients: none' : 'Clients:'
  ];

  for (const client of payload.clients) {
    lines.push(...formatAuthoritativeClientReplicationDiagnosticsLogClientLines(client));
  }

  return lines.join('\n');
};
