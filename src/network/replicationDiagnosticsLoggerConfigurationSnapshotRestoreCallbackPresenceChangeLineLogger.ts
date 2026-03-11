import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineFormatting';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger =
  (restoreCallbackPresenceChangeLines: string[]) => void;

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineSinkCallback =
  (restoreCallbackPresenceChangeLines?: string[]) => void;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger =
  ({
    logger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLoggerOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineSinkCallback => {
    return (
      restoreCallbackPresenceChangeLines =
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines()
    ) => {
      logger([...restoreCallbackPresenceChangeLines]);
    };
  };
