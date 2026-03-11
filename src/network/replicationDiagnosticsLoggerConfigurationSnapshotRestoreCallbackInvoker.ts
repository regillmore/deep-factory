import type {
  NullableAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackFactory';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvokerOptions {
  restoreCallback: NullableAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker =
  (
    unknownConfigurationSnapshot: unknown
  ) => AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission | null;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker =
  ({
    restoreCallback
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvokerOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackInvoker => {
    if (restoreCallback === null) {
      return () => null;
    }

    return (unknownConfigurationSnapshot) =>
      restoreCallback(unknownConfigurationSnapshot);
  };
