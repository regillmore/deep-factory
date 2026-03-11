import { describe, expect, it } from 'vitest';

import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineFormatting';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeTextFormatting';

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText',
  () => {
    it('joins the default restore-wiring line section into deterministic multi-line text', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText()
      ).toBe(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines().join(
          '\n'
        )
      );
    });

    it('preserves the provided restore-wiring line ordering without reformatting it', () => {
      const restoreCallbackPresenceChangeLines = [
        'RestoreCallbackPresenceDiff: hasRestoreCallback',
        'RestoreCallbackPresenceChange: changed'
      ];

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText(
          {
            restoreCallbackPresenceChangeLines
          }
        )
      ).toBe(restoreCallbackPresenceChangeLines.join('\n'));
    });

    it('avoids extra separators when the detached restore-wiring lines are empty', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeText(
          {
            restoreCallbackPresenceChangeLines: []
          }
        )
      ).toBe('');
    });
  }
);
