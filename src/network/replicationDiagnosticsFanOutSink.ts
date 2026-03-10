import type { AuthoritativeClientReplicationDiagnosticsLogEmission } from './replicationDiagnosticsLogEmission';
import type { AuthoritativeClientReplicationDiagnosticsLogSinkCallback } from './replicationDiagnosticsLogSink';

export interface CreateAuthoritativeClientReplicationDiagnosticsFanOutSinkOptions {
  sinks: AuthoritativeClientReplicationDiagnosticsLogSinkCallback[];
}

const cloneEmissionForSink = (
  emission: AuthoritativeClientReplicationDiagnosticsLogEmission
): AuthoritativeClientReplicationDiagnosticsLogEmission => ({
  nextDueTick: emission.nextDueTick,
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
