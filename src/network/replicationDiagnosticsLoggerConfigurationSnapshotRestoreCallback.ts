import {
  restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot,
  type RestoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreAndLog';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions
  extends Omit<
    RestoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotOptions,
    'unknownConfigurationSnapshot'
  > {}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback =
  (
    unknownConfigurationSnapshot: unknown
  ) => AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleEmission;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback =
  ({
    holder,
    registry,
    textLogger,
    lineLogger,
    payloadLogger,
    loggerBundle
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallback => {
    return (unknownConfigurationSnapshot) =>
      restoreAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshot(
        {
          holder,
          registry,
          unknownConfigurationSnapshot,
          textLogger,
          lineLogger,
          payloadLogger,
          loggerBundle
        }
      );
  };
