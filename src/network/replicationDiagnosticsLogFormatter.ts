import {
  createAuthoritativeClientReplicationDiagnosticsLogPayload,
  type AuthoritativeClientReplicationDiagnosticsLogPayload
} from './replicationDiagnosticsLogPayload';
import {
  formatAuthoritativeClientReplicationDiagnosticsLogLines
} from './replicationDiagnosticsLogLineFormatting';

export const formatAuthoritativeClientReplicationDiagnosticsLogPayload = (
  payload: AuthoritativeClientReplicationDiagnosticsLogPayload = createAuthoritativeClientReplicationDiagnosticsLogPayload()
): string => formatAuthoritativeClientReplicationDiagnosticsLogLines(payload).join('\n');
