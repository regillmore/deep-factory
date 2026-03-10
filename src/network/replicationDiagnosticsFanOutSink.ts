import type { AuthoritativeClientReplicationDiagnosticsLogEmission } from './replicationDiagnosticsLogEmission';
import type { AuthoritativeClientReplicationDiagnosticsLogSinkCallback } from './replicationDiagnosticsLogSink';
import { cloneAuthoritativeClientReplicationDiagnosticsLogPayload } from './replicationDiagnosticsLogPayload';

export interface CreateAuthoritativeClientReplicationDiagnosticsFanOutSinkOptions {
  sinks: AuthoritativeClientReplicationDiagnosticsLogSinkCallback[];
}

const cloneEmissionForSink = (
  emission: AuthoritativeClientReplicationDiagnosticsLogEmission
): AuthoritativeClientReplicationDiagnosticsLogEmission => ({
  nextDueTick: emission.nextDueTick,
  payload: cloneAuthoritativeClientReplicationDiagnosticsLogPayload(emission.payload),
  logLines: [...emission.logLines],
  logText: emission.logText
});

export const createAuthoritativeClientReplicationDiagnosticsFanOutSink = ({
  sinks
}: CreateAuthoritativeClientReplicationDiagnosticsFanOutSinkOptions): AuthoritativeClientReplicationDiagnosticsLogSinkCallback => {
  return (emission) => {
    for (const sink of sinks) {
      sink(cloneEmissionForSink(emission));
    }
  };
};
