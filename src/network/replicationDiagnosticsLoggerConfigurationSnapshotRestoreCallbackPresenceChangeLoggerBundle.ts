import type {
  FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextOptions
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextFormatting';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextSinkCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger';

export interface CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundleOptions {
  textLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger;
  lineLogger?: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger;
}

export type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle =
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextSinkCallback;

export const createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle =
  ({
    textLogger,
    lineLogger
  }: CreateAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundleOptions): AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle => {
    const sinks: AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextSinkCallback[] =
      [];

    if (textLogger !== undefined) {
      sinks.push(
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger(
          {
            logger: textLogger
          }
        )
      );
    }

    if (lineLogger !== undefined) {
      const lineSink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger(
          {
            logger: lineLogger
          }
        );

      sinks.push(
        (
          restoreCallbackPresenceChangeTextOptions: FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextOptions = {}
        ) => {
          lineSink(
            restoreCallbackPresenceChangeTextOptions.restoreCallbackPresenceChangeLines
          );
        }
      );
    }

    return (
      restoreCallbackPresenceChangeTextOptions: FormatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextOptions = {}
    ) => {
      for (const sink of sinks) {
        sink(restoreCallbackPresenceChangeTextOptions);
      }
    };
  };
