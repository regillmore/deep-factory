import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot } from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

export interface ValidateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacksOptions {
  configurationSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot;
  textLogger?: AuthoritativeClientReplicationDiagnosticsTextLogger;
  lineLogger?: AuthoritativeClientReplicationDiagnosticsLineLogger;
  payloadLogger?: AuthoritativeClientReplicationDiagnosticsPayloadLogger;
}

export interface ValidatedAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks {
  textLogger?: AuthoritativeClientReplicationDiagnosticsTextLogger;
  lineLogger?: AuthoritativeClientReplicationDiagnosticsLineLogger;
  payloadLogger?: AuthoritativeClientReplicationDiagnosticsPayloadLogger;
}

export const validateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks =
  ({
    configurationSnapshot,
    textLogger,
    lineLogger,
    payloadLogger
  }: ValidateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacksOptions): ValidatedAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotCallbacks => {
    if (
      configurationSnapshot.callbacks.hasTextLogger &&
      textLogger === undefined
    ) {
      throw new Error(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );
    }

    if (
      configurationSnapshot.callbacks.hasLineLogger &&
      lineLogger === undefined
    ) {
      throw new Error(
        'configuration snapshot requires a line replication diagnostics logger callback'
      );
    }

    if (
      configurationSnapshot.callbacks.hasPayloadLogger &&
      payloadLogger === undefined
    ) {
      throw new Error(
        'configuration snapshot requires a payload replication diagnostics logger callback'
      );
    }

    return {
      textLogger:
        configurationSnapshot.callbacks.hasTextLogger ? textLogger : undefined,
      lineLogger:
        configurationSnapshot.callbacks.hasLineLogger ? lineLogger : undefined,
      payloadLogger:
        configurationSnapshot.callbacks.hasPayloadLogger
          ? payloadLogger
          : undefined
    };
  };
