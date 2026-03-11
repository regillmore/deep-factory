import { describe, expect, it, vi } from 'vitest';

import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextFormatting';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextSinkCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger';

describe(
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger',
  () => {
    it('formats provided restore-wiring lifecycle lines into deterministic joined text before forwarding them to the logger', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger(
          {
            logger
          }
        );
      const restoreCallbackPresenceChangeTextOptions = {
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: changed',
          'RestoreCallbackPresenceDiff: hasRestoreCallback'
        ]
      };

      sink(restoreCallbackPresenceChangeTextOptions);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText(
          restoreCallbackPresenceChangeTextOptions
        )
      );
    });

    it('reuses the restore-holder presence text formatter defaults when no explicit lifecycle lines were supplied', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger(
          {
            logger
          }
        );

      sink();

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText()
      );
    });

    it('leaves the provided restore-wiring lifecycle lines intact for sibling sinks after the text logger runs', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger(
          {
            logger
          }
        );
      const siblingSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextSinkCallback>();
      const restoreCallbackPresenceChangeTextOptions = {
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ]
      };

      sink(restoreCallbackPresenceChangeTextOptions);
      siblingSink(restoreCallbackPresenceChangeTextOptions);

      expect(siblingSink).toHaveBeenCalledWith(
        restoreCallbackPresenceChangeTextOptions
      );
      expect(restoreCallbackPresenceChangeTextOptions).toEqual({
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ]
      });
    });
  }
);
