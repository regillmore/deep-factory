import {
  reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot,
  type ReconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions,
  type ReconfiguredAndLoggedAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotResult
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLog';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackOptions
  extends Pick<
    ReconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions,
    'holder' | 'loggerBundle'
  > {}

export interface ReconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotCallbackOptions
  extends Omit<
    ReconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions,
    'holder' | 'loggerBundle'
  > {}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback =
  (
    reconfigureOptions: ReconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotCallbackOptions
  ) => ReconfiguredAndLoggedAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotResult;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback =
  ({
    holder,
    loggerBundle
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallbackOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigureAndLogCallback => {
    return (reconfigureOptions) =>
      reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
        {
          holder,
          loggerBundle,
          ...reconfigureOptions
        }
      );
  };
