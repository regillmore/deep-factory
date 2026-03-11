import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
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
  'summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange',
  () => {
    it('reports no change flags for equal detached restore-callback presence snapshots', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: createTargetHolder(registry),
            registry
          }
        );
      const previousPresenceSnapshot = restoreCallbackHolder.getPresenceSnapshot();
      const nextPresenceSnapshot = restoreCallbackHolder.getPresenceSnapshot();

      expect(previousPresenceSnapshot).not.toBe(nextPresenceSnapshot);
      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange(
          {
            previousPresenceSnapshot,
            nextPresenceSnapshot
          }
        )
      ).toEqual({
        changed: false,
        hasRestoreCallbackChanged: false
      });
    });

    it('flags detached enablement transitions into restore wiring', () => {
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

      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange(
          {
            previousPresenceSnapshot,
            nextPresenceSnapshot: restoreCallbackHolder.getPresenceSnapshot()
          }
        )
      ).toEqual({
        changed: true,
        hasRestoreCallbackChanged: true
      });
    });

    it('stays unchanged across active-to-active logger refreshes while detached presence stays enabled', () => {
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

      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange(
          {
            previousPresenceSnapshot,
            nextPresenceSnapshot: restoreCallbackHolder.getPresenceSnapshot()
          }
        )
      ).toEqual({
        changed: false,
        hasRestoreCallbackChanged: false
      });
    });

    it('flags detached disable transitions out of restore wiring', () => {
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

      restoreCallbackHolder.reconfigureFromPresenceSnapshot({
        presenceSnapshot: {
          hasRestoreCallback: false
        }
      });

      expect(
        summarizeAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceChange(
          {
            previousPresenceSnapshot,
            nextPresenceSnapshot: restoreCallbackHolder.getPresenceSnapshot()
          }
        )
      ).toEqual({
        changed: true,
        hasRestoreCallbackChanged: true
      });
    });
  }
);
