import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot,
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder,
  ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderFromPresenceSnapshotOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';

export interface ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions
  extends Omit<
    ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolderFromPresenceSnapshotOptions,
    'presenceSnapshot'
  > {
  holder: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder;
  presenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot;
}

export interface ReconfiguredAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotResult {
  presenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot;
}

export const reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot =
  ({
    holder,
    presenceSnapshot,
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions): ReconfiguredAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotResult => {
    holder.reconfigureFromPresenceSnapshot({
      presenceSnapshot,
      textLogger,
      lineLogger,
      payloadLogger,
      restoreLifecycleTextLogger,
      restoreLifecycleLineLogger,
      restoreLifecyclePayloadLogger
    });

    return {
      presenceSnapshot: holder.getPresenceSnapshot()
    };
  };
