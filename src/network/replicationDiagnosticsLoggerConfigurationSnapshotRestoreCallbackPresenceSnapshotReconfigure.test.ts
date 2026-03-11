import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshotReconfigure';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot',
  () => {
    it('enables restore wiring from a detached active presence snapshot', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          lineLogger: runtimeLineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry
          }
        );

      const reconfigureResult =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: true
            },
            lineLogger: runtimeLineLogger,
            restoreLifecycleTextLogger
          }
        );

      expect(reconfigureResult).toEqual({
        presenceSnapshot: {
          hasRestoreCallback: true
        }
      });
      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });

      const emission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
      );

      expect(emission?.payload.restoredConfigurationSnapshot).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(restoreLifecycleTextLogger).toHaveBeenCalledTimes(1);

      targetHolder.poll(3);
      expect(runtimeLineLogger).not.toHaveBeenCalled();
      targetHolder.poll(4);
      expect(runtimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('disables restore wiring from a detached inactive presence snapshot and ignores extra restore-lifecycle loggers', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger: runtimeTextLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry,
            textLogger: runtimeTextLogger,
            restoreLifecycleTextLogger
          }
        );
      const initialTargetSnapshot = targetHolder.getConfigurationSnapshot();

      const reconfigureResult =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: false
            },
            textLogger: runtimeTextLogger,
            restoreLifecycleTextLogger
          }
        );

      expect(reconfigureResult).toEqual({
        presenceSnapshot: {
          hasRestoreCallback: false
        }
      });
      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: false
      });
      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
        )
      ).toBeNull();
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        initialTargetSnapshot
      );
      expect(restoreLifecycleTextLogger).not.toHaveBeenCalled();
      expect(runtimeTextLogger).not.toHaveBeenCalled();
    });

    it('refreshes active restore wiring when the detached presence snapshot stays enabled', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const firstRuntimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const secondRuntimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const firstRestoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const secondRestoreLifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>();
      const firstSourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger: firstRuntimeTextLogger
        });
      const secondSourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 7,
          nextDueTick: 9,
          lineLogger: secondRuntimeLineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry,
            textLogger: firstRuntimeTextLogger,
            restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
          }
        );

      const firstEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
      );

      expect(firstEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      targetHolder.poll(4);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);

      const reconfigureResult =
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: true
            },
            lineLogger: secondRuntimeLineLogger,
            restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
          }
        );

      expect(reconfigureResult).toEqual({
        presenceSnapshot: {
          hasRestoreCallback: true
        }
      });
      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });

      const secondEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
      );

      expect(secondEmission?.payload.restoredConfigurationSnapshot).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);

      targetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();
      targetHolder.poll(9);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('rejects detached active presence snapshots that do not supply restore-lifecycle loggers', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry
          }
        );

      expect(() =>
        reconfigureAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackPresenceSnapshot(
          {
            holder: restoreCallbackHolder,
            presenceSnapshot: {
              hasRestoreCallback: true
            },
            textLogger: runtimeTextLogger
          }
        )
      ).toThrowError(
        'restore callback presence snapshot reconfigure requires at least one restore-lifecycle replication diagnostics logger callback'
      );

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: false
      });
      expect(runtimeTextLogger).not.toHaveBeenCalled();
    });
  }
);
