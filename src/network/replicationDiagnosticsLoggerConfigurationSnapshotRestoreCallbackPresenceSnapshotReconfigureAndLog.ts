import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineFormatting';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle } from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle';
import {
  summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextFormatting';
import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot,
  type ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigure';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';

export interface ReconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions
  extends ReconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions {
  loggerBundle?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle;
}

export interface ReconfiguredAndLoggedAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotResult {
  previousPresenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot;
  nextPresenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot;
  changeSummary: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary;
  restoreCallbackPresenceChangeLines: string[];
  restoreCallbackPresenceChangeText: string;
}

const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot =
  (
    presenceSnapshot: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot => ({
    hasRestoreCallback: presenceSnapshot.hasRestoreCallback
  });

const cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary =
  (
    changeSummary: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary
  ): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary => ({
    changed: changeSummary.changed,
    hasRestoreCallbackChanged: changeSummary.hasRestoreCallbackChanged
  });

export const reconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot =
  ({
    holder,
    loggerBundle,
    ...reconfigureOptions
  }: ReconfigureAndLogAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotOptions): ReconfiguredAndLoggedAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotResult => {
    const previousPresenceSnapshot = holder.getPresenceSnapshot();
    const reconfigureResult =
      reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
        {
          holder,
          ...reconfigureOptions
        }
      );
    const changeSummary =
      summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange(
        {
          previousPresenceSnapshot,
          nextPresenceSnapshot: reconfigureResult.presenceSnapshot
        }
      );
    const restoreCallbackPresenceChangeLines =
      formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines(
        changeSummary
      );
    const result: ReconfiguredAndLoggedAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotResult =
      {
        previousPresenceSnapshot:
          cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
            previousPresenceSnapshot
          ),
        nextPresenceSnapshot:
          cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
            reconfigureResult.presenceSnapshot
          ),
        changeSummary:
          cloneAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary(
            changeSummary
          ),
        restoreCallbackPresenceChangeLines: [
          ...restoreCallbackPresenceChangeLines
        ],
        restoreCallbackPresenceChangeText:
          formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText(
            {
              restoreCallbackPresenceChangeLines
            }
          )
      };

    loggerBundle?.({
      restoreCallbackPresenceChangeLines: [
        ...result.restoreCallbackPresenceChangeLines
      ]
    });

    return result;
  };
