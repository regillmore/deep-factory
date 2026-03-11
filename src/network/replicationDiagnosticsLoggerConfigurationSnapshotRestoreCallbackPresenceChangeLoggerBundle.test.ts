import { describe, expect, it, vi } from 'vitest';

import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger';
import type {
  AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger';

describe(
  'createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle',
  () => {
    it('wires configured text and line loggers through one ordered shared sink', () => {
      const callOrder: string[] = [];
      const textLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextLogger>(
          (restoreCallbackPresenceChangeText) => {
            callOrder.push(
              `text:${restoreCallbackPresenceChangeText.split('\n', 1)[0]}`
            );
          }
        );
      const lineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger>(
          (restoreCallbackPresenceChangeLines) => {
            callOrder.push(`line:${restoreCallbackPresenceChangeLines[0]}`);
          }
        );
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
          {
            textLogger,
            lineLogger
          }
        );
      const restoreCallbackPresenceChangeTextOptions = {
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: changed',
          'RestoreCallbackPresenceDiff: hasRestoreCallback'
        ]
      };

      sink(restoreCallbackPresenceChangeTextOptions);

      expect(textLogger).toHaveBeenCalledWith(
        [
          'RestoreCallbackPresenceChange: changed',
          'RestoreCallbackPresenceDiff: hasRestoreCallback'
        ].join('\n')
      );
      expect(lineLogger).toHaveBeenCalledWith(
        restoreCallbackPresenceChangeTextOptions.restoreCallbackPresenceChangeLines
      );
      expect(lineLogger.mock.calls[0]![0]).not.toBe(
        restoreCallbackPresenceChangeTextOptions.restoreCallbackPresenceChangeLines
      );
      expect(callOrder).toEqual([
        'text:RestoreCallbackPresenceChange: changed',
        'line:RestoreCallbackPresenceChange: changed'
      ]);
    });

    it('skips omitted logger adapters while keeping line mutations detached from the source restore-wiring lines', () => {
      const lineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineLogger>(
          (restoreCallbackPresenceChangeLines) => {
            restoreCallbackPresenceChangeLines[0] = 'mutated change line';
            restoreCallbackPresenceChangeLines.push('mutated diff line');
          }
        );
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
          {
            lineLogger
          }
        );
      const restoreCallbackPresenceChangeTextOptions = {
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ]
      };

      sink(restoreCallbackPresenceChangeTextOptions);

      expect(lineLogger).toHaveBeenCalledWith([
        'mutated change line',
        'RestoreCallbackPresenceDiff: none',
        'mutated diff line'
      ]);
      expect(restoreCallbackPresenceChangeTextOptions).toEqual({
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ]
      });
    });

    it('acts as a silent no-op sink when no loggers are configured', () => {
      const sink =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLoggerBundle(
          {}
        );
      const restoreCallbackPresenceChangeTextOptions = {
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ]
      };

      expect(() => sink(restoreCallbackPresenceChangeTextOptions)).not.toThrow();
      expect(restoreCallbackPresenceChangeTextOptions).toEqual({
        restoreCallbackPresenceChangeLines: [
          'RestoreCallbackPresenceChange: unchanged',
          'RestoreCallbackPresenceDiff: none'
        ]
      });
    });
  }
);
