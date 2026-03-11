import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLabels,
  formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLineFormatting';
import {
  summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeSummary';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';

const createTargetHolder = (
  registry: AuthoritativeClientReplicationDiagnosticsRegistry
) =>
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
    registry,
    intervalTicks: 0,
    nextDueTick: -1
  });

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLabels',
  () => {
    it('renders none when detached restore-callback presence did not change', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLabels()
      ).toBe('none');
    });

    it('renders hasRestoreCallback when detached restore wiring changed', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLabels(
          {
            changed: true,
            hasRestoreCallbackChanged: true
          }
        )
      ).toBe('hasRestoreCallback');
    });
  }
);

describe(
  'formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines',
  () => {
    it('renders unchanged restore-wiring lines with explicit none placeholders by default', () => {
      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines()
      ).toEqual([
        'RestoreCallbackPresenceChange: unchanged',
        'RestoreCallbackPresenceDiff: none'
      ]);
    });

    it('renders deterministic restore-wiring diff lines from detached presence snapshots', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: createTargetHolder(registry),
            registry
          }
        );
      const previousPresenceSnapshot = restoreCallbackHolder.getPresenceSnapshot();

      restoreCallbackHolder.reconfigureFromPresenceSnapshot({
        presenceSnapshot: {
          hasRestoreCallback: true
        },
        restoreLifecycleTextLogger: vi.fn()
      });

      const summary =
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange(
          {
            previousPresenceSnapshot,
            nextPresenceSnapshot: restoreCallbackHolder.getPresenceSnapshot()
          }
        );

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines(
          summary
        )
      ).toEqual([
        'RestoreCallbackPresenceChange: changed',
        'RestoreCallbackPresenceDiff: hasRestoreCallback'
      ]);
    });

    it('keeps enabled-to-enabled logger refreshes on the unchanged restore-wiring lines', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: createTargetHolder(registry),
            registry,
            restoreLifecycleTextLogger: vi.fn()
          }
        );
      const previousPresenceSnapshot = restoreCallbackHolder.getPresenceSnapshot();

      restoreCallbackHolder.refreshLoggers({
        restoreLifecyclePayloadLogger: vi.fn()
      });

      const summary =
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange(
          {
            previousPresenceSnapshot,
            nextPresenceSnapshot: restoreCallbackHolder.getPresenceSnapshot()
          }
        );

      expect(
        formatAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChangeLines(
          summary
        )
      ).toEqual([
        'RestoreCallbackPresenceChange: unchanged',
        'RestoreCallbackPresenceDiff: none'
      ]);
    });
  }
);
