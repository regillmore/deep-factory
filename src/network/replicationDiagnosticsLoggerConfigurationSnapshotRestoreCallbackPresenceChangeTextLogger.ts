import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText,
  type FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextFormatting';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLoggerOptions {
  logger: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger =
  (restoreCallbackPresenceChangeText: string) => void;

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextSinkCallback =
  (
    restoreCallbackPresenceChangeTextOptions?: FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextOptions
  ) => void;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger =
  ({
    logger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLoggerOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextSinkCallback => {
    return (restoreCallbackPresenceChangeTextOptions = {}) => {
      logger(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText(
          restoreCallbackPresenceChangeTextOptions
        )
      );
    };
  };
