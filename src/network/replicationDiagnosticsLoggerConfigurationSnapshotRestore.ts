import {
  decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot
} from './replicationDiagnosticsLoggerConfigurationSnapshotDecode';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot,
  AuthoritativeClientReplicationDiagnosticsLoggerStateHolder,
  ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerStateHolderFromConfigurationSnapshotOptions
} from './replicationDiagnosticsLoggerStateHolder';

export interface RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions
  extends Omit<
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerStateHolderFromConfigurationSnapshotOptions,
    'configurationSnapshot'
  > {
  holder: AuthoritativeClientReplicationDiagnosticsLoggerStateHolder;
  unknownConfigurationSnapshot: unknown;
}

export interface RestoredAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotResult {
  configurationSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot;
}

export const restoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot =
  ({
    holder,
    registry,
    unknownConfigurationSnapshot,
    textLogger,
    lineLogger,
    payloadLogger
  }: RestoreAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions): RestoredAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotResult => {
    const configurationSnapshot =
      decodeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
        unknownConfigurationSnapshot
      );

    holder.reconfigureFromConfigurationSnapshot({
      registry,
      configurationSnapshot,
      textLogger,
      lineLogger,
      payloadLogger
    });

    return {
      configurationSnapshot: holder.getConfigurationSnapshot()
    };
  };
