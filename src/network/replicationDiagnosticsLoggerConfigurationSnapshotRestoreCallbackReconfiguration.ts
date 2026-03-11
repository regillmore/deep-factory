import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull,
  type CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactoryOptions,
  type NullableAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactory';

export interface ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions
  extends CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactoryOptions {}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration {
  restoreCallback: NullableAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback;
  restoreCallbackInvoker: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker;
}

export const reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback =
  ({
    holder,
    registry,
    textLogger,
    lineLogger,
    payloadLogger,
    restoreLifecycleTextLogger,
    restoreLifecycleLineLogger,
    restoreLifecyclePayloadLogger
  }: ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackReconfiguration => {
    const restoreCallback =
      createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOrNull(
        {
          holder,
          registry,
          textLogger,
          lineLogger,
          payloadLogger,
          restoreLifecycleTextLogger,
          restoreLifecycleLineLogger,
          restoreLifecyclePayloadLogger
        }
      );

    return {
      restoreCallback,
      restoreCallbackInvoker:
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker(
          {
            restoreCallback
          }
        )
    };
  };
