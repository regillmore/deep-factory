import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeClientReplicationDiagnosticsRegistry } from './replicationDiagnosticsRegistry';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder
} from './replicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder';
import {
  createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder
} from './replicationDiagnosticsLoggerStateHolder';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger } from './replicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger';
import type { AuthoritativeClientReplicationDiagnosticsLineLogger } from './replicationDiagnosticsLineLogger';
import type { AuthoritativeClientReplicationDiagnosticsPayloadLogger } from './replicationDiagnosticsPayloadLogger';
import type { AuthoritativeClientReplicationDiagnosticsTextLogger } from './replicationDiagnosticsTextLogger';

const cloneAsUnknown = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe(
  'AuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder',
  () => {
    it('reports detached restore-callback presence snapshots while restore wiring is disabled', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
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

      const firstPresenceSnapshot = restoreCallbackHolder.getPresenceSnapshot();
      const secondPresenceSnapshot = restoreCallbackHolder.getPresenceSnapshot();

      expect(firstPresenceSnapshot).toEqual({
        hasRestoreCallback: false
      });
      expect(secondPresenceSnapshot).toEqual({
        hasRestoreCallback: false
      });
      expect(firstPresenceSnapshot).not.toBe(secondPresenceSnapshot);
      expect(Object.keys(firstPresenceSnapshot)).toEqual(['hasRestoreCallback']);
    });

    it('returns null through the holder-owned restore seam when no restore-lifecycle loggers are configured', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
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
      const initialSnapshot = targetHolder.getConfigurationSnapshot();

      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot({ disabled: true })
      ).toBeNull();
      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot(Number.NaN)
      ).toBeNull();
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
    });

    it('reports restore-callback presence without exposing active callback identity across reconfigure transitions', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const firstRestoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
      const secondRestoreLifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>();
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
            restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
          }
        );

      const firstActivePresenceSnapshot =
        restoreCallbackHolder.getPresenceSnapshot();

      restoreCallbackHolder.reconfigure({
        holder: targetHolder,
        registry,
        restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
      });

      const secondActivePresenceSnapshot =
        restoreCallbackHolder.getPresenceSnapshot();

      restoreCallbackHolder.reconfigure({
        holder: targetHolder,
        registry
      });

      expect(firstActivePresenceSnapshot).toEqual({
        hasRestoreCallback: true
      });
      expect(secondActivePresenceSnapshot).toEqual({
        hasRestoreCallback: true
      });
      expect(firstActivePresenceSnapshot).not.toBe(secondActivePresenceSnapshot);
      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: false
      });
    });

    it('restores one unknown snapshot through the holder-owned seam when restore wiring is configured', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const targetPayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>();
      const lifecycleCallOrder: string[] = [];
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>(
          (lifecycleText) => {
            lifecycleCallOrder.push(`text:${lifecycleText.split('\n', 1)[0]}`);
          }
        );
      const restoreLifecycleLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>(
          (lifecycleLines) => {
            lifecycleCallOrder.push(
              `line:${lifecycleLines.configurationChangeLines[0]}`
            );
          }
        );
      const restoreLifecyclePayloadLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecyclePayloadLogger>(
          (payload) => {
            lifecycleCallOrder.push(`payload:${payload.changeSummary.changed}`);
          }
        );
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 10,
          lineLogger: runtimeLineLogger
        });
      const targetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger: targetPayloadLogger
        });
      const restoreCallbackHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerConfigurationSnapshotRestoreCallbackStateHolder(
          {
            holder: targetHolder,
            registry,
            lineLogger: runtimeLineLogger,
            restoreLifecycleTextLogger,
            restoreLifecycleLineLogger,
            restoreLifecyclePayloadLogger
          }
        );

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });

      const emission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
      );

      expect(emission).not.toBeNull();
      expect(emission?.payload.restoredConfigurationSnapshot).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      expect(lifecycleCallOrder).toEqual([
        'text:ConfigurationChange: changed',
        'line:ConfigurationChange: changed',
        'payload:true'
      ]);

      targetHolder.poll(9);
      expect(runtimeLineLogger).not.toHaveBeenCalled();

      targetHolder.poll(10);
      expect(runtimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('rebuilds fresh restore callback state across holder reconfiguration while keeping the holder-owned restore seam stable', () => {
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
      const firstTargetHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 5,
          nextDueTick: 3,
          payloadLogger:
            vi.fn<AuthoritativeClientReplicationDiagnosticsPayloadLogger>()
        });
      const secondTargetHolder =
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
            holder: firstTargetHolder,
            registry,
            textLogger: firstRuntimeTextLogger,
            restoreLifecycleTextLogger: firstRestoreLifecycleTextLogger
          }
        );

      const firstEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(firstSourceHolder.getConfigurationSnapshot())
      );
      const secondTargetInitialSnapshot =
        secondTargetHolder.getConfigurationSnapshot();

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });

      restoreCallbackHolder.reconfigure({
        holder: secondTargetHolder,
        registry
      });

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: false
      });

      expect(
        restoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
        )
      ).toBeNull();
      expect(secondTargetHolder.getConfigurationSnapshot()).toEqual(
        secondTargetInitialSnapshot
      );

      restoreCallbackHolder.reconfigure({
        holder: secondTargetHolder,
        registry,
        lineLogger: secondRuntimeLineLogger,
        restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
      });

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });

      const secondEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
      );

      expect(firstEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(secondEmission?.payload.restoredConfigurationSnapshot).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstTargetHolder.getConfigurationSnapshot()).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(secondTargetHolder.getConfigurationSnapshot()).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);
      expect(
        secondRestoreLifecyclePayloadLogger.mock.calls[0]![0].changeSummary.changed
      ).toBe(true);

      firstTargetHolder.poll(4);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      secondTargetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();
      secondTargetHolder.poll(9);
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('refreshes runtime and restore-lifecycle loggers while keeping the holder-owned restore seam active', () => {
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

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });
      expect(firstEmission?.payload.restoredConfigurationSnapshot).toEqual(
        firstSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);

      targetHolder.poll(4);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      const targetSnapshotBeforeRefresh = targetHolder.getConfigurationSnapshot();

      restoreCallbackHolder.refreshLoggers({
        lineLogger: secondRuntimeLineLogger,
        restoreLifecyclePayloadLogger: secondRestoreLifecyclePayloadLogger
      });

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        targetSnapshotBeforeRefresh
      );

      const secondEmission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(secondSourceHolder.getConfigurationSnapshot())
      );

      expect(secondEmission?.payload.restoredConfigurationSnapshot).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        secondSourceHolder.getConfigurationSnapshot()
      );
      expect(firstRestoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRestoreLifecyclePayloadLogger).toHaveBeenCalledTimes(1);
      expect(
        secondRestoreLifecyclePayloadLogger.mock.calls[0]![0].changeSummary.changed
      ).toBe(true);

      targetHolder.poll(8);
      expect(secondRuntimeLineLogger).not.toHaveBeenCalled();

      targetHolder.poll(9);
      expect(firstRuntimeTextLogger).toHaveBeenCalledTimes(1);
      expect(secondRuntimeLineLogger).toHaveBeenCalledTimes(1);
    });

    it('rejects logger refresh without restore-lifecycle loggers and preserves active restore wiring', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
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

      expect(() =>
        restoreCallbackHolder.refreshLoggers({
          lineLogger: runtimeLineLogger
        })
      ).toThrowError(
        'restore callback logger refresh requires at least one restore-lifecycle replication diagnostics logger callback'
      );

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });

      const emission = restoreCallbackHolder.restoreConfigurationSnapshot(
        cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
      );

      expect(emission?.payload.restoredConfigurationSnapshot).toEqual(
        sourceHolder.getConfigurationSnapshot()
      );
      targetHolder.poll(4);
      expect(runtimeTextLogger).toHaveBeenCalledTimes(1);
      expect(runtimeLineLogger).not.toHaveBeenCalled();
      expect(restoreLifecycleTextLogger).toHaveBeenCalledTimes(1);
    });

    it('rejects logger refresh while restore wiring is disabled and preserves the holder state', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const runtimeLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLineLogger>();
      const restoreLifecycleTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleTextLogger>();
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
      const initialTargetSnapshot = targetHolder.getConfigurationSnapshot();

      expect(() =>
        restoreCallbackHolder.refreshLoggers({
          lineLogger: runtimeLineLogger,
          restoreLifecycleTextLogger
        })
      ).toThrowError(
        'cannot refresh replication diagnostics logger configuration snapshot restore callback loggers while restore callback wiring is disabled'
      );

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: false
      });
      expect(targetHolder.getConfigurationSnapshot()).toEqual(
        initialTargetSnapshot
      );
      expect(restoreLifecycleTextLogger).not.toHaveBeenCalled();
      expect(runtimeLineLogger).not.toHaveBeenCalled();
    });

    it('preserves restore validation errors when the holder-owned restore seam is active', () => {
      const registry = new AuthoritativeClientReplicationDiagnosticsRegistry();
      const sourceTextLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsTextLogger>();
      const restoreLifecycleLineLogger =
        vi.fn<AuthoritativeClientReplicationDiagnosticsLoggerConfigurationRestoreLifecycleLineLogger>();
      const sourceHolder =
        createAuthoritativeClientReplicationDiagnosticsLoggerStateHolder({
          registry,
          intervalTicks: 6,
          nextDueTick: 4,
          textLogger: sourceTextLogger
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
            restoreLifecycleLineLogger
          }
        );
      const initialSnapshot = targetHolder.getConfigurationSnapshot();

      expect(restoreCallbackHolder.getPresenceSnapshot()).toEqual({
        hasRestoreCallback: true
      });

      expect(() =>
        restoreCallbackHolder.restoreConfigurationSnapshot(
          cloneAsUnknown(sourceHolder.getConfigurationSnapshot())
        )
      ).toThrowError(
        'configuration snapshot requires a text replication diagnostics logger callback'
      );
      expect(targetHolder.getConfigurationSnapshot()).toEqual(initialSnapshot);
      expect(restoreLifecycleLineLogger).not.toHaveBeenCalled();
      expect(sourceTextLogger).not.toHaveBeenCalled();
    });
  }
);
