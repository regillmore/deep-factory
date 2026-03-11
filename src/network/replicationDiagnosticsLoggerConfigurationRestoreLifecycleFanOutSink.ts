import {
  cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines,
  cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback
} from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSinkOptions {
  sinks: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback[];
}

const cloneEmissionForSink = (
  emission: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission
): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission => ({
  payload:
    cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayload(
      emission.payload
    ),
  lifecycleLines:
    cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLines(
      emission.lifecycleLines
    ),
  lifecycleText: emission.lifecycleText
});

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSink =
  ({
    sinks
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleFanOutSinkOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleSinkCallback => {
    return (emission) => {
      for (const sink of sinks) {
        sink(cloneEmissionForSink(emission));
      }
    };
  };
