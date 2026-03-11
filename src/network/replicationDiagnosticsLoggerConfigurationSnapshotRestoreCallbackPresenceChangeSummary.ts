import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';

export interface SummarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeOptions {
  previousPresenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot;
  nextPresenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot;
}

export interface AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary {
  changed: boolean;
  hasRestoreCallbackChanged: boolean;
}

export const summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange =
  ({
    previousPresenceSnapshot,
    nextPresenceSnapshot
  }: SummarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary => {
    const hasRestoreCallbackChanged =
      previousPresenceSnapshot.hasRestoreCallback !==
      nextPresenceSnapshot.hasRestoreCallback;

    return {
      changed: hasRestoreCallbackChanged,
      hasRestoreCallbackChanged
    };
  };
