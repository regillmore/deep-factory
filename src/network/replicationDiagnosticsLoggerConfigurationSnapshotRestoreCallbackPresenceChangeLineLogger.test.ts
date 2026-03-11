import { describe, expect, it, vi } from 'vitest';

import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineFormatting';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger,
  type AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineSinkCallback
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger';

describe(
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger',
  () => {
    it('forwards detached restore-wiring lifecycle lines through the injected logger', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger(
          {
            logger
          }
        );
      const restoreCallbackPresenceChangeLines = [
        'RestoreCallbackPresenceChange: changed',
        'RestoreCallbackPresenceDiff: hasRestoreCallback'
      ];

      sink(restoreCallbackPresenceChangeLines);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(restoreCallbackPresenceChangeLines);
      expect(logger.mock.calls[0]![0]).not.toBe(restoreCallbackPresenceChangeLines);
    });

    it('reuses the restore-holder presence line formatter defaults when no explicit lifecycle lines were supplied', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger>();
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger(
          {
            logger
          }
        );

      sink();

      expect(logger).toHaveBeenCalledTimes(1);
      expect(logger).toHaveBeenCalledWith(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines()
      );
    });

    it('keeps line-logger mutations detached from the original lifecycle lines so sibling sinks still see the original array', () => {
      const logger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger>(
          (restoreCallbackPresenceChangeLines) => {
            restoreCallbackPresenceChangeLines[0] = 'mutated change line';
            restoreCallbackPresenceChangeLines.push('mutated diff line');
          }
        );
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger(
          {
            logger
          }
        );
      const siblingSink =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineSinkCallback>();
      const restoreCallbackPresenceChangeLines = [
        'RestoreCallbackPresenceChange: unchanged',
        'RestoreCallbackPresenceDiff: none'
      ];

      sink(restoreCallbackPresenceChangeLines);
      siblingSink(restoreCallbackPresenceChangeLines);

      expect(logger).toHaveBeenCalledTimes(1);
      expect(siblingSink).toHaveBeenCalledWith(restoreCallbackPresenceChangeLines);
      expect(restoreCallbackPresenceChangeLines).toEqual([
        'RestoreCallbackPresenceChange: unchanged',
        'RestoreCallbackPresenceDiff: none'
      ]);
    });
  }
);
