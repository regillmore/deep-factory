import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary';

const DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SNAPSHOT_RESTORE_CALLBACK_PRESENCE_CHANGE_SUMMARY: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary =
  {
    changed: false,
    hasRestoreCallbackChanged: false
  };

export const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLabels =
  (
    summary: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary = DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SNAPSHOT_RESTORE_CALLBACK_PRESENCE_CHANGE_SUMMARY
  ): string =>
    summary.hasRestoreCallbackChanged ? 'hasRestoreCallback' : 'none';

export const formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines =
  (
    summary: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary = DEFAULT_AUTHORITATIVE_CLIENT_REPLICATION_DIAGNOSTICS_LOGGER_CONFIGURATION_SNAPSHOT_RESTORE_CALLBACK_PRESENCE_CHANGE_SUMMARY
  ): string[] => [
    `RestoreCallbackPresenceChange: ${summary.changed ? 'changed' : 'unchanged'}`,
    `RestoreCallbackPresenceDiff: ${formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLabels(summary)}`
  ];
